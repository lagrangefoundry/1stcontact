---
uid: acceptance_criterion-bae5941a
id: AC-2238
type: acceptance_criterion
title: The schema is one baseline migration that seeds no people, and its platform-business
  key equals the deployment's configured id
created_by: xgd
created_at: '2026-11-04T16:01:02.709511+00:00'
updated_at: '2026-11-04T16:01:02.709511+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

The database schema is created by **exactly one migration**, the baseline; no earlier numbered migration remains. Applied to an empty database it creates the platform business's row and **no people**: no user, no email, no membership and no entitlement exist afterwards.

The platform business's key seeded by the baseline is an opaque id, and it is **the same literal** the deployment configuration names as its platform business, in the default variable block and in the production environment's variable block alike. A deployment therefore cannot disagree with its own database about which business it is.

## Verification

List the migrations directory and assert it holds the baseline alone. Apply it to a fresh database and assert one business row and zero rows in the people tables. Read the platform business id from both variable blocks of the deployment configuration and assert each equals the id the baseline inserts, and that the value is opaque-shaped.