---
uid: bug-ad50b1df
id: BUG-2
type: bug
title: capture→sandbox scaffold imports only a subset of captured assets (silent asset
  loss)
created_by: xgd
created_at: '2026-07-09T17:51:48.972285+00:00'
updated_at: '2026-07-09T17:51:48.972285+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Summary
The capture→sandbox scaffold populates a reproduction with only a **subset** of the assets the
capture actually downloaded, with no signal that assets are missing. A repro then silently runs
on the subset, and an operator/agent can wrongly conclude a needed asset is "unavailable."

## Evidence (joyfulculinary / REQ-36)
`1c capture` mirrored the full site into `storage/references/joyfulculinarycreations.com/index/assets/`
— including `9.jpg`, `10.jpg`, `13-1536x1536.png`, `IMG_8708…` (card photos), `JCC-WEBSITE-LOGO…png`,
Font Awesome/Elementor icon fonts, and **three** Lato weight files (100/300/400 per `lato.css`).
The sandbox site `storage/sandbox/joyfulculinary/draft/assets/` had only **3 images**, **1 Lato
woff2**, and **no icon fonts**. This led to a wrong "asset-blocked, supply source files" conclusion
for the Offerings card photos, the icons, and the light-Lato lead — all of which were present in
the bundle the whole time.

## Expected
The capture→sandbox scaffold imports **all** captured assets (or, at minimum, emits a report of
captured assets that are **not** referenced by the sandbox site, so gaps are visible). A repro
should never silently run on a subset of the captured assets.

## Impact
Faithful reproduction is undermined at its foundation: agents build config around a partial asset
set and mis-attribute missing content to "unavailable assets" rather than an incomplete import.

## References
[[DOC-19]] pass-4 update ("the capture bundle IS the asset source — check it first"); surfaced during REQ-36.
