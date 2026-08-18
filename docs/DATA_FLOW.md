# Talent Match Platform: E2E Pipeline Data Flow

This document details the automated execution pipeline of the Talent Match Platform, tracing data from raw inputs (pasted JDs and resume PDFs) to the final similarity matching dashboard.

---

## 1. Pipeline Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Recruiter / Client
    participant UI as React Dashboard
    participant Backend as FastAPI Gateway
    participant JD as JD Analytics (LangChain)
    participant RP as Resume Parser (LangChain/PDF)
    participant DB as Repository Database (Supabase/SQLite)
    participant TC as Talent Check Scoring Engine
    participant SM as Skill Match (Sentence Transformers)

    %% Step 1: Upload JD
    Recruiter->>UI: Paste raw Job Description (JD) text
    UI->>Backend: POST /api/jd/analyze {description, title, company}
    Backend->>JD: Extract requirements, roles, & experience
    JD-->>Backend: JobDescriptionData
    Backend->>DB: Save Job Profile to jobs table
    Backend-->>UI: JobResponse {id, title, company, required_skills, ...}
    Note over UI: UI saves JobResponse to state,<br/>auto-selects job, & pre-fills skill filters

    %% Step 2: Upload Resume
    Recruiter->>UI: Upload Candidate Resume PDF
    UI->>Backend: POST /api/parser/resume (multipart/form-data)
    Backend->>RP: Extract PDF text & parse to structured schema
    RP-->>Backend: ResumeData
    Backend-->>UI: ResumeData {full_name, email, skills, experience, projects, ...}
    Note over UI: UI auto-populates Profile Builder form<br/>fields with parsed fields for preview

    %% Step 3: Save Profile
    Recruiter->>UI: Reviews & Clicks "Save Candidate Profile"
    UI->>Backend: POST /api/profile {ResumeData}
    Backend->>DB: Save Profile to profiles table
    Backend-->>UI: ProfileResponse {id, full_name, email, skills, ...}
    Note over UI: UI saves ProfileResponse to state,<br/>and auto-selects the candidate

    %% Step 4: Perform Match Check
    Note over UI: UI auto-triggers matching call immediately
    UI->>Backend: POST /api/match {profile_id, job_id}
    Backend->>DB: Fetch Profile & Job records
    DB-->>Backend: Profile & Job dicts
    Backend->>TC: compute_match(profile, job)
    TC->>SM: match_skills(candidate_skills, required_skills)
    SM->>SM: Encode skills & calculate cosine similarity
    SM-->>TC: matched_skills, missing_skills
    TC->>TC: Calculate Experience Score & Project Score
    TC->>TC: Generate recruiter recommendations & LLM explanation
    TC->>DB: Log match details to matches table
    TC-->>Backend: MatchResponse {score, matched_skills, missing_skills, recommendations, explanation}
    Backend-->>UI: MatchResponse
    UI->>Recruiter: Renders score wheels, radar charts, skill tags, & recs
```

---

## 2. Step-by-Step Data Integration Details

### Step 2.1: JD Analytics (`POST /api/jd/analyze`)
* **Input**: `{ "description": "Raw pasted text of job description..." }`
* **Output**: `JobResponse` Pydantic model (inherits from `JobDescriptionData` with a unique database `id` field).
* **Next Connection**: The frontend updates its `jobs` state:
  ```javascript
  setJobs(prev => [response.data, ...prev]);
  setSelectedJobId(response.data.id);
  ```
  This guarantees the dashboard uses the database-generated ID rather than generating a client-side mock ID.

### Step 2.2: Resume Parser (`POST /api/parser/resume`)
* **Input**: Multipart file upload containing the PDF resume binary.
* **Output**: `ResumeData` Pydantic model (names, emails, skill tags, arrays of education, experience, and project details).
* **Next Connection**: The frontend automatically maps this response to the Profile Builder input forms, eliminating manual JSON editing or copy-pasting.

### Step 2.3: Profile Builder (`POST /api/profile`)
* **Input**: `ResumeData` body representing the edited candidate profile details.
* **Output**: `ProfileResponse` containing the database-registered unique `id` and the profile payload.
* **Next Connection**: The frontend updates its `profiles` state, auto-selects this new candidate, and immediately dispatches the match request.

### Step 2.4: Talent Check & Matching (`POST /api/match`)
* **Input**: `{ "profile_id": "...", "job_id": "..." }`
* **Processing**:
  * Decouples matching logic from specific DB connections.
  * Resolves cosine similarity lists locally on the CPU using `sentence-transformers/all-MiniLM-L6-v2`.
  * Merges experience metrics and project matches to create a weighted rating.
* **Output**: `MatchResponse` (containing scores, recommendations list, and the semantic explanation).
* **Result**: Renders in the glassmorphic analytics interface on the dashboard.
