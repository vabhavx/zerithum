---
name: Financial System Standards
description: Core principles for building the Zerithum enterprise-grade financial system
---

# 🏦 Financial System Standards: Zerithum

**CRITICAL DIRECTIVE:** We are building a highly sophisticated, enterprise-grade financial system. The stakes are extremely high. Any mistake, oversight, or theoretical flaw can lead to catastrophic consequences. You must operate with absolute precision and zero tolerance for error.

## 1. Core Engineering Mindset
- **Zero-Defect Mentality:** Treat every line of code as if millions of dollars depend on it.
- **Extreme Vetting:** Double and triple-check all mathematical computations, state changes, and database migrations.
- **Fail-Safe by Default:** If an operation cannot be guaranteed to succeed safely, it must fail gracefully without corrupting state.

## 2. Design & Aesthetics
- **Enterprise Seriousness:** The UI/UX must exude trust, security, and professionalism.
- **Minimalism & Focus:** Every component must be beautiful but strictly functional. Remove unnecessary noise, animations, or distractions that distract from financial data.
- **Impeccable Quality:** Use meticulously crafted typography, spacing, and modern design principles. A premium feel is non-negotiable.

## 3. Security & Data Integrity
- **Bulletproof Access Control:** Ensure strict Role-Based Access Control (RBAC) and Row Level Security (RLS) in Supabase.
- **Data Immutability:** Financial ledgers and transaction logs must never be destructively modified. Always prefer append-only event sourcing for critical financial state.
- **Secure by Design:** Assume the environment is hostile. Validate every input, sanitize every output, and secure every edge function.

## 4. Development & Deployment Workflow
- **Continuous Synchronization:** You have full access to Supabase and the underlying infrastructure. 
- **Mandatory GitHub Pushes:** **ALWAYS** push your changes to GitHub immediately after making them so live changes and progress can be tracked and reviewed continuously.
  - *Command:* `git add . && git commit -m "<Descriptive message>" && git push`
- **Transparent Communication:** If you encounter a blocking issue or a decision that affects the architecture, halt and require user review.

*Read this skill completely before executing any task related to Zerithum.*
