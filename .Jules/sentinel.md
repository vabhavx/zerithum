## 2024-05-22 - [CRITICAL] OAuth CSRF Vulnerability
**Vulnerability:** The `functions/oauthCallback.ts` endpoint (backend) blindly accepted the `state` parameter as the platform identifier without verifying it against a user session or CSRF token. This allowed attackers to force a victim's account to connect to the attacker's third-party platform account (CSRF login attack).
**Learning:** Even if the frontend implements CSRF checks (as `AuthCallback.jsx` did), exposed backend endpoints (`functions/`) are vulnerable if they don't independently verify the request origin. Stateless serverless functions must use cookies (or signed tokens) to maintain state between the redirect initiation and the callback.
**Prevention:**
1. Use the Double Submit Cookie pattern: Set a random token in a cookie AND in the OAuth `state` parameter.
2. In the callback, strictly verify that the cookie exists, the state has the token, and they match.
3. Fail secure: Reject requests that lack either component, even if they appear "legacy".
