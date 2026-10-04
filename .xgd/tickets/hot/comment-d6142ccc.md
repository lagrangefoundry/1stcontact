---
uid: comment-d6142ccc
id: COMMENT-4882
type: comment
title: Comment on request REQ-332
created_by: xgd
created_at: '2026-10-04T15:03:40.291123+00:00'
updated_at: '2026-10-04T15:03:40.291123+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-a7b4cce9
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#8` — iteration 8 re-measurement of issue 2 (carousel clipping).

Still open, and now with a known mechanism, filed as **REQ-381 issue 1**. Bundle `storage/references/joyfulculinarycreations.com/index` (`capturedAt 2026-10-04T12:31:56.595Z`, schema 17): 10 `clip` findings (`leaf right edge 1700px exceeds viewport 1280px` on `0.82`, `1462px … 1440px` on `0.85`) and 60 escapes off `section-band-1`, plus values-diff HIGH `overflow` `≤1280w`→`1700w` and 2 LOW `surfaceFill` `#28542d`→`#ffffff`.

Why: `extract.ts:841` `clipOf` records the nearest `overflow != visible` ancestor, and Swiper puts `overflow:hidden` on every `.swiper-slide`. In `multistate.json` 1280x800 the two slides' `clip.id` are `…1.0.0.0.0.0` and `…1.0.0.0.0.2` (each slide itself, which contains its copy), while the arrows' is `…1.0.0.0` (`.elementor-main-swiper.swiper`, x 283.75 w 712.5 — the ancestor that actually cuts). `nestClipRegions` therefore groups each slide alone, finds no escape, and builds no container; the one `clip:true` container in `page.json` (`0.50.0.4`) holds only the two arrows. When the id was a sequence number (iteration 1) the slides happened to share one; REQ-338 issue 8's switch to `nodePathOf` exposed the nearest-ancestor choice. Needs a capture fix and a re-capture.
