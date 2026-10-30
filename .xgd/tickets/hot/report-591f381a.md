---
uid: report-591f381a
id: REPORT-4511
type: report
title: 'Resync resolve conflicts: 18ffaec45665d29545db8bfd323ee4bf6d1f8678'
created_by: xgd
created_at: '2026-09-20T19:21:47.799837+00:00'
updated_at: '2026-09-20T19:21:47.799837+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-34dd9049.md` — **AA** (both added; no common ancestor). Intent/bookkeeping ticket (`type: request`), so rule **2e** applies, not 2d: this is user-authored bookkeeping with no intent-ledger narrative to replay. Path is outside the sparse-checkout cone on a resync branch (DOC-986 §2/§4.1), so resolved via `git checkout --ours` + `git add --sparse`.

  The two sides differ **only** in frontmatter — the ticket body is byte-identical:

  | field | ours (HEAD) | theirs (`3e9239d6`) |
  |---|---|---|
  | `updated_at` | `2026-08-31T14:22:33Z` | `2026-08-22T21:54:23Z` |
  | `completed_at` | `2026-08-31T14:22:33Z` | `null` |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `bundled_in` | `bundle-b3b7c399` | *(absent)* |

  Ours is a strict superset and the later-positioned intent on every differing fact. Taking incoming here would have regressed `status` backwards along the lifecycle (`free_and_reconciled` → `ready_to_reconcile`), un-set `completed_at`, and dropped the `bundled_in` back-reference to `bundle-b3b7c399` — i.e. it would have discarded bookkeeping the resync branch already carries, not integrated developer work. **Ours wins wholesale**; the incoming side contributes no fact ours does not already hold in a more advanced form.

## Incoming changes preserved

No code, test, or spec-ticket files were in conflict — the sole conflicted path is a bookkeeping request ticket, and the conflict was confined to lifecycle frontmatter.

The incoming side of `request-34dd9049.md` carries no content, field, or section that ours lacks; every differing field is the *earlier* value of the same fact. There is therefore no incoming change to preserve and none was dropped. The BUG-1301 precedence exception was not invoked, and no test function on either side was deleted.

Note for the finalize step: this resolution nets to **no diff vs HEAD** (ours was already the staged content). Per the stage-resolution contract this is not a failure and `--skip` was deliberately not called — `git ls-files -u` is empty, no conflict markers remain on disk, and `CHERRY_PICK_HEAD` (`3e9239d68af7e90b87307b951a529ed4df328c20`) is intact for `cherry_pick_finalize_resolution`.
