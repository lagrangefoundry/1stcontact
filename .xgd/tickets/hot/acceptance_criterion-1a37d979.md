---
uid: acceptance_criterion-1a37d979
id: AC-2402
type: acceptance_criterion
title: solve refuses what one translation attribute cannot do, saying what to do instead
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:52.252413+00:00'
updated_at: '2026-11-08T07:16:52.252413+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
`solve` returns no value and refuses, with a sentence naming the alternative, when: the node is a kind no single attribute moves (e.g. `<line>`, `<path>`), and the refusal lists the kinds it does move; the node is inside a rotated or skewed transform; the node's position attribute is a list (per-glyph positions) rather than one number; `move` is given and names a different node from the one `so` anchors; or the node is scaled to zero on that axis. Anchors on different axes are refused as in relate.

## Verification
Solve against a `<path>`, a `<text>` under `rotate(10)`, a `<text x="1 2 3">`, and a request whose `move` disagrees with `so`. Assert each is refused with its own message.