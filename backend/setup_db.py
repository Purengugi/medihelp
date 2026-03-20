"""
Run once: python setup_db.py
Creates medihelp.db with tables and seeds admin + hospitals.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app import init_db
print("Initializing MediHelp database...")
init_db()
print("✓ Done! Admin: admin@medihelp.ke / admin123")
