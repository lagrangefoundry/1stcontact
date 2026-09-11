---
uid: report-ec61e1bc
id: REPORT-4049
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T21:50:29.508935+00:00'
updated_at: '2026-09-11T21:50:29.508935+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-94e93caa.md` — class **AA** (both added), intent/bookkeeping ticket → rule **2e**. Sparse-checkout path, resolved via `git checkout --ours` + `git add --sparse`.

  Both sides carry the identical 127-line request body; the blobs differ only in frontmatter bookkeeping:

  | field | ours (HEAD, f7bd4ca, 2026-08-31) | incoming (83973a5, 2026-08-22) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `updated_at` | 2026-08-31T14:22:27Z | 2026-08-23T03:29:52Z |
  | `completed_at` | 2026-08-31T14:22:27Z | `null` |
  | `chat_comment` | `comment-18e5a285` | (absent) |
  | `bundled_in` | `bundle-b3b7c399` | (absent) |

  Ours is a strict superset on every field and the later-positioned side by both commit date (2026-08-31 vs 2026-08-22) and `updated_at`. Per 2e's superset clause and the enrichment's "take the more recent commit by timestamp" rule, ours wins per-fact: incoming contributes no field that ours lacks, and taking incoming would have reverted the operator-advanced `status`/`completed_at`/`bundled_in` bookkeeping. No content was invented; no field outside the two sides' own values was touched.

## Incoming changes preserved

- `.xgd/tickets/hot/request-94e93caa.md` — the incoming commit's substantive change is the request body itself (the commit adds the file, +127 lines). That body is present verbatim in the resolved (HEAD) version — confirmed by diffing the two conflict blobs directly (`ca45d92` vs `ee4b757`), which shows **frontmatter hunks only** and no body differences, and by reading the resolved file (title at line 5, `# Reserve locale-shaped page slugs` heading at line 29).

No hunk was dropped under the BUG-1301 precedence exception; no test file was involved.

Note on the staged result (STEP 4, BUG-1109/BUG-1122): the resolution nets to **no diff vs HEAD** (`git diff --cached --stat` is empty). This is the redundant-commit case, not a discard — STEP 3's distinguishing check passes because the incoming commit's key content is *present* in HEAD (reached by a later route that also advanced the ticket's status), rather than absent. Per STEP 4, `--skip` was not invoked; the conflict is staged and the cherry-pick sequencer state (CHERRY_PICK_HEAD) is left intact for `cherry_pick_finalize_resolution` to handle.
