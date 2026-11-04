---
uid: acceptance_criterion-30eb744e
id: AC-2310
type: acceptance_criterion
title: Every seeded person has exactly one current name, covering the four name shapes
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:15.014153+00:00'
updated_at: '2026-11-04T18:29:00.338556+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
After seeding, every seeded person has exactly one current (not superseded) name, and the cast covers these name shapes:
- Alice: a stored display name with a title (`Dr`) and a known-as (`Ali`) used as the greeting. She also has one superseded name with reason "changed", which is reported as a former name, and one with reason "corrected", which is not.
- Bob: a superseded name with no reason, which is treated as a correction and not as a former name.
- Carol: a mononym with neither a given nor a family name.
- Dave: no known-as, so he is greeted by his given name.
Superseding a name leaves the person's id unchanged.

## Verification
Seed, resolve each person's name through the product's name resolver, and assert the display name, greeting, former-name list and the count of current names for each person.