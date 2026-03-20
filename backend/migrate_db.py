"""
MediHelp Database Migration Script v1 → v2
==========================================
Run this ONCE to upgrade your existing medihelp.db without losing data.

    python migrate_db.py

Safe to run multiple times - it skips columns/tables that already exist.
"""
import sqlite3, os

DB_PATH = os.environ.get('DB_PATH', 'medihelp.db')

def col(conn, table, column, definition):
    """Add a column if it doesn't already exist."""
    try:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        print(f"  + Added   {table}.{column}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print(f"  ✓ Exists  {table}.{column}")
        else:
            print(f"  ! Error   {table}.{column}: {e}")

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"ERROR: {DB_PATH} not found. Run setup_db.py first.")
        return

    conn = sqlite3.connect(DB_PATH)
    print(f"\nMigrating {DB_PATH} ...\n")

    # ── analyses table ────────────────────────────────────────────────────────
    col(conn, 'analyses', 'engine_used',     "TEXT DEFAULT 'rule_based'")
    col(conn, 'analyses', 'feedback_score',  "INTEGER")

    # ── users table ───────────────────────────────────────────────────────────
    col(conn, 'users', 'emergency_contact',  "TEXT DEFAULT ''")
    col(conn, 'users', 'emergency_phone',    "TEXT DEFAULT ''")
    col(conn, 'users', 'language',           "TEXT DEFAULT 'en'")
    col(conn, 'users', 'dark_mode',          "INTEGER DEFAULT 0")

    # ── New tables ────────────────────────────────────────────────────────────
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS appointments (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id          INTEGER NOT NULL,
            doctor_name      TEXT NOT NULL,
            hospital_name    TEXT,
            appointment_date TEXT NOT NULL,
            appointment_time TEXT NOT NULL,
            status           TEXT DEFAULT 'scheduled',
            notes            TEXT,
            reminder_sent    INTEGER DEFAULT 0,
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS medications (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            drug_name   TEXT NOT NULL,
            dosage      TEXT,
            frequency   TEXT,
            start_date  TEXT,
            end_date    TEXT,
            notes       TEXT,
            active      INTEGER DEFAULT 1,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS drug_interactions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            drug1       TEXT NOT NULL,
            drug2       TEXT NOT NULL,
            severity    TEXT DEFAULT 'moderate',
            description TEXT,
            source      TEXT DEFAULT 'MediHelp KB'
        );

        CREATE TABLE IF NOT EXISTS blockchain_audit (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            record_type   TEXT NOT NULL,
            record_id     INTEGER,
            record_hash   TEXT NOT NULL,
            previous_hash TEXT NOT NULL,
            timestamp     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS feedback (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id      INTEGER,
            analysis_id  INTEGER,
            predicted_id TEXT,
            corrected_id TEXT,
            helpful      INTEGER DEFAULT 0,
            comment      TEXT,
            timestamp    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER,
            action     TEXT NOT NULL,
            details    TEXT,
            ip_address TEXT,
            timestamp  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("\n  ✓ All new tables verified")

    # ── Seed drug interactions if empty ───────────────────────────────────────
    if conn.execute("SELECT COUNT(*) FROM drug_interactions").fetchone()[0] == 0:
        interactions = [
            ('warfarin','aspirin','severe','Increased bleeding risk','Clinical KB'),
            ('warfarin','ibuprofen','severe','NSAIDs increase anticoagulant effect and GI bleeding','Clinical KB'),
            ('metformin','alcohol','moderate','Increases risk of lactic acidosis and hypoglycaemia','Clinical KB'),
            ('iron supplement','calcium','moderate','Calcium inhibits iron absorption - take 2 hours apart','Nutrition KB'),
            ('iron supplement','antacids','moderate','Antacids reduce iron absorption - take on empty stomach','Nutrition KB'),
            ('iron supplement','tetracycline','moderate','Tetracycline binds iron, reducing absorption of both','Clinical KB'),
            ('vitamin a','retinol','severe','Excess Vitamin A is toxic (teratogenic in pregnancy)','Nutrition KB'),
            ('vitamin d','thiazide diuretics','moderate','May cause hypercalcaemia - monitor calcium levels','Clinical KB'),
            ('vitamin k','warfarin','severe','Vitamin K directly antagonises anticoagulation','Clinical KB'),
            ('folate','methotrexate','severe','Methotrexate is a folate antagonist','Clinical KB'),
            ('aspirin','ibuprofen','moderate','Reduces cardioprotective effect of aspirin','Clinical KB'),
            ('ciprofloxacin','antacids','moderate','Antacids reduce ciprofloxacin absorption','Clinical KB'),
            ('paracetamol','alcohol','moderate','Increases risk of paracetamol hepatotoxicity','Clinical KB'),
            ('zinc','copper','moderate','High-dose zinc depletes copper','Nutrition KB'),
            ('zinc','iron supplement','mild','High-dose zinc and iron compete for absorption','Nutrition KB'),
            ('calcium','magnesium','mild','High calcium can interfere with magnesium absorption','Nutrition KB'),
            ('vitamin c','iron supplement','beneficial','Vitamin C significantly enhances non-haem iron absorption','Nutrition KB'),
            ('vitamin b12','metformin','moderate','Metformin reduces B12 absorption over time','Clinical KB'),
            ('folic acid','phenytoin','moderate','Phenytoin may reduce folate levels','Clinical KB'),
            ('omeprazole','clopidogrel','moderate','Omeprazole reduces antiplatelet effect of clopidogrel','Clinical KB'),
        ]
        conn.executemany(
            "INSERT INTO drug_interactions (drug1,drug2,severity,description,source) VALUES (?,?,?,?,?)",
            interactions)
        print("  + Seeded 20 drug interactions")
    else:
        print("  ✓ Drug interactions already seeded")

    conn.commit()
    conn.close()
    print("\n✅  Migration complete! You can now restart Flask.\n")

if __name__ == '__main__':
    migrate()