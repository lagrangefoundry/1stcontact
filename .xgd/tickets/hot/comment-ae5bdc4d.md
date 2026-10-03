---
uid: comment-ae5bdc4d
id: COMMENT-4738
type: comment
title: Comment on request REQ-332
created_by: xgd
created_at: '2026-10-03T01:16:03.094378+00:00'
updated_at: '2026-10-03T01:16:03.094378+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-a7b4cce9
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#5` — iteration 5 re-measurement of issue 2 (carousel off-screen slides, no clip).

Re-captured bundle (`2026-10-02T23:18:22.456Z`, schema 12), fold on HEAD. **Unchanged.** `gate.json` has 10 `clip` findings
(`0.67` right edge 1412/1905/1700/1780px at 768/1024/1280/1440, plus `0.70 'Gray R.'` at 1462px at 1440) and 60 `section-band-1` escapes
(left/right, e.g. 644px at 768, 880/881px at 1024, 419/420px at 1280). values-diff: HIGH `overflow` `≤1280w → 1700w` on
`I cannot say enough…`. Two LOW `surfaceFill #28542d → #ffffff` deltas are the off-band slides at `x −419` and `x 1027`
reading the page fill. `actual.png` is **1700px** wide against the reference's 1280. These are 70 of the 206 layout findings.
