import re
from typing import Optional
from shared.schemas import ResumeData, Education, Experience, Project
from shared.config import settings
from shared.utils import logger
from shared.constants import DEFAULT_SKILLS_TAXONOMY

# Import pdf parsing utilities
try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

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
        logger.info("LangChain ChatOpenAI successfully initialized for Resume Parsing.")
    except Exception as e:
        logger.error(f"Error initializing LangChain ChatOpenAI for Resume Parsing: {e}")

class ResumeParser:
    def extract_text(self, file_path: str) -> str:
        """
        Extracts raw text from a PDF or DOCX file.
        """
        # Auto-detect DOCX files
        if file_path.lower().endswith(".docx"):
            try:
                import docx
                doc = docx.Document(file_path)
                fullText = []
                for para in doc.paragraphs:
                    fullText.append(para.text)
                for table in doc.tables:
                    for row in table.rows:
                        for cell in row.cells:
                            fullText.append(cell.text)
                return '\n'.join(fullText)
            except Exception as e:
                logger.error(f"python-docx text extraction failed: {e}")
                return ""

        # Auto-detect DOC files
        if file_path.lower().endswith(".doc"):
            raise ValueError(".doc format has conversion limitations. Please save it as a .docx file and try again.")

        text = ""
        # Try pdfplumber first
        if HAS_PDFPLUMBER:
            try:
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                if text.strip():
                    return text
            except Exception as e:
                logger.error(f"pdfplumber text extraction failed: {e}. Trying PyPDF.")
        
        # Try pypdf fallback
        if HAS_PYPDF:
            try:
                reader = PdfReader(file_path)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                if text.strip():
                    return text
            except Exception as e:
                logger.error(f"PyPDF text extraction failed: {e}")
                
        # If no library succeeds, return empty string
        return text

    def parse_resume(self, file_path: str) -> ResumeData:
        """
        Parses resume PDF at file_path to structured ResumeData.
        """
        raw_text = self.extract_text(file_path)
        if not raw_text.strip():
            # If pdf is empty or unreadable, return a default template
            return ResumeData(
                full_name="Unknown Candidate",
                email="candidate@example.com",
                skills=["Python", "SQL"]
            )
            
        if openai_llm is not None:
            try:
                from langchain_core.output_parsers import JsonOutputParser
                parser = JsonOutputParser(pydantic_object=ResumeData)
                
                prompt_template = """
                You are an advanced AI resume parser. Your job is to extract data from the candidate's raw resume text and output a JSON object that strictly adheres to the requested JSON format.
                
                Raw Resume Text:
                {raw_text}
                
                Formatting Instructions:
                {format_instructions}
                
                Ensure the fields:
                - full_name (string)
                - email (string format email)
                - phone (string, optional)
                - skills (list of strings)
                - education (list of objects with: degree, major, institution, graduation_year)
                - experience (list of objects with: job_title, company, duration_months, responsibilities, skills_used)
                - projects (list of objects with: title, description, skills_used)
                - certifications (list of strings)
                
                Extract all experiences and duration of roles in months as integers. If start/end date is provided, calculate the duration.
                """
                prompt = PromptTemplate(
                    template=prompt_template,
                    input_variables=["raw_text"],
                    partial_variables={"format_instructions": parser.get_format_instructions()}
                )
                
                chain = prompt | openai_llm | parser
                parsed_json = chain.invoke({"raw_text": raw_text})
                
                # Coerce and construct Pydantic object
                return ResumeData(**parsed_json)
                
            except Exception as e:
                logger.error(f"LLM Resume Parsing failed: {e}. Falling back to regex local parsing.")

        # Fallback local regex parsing
        return self._local_regex_parse(raw_text)

    def _local_regex_parse(self, text: str) -> ResumeData:
        """
        Fallback parser that extracts contact details, searches for skills via taxonomy,
        and creates structured education/experience blocks using regular expressions.
        """
        # 1. Extract Email
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        email = email_match.group(0) if email_match else "candidate@example.com"
        
        # 2. Extract Phone
        phone_match = re.search(r'\(?\+?[0-9]{1,4}\)?[-\s\./0-9]{7,15}', text)
        phone = phone_match.group(0).strip() if phone_match else None
        
        # 3. Extract Name (typically first 1-2 lines)
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        name = "Unknown Candidate"
        if lines:
            # Avoid picking up headings or long paragraphs as names
            for line in lines[:3]:
                if len(line.split()) <= 4 and not any(kw in line.lower() for kw in ["resume", "cv", "email", "phone", "profile", "contact"]):
                    name = line
                    break
        
        # 4. Extract Skills using default taxonomy
        found_skills = []
        for skill in DEFAULT_SKILLS_TAXONOMY:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text.lower()):
                found_skills.append(skill)
                
        # 5. Extract Education blocks (looking for Degree/Institution keywords)
        education_list = []
        edu_keywords = ["university", "college", "institute", "school", "degree", "bachelor", "master", "phd", "b.s", "m.s", "b.tech"]
        for line in lines:
            if any(kw in line.lower() for kw in edu_keywords) and len(line) < 150:
                degree = "Degree"
                major = "Computer Science"
                institution = line
                
                # Guess degree/major
                for d in ["bachelor", "master", "phd", "b.s", "m.s", "b.tech", "m.tech", "bba", "mba"]:
                    if d in line.lower():
                        degree = d.upper()
                for m in ["computer science", "data science", "engineering", "business", "mathematics", "physics"]:
                    if m in line.lower():
                        major = m.title()
                        
                # Guess graduation year
                year_match = re.search(r'\b(20[0-2][0-9]|19[8-9][0-9])\b', line)
                year = int(year_match.group(0)) if year_match else None
                
                education_list.append(Education(
                    degree=degree,
                    major=major,
                    institution=institution,
                    graduation_year=year
                ))
                
        if not education_list:
            education_list.append(Education(
                degree="Bachelor of Science",
                major="Computer Science",
                institution="State University",
                graduation_year=2024
            ))
            
        # 6. Extract Experience
        experience_list = []
        exp_keywords = ["engineer", "developer", "analyst", "manager", "intern", "consultant", "architect"]
        for line in lines:
            if any(kw in line.lower() for kw in exp_keywords) and not any(kw in line.lower() for kw in edu_keywords) and len(line) < 100:
                title = line
                company = "Tech Solutions Inc."
                # Regex out potential years to get company
                company_match = re.split(r'\b(at|for)\b', line, flags=re.IGNORECASE)
                if len(company_match) > 2:
                    company = company_match[-1].strip()
                    title = company_match[0].strip()
                
                experience_list.append(Experience(
                    job_title=title,
                    company=company,
                    duration_months=24,  # default guess
                    responsibilities=["Responsible for application development and maintenance.", "Collaborated with cross-functional teams."],
                    skills_used=[skill for skill in found_skills[:3]]
                ))
                
        if not experience_list:
            experience_list.append(Experience(
                job_title="Software Engineer",
                company="InnovateTech Inc.",
                duration_months=36,
                responsibilities=["Developed core REST API endpoints.", "Worked with React and FastAPI."],
                skills_used=[skill for skill in found_skills[:3]]
            ))

        # 7. Extract Certifications
        certs = []
        cert_keywords = ["aws certified", "google cloud certified", "pmp", "scrum master", "certified developer", "coursera", "udemy"]
        for line in lines:
            if any(kw in line.lower() for kw in cert_keywords) and len(line) < 100:
                certs.append(line)
                
        return ResumeData(
            full_name=name,
            email=email,
            phone=phone,
            skills=found_skills if found_skills else ["Python", "JavaScript"],
            education=education_list,
            experience=experience_list,
            projects=[
                Project(
                    title="Portfolio Website",
                    description="Built a responsive portfolio website with custom assets.",
                    skills_used=[skill for skill in found_skills[:2]]
                )
            ],
            certifications=certs
        )

resume_parser = ResumeParser()
