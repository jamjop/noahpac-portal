# USPSTF Patient Screener

Static web app that takes a patient's **age + sex (+ optional risk factors)**
and shows the applicable USPSTF screening recommendations. Ships with a
curated built-in dataset (verified June 2026) and can refresh itself weekly
from the official **USPSTF Prevention TaskForce API**.

```
uspstf-screener/
├── index.html          # the whole app (no build step, no dependencies)
├── update_uspstf.py    # fetches the API -> writes data/uspstf.json
└── data/
    └── uspstf.json     # live dataset (created by the script; optional)
```

How data loading works: on page load the app tries `data/uspstf.json`.
If it exists and parses, the header shows a green "Live data" badge with the
update date. If not, it silently falls back to the built-in dataset. The
update script writes atomically and leaves the old file in place on failure,
so a bad API day never breaks the app.

## 1. Deploy to nginx

```bash
sudo mkdir -p /var/www/uspstf-screener
sudo cp -r index.html update_uspstf.py data /var/www/uspstf-screener/
```

Server block (or adapt as a `location` inside an existing one):

```nginx
server {
    listen 80;
    server_name screener.yourdomain.lan;

    root /var/www/uspstf-screener;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # don't let browsers cache the dataset between weekly refreshes
    location /data/ {
        add_header Cache-Control "no-cache";
    }

    # never serve the raw API dump or the script itself
    location ~ \.(py|tmp)$ { deny all; }
    location = /data/uspstf_raw.json { deny all; }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Running everything in Docker instead? Mount the folder into any nginx
container (`-v /opt/uspstf-screener:/usr/share/nginx/html:ro`) — there's
nothing dynamic to run server-side.

## 2. Get an API key (free)

The Prevention TaskForce API requires prior approval. Email
**uspstfpda@ahrq.gov** with your contact info and a one-line description of
use (e.g., "self-hosted clinical reference tool for personal use"). Details:
https://www.uspreventiveservicestaskforce.org/apps/api.jsp

Until you have a key, the app works fully on its built-in dataset.

## 3. Schedule weekly updates

AHRQ recommends caching the full dataset and refreshing about once a week.

```bash
# test it once manually
USPSTF_API_KEY=yourkey python3 /var/www/uspstf-screener/update_uspstf.py

# then cron it (Mondays 04:17). Put the key in a root-readable env file
# rather than the crontab if you prefer:
17 4 * * 1 USPSTF_API_KEY=yourkey /usr/bin/python3 /var/www/uspstf-screener/update_uspstf.py >> /var/log/uspstf-update.log 2>&1
```

The script is stdlib-only (no `pip install` needed) and exits nonzero on any
failure without touching the existing `uspstf.json`.

## 4. Schema notes / maintenance

`update_uspstf.py` maps the API's `specificRecommendations` (title, grade,
sex, ageRange, pregnant/tobacco/sexuallyActive/risk flags, servFreq, text)
onto the app's schema. If AHRQ changes field names, the script fails loudly
and saves the untouched API response to `data/uspstf_raw.json` so you can
inspect it and adjust `transform()`. The app itself never needs to change.

Grades kept: A, B, C. The app groups results into **Recommended (A/B)**,
**Individualized decision (C)**, and **May apply — depends on risk factors**
(recommendations whose conditions you haven't checked off).

## Disclaimer

Educational reference, not medical advice or a substitute for clinical
judgment. Always read the full recommendation statements at
uspreventiveservicestaskforce.org.
