from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from shared.schemas import ResumeData, ProfileResponse
from shared.utils import (
    db_save_profile, db_get_profile, db_update_profile, db_delete_profile,
    logger, get_db_connection, settings, supabase_client
)
import uuid

router = APIRouter(prefix="/profile", tags=["Profile Builder"])

@router.post("", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(profile: ResumeData):
    """
    Creates or registers a candidate profile in the database.
    """
    try:
        profile_id = str(uuid.uuid4())
        profile_dict = profile.model_dump()
        db_save_profile(profile_id, profile_dict)
        logger.info(f"Successfully created profile for {profile.full_name} with ID: {profile_id}")
        profile_dict.pop("id", None)
        return ProfileResponse(id=profile_id, **profile_dict)
    except Exception as e:
        logger.error(f"Error creating profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while saving profile: {str(e)}"
        )

@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile(profile_id: str):
    """
    Retrieves a candidate profile by its unique ID.
    """
    try:
        profile_data = db_get_profile(profile_id)
        if not profile_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Profile with ID {profile_id} not found."
            )
        return ProfileResponse(**profile_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while retrieving the profile: {str(e)}"
        )

@router.put("/{profile_id}", response_model=ProfileResponse)
async def update_profile(profile_id: str, profile: ResumeData):
    """
    Updates an existing candidate profile in the database.
    """
    try:
        existing = db_get_profile(profile_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Profile with ID {profile_id} not found."
            )
        
        profile_dict = profile.model_dump()
        db_update_profile(profile_id, profile_dict)
        logger.info(f"Successfully updated profile with ID: {profile_id}")
        profile_dict.pop("id", None)
        return ProfileResponse(id=profile_id, **profile_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating profile: {str(e)}"
        )

@router.delete("/{profile_id}", status_code=status.HTTP_200_OK)
async def delete_profile(profile_id: str):
    """
    Deletes a candidate profile by its unique ID.
    """
    try:
        success = db_delete_profile(profile_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Profile with ID {profile_id} not found."
            )
        logger.info(f"Successfully deleted profile with ID: {profile_id}")
        return {"message": f"Profile {profile_id} deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting profile: {str(e)}"
        )

@router.get("", response_model=List[ProfileResponse])
async def list_profiles():
    """
    Lists all candidate profiles.
    """
    try:
        profiles = []
        if not settings.USE_LOCAL_FALLBACK and supabase_client:
            try:
                res = supabase_client.table("candidate_profiles").select("*").execute()
                from shared.utils import parse_json_field
                for row in res.data:
                    profile_id = row["id"]
                    skills = []
                    try:
                        skills_res = supabase_client.table("candidate_skills").select("skill_name").eq("candidate_id", profile_id).execute()
                        skills = [item["skill_name"] for item in skills_res.data]
                    except Exception as skill_err:
                        logger.error(f"Error reading skills: {skill_err}")
                        
                    profiles.append(ProfileResponse(
                        id=row["id"],
                        full_name=row["name"],
                        email=row["email"],
                        phone=row["phone"],
                        skills=skills,
                        education=parse_json_field(row.get("education")),
                        experience=parse_json_field(row.get("experience")),
                        projects=parse_json_field(row.get("projects")),
                        certifications=parse_json_field(row.get("certifications")),
                        resume_url=row.get("resume_url")
                    ))
                return profiles
            except Exception as e:
                logger.error(f"Supabase list_profiles error: {e}. Falling back.")
                
        # SQLite fallback
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM profiles")
        rows = cursor.fetchall()
        conn.close()
        
        import json
        for row in rows:
            profiles.append(ProfileResponse(
                id=row["id"],
                full_name=row["full_name"],
                email=row["email"],
                phone=row["phone"],
                skills=json.loads(row["skills"]),
                education=json.loads(row["education"]),
                experience=json.loads(row["experience"]),
                projects=json.loads(row["projects"]),
                certifications=json.loads(row["certifications"]),
                resume_url=row["resume_url"]
            ))
        return profiles
    except Exception as e:
        logger.error(f"Error listing profiles: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while listing profiles: {str(e)}"
        )
