# Zerithum Product Report: Regulatory Posture & Compliance

**Executive Summary**
Zerithum operates as a creator revenue reconciliation platform. Our core regulatory posture is defined by strict adherence to data minimization, immutable audit trails, and banking integration standards. We treat bank deposits as the single source of truth for all reconciliation activities.

## Core Regulatory Principles

### 1. Source of Truth
- **Bank Deposits**: All revenue recognition must be reconciled against actual bank deposits. Platform reported revenue (YouTube, Patreon, Stripe) is treated as "claimed" revenue until verified against a bank transaction.
- **Immutability**: Once reconciled, a transaction cannot be modified. Adjustments must be made via reversal or correction entries.

### 2. Data Minimization & Privacy
- **PII Handling**: Personally Identifiable Information (PII) is masked by default in all logs and non-production environments.
- **Least Privilege**: Access to customer data is restricted to services and personnel with a specific, time-bound need.
- **Data Retention**: Data is retained only as long as necessary for tax compliance and audit purposes.

### 3. Auditability
- **Traceability**: Every system action, especially those affecting financial data, must be traceable to a specific actor (user or system process) and authorized by a signed token.
- **Audit Logs**: All critical operations emit structured, append-only audit logs containing timestamp, actor ID, action type, and outcome.

### 4. Zero Trust Architecture
- **Secret Management**: No secrets are stored in the codebase. All credentials are managed via secure vaults.
- **Authentication**: Strict authentication checks are performed at every API endpoint. No implicit trust between services.

## Operational Constraints

- **Automated Writes**: No autonomous writes to production databases affecting live customer data without out-of-band human authorization.
- **Exfiltration Prevention**: Strict egress controls to prevent unauthorized data exfiltration.

## Compliance Standards
- **Tax Readiness**: Exports are generated to comply with standard tax reporting formats.
- **Financial Integrity**: Reconciliation logic prioritizes deterministic matching over probabilistic models.

---
*This document serves as the reference for all engineering and product decisions regarding compliance and safety.*
