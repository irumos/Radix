import pytest
from fastapi.testclient import TestClient
import sys
import os

# Adjust path to import local packages
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from shared.schemas import ResumeData, JobDescriptionData
from modules.skill_match.matcher import skill_matcher
from modules.talent_check.checker import talent_checker

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_similarity_exact():
    # Exact match should yield 1.0
    score = skill_matcher.compute_similarity("python", "python")
    assert score == 1.0

def test_similarity_case_insensitive():
    # Case differences should yield 1.0
    score = skill_matcher.compute_similarity("Python", "python")
    assert score == 1.0

def test_similarity_dissimilar():
    # Distinct terms should return lower values
    score = skill_matcher.compute_similarity("AWS", "Cooking")
    assert score < 0.4

def test_scoring_logic():
    # Test overall calculations
    profile = ResumeData(
        full_name="Alice Candidate",
        email="alice@test.com",
        skills=["Python", "FastAPI"],
        education=[],
        experience=[],
        projects=[],
        certifications=[]
    )
    
    job = JobDescriptionData(
        title="Python API Specialist",
        company="Vantage Tech",
        required_skills=["Python", "FastAPI", "Docker"],
        preferred_skills=[],
        experience_years_required=0,
        description="Looking for python fastapi skills"
    )
    
    match_result = talent_checker.compute_match(profile, job)
    # Candidate matches 2 out of 3 required skills (Python, FastAPI)
    assert "Python" in match_result.matched_skills
    assert "FastAPI" in match_result.matched_skills
    assert "Docker" in match_result.missing_skills
    assert match_result.semantic_score == pytest.approx(66.66, 0.1)
