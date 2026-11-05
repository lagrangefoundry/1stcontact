---
uid: comment-35bc7918
id: COMMENT-4893
type: comment
title: Comment on bug BUG-187
created_by: xgd
created_at: '2026-10-04T16:22:23.055662+00:00'
updated_at: '2026-10-04T16:22:23.055662+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-332d305f
  kind: note
---

`repro-console:repro-www-hearingzone510-com#4` — iteration 4 re-measurement of item 3 (a text run measured by a different element on each side), after the re-capture of 2026-10-04T15:41:21.943Z (schema 19).

**Item 3 is still live, in both directions.** It is 5 of this round's 20 CRITICAL deltas, and the
glyphs agree in every case.

1. **Button runs: the reference measures the anchor, ours measures the text.**
   `values-diff.json`: `SCHEDULE AN APPOINTMENT` `@ (472, 1077)` vs `@ (472, 1090)` (13.69);
   `EXPLORE MORE SERVICES` `@ (498, 3602)` vs `@ (498, 3616)` (13.89); `510-865-8113`
   `@ (1046, 62)` vs `@ (1046, 68)` (5.84). Glyph tops (`box.y + (renderedTextBox.y − box.y)`) are:
   - SCHEDULE: ref 1076.61 + 14.84 = **1091.45**, ours 1090.30 + 1.0 = **1091.30**
   - EXPLORE: 3601.95 + 15.2 = **3617.15** vs 3615.84 + 1.0 = **3616.84**
   - 510: 61.84 + 17.0 = **78.84** vs 67.69 + 11.0 = **78.69**

   The paint differs by 0.15–0.31px. The 6–14px is the reference box being the `<a>` button's
   border box, while ours is the text element inside the renderer's card.
2. **"F" / "or over 20 years…": swapped.** Ref "F" box y 1364 with offset 0; ours 1361.5 with
   offset 2.5. Ref paragraph box y 1361.5 with offset 2.5; ours 1364 with offset 0. Glyph tops are
   1364 on all four. The fix described here made the reference read the text node's own range.
   The reproduction side now reads the renderer's `<p>` box for "F" and the span's for the rest,
   so the asymmetry has moved rather than closed. This produces 2 CRITICAL `position` and 1 HIGH
   `zIndex` (`above "F"` vs `below "F"`).

**Check:** in `storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-4/diff/`, compare
`box.y + renderedTextBox.y − box.y` per side for those 5 texts in `expected-manifest.json` /
`actual-manifest.json`. They agree to ≤0.31px, while `values-diff.json` reports 2.5–13.89px.
**Fixed:** `position` compares the same element on both sides (or glyph tops), and these 5
deltas disappear.
