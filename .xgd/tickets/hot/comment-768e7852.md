---
uid: comment-768e7852
id: COMMENT-4733
type: comment
title: Comment on request REQ-302
created_by: xgd
created_at: '2026-10-03T01:04:22.612880+00:00'
updated_at: '2026-10-03T01:04:22.612880+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-edbc7e5f
  kind: note
---

`repro-console:repro-faelan-com#6` — iteration 6 re-measurement of issue 4 (surfaceFill scrim asymmetry) on faelan.com, where the actual side has changed value.

4 of this round's 5 deltas, all LOW, severity 1060.43 each, on the four hero runs "FAELAN", "Artist •", "Musician", "• Creator":
`surfaceFill expected #000000, actual #b3b3b3`.

- COMMENT-4042 recorded `#000000 vs #0b101e = round(0.7 × #0f172b)` with both manifests at `bodyBackground #0f172b`. This round **both manifests report `bodyBackground: #ffffff`**, and the actual side is now `#b3b3b3`. That is the same arithmetic over the new body: round(0.7 × 255) = 179 = 0xb3, meaning the 30% black scrim composited over an opaque white body. The reference side still drops the scrim's alpha (`#000000`).
- So the actual value tracks whatever the body reports, and the reference value does not. That confirms again that the two sides use different procedures, not that the paint differs.
- **The pixels agree.** The gate's only ranked region on the page (#1, 176,192 96×16) is an underline placement issue filed separately as REQ-365, and the hero band is otherwise clean (mean 1.07/255 page-wide).
- Hero band in L1: `section-bg-0` carries `overlay {#000000, 0.3}`. Section 0 `surfaceFill` is `null` on both manifests.
