from fastapi import APIRouter, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
import tempfile
import os
import uuid
from shared.schemas import JobDescriptionData, JobResponse
from shared.utils import (
    logger, db_save_job, db_get_all_jobs, db_get_job, db_update_job, db_delete_job,
    db_upload_file
)
from modules.jd_analytics.analytics import jd_analytics

router = APIRouter(prefix="/jd", tags=["Job Description Analytics"])

class JDAnalysisRequest(BaseModel):
    description: str
    title: Optional[str] = None
    company: Optional[str] = None

@router.post("/analyze", response_model=JobResponse, status_code=status.HTTP_200_OK)
async def analyze_jd(payload: JDAnalysisRequest):
    """
    Parses a raw job description string and returns structured JobResponse containing the job ID.
    Saves the analyzed job to the database for subsequent profile matching.
    """
    if not payload.description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text cannot be empty."
        )
        
    try:
        logger.info("Analyzing job description...")
        parsed_data = jd_analytics.parse_job_description(payload.description)
        
        # Override values if user provided them explicitly
        if payload.title:
            parsed_data.title = payload.title
        if payload.company:
            parsed_data.company = payload.company
            
        # Automatically save job to the database to match on frontend dashboard
        job_id = str(uuid.uuid4())
        job_dict = parsed_data.model_dump()
        db_save_job(job_id, job_dict)
        logger.info(f"Saved parsed job description to database with ID: {job_id}")
        
        return JobResponse(id=job_id, **job_dict)
    except Exception as e:
        logger.error(f"Error analyzing job description: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while analyzing the job description: {str(e)}"
        )

@router.post("/upload", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def upload_jd_file(file: UploadFile = File(...)):
    """
    Upload a job description PDF, extract its contents, upload PDF to Supabase Storage,
    and return structured JobResponse containing the PDF file URL.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".docx", ".doc"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF, DOC, and DOCX files are supported."
        )
    
    if ext == ".doc":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=".doc format has conversion limitations. Please save it as a .docx file and try again."
        )
        
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
            
        try:
            from modules.resume_parser.parser import resume_parser
            raw_text = resume_parser.extract_text(temp_path)
            
            if not raw_text.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Job description PDF has no extractable text."
                )
                
            parsed_data = jd_analytics.parse_job_description(raw_text)
            
            # Upload PDF to storage
            destination_name = f"{uuid.uuid4()}_{file.filename}"
            file_url = db_upload_file("jd-files", temp_path, destination_name)
            parsed_data.file_url = file_url
            
            # Save to Database
            job_id = str(uuid.uuid4())
            job_dict = parsed_data.model_dump()
            db_save_job(job_id, job_dict)
            
            return JobResponse(id=job_id, **job_dict)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing uploaded job description: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while parsing the uploaded job description: {str(e)}"
        )

@router.get("", response_model=List[JobResponse], status_code=status.HTTP_200_OK)
async def list_jobs():
    """
    Lists all job postings saved in the database.
    """
    try:
        jobs_data = db_get_all_jobs()
        return [JobResponse(**job) for job in jobs_data]
    except Exception as e:
        logger.error(f"Error listing jobs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while listing job descriptions: {str(e)}"
        )

@router.put("/{job_id}", response_model=JobResponse)
async def update_job(job_id: str, job: JobDescriptionData):
    """
    Updates an existing job description in the database.
    """
    try:
        existing = db_get_job(job_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job description with ID {job_id} not found."
            )
        job_dict = job.model_dump()
        db_update_job(job_id, job_dict)
        logger.info(f"Successfully updated job description with ID: {job_id}")
        return JobResponse(id=job_id, **job_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating job description: {str(e)}"
        )

@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
async def delete_job(job_id: str):
    """
    Deletes a job description by its unique ID.
    """
    try:
        success = db_delete_job(job_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job description with ID {job_id} not found."
            )
        logger.info(f"Successfully deleted job description with ID: {job_id}")
        return {"message": f"Job {job_id} deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting job description: {str(e)}"
        )
