import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load environment variables from .env file if it exists
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Talent Match Platform"
    API_V1_STR: str = "/api"
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # LLM Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL_NAME: str = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")
    
    # SQLite fallback configuration
    USE_LOCAL_FALLBACK: bool = os.getenv("USE_LOCAL_FALLBACK", "false").lower() in ("true", "1", "yes")
    SQLITE_DB_PATH: str = os.getenv("SQLITE_DB_PATH", "/tmp/talent_match.db" if os.getenv("VERCEL") else "talent_match.db")
    
    def __init__(self, **values):
        super().__init__(**values)
        # Force fallback if credentials are blank or placeholders or USE_LOCAL_FALLBACK is set
        if (not self.SUPABASE_URL or "placeholder" in self.SUPABASE_URL.lower()) or \
           (not self.SUPABASE_KEY or "placeholder" in self.SUPABASE_KEY.lower()) or \
           os.getenv("USE_LOCAL_FALLBACK", "").lower() in ("true", "1", "yes"):
            self.USE_LOCAL_FALLBACK = True

    class Config:
        case_sensitive = True


settings = Settings()
