# API Endpoints Contract

All endpoints are prefixed with `/api` by default and serve JSON payloads.

---

## 1. Resume Parser

### `POST /api/parser/resume`
Parses candidate PDF files into structured JSON matching the profile schema.

* **Request**: `multipart/form-data` with `file` field containing a PDF document.
* **Response**: `200 OK`
  ```json
  {
    "full_name": "John Doe",
    "email": "johndoe@example.com",
    "phone": "+1-555-0199",
    "skills": ["Python", "React", "FastAPI"],
    "education": [
      {
        "degree": "Bachelor of Science",
        "major": "Computer Science",
        "institution": "Stanford University",
        "graduation_year": 2022
      }
    ],
    "experience": [
      {
        "job_title": "Software Engineer",
        "company": "Tech Corp",
        "duration_months": 24,
        "responsibilities": ["Developed backend REST APIs", "Worked on performance scaling"],
        "skills_used": ["Python", "FastAPI"]
      }
    ],
    "projects": [
      {
        "title": "E-Commerce Backend",
        "description": "Built high-performance cart API",
        "skills_used": ["FastAPI", "SQL"]
      }
    ],
    "certifications": ["AWS Certified Solutions Architect"]
  }
  ```

---

## 2. Job Description Analytics

### `POST /api/jd/analyze`
Extracts structured role requirements, target skill sets, and desired experience from a raw JD text dump.

* **Request**: `application/json`
  ```json
  {
    "description": "We are looking for a Python engineer with 3 years of experience. Experience with React and Docker is a plus.",
    "title": "Backend Developer",
    "company": "Radix Tech"
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "title": "Backend Developer",
    "company": "Radix Tech",
    "required_skills": ["Python"],
    "preferred_skills": ["React", "Docker"],
    "experience_years_required": 3,
    "description": "We are looking for a Python engineer..."
  }
  ```

---

## 3. Profile Builder CRUD

### `POST /api/profile`
Saves or registers a candidate profile into database.

* **Request**: `application/json` (matches `ResumeData` structure)
* **Response**: `201 Created`
  ```json
  {
    "id": "a9a83419-f538-4f05-aa5c-974a621cfad2",
    "full_name": "John Doe",
    ...
  }
  ```

### `GET /api/profile`
Retrieves a list of all profiles.

* **Response**: `200 OK`
  ```json
  [
    {
      "id": "a9a83419-f538-4f05-aa5c-974a621cfad2",
      "full_name": "John Doe",
      ...
    }
  ]
  ```

---

## 4. Matching & Talent Check

### `POST /api/match`
Evaluates a candidate profile against a job description. Calculates matching metrics, lists skill gaps, and generates structural recommendations and LLM compatibility explanations.

* **Request**: `application/json`
  ```json
  {
    "profile_id": "a9a83419-f538-4f05-aa5c-974a621cfad2",
    "job_id": "18f95c10-09e8-4221-a53b-0129fd3c9f28"
  }
  ```
  *Alternative Request (Raw Match)*:
  ```json
  {
    "profile_data": { ... },
    "job_data": { ... }
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "profile_id": "a9a83419-f538-4f05-aa5c-974a621cfad2",
    "job_id": "18f95c10-09e8-4221-a53b-0129fd3c9f28",
    "score": 85.0,
    "semantic_score": 90.0,
    "experience_score": 80.0,
    "projects_score": 80.0,
    "matched_skills": ["Python", "FastAPI"],
    "missing_skills": ["Docker"],
    "recommendations": [
      "Add projects demonstrating experience with Docker, which is preferred."
    ],
    "explanation": "John Doe matches 90% of the skills required for the Backend Developer position..."
  }
  ```
