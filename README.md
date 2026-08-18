# RADIX Talent Match Platform 🚀

A production-grade, AI-powered Talent Match Platform engineered for the **RADIX Talent Match Hackathon**. The application automatically analyzes Job Descriptions (JDs), extracts technical skills using LangChain and ChatOpenAI, parses candidate resume PDFs, builds profiles, and calculates semantic compatibility scores using local **Sentence Transformers** (CPU-optimized `all-MiniLM-L6-v2` embeddings).

---

## 📂 Repository Structure

```text
TalentMatch/
├── backend/
│   ├── app.py                     # FastAPI main gateway
│   ├── requirements.txt           # Python dependency specifications
│   ├── modules/
│   │   ├── jd_analytics/          # LangChain job parser
│   │   ├── resume_parser/         # LangChain PDF resume parser
│   │   ├── profile_builder/       # Candidate CRUD router
│   │   ├── skill_match/           # Cosine similarity vector models
│   │   └── talent_check/          # Weighted scoring & recommendations
│   └── shared/
│       ├── config.py              # Environment settings parser
│       ├── supabase_client.py     # Supabase initialization client
│       └── utils.py               # SQLite & Supabase database adapters
├── frontend/
│   ├── package.json               # Node dependencies
│   ├── src/
│   │   ├── App.jsx                # Main dashboard UI
│   │   ├── index.css              # Styling (Tailwind v4 imports)
│   │   └── lib/
│   │       └── supabase.js        # Supabase browser initialization client
│   └── vite.config.js             # Vite configuration
└── README.md                      # Deployment & developer documentation
```

---

## 🛠️ Installation Guide

### Prerequisite Versions
* **Python**: `3.10` to `3.13`
* **Node.js**: `v18+` / `v20+`

### 1. Backend Setup
1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # On Windows (PowerShell):
   .\.venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source .venv/bin/activate
   ```
3. Upgrade pip and install all required dependencies:
   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```
4. Create a `.env` file inside the `backend/` directory containing:
   ```env
   # Database Configurations
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_KEY=your-supabase-service-role-key
   
   # AI Engine Configurations
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_MODEL=gpt-4o-mini
   ```
5. Run the FastAPI development server:
   ```bash
   python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
   ```
   * The API documentation will load at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 2. Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside the `frontend/` directory containing:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_API_BASE_URL=http://127.0.0.1:8000/api
   VITE_STATIC_BASE_URL=http://127.0.0.1:8000
   ```
4. Run the Vite local HMR server:
   ```bash
   npm run dev
   ```
   * Open the local interface at [http://localhost:5173](http://localhost:5173).

---

## 🧑‍💻 Developer Guide

### Database Adapter Mapping (SQLite Fallback)
The database engine decouples the FastAPI routes from specific database APIs. If cloud credentials are blank or placeholders, the platform automatically switches to a local SQLite database (`backend/talent_match.db`) and copies file attachments to a local `static/` folder.

To maintain clean compatibility with existing tables in the Supabase workspace, database operations in [backend/shared/utils.py](file:///c:/Users/komal/OneDrive/Desktop/backup/TalentMatch/backend/shared/utils.py) adapt to specific schema definitions:
* **Candidate profiles** map to the `candidate_profiles` table (`name` column maps to Pydantic `full_name`).
* **Candidate skills** map relationally to the `candidate_skills` table (`level` defaults to the integer `3`).
* **Job listings** map to `job_descriptions` (`role` column maps to `title`, `raw_text` column maps to `description`).

### Run Diagnostic Scripts
To run connection checks on the database tables and storage buckets:
```bash
# Verify CRUD & Storage Buckets Uploads
python backend/scratch_test_connections.py

# Execute E2E HTTP Pipeline Tests
python backend/scratch_e2e_test.py
```

---

## 🚀 Deployment Guide

### Backend Deployment (FastAPI on Render / Cloud Run)
1. **Containerization**: Use a standard `uvicorn app:app --host 0.0.0.0 --port $PORT` execution.
2. **Environment Variables**: Populate all keys (`SUPABASE_URL`, `SUPABASE_KEY`, `OPENAI_API_KEY`) in your cloud provider dashboard.
3. **Storage CORS Settings**: Ensure that the buckets `resume-files`, `jd-files`, and `generated-reports` are configured with **Public Access Allowed** on Supabase Storage.

### Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
1. Set the **Build Command** to `npm run build`.
2. Set the **Publish Directory** to `dist`.
3. Configure the environment variables in the host dashboard, changing `VITE_API_BASE_URL` to point to your live backend endpoint.

---

## 🔍 Troubleshooting Guide

### 1. PyPDF/pdfminer descriptor warning
* **Symptoms**: Log outputs warnings: `Could not get FontBBox from font descriptor`.
* **Fix**: This is a non-breaking warning thrown by underlying PDF parsing tools when checking non-standard PDFs. Resume text extraction and parsing operations still execute successfully.

### 2. UUID Syntax Errors on Supabase Inserts
* **Symptoms**: Error message `invalid input syntax for type uuid: "..."`.
* **Fix**: The Supabase database tables use UUID primary keys. Ensure all candidate profile and job description IDs are generated as pure valid UUID formats using `str(uuid.uuid4())` without text prefixes.

### 3. SQLite database lock errors (Windows)
* **Symptoms**: Windows displays a `WinError 32: process cannot access the file because it is being used by another process`.
* **Fix**: Ensure that only one virtual environment terminal process is executing pip installs or test runners at a time to prevent writing conflicts in the synced folders.
