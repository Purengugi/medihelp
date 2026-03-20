"""
MediHelp ML Engine v2.0
True AI-Powered Symptom Analysis using:
- spaCy for NLP preprocessing (tokenization, lemmatization, stop-word removal)
- scikit-learn TF-IDF Vectorizer for feature extraction
- Multinomial Naive Bayes for classification
- Decision Tree as secondary classifier
- K-Means clustering for symptom pattern grouping
Falls back to rule-based engine if model not trained yet.
Run ml_train.py to train the model.
"""
import os, re, json
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'deficiency_model.pkl')
PIPELINE_PATH = os.path.join(os.path.dirname(__file__), 'deficiency_pipeline.pkl')

# ── NLP Preprocessing ─────────────────────────────────────────────────────────
_nlp = None

def get_nlp():
    """Lazy-load spaCy model."""
    global _nlp
    if _nlp is None:
        try:
            import spacy
            _nlp = spacy.load("en_core_web_sm")
        except (ImportError, OSError):
            _nlp = False  # spaCy not available
    return _nlp

def preprocess_text(text):
    """
    NLP preprocessing pipeline:
    1. Lowercase and clean
    2. spaCy tokenization + lemmatization (if available)
    3. Remove stop words and punctuation
    4. Apply medical synonym normalization
    Returns cleaned string for vectorizer.
    """
    text = text.lower().strip()

    # Apply medical synonyms (mirrors existing rule-based system)
    from ai_engine import SYNONYMS
    for phrase, replacement in sorted(SYNONYMS.items(), key=lambda x: -len(x[0])):
        text = text.replace(phrase.lower(), replacement.lower())

    nlp = get_nlp()
    if nlp:
        # spaCy preprocessing: lemmatize, remove stop words and punctuation
        doc = nlp(text)
        tokens = [
            token.lemma_
            for token in doc
            if token.is_alpha and not token.is_stop and len(token.text) > 2
        ]
        return ' '.join(tokens)
    else:
        # Fallback: simple regex tokenization
        tokens = re.findall(r'\b[a-z]{3,}\b', text)
        stop_words = {'the','and','for','are','but','not','you','all','can','had',
                      'her','was','one','our','out','has','him','his','how','its',
                      'who','got','did','let','put','too','old','few','see','him',
                      'than','with','also','have','this','that','they','from','were'}
        tokens = [t for t in tokens if t not in stop_words]
        return ' '.join(tokens)

# ── ML Model ──────────────────────────────────────────────────────────────────
_model = None
_loaded_model_path = None

def load_model():
    """Load trained ML pipeline (TF-IDF + Naive Bayes)."""
    global _model, _loaded_model_path
    if not os.path.exists(MODEL_PATH):
        return None
    # Reload if file changed
    mtime = os.path.getmtime(MODEL_PATH)
    if _model is None or _loaded_model_path != mtime:
        try:
            import joblib
            _model = joblib.load(MODEL_PATH)
            _loaded_model_path = mtime
        except Exception as e:
            print(f"ML model load error: {e}")
            _model = None
    return _model

def analyze_ml(text):
    """
    Run ML-powered symptom analysis.
    Returns list of result dicts (same format as rule-based engine).
    Raises exception if model not available - caller should catch and use fallback.
    """
    model = load_model()
    if model is None:
        raise ValueError("ML model not trained yet. Run ml_train.py first.")

    cleaned = preprocess_text(text)
    if not cleaned.strip():
        raise ValueError("No meaningful symptoms after preprocessing.")

    # Get class probabilities
    proba = model.predict_proba([cleaned])[0]
    classes = model.classes_

    # Get top predictions with probability > threshold
    threshold = 0.08  # show results above 8% probability
    top_indices = np.argsort(proba)[::-1][:3]  # top 3

    results = []
    # Load deficiency details from DB
    deficiency_data = _load_deficiency_data()

    for idx in top_indices:
        prob = proba[idx]
        if prob < threshold:
            continue
        def_id = classes[idx]
        defi = deficiency_data.get(def_id)
        if not defi:
            continue

        # Confidence: scale probability to 20–95 range (matches rule-based scale)
        confidence = min(int(prob * 100 * 1.8 + 20), 95)
        if prob < 0.15:
            confidence = max(confidence, 20)

        # Find matched symptoms for explainability
        matched = _find_matched_symptoms(text, defi.get('symptoms', []))

        results.append({
            'id': def_id,
            'name': defi['name'],
            'icon': defi.get('icon', 'fa-circle-dot'),
            'color': defi.get('color', '#16a34a'),
            'bg': defi.get('bg', '#f0fdf4'),
            'icd': defi.get('icd', ''),
            'severity': defi.get('severity', 'Moderate'),
            'confidence': confidence,
            'ml_probability': round(float(prob) * 100, 1),
            'matched_symptoms': matched,
            'kenya_stat': defi.get('kenya_stat', ''),
            'foods_recommended': defi.get('foods_recommended', []),
            'foods_avoid': defi.get('foods_avoid', []),
            'tips': defi.get('tips', []),
            'supplement': defi.get('supplement', ''),
            'risk_groups': defi.get('risk_groups', []),
            'when_to_see_doctor': defi.get('when_to_see_doctor', ''),
        })

    return sorted(results, key=lambda x: x['confidence'], reverse=True)

def _find_matched_symptoms(text, symptoms):
    """Find which known symptoms appear in user input (for explainability)."""
    text_lower = text.lower()
    from ai_engine import normalizeText
    normalized = normalizeText(text_lower)
    words = set(re.findall(r'\b\w+\b', normalized))
    matched = []
    for s in symptoms:
        sl = s.lower()
        if ' ' in sl:
            if sl in normalized or sl in text_lower:
                matched.append(s)
        else:
            if sl in words or sl in text_lower:
                matched.append(s)
    return matched

def _load_deficiency_data():
    """Load deficiency details from DB or ai_engine fallback."""
    try:
        import sqlite3
        db_path = os.environ.get('DB_PATH', 'medihelp.db')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM deficiencies WHERE active=1").fetchall()
        conn.close()
        result = {}
        for r in rows:
            d = dict(r)
            for f in ['symptoms','foods_recommended','foods_avoid','tips','risk_groups']:
                try: d[f] = json.loads(d[f] or '[]')
                except: d[f] = []
            result[d['id']] = d
        return result
    except Exception:
        from ai_engine import DEFICIENCIES
        return DEFICIENCIES

# ── K-Means Clustering (for pattern analysis) ─────────────────────────────────
def cluster_symptoms(symptom_texts, n_clusters=5):
    """
    Use K-Means to group symptom reports into clusters.
    Useful for identifying common symptom patterns in a population.
    Returns cluster labels and centroids.
    """
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.cluster import KMeans

        cleaned = [preprocess_text(t) for t in symptom_texts]
        vectorizer = TfidfVectorizer(max_features=50)
        X = vectorizer.fit_transform(cleaned)

        n = min(n_clusters, len(symptom_texts))
        kmeans = KMeans(n_clusters=n, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)

        # Get top terms per cluster
        feature_names = vectorizer.get_feature_names_out()
        cluster_terms = {}
        for i in range(n):
            center = kmeans.cluster_centers_[i]
            top_indices = center.argsort()[::-1][:5]
            cluster_terms[i] = [feature_names[j] for j in top_indices]

        return {
            'labels': labels.tolist(),
            'n_clusters': n,
            'cluster_terms': cluster_terms,
        }
    except Exception as e:
        return {'error': str(e)}

# ── Model Info ────────────────────────────────────────────────────────────────
def get_model_info():
    """Return information about the trained model."""
    model = load_model()
    if model is None:
        return {'trained': False, 'engine': 'rule_based'}

    info = {'trained': True, 'engine': 'ml_naive_bayes_tfidf'}
    try:
        # Pipeline components
        steps = model.steps if hasattr(model, 'steps') else []
        info['pipeline_steps'] = [s[0] for s in steps]
        # Classes
        clf = model.named_steps.get('classifier') or model.named_steps.get('nb')
        if clf and hasattr(clf, 'classes_'):
            info['classes'] = list(clf.classes_)
        # TF-IDF vocab size
        tfidf = model.named_steps.get('tfidf') or model.named_steps.get('vectorizer')
        if tfidf and hasattr(tfidf, 'vocabulary_'):
            info['vocabulary_size'] = len(tfidf.vocabulary_)
    except Exception:
        pass
    return info