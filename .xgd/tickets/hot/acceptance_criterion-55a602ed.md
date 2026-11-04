---
uid: acceptance_criterion-55a602ed
id: AC-2308
type: acceptance_criterion
title: Alice's Plumbing holds one member, one invitee who never came and one lead
  who was never invited
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:13.321027+00:00'
updated_at: '2026-11-04T18:17:13.321027+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
After seeding, Alice's Plumbing contains three other people, each in a distinct state:
- Bob: invited and signed up, with the current terms accepted;
- Carol: invited, never signed up, with no terms accepted;
- Dave: a lead with no invitation and no terms accepted.
None of the three is a user of the deployment's own business. Signing in as any of them is refused with the product's own "no user" answer, not with an error.

## Verification
Seed, then inspect each person's invitation, terms and pipeline state in Alice's Plumbing and assert the three distinct states. Admit each address against the deployment and assert a `no_user` refusal.
