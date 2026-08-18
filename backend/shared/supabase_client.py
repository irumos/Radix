from supabase import create_client, Client
from shared.config import settings
import logging

logger = logging.getLogger("TalentMatch.Supabase")

# Global Supabase Client using Service Role Key
supabase_client: Client = None

if not settings.USE_LOCAL_FALLBACK:
    try:
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            logger.info("Successfully initialized Supabase client in shared/supabase_client.py.")
        else:
            logger.warning("Supabase credentials missing. Client set to None.")
    except Exception as e:
        logger.error(f"Error creating Supabase client: {e}")
