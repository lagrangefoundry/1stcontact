---
uid: goal-90dcda92
id: GOAL-3
type: goal
title: Web monitoring
created_by: xgd
created_at: '2026-08-06T00:05:43.073934+00:00'
updated_at: '2026-08-06T00:05:43.073934+00:00'
completed_at: null
last_field_updated: created_at
status: concept
fields:
  provenance: planned
---

Monitoring focused on whether the website is doing its job, not on technical metrics (DOC-4 Monitoring MVP, DOC-5 Basic Monitoring Architecture).

Initial scope: site availability, SSL validity, domain and DNS health, contact form testing, lead capture verification, broken links, missing images and assets, basic SEO checks, sitemap and robots.txt checks, metadata presence, static build and deploy status.

Failures create internal events or automation tickets rather than raw alerts. Delivery is via Cloudflare Queues and Cron Triggers per DOC-5.

Future additions named in DOC-4: AI visibility monitoring, newsletter effectiveness, lead funnel monitoring, SEM support.

State rationale: aspiration rather than concept -- the scope is specified in two architecture docs, but no code exists and no date is set.