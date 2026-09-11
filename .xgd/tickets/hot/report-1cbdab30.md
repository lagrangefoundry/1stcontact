---
uid: report-1cbdab30
id: REPORT-3587
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T23:50:20.891256+00:00'
updated_at: '2026-09-09T23:50:20.891256+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — **UU**, intent/bookkeeping
  ticket → rule **2e**, resolved per-fact. Outside the sparse-checkout cone,
  so staged with `git add --sparse` (DOC-986 §2/§4.1).
  Incoming commit: `9255f773b5` "xgd(ticket): update bug bug-6612c4b7"
  (Martin Westhead, 2026-08-24 14:06:30 -0700).

  Two conflict hunks. HEAD's content is the correct resolution for both, and
  in hunk 2 that is the outcome of *applying both sides*, not of preferring
  one:

  1. **Lifecycle frontmatter (`updated_at` / `completed_at` /
     `last_field_updated` / `status`)** — same fields changed differently on
     each side, so 2e's timeline rule applies per fact.
       - HEAD: `2026-08-31T19:19:36Z`, `last_field_updated: status`,
         `status: free_and_reconciled` — set by `5a37f67dcd` (2026-08-31).
       - Incoming: `updated_at 2026-08-24T21:06:30Z`, `completed_at: null`,
         `last_field_updated: title`, `status: draft`.
     HEAD's intent is a week later. Kept HEAD. The incoming side would revert
     an operator-only lifecycle status from `free_and_reconciled` back to
     `draft` and null out `completed_at`, undoing the reconcile.

  2. **`fields:` block** — this hunk needs care, because the incoming side of
     it is *empty*, and taking it literally would have destroyed data.
     The incoming commit's actual edit here is a **deletion**: it removes the
     two `fields.title` lines that its own predecessor `b0af50e157`/
     `fe97d3bc34` had added minutes earlier. It adds nothing and it touches
     nothing else. The conflict arises only because HEAD independently added
     four unrelated keys in the same region (`chat_comment`, `commits`,
     `version: 0.2.13`, `bundled_in: bundle-78f4e2fe`), so git sees
     "HEAD added / incoming deleted" over one span.
     These are **disjoint edits to different keys**, which 2e resolves by
     applying BOTH: remove `fields.title`, keep the four HEAD keys. HEAD's
     current content already is exactly that — it has no `fields.title`
     (removed by `a9021e4749`, confirmed an ancestor of HEAD via
     `git merge-base --is-ancestor`) and it has the four keys. So HEAD's
     version *is* the both-sides composition, and no separate merge was
     needed.
     Taking the incoming side wholesale would have deleted `chat_comment`,
     `commits`, `version` and `bundled_in` — reconcile's own commit-tracking
     metadata that this commit never touched and never intended to remove.

## Incoming changes preserved

The incoming commit is a **bookkeeping duplicate whose effect is already on
HEAD** (BUG-1109/BUG-1122 shape), so the staged tree nets to no diff vs HEAD.
Per STEP 4 this is not a failure and `--skip` was not called — finalize will
detect the clean staged diff.

STEP 3's discard-vs-redundant test, applied explicitly and verified against
the staged index rather than assumed:

- The commit's substantive change is the **removal of `fields.title`**.
  Grepping the resolved, staged blob
  (`git show :.xgd/tickets/hot/bug-6612c4b7.md`) for `^  title:` returns
  nothing — the field is absent from the resolution. The incoming intent is
  satisfied, not discarded. Note the direction here: for a deletion commit,
  "present in the result" means the target is *gone*, which is what was
  checked.
- It reached HEAD by a different route: `a9021e4749` (2026-08-24 14:06:30),
  the bundle-branch twin of this very commit — same author, same timestamp,
  byte-identical deletion hunk — already integrated into HEAD.
- The `updated_at` bump to `2026-08-24T21:06:30Z` is superseded by HEAD's
  later `2026-08-31T19:19:36Z` from `5a37f67dcd`.

No BUG-1301 precedence exception was needed: no hunk was dropped on the
grounds that its target had been removed. No code files and no UAT test files
were involved in this conflict.

Context: this is the third and last commit of one 2026-08-24 14:06 editing
burst against BUG-37, after `fe97d3bc34` (REPORT-3585) and `b0af50e157`
(REPORT-3586), both likewise redundant. The burst adds `fields.title` and then
removes it again; HEAD already carries the ticket in its final, reconciled
state, which is why all three net to nothing.

## Verification

- `git status --porcelain` — no `UU`/`AA`/`DU`/`UD` lines remain.
- `git ls-files -u` — empty; no unmerged index entries.
- `git diff --cached --stat HEAD` — empty (expected; see above).
- Staged blob re-read to confirm `fields.title` absent and the four HEAD
  bookkeeping keys intact.
- CHERRY_PICK_HEAD left intact for `cherry_pick_finalize_resolution`. No
  `--continue`/`--skip`/`--quit`/`--abort`/`reset` was run.
