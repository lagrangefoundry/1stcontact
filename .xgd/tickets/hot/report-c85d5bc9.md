---
uid: report-c85d5bc9
id: REPORT-3589
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T23:52:20.888302+00:00'
updated_at: '2026-09-09T23:52:20.888302+00:00'
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
  Incoming commit: `1975a6876b` "xgd(ticket): update bug bug-6612c4b7"
  (Martin Westhead, 2026-08-24 14:09:26 -0700). One hunk, one insertion:
  `chat_comment: comment-a4e77428` added to the `fields:` block. It touches
  nothing else — not even `updated_at`, which is why the lifecycle
  frontmatter did not conflict this time.

  One conflict hunk, in the `fields:` block:

  - **The incoming insertion itself merged cleanly** and sits at line 18 of
    the merged file, *outside* the conflict markers. HEAD independently
    carries the identical line, so there was nothing to decide about it.
  - **The conflicted region is HEAD-only content against an empty incoming
    side**: `commits` (three `working_sha` entries), `version: 0.2.13`,
    `bundled_in: bundle-78f4e2fe`. The incoming commit does not delete these
    — its post-image simply predates them; they were added later on the
    bundle branch. Git flags the span only because the new `chat_comment`
    line abuts HEAD's added block.
    Per 2e this is **non-overlapping additions on each side → apply BOTH**:
    keep `chat_comment` and keep the four HEAD keys. Kept HEAD's block.

  Taking the incoming side of that hunk would have silently deleted
  `commits`, `version` and `bundled_in` — reconcile's own commit-tracking
  metadata — on the strength of an empty side that represents absence, not
  intent to remove.

## Incoming changes preserved

The incoming commit is a **bookkeeping duplicate whose effect is already on
HEAD** (BUG-1109/BUG-1122 shape), so the staged tree nets to no diff vs HEAD.
Per STEP 4 this is not a failure and `--skip` was not called — finalize will
detect the clean staged diff.

STEP 3's discard-vs-redundant test, applied explicitly and verified against
the staged index rather than assumed:

- The commit's entire content is the line `  chat_comment: comment-a4e77428`.
  Re-reading the resolved, staged blob
  (`git show :.xgd/tickets/hot/bug-6612c4b7.md`) shows that line present in
  the `fields:` block, byte-identical, alongside the four HEAD keys. Present,
  not absent — and both sides' additions survive.
- It reached HEAD by a different route: the overlay seed `501a0595d1`
  ("xgd(ticket): seed_local_overlay bug bug-6612c4b7"), the commit that
  created this file on the bundle branch, already carries
  `chat_comment: comment-a4e77428` — verified directly at
  `git show 501a0595d1:.xgd/tickets/hot/bug-6612c4b7.md`. That is STEP 3's
  "redundant" case, not its "discarded" case.

No BUG-1301 precedence exception was needed: no hunk was dropped on the
grounds that its target had been removed. No code files and no UAT test files
were involved in this conflict.

Context: this is the fourth consecutive redundant commit against BUG-37 in
this bundle, after `fe97d3bc34` (REPORT-3585), `b0af50e157` (REPORT-3586) and
`9255f773b5` (REPORT-3587). HEAD already carries this ticket in its final,
reconciled state, so each of these 2026-08-24 edits is already reflected
there.

## Verification

- `git status --porcelain` — no `UU`/`AA`/`DU`/`UD` lines remain.
- `git ls-files -u` — empty; no unmerged index entries.
- `git diff --cached --stat HEAD` — empty (expected; see above).
- Staged blob re-read to confirm `chat_comment` present and the `commits` /
  `version` / `bundled_in` keys intact.
- CHERRY_PICK_HEAD left intact for `cherry_pick_finalize_resolution`. No
  `--continue`/`--skip`/`--quit`/`--abort`/`reset` was run.
