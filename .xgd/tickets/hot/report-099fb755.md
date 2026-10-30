---
uid: report-099fb755
id: REPORT-6309
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:44:34.777833+00:00'
updated_at: '2026-10-05T03:44:34.777833+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync conflict resolution — bug-3ade1af4 / 08bbde0676

Pick: `08bbde0676` (2026-09-01 12:28:24 -0700, free_coding→free_coded + commits + `version 0.2.33`).
HEAD `7ef32ed2d6`. Path `.xgd/tickets/hot/bug-3ade1af4.md` (UU, ticket path).

Blobs: base `036c116920` (== previous pick's theirs) / ours `4b1ec9bd2a` (== HEAD) / theirs `2a59e08e19`.

Theirs' delta from base: `updated_at` 19:28:24, `last_field_updated: status`, `status: free_coded`,
adds `commits` (working_sha e5d762332d) and `version: 0.2.33`, drops EOF newline.

Ours already carries `commits` and `version` byte-identical. Remaining divergences all lead on ours:
`updated_at` 09-19 vs 09-01, `completed_at` 09-14 vs null, `status: free_and_reconciled` (later lifecycle
state than free_coded), `bundled_in: bundle-8e1807f6`, and the later retitle ("27 failures + 30 collection
errors"). Ours is a strict superset → `--ours`, zero net change from HEAD.

Same blobs and outcome as reconcile-BUNDLE-29 REPORT-6133.

Forecast: `d975830c32` (story_points stays 5), `cb4ece9296` (retitle ours already has), `d22ba37c40`
(→ready_to_reconcile) are `--ours`. The xgd-working tip `3f23e96b90` (09-19) is the exception: it wins
`updated_at` only.
