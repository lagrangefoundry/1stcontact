---
uid: comment-65863f82
id: COMMENT-4888
type: comment
title: Comment on request REQ-302
created_by: xgd
created_at: '2026-10-04T15:54:57.353818+00:00'
updated_at: '2026-10-04T15:54:57.353818+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-edbc7e5f
  kind: note
---

`repro-console:repro-www-bluelotusintegralhealing-com#3` — iteration 3 re-measurement of issue 4 (surfaceFill alpha asymmetry) on www.bluelotusintegralhealing.com.

`values-diff.json` has 3 LOW `surfaceFill` deltas (severity 1060.05 each) on the hero
runs "Your Transformative Beyond Quantum Healing Journey Awaits", "Welcome to Blue
Lotus Quantum Healing! …" and "Ready to begin? …". Expected is `#30499c`, actual is
`#4359a5`. The L1 hero container `section-bg-0` carries
`overlay {color:#30499c, opacity:0.91}`. Ours is that overlay composited over white:
0.91·0x30 + 0.09·255 = 66.6 → 0x43, 0.91·0x49 + 0.09·255 = 89.4 → 0x59,
0.91·0x9c + 0.09·255 = 164.9 → 0xa5. The reference drops the alpha and reports the
bare overlay colour. It's the same shape as the earlier bundles, here with a 0.91
scrim over a white body. These are 3 of this round's 8 deltas. The pixels in the
hero don't rank: no region falls on these runs.
