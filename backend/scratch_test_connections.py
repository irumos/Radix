import os
import sys
import uuid

# Ensure backend folder is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Delete local SQLite DB if it exists to refresh schemas cleanly
db_file = "talent_match.db"
if os.path.exists(db_file):
    try:
        os.remove(db_file)
        print("[INFO] Cleared old SQLite DB file to update table columns.")
    except Exception as e:
        print(f"[INFO] Could not remove SQLite DB file: {e}")

from shared.config import settings
from shared.supabase_client import supabase_client
from shared.utils import (
    db_save_profile, db_get_profile, db_update_profile, db_delete_profile,
    db_save_job, db_get_job, db_update_job, db_delete_job,
    db_upload_file, logger
)

def run_diagnostics():
    print("=========================================================")
    print("       SUPABASE DATABASE & STORAGE DIAGNOSTIC SUITE     ")
    print("=========================================================")
    print(f"USE_LOCAL_FALLBACK: {settings.USE_LOCAL_FALLBACK}")
    print(f"SUPABASE_URL: {settings.SUPABASE_URL}")
    print("---------------------------------------------------------")

    if settings.USE_LOCAL_FALLBACK or not supabase_client:
        print("[WARNING] Supabase credentials missing or invalid. Diagnostics running on SQLite fallback.")
    else:
        print("[INFO] Connected successfully to Supabase Client.")

    # 1. Probe & Auto-create Storage Buckets
    buckets = ["resume-files", "jd-files", "generated-reports"]
    if not settings.USE_LOCAL_FALLBACK and supabase_client:
        print("\n--- Probing Storage Buckets ---")
        for b in buckets:
            try:
                # Try getting bucket details
                supabase_client.storage.get_bucket(b)
                print(f"[SUCCESS] Bucket '{b}' exists and is reachable.")
            except Exception as e:
                print(f"[INFO] Bucket '{b}' not found. Attempting to create bucket programmatically...")
                try:
                    supabase_client.storage.create_bucket(b, options={"public": True})
                    print(f"[SUCCESS] Created public bucket '{b}' successfully!")
                except Exception as create_err:
                    print(f"[ERROR] Failed to create bucket '{b}': {create_err}")
    else:
        print("\n[INFO] Skipping Supabase Storage probes (SQLite mode). Mock directory fallback will handle files.")

    # 2. Test File Upload/Download
    print("\n--- Testing Storage Uploads ---")
    dummy_file_path = "temp_diagnostic_test.txt"
    with open(dummy_file_path, "w", encoding="utf-8") as f:
        f.write("Diagnostic payload verification 2026.")

    try:
        dest_name = f"test_{uuid.uuid4()}.txt"
        # Test upload to resume-files (or mock static/resume-files)
        public_url = db_upload_file("resume-files", dummy_file_path, dest_name)
        if public_url:
            print(f"[SUCCESS] Upload test complete. Asset path/URL: {public_url}")
        else:
            print("[ERROR] Upload test returned None URL.")
    finally:
        if os.path.exists(dummy_file_path):
            os.remove(dummy_file_path)

    # 3. Test Profile CRUD
    print("\n--- Testing Candidate Profile CRUD ---")
    test_id = str(uuid.uuid4())
    p_data = {
        "full_name": "QA Release Tester",
        "email": "tester@radix.ai",
        "phone": "+12345678",
        "skills": ["Python", "FastAPI", "DevOps"],
        "education": [{"degree": "M.S.", "major": "DevOps", "institution": "QA Uni", "graduation_year": 2026}],
        "experience": [{"job_title": "Release Engineer", "company": "CI/CD Labs", "duration_months": 24, "responsibilities": ["Verifying builds"], "skills_used": ["FastAPI"]}],
        "projects": [{"title": "QA Harness", "description": "Auto testing connection systems", "skills_used": ["Python"]}],
        "certifications": ["AWS Certified"],
        "resume_url": "http://mock-resume.url"
    }

    try:
        # Create
        saved = db_save_profile(test_id, p_data)
        print(f"[CREATE] Profile created successfully: {saved.get('full_name') or saved.get('name')}")

        # Read
        retrieved = db_get_profile(test_id)
        if retrieved:
            print(f"[READ] Profile retrieved: {retrieved['full_name']} ({retrieved['email']})")
        else:
            print("[ERROR] Failed to retrieve saved profile.")

        # Update
        p_data["full_name"] = "QA Release Tester (Updated)"
        updated = db_update_profile(test_id, p_data)
        print(f"[UPDATE] Profile updated successfully. New name: {updated.get('full_name') or updated.get('name')}")

        # Delete
        deleted = db_delete_profile(test_id)
        print(f"[DELETE] Profile deleted status: {deleted}")
    except Exception as e:
        print(f"[ERROR] Profile CRUD failed: {e}")

    # 4. Test Job CRUD
    print("\n--- Testing Job Spec CRUD ---")
    job_id = str(uuid.uuid4())
    j_data = {
        "title": "Principal Architect",
        "company": "Radix Hackathon Inc",
        "required_skills": ["Architecting", "Python", "React"],
        "preferred_skills": ["Supabase"],
        "experience_years_required": 8,
        "description": "DevOps validation job posting",
        "file_url": "http://mock-jd.url"
    }

    try:
        # Create
        saved_j = db_save_job(job_id, j_data)
        print(f"[CREATE] Job description created: {saved_j.get('title') or saved_j.get('role')} at {saved_j.get('company')}")

        # Read
        retrieved_j = db_get_job(job_id)
        if retrieved_j:
            print(f"[READ] Job retrieved: {retrieved_j['title']} with requirements: {retrieved_j['required_skills']}")
        else:
            print("[ERROR] Failed to retrieve saved job description.")

        # Update
        j_data["title"] = "Principal Architect (Updated)"
        updated_j = db_update_job(job_id, j_data)
        print(f"[UPDATE] Job updated successfully. New title: {updated_j.get('title') or updated_j.get('role')}")

        # Delete
        deleted_j = db_delete_job(job_id)
        print(f"[DELETE] Job deleted status: {deleted_j}")
    except Exception as e:
        print(f"[ERROR] Job CRUD failed: {e}")

    print("\n=========================================================")
    print("                  DIAGNOSTICS FINISHED                   ")
    print("=========================================================")

if __name__ == "__main__":
    run_diagnostics()
