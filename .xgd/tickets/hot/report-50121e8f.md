---
uid: report-50121e8f
id: REPORT-3612
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T00:50:50.712814+00:00'
updated_at: '2026-09-10T00:50:50.712814+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — class **UU**, rule **2e**
  (intent/bookkeeping ticket), resolved per-fact by the timeline rule toward
  the HEAD side.

  Conflicting facts (single frontmatter hunk, lines 9–19 of the merged file):

  | fact | base | ours (HEAD) | theirs (incoming `66ebe3503a`) |
  |---|---|---|---|
  | `status` | `free_coded` | `free_and_reconciled` | `ready_to_reconcile` |
  | `updated_at` | `2026-08-24T21:57:19Z` | `2026-08-31T19:19:36Z` | `2026-08-25T22:52:43Z` |
  | `completed_at` | `null` | `2026-08-31T19:19:36Z` | `null` |

  Both sides mutate the same three bookkeeping facts, so this is 2e's
  "same field changed differently" case. Neither commit carries a free-text
  `--commit-message` narrative (both are the bare
  `xgd(ticket): update bug bug-6612c4b7`), so the timeline decides:

  - HEAD side: `5a37f67dcd`, 2026-08-31 12:19:36 -0700
  - Incoming:  `66ebe3503a`, 2026-08-25 15:52:43 -0700

  HEAD is later by six days, and the lifecycle direction agrees — the
  incoming commit moves BUG-37 `free_coded -> ready_to_reconcile`, and the
  HEAD-side commit is a *downstream* transition of that same lifecycle to
  `free_and_reconciled`. Taking the incoming value would regress an
  already-reconciled bug back to an earlier state it has since left.

  Resolved with `git checkout --ours`, not a hand edit, so no stale
  frontmatter is carried back.

## Incoming changes preserved

No code/implementation files were in this conflict; the only conflicted path
is a bookkeeping ticket, so STEP 3's discard guard (which is scoped to code
files) does not bite, and the BUG-1301 precedence exception is not in play —
no hunk was dropped on refactor grounds and no test function was touched.

Accounting for the incoming commit's two changed lines:

- `status: ready_to_reconcile` — **superseded, not discarded.** HEAD already
  holds `free_and_reconciled`, the later state of the same lifecycle field,
  set by a commit six days newer. This is exactly the resolution 2e
  prescribes for a same-field conflict.
- `updated_at` — same field, same reasoning; HEAD's newer stamp wins.

Nothing else was in the incoming diff (`git show 66ebe3503a -- <path>` is a
single 2-insertion/2-deletion hunk covering only those two lines).

Facts present on the HEAD side but absent from the incoming side —
`completed_at` and `fields.bundled_in: bundle-78f4e2fe` — sit outside the
conflict hunk and survive intact in the resolved file.

## Staging note

The resolution nets to no diff vs HEAD (`git status --porcelain` shows no
conflict class and no staged modification for this path). Per STEP 4 this is
expected and is **not** a @fail: the incoming commit's effect is present in
HEAD via a later route (the `free_and_reconciled` transition), i.e. redundant
rather than discarded. `--skip` was not called; CHERRY_PICK_HEAD is left in
place for `cherry_pick_finalize_resolution` to handle.

## Post-merge review flag

Per the auto-enriched resolution rule ("Intent unknown on one or both sides…
flag this file for post-merge review"), `.xgd/tickets/hot/bug-6612c4b7.md` is
flagged. The judgment rests on commit timestamps plus lifecycle ordering
rather than a declared operation narrative, since neither side supplied one.
