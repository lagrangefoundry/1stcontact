---
uid: acceptance_criterion-477aba6b
id: AC-2241
type: acceptance_criterion
title: A slug is unique within its business only, and a move onto a slug the destination
  already uses is refused by the database
created_by: xgd
created_at: '2026-11-04T16:01:05.016543+00:00'
updated_at: '2026-11-04T16:01:05.016543+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

Two different businesses may each hold a site with the same slug; each handle sees only its own. Within one business a slug names **at most one site**: creating a draft for a slug the business already holds creates nothing (see the creation-report criterion), and moving a site into a business that already holds a site with that slug is **refused by the database's own uniqueness constraint**, not by a caller-side check. The refused move leaves the site in its original business, unchanged.

## Verification

Create `home` in two businesses and assert both exist with different keys. Create a site in business A and a same-slug site in business B, then attempt the one-row move of A's site into B and assert the database rejects it and the site still belongs to A with its content intact.