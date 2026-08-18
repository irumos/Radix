from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class Education(BaseModel):
    degree: str
    major: str
    institution: str
    graduation_year: Optional[int] = None

class Experience(BaseModel):
    job_title: str
    company: str
    duration_months: int
    responsibilities: List[str] = Field(default_factory=list)
    skills_used: List[str] = Field(default_factory=list)

class Project(BaseModel):
    title: str
    description: str
    skills_used: List[str] = Field(default_factory=list)

class ResumeData(BaseModel):
    id: Optional[str] = None
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)
    experience: List[Experience] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    resume_url: Optional[str] = None

class JobDescriptionData(BaseModel):
    title: str
    company: str
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    experience_years_required: int = 0
    description: str
    file_url: Optional[str] = None

class MatchRequest(BaseModel):
    profile_id: Optional[str] = None
    job_id: Optional[str] = None
    # Alternatively, direct comparison using raw payload objects:
    profile_data: Optional[ResumeData] = None
    job_data: Optional[JobDescriptionData] = None

class MatchResponse(BaseModel):
    profile_id: Optional[str] = None
    job_id: Optional[str] = None
    score: float
    semantic_score: float
    experience_score: float
    projects_score: float
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    explanation: str
    report_url: Optional[str] = None

class ProfileResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    skills: List[str]
    education: List[Education]
    experience: List[Experience]
    projects: List[Project]
    certifications: List[str]
    resume_url: Optional[str] = None

class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    required_skills: List[str]
    preferred_skills: List[str]
    experience_years_required: int
    description: str
    file_url: Optional[str] = None
