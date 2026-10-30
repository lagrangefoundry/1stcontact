---
uid: report-07e3c72a
id: REPORT-6354
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T04:12:01.810143+00:00'
updated_at: '2026-10-05T04:12:01.810143+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` (REQ-172): an intent/bookkeeping ticket, UU, resolved `--ours`.
  - The pick is `8760eac310` (2026-09-01 14:34:31 -0700), which moves `free_coding` to `free_coded`.
  - Blobs: base `180dc007d3` (the previous pick's theirs), ours `d6fbb21c84` (== HEAD blob, unchanged), theirs `09f46fb895`.
  - Theirs changes only the frontmatter: it sets `status: free_coded` and adds the `commits` list (working_sha `eb6655c337`, `324b55bf19`) and `version: 0.2.37`. It also drops the EOF newline.
  - Ours already carries that `commits` list and `version` byte-identically. Ours is also further along: `free_and_reconciled`, `completed_at` 09-14, `bundled_in: bundle-8e1807f6`, and `updated_at` 09-19. Ours is a superset, so it wins.
  - Result: zero net change from HEAD. `git status --porcelain` is empty and CHERRY_PICK_HEAD is intact.

## Incoming changes preserved

There are no code files in this pick. Every fact theirs writes is already present in ours.
