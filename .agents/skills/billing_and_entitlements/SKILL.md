---
name: Billing & Entitlements
description: Standards for enforcing tiered subscription limits and secure payment flows.
---

# 💳 Billing & Entitlements: Enforcement Standards

## 1. Plan Tiers & Limits
The Zerithum subscription model is strictly defined and must never be surpassed:
- **Starter ($9/mo)**: Maximum **3** connected platforms.
- **Pro ($20/mo)**: Maximum **5** connected platforms.
- **Free/No Plan**: **0** connected platforms allowed. No exceptions.

## 2. Multi-Layer Enforcement (Fail-Closed)
Enforcement must happen at every layer of the stack to prevent bypasses:
1.  **Database Trigger**: A `BEFORE INSERT` trigger (`enforce_platform_limit_trigger`) on `connected_platforms` is the final source of truth.
2.  **Concurrency Lock**: Every connection attempt **MUST** acquire a transaction-level advisory lock (`pg_advisory_xact_lock(hashtext(user_id))`) to prevent race condition bypasses.
3.  **Edge Functions**: All token exchange and sync functions must verify `entitlements.max_platforms` before any external API work.
4.  **UI Feedback**: Prevent the "Connect" flow entirely if `max_platforms` is reached, providing clear upgrade paths.

## 3. UI/UX Consistency
- **Active Only**: Never show a plan tier name (e.g., "Starter") in the UI if the subscription status is not `ACTIVE`. Default to "No Active Plan".
- **Real Checkouts**: No "mock" or "fake" upgrade flows. All upgrade buttons must navigate to `/billing` to trigger the actual PayPal flow.
- **Explicit Blocking**: When a user without a plan tries to connect, use the standardized message: *"No active plan. Please purchase your Starter pack to begin connecting."*

## 4. Integrity Checks
- **Auto-Expiration**: If a subscription period ends without renewal, entitlements must be zeroed out immediately via the `getSubscriptionStatus` logic or webhooks.
-  **Deduplication**: Webhook events must be deduplicated and verified via PayPal signature to prevent double-counting or fraudulent status updates.

*This standard ensures that Zerithum's revenue model remains unbreakable and enterprise-secure.*
