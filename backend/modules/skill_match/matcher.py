import numpy as np
from typing import List, Tuple, Dict, Optional
from shared.utils import logger
from shared.config import settings

# Optional SentenceTransformers check (for backward compatibility if installed locally)
try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False

# OpenAI Client Setup for serverless embeddings
openai_client = None
if settings.OPENAI_API_KEY and "placeholder" not in settings.OPENAI_API_KEY.lower():
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        logger.info("OpenAI client initialized for SkillMatcher embeddings.")
    except Exception as e:
        logger.warning(f"Could not initialize OpenAI client for embeddings: {e}")


class SkillMatcher:
    def __init__(self):
        self.model = None
        self._embedding_cache: Dict[str, np.ndarray] = {}

    def _get_embedding(self, text: str) -> Optional[np.ndarray]:
        """
        Retrieves vector embedding for a given text term.
        Checks in-memory cache first, then calls OpenAI embeddings, then local SentenceTransformer if present.
        """
        text_key = text.strip().lower()
        if not text_key:
            return None

        if text_key in self._embedding_cache:
            return self._embedding_cache[text_key]

        # 1. Try OpenAI text-embedding-3-small (Ultra lightweight, fits Vercel function limits)
        if openai_client:
            try:
                response = openai_client.embeddings.create(
                    model="text-embedding-3-small",
                    input=text_key
                )
                vec = np.array(response.data[0].embedding, dtype=np.float32)
                self._embedding_cache[text_key] = vec
                return vec
            except Exception as e:
                logger.warning(f"OpenAI embedding call failed for '{text_key}': {e}. Falling back.")

        # 2. Try local SentenceTransformer if present
        if HAS_SENTENCE_TRANSFORMERS:
            try:
                if self.model is None:
                    logger.info("Loading local sentence-transformers model...")
                    self.model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
                vec = self.model.encode(text_key, show_progress_bar=False)
                vec_np = np.array(vec, dtype=np.float32)
                self._embedding_cache[text_key] = vec_np
                return vec_np
            except Exception as e:
                logger.error(f"SentenceTransformer embedding error: {e}")

        return None

    def compute_similarity(self, term1: str, term2: str) -> float:
        """
        Compute similarity score between two skill names or text chunks.
        Returns a float between 0.0 and 1.0.
        """
        term1_clean = term1.strip().lower()
        term2_clean = term2.strip().lower()

        # Direct exact match optimization
        if term1_clean == term2_clean:
            return 1.0

        # Substring match optimization (e.g. "React.js" and "React")
        if term1_clean in term2_clean or term2_clean in term1_clean:
            shorter = min(len(term1_clean), len(term2_clean))
            longer = max(len(term1_clean), len(term2_clean))
            if longer > 0 and (shorter / longer) >= 0.55:
                return 0.95

        # Semantic vector match (OpenAI or SentenceTransformers)
        vec1 = self._get_embedding(term1_clean)
        vec2 = self._get_embedding(term2_clean)

        if vec1 is not None and vec2 is not None:
            dot_product = np.dot(vec1, vec2)
            norm_a = np.linalg.norm(vec1)
            norm_b = np.linalg.norm(vec2)
            if norm_a > 0 and norm_b > 0:
                similarity = float(dot_product / (norm_a * norm_b))
                return max(0.0, min(1.0, similarity))

        # Fallback overlap-based similarity (Jaccard similarity)
        words1 = set(term1_clean.split())
        words2 = set(term2_clean.split())
        if not words1 or not words2:
            return 0.0
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        return float(len(intersection) / len(union))

    def match_skills(self, candidate_skills: List[str], required_skills: List[str], threshold: float = 0.60) -> Tuple[List[str], List[str]]:
        """
        Matches candidate skills against required skills.
        Returns:
            matched_skills: Required skills that match candidate skills above threshold.
            missing_skills: Required skills that did not match candidate skills.
        """
        matched = []
        missing = []

        for req_skill in required_skills:
            best_score = 0.0
            for cand_skill in candidate_skills:
                score = self.compute_similarity(cand_skill, req_skill)
                if score > best_score:
                    best_score = score
                if best_score >= 1.0:
                    break

            if best_score >= threshold:
                matched.append(req_skill)
            else:
                missing.append(req_skill)

        return list(set(matched)), list(set(missing))


skill_matcher = SkillMatcher()
