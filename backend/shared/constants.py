# System-wide scoring and matching constants

# Weights must sum to 1.0
SCORING_WEIGHT_SEMANTIC = 0.50
SCORING_WEIGHT_EXPERIENCE = 0.30
SCORING_WEIGHT_PROJECTS = 0.20

DEFAULT_SKILLS_TAXONOMY = [
    "Python", "JavaScript", "React", "FastAPI", "TypeScript", "Node.js",
    "SQL", "PostgreSQL", "Docker", "Git", "Machine Learning", "AI",
    "Deep Learning", "LangChain", "HTML", "CSS", "AWS", "Google Cloud",
    "Kubernetes", "DevOps", "CI/CD", "Tailwind CSS", "Data Engineering",
    "NLP", "PyTorch", "TensorFlow", "Pandas", "Scikit-Learn", "Java",
    "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "Supabase", "SQLAlchemy"
]

FALLBACK_MATCH_RECOMMENDATIONS = [
    "Add projects demonstrating hands-on experience with the missing required skills.",
    "Explicitly detail responsibilities involving these technologies in your professional history.",
    "Consider obtaining certifications or completing coursework in the missing domain areas."
]
