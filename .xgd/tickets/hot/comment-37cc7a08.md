---
uid: comment-37cc7a08
id: COMMENT-72
type: comment
title: Comment on request REQ-36
created_by: xgd
created_at: '2026-07-09T22:00:44.807100+00:00'
updated_at: '2026-07-09T22:00:44.807100+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-d05379d0
  kind: note
---

## Session progress (2026-07-09 pass) — even process grid + white testimonial surround

Perceptual mean **24.86 -> 18.01** this pass. Reading the worst-region diff overlays at full res (not the mean) surfaced two genuinely-broken things I'd missed:

- **Process 'How It Works' cards were uneven-width** — a card holding a long unbreakable word ('Questionnaire') forced its 1fr grid track wider and starved its neighbours, so 'Visit our FAQ page' wrapped word-by-word into 4 lines. Root cause: grid children default to min-width:auto. Fix (framework, commit 33ef30e, v0.0.87): min-width:0 on .services-grid__card + the icon-left title. Columns now even, titles wrap cleanly to 2 lines like the reference. UAT added; 495 tests green.
- **Testimonial band surround was grey; reference is white** (green panel floats on white). Fixed by flipping that band's surface to default (config) — panel-secondary already forces its own white text, so the panel stays green+white. Large-area win.
- Config also: footer tagline + process card titles -> title case.

### Section-boundary table (ref vs ours, x=40 strip)
Hero 800/800 ok · Holistic 536/593 (+57 too tall, drift injector) · Quote ok · Testimonials surround now white ok · Process ~950/~984 ok · Footer 302/235 (67 short) + starts +63 late (cascade from Holistic).

### Remaining (minor/polish, honest)
- Holistic panel +57px too tall -> cascades footer offset (regions #2/#3). Thin-sliver in the diff, low visible priority.
- Hero logo ~50px right of the ref (ours pinned to the centered 1152 container). Concept matches (white script on dark translucent card).
- Quote-band 'Owner' renders white; reference is gold.
- Logo card has a border; reference is a borderless translucent bar.