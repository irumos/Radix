from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from contextlib import asynccontextmanager
from shared.config import settings
from shared.utils import logger, db_save_job
from modules.resume_parser.router import router as resume_router
from modules.jd_analytics.router import router as jd_router
from modules.profile_builder.router import router as profile_router
from modules.talent_check.router import router as match_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Database Seeding
    logger.info("Application startup: seeding database with default job profiles...")
    mock_jobs = [
        {
            "id": "00000000-0000-0000-0000-000000000001",
            "title": "Full Stack Python Developer",
            "company": "Radix Innovations",
            "required_skills": ["Python", "React", "FastAPI", "SQL"],
            "preferred_skills": ["Docker", "AWS", "Tailwind CSS"],
            "experience_years_required": 3,
            "description": "Looking for a senior full stack developer with experience in Python and FastAPI."
        },
        {
            "id": "00000000-0000-0000-0000-000000000002",
            "title": "Machine Learning Engineer",
            "company": "Radix AI Labs",
            "required_skills": ["Python", "Machine Learning", "PyTorch", "NLP"],
            "preferred_skills": ["Deep Learning", "Docker", "Google Cloud"],
            "experience_years_required": 4,
            "description": "Build neural networks and state of the art recommendation systems."
        }
    ]
    for job in mock_jobs:
        try:
            db_save_job(job["id"], job)
            logger.info(f"Successfully seeded mock job: {job['title']} ({job['id']})")
        except Exception as e:
            logger.error(f"Error seeding mock job {job['id']}: {e}")
    yield
    # Shutdown logic (no active resources need manual closing)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade AI-powered Talent Match Platform for RADIX Hackathon",
    version="1.0.0",
    lifespan=lifespan
)

# Setup CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production deploy
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files folder for local-first storage fallback
static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(static_path, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_path), name="static")

# Include modules under the shared API prefix
app.include_router(resume_router, prefix=settings.API_V1_STR)
app.include_router(jd_router, prefix=settings.API_V1_STR)
app.include_router(profile_router, prefix=settings.API_V1_STR)
app.include_router(match_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
async def read_root():
    return {
        "message": "Welcome to the Talent Match Platform API",
        "status": "healthy",
        "database_mode": "Local SQLite Database" if settings.USE_LOCAL_FALLBACK else "Cloud Supabase Service"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
