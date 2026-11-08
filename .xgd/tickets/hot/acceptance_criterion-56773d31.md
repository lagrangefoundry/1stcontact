---
uid: acceptance_criterion-56773d31
id: AC-2488
type: acceptance_criterion
title: check_fidelity's value gates refuse an image picture, saying to use compare
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:03:38.328693+00:00'
updated_at: '2026-11-08T23:03:38.328693+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
`check_fidelity` with an `image` picture as `actual` is refused: its value gates need a live page, and the refusal says a stored picture is a picture rather than a page — there is nothing behind it to measure — and to use `compare` for a stored picture. No verdict is returned.

## Verification
Call `check_fidelity` with `actual: {kind: 'image', image: 'hero.png'}` against a seeded reference and assert the refusal says the value gates need a live page, says a stored picture is not a page, and names `compare`; assert no `verdict` field is returned.
