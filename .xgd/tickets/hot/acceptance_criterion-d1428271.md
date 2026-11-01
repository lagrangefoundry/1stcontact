---
uid: acceptance_criterion-d1428271
id: AC-2234
type: acceptance_criterion
title: The portal is the business the caller is an account of (their own row's tenant),
  never env.TENANT_ID and never the business they operate
created_by: workflow:fix_reconciliation_review/builder
created_at: '2026-11-01T22:21:19.987684+00:00'
updated_at: '2026-11-01T22:21:19.987684+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
The portal at `/account` belongs to **the business the caller is an account of**:
the tenant the caller's own `users` row lives in (`admission.user.tenant_id`). It
is **never** the deployment's configured `env.TENANT_ID` (REQ-183 D2/§7), and it
is never the business the caller currently operates or has scoped to.

One level down this is what makes the portal correct. Someone who is an account
of a customer's business (their row lives in that business's tenant) gets that
business's portal, even when the Worker serving the request is configured with
the platform's `TENANT_ID` and the caller is scoped into a business they own.

## Verification
Against real D1 and R2:
- Seed a customer business (Salon).
- Invite Bob into Salon, so that Bob's `users` row has `tenant_id` = Salon.
- Provision Bob a business of his own.
- Author distinguishable portal sites in the platform business, in Salon and in Bob's business.
- Admit Bob as an account of Salon, and assert that his `tenant_id` is Salon while the Worker's `TENANT_ID` is the platform.
- Route `GET /account` with that admission, both scoped to Bob's own business and unscoped.
- Assert a 200 that carries Salon's portal text and neither the platform's nor Bob's business's.
