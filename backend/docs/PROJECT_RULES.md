# Project Development Rules

This repository is shared among several specialized senior engineer roles working as a single unified team.

## General Engineering Principles
1. **DRY (Don't Repeat Yourself)**: Avoid duplicating models, helper functions, or business logic. All database transactions, logging setups, and API key initializations go through `shared/utils.py` and `shared/config.py`.
2. **SOLID Design**: Ensure single responsibility for modules (e.g., `skill_match` only calculates similarities, `talent_check` processes scoring rules, and `resume_parser` parses text documents).
3. **Repository Pattern**: Keep database schemas decoupled from business logic. Always route operations through DB access wrappers in `shared/utils.py`.
4. **Strong Typing & Schemas**: Always use the models in `shared/schemas.py` for request validation and API responses. Do not create local schemas inside folders.

## Git & Collaboration
* No branch code changes that bypass the shared contracts.
* Always build and run backend checks (`pytest`) and lint checks before submitting PRs.
* In the absence of cloud database keys, the local SQLite database fallback MUST be maintained to keep all code testable in development.
