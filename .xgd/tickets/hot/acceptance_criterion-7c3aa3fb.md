---
uid: acceptance_criterion-7c3aa3fb
id: AC-2422
type: acceptance_criterion
title: Only points the draft refers to are expanded; typed 'Point X' resolves leniently
  and unknown labels stay literal
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:46:38.015357+00:00'
updated_at: '2026-11-08T13:05:17.572075+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion
- A live point is expanded only if the draft refers to it, either as a `[Point X]` pill or as hand-typed `Point X` / `point x` (any case, optional spaces inside brackets). Each referenced point appears exactly once in the expansion, even if referred to more than once.
- A live point that the draft never refers to (for example, its pill was deleted and never restored) is not included.
- A reference to a letter with no live point (e.g. `Point Q` when only A and B exist) is left in the text as written and produces no block.
- With several referenced points, each gets its own block under its own label.
- A draft that refers to no live point is sent unchanged: no heading, no blocks, and the marks are not marked as sent.

## Verification
Place points A, B and C. Send a draft containing `[Point A]`, a typed `point c` and `Point Q`, with B's pill deleted. Assert the expansion has exactly two blocks (A, C), B is absent, and `Point Q` appears in the prose with no block. Send a draft with no point references and assert the sent text equals the draft and the marks are still live.