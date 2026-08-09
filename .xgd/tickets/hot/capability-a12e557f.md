---
uid: capability-a12e557f
id: CAP-82
type: capability
title: 'Site Delivery: Deploy & Public Serving'
created_by: xgd
created_at: '2026-08-06T18:38:00.342753+00:00'
updated_at: '2026-08-09T13:50:17.573817+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  name: site-delivery-deploy-and-public-serving
  uat_coverage: pass
---

# Capability: Site Delivery: Deploy & Public Serving

Getting a rendered site **off the operator's machine and in front of a visitor**.

Every other capability in the matrix stops at rendered bytes on disk: authoring
produces a site definition, the framework substrate renders it, capture and the
reproduction gate judge it. None of them can show the result to anyone who is
not sitting at the operator's laptop. This capability owns the whole path from
"the bytes exist locally" to "a person with a link sees the page".

## Scope

- **Shipping an artifact** — taking a rendered snapshot and its definition,
  naming it by its contents, and placing it in durable shared storage so it can
  be addressed by a URL.
- **The draft/published split at delivery** — a shareable, immutable preview
  that costs the site nothing (no revision number, no publish history entry),
  versus the site's live published output.
- **Serving** — turning a deployed snapshot back into pages and assets for a
  visitor: which URL names which bytes, what a visitor is and is not allowed to
  reach, caching, and how a miss is answered.
- **URL resolution agreement** — the URL an author writes resolves the same way
  in the local preview server and in production.
- **Operator legibility of a delivery** — what a deploy reports, what it
  refuses, and what it will and will not delete.

Out of scope: the canonical site store (delivery moves serving, not storing —
site definitions stay canonical on the operator's machine), authoring,
rendering, custom domains, per-visitor authentication, and subdomain routing.