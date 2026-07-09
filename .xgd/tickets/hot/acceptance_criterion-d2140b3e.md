---
uid: acceptance_criterion-d2140b3e
id: AC-514
type: acceptance_criterion
title: markdown renders verbatim (smartypants disabled) preserving straight quotes
  and double hyphens
created_by: xgd
created_at: '2026-07-09T22:11:26.148087+00:00'
updated_at: '2026-07-09T22:11:26.148087+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
Markdown content is rendered verbatim with smartypants disabled: straight quotes (`'`, `"`) are not curled and `--` is not converted to an em-dash, so the rendered text equals its authored/captured source character-for-character. This keeps rendered content matching the verbatim source a faithful-repro capture records (punctuation the source wants curled must be authored that way, not injected by the renderer).

## Verification
Render a markdown body containing a straight apostrophe (e.g. `We're`) and a `--` sequence; assert the rendered output preserves the straight apostrophe and the literal `--` (no `’`, no `—`).
