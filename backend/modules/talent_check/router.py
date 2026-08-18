from fastapi import APIRouter, HTTPException, status
from typing import Optional
from shared.schemas import MatchRequest, MatchResponse, ResumeData, JobDescriptionData
from shared.utils import db_get_profile, db_get_job, db_save_match, logger
from modules.talent_check.checker import talent_checker
import uuid

router = APIRouter(prefix="", tags=["Talent Check & Matching"])

@router.post("/match", response_model=MatchResponse, status_code=status.HTTP_200_OK)
async def perform_matching(payload: MatchRequest):
    """
    Performs skill gap analysis, calculations, and explanations.
    Can match existing DB entries using 'profile_id' and 'job_id', or evaluate raw payloads.
    """
    profile: Optional[ResumeData] = None
    job: Optional[JobDescriptionData] = None
    
    # 1. Fetch from DB if IDs are provided
    if payload.profile_id and payload.job_id:
        try:
            profile_dict = db_get_profile(payload.profile_id)
            job_dict = db_get_job(payload.job_id)
            
            if not profile_dict:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Candidate profile ID '{payload.profile_id}' not found."
                )
            if not job_dict:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Job posting ID '{payload.job_id}' not found."
                )
                
            # Convert dictionary data to Pydantic objects
            profile = ResumeData(**profile_dict)
            job = JobDescriptionData(**job_dict)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error reading match sources from DB: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database lookup error during matching: {str(e)}"
            )
            
    # 2. Otherwise use raw payload data
    else:
        profile = payload.profile_data
        job = payload.job_data
        
    if not profile or not job:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either ('profile_id' and 'job_id') or both ('profile_data' and 'job_data') objects."
        )
        
    try:
        logger.info(f"Computing match between candidate {profile.full_name} and job {job.title}")
        match_result = talent_checker.compute_match(profile, job)
        
        # Compile match report
        recs_str = "\n".join(f"* {rec}" for rec in match_result.recommendations)
        report_content = f"""# Talent Match Report
## Candidate: {profile.full_name} ({profile.email})
## Target Role: {job.title} at {job.company}

### Match Summary
* **Overall Match Compatibility**: {match_result.score}%
* **Semantic Skills Index**: {match_result.semantic_score}%
* **Professional Experience Depth**: {match_result.experience_score}%
* **Projects & Credentials Relevance**: {match_result.projects_score}%

### Skill Set Alignment
* **Matched Skills**: {", ".join(match_result.matched_skills) if match_result.matched_skills else "None"}
* **Missing Gaps**: {", ".join(match_result.missing_skills) if match_result.missing_skills else "None"}

### Recruiter Action Strategy
{recs_str}

### AI Recruiting Analyst Explanation
"{match_result.explanation}"
"""
        # Save matching report locally as temporary file and upload
        import tempfile
        import os
        from shared.utils import db_upload_file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".md", mode="w", encoding="utf-8") as temp_file:
            temp_file.write(report_content)
            temp_path = temp_file.name
            
        try:
            destination_name = f"report_{uuid.uuid4()}.md"
            report_url = db_upload_file("generated-reports", temp_path, destination_name)
            match_result.report_url = report_url
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

        # Save matching result if DB references exist
        if payload.profile_id and payload.job_id:
            match_record = match_result.model_dump()
            match_record["id"] = str(uuid.uuid4())
            match_record["profile_id"] = payload.profile_id
            match_record["job_id"] = payload.job_id
            match_record["report_url"] = report_url
            
            db_save_match(match_record)
            logger.info(f"Saved matching results to database for profiling.")
            
        return match_result
        
    except Exception as e:
        logger.error(f"Error running match logic: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while computing similarity match: {str(e)}"
        )
