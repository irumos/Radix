from typing import Dict, Any, List
from shared.schemas import ResumeData, JobDescriptionData, MatchResponse
from shared.constants import (
    SCORING_WEIGHT_SEMANTIC,
    SCORING_WEIGHT_EXPERIENCE,
    SCORING_WEIGHT_PROJECTS,
    FALLBACK_MATCH_RECOMMENDATIONS
)
from shared.config import settings
from shared.utils import logger
from modules.skill_match.matcher import skill_matcher

# Conditional LangChain Setup
openai_llm = None
if settings.OPENAI_API_KEY and "placeholder" not in settings.OPENAI_API_KEY.lower():
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import PromptTemplate
        openai_llm = ChatOpenAI(
            model=settings.OPENAI_MODEL_NAME,
            openai_api_key=settings.OPENAI_API_KEY,
            temperature=0.2
        )
        logger.info("LangChain ChatOpenAI successfully initialized for match explanations.")
    except Exception as e:
        logger.error(f"Error initializing LangChain ChatOpenAI: {e}. Fallback explanations will be used.")

class TalentChecker:
    def compute_match(self, profile: ResumeData, job: JobDescriptionData) -> MatchResponse:
        """
        Calculates match score between candidate profile and job description.
        Formula:
            (Semantic Skill Score * 0.50) + (Experience Score * 0.30) + (Projects Score * 0.20)
        """
        # 1. Semantic Skill Score
        candidate_skills = profile.skills
        required_skills = job.required_skills
        preferred_skills = job.preferred_skills
        
        matched_req, missing_req = skill_matcher.match_skills(candidate_skills, required_skills)
        matched_pref, missing_pref = skill_matcher.match_skills(candidate_skills, preferred_skills)
        
        if required_skills:
            semantic_score = (len(matched_req) / len(required_skills)) * 100.0
        else:
            semantic_score = 100.0
            
        # 2. Experience Score
        total_months = sum(exp.duration_months for exp in profile.experience)
        candidate_years = total_months / 12.0
        required_years = job.experience_years_required
        
        if required_years <= 0:
            exp_score = 100.0
        else:
            exp_score = min(100.0, (candidate_years / required_years) * 100.0)
            
        # 3. Projects and Certifications Score
        proj_score_val = 0.0
        if required_skills:
            # Extract skills used in candidate projects
            project_skills = set()
            for proj in profile.projects:
                for skill in proj.skills_used:
                    project_skills.add(skill.lower())
            
            matched_proj_skills, _ = skill_matcher.match_skills(list(project_skills), required_skills)
            proj_match_ratio = len(matched_proj_skills) / len(required_skills) if required_skills else 1.0
            proj_score_val += proj_match_ratio * 70.0
            
        # Certification bonus
        cert_bonus = len(profile.certifications) * 15.0
        proj_score_val = min(100.0, proj_score_val + cert_bonus)
        
        if not required_skills and not profile.projects:
            proj_score_val = 100.0
            
        # Total Score
        total_score = (
            (semantic_score * SCORING_WEIGHT_SEMANTIC) +
            (exp_score * SCORING_WEIGHT_EXPERIENCE) +
            (proj_score_val * SCORING_WEIGHT_PROJECTS)
        )
        total_score = round(total_score, 2)
        
        # Recommendations
        recommendations = []
        for missing in missing_req:
            recommendations.append(f"Add projects or certifications demonstrating expertise in '{missing}', which is a required skill.")
        for missing in missing_pref:
            recommendations.append(f"Consider learning '{missing}' to enhance fit for the role.")
            
        if not recommendations:
            recommendations.append("The profile is an excellent technical match for all job specifications. Focus on highlighting leadership in these areas.")
            
        # Explanation
        explanation = self.generate_explanation(profile, job, total_score, matched_req, missing_req, candidate_years, required_years)
        
        return MatchResponse(
            score=total_score,
            semantic_score=round(semantic_score, 2),
            experience_score=round(exp_score, 2),
            projects_score=round(proj_score_val, 2),
            matched_skills=matched_req,
            missing_skills=missing_req,
            recommendations=recommendations[:5],
            explanation=explanation
        )
        
    def generate_explanation(self, profile: ResumeData, job: JobDescriptionData, score: float, 
                             matched_req: List[str], missing_req: List[str], 
                             cand_years: float, req_years: int) -> str:
        
        if openai_llm is not None:
            try:
                from langchain_core.prompts import PromptTemplate
                prompt_template = """
                You are a senior recruiter and talent acquisition specialist.
                Provide a professional and constructive candidate matching explanation based on the matching results.
                
                Job Description:
                - Title: {job_title}
                - Required Skills: {req_skills}
                - Experience Required: {req_years} years
                
                Candidate Profile:
                - Name: {cand_name}
                - Skills: {cand_skills}
                - Total Experience: {cand_years:.1f} years
                
                Matching Metrics:
                - Overall Match Score: {score}%
                - Matched Required Skills: {matched_req}
                - Missing Required Skills: {missing_req}
                
                Write a concise, professional paragraph explaining the compatibility of the candidate, highlighting key strengths and major skill gaps.
                """
                prompt = PromptTemplate(
                    input_variables=["job_title", "req_skills", "req_years", "cand_name", "cand_skills", "cand_years", "score", "matched_req", "missing_req"],
                    template=prompt_template
                )
                formatted_prompt = prompt.format(
                    job_title=job.title,
                    req_skills=", ".join(job.required_skills),
                    req_years=job.experience_years_required,
                    cand_name=profile.full_name,
                    cand_skills=", ".join(profile.skills),
                    cand_years=cand_years,
                    score=score,
                    matched_req=", ".join(matched_req),
                    missing_req=", ".join(missing_req)
                )
                response = openai_llm.invoke(formatted_prompt)
                return response.content.strip()
            except Exception as e:
                logger.error(f"Failed to generate LLM explanation via LangChain: {e}. Falling back to template explanation.")
                
        # Rule-based fallback explanation
        matched_str = ", ".join(matched_req) if matched_req else "None"
        missing_str = ", ".join(missing_req) if missing_req else "None"
        
        explanation = (
            f"The candidate {profile.full_name} has a matching score of {score}% for the {job.title} position at {job.company}. "
            f"They possess {cand_years:.1f} years of professional experience compared to the required {req_years} years. "
            f"Key matching skills identified include: {matched_str}. "
            f"However, key skill gaps were detected in: {missing_str}. "
        )
        if score >= 80:
            explanation += "The candidate is a strong fit for this position and should be fast-tracked to the interview stage."
        elif score >= 50:
            explanation += "The candidate is a moderate fit. They have the foundational skills but would require training to close specific gaps."
        else:
            explanation += "The candidate lacks several core requirements and is not recommended for this specific role without substantial skill development."
            
        return explanation

talent_checker = TalentChecker()
