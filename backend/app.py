"""
MediHelp AI Health Assistant - Enhanced Backend v2.0
Kenya-focused Nutritional Deficiency Analysis System
Flask + SQLite + JWT + ML + Appointments + Medications + Blockchain Audit
"""
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import sqlite3, os, json, math, hashlib, csv, io

# Load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
CORS(app, origins="*")

app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET', 'medihelp-secret-key-2026')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=12)
jwt = JWTManager(app)

# Allow JWT token to be passed as query param ?token=... (used for PDF export in new tab)
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'query_string']
app.config['JWT_QUERY_STRING_NAME'] = 'token'
DB_PATH = os.environ.get('DB_PATH', 'medihelp.db')

# Optional: Rate limiting (install flask-limiter)
try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address, app=app,
                      default_limits=["200 per hour"])
except ImportError:
    limiter = None

# Optional: Email notifications (install flask-mail)
mail = None
try:
    from flask_mail import Mail, Message as MailMessage
    app.config['MAIL_SERVER']   = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT']     = int(os.environ.get('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS']  = True
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')
    if os.environ.get('MAIL_USERNAME'):
        mail = Mail(app)
except ImportError:
    pass

# ── DB helpers ────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat/2)**2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon/2)**2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def make_token(user):
    return create_access_token(
        identity=str(user['id']),
        additional_claims={'role': user['role'], 'name': user['name'], 'email': user['email']}
    )

def current_user_id():
    return int(get_jwt_identity())

def current_role():
    return get_jwt().get('role', 'USER')

def is_admin():
    return current_role() == 'ADMIN'

def is_healthcare_pro():
    return current_role() in ('ADMIN', 'HEALTHCARE_PRO')

def log_audit(action, details='', user_id=None):
    """Write an audit log entry."""
    try:
        conn = get_db()
        conn.execute(
            "INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?,?,?,?)",
            (user_id, action, details, datetime.utcnow().isoformat())
        )
        conn.commit()
        conn.close()
    except Exception:
        pass

def compute_hash(data_str, prev_hash):
    """SHA-256 blockchain-style hash."""
    content = f"{data_str}{prev_hash}".encode('utf-8')
    return hashlib.sha256(content).hexdigest()

def add_blockchain_record(conn, record_type, record_id, data_str):
    """Append a record to the blockchain audit chain."""
    last = conn.execute(
        "SELECT record_hash FROM blockchain_audit WHERE record_type=? ORDER BY id DESC LIMIT 1",
        (record_type,)
    ).fetchone()
    prev = last['record_hash'] if last else '0' * 64
    current = compute_hash(data_str, prev)
    conn.execute(
        "INSERT INTO blockchain_audit (record_type, record_id, record_hash, previous_hash, timestamp) "
        "VALUES (?,?,?,?,?)",
        (record_type, record_id, current, prev, datetime.utcnow().isoformat())
    )

# ── Email helper ──────────────────────────────────────────────────────────────
def send_email(to, subject, body):
    if not mail or not to:
        return False
    try:
        msg = MailMessage(subject,
                          sender=os.environ.get('MAIL_USERNAME'),
                          recipients=[to])
        msg.body = body
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

# ── DB Init ────────────────────────────────────────────────────────────────────
def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'USER',
            age INTEGER,
            blood_group TEXT,
            allergies TEXT,
            chronic_conditions TEXT,
            emergency_contact TEXT,
            emergency_phone TEXT,
            language TEXT DEFAULT 'en',
            dark_mode INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            symptoms TEXT NOT NULL,
            results TEXT,
            engine_used TEXT DEFAULT 'rule_based',
            feedback_score INTEGER,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS hospitals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT,
            latitude REAL,
            longitude REAL,
            phone TEXT,
            type TEXT DEFAULT 'government',
            services TEXT DEFAULT '[]',
            emergency INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS deficiencies (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT DEFAULT 'fa-circle-dot',
            color TEXT DEFAULT '#16a34a',
            bg TEXT DEFAULT '#f0fdf4',
            icd TEXT,
            severity TEXT DEFAULT 'Moderate',
            kenya_stat TEXT,
            symptoms TEXT DEFAULT '[]',
            foods_recommended TEXT DEFAULT '[]',
            foods_avoid TEXT DEFAULT '[]',
            tips TEXT DEFAULT '[]',
            supplement TEXT,
            risk_groups TEXT DEFAULT '[]',
            when_to_see_doctor TEXT,
            active INTEGER DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            doctor_name TEXT NOT NULL,
            hospital_name TEXT,
            appointment_date TEXT NOT NULL,
            appointment_time TEXT NOT NULL,
            status TEXT DEFAULT 'scheduled',
            notes TEXT,
            reminder_sent INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS medications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            drug_name TEXT NOT NULL,
            dosage TEXT,
            frequency TEXT,
            start_date TEXT,
            end_date TEXT,
            notes TEXT,
            active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS drug_interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            drug1 TEXT NOT NULL,
            drug2 TEXT NOT NULL,
            severity TEXT DEFAULT 'moderate',
            description TEXT,
            source TEXT DEFAULT 'MediHelp KB'
        );
        CREATE TABLE IF NOT EXISTS blockchain_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_type TEXT NOT NULL,
            record_id INTEGER,
            record_hash TEXT NOT NULL,
            previous_hash TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            analysis_id INTEGER,
            predicted_id TEXT,
            corrected_id TEXT,
            helpful INTEGER DEFAULT 0,
            comment TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            details TEXT,
            ip_address TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Seed admin
    if not conn.execute("SELECT id FROM users WHERE email='admin@medihelp.ke'").fetchone():
        conn.execute("INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)",
            ('Admin','admin@medihelp.ke', generate_password_hash('admin123'), 'ADMIN'))

    # Seed hospitals
    if conn.execute("SELECT COUNT(*) FROM hospitals").fetchone()[0] == 0:
        hospitals = [
            ('Kenyatta National Hospital','Hospital Rd, Upper Hill, Nairobi',-1.3048,36.8156,'+254 20 272 6300','government','["Emergency","Surgery","ICU","Maternity","Oncology"]',1),
            ('Nairobi Hospital','Argwings Kodhek Rd, Nairobi',-1.2921,36.8219,'+254 20 284 6000','private','["Cardiology","Oncology","ICU","Emergency","Neurology"]',1),
            ('Aga Khan University Hospital','3rd Parklands Ave, Nairobi',-1.2649,36.8225,'+254 20 366 2000','private','["General Medicine","Pediatrics","Cancer Centre","OB/GYN"]',1),
            ('MP Shah Hospital','Shivachi Rd, Parklands, Nairobi',-1.2670,36.8260,'+254 20 429 4000','private','["Cardiology","Emergency","Radiology","Renal"]',1),
            ('Moi Teaching & Referral Hospital','Nandi Rd, Eldoret',0.5143,35.2698,'+254 53 203 3471','government','["ICU","Trauma","Surgery","Burns","Cancer"]',1),
            ('Coast General Teaching Hospital','Kisauni Rd, Mombasa',-4.0435,39.6682,'+254 41 231 3578','government','["Maternity","Pediatrics","Casualty","Dental"]',1),
            ('Kakamega County General Hospital','Hospital Rd, Kakamega',0.2827,34.7519,'+254 56 203 1555','government','["General Medicine","Maternity","Pediatrics","Surgery"]',1),
            ('Kisumu County Referral Hospital','Kisumu',-0.0917,34.7680,'+254 57 202 2471','government','["Emergency","Maternity","Pediatrics","Surgery"]',1),
            ('Nakuru Level 5 Hospital','Nakuru Town',-0.3031,36.0800,'+254 51 221 0994','government','["General Medicine","ICU","Maternity","Surgery"]',1),
            ('Thika Level 5 Hospital','Thika',-1.0332,37.0693,'+254 67 222 2266','government','["Emergency","Surgery","Maternity","Pediatrics"]',1),
        ]
        conn.executemany(
            "INSERT INTO hospitals (name,address,latitude,longitude,phone,type,services,emergency) VALUES (?,?,?,?,?,?,?,?)",
            hospitals)

    # Seed drug interactions knowledge base
    if conn.execute("SELECT COUNT(*) FROM drug_interactions").fetchone()[0] == 0:
        interactions = [
            ('warfarin','aspirin','severe','Increased bleeding risk — avoid combination without medical supervision','Clinical KB'),
            ('warfarin','ibuprofen','severe','NSAIDs significantly increase anticoagulant effect and GI bleeding','Clinical KB'),
            ('metformin','alcohol','moderate','Increases risk of lactic acidosis and hypoglycaemia','Clinical KB'),
            ('iron supplement','calcium','moderate','Calcium inhibits iron absorption — take 2 hours apart','Nutrition KB'),
            ('iron supplement','antacids','moderate','Antacids reduce iron absorption — take on empty stomach or 2h apart','Nutrition KB'),
            ('iron supplement','tetracycline','moderate','Tetracycline binds iron, reducing absorption of both — space by 2–3h','Clinical KB'),
            ('vitamin a','retinol','severe','Excess Vitamin A is toxic (teratogenic in pregnancy) — do not double-supplement','Nutrition KB'),
            ('vitamin d','thiazide diuretics','moderate','May cause hypercalcaemia — monitor calcium levels','Clinical KB'),
            ('vitamin k','warfarin','severe','Vitamin K directly antagonises anticoagulation — avoid high-dose K','Clinical KB'),
            ('folate','methotrexate','severe','Methotrexate is a folate antagonist — folate supplements may reduce toxicity but also efficacy','Clinical KB'),
            ('aspirin','ibuprofen','moderate','Concurrent use reduces cardioprotective effect of aspirin','Clinical KB'),
            ('ciprofloxacin','antacids','moderate','Antacids reduce ciprofloxacin absorption — take 2h apart','Clinical KB'),
            ('paracetamol','alcohol','moderate','Chronic alcohol use increases risk of paracetamol hepatotoxicity','Clinical KB'),
            ('zinc','copper','moderate','High-dose zinc depletes copper — consider a multi-mineral supplement','Nutrition KB'),
            ('zinc','iron supplement','mild','High-dose zinc and iron compete for absorption — space doses','Nutrition KB'),
            ('calcium','magnesium','mild','High calcium can interfere with magnesium absorption — balance doses','Nutrition KB'),
            ('vitamin c','iron supplement','beneficial','Vitamin C significantly enhances non-haem iron absorption','Nutrition KB'),
            ('vitamin b12','metformin','moderate','Metformin reduces B12 absorption over time — monitor B12 levels','Clinical KB'),
            ('folic acid','phenytoin','moderate','Phenytoin may reduce folate levels; high folate may reduce phenytoin efficacy','Clinical KB'),
            ('omeprazole','clopidogrel','moderate','Omeprazole reduces antiplatelet effect of clopidogrel','Clinical KB'),
        ]
        conn.executemany(
            "INSERT INTO drug_interactions (drug1,drug2,severity,description,source) VALUES (?,?,?,?,?)",
            interactions)

    # Seed deficiencies from ai_engine
    if conn.execute("SELECT COUNT(*) FROM deficiencies").fetchone()[0] == 0:
        try:
            from ai_engine import DEFICIENCIES
            for d in DEFICIENCIES.values():
                conn.execute("""
                    INSERT OR IGNORE INTO deficiencies
                    (id,name,icon,color,bg,icd,severity,kenya_stat,symptoms,foods_recommended,foods_avoid,tips,supplement,risk_groups,when_to_see_doctor,active)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
                """, (
                    d['id'], d['name'],
                    {'iron':'fa-droplet','vitamin_a':'fa-eye','vitamin_d':'fa-sun',
                     'vitamin_b12':'fa-brain','folate':'fa-seedling','iodine':'fa-shield-halved',
                     'zinc':'fa-shield','calcium':'fa-bone','vitamin_c':'fa-lemon','protein':'fa-dumbbell'
                    }.get(d['id'], 'fa-circle-dot'),
                    d['color'], d['bg'], d.get('icd',''), d.get('severity','Moderate'),
                    d.get('kenya_stat',''),
                    json.dumps(d['symptoms']),
                    json.dumps(d['foods_recommended']),
                    json.dumps(d['foods_avoid']),
                    json.dumps(d['tips']),
                    d.get('supplement',''),
                    json.dumps(d.get('risk_groups',[])),
                    d.get('when_to_see_doctor',''),
                ))
        except Exception as e:
            print(f"Warning: could not seed deficiencies from ai_engine: {e}")

    conn.commit()
    conn.close()

# ── Auth ───────────────────────────────────────────────────────────────────────
@app.route('/api/register', methods=['POST'])
def register():
    d = request.get_json()
    if not d or not all(d.get(k) for k in ['email','password','name']):
        return jsonify({'error': 'Name, email and password are required'}), 400
    if len(d['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    try:
        conn = get_db()
        conn.execute(
            "INSERT INTO users (name,email,password_hash,age,blood_group,allergies,chronic_conditions) VALUES (?,?,?,?,?,?,?)",
            (d['name'].strip(), d['email'].lower().strip(), generate_password_hash(d['password']),
             d.get('age'), d.get('bloodGroup',''), d.get('allergies',''), d.get('chronicConditions','')))
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE email=?", (d['email'].lower(),)).fetchone()
        conn.close()
        log_audit('register', f"New user: {d['email']}")
        token = make_token(user)
        return jsonify({'token': token, 'user': {k:user[k] for k in user.keys() if k!='password_hash'}}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already registered'}), 400

@app.route('/api/login', methods=['POST'])
def login():
    d = request.get_json()
    if not d or not d.get('email') or not d.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email=?", (d['email'].lower().strip(),)).fetchone()
    conn.close()
    if not user or not check_password_hash(user['password_hash'], d['password']):
        log_audit('login_failed', f"Failed login: {d.get('email')}")
        return jsonify({'error': 'Invalid email or password'}), 401
    log_audit('login', f"User logged in: {user['email']}", user['id'])
    token = make_token(user)
    return jsonify({'token': token, 'user': {k:user[k] for k in user.keys() if k!='password_hash'}}), 200

# ── Analysis ───────────────────────────────────────────────────────────────────
@app.route('/api/analyze', methods=['POST'])
@jwt_required()
def analyze():
    d = request.get_json()
    text    = (d or {}).get('symptoms','').strip()
    lang    = (d or {}).get('lang', 'en')     # 'en' or 'sw'
    if not text:
        return jsonify({'error': 'Symptoms are required'}), 400
    uid = current_user_id()
    engine_used = 'rule_based'

    # Fetch user profile for allergy / chronic condition awareness
    conn = get_db()
    urow = conn.execute(
        "SELECT allergies, chronic_conditions FROM users WHERE id=?", (uid,)).fetchone()
    conn.close()
    user_allergies  = [a.strip().lower() for a in (urow['allergies']  or '').split(',') if a.strip()] if urow else []
    user_conditions = [c.strip().lower() for c in (urow['chronic_conditions'] or '').split(',') if c.strip()] if urow else []

    # Try ML engine first
    try:
        from ml_engine import analyze_ml
        results, engine_used = analyze_ml(text), 'ml_naive_bayes'
        if not results:
            raise ValueError("ML returned empty")
    except Exception:
        results = analyze_with_db(text)
        engine_used = 'rule_based'

    # ── Allergy & condition awareness ────────────────────────────────────────
    # Supplement / condition interaction hints (key-word based)
    CONDITION_HINTS = {
        'diabetes':      {'supplement_keywords': ['sugar','glucose'],
                          'hint': 'Caution: you have diabetes — watch sugary foods and discuss supplements with your doctor first.'},
        'hypertension':  {'supplement_keywords': ['sodium','salt'],
                          'hint': 'Caution: you have hypertension — avoid high-sodium foods; consult a doctor before iron or B12 supplements.'},
        'kidney':        {'supplement_keywords': ['potassium','phosphorus'],
                          'hint': 'Caution: kidney disease — many supplements need medical clearance. Do not self-supplement.'},
        'pregnancy':     {'supplement_keywords': ['vitamin a','retinol'],
                          'hint': 'Caution: high-dose Vitamin A is harmful in pregnancy. Only take pregnancy-safe supplements.'},
        'thyroid':       {'supplement_keywords': ['iodine'],
                          'hint': 'Caution: thyroid condition — extra iodine should only be taken on medical advice.'},
    }

    for res in results:
        warnings = []
        foods_ok = []
        foods_flagged = []

        # Check foods_recommended against allergies
        for food in res.get('foods_recommended', []):
            food_lower = food.lower()
            flagged = False
            for allergen in user_allergies:
                if allergen and (allergen in food_lower or
                                  any(w.startswith(allergen[:4]) for w in food_lower.split() if len(allergen) > 3)):
                    foods_flagged.append({'food': food, 'allergen': allergen})
                    flagged = True
                    break
            if flagged:
                warnings.append(f"⚠️ '{food}' may contain or relate to '{allergen}' — which you listed as an allergy.")
            else:
                foods_ok.append(food)

        # Check supplement text against allergies
        supp = res.get('supplement','')
        for allergen in user_allergies:
            if allergen and allergen in supp.lower():
                warnings.append(f"⚠️ The supplement '{supp}' may relate to your '{allergen}' allergy — check with your doctor.")

        # Check chronic conditions for relevant hints
        for condition, info in CONDITION_HINTS.items():
            for uc in user_conditions:
                if condition in uc:
                    supp_lower = supp.lower()
                    if any(kw in supp_lower for kw in info['supplement_keywords']):
                        warnings.append(info['hint'])
                        break
                    # Also add general condition note
                    if 'hint' in info:
                        warnings.append(info['hint'])
                        break

        res['allergy_warnings'] = warnings
        res['foods_flagged']    = [f['food'] for f in foods_flagged]
        # Keep all foods but flag the risky ones rather than hiding them
        # (user should still know the options and decide)

    # ── Save to DB ────────────────────────────────────────────────────────────
    conn = get_db()
    try:
        cur = conn.execute(
            "INSERT INTO analyses (user_id,symptoms,results,engine_used) VALUES (?,?,?,?)",
            (uid, text, json.dumps(results), engine_used))
    except Exception:
        cur = conn.execute(
            "INSERT INTO analyses (user_id,symptoms,results) VALUES (?,?,?)",
            (uid, text, json.dumps(results)))
    analysis_id = cur.lastrowid

    record_str = f"{uid}|{text}|{json.dumps(results)}|{datetime.utcnow().isoformat()}"
    add_blockchain_record(conn, 'analysis', analysis_id, record_str)
    conn.commit()
    conn.close()
    return jsonify({'results': results, 'engine': engine_used, 'lang': lang}), 200

def analyze_with_db(text):
    """Rule-based analysis using deficiencies stored in DB."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM deficiencies WHERE active=1").fetchall()
    conn.close()
    if not rows:
        from ai_engine import analyze_symptoms
        return analyze_symptoms(text)
    from ai_engine import normalizeText
    normalized = normalizeText(text)
    text_lower = text.lower()
    import re
    words = set(re.findall(r'\b\w+\b', normalized))
    results = []
    for row in rows:
        symptoms = json.loads(row['symptoms'] or '[]')
        matched = []
        for s in symptoms:
            sl = s.lower()
            if ' ' in sl:
                if sl in normalized or sl in text_lower:
                    matched.append(s)
            else:
                if sl in words or sl in text_lower:
                    matched.append(s)
        if matched:
            raw = len(matched) / max(len(symptoms), 1)
            confidence = min(int(raw * 100 * 3.5 + 20), 95)
            results.append({
                'id': row['id'], 'name': row['name'], 'icon': row['icon'],
                'color': row['color'], 'bg': row['bg'], 'icd': row['icd'],
                'severity': row['severity'], 'confidence': confidence,
                'matched_symptoms': matched,
                'kenya_stat': row['kenya_stat'],
                'foods_recommended': json.loads(row['foods_recommended'] or '[]'),
                'foods_avoid': json.loads(row['foods_avoid'] or '[]'),
                'tips': json.loads(row['tips'] or '[]'),
                'supplement': row['supplement'],
                'risk_groups': json.loads(row['risk_groups'] or '[]'),
                'when_to_see_doctor': row['when_to_see_doctor'],
            })
    return sorted(results, key=lambda x: x['confidence'], reverse=True)[:3]

# ── Feedback on AI Analysis ────────────────────────────────────────────────────
@app.route('/api/feedback', methods=['POST'])
@jwt_required()
def submit_feedback():
    d = request.get_json()
    uid = current_user_id()
    conn = get_db()
    conn.execute(
        "INSERT INTO feedback (user_id, analysis_id, predicted_id, corrected_id, helpful, comment) VALUES (?,?,?,?,?,?)",
        (uid, d.get('analysis_id'), d.get('predicted_id'), d.get('corrected_id'),
         1 if d.get('helpful') else 0, d.get('comment',''))
    )
    conn.commit()
    conn.close()
    return jsonify({'status': 'feedback saved'}), 201

# ── User Endpoints ─────────────────────────────────────────────────────────────
@app.route('/api/history', methods=['GET'])
@jwt_required()
def get_history():
    uid = current_user_id()
    conn = get_db()
    rows = conn.execute(
        "SELECT id,symptoms,results,timestamp FROM analyses WHERE user_id=? ORDER BY timestamp DESC LIMIT 50",
        (uid,)).fetchall()
    conn.close()
    # Handle engine_used gracefully (column added in v2 migration)
    result = []
    for r in rows:
        item = {'id':r['id'],'symptoms':r['symptoms'],
                'results':json.loads(r['results']) if r['results'] else [],
                'timestamp':r['timestamp']}
        try: item['engine_used'] = r['engine_used']
        except Exception: item['engine_used'] = 'rule_based'
        result.append(item)
    return jsonify(result), 200

@app.route('/api/profile', methods=['GET','PUT'])
@jwt_required()
def profile():
    uid = current_user_id()
    conn = get_db()
    if request.method == 'GET':
        u = conn.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
        conn.close()
        return jsonify({k:u[k] for k in u.keys() if k!='password_hash'}), 200
    d = request.get_json()
    conn.execute(
        "UPDATE users SET name=?,age=?,blood_group=?,allergies=?,chronic_conditions=?,"
        "emergency_contact=?,emergency_phone=?,language=?,dark_mode=? WHERE id=?",
        (d.get('name'), d.get('age'), d.get('blood_group'), d.get('allergies'),
         d.get('chronic_conditions'), d.get('emergency_contact',''),
         d.get('emergency_phone',''), d.get('language','en'),
         1 if d.get('dark_mode') else 0, uid))
    conn.commit()
    u = conn.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
    conn.close()
    return jsonify({k:u[k] for k in u.keys() if k!='password_hash'}), 200

# ── Delete History (all or single) ────────────────────────────────────────────
@app.route('/api/history', methods=['DELETE'])
@jwt_required()
def delete_history():
    """DELETE /api/history             — wipes all analyses for current user
       DELETE /api/history?id=42      — deletes a single analysis record"""
    uid = current_user_id()
    analysis_id = request.args.get('id', type=int)
    conn = get_db()
    if analysis_id:
        conn.execute("DELETE FROM analyses WHERE id=? AND user_id=?", (analysis_id, uid))
        conn.execute("DELETE FROM feedback WHERE analysis_id=? AND user_id=?", (analysis_id, uid))
        log_audit('delete_history_item', f'analysis_id={analysis_id}', uid)
    else:
        conn.execute("DELETE FROM analyses WHERE user_id=?", (uid,))
        conn.execute("DELETE FROM feedback WHERE user_id=?",  (uid,))
        log_audit('delete_all_history', 'all analyses deleted', uid)
    conn.commit()
    conn.close()
    return jsonify({'message': 'History deleted successfully'}), 200

# ── Delete Account (self-service) ─────────────────────────────────────────────
@app.route('/api/account', methods=['DELETE'])
@jwt_required()
def delete_account():
    """Permanently deletes the current user's account and ALL associated data."""
    uid = current_user_id()
    d   = request.get_json() or {}
    # Require password confirmation for safety
    conn = get_db()
    urow = conn.execute("SELECT password_hash,role FROM users WHERE id=?", (uid,)).fetchone()
    if not urow:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    if urow['role'] == 'ADMIN':
        conn.close()
        return jsonify({'error': 'Admin accounts cannot be self-deleted. Contact your system administrator.'}), 403
    if not check_password_hash(urow['password_hash'], d.get('password','')):
        conn.close()
        return jsonify({'error': 'Incorrect password. Account deletion cancelled.'}), 401

    # Cascade delete everything
    for tbl in ['analyses','appointments','medications','feedback','audit_logs']:
        try:
            conn.execute(f"DELETE FROM {tbl} WHERE user_id=?", (uid,))
        except Exception:
            pass
    conn.execute("DELETE FROM users WHERE id=?", (uid,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Account permanently deleted.'}), 200
@app.route('/api/export/history', methods=['GET'])
@jwt_required()
def export_history():
    uid = current_user_id()
    conn = get_db()
    user_row = conn.execute("SELECT name, email FROM users WHERE id=?", (uid,)).fetchone()
    rows = conn.execute(
        "SELECT id, symptoms, results, timestamp FROM analyses WHERE user_id=? ORDER BY timestamp DESC",
        (uid,)).fetchall()
    conn.close()

    user_name  = user_row['name']  if user_row else 'User'
    user_email = user_row['email'] if user_row else ''
    generated  = datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')

    # ── Build print-ready HTML ──────────────────────────────────────────────────
    def badge(color, text):
        return (f'<span style="display:inline-block;background:{color}18;color:{color};'
                f'border:1px solid {color}40;border-radius:20px;padding:2px 10px;'
                f'font-size:11px;font-weight:700;margin:2px 3px 2px 0">{text}</span>')

    rows_html = ''
    for i, r in enumerate(rows):
        results = []
        try:
            results = json.loads(r['results']) if r['results'] else []
        except Exception:
            pass
        ts = r['timestamp'] or ''
        try:
            from datetime import datetime as dt
            ts = dt.strptime(ts[:19], '%Y-%m-%d %H:%M:%S').strftime('%d %b %Y · %H:%M')
        except Exception:
            pass

        badges_html = ''
        detail_html = ''
        if results:
            for res in results:
                color = res.get('color', '#16a34a')
                badges_html += badge(color, f"{res.get('name','?')} {res.get('confidence','')}%")
            # Detail rows for each deficiency
            for res in results:
                color = res.get('color', '#16a34a')
                foods = ', '.join(res.get('foods_recommended', [])[:5])
                tips  = '; '.join(res.get('tips', [])[:2])
                supp  = res.get('supplement', '')
                detail_html += f'''
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;width:160px;vertical-align:top">
                    <span style="color:{color};font-weight:700">{res.get('name','')}</span><br>
                    <span style="font-size:10px;color:#6b7280">ICD {res.get('icd','')} · {res.get('severity','')}</span>
                  </td>
                  <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#374151">
                    {foods if foods else '—'}
                  </td>
                  <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#374151">
                    {supp if supp else '—'}
                  </td>
                </tr>'''
        else:
            badges_html = '<span style="color:#9ca3af;font-size:12px">No deficiencies matched</span>'

        bg = '#ffffff' if i % 2 == 0 else '#f9fafb'
        rows_html += f'''
        <div style="background:{bg};border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:12px;page-break-inside:avoid">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:8px">
            <div style="font-size:11px;color:#6b7280">
              <span style="background:#f0fdf4;color:#16a34a;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;margin-right:6px">#{r["id"]}</span>
              {ts}
            </div>
          </div>
          <div style="font-size:13px;color:#374151;font-style:italic;margin-bottom:8px;padding:6px 10px;background:#f9fafb;border-left:3px solid #e5e7eb;border-radius:0 6px 6px 0">
            "{r["symptoms"][:200]}{"…" if len(r["symptoms"])>200 else ""}"
          </div>
          <div style="margin-bottom:8px">{badges_html}</div>
          {f"""<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
            <thead><tr style="background:#f0fdf4">
              <th style="padding:6px 12px;text-align:left;font-size:10px;text-transform:uppercase;color:#16a34a;border-bottom:2px solid #d1fae5">Deficiency</th>
              <th style="padding:6px 12px;text-align:left;font-size:10px;text-transform:uppercase;color:#16a34a;border-bottom:2px solid #d1fae5">Kenyan Foods</th>
              <th style="padding:6px 12px;text-align:left;font-size:10px;text-transform:uppercase;color:#16a34a;border-bottom:2px solid #d1fae5">Supplement</th>
            </tr></thead>
            <tbody>{detail_html}</tbody>
          </table>""" if results else ""}
        </div>'''

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>MediHelp — Health Analysis Report</title>
  <style>
    * {{ box-sizing:border-box; margin:0; padding:0; }}
    body {{ font-family:'Segoe UI',Arial,sans-serif; color:#111827; background:white; padding:24px; font-size:13px; }}
    @media print {{
      body {{ padding:0; }}
      .no-print {{ display:none!important; }}
      @page {{ margin:18mm 14mm; size:A4; }}
    }}
    h1 {{ font-size:22px; color:#052e16; margin-bottom:2px; }}
    .subtitle {{ color:#16a34a; font-size:13px; margin-bottom:20px; }}
    .meta {{ display:flex; gap:20px; flex-wrap:wrap; margin-bottom:24px; padding:12px 16px;
             background:#f0fdf4; border:1px solid #d1fae5; border-radius:10px; }}
    .meta div {{ font-size:12px; color:#374151; }}
    .meta strong {{ color:#052e16; }}
    .section-title {{ font-size:14px; font-weight:700; color:#374151; margin:20px 0 10px;
                      padding-bottom:6px; border-bottom:2px solid #d1fae5; }}
    .disclaimer {{ margin-top:28px; padding:10px 14px; background:#fffbeb; border:1px solid #fcd34d;
                   border-radius:8px; font-size:11px; color:#92400e; }}
    .print-btn {{ display:inline-flex; align-items:center; gap:6px; margin-bottom:20px;
                  padding:10px 20px; background:#16a34a; color:white; border:none; border-radius:8px;
                  cursor:pointer; font-size:13px; font-weight:600; }}
    .print-btn:hover {{ background:#15803d; }}
    header {{ display:flex; align-items:center; gap:14px; margin-bottom:20px; padding-bottom:14px;
              border-bottom:2px solid #d1fae5; }}
    .logo-svg {{ flex-shrink:0; }}
  </style>
</head>
<body>
  <button class="no-print print-btn" onclick="window.print()">&#128438; Print / Save as PDF</button>

  <header>
    <svg class="logo-svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M24 3L5 11.5V23C5 34.5 13.2 43.5 24 45.5C34.8 43.5 43 34.5 43 23V11.5L24 3Z"
            fill="#16a34a" opacity="0.15" stroke="#16a34a" stroke-width="2"/>
      <rect x="21.5" y="13" width="5" height="22" rx="2.5" fill="#16a34a"/>
      <rect x="13" y="21.5" width="22" height="5" rx="2.5" fill="#16a34a"/>
    </svg>
    <div>
      <h1>MediHelp</h1>
      <div class="subtitle">Kenya Nutrition AI · Health Analysis Report</div>
    </div>
  </header>

  <div class="meta">
    <div><strong>Patient:</strong> {user_name}</div>
    <div><strong>Email:</strong> {user_email}</div>
    <div><strong>Total Records:</strong> {len(rows)}</div>
    <div><strong>Generated:</strong> {generated}</div>
  </div>

  <div class="section-title">Analysis History ({len(rows)} record{"s" if len(rows)!=1 else ""})</div>

  {rows_html if rows_html else '<p style="color:#9ca3af;text-align:center;padding:2rem">No analysis records found.</p>'}

  <div class="disclaimer">
    <strong>&#9888; Disclaimer:</strong> This report is generated by MediHelp AI and is for informational purposes only.
    It does not constitute medical advice and should not replace consultation with a licensed healthcare professional.
    Always confirm findings with proper blood tests and clinical diagnosis.
  </div>
</body>
</html>'''

    response = make_response(html)
    response.headers['Content-Type'] = 'text/html; charset=utf-8'
    response.headers['Content-Disposition'] = 'inline; filename=medihelp_report.html'
    return response

# ── Health Trends (for charts) ─────────────────────────────────────────────────
@app.route('/api/trends', methods=['GET'])
@jwt_required()
def user_trends():
    uid = current_user_id()
    conn = get_db()
    # Daily counts last 30 days
    daily = conn.execute("""
        SELECT DATE(timestamp) as day, COUNT(*) as count
        FROM analyses WHERE user_id=?
        AND timestamp >= date('now','-30 days')
        GROUP BY DATE(timestamp) ORDER BY day
    """, (uid,)).fetchall()

    # Top deficiencies
    rows = conn.execute(
        "SELECT results FROM analyses WHERE user_id=? AND results IS NOT NULL ORDER BY timestamp DESC LIMIT 50",
        (uid,)).fetchall()
    def_counts = {}
    for r in rows:
        try:
            results = json.loads(r['results'])
            for res in results[:1]:  # top hit only
                name = res.get('name','')
                def_counts[name] = def_counts.get(name, 0) + 1
        except Exception:
            pass

    top_defs = sorted(def_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    conn.close()
    return jsonify({
        'daily': [{'day': r['day'], 'count': r['count']} for r in daily],
        'top_deficiencies': [{'name': k, 'count': v} for k, v in top_defs],
        'total_analyses': sum(d_counts for _, d_counts in top_defs),
    }), 200

# ── Appointments ───────────────────────────────────────────────────────────────
@app.route('/api/appointments', methods=['GET'])
@jwt_required()
def get_appointments():
    uid = current_user_id()
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM appointments WHERE user_id=? ORDER BY appointment_date DESC, appointment_time DESC",
        (uid,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows]), 200

@app.route('/api/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    d = request.get_json()
    uid = current_user_id()
    if not d.get('doctor_name') or not d.get('appointment_date') or not d.get('appointment_time'):
        return jsonify({'error': 'Doctor name, date and time are required'}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO appointments (user_id,doctor_name,hospital_name,appointment_date,appointment_time,notes) VALUES (?,?,?,?,?,?)",
        (uid, d['doctor_name'], d.get('hospital_name',''), d['appointment_date'],
         d['appointment_time'], d.get('notes','')))
    appt_id = cur.lastrowid
    # Blockchain record
    record_str = f"{uid}|{d['doctor_name']}|{d['appointment_date']}|{d['appointment_time']}"
    add_blockchain_record(conn, 'appointment', appt_id, record_str)
    conn.commit()

    # Email notification
    try:
        user = conn.execute("SELECT email, name FROM users WHERE id=?", (uid,)).fetchone()
        conn.close()
        if user:
            send_email(user['email'], 'MediHelp — Appointment Confirmed',
                f"Dear {user['name']},\n\nYour appointment has been booked:\n"
                f"Doctor: {d['doctor_name']}\nHospital: {d.get('hospital_name','Not specified')}\n"
                f"Date: {d['appointment_date']}\nTime: {d['appointment_time']}\n\n"
                f"Notes: {d.get('notes','None')}\n\nMediHelp Team")
    except Exception:
        pass

    return jsonify({'id': appt_id, 'status': 'scheduled'}), 201

@app.route('/api/appointments/<int:appt_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appt_id):
    d = request.get_json()
    uid = current_user_id()
    conn = get_db()
    appt = conn.execute("SELECT * FROM appointments WHERE id=? AND user_id=?", (appt_id, uid)).fetchone()
    if not appt:
        conn.close()
        return jsonify({'error': 'Not found'}), 404
    conn.execute(
        "UPDATE appointments SET doctor_name=?,hospital_name=?,appointment_date=?,appointment_time=?,status=?,notes=? WHERE id=?",
        (d.get('doctor_name', appt['doctor_name']),
         d.get('hospital_name', appt['hospital_name']),
         d.get('appointment_date', appt['appointment_date']),
         d.get('appointment_time', appt['appointment_time']),
         d.get('status', appt['status']),
         d.get('notes', appt['notes']),
         appt_id))
    conn.commit()
    row = conn.execute("SELECT * FROM appointments WHERE id=?", (appt_id,)).fetchone()
    conn.close()
    return jsonify(dict(row)), 200

@app.route('/api/appointments/<int:appt_id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(appt_id):
    uid = current_user_id()
    conn = get_db()
    conn.execute("DELETE FROM appointments WHERE id=? AND user_id=?", (appt_id, uid))
    conn.commit()
    conn.close()
    return jsonify({'deleted': True}), 200

# ── Medications ────────────────────────────────────────────────────────────────
@app.route('/api/medications', methods=['GET'])
@jwt_required()
def get_medications():
    uid = current_user_id()
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM medications WHERE user_id=? AND active=1 ORDER BY created_at DESC",
        (uid,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows]), 200

@app.route('/api/medications', methods=['POST'])
@jwt_required()
def add_medication():
    d = request.get_json()
    uid = current_user_id()
    if not d.get('drug_name'):
        return jsonify({'error': 'Drug name is required'}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO medications (user_id,drug_name,dosage,frequency,start_date,end_date,notes) VALUES (?,?,?,?,?,?,?)",
        (uid, d['drug_name'], d.get('dosage',''), d.get('frequency',''),
         d.get('start_date',''), d.get('end_date',''), d.get('notes','')))
    med_id = cur.lastrowid
    # Blockchain record
    record_str = f"{uid}|{d['drug_name']}|{d.get('dosage','')}|{datetime.utcnow().isoformat()}"
    add_blockchain_record(conn, 'medication', med_id, record_str)
    conn.commit()
    conn.close()
    return jsonify({'id': med_id}), 201

@app.route('/api/medications/<int:med_id>', methods=['DELETE'])
@jwt_required()
def delete_medication(med_id):
    uid = current_user_id()
    conn = get_db()
    conn.execute("UPDATE medications SET active=0 WHERE id=? AND user_id=?", (med_id, uid))
    conn.commit()
    conn.close()
    return jsonify({'deleted': True}), 200

# ── Drug Interaction Checker ───────────────────────────────────────────────────
@app.route('/api/check-interactions', methods=['POST'])
@jwt_required()
def check_interactions():
    d = request.get_json()
    drugs = [x.lower().strip() for x in d.get('drugs', [])]
    if len(drugs) < 1:
        return jsonify({'interactions': []}), 200

    # ── Drug name aliases — maps common brand/generic names to DB keys ──────
    ALIASES = {
        'ferrous sulphate':  'iron supplement',
        'ferrous sulfate':   'iron supplement',
        'ferrous gluconate': 'iron supplement',
        'iron tablet':       'iron supplement',
        'iron supplement':   'iron supplement',
        'iron':              'iron supplement',
        'vitamin c':         'vitamin c',
        'ascorbic acid':     'vitamin c',
        'vitamin d':         'vitamin d',
        'vitamin d3':        'vitamin d',
        'cholecalciferol':   'vitamin d',
        'vitamin d2':        'vitamin d',
        'vitamin a':         'vitamin a',
        'retinol':           'vitamin a',
        'vitamin b12':       'vitamin b12',
        'cyanocobalamin':    'vitamin b12',
        'vitamin k':         'vitamin k',
        'folic acid':        'folate',
        'folate':            'folate',
        'zinc':              'zinc',
        'zinc sulphate':     'zinc',
        'zinc sulfate':      'zinc',
        'calcium':           'calcium',
        'calcium carbonate': 'calcium',
        'magnesium':         'magnesium',
        'omeprazole':        'omeprazole',
        'metformin':         'metformin',
        'warfarin':          'warfarin',
        'aspirin':           'aspirin',
        'ibuprofen':         'ibuprofen',
        'paracetamol':       'paracetamol',
        'acetaminophen':     'paracetamol',
        'ciprofloxacin':     'ciprofloxacin',
        'tetracycline':      'tetracycline',
        'antacid':           'antacids',
        'antacids':          'antacids',
        'clopidogrel':       'clopidogrel',
        'phenytoin':         'phenytoin',
        'methotrexate':      'methotrexate',
    }

    def resolve(name):
        """Return list of possible DB keys for a drug name."""
        n = name.lower().strip()
        keys = {n}
        if n in ALIASES:
            keys.add(ALIASES[n])
        # Also try partial alias match
        for alias_key, alias_val in ALIASES.items():
            if alias_key in n or n in alias_key:
                keys.add(alias_val)
        return keys

    conn = get_db()
    rows = conn.execute("SELECT * FROM drug_interactions").fetchall()
    conn.close()

    found = []
    seen = set()
    for row in rows:
        d1, d2 = row['drug1'].lower(), row['drug2'].lower()
        # Build resolved sets for each drug in the user's list
        matches1 = [d for d in drugs if d1 in resolve(d) or any(k in d1 or d1 in k for k in resolve(d))]
        matches2 = [d for d in drugs if d2 in resolve(d) or any(k in d2 or d2 in k for k in resolve(d))]
        if matches1 and matches2:
            key = tuple(sorted([d1, d2]))
            if key not in seen:
                seen.add(key)
                found.append({
                    'drug1': row['drug1'], 'drug2': row['drug2'],
                    'severity': row['severity'], 'description': row['description'],
                    'source': row['source']
                })

    # Also check each drug against user's current meds in DB
    uid = current_user_id()
    conn = get_db()
    user_meds = [r['drug_name'].lower() for r in
                 conn.execute("SELECT drug_name FROM medications WHERE user_id=? AND active=1", (uid,)).fetchall()]
    conn.close()

    all_drugs = list(set(drugs + user_meds))
    for row in rows:
        d1, d2 = row['drug1'].lower(), row['drug2'].lower()
        matches1 = [d for d in all_drugs if d1 in resolve(d) or any(k in d1 or d1 in k for k in resolve(d))]
        matches2 = [d for d in all_drugs if d2 in resolve(d) or any(k in d2 or d2 in k for k in resolve(d))]
        if matches1 and matches2:
            key = tuple(sorted([d1, d2]))
            if key not in seen:
                seen.add(key)
                found.append({
                    'drug1': row['drug1'], 'drug2': row['drug2'],
                    'severity': row['severity'], 'description': row['description'],
                    'source': row['source'], 'with_existing_med': True
                })

    return jsonify({'interactions': found}), 200

# ── SOS / Emergency Alert ──────────────────────────────────────────────────────
@app.route('/api/sos', methods=['POST'])
@jwt_required()
def sos():
    d = request.get_json()
    uid = current_user_id()
    lat = d.get('lat')
    lon = d.get('lon')

    conn = get_db()
    user = conn.execute(
        "SELECT name, email, emergency_contact, emergency_phone FROM users WHERE id=?",
        (uid,)).fetchone()

    # Find nearest hospitals
    nearby = []
    if lat and lon:
        hospitals = conn.execute(
            "SELECT name, phone, address, latitude, longitude FROM hospitals WHERE emergency=1"
        ).fetchall()
        for h in hospitals:
            if h['latitude'] and h['longitude']:
                dist = haversine(lat, lon, h['latitude'], h['longitude'])
                nearby.append({'name': h['name'], 'phone': h['phone'],
                                'address': h['address'], 'distance_km': round(dist, 1)})
        nearby.sort(key=lambda x: x['distance_km'])
        nearby = nearby[:3]
    conn.close()

    # Log the SOS
    log_audit('sos', f"SOS triggered by user {uid}. Location: {lat},{lon}", uid)

    # Email to user and emergency contact
    map_link = f"https://www.openstreetmap.org/?mlat={lat}&mlon={lon}&zoom=15" if lat and lon else "Location not available"
    email_body = (
        f"EMERGENCY ALERT from MediHelp\n\n"
        f"User: {user['name']}\n"
        f"Location: {map_link}\n"
        f"Nearest Emergency Hospitals:\n"
        + "\n".join([f"  - {h['name']} ({h['distance_km']} km) — {h['phone']}" for h in nearby])
        + "\n\nEmergency Numbers: 999 (Police), 1199 (Ambulance), 0800 723 253 (Toll-free)"
    )

    email_sent = False
    if user['emergency_contact'] and user['email']:
        email_sent = send_email(user['email'], 'MediHelp SOS ALERT', email_body)
        if user['emergency_contact']:
            send_email(user['emergency_contact'], f"EMERGENCY: {user['name']} needs help", email_body)

    return jsonify({
        'status': 'sos_triggered',
        'email_sent': email_sent,
        'nearby_hospitals': nearby,
        'emergency_numbers': {'police': '999', 'ambulance': '1199', 'toll_free': '0800 723 253'}
    }), 200

# ── Blockchain Verification ────────────────────────────────────────────────────
@app.route('/api/admin/blockchain/verify', methods=['GET'])
@jwt_required()
def verify_blockchain():
    if not is_admin():
        return jsonify({'error': 'Unauthorized'}), 403
    record_type = request.args.get('type', 'analysis')
    conn = get_db()
    records = conn.execute(
        "SELECT * FROM blockchain_audit WHERE record_type=? ORDER BY id ASC",
        (record_type,)).fetchall()
    conn.close()

    valid = True
    broken_at = None
    prev = '0' * 64
    for r in records:
        if r['previous_hash'] != prev:
            valid = False
            broken_at = r['id']
            break
        prev = r['record_hash']

    return jsonify({
        'record_type': record_type,
        'total_records': len(records),
        'chain_valid': valid,
        'broken_at_id': broken_at,
        'last_hash': prev if records else None,
    }), 200

# ── ML Status ──────────────────────────────────────────────────────────────────
@app.route('/api/admin/ml/status', methods=['GET'])
@jwt_required()
def ml_status():
    if not is_admin():
        return jsonify({'error': 'Unauthorized'}), 403
    model_file = os.path.join(os.path.dirname(__file__), 'deficiency_model.pkl')
    model_exists = os.path.exists(model_file)
    model_info = {}
    if model_exists:
        try:
            import joblib
            model = joblib.load(model_file)
            model_info = {
                'classes': list(model.classes_) if hasattr(model, 'classes_') else [],
                'file_size_kb': round(os.path.getsize(model_file) / 1024, 1),
                'modified': datetime.fromtimestamp(os.path.getmtime(model_file)).isoformat(),
            }
        except Exception as e:
            model_info = {'error': str(e)}

    # Feedback stats
    conn = get_db()
    fb = conn.execute(
        "SELECT COUNT(*) as total, SUM(helpful) as helpful FROM feedback"
    ).fetchone()
    conn.close()

    return jsonify({
        'model_trained': model_exists,
        'model_info': model_info,
        'feedback_total': fb['total'] or 0,
        'feedback_helpful': fb['helpful'] or 0,
        'engine': 'ML (Naive Bayes TF-IDF)' if model_exists else 'Rule-based (keyword matching)',
    }), 200

@app.route('/api/admin/ml/train', methods=['POST'])
@jwt_required()
def trigger_training():
    if not is_admin():
        return jsonify({'error': 'Unauthorized'}), 403
    try:
        import subprocess, sys
        train_script = os.path.join(os.path.dirname(__file__), 'ml_train.py')
        if not os.path.exists(train_script):
            return jsonify({'error': 'ml_train.py not found'}), 404
        result = subprocess.run([sys.executable, train_script],
                                capture_output=True, text=True, timeout=120)
        if result.returncode == 0:
            log_audit('ml_train', 'Model retrained successfully', current_user_id())
            return jsonify({'status': 'success', 'output': result.stdout}), 200
        else:
            return jsonify({'status': 'error', 'output': result.stderr}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ── Admin Analytics ────────────────────────────────────────────────────────────
@app.route('/api/admin/analytics', methods=['GET'])
@jwt_required()
def admin_analytics():
    if not is_admin():
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db()

    # Daily analyses last 30 days
    daily = conn.execute("""
        SELECT DATE(timestamp) as day, COUNT(*) as count
        FROM analyses WHERE timestamp >= date('now','-30 days')
        GROUP BY DATE(timestamp) ORDER BY day
    """).fetchall()

    # Daily registrations last 30 days
    registrations = conn.execute("""
        SELECT DATE(created_at) as day, COUNT(*) as count
        FROM users WHERE created_at >= date('now','-30 days')
        GROUP BY DATE(created_at) ORDER BY day
    """).fetchall()

    # Top deficiencies across all users
    all_results = conn.execute(
        "SELECT results FROM analyses WHERE results IS NOT NULL ORDER BY timestamp DESC LIMIT 500"
    ).fetchall()
    def_counts = {}
    for r in all_results:
        try:
            results = json.loads(r['results'])
            for res in results[:1]:
                name = res.get('name','')
                def_counts[name] = def_counts.get(name, 0) + 1
        except Exception:
            pass

    # Engine breakdown — safe: column may not exist in old DBs
    try:
        engines = conn.execute("""
            SELECT COALESCE(engine_used, 'rule_based') as engine_used, COUNT(*) as count
            FROM analyses GROUP BY COALESCE(engine_used, 'rule_based')
        """).fetchall()
        engine_breakdown = [{'engine': r['engine_used'], 'count': r['count']} for r in engines]
    except Exception:
        engine_breakdown = [{'engine': 'rule_based', 'count': 0}]

    # Appointment stats
    appt_stats = conn.execute("""
        SELECT status, COUNT(*) as count FROM appointments GROUP BY status
    """).fetchall()

    # User roles
    role_stats = conn.execute("SELECT role, COUNT(*) as count FROM users GROUP BY role").fetchall()

    conn.close()
    return jsonify({
        'daily_analyses': [{'day': r['day'], 'count': r['count']} for r in daily],
        'daily_registrations': [{'day': r['day'], 'count': r['count']} for r in registrations],
        'top_deficiencies': sorted(def_counts.items(), key=lambda x: x[1], reverse=True)[:10],
        'engine_breakdown': engine_breakdown,
        'appointment_statuses': [{'status': r['status'], 'count': r['count']} for r in appt_stats],
        'user_roles': [{'role': r['role'], 'count': r['count']} for r in role_stats],
    }), 200

# ── Admin Feedback ─────────────────────────────────────────────────────────────
@app.route('/api/admin/feedback', methods=['GET'])
@jwt_required()
def admin_feedback():
    if not is_admin():
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db()
    rows = conn.execute("""
        SELECT f.*, u.name as user_name, u.email
        FROM feedback f LEFT JOIN users u ON f.user_id=u.id
        ORDER BY f.timestamp DESC LIMIT 50
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows]), 200

# ── Admin Audit Logs ───────────────────────────────────────────────────────────
@app.route('/api/admin/audit', methods=['GET'])
@jwt_required()
def admin_audit():
    if not is_admin():
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db()
    rows = conn.execute("""
        SELECT l.*, u.name as user_name, u.email
        FROM audit_logs l LEFT JOIN users u ON l.user_id=u.id
        ORDER BY l.timestamp DESC LIMIT 100
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows]), 200

# ── Healthcare Professional Validation ────────────────────────────────────────
@app.route('/api/validate-analysis/<int:analysis_id>', methods=['POST'])
@jwt_required()
def validate_analysis(analysis_id):
    if not is_healthcare_pro():
        return jsonify({'error': 'Unauthorized — Healthcare Professional role required'}), 403
    d = request.get_json()
    uid = current_user_id()
    conn = get_db()
    conn.execute(
        "INSERT INTO feedback (user_id, analysis_id, predicted_id, corrected_id, helpful, comment) VALUES (?,?,?,?,?,?)",
        (uid, analysis_id, d.get('predicted_id'), d.get('corrected_id'),
         1 if d.get('correct') else 0, d.get('notes','Professional review'))
    )
    conn.commit()
    conn.close()
    log_audit('validate_analysis', f"Analysis {analysis_id} validated by HP {uid}", uid)
    return jsonify({'status': 'validated'}), 200

# ── Hospitals ──────────────────────────────────────────────────────────────────
@app.route('/api/hospitals', methods=['GET'])
def hospitals_list():
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    search = request.args.get('q','').lower().strip()
    conn = get_db()
    rows = conn.execute("SELECT * FROM hospitals").fetchall()
    conn.close()
    result = []
    for r in rows:
        h = dict(r)
        if search:
            hay = f"{h['name']} {h.get('address','')} {h.get('type','')} {h.get('services','')}".lower()
            if search not in hay:
                continue
        if lat is not None and lon is not None and h.get('latitude') and h.get('longitude'):
            h['distance_km'] = round(haversine(lat, lon, float(h['latitude']), float(h['longitude'])), 1)
        else:
            h['distance_km'] = None
        result.append(h)
    if lat is not None and lon is not None:
        result.sort(key=lambda x: x['distance_km'] if x['distance_km'] is not None else 9999)
    else:
        result.sort(key=lambda x: x['name'])
    return jsonify(result), 200

@app.route('/api/hospitals', methods=['POST'])
@jwt_required()
def add_hospital():
    if not is_admin(): return jsonify({'error':'Unauthorized'}), 403
    d = request.get_json()
    if not d.get('name') or d.get('latitude') is None or d.get('longitude') is None:
        return jsonify({'error':'Name, latitude and longitude required'}), 400
    services = d.get('services',[])
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO hospitals (name,address,latitude,longitude,phone,type,services,emergency) VALUES (?,?,?,?,?,?,?,?)",
        (d['name'],d.get('address',''),float(d['latitude']),float(d['longitude']),
         d.get('phone',''),d.get('type','government'),
         json.dumps(services) if isinstance(services,list) else services,
         1 if d.get('emergency') else 0))
    conn.commit()
    h = conn.execute("SELECT * FROM hospitals WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    log_audit('add_hospital', f"Added hospital: {d['name']}", current_user_id())
    return jsonify(dict(h)), 201

@app.route('/api/hospitals/<int:hid>', methods=['PUT'])
@jwt_required()
def update_hospital(hid):
    if not is_admin(): return jsonify({'error':'Unauthorized'}), 403
    d = request.get_json()
    services = d.get('services',[])
    conn = get_db()
    conn.execute("UPDATE hospitals SET name=?,address=?,latitude=?,longitude=?,phone=?,type=?,services=?,emergency=? WHERE id=?",
        (d['name'],d.get('address',''),float(d['latitude']),float(d['longitude']),
         d.get('phone',''),d.get('type','government'),
         json.dumps(services) if isinstance(services,list) else services,
         1 if d.get('emergency') else 0, hid))
    conn.commit()
    h = conn.execute("SELECT * FROM hospitals WHERE id=?", (hid,)).fetchone()
    conn.close()
    return jsonify(dict(h) if h else {'error':'Not found'}), (200 if h else 404)

@app.route('/api/hospitals/<int:hid>', methods=['DELETE'])
@jwt_required()
def delete_hospital(hid):
    if not is_admin(): return jsonify({'error':'Unauthorized'}), 403
    conn = get_db()
    conn.execute("DELETE FROM hospitals WHERE id=?", (hid,))
    conn.commit()
    conn.close()
    return jsonify({'deleted':True}), 200

# ── Deficiencies API ───────────────────────────────────────────────────────────
@app.route('/api/deficiencies', methods=['GET'])
def get_deficiencies():
    conn = get_db()
    rows = conn.execute("SELECT * FROM deficiencies ORDER BY name").fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        for f in ['symptoms','foods_recommended','foods_avoid','tips','risk_groups']:
            try: d[f] = json.loads(d[f] or '[]')
            except: d[f] = []
        result.append(d)
    return jsonify(result), 200

@app.route('/api/deficiencies/<def_id>', methods=['PUT'])
@jwt_required()
def update_deficiency(def_id):
    if not is_admin(): return jsonify({'error':'Unauthorized'}), 403
    d = request.get_json()
    conn = get_db()
    def to_json(v):
        if isinstance(v, list): return json.dumps(v)
        if isinstance(v, str):
            try: return json.dumps(json.loads(v))
            except: return json.dumps([x.strip() for x in v.split('\n') if x.strip()])
        return json.dumps([])
    conn.execute("""UPDATE deficiencies SET
        name=?, icon=?, color=?, icd=?, severity=?, kenya_stat=?,
        symptoms=?, foods_recommended=?, foods_avoid=?, tips=?,
        supplement=?, risk_groups=?, when_to_see_doctor=?, active=?
        WHERE id=?""",
        (d['name'], d.get('icon','fa-circle-dot'), d.get('color','#16a34a'),
         d.get('icd',''), d.get('severity','Moderate'), d.get('kenya_stat',''),
         to_json(d.get('symptoms',[])), to_json(d.get('foods_recommended',[])),
         to_json(d.get('foods_avoid',[])), to_json(d.get('tips',[])),
         d.get('supplement',''), to_json(d.get('risk_groups',[])),
         d.get('when_to_see_doctor',''), 1 if d.get('active',True) else 0,
         def_id))
    conn.commit()
    row = conn.execute("SELECT * FROM deficiencies WHERE id=?", (def_id,)).fetchone()
    conn.close()
    return jsonify(dict(row) if row else {'error':'Not found'}), (200 if row else 404)

@app.route('/api/deficiencies', methods=['POST'])
@jwt_required()
def add_deficiency():
    if not is_admin(): return jsonify({'error':'Unauthorized'}), 403
    d = request.get_json()
    if not d.get('name') or not d.get('id'):
        return jsonify({'error':'ID and name are required'}), 400
    def to_json(v):
        if isinstance(v, list): return json.dumps(v)
        if isinstance(v, str):
            try: return json.dumps(json.loads(v))
            except: return json.dumps([x.strip() for x in v.split('\n') if x.strip()])
        return json.dumps([])
    conn = get_db()
    try:
        conn.execute("""INSERT INTO deficiencies
            (id,name,icon,color,bg,icd,severity,kenya_stat,symptoms,foods_recommended,foods_avoid,tips,supplement,risk_groups,when_to_see_doctor,active)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)""",
            (d['id'].lower().replace(' ','_'), d['name'], d.get('icon','fa-circle-dot'),
             d.get('color','#16a34a'), d.get('bg','#f0fdf4'), d.get('icd',''),
             d.get('severity','Moderate'), d.get('kenya_stat',''),
             to_json(d.get('symptoms',[])), to_json(d.get('foods_recommended',[])),
             to_json(d.get('foods_avoid',[])), to_json(d.get('tips',[])),
             d.get('supplement',''), to_json(d.get('risk_groups',[])),
             d.get('when_to_see_doctor','')))
        conn.commit()
        row = conn.execute("SELECT * FROM deficiencies WHERE id=?", (d['id'],)).fetchone()
        conn.close()
        return jsonify(dict(row)), 201
    except sqlite3.IntegrityError:
        return jsonify({'error':'A deficiency with that ID already exists'}), 400

@app.route('/api/deficiencies/<def_id>', methods=['DELETE'])
@jwt_required()
def delete_deficiency(def_id):
    if not is_admin(): return jsonify({'error':'Unauthorized'}), 403
    conn = get_db()
    conn.execute("DELETE FROM deficiencies WHERE id=?", (def_id,))
    conn.commit()
    conn.close()
    return jsonify({'deleted':True}), 200

# ── Admin ──────────────────────────────────────────────────────────────────────
@app.route('/api/admin/stats', methods=['GET'])
@jwt_required()
def admin_stats():
    if not is_admin(): return jsonify({'error':'Unauthorized'}), 403
    conn = get_db()
    stats = {
        'users':        conn.execute("SELECT COUNT(*) FROM users").fetchone()[0],
        'analyses':     conn.execute("SELECT COUNT(*) FROM analyses").fetchone()[0],
        'hospitals':    conn.execute("SELECT COUNT(*) FROM hospitals").fetchone()[0],
        'deficiencies': conn.execute("SELECT COUNT(*) FROM deficiencies WHERE active=1").fetchone()[0],
        'appointments': conn.execute("SELECT COUNT(*) FROM appointments").fetchone()[0],
        'medications':  conn.execute("SELECT COUNT(*) FROM medications WHERE active=1").fetchone()[0],
        'feedback':     conn.execute("SELECT COUNT(*) FROM feedback").fetchone()[0],
        'recent': [{'id':r['id'],'symptoms':r['symptoms'],'timestamp':r['timestamp'],
                    'user_name':r['user_name'],'email':r['email'],
                    'results': json.loads(r['results']) if r['results'] else []
                    } for r in conn.execute(
            "SELECT a.id,a.symptoms,a.results,a.timestamp,u.name as user_name,u.email "
            "FROM analyses a JOIN users u ON a.user_id=u.id ORDER BY a.timestamp DESC LIMIT 8"
        ).fetchall()]
    }
    conn.close()
    return jsonify(stats), 200

@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def admin_users():
    if not is_admin(): return jsonify({'error':'Unauthorized'}), 403
    search = request.args.get('q','').lower()
    conn = get_db()
    users = conn.execute("SELECT id,name,email,role,age,blood_group,allergies,chronic_conditions,created_at FROM users ORDER BY created_at DESC").fetchall()
    counts = {r['user_id']:r['c'] for r in conn.execute("SELECT user_id,COUNT(*) as c FROM analyses GROUP BY user_id").fetchall()}
    last_active = {r['user_id']:r['last'] for r in conn.execute("SELECT user_id,MAX(timestamp) as last FROM analyses GROUP BY user_id").fetchall()}
    conn.close()
    result = []
    for u in users:
        ud = dict(u)
        ud['analyses_count'] = counts.get(u['id'],0)
        ud['last_active'] = last_active.get(u['id'])
        if search and search not in f"{ud['name']} {ud['email']}".lower():
            continue
        result.append(ud)
    return jsonify(result), 200

@app.route('/api/admin/users/<int:uid>', methods=['GET'])
@jwt_required()
def admin_user_detail(uid):
    if not is_admin(): return jsonify({'error':'Unauthorized'}), 403
    conn = get_db()
    user = conn.execute("SELECT id,name,email,role,age,blood_group,allergies,chronic_conditions,created_at FROM users WHERE id=?", (uid,)).fetchone()
    if not user: conn.close(); return jsonify({'error':'Not found'}), 404
    analyses = conn.execute("SELECT id,symptoms,results,timestamp FROM analyses WHERE user_id=? ORDER BY timestamp DESC LIMIT 10", (uid,)).fetchall()
    conn.close()
    return jsonify({'user':dict(user), 'analyses':[
        {'id':a['id'],'symptoms':a['symptoms'],'timestamp':a['timestamp'],
         'results':json.loads(a['results']) if a['results'] else []} for a in analyses
    ]}), 200

@app.route('/api/admin/users/<int:uid>', methods=['PUT'])
@jwt_required()
def admin_update_user(uid):
    if not is_admin(): return jsonify({'error':'Unauthorized'}), 403
    if uid == current_user_id(): return jsonify({'error':'Cannot edit your own account via admin panel'}), 400
    d = request.get_json()
    conn = get_db()
    if d.get('password'):
        conn.execute("UPDATE users SET name=?,email=?,role=?,age=?,blood_group=?,allergies=?,chronic_conditions=?,password_hash=? WHERE id=?",
            (d['name'],d['email'].lower(),d['role'],d.get('age'),d.get('blood_group'),d.get('allergies'),d.get('chronic_conditions'),generate_password_hash(d['password']),uid))
    else:
        conn.execute("UPDATE users SET name=?,email=?,role=?,age=?,blood_group=?,allergies=?,chronic_conditions=? WHERE id=?",
            (d['name'],d['email'].lower(),d['role'],d.get('age'),d.get('blood_group'),d.get('allergies'),d.get('chronic_conditions'),uid))
    conn.commit()
    u = conn.execute("SELECT id,name,email,role,age,blood_group,allergies,chronic_conditions,created_at FROM users WHERE id=?", (uid,)).fetchone()
    conn.close()
    log_audit('admin_update_user', f"Updated user {uid}", current_user_id())
    return jsonify(dict(u)), 200

@app.route('/api/admin/users/<int:uid>', methods=['DELETE'])
@jwt_required()
def admin_delete_user(uid):
    if not is_admin(): return jsonify({'error':'Unauthorized'}), 403
    if uid == current_user_id(): return jsonify({'error':'Cannot delete your own account'}), 400
    conn = get_db()
    conn.execute("DELETE FROM analyses WHERE user_id=?", (uid,))
    conn.execute("DELETE FROM appointments WHERE user_id=?", (uid,))
    conn.execute("DELETE FROM medications WHERE user_id=?", (uid,))
    conn.execute("DELETE FROM users WHERE id=?", (uid,))
    conn.commit(); conn.close()
    log_audit('admin_delete_user', f"Deleted user {uid}", current_user_id())
    return jsonify({'deleted':True}), 200

# ── OpenStreetMap Overpass Hospital Search ────────────────────────────────────
@app.route('/api/hospitals/overpass', methods=['GET'])
def overpass_hospitals():
    """
    Query OpenStreetMap Overpass API for Kenyan hospitals.
    Supports:
      - ?q=search_term   (search by name anywhere in Kenya)
      - ?lat=x&lon=y&radius=20000  (find hospitals near coordinates, radius in metres)
    """
    import urllib.request, urllib.parse

    q      = request.args.get('q','').strip()
    lat    = request.args.get('lat', type=float)
    lon    = request.args.get('lon', type=float)
    radius = request.args.get('radius', 25000, type=int)  # default 25 km

    # Build Overpass QL query
    if lat and lon:
        # Near me — all hospitals within radius
        overpass_q = f"""
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:{radius},{lat},{lon});
  way["amenity"="hospital"](around:{radius},{lat},{lon});
  node["amenity"="clinic"](around:{radius},{lat},{lon});
  way["amenity"="clinic"](around:{radius},{lat},{lon});
  node["amenity"="health_post"](around:{radius},{lat},{lon});
  node["healthcare"="hospital"](around:{radius},{lat},{lon});
  way["healthcare"="hospital"](around:{radius},{lat},{lon});
  node["healthcare"="clinic"](around:{radius},{lat},{lon});
);
out center tags;
"""
    elif q:
        # Name search across all of Kenya bbox: S=-4.7 W=33.9 N=5.0 E=41.9
        safe_q = q.replace('"', '').replace("'","")
        overpass_q = f"""
[out:json][timeout:25];
(
  node["amenity"="hospital"]["name"~"{safe_q}",i](-4.7,33.9,5.0,41.9);
  way["amenity"="hospital"]["name"~"{safe_q}",i](-4.7,33.9,5.0,41.9);
  node["amenity"="clinic"]["name"~"{safe_q}",i](-4.7,33.9,5.0,41.9);
  way["amenity"="clinic"]["name"~"{safe_q}",i](-4.7,33.9,5.0,41.9);
  node["healthcare"]["name"~"{safe_q}",i](-4.7,33.9,5.0,41.9);
  way["healthcare"]["name"~"{safe_q}",i](-4.7,33.9,5.0,41.9);
);
out center tags;
"""
    else:
        # No params — return empty (too broad)
        return jsonify([]), 200

    try:
        url = "https://overpass-api.de/api/interpreter"
        data = urllib.parse.urlencode({'data': overpass_q}).encode()
        req  = urllib.request.Request(url, data=data,
                                       headers={'User-Agent': 'MediHelp/2.0 (Kenya Health App)'})
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw = json.loads(resp.read().decode())

        hospitals = []
        for el in raw.get('elements', []):
            tags    = el.get('tags', {})
            name    = tags.get('name') or tags.get('name:en','')
            if not name:
                continue
            # Coordinates — nodes have lat/lon directly, ways/relations have center
            clat = el.get('lat') or (el.get('center') or {}).get('lat')
            clon = el.get('lon') or (el.get('center') or {}).get('lon')
            if not clat or not clon:
                continue

            dist = None
            if lat and lon:
                dist = round(haversine(lat, lon, clat, clon), 1)

            hospitals.append({
                'id':         f"osm_{el['id']}",
                'name':       name,
                'address':    (tags.get('addr:full') or
                               tags.get('addr:street','') or
                               tags.get('addr:suburb','') or
                               tags.get('addr:city','') or
                               tags.get('addr:district','') or
                               tags.get('addr:county','') or ''),
                'latitude':   clat,
                'longitude':  clon,
                'phone':      (tags.get('phone') or
                               tags.get('contact:phone') or
                               tags.get('contact:mobile') or
                               tags.get('mobile') or
                               tags.get('phone:KE') or ''),
                'type':       (tags.get('healthcare') or
                               tags.get('amenity') or
                               tags.get('healthcare:speciality','').lower() or
                               ('private' if tags.get('operator:type') == 'private'
                                else 'government')),
                'services':   json.dumps([]),
                'emergency':  1 if (tags.get('emergency') == 'yes' or
                                    tags.get('emergency:ambulance_station') == 'yes') else 0,
                'distance_km': dist,
                'source':     'OpenStreetMap',
            })

        if lat and lon:
            hospitals.sort(key=lambda x: x['distance_km'] if x['distance_km'] is not None else 9999)

        return jsonify(hospitals[:60]), 200   # cap at 60 results

    except Exception as e:
        return jsonify({'error': f'Overpass query failed: {str(e)}'}), 500

# ── Health ─────────────────────────────────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    conn = get_db()
    uc = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    dc = conn.execute("SELECT COUNT(*) FROM deficiencies WHERE active=1").fetchone()[0]
    ml_ready = os.path.exists(os.path.join(os.path.dirname(__file__), 'deficiency_model.pkl'))
    conn.close()
    return jsonify({
        'status':'ok','version':'2.0.0',
        'timestamp':datetime.utcnow().isoformat(),
        'db':'connected','registered_users':uc,'active_deficiencies':dc,
        'ml_model': 'trained' if ml_ready else 'not_trained',
    }), 200

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)