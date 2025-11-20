---
"@spotlightjs/spotlight": patch
---

**Security:** Restrict CORS origins for Sidecar to prevent unauthorized access

The Sidecar now only accepts requests from trusted origins:
- `localhost` with any port or protocol (http/https)
- `https://spotlightjs.com` and `https://*.spotlightjs.com` (HTTPS only, default port)

⚠️ **Potentially Breaking:** If you were accessing the Sidecar from other origins (e.g., custom domains, non-HTTPS spotlightjs.com), those connections will now be rejected. This change improves security by preventing malicious websites from connecting to your local Sidecar instance.
