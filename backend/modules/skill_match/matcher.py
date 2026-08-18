import numpy as np
from typing import List, Tuple
from shared.utils import logger

try:
    from sentence_transformers import SentenceTransformer
    import torch
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False
    logger.warning("sentence-transformers or PyTorch is not installed. Similarity matching will fallback to text-overlap matching.")

class SkillMatcher:
    def __init__(self):
        self.model = None

    def _load_model(self):
        if HAS_SENTENCE_TRANSFORMERS and self.model is None:
            try:
                logger.info("Loading sentence-transformers/all-MiniLM-L6-v2 model onto CPU...")
                # Load the model. Using cpu since it's most compatible.
                self.model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
                logger.info("SentenceTransformer model loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load SentenceTransformer model: {e}")
                self.model = None

    def compute_similarity(self, term1: str, term2: str) -> float:
        """
        Compute similarity score between two skill names or text chunks.
        Returns a float between 0.0 and 1.0.
        """
        # Clean terms
        term1_clean = term1.strip().lower()
        term2_clean = term2.strip().lower()
        
        # Direct exact match optimization
        if term1_clean == term2_clean:
            return 1.0
            
        # Try semantic match
        if HAS_SENTENCE_TRANSFORMERS:
            try:
                self._load_model()
                if self.model is not None:
                    embeddings = self.model.encode([term1, term2], show_progress_bar=False)
                    vec1 = embeddings[0]
                    vec2 = embeddings[1]
                    # Cosine similarity calculation
                    dot_product = np.dot(vec1, vec2)
                    norm_a = np.linalg.norm(vec1)
                    norm_b = np.linalg.norm(vec2)
                    
                    if norm_a == 0 or norm_b == 0:
                        return 0.0
                        
                    similarity = float(dot_product / (norm_a * norm_b))
                    # Normalizing to [0, 1] range
                    return max(0.0, min(1.0, similarity))
            except Exception as e:
                logger.error(f"Error during SentenceTransformer similarity calculation: {e}. Falling back.")
        
        # Fallback overlap-based similarity
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
