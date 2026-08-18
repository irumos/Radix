# LLM Developer Instructions

This platform is structured for a highly collaborative multi-agent autonomous coding team. Follow these instructions when maintaining or extending this codebase:

## Stack Details
- **Backend API**: FastAPI + Python 3.12 + Uvicorn
- **Similarity Model**: Sentence Transformers `all-MiniLM-L6-v2` loaded locally on CPU.
- **LLM Integrations**: LangChain-wrapped OpenAI `gpt-4o-mini` for PDF resume extraction and JD analytics mapping.
- **Database/Auth**: Cloud Supabase client (PostgreSQL under-the-hood) with local SQLite fallback if cloud environment keys are omitted.

## Schema Integrity
1. Do not define inline types or local schemas. Import from `shared/schemas.py`.
2. Do not introduce custom properties outside the defined models to maintain compatibility with the frontend Axios handlers.
3. Keep database functions in `shared/utils.py` and pass data through these wrappers. Do not instantiate direct database connections inside backend routes.
