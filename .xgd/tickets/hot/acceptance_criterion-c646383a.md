---
uid: acceptance_criterion-c646383a
id: AC-2167
type: acceptance_criterion
title: An admitted business entered via the platform_operator bypass carries role
  null, so entering a hosted business is never read back as owning it
created_by: xgd
created_at: '2026-11-01T17:59:08.825992+00:00'
updated_at: '2026-11-01T18:21:35.342964+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
Every business in an admission carries the caller's `role` on it, taken from the same membership row admission was decided from (for example `owner`). A business reached through the `platform_operator` bypass, where there is no membership, carries `role: null`. As a result, a `platform_operator` operating a customer business they hold no membership on is not treated as that business's owner: owner-gated answers in that business report not-owner (e.g. `canInvite` false on its people listing, an invite into it refused), while the same operator can still read the business's ordinary data.

## Verification
Seed a `platform_operator` with no membership and a live customer business. Resolve the business through the bypass and assert that its role is null. Under that business's prefix, assert that its sites are served and that the people listing reports `canInvite: false`. Seed an owner of the same business and assert their admission carries `role: 'owner'` for it.