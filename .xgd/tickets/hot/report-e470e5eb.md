---
uid: report-e470e5eb
id: REPORT-6742
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-26T00:14:00.329339+00:00'
updated_at: '2026-10-26T00:14:00.329339+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/request-43ce519b.md`: intent/bookkeeping ticket (2e), outside the sparse cone and index-only. Rule: one side is a strict superset, so keep the superset (ours/HEAD). Resolved with `git checkout --ours` + `git add --sparse`.
  - Base -> theirs (c36b405f, "update request request-43ce519b"): status free_coding -> free_coded, added `commits` (working_sha ada55fd3...), `version: 0.2.46`, updated_at 2026-09-02T22:59:57.
  - Base -> ours (HEAD): has the same `commits` entry and `version: 0.2.46`, plus `bundled_in: bundle-5607a08d`, status `bundled` (later in the lifecycle than free_coded), updated_at 2026-10-25T22:19:55 (more recent, which also satisfies the enrichment's take-the-most-recent rule).
  - The body text is identical on both sides (the same trailing-newline and leading-blank-line changes).

## Incoming changes preserved

No code files involved. Every fact the incoming commit adds (the commits/working_sha entry and the version) is already in HEAD. Its status value free_coded is replaced by HEAD's later `bundled`. The resolved index matches HEAD, so this cherry-pick is redundant (empty). It is not a discard, because the incoming content is already present in HEAD. Per STEP 4, finalize should detect the empty staged diff and skip it.
