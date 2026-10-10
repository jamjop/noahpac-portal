# Security-header baseline

The Nginx site config applies HSTS, CSP, clickjacking protection, MIME sniffing protection, a restrictive permissions policy, referrer policy, COOP, and CORP. The protected Clinical Assistant additionally uses Authelia and a stricter application response policy.

The production health workflow verifies the public presence of the core headers and `object-src 'none'`. It reports missing `base-uri 'self'` and `form-action 'self'` as warnings until the prepared Nginx hardening change is applied by an administrator.

Route-specific CSP exceptions are intentional:

- `/drugref/` connects to `https://api.fda.gov`.
- `/lookup/` connects to `https://clinicaltables.nlm.nih.gov`.
- The landing page currently needs inline-script/style allowances; removing those requires extracting its inline script first.

Cloudflare currently emits a shorter public HSTS `max-age` than the two-year origin value. Align that setting in the Cloudflare dashboard before submitting the domain to the HSTS preload list. Do not enable COEP without a separate compatibility review of API, font, PDF, and PWA resources.
