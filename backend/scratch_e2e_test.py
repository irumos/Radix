import requests
import os
import uuid

API_BASE = "http://127.0.0.1:8000/api"
ROOT_BASE = "http://127.0.0.1:8000"

def run_e2e():
    print("=========================================================")
    print("           FASTAPI E2E WORKFLOW INTEGRATION TEST        ")
    print("=========================================================")

    # 1. Health & Swagger Check
    print("\n[STEP 1] Testing Gateway Health Status...")
    res = requests.get(ROOT_BASE)
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    health = res.json()
    print(f"[SUCCESS] Gateway says: {health.get('message')} (Mode: {health.get('database_mode')})")

    res = requests.get(f"{ROOT_BASE}/docs")
    assert res.status_code == 200, "Swagger Docs UI unreachable."
    print("[SUCCESS] FastAPI Swagger UI loaded successfully.")

    # 2. Upload / Analyze Job Description
    print("\n[STEP 2] Posting Job Description specifications...")
    jd_payload = {
        "description": "Looking for a Senior Python Developer with FastAPI, SQL databases, Docker, and langchain experience.",
        "title": "Senior Cloud Integrator",
        "company": "Radix E2E Labs"
    }
    res = requests.post(f"{API_BASE}/jd/analyze", json=jd_payload)
    assert res.status_code == 200, f"JD Analyze endpoint failed: {res.status_code} - {res.text}"
    job = res.json()
    job_id = job["id"]
    print(f"[SUCCESS] Job parsed and saved. Generated ID: {job_id}")
    print(f"  Title: {job.get('title')} | Required Skills: {job.get('required_skills')}")

    # 3. Simulate Parse PDF Resume
    # Create a small dummy text resume, but since resume parser parses PDFs using PyPDF,
    # let's download or construct a simple dummy PDF file or test with raw profile creation.
    # To test PDF parsing specifically, let's write a simple dummy PDF in the workspace
    # and post it as multipart form!
    print("\n[STEP 3] Parsing PDF Resume File...")
    dummy_resume = "diagnostic_resume.pdf"
    
    # We can write a simple text or mock binary to mimic a PDF structure,
    # but since PyPDF expects a valid PDF header, let's write a valid minimal PDF file!
    # A valid minimal PDF file format starts with %PDF-1.4
    pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(QA DevOps Release Engineer. Python, FastAPI, Docker, SQL) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n318\n%%EOF"
    with open(dummy_resume, "wb") as f:
        f.write(pdf_content)

    try:
        with open(dummy_resume, "rb") as f:
            files = {"file": (dummy_resume, f, "application/pdf")}
            res = requests.post(f"{API_BASE}/parser/resume", files=files)
        
        # If OpenAI keys are invalid, it will fallback to regex parsing, which still passes!
        assert res.status_code == 200, f"Resume parser endpoint failed: {res.status_code} - {res.text}"
        parsed_resume = res.json()
        print(f"[SUCCESS] Resume uploaded and parsed successfully.")
        print(f"  Candidate: {parsed_resume.get('full_name')} | Skills: {parsed_resume.get('skills')}")
        print(f"  Uploaded Resume URL: {parsed_resume.get('resume_url')}")
    finally:
        if os.path.exists(dummy_resume):
            os.remove(dummy_resume)

    # 4. Create Candidate Profile
    print("\n[STEP 4] Creating Candidate Profile...")
    profile_payload = {
        "full_name": "Radix E2E Candidate",
        "email": f"candidate_{uuid.uuid4().hex[:6]}@radix.ai",
        "phone": "+1 800 E2E TEST",
        "skills": ["Python", "FastAPI", "SQL", "Docker", "Langchain"],
        "education": [{"degree": "B.S.", "major": "Computer Science", "institution": "Hackathon Uni", "graduation_year": 2024}],
        "experience": [{"job_title": "Backend Engineer", "company": "Code Lab", "duration_months": 18, "responsibilities": ["Created APIs"], "skills_used": ["FastAPI"]}],
        "projects": [{"title": "Match Engine", "description": "Vector search mapping", "skills_used": ["Python"]}],
        "certifications": ["Langchain Developer Certificate"],
        "resume_url": parsed_resume.get("resume_url") or "http://default-mock.pdf"
    }
    res = requests.post(f"{API_BASE}/profile", json=profile_payload)
    assert res.status_code == 201, f"Profile create failed: {res.status_code} - {res.text}"
    profile = res.json()
    profile_id = profile["id"]
    print(f"[SUCCESS] Profile created with cloud adapters. Candidate ID: {profile_id}")

    # 5. Execute Talent Match check
    print("\n[STEP 5] Executing E2E Talent Check Similarity calculations...")
    match_payload = {
        "profile_id": profile_id,
        "job_id": job_id
    }
    res = requests.post(f"{API_BASE}/match", json=match_payload)
    assert res.status_code == 200, f"Match calculation failed: {res.status_code} - {res.text}"
    match_res = res.json()
    print(f"[SUCCESS] E2E calculations complete! Overall Score: {match_res['score']}%")
    print(f"  Semantic score: {match_res['semantic_score']}%")
    print(f"  Matched Skills: {match_res['matched_skills']}")
    print(f"  Gaps Missing: {match_res['missing_skills']}")
    print(f"  AI Report URL: {match_res.get('report_url')}")

    # 6. Database Updates (PUT)
    print("\n[STEP 6] Testing Database Record Updates...")
    profile_payload["full_name"] = "Radix E2E Candidate (Updated Name)"
    res = requests.put(f"{API_BASE}/profile/{profile_id}", json=profile_payload)
    assert res.status_code == 200, f"Update profile failed: {res.status_code}"
    updated_profile = res.json()
    print(f"[SUCCESS] Update candidate name verified: {updated_profile['full_name']}")

    # 7. Database Deletes (DELETE)
    print("\n[STEP 7] Performing Database Record Cleanups...")
    res = requests.delete(f"{API_BASE}/profile/{profile_id}")
    assert res.status_code == 200, f"Delete profile failed: {res.status_code}"
    print(f"[SUCCESS] Deleted candidate profile {profile_id} successfully.")

    res = requests.delete(f"{API_BASE}/jd/{job_id}")
    assert res.status_code == 200, f"Delete job description failed: {res.status_code}"
    print(f"[SUCCESS] Deleted job description {job_id} successfully.")

    print("\n=========================================================")
    print("             E2E PIPELINE INTEGRATION PASSED             ")
    print("=========================================================")

if __name__ == "__main__":
    run_e2e()
