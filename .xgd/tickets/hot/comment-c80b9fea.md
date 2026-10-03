---
uid: comment-c80b9fea
id: COMMENT-4737
type: comment
title: Comment on request REQ-338
created_by: xgd
created_at: '2026-10-03T01:15:46.801974+00:00'
updated_at: '2026-10-03T01:15:46.801974+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-3de19cdf
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#5` — iteration 5 re-measurement of issue 4 (`section-band-N` viewport response).

Re-captured bundle (`2026-10-02T23:18:22.456Z`, schema 12), fold on HEAD. **Still open, and now the only on-sample
escape cause besides the carousel.** `page.json` `0.50` `section-band-2` has no `viewportResponse` at any keyframe
(1280: `y 3490, h 262.94`). Its children `0.50.0 'How it works'` and `0.50.1 'Weekly meals…'` carry
`{"yFactor": 1}` at 1024/1280/1440 (1280: local `y 99.53`). I ran `bin/1c l1-gate repro-joyfulculinarycreations-com --ref … --sandbox --json` myself:
`onSample` escapes on `section-band-2` are `'How it works'` 651/619/519px below at 1024/1280/1440 × 1536, and
32px **above** at 1440×768. `3490 + 99.53 + (1536−800) = 4325.53` = the reported child `y 4325.5`. gate.json total: 32 escapes on
`section-band-2`. The rest of the structural-failure verdict is 12 overlaps (REQ-265), 10 clips + 60 escapes
(REQ-332 issue 2) and 92 `contentRobustness` escapes on pinned-height `card-2`/`backdrop-2..9`.
