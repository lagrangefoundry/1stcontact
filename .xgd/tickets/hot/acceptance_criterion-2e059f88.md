---
uid: acceptance_criterion-2e059f88
id: AC-463
type: acceptance_criterion
title: Visible text is captured verbatim with its exact painted styling
created_by: xgd
created_at: '2026-07-09T20:12:24.085468+00:00'
updated_at: '2026-07-09T20:12:24.085468+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
Every visible text run on the page is captured verbatim (exact characters, no paraphrase or truncation) and tagged with a role, and each run carries its own exact painted styling: color, font family, font size in pixels, and font weight as actually rendered.

## Verification
Capture a fixture with headings, body copy, and repeated card items. Assert each expected string (e.g. "Bright Harbor Studio", "What we do", "Strategy") is present as a content run, and that specific runs carry their exact painted values — e.g. the headline at 44px in the display font, and the "What we do" subheading painted `#1a73e8` at 32px.
