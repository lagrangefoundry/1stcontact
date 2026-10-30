---
uid: report-f149a708
id: REPORT-6339
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T04:00:42.372408+00:00'
updated_at: '2026-10-05T04:00:42.372408+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Conflict

Pick `235bdfc02d` (09-01 14:03:44, BUG-42) on `.xgd/tickets/hot/bug-034bf955.md`, UU. HEAD `7ef32ed2d6`.

- base `c2fe8643eb` (draft create)
- ours `89395722bc` (== `HEAD:<path>`)
- theirs `79bb5d0952`

## Analysis

The only thing theirs changes from base is adding `chat_comment: comment-77992e39`. Ours already carries that line byte-for-byte. Ours also has the full later lifecycle: title, body, `bundled_in: bundle-8e1807f6`, `completed_at`, and `status: free_and_reconciled`. Theirs, by contrast, is still the draft `Untitled` / `(new ticket)`.

`git diff :2: xgd-working:<path>` (tip `49266c45a3`) shows that incoming's own tip carries everything ours has. The only difference is `updated_at`, where the tip is 18.8 s later. That fact belongs to the tip pick, not to this one.

These are the same blobs as the earlier deliveries of this pick: REPORT-5897 and REPORT-6168.

## Resolution

`git checkout --ours` then `git add --sparse`. Zero net change from HEAD. `git status --porcelain` is empty and CHERRY_PICK_HEAD is intact.

## Forecast

The remaining BUG-42 ticket picks (`24b0c044bc` … `d0bab67c2b`) should all resolve to `--ours`. The tip `e269a1b69f` / `49266c45a3` is the exception: it wins `updated_at` only.
