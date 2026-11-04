---
uid: acceptance_criterion-555e1c20
id: AC-2305
type: acceptance_criterion
title: bin/seed on an empty local store populates the full development cast
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:11.003869+00:00'
updated_at: '2026-11-04T18:29:02.383130+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
Run against a local D1 that has the baseline schema and no rows, `bin/seed` exits 0. Afterwards the store holds exactly this cast:
- one person, Alice, with addresses `alice@plumbing.example` and `alice@oldsalon.example`;
- three businesses on Alice's single account: Alice's Plumbing, Alice's Lettings and Alice's Old Salon. Alice is the owner of each;
- in Alice's Plumbing: Bob (`bob@example.com`), Carol (`carol@example.com`) and Dave (`dave@example.com`).
No other people, businesses or sites are created.

## Verification
Apply the baseline to an empty local D1 and run the seed. Then query people by address, businesses by name, account ownership and memberships, and assert that the set matches the cast exactly.