---
uid: report-a90ec1e9
id: REPORT-3510
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-04T05:53:36.380411+00:00'
updated_at: '2026-09-04T05:53:36.380411+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-203b1dc2
  plan_item_index: '14'
---

All 13 acceptance criteria are attached to the story.

Notes on what grounded the story: I read REQ-167's section of the bundle body first (the migration, provisioning-at-invite, login-binds-and-does-not-provision, the single denial message, the expiry insistence, and the explicit out-of-scope list), then `db/migrations/0004_identity.sql`, `apps/control-app/src/identity.ts` and `apps/control-app/src/index.ts`, plus the existing FC UATs in `tests/test_UAT_FC_REQ-167_identity.workers.test.ts`. No contradiction between intent and code surfaced. Seven behaviours the intent never mentions (email casefolding, the arrival stamp surviving a refusal, the unconfigured-tenant refusal, the definition of "best" grant, ownership withdrawal and person suspension, the refusal's cache/index directives, and the starter site's collision-free address) are formalised as ACs and recorded under `## Reconciliation Decisions` with rationale and AC ids.

A new capability was needed — CAP-110 — because the existing `Operator Access Gate` capability is about who the caller *is*, and per the plan's own justification the provisioning and entitlement lifecycle cannot be absorbed into it without changing what that capability is about.

```
Story #14 created for reconciliation bundle-203b1dc2

Story UID: story-e7871ed7 (STORY-136)
Title: The invitation provisions the account, and every login binds a verified email to a grant that is still live
Type: feature
Capability: capability-07f08dcf (CAP-110 — Identity, Accounts & Entitlement) [newly created]
Acceptance Criteria: 13 created (AC-1591 … AC-1603)

Progress: 14 of 15 plan items complete
```
