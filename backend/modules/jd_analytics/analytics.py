import re
from typing import Dict, Any, List
from shared.schemas import JobDescriptionData
from shared.config import settings
from shared.utils import logger
from shared.constants import DEFAULT_SKILLS_TAXONOMY

# Import OpenAI / LangChain utilities
openai_llm = None
if settings.OPENAI_API_KEY and "placeholder" not in settings.OPENAI_API_KEY.lower():
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import PromptTemplate
        from langchain_core.output_parsers import JsonOutputParser
        
        openai_llm = ChatOpenAI(
            model=settings.OPENAI_MODEL_NAME,
            openai_api_key=settings.OPENAI_API_KEY,
            temperature=0.0
        )
        logger.info("LangChain ChatOpenAI successfully initialized for Job Description Analytics.")
    except Exception as e:
        logger.error(f"Error initializing LangChain ChatOpenAI for JD Analytics: {e}")

class JDAnalytics:
    def parse_job_description(self, raw_text: str) -> JobDescriptionData:
        """
        Parses raw job description text and converts to structured JobDescriptionData.
        """
        if not raw_text.strip():
            return JobDescriptionData(
                title="Software Engineer",
                company="Unknown Company",
                required_skills=["Python"],
                preferred_skills=["Docker"],
                experience_years_required=0,
                description=""
            )
            
        if openai_llm is not None:
            try:
                from langchain_core.output_parsers import JsonOutputParser
                from langchain_core.prompts import PromptTemplate
                
                parser = JsonOutputParser(pydantic_object=JobDescriptionData)
                
                prompt_template = """
                You are an advanced talent acquisition AI. Analyze the following raw Job Description text and extract structure information matching the requested schema.
                
                Raw Job Description:
                {raw_text}
                
                Format Instructions:
                {format_instructions}
                
                Ensure the fields:
                - title (string)
                - company (string)
                - required_skills (list of strings)
                - preferred_skills (list of strings)
                - experience_years_required (integer)
                - description (string)
                
                Extract years of experience as an integer. If a range is provided, extract the lower bound.
                """
                prompt = PromptTemplate(
                    template=prompt_template,
                    input_variables=["raw_text"],
                    partial_variables={"format_instructions": parser.get_format_instructions()}
                )
                
                chain = prompt | openai_llm | parser
                parsed_json = chain.invoke({"raw_text": raw_text})
                
                # Coerce and construct Pydantic object
                return JobDescriptionData(**parsed_json)
                
            except Exception as e:
                logger.error(f"LLM Job Description parsing failed: {e}. Falling back to regex local parsing.")

        # Fallback local regex parsing
        return self._local_regex_parse(raw_text)

    def _local_regex_parse(self, text: str) -> JobDescriptionData:
        """
        Fallback parser that extracts title, company, experience years, and searches for skills.
        """
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        # Guess title and company from first few lines
        title = "Software Engineer"
        company = "Radix Platform"
        if lines:
            title_guess = lines[0]
            if len(title_guess.split()) <= 5:
                title = title_guess
            if len(lines) > 1:
                company_guess = lines[1]
                if "company" in company_guess.lower() or "inc" in company_guess.lower() or "llc" in company_guess.lower() or len(company_guess.split()) <= 4:
                    company = company_guess.replace("Company:", "").replace("About", "").strip()

        # Guess years of experience
        exp_years = 0
        exp_matches = re.findall(r'(\d+)\+?\s*(?:year|yr)s?\s*(?:of)?\s*(?:experience|exp)', text.lower())
        if exp_matches:
            try:
                exp_years = int(exp_matches[0])
            except ValueError:
                pass
                
        # Tag skills based on taxonomy
        req_skills = []
        pref_skills = []
        
        # Divide taxonomy skills based on text placement
        # If the word "preferred" or "nice to have" appears after a skill, put it in preferred, else required
        text_lower = text.lower()
        preferred_sections = ["preferred", "nice to have", "plus", "bonus", "desired", "advatange"]
        
        for skill in DEFAULT_SKILLS_TAXONOMY:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            match = re.search(pattern, text_lower)
            if match:
                # Find context window around match
                start = max(0, match.start() - 60)
                end = min(len(text_lower), match.end() + 60)
                context = text_lower[start:end]
                
                if any(kw in context for kw in preferred_sections):
                    pref_skills.append(skill)
                else:
                    req_skills.append(skill)
                    
        # Ensure at least some default required skills
        if not req_skills:
            req_skills = ["Python", "SQL"]
            
        return JobDescriptionData(
            title=title,
            company=company,
            required_skills=req_skills,
            preferred_skills=pref_skills,
            experience_years_required=exp_years,
            description=text
        )

jd_analytics = JDAnalytics()
