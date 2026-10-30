---
uid: report-bd7ab46e
id: REPORT-5137
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T21:32:41.070374+00:00'
updated_at: '2026-09-26T21:32:41.070374+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-94e93caa.md` — **AA** (both added), intent/bookkeeping ticket
  (`request-*`), so §2e applies rather than the spec-ticket ledger-replay of §2d.
  Rule applied: *"One side a strict superset: keep the superset."*
  Resolved with `git checkout --ours` + `git add --sparse` (path is outside the
  sparse-checkout cone on this resync branch, DOC-986 §2/§4.1 — the conflict
  materialized on disk with real markers but the index needed `--sparse`).

  The two stages differ only in frontmatter; the body is byte-identical. Facts in
  conflict, and how each was decided:

  | Fact | Ours (HEAD) | Theirs (incoming `83973a5e`) | Winner |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | ours — strictly later lifecycle state |
  | `updated_at` | `2026-08-31T14:22:27Z` | `2026-08-23T03:29:52Z` | ours — later-positioned intent |
  | `completed_at` | `2026-08-31T14:22:27Z` | `null` | ours — consistent with terminal status |
  | `fields.chat_comment` | `comment-18e5a285` | absent | ours — addition present only on ours |
  | `fields.bundled_in` | `bundle-b3b7c399` | absent | ours — addition present only on ours |

  Ours carries every fact theirs carries, plus two fields and a more advanced
  status; theirs contributes nothing ours lacks. Taking incoming wholesale would
  have regressed `free_and_reconciled` → `ready_to_reconcile`, cleared
  `completed_at`, and dropped `bundled_in`/`chat_comment` — the overlay-advances-
  past-incoming-status case, not a genuine competing edit.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, so there is no developer source to preserve and STEP 3's
`git show $CPHEAD -- <file>` verification does not apply to any code file.

For the one ticket: no incoming *fact* was discarded. Every field theirs sets is
also set on ours, at an equal-or-later point in the ticket's lifecycle. The
BUG-1301 precedence exception was not invoked and no test function was touched.

The resolved tree matches HEAD exactly (`git diff --cached` is empty), because
this request ticket's incoming state is a strict ancestor of the state already on
the resync branch. `git status --porcelain` is clean and CHERRY_PICK_HEAD remains
in place for the next workflow step; no `--continue`/`--skip`/`--quit`/`--abort`
was issued.
