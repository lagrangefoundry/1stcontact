---
uid: report-870ebdf5
id: REPORT-3314
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:44:10.319570+00:00'
updated_at: '2026-09-02T18:44:10.319570+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-34dd9049.md` (REQ-150) — **AA** (both added), intent/bookkeeping
  ticket → rule **2e** (`request-*` under `.xgd/tickets/`, not matrix state). Out of the
  sparse-checkout cone, so staged with `git add --sparse`. Resolved by taking the **HEAD**
  side (`git checkout --ours`), because HEAD is a strict superset of the incoming side.

  The two blobs differ **only** in frontmatter; the 200-line body (Why / What to change /
  Settled scope / Test approach / Implementation record) is byte-identical, as is every
  `fields` entry the incoming side carries (`priority`, `story_points`, `depends_on`, the
  three `commits` `working_sha` values `258381e2d`/`aa64b3e15`/`c36373c10`, `version: 0.2.2`,
  `chat_comment: comment-c6092b70`). The whole delta is:

  | field | HEAD (kept) | incoming (superseded) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `completed_at` | `2026-08-31T14:22:33Z` | `null` |
  | `updated_at` | `2026-08-31T14:22:33Z` | `2026-08-22T21:54:23Z` |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  Per-fact timeline check (2e's tiebreak): every differing fact is later on the HEAD side.
  HEAD's last touch of this path is `43c2dac73` (2026-09-01 15:04), the incoming commit is
  `3e9239d68a` (2026-08-23 12:56) carrying a ticket state stamped 2026-08-22. The incoming
  side changes **no** fact that HEAD does not already carry in a more advanced form, so
  there is no per-fact split to compose — it is a pure superset case, not a genuine
  intent conflict.

  Taking the incoming side would have reverted a reconcile-owned status (`free_and_reconciled`
  → `ready_to_reconcile`), cleared `completed_at`, and dropped the `bundled_in` back-reference
  to `bundle-b3b7c399` — i.e. rewound this ticket's own reconcile bookkeeping to a state two
  weeks stale. No content was invented; the resolved file is HEAD's exact blob
  (`b8dbec480f7623ea2ca1a8ff06665e707157049f`), not a hand-edited rewrite.

## Incoming changes preserved

No code/implementation files were conflicted in this commit — the incoming commit
`3e9239d68a` touches exactly one path, the ticket above (225 insertions, whole-file add).

STEP 3 check on that path: the incoming commit's content **is** present in HEAD, via a
different route. HEAD reached the same ticket body and the same `fields` payload through its
own `seed_local_overlay` (`274c14daf`, 2026-08-30) plus `update` (`43c2dac73`, 2026-09-01),
and then advanced it further. Nothing the incoming commit authored is absent from the
resolved tree; it is a **redundant** re-application of already-landed bookkeeping, not a
discard. No BUG-1301 precedence exception was needed and no hunk was dropped as obsolete.

The staged diff against HEAD is therefore empty. Per STEP 4 that is expected and is not a
failure — `cherry_pick_finalize_resolution` will detect the clean staged diff and skip the
commit. `git cherry-pick --continue/--skip/--quit/--abort` was **not** run; `CHERRY_PICK_HEAD`
(`3e9239d68af7e90b87307b951a529ed4df328c20`) is still present for the next step.
