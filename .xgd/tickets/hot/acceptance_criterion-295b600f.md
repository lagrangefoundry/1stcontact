---
uid: acceptance_criterion-295b600f
id: AC-2255
type: acceptance_criterion
title: A business names the account that owns it; the platform business is owned by
  nobody; no business id the product mints or the deployment names reads acct_
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:10:56.252656+00:00'
updated_at: '2026-11-04T17:10:56.252656+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion

A business names the account that owns it. That account is the payer, not a
person, and not whichever membership row was written first. A business
provisioned for an account carries that account's key as its owner, and its own
key carries the business prefix (`biz_`).

The platform business (1st Contact) names no owner. It is nobody's product, and
seeding the break-glass operator does not make that operator its owner, though
the operator still gets an account of their own.

No business key the product mints, and no business id the deployment names (the
configured platform business id, in every environment block and in the baseline
seed), reads `acct_`. That prefix belongs to accounts alone, and the set of
business keys and the set of account keys never overlap.

## Verification

Provision a business through the invite-then-provision fixture and assert that
its owner is the person's account key (not the person's id) and that its key
matches `biz_` followed by 32 hex characters. Seed a break-glass operator and
assert that the platform business's owner is still null, while the operator's
account key reads `acct_` and that account belongs to the platform business.
After provisioning, read every business key and every account key from the
database. Assert that no business key starts with `acct_`, every account key
does, and the two sets are disjoint. Read the configured platform business id
from both deployment environment blocks and the baseline seed, and assert that
all three agree and read `biz_`.
