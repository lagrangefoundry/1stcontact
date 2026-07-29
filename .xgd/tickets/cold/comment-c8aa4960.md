---
uid: comment-c8aa4960
id: COMMENT-176
type: comment
title: Comment on request REQ-79
created_by: xgd
created_at: '2026-07-19T01:14:46.856926+00:00'
updated_at: '2026-07-19T01:14:46.856926+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-87b26bca
  kind: note
---

## Phase 1 (config-only reproduction) — progress

**Done:** Deleted stale Jul-3 bundle + old sandbox repro. Fresh 1c capture (84 assets, full 320-1440 viewport ladder, multistate.json). Authored fresh sandbox site joyfulculinary — all 9 visual bands mapped onto the 7 framework modules (header/hero/text-block x2/services-grid x3/layer/footer); renders clean. Fonts (Oswald/Karla/Raleway/Lato) + all images load. Hero is a strong perceptual match.

**Gate state:** values-diff --collapse = 42 matched, repair order A 172 (copy) -> B 145 (emergent). adopt-values applied (only 9 flat deltas -> transcription was accurate). Most fontSizePx/color/weight rows already OK.

**Blockers / gaps surfaced (for Phase-2 alignment):**
1. TOOLING: 1c aligned-crops (current perceptual eyes, REQ-78) has NO --sandbox support -> cannot run the perceptual gate on a sandbox repro. Hard blocker.
2. TOOLING: values-diff fontLoad reports 32 fallback CRITICALs though pixels prove all fonts render (render-seam race, likely not awaiting document.fonts.ready) -> inflates CRITICAL count, masks real structural deltas.
3. CAPTURE: Elementor page flattened to ONE white section; real per-band backgrounds (hero photo+scrim, market-vegetables band, dark/grey/tan bands) live only in post-4401.css -> value-diff blind to per-band backgrounds.
4. CONTENT/config: How-it-works steps use gold Font-Awesome icons (config-fixable: services-grid iconFont:icon-font + iconLayout:left, needs glyph map); uppercase headings (headingCase:upper); bare cards on mid-grey band (arbitrary grey surface not covered by enum surfaces).
5. FRAMEWORK GAP: testimonial CAROUSEL has no module -> rendered as static 3-card grid.

No framework code changed (Phase 1 is config-only; sandbox is gitignored). Awaiting Phase-2 gap sign-off before any code.