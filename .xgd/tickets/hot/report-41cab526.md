---
uid: report-41cab526
id: REPORT-6113
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T23:10:28.515882+00:00'
updated_at: '2026-10-04T23:10:28.515882+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync conflict resolution: request-119dd4af (REQ-159) / 1d262a55d6

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md`: intent/bookkeeping ticket. Kept ours, with zero net change from HEAD.
  - Blobs: base `3d15e21eaa` (the previous pick `3013025820`'s theirs), ours `97468957db` (== HEAD, unchanged), theirs `2218e0bdf7`.
  - Theirs (08-31 15:18) is a large body edit. It rewords the Why, Index-residency and floor paragraphs, drops the Acceptance and Open-questions sections, and appends a "# What landed" section (commit `115f0d39ec`, version 0.2.23).
  - `git diff theirs ours` shows the body is identical apart from ours lacking a newline at end of file. The only other differences are frontmatter fields that ours holds in a later state: `updated_at` 09-09, `status: bundled`, `last_field_updated: status`, and `bundled_in: bundle-87be4669`, all from xgd-working's re-bundle commit `294d87111c`.
  - So ours is a strict superset of theirs, and nothing from this pick is lost.

## Incoming changes preserved

There are no code files in this pick. Ours already contains the incoming body edit verbatim.

## Forecast

The remaining REQ-159 picks `f3c81c5df5`, `ed7b3cc779`, `a077c28171`, `c09f4e8438` and `294d87111c` should all keep ours. The tip `b354b050e7` (09-11) should not: check it with a diff of ours against the tip.
