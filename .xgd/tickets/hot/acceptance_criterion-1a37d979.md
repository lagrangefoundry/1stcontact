---
uid: acceptance_criterion-1a37d979
id: AC-2402
type: acceptance_criterion
title: solve refuses what one translation attribute cannot do, saying what to do instead
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:52.252413+00:00'
updated_at: '2026-11-08T10:12:53.486739+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
`solve` returns no value and refuses, with a sentence naming the alternative, when: the node is a kind no single attribute moves (e.g. `<line>`, `<path>`), and the refusal lists the kinds it does move; the node is inside a rotated or skewed transform; the node's position attribute is a list (per-glyph positions) rather than one number; `move` is given and names a different node from the one `so` anchors; or the node is scaled to zero on that axis. Anchors on different axes are refused as in relate.

## Verification
On the wordmark fixture, solve against a `<path>`, a `<line>`, a `<text>` flagged as under a rotation, a `<text x="1 2 3">`, a request whose `move` disagrees with `so`, a node scaled to zero, and anchors on different axes. Assert each is refused with its own message.

In a real browser (skipped, with the reason, where no Chromium can launch), so that the skew flag and the authored attributes are the ones the shipped `measureScript` reads: write a drawing with `#tilt` inside `<g transform="rotate(10)">` and `#glyphs` with `x="1 2 3"`. Assert solving `#tilt.baseline` is refused as inside a rotated or skewed transform, and solving `#glyphs.left` is refused as carrying `x="1 2 3"`, a list rather than one number. Assert an untransformed single-valued `<text>` in the same drawing still solves.
