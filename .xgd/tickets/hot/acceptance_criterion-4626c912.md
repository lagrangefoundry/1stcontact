---
uid: acceptance_criterion-4626c912
id: AC-2306
type: acceptance_criterion
title: Alice is one person reachable at either of her two addresses, with the primary
  shown
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:11.765450+00:00'
updated_at: '2026-11-04T18:29:02.028974+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
After seeding, resolving Alice at `alice@plumbing.example` and resolving her at `alice@oldsalon.example` both return the same person, holding the same three businesses. Exactly one of her addresses is primary, and it is `alice@plumbing.example`. The person's reported address is `alice@plumbing.example` whichever address she was reached at. Signing in at the secondary address never relabels her.

## Verification
Seed, then look Alice up by each address. Assert that both lookups return the same person id and the same three businesses, that exactly one address is flagged primary (`alice@plumbing.example`), and that the shown address is the primary for both lookups.