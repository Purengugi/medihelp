"""
MediHelp ML Training Script
Generates training data from the DEFICIENCIES knowledge base,
trains a TF-IDF + Naive Bayes + Decision Tree classifier,
and saves the model as deficiency_model.pkl.

Usage: python ml_train.py
       python ml_train.py --eval  (runs cross-validation evaluation)
"""
import os, sys, json, random, argparse

# ── Windows console UTF-8 fix (prevents cp1252 UnicodeEncodeError) ────────────
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
OK = '[OK]'  # safe fallback if terminal still can't display ✓
sys.path.insert(0, os.path.dirname(__file__))

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report, accuracy_score
import joblib

# ── Load existing knowledge base ──────────────────────────────────────────────
try:
    from ai_engine import DEFICIENCIES, SYNONYMS
except ImportError:
    print("ERROR: ai_engine.py not found. Make sure you run from the project directory.")
    sys.exit(1)

# ── Symptom phrase templates ──────────────────────────────────────────────────
TEMPLATES = [
    "I feel {sym}",
    "I have been experiencing {sym}",
    "I have {sym}",
    "I am suffering from {sym}",
    "I notice {sym}",
    "I keep experiencing {sym}",
    "My symptoms include {sym}",
    "I have been feeling {sym}",
    "{sym} is bothering me",
    "I have had {sym} for a while",
    "I am dealing with {sym}",
    "I feel like I have {sym}",
    "I always experience {sym}",
    "lately I have {sym}",
    "{sym} has been a problem",
    "I am struggling with {sym}",
    "I recently started experiencing {sym}",
    "I often feel {sym}",
    "I constantly have {sym}",
    "{sym} is affecting my daily life",
]

MULTI_TEMPLATES = [
    "{sym1} and {sym2}",
    "{sym1}, {sym2} and {sym3}",
    "I have {sym1} as well as {sym2}",
    "{sym1} along with {sym2}",
    "feeling {sym1} and also {sym2}",
    "{sym1} especially {sym2}",
    "mainly {sym1} but also {sym2} and {sym3}",
    "{sym1}, I also have {sym2}",
    "problems with {sym1} and {sym2}",
]

CONTEXT_PHRASES = [
    "I am a mother in Nairobi and",
    "I am a farmer in western Kenya and",
    "I have been feeling unwell,",
    "For the past few weeks,",
    "My doctor suspects",
    "I eat mainly ugali and",
    "Since giving birth,",
    "As a vegetarian,",
    "I am elderly and",
    "I am a student and",
    "",  # no context
    "",
    "",  # weight toward no context
]

SEVERITY_QUALIFIERS = [
    "very ", "quite ", "slightly ", "severely ", "mildly ", "extremely ", ""
]

def generate_samples(def_id, symptoms, n_samples=80):
    """Generate varied symptom descriptions for a given deficiency."""
    samples = []
    sym_list = symptoms[:]

    for _ in range(n_samples):
        # Pick 1–4 symptoms
        k = random.randint(1, min(4, len(sym_list)))
        chosen = random.sample(sym_list, k)

        # Apply severity qualifiers
        qualified = []
        for s in chosen:
            qual = random.choice(SEVERITY_QUALIFIERS)
            qualified.append(qual + s)

        # Choose template
        if k == 1:
            template = random.choice(TEMPLATES)
            text = template.format(sym=qualified[0])
        elif k == 2:
            template = random.choice(MULTI_TEMPLATES[:6])
            text = template.format(sym1=qualified[0], sym2=qualified[1],
                                   sym3=qualified[0])  # fallback for {sym3}
        else:
            template = random.choice(MULTI_TEMPLATES)
            try:
                text = template.format(sym1=qualified[0], sym2=qualified[1],
                                       sym3=qualified[2] if len(qualified) > 2 else qualified[0])
            except Exception:
                text = f"{qualified[0]} and {qualified[1]}"

        # Add context
        ctx = random.choice(CONTEXT_PHRASES)
        if ctx:
            text = f"{ctx} {text}".strip()

        samples.append(text)

    # Add direct/literal examples from knowledge base
    for s in sym_list:
        samples.append(s)
        samples.append(f"I have {s}")
        samples.append(f"I suffer from {s}")
        samples.append(f"my problem is {s}")

    return samples

def build_dataset():
    """Build training dataset from DEFICIENCIES knowledge base."""
    X, y = [], []
    class_counts = {}

    for def_id, defi in DEFICIENCIES.items():
        symptoms = defi.get('symptoms', [])
        if not symptoms:
            continue
        samples = generate_samples(def_id, symptoms, n_samples=100)
        X.extend(samples)
        y.extend([def_id] * len(samples))
        class_counts[def_id] = len(samples)
        print(f"  {defi['name']}: {len(samples)} samples")

    return X, y, class_counts

def preprocess_batch(texts):
    """Apply NLP preprocessing to a batch of texts."""
    try:
        from ml_engine import preprocess_text
        print("  Using spaCy preprocessing...")
        return [preprocess_text(t) for t in texts]
    except Exception:
        print("  spaCy not available - using simple preprocessing...")
        import re
        results = []
        try:
            from ai_engine import SYNONYMS
        except Exception:
            SYNONYMS = {}
        for text in texts:
            t = text.lower()
            for phrase, replacement in sorted(SYNONYMS.items(), key=lambda x: -len(x[0])):
                t = t.replace(phrase.lower(), replacement.lower())
            tokens = re.findall(r'\b[a-z]{3,}\b', t)
            stop_words = {'the','and','for','are','but','not','you','all','can',
                          'has','his','how','its','who','did','too','old','few',
                          'than','with','also','have','this','that','they','from'}
            tokens = [tok for tok in tokens if tok not in stop_words]
            results.append(' '.join(tokens))
        return results

def train(eval_mode=False):
    print("\n== MediHelp ML Training ==\n")

    # Build dataset
    print("1. Generating training data...")
    random.seed(42)
    np.random.seed(42)
    X, y, class_counts = build_dataset()
    print(f"\n   Total samples: {len(X)} across {len(set(y))} classes\n")

    # Preprocess
    print("2. Preprocessing with NLP pipeline...")
    X_clean = preprocess_batch(X)

    # Build pipeline: TF-IDF → Multinomial Naive Bayes
    print("3. Building ML pipeline (TF-IDF + Naive Bayes)...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),        # unigrams and bigrams
            max_features=5000,
            sublinear_tf=True,         # apply sublinear TF scaling
            min_df=2,
        )),
        ('classifier', MultinomialNB(alpha=0.3)),  # Laplace smoothing
    ])

    # Optional: cross-validation evaluation
    if eval_mode:
        print("4. Running 5-fold cross-validation evaluation...")
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        scores = cross_val_score(pipeline, X_clean, y, cv=cv, scoring='accuracy')
        print(f"   CV Accuracy: {scores.mean()*100:.1f}% ± {scores.std()*100:.1f}%")
        print(f"   Scores per fold: {[f'{s*100:.1f}%' for s in scores]}\n")

    # Train on full dataset
    print(f"{'5' if eval_mode else '4'}. Training on full dataset...")
    pipeline.fit(X_clean, y)

    # Classification report on training data (sanity check)
    y_pred = pipeline.predict(X_clean)
    acc = accuracy_score(y, y_pred)
    print(f"\n   Training accuracy: {acc*100:.1f}%")
    print("\n   Per-class performance:")
    classes = sorted(set(y))
    for cls in classes:
        cls_mask = [yi == cls for yi in y]
        cls_X = [X_clean[i] for i in range(len(X_clean)) if cls_mask[i]]
        cls_y = [y[i] for i in range(len(y)) if cls_mask[i]]
        cls_pred = pipeline.predict(cls_X)
        cls_acc = accuracy_score(cls_y, cls_pred)
        name = DEFICIENCIES.get(cls, {}).get('name', cls)
        print(f"     {name[:30]:<30}: {cls_acc*100:.0f}%  ({len(cls_X)} samples)")

    # Save model
    model_path = os.path.join(os.path.dirname(__file__), 'deficiency_model.pkl')
    joblib.dump(pipeline, model_path)
    print(f"\n{'5' if not eval_mode else '6'}. [OK] Model saved to {model_path}")

    # Also save as pipeline for inspection
    pipeline_info = {
        'classes': list(pipeline.classes_),
        'vocabulary_size': len(pipeline.named_steps['tfidf'].vocabulary_),
        'training_samples': len(X),
        'algorithm': 'TF-IDF (ngram 1-2) + Multinomial Naive Bayes',
        'accuracy': round(acc * 100, 1),
    }
    info_path = model_path.replace('.pkl', '_info.json')
    with open(info_path, 'w') as f:
        json.dump(pipeline_info, f, indent=2)
    print(f"   [OK] Model info saved to {info_path}")

    print("\n== Training complete! ==")
    print(f"   Classes: {', '.join(pipeline.classes_)}")
    print(f"   Vocab:   {len(pipeline.named_steps['tfidf'].vocabulary_)} features")
    print(f"   Accuracy: {acc*100:.1f}%")
    print("\nTo use the model, restart the Flask server - it will auto-load.\n")
    return pipeline

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train MediHelp ML model')
    parser.add_argument('--eval', action='store_true', help='Run cross-validation evaluation')
    args = parser.parse_args()
    train(eval_mode=args.eval)