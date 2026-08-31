---
uid: report-d4781b53
id: REPORT-2825
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:58:15.938652+00:00'
updated_at: '2026-08-31T07:58:15.938652+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-41796766.md` — **AA** (both added), intent/bookkeeping ticket (2e) resolved via the 2b superset rule. Both sides added the same request ticket independently. A full diff of the two blobs shows exactly one difference: the incoming side adds `fields.chat_comment: comment-5ce59420` to the frontmatter. Every other line — body, `version: 0.1.13`, `bundled_in: bundle-0385746c`, and all other fields — is identical. Incoming is therefore a strict superset, so no per-fact timeline arbitration was needed (no fact is changed differently on the two sides; only one is added). Resolved with `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

Timeline is consistent with the superset reading: the HEAD-side commit is dated Thu Aug 6 2026, the incoming `free_coded` commit `73ed1f6` is dated Sun Aug 23 2026 — the later side is the one carrying the extra field.

## Incoming changes preserved

- `.xgd/tickets/hot/request-41796766.md` — confirmed. `git diff 73ed1f6:<path> :<path>` (incoming blob vs. staged index entry) returns empty, so the staged content is byte-identical to the incoming commit's version. The incoming commit's only change to this file, the added `chat_comment: comment-5ce59420` field, is present in the resolution. Nothing from the HEAD side was dropped, since HEAD's content is wholly contained in incoming's.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, UAT, or spec-matrix files were involved in this conflict — the single conflicted path is an intent/bookkeeping ticket.

`git status --porcelain` reports no remaining conflict-class entries (UU/AA/DU/UD/AU/UA/DD); the file is staged as `M`. The in-progress cherry-pick was left untouched — no `--continue`, `--skip`, `--quit`, `--abort`, `reset`, or `checkout <branch>` was run, so CHERRY_PICK_HEAD remains present for `cherry_pick_finalize_resolution`.
