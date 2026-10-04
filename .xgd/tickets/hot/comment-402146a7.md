---
uid: comment-402146a7
id: COMMENT-4894
type: comment
title: Comment on bug BUG-199
created_by: xgd
created_at: '2026-10-04T16:22:25.714927+00:00'
updated_at: '2026-10-04T16:22:25.714927+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-cb156476
  kind: note
---

`repro-console:repro-www-hearingzone510-com#4` — iteration 4 re-measurement on the re-captured `storage/references/www.hearingzone510.com/index` (2026-10-04T15:41:21.943Z, schema 19).

This bug is now **the entire unmeasured count** of that round. The gate reports "unmeasured 4 —
0 axes, 0 bands, 4 populations", which is `values-diff.json` `unmatched: 2` + `unpairedActual: 2`.
- Reference side: `expected-manifest.json` elements 110/111 are `role link`, text `(link)`, href
  facebook / linkedin, `src assets/inline-svg-f21dae30.svg` / `-59d99928.svg`, boxes
  `(35.73, 5351.58) 20×20` / `(91.20, 5351.58) 20×20`.
- Reproduction side: `actual-manifest.json` 109/110 are `role img`, text `Go to Facebook page` /
  `Go to Linkedin-in page`, same hrefs and srcs, boxes `(35.72, 5351.58) 20×20` /
  `(91.19, 5351.58) 20×20`.

The served markup is `<a href="https://www.facebook.com/hearingzone" style="display:contents"><img
class="l1-117" … alt="Go to Facebook page" /></a>`. The `display:contents` anchor has no box, so
the extractor records the `<img>`.

So this round has 2 CRITICAL `missing` deltas plus 2 unpaired for two icons that are in the same
place, with the same link and the same image.
