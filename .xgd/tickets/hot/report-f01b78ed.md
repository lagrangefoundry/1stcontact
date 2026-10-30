---
uid: report-f01b78ed
id: REPORT-5286
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T04:00:51.087740+00:00'
updated_at: '2026-09-28T04:00:51.087740+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — intent/bookkeeping ticket (STEP 2e). Index-only
  conflict: the path is outside the sparse-checkout cone on this resync branch
  (DOC-986 §2/§4.1), so all three stages were present in the index with no
  working-tree markers. Resolved with
  `git checkout --ours --ignore-skip-worktree-bits` followed by `git add --sparse`
  (`--sparse` is not a valid `git checkout` option; `--ignore-skip-worktree-bits`
  is the checkout-side equivalent).

  Fact-by-fact comparison against the merge base
  (`226541c73993841075b07cbe8fb922972d3d5440`):

  | fact | base | ours (HEAD) | theirs (incoming `da0fccd3`) |
  |---|---|---|---|
  | `status` | `ready_to_reconcile` | `free_and_reconciled` | `bundled` |
  | `updated_at` | 2026-08-25T22:52:42Z | 2026-08-31T19:19:38Z | 2026-08-26T17:36:27Z |
  | `completed_at` | `null` | 2026-08-31T19:19:38Z | `null` |
  | `fields.bundled_in` | absent | `bundle-78f4e2fe` | `bundle-78f4e2fe` |
  | EOF newline | missing | present | missing |

  Only the status triple (`status` / `updated_at` / `completed_at`) is genuinely
  contested; `bundled_in` is an identical addition on both sides, and the EOF
  newline is cosmetic. Per 2e, the contested fact goes to the later-positioned
  intent: ours is 2026-08-31, five days after incoming's 2026-08-26, and
  `free_and_reconciled` is downstream of `bundled` in the ticket lifecycle.
  Taking incoming would have regressed `free_and_reconciled` → `bundled` and
  dropped the populated `completed_at`.

  Because ours already contains incoming's sole contribution, ours is a strict
  superset of theirs and no hand-merge was needed. `xgd working-timeline` was not
  applicable here: both sides are the same UID, so the timeline tie-break has no
  two operands; the ticket's own `updated_at` frontmatter is the ordering fact.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's `git show $CPHEAD`
verification applies only to the single ticket above:

- `fields.bundled_in: bundle-78f4e2fe` — incoming's only net addition — **is
  present** in the resolved file (line 25).
- Incoming's `status: bundled` / `updated_at: 2026-08-26T17:36:27Z` are
  deliberately not present. This is the 2e genuine-conflict tie-break resolving
  in ours' favour on a contested field, not a discarded developer change: the
  same ticket was advanced further along its own lifecycle on the HEAD side. The
  BUG-1301 PRECEDENCE exception was not invoked and no test function was touched.

Resulting staged tree has no conflict-class entries and no net diff against HEAD
(ours was already byte-identical to the HEAD blob). Per the STEP 4 instruction,
this was staged and left for the finalize step to skip rather than calling
`git cherry-pick --skip` here; `CHERRY_PICK_HEAD`
(`da0fccd35b845e49756aaf48af28cd175fed53e9`) is intact.
