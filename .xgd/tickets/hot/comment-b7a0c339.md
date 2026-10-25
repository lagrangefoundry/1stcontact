---
uid: comment-b7a0c339
id: COMMENT-4883
type: comment
title: Comment on request REQ-265
created_by: xgd
created_at: '2026-10-04T15:03:54.314460+00:00'
updated_at: '2026-10-04T15:03:54.314460+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-47ab4ddc
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#8` — iteration 8 re-measurement of the half-leading class on joyfulculinarycreations.com.

Bundle `storage/references/joyfulculinarycreations.com/index` (`capturedAt 2026-10-04T12:31:56.595Z`, schema 17); artifacts `storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-8/`.

- `values-diff.json` CRITICAL `position`: "Dreaming of healthier meals" `(20, 311)`→`(20, 300)`; "on your dinner table?" `(20, 387)`→`(20, 376)` (−11 both); "What people are saying" `(455, 3009)`→`(455, 2963)` (magnitude 46.40625).
- `regions.json` (ranked total 29384.07): hero regions #1 (16,320 640x144, score 21567.59), #2 (3495.09), #4 (827.18) = 25889.86 = **88.1%**; ref node box for "Dreaming…" `h 97` vs actual `h 75.41` at the same `y 311.3`. "What people are saying" regions #3/#6/#7/#10/#11/#12 = 2410.37 = 8.2%. Together 96.3% of the ranked pixel score, unchanged in kind from COMMENT-4848.
