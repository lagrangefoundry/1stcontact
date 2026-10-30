---
uid: report-a471355a
id: REPORT-6028
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:19:58.885488+00:00'
updated_at: '2026-10-04T22:19:58.885488+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — intent/bookkeeping ticket (2e), `--ours`, one side a
  strict superset. Pick `60dd71c053` (2026-08-28 09:40:51).

Blobs: base `276781dcf2` (= previous pick `04d4a9841d`'s theirs) / ours `36e51a0c74` (== HEAD,
unmoved) / theirs `ce69fd1a5d`.

Theirs' delta from base: `updated_at` → 08-28T16:40:51, `last_field_updated: story_points`, and an
appended "# What was built" body section (AC3 in-process fulfilment, one browser per run, `1c shot`
split, Files table, Test plan, AC status).

Ours (the 08-30 22:05 `bundled` state, == xgd-working `aae17fd9bf` apart from a trailing newline)
already contains that whole section. All six section headings are present. A sorted word-set
comparison of theirs' body against ours leaves only markup tokens: `_em_`→`*em*` normalisation and
the flattened table separators from ours' reflow. No content words are missing. Ours also leads on
`status` (`bundled`), `bundled_in: bundle-8eef3846` and `updated_at` (08-31).

## Incoming changes preserved

Not a code file. Every incoming content change is already present in ours, so there is zero net
change from HEAD, and `git status --porcelain` is empty.

## Forecast

Remaining picks on this ticket: `6531a2d1f4`, `3b9156ae89` and `aae17fd9bf` (08-30), all `--ours`.
The tip `58ba7fca8e` (08-31 `free_and_reconciled` + `completed_at`) is NOT `--ours`.
