---
uid: report-f5aa03d7
id: REPORT-6059
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:39:01.551128+00:00'
updated_at: '2026-10-04T22:39:01.551128+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` (REQ-162). Intent/bookkeeping ticket (rule 2e). Resolved `--ours`, zero net change from HEAD.
  - Pick: `d86269421c` (2026-08-31 14:41:19, `free_coding` → `free_coded`).
  - Blobs: base `914093b08d` (the previous pick's theirs blob) / ours `e909dcbb97` (== HEAD blob, unchanged) / theirs `2397005c92`.
  - Theirs' change from base:
    - `status: free_coded`, `last_field_updated: status`, `updated_at` 08-31 21:41.
    - Adds `version: 0.2.20` (ours has it byte-identical).
    - Adds a `commits` list of three `working_sha` entries (`fc117f1d35`, `2284bf4bbd`, `bc36b2cce9`).
    - Removes one blank line in the body.
  - The `commits` list is the only real difference. Ours carries the post-reconcile form: `working_sha: null`, `main_sha: 4b43dd9a5c`, plus an `orphan_commits` old→new map. That is how main represents reconciled working commits, the same shape as the bundle-8e1807f6 vs bundle-4efd33fe pair.
  - `4b43dd9a5c` (2026-09-01 18:33:59) is an ancestor of HEAD, so the `working_sha` entries were reconciled into it after this pick.
  - Ours is also further along the lifecycle (`free_and_reconciled`, `completed_at` 2026-09-02). Theirs' `free_coded` is a superseded intermediate state.

## Incoming changes preserved

No code files were involved. The incoming facts are present in ours either byte-identically (`version`, the body) or in their reconciled successor form (`commits`, `status`).

## Forecast

Remaining picks: `22c666b6fb`, `0c7b4f9072`, `a785e4bd9e`. All are expected to resolve `--ours`. The xgd-working tip differs from ours only in the `commits` representation and in `updated_at`/`completed_at` (01:34:01 vs ours' 01:34:00/01:34:36), so ours is still the reconciled successor.
