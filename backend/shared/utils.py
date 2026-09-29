import os
import json
import logging
import uuid
import sqlite3
from typing import List, Dict, Any, Optional
from shared.config import settings
from shared.supabase_client import supabase_client

# Setup logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("TalentMatch")

# --- Database & Storage Helpers ---

def db_upload_file(bucket_name: str, file_path: str, destination_name: str) -> Optional[str]:
    """
    Uploads a file to Supabase Storage. Under cloud-mode, errors are logged and raised.
    """
    if not settings.USE_LOCAL_FALLBACK and supabase_client:
        try:
            logger.info(f"Uploading {file_path} to Supabase bucket '{bucket_name}'...")
            with open(file_path, 'rb') as f:
                supabase_client.storage.from_(bucket_name).upload(
                    path=destination_name,
                    file=f,
                    file_options={"cache-control": "3600", "upsert": "true"}
                )
            public_url = supabase_client.storage.from_(bucket_name).get_public_url(destination_name)
            logger.info(f"Supabase upload success. URL: {public_url}")
            return public_url
        except Exception as e:
            logger.error(f"Supabase storage upload failed: {e}")
            raise e
    
    # SQLite / Local storage fallback (Only active when keys are completely absent)
    try:
        static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", bucket_name)
        os.makedirs(static_dir, exist_ok=True)
        local_path = os.path.join(static_dir, destination_name)
        import shutil
        shutil.copy2(file_path, local_path)
        logger.info(f"Saved mock file locally: {local_path}")
        return f"/static/{bucket_name}/{destination_name}"
    except Exception as e:
        logger.error(f"Failed to save mock file locally: {e}")
        return None

def parse_json_field(val: Any) -> Any:
    if isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            pass
    return val or []

# --- Repository Pattern Cloud Adapter Functions ---

# --- Profile CRUD ---
def db_save_profile(profile_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    if not settings.USE_LOCAL_FALLBACK and supabase_client:
        try:
            payload = {
                "id": profile_id,
                "name": profile_data["full_name"],
                "email": profile_data["email"],
                "phone": profile_data.get("phone"),
                "education": profile_data.get("education", []),
                "experience": profile_data.get("experience", []),
                "projects": profile_data.get("projects", []),
                "certifications": profile_data.get("certifications", []),
                "resume_url": profile_data.get("resume_url")
            }
            supabase_client.table("candidate_profiles").upsert(payload).execute()
            
            # Map candidate skills to candidate_skills table
            supabase_client.table("candidate_skills").delete().eq("candidate_id", profile_id).execute()
            if profile_data.get("skills"):
                skills_payload = [
                    {"candidate_id": profile_id, "skill_name": s, "level": 3}
                    for s in profile_data["skills"]
                ]
                supabase_client.table("candidate_skills").insert(skills_payload).execute()
                
            return profile_data
        except Exception as e:
            logger.error(f"Supabase save_profile error: {e}")
            raise e
    else:
        return db_save_profile_sqlite(profile_id, profile_data)

def db_get_profile(profile_id: str) -> Optional[Dict[str, Any]]:
    if not settings.USE_LOCAL_FALLBACK and supabase_client:
        try:
            res = supabase_client.table("candidate_profiles").select("*").eq("id", profile_id).execute()
            if len(res.data) > 0:
                row = res.data[0]
                
                # Fetch skills mapping
                skills_res = supabase_client.table("candidate_skills").select("skill_name").eq("candidate_id", profile_id).execute()
                skills = [item["skill_name"] for item in skills_res.data]
                
                return {
                    "id": row["id"],
                    "full_name": row["name"],
                    "email": row["email"],
                    "phone": row["phone"],
                    "skills": skills,
                    "education": parse_json_field(row.get("education")),
                    "experience": parse_json_field(row.get("experience")),
                    "projects": parse_json_field(row.get("projects")),
                    "certifications": parse_json_field(row.get("certifications")),
                    "resume_url": row.get("resume_url")
                }
            return None
        except Exception as e:
            logger.error(f"Supabase get_profile error: {e}")
            raise e
    else:
        return db_get_profile_sqlite(profile_id)

def db_update_profile(profile_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    if not settings.USE_LOCAL_FALLBACK and supabase_client:
        try:
            payload = {
                "name": profile_data["full_name"],
                "email": profile_data["email"],
                "phone": profile_data.get("phone"),
                "education": profile_data.get("education", []),
                "experience": profile_data.get("experience", []),
                "projects": profile_data.get("projects", []),
                "certifications": profile_data.get("certifications", []),
                "resume_url": profile_data.get("resume_url")
            }
            supabase_client.table("candidate_profiles").update(payload).eq("id", profile_id).execute()
            
            # Map candidate skills to candidate_skills table
            supabase_client.table("candidate_skills").delete().eq("candidate_id", profile_id).execute()
            if profile_data.get("skills"):
                skills_payload = [
                    {"candidate_id": profile_id, "skill_name": s, "level": 3}
                    for s in profile_data["skills"]
                ]
                supabase_client.table("candidate_skills").insert(skills_payload).execute()
                
            return profile_data
        except Exception as e:
            logger.error(f"Supabase update_profile error: {e}")
            raise e
    else:
        return db_update_profile_sqlite(profile_id, profile_data)

def db_delete_profile(profile_id: str) -> bool:
    if not settings.USE_LOCAL_FALLBACK and supabase_client:
        try:
            supabase_client.table("candidate_skills").delete().eq("candidate_id", profile_id).execute()
            res = supabase_client.table("candidate_profiles").delete().eq("id", profile_id).execute()
            return len(res.data) > 0
        except Exception as e:
            logger.error(f"Supabase delete_profile error: {e}")
            raise e
    else:
        return db_delete_profile_sqlite(profile_id)

# --- Job CRUD ---
def db_save_job(job_id: str, job_data: Dict[str, Any]) -> Dict[str, Any]:
    if not settings.USE_LOCAL_FALLBACK and supabase_client:
        try:
            payload = {
                "id": job_id,
                "company": job_data["company"],
                "role": job_data["title"],
                "raw_text": job_data.get("description", ""),
                "file_url": job_data.get("file_url")
            }
            supabase_client.table("job_descriptions").upsert(payload).execute()
            
            # Map required and preferred skills to jd_skills table
            supabase_client.table("jd_skills").delete().eq("jd_id", job_id).execute()
            skills_payload = []
            if job_data.get("required_skills"):
                for s in job_data["required_skills"]:
                    skills_payload.append({"jd_id": job_id, "skill_name": s, "category": "Required"})
            if job_data.get("preferred_skills"):
                for s in job_data["preferred_skills"]:
                    skills_payload.append({"jd_id": job_id, "skill_name": s, "category": "Preferred"})
            if skills_payload:
                supabase_client.table("jd_skills").insert(skills_payload).execute()
                
            return job_data
        except Exception as e:
            logger.error(f"Supabase save_job error: {e}")
            raise e
    else:
        return db_save_job_sqlite(job_id, job_data)

def db_get_job(job_id: str) -> Optional[Dict[str, Any]]:
    if not settings.USE_LOCAL_FALLBACK and supabase_client:
        try:
            res = supabase_client.table("job_descriptions").select("*").eq("id", job_id).execute()
            if len(res.data) > 0:
                row = res.data[0]
                
                # Fetch skills mapping
                skills_res = supabase_client.table("jd_skills").select("skill_name, category").eq("jd_id", job_id).execute()
                required = [s["skill_name"] for s in skills_res.data if s["category"] == "Required"]
                preferred = [s["skill_name"] for s in skills_res.data if s["category"] == "Preferred"]
                if not required and skills_res.data:
                    required = [s["skill_name"] for s in skills_res.data]
                
                return {
                    "id": row["id"],
                    "title": row["role"],
                    "company": row["company"],
                    "required_skills": required,
                    "preferred_skills": preferred,
                    "experience_years_required": 3,
                    "description": row["raw_text"],
                    "file_url": row["file_url"]
                }
            return None
        except Exception as e:
            logger.error(f"Supabase get_job error: {e}")
            raise e
    else:
        return db_get_job_sqlite(job_id)

def db_update_job(job_id: str, job_data: Dict[str, Any]) -> Dict[str, Any]:
    if not settings.USE_LOCAL_FALLBACK and supabase_client:
        try:
            payload = {
                "company": job_data["company"],
                "role": job_data["title"],
                "raw_text": job_data.get("description", ""),
                "file_url": job_data.get("file_url")
            }
            supabase_client.table("job_descriptions").update(payload).eq("id", job_id).execute()
            
            # Map required and preferred skills to jd_skills table
            supabase_client.table("jd_skills").delete().eq("jd_id", job_id).execute()
            skills_payload = []
            if job_data.get("required_skills"):
                for s in job_data["required_skills"]:
                    skills_payload.append({"jd_id": job_id, "skill_name": s, "category": "Required"})
            if job_data.get("preferred_skills"):
                for s in job_data["preferred_skills"]:
                    skills_payload.append({"jd_id": job_id, "skill_name": s, "category": "Preferred"})
            if skills_payload:
                supabase_client.table("jd_skills").insert(skills_payload).execute()
                
            return job_data
        except Exception as e:
            logger.error(f"Supabase update_job error: {e}")
            raise e
    else:
        return db_update_job_sqlite(job_id, job_data)

def db_delete_job(job_id: str) -> bool:
    if not settings.USE_LOCAL_FALLBACK and supabase_client:
        try:
            supabase_client.table("jd_skills").delete().eq("jd_id", job_id).execute()
            res = supabase_client.table("job_descriptions").delete().eq("id", job_id).execute()
            return len(res.data) > 0
        except Exception as e:
            logger.error(f"Supabase delete_job error: {e}")
            raise e
    else:
        return db_delete_job_sqlite(job_id)

def db_get_all_jobs() -> List[Dict[str, Any]]:
    if not settings.USE_LOCAL_FALLBACK and supabase_client:
        try:
            res = supabase_client.table("job_descriptions").select("*").execute()
            jobs = []
            for row in res.data:
                # Fetch skills mapping
                skills_res = supabase_client.table("jd_skills").select("skill_name, category").eq("jd_id", row["id"]).execute()
                required = [s["skill_name"] for s in skills_res.data if s["category"] == "Required"]
                preferred = [s["skill_name"] for s in skills_res.data if s["category"] == "Preferred"]
                if not required and skills_res.data:
                    required = [s["skill_name"] for s in skills_res.data]
                    
                jobs.append({
                    "id": row["id"],
                    "title": row["role"] or "Job Posting",
                    "company": row["company"] or "Unknown Company",
                    "required_skills": required,
                    "preferred_skills": preferred,
                    "experience_years_required": 3,
                    "description": row["raw_text"] or "",
                    "file_url": row["file_url"]
                })
            return jobs
        except Exception as e:
            logger.error(f"Supabase get_all_jobs error: {e}")
            raise e
    else:
        return db_get_all_jobs_sqlite()

# --- Match Log CRUD ---
def db_save_match(match_data: Dict[str, Any]) -> Dict[str, Any]:
    match_id = match_data.get("id") or str(uuid.uuid4())
    if not settings.USE_LOCAL_FALLBACK and supabase_client:
        try:
            payload = {
                "id": match_id,
                "candidate_id": match_data.get("profile_id"),
                "jd_id": match_data.get("job_id"),
                "match_score": float(match_data["score"]),
                "matched_skills": match_data.get("matched_skills", []),
                "missing_skills": match_data.get("missing_skills", []),
                "recommendations": match_data.get("recommendations", [])
            }
            supabase_client.table("skill_match_results").upsert(payload).execute()
            return match_data
        except Exception as e:
            logger.error(f"Supabase save_match error: {e}")
            raise e
    else:
        return db_save_match_sqlite(match_id, match_data)

def db_get_matches_for_profile(profile_id: str) -> List[Dict[str, Any]]:
    if not settings.USE_LOCAL_FALLBACK and supabase_client:
        try:
            res = supabase_client.table("skill_match_results").select("*").eq("candidate_id", profile_id).execute()
            matches = []
            for row in res.data:
                matches.append({
                    "id": row["id"],
                    "profile_id": row["candidate_id"],
                    "job_id": row["jd_id"],
                    "score": row["match_score"],
                    "semantic_score": row["match_score"],
                    "experience_score": row["match_score"],
                    "projects_score": row["match_score"],
                    "matched_skills": row.get("matched_skills") or [],
                    "missing_skills": row.get("missing_skills") or [],
                    "recommendations": row.get("recommendations") or [],
                    "explanation": "Evaluated cloud match",
                    "report_url": None
                })
            return matches
        except Exception as e:
            logger.error(f"Supabase get_matches_for_profile error: {e}")
            raise e
    else:
        return db_get_matches_for_profile_sqlite(profile_id)

# --- LOCAL SQLITE IMPLEMENTATIONS (Only loaded when environment keys are absent) ---

def get_db_connection():
    db_path = settings.SQLITE_DB_PATH
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_sqlite_db():
    db_path = settings.SQLITE_DB_PATH
    db_dir = os.path.dirname(os.path.abspath(db_path))
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        skills TEXT,
        education TEXT,
        experience TEXT,
        projects TEXT,
        certifications TEXT,
        resume_url TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        required_skills TEXT,
        preferred_skills TEXT,
        experience_years_required INTEGER,
        description TEXT,
        file_url TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        profile_id TEXT,
        job_id TEXT,
        score REAL,
        semantic_score REAL,
        experience_score REAL,
        projects_score REAL,
        matched_skills TEXT,
        missing_skills TEXT,
        recommendations TEXT,
        explanation TEXT,
        report_url TEXT,
        FOREIGN KEY(profile_id) REFERENCES profiles(id),
        FOREIGN KEY(job_id) REFERENCES jobs(id)
    )
    """)
    conn.commit()
    conn.close()

# Initialize SQLite database immediately if fallback is enabled
if settings.USE_LOCAL_FALLBACK:
    logger.info("Initializing fallback SQLite DB structure...")
    init_sqlite_db()

def db_save_profile_sqlite(profile_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO profiles (id, full_name, email, phone, skills, education, experience, projects, certifications, resume_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            full_name=excluded.full_name,
            email=excluded.email,
            phone=excluded.phone,
            skills=excluded.skills,
            education=excluded.education,
            experience=excluded.experience,
            projects=excluded.projects,
            certifications=excluded.certifications,
            resume_url=excluded.resume_url
        """,
        (
            profile_id,
            profile_data["full_name"],
            profile_data["email"],
            profile_data.get("phone"),
            json.dumps(profile_data.get("skills", [])),
            json.dumps(profile_data.get("education", [])),
            json.dumps(profile_data.get("experience", [])),
            json.dumps(profile_data.get("projects", [])),
            json.dumps(profile_data.get("certifications", [])),
            profile_data.get("resume_url")
        )
    )
    conn.commit()
    conn.close()
    return profile_data

def db_get_profile_sqlite(profile_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "id": row["id"],
            "full_name": row["full_name"],
            "email": row["email"],
            "phone": row["phone"],
            "skills": json.loads(row["skills"]),
            "education": json.loads(row["education"]),
            "experience": json.loads(row["experience"]),
            "projects": json.loads(row["projects"]),
            "certifications": json.loads(row["certifications"]),
            "resume_url": row["resume_url"]
        }
    return None

def db_update_profile_sqlite(profile_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE profiles SET
            full_name = ?, email = ?, phone = ?, skills = ?, education = ?, 
            experience = ?, projects = ?, certifications = ?, resume_url = ?
        WHERE id = ?
        """,
        (
            profile_data["full_name"],
            profile_data["email"],
            profile_data.get("phone"),
            json.dumps(profile_data.get("skills", [])),
            json.dumps(profile_data.get("education", [])),
            json.dumps(profile_data.get("experience", [])),
            json.dumps(profile_data.get("projects", [])),
            json.dumps(profile_data.get("certifications", [])),
            profile_data.get("resume_url"),
            profile_id
        )
    )
    conn.commit()
    conn.close()
    return profile_data

def db_delete_profile_sqlite(profile_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM profiles WHERE id = ?", (profile_id,))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0

def db_save_job_sqlite(job_id: str, job_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO jobs (id, title, company, required_skills, preferred_skills, experience_years_required, description, file_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            title=excluded.title,
            company=excluded.company,
            required_skills=excluded.required_skills,
            preferred_skills=excluded.preferred_skills,
            experience_years_required=excluded.experience_years_required,
            description=excluded.description,
            file_url=excluded.file_url
        """,
        (
            job_id,
            job_data["title"],
            job_data["company"],
            json.dumps(job_data.get("required_skills", [])),
            json.dumps(job_data.get("preferred_skills", [])),
            job_data.get("experience_years_required", 0),
            job_data.get("description", ""),
            job_data.get("file_url")
        )
    )
    conn.commit()
    conn.close()
    return job_data

def db_get_job_sqlite(job_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "id": row["id"],
            "title": row["title"],
            "company": row["company"],
            "required_skills": json.loads(row["required_skills"]),
            "preferred_skills": json.loads(row["preferred_skills"]),
            "experience_years_required": row["experience_years_required"],
            "description": row["description"],
            "file_url": row["file_url"]
        }
    return None

def db_update_job_sqlite(job_id: str, job_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE jobs SET
            title = ?, company = ?, required_skills = ?, preferred_skills = ?, 
            experience_years_required = ?, description = ?, file_url = ?
        WHERE id = ?
        """,
        (
            job_data["title"],
            job_data["company"],
            json.dumps(job_data.get("required_skills", [])),
            json.dumps(job_data.get("preferred_skills", [])),
            job_data.get("experience_years_required", 0),
            job_data.get("description", ""),
            job_data.get("file_url"),
            job_id
        )
    )
    conn.commit()
    conn.close()
    return job_data

def db_delete_job_sqlite(job_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0

def db_get_all_jobs_sqlite() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs")
    rows = cursor.fetchall()
    conn.close()
    jobs = []
    for row in rows:
        jobs.append({
            "id": row["id"],
            "title": row["title"],
            "company": row["company"],
            "required_skills": json.loads(row["required_skills"]),
            "preferred_skills": json.loads(row["preferred_skills"]),
            "experience_years_required": row["experience_years_required"],
            "description": row["description"],
            "file_url": row["file_url"]
        })
    return jobs

def db_save_match_sqlite(match_id: str, match_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO matches (id, profile_id, job_id, score, semantic_score, experience_score, projects_score, matched_skills, missing_skills, recommendations, explanation, report_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            score=excluded.score,
            semantic_score=excluded.semantic_score,
            experience_score=excluded.experience_score,
            projects_score=excluded.projects_score,
            matched_skills=excluded.matched_skills,
            missing_skills=excluded.missing_skills,
            recommendations=excluded.recommendations,
            explanation=excluded.explanation,
            report_url=excluded.report_url
        """,
        (
            match_id,
            match_data.get("profile_id"),
            match_data.get("job_id"),
            match_data["score"],
            match_data["semantic_score"],
            match_data["experience_score"],
            match_data["projects_score"],
            json.dumps(match_data.get("matched_skills", [])),
            json.dumps(match_data.get("missing_skills", [])),
            json.dumps(match_data.get("recommendations", [])),
            match_data.get("explanation", ""),
            match_data.get("report_url")
        )
    )
    conn.commit()
    conn.close()
    return match_data

def db_get_matches_for_profile_sqlite(profile_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM matches WHERE profile_id = ?", (profile_id,))
    rows = cursor.fetchall()
    conn.close()
    matches = []
    for row in rows:
        matches.append({
            "id": row["id"],
            "profile_id": row["profile_id"],
            "job_id": row["job_id"],
            "score": row["score"],
            "semantic_score": row["semantic_score"],
            "experience_score": row["experience_score"],
            "projects_score": row["projects_score"],
            "matched_skills": json.loads(row["matched_skills"]),
            "missing_skills": json.loads(row["missing_skills"]),
            "recommendations": json.loads(row["recommendations"]),
            "explanation": row["explanation"],
            "report_url": row["report_url"]
        })
    return matches
