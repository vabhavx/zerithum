# Zerithum Final Report: Regulatory Posture & Engineering Principles

## Platform Description
Zerithum is a creator revenue operations dashboard. Creators connect revenue platforms once, Zerithum pulls earnings data, reconciles it against bank deposits, categorizes taxes, flags anomalies, forecasts cashflow, and generates exports. Core trust comes from reconciliation accuracy and audit logs.

## Regulatory Posture & Principles
1.  **Source of Truth**: Treat bank deposits as the source of truth for reconciliation.
2.  **Deduplication**: Deduplicate by stable platform transaction ids plus user id plus platform.
3.  **Audit Integrity**: Keep audit_log and reconciliations append-only. Use "contested" or "reversed" flags, never destructive deletes.
4.  **Idempotency**: Use idempotent jobs for sync workflows. Retries must be safe.
5.  **Matching Logic**: Prefer deterministic, explainable matching logic before model-based heuristics.
6.  **Data Minimization**: Only store what is necessary.
7.  **Immutable Audit Trails**: Ensure all actions are traceable and immutable.
