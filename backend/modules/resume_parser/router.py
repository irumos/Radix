import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from shared.schemas import ResumeData
from shared.utils import logger
from modules.resume_parser.parser import resume_parser

router = APIRouter(prefix="/parser", tags=["Resume Parser"])

@router.post("/resume", response_model=ResumeData, status_code=status.HTTP_200_OK)
async def parse_resume_upload(file: UploadFile = File(...)):
    """
    Upload a resume PDF and parse it into structured JSON matching the ResumeData schema.
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
        # Create a temporary file to store the upload content safely with correct suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
            
        try:
            logger.info(f"Parsing uploaded resume: {file.filename}")
            parsed_data = resume_parser.parse_resume(temp_path)
            
            # Upload PDF resume to Supabase Storage
            from shared.utils import db_upload_file, db_save_profile
            import uuid
            destination_name = f"{uuid.uuid4()}_{file.filename}"
            resume_url = db_upload_file("resume-files", temp_path, destination_name)
            parsed_data.resume_url = resume_url
            
            # Automatically save parsing result into database
            profile_id = str(uuid.uuid4())
            parsed_data.id = profile_id
            db_save_profile(profile_id, parsed_data.model_dump())
            logger.info(f"Automatically saved parsed candidate {parsed_data.full_name} to database.")
            
            return parsed_data
        finally:
            # Clean up the temp file after processing
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        logger.error(f"Error parsing resume upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while parsing the resume: {str(e)}"
        )
