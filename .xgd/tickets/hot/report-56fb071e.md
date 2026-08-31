---
uid: report-56fb071e
id: REPORT-2953
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:01:33.197451+00:00'
updated_at: '2026-08-31T15:01:33.197451+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` — **AA** (both added), intent/bookkeeping
  ticket (§2e; also §2b). Path is outside the sparse-checkout cone
  (`!/.xgd/tickets/**`, DOC-986 §2/§4.1), so the conflict existed only in the index —
  the working-tree file carried no conflict markers and was byte-identical to the
  ours-side blob `7d5a83ca`. Staged with `git add --sparse`.

  Bodies are identical on both sides (the blob-to-blob diff is frontmatter-only).
  Resolved per-fact; every differing fact favours the ours/HEAD side, which is later
  on both available measures — content authorship (`updated_at` 2026-08-24T02:10:41
  vs incoming 2026-08-20T00:47:43) and commit timestamp (HEAD-side `ce11ecb0`
  2026-08-30 vs incoming `773e1698` 2026-08-23). This matches the auto-enrichment
  rule for this file ("intent unknown on one or both sides — take the more recent
  commit by timestamp and flag for post-merge review").

  Per-fact breakdown:
  - `status`: ours `bundled` vs incoming `ready_to_reconcile`. Same field, different
    values → later intent wins → ours. `bundled` is the forward lifecycle
    progression of `ready_to_reconcile`, not a competing claim.
  - `fields.bundled_in: bundle-b3b7c399`: present only on ours; the incoming side
    never had this field. Kept (companion fact to `status: bundled`).
  - `updated_at`: kept ours (later).
  - `fields.commits`: same four working SHAs on both sides
    (`a28d2f52`, `ade64575`, `05537879`, `a6e92ca2`), grouped differently — ours
    folds `05537879` into the `working_sha_history` of the `a28d2f52` entry, the
    incoming side lists it as a separate entry with an empty history. No SHA is lost
    by taking ours; the difference is grouping only, and ours is the later grouping
    (it is the structure the in-flight bundling into `bundle-b3b7c399` was computed
    from). Flagged for post-merge review below.

  No field was invented; nothing appears in the resolution that was not already on
  the ours side.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
bookkeeping ticket governed by §2e, not §2c.

The incoming commit `773e1698` ("xgd(ticket): update request request-7ae3c2cc")
adds this file whole (303 insertions) on its side. Its substantive content is
present in the resolved (HEAD-side) version:

- The full ticket body — title, "Status: settled (CHAT session)" note, §1 Scope,
  §2 Two things to move to build time, §3 Constraint, §4 Acceptance criteria,
  Origin — is byte-identical on both sides and is present in the resolution.
- All frontmatter facts the incoming side asserts are present, except the two
  superseded by HEAD's strictly later state: `status: ready_to_reconcile`
  (superseded by `bundled`) and the split-vs-folded grouping of working SHA
  `05537879` (all four SHAs are still recorded).

STEP 3 disposition: the staged tree nets to **no diff vs HEAD**. Per STEP 4 this is
not a failure and `--skip` was not called — the incoming commit's key changes are
*present* in HEAD via a later route (HEAD's Aug-30 `seed_local_overlay` of this
ticket already carries this content plus the subsequent bundling), so this is a
redundant commit, not a discarded one. Python's finalize step will detect the clean
staged diff and skip the commit.

No BUG-1301 precedence exception was invoked; no UAT test function was touched.

## Flagged for post-merge review

`fields.commits` on `request-7ae3c2cc`: if `05537879` is meant to be tracked as a
standalone free_coded commit with its own `reconcile_sha`/`main_sha` mapping (the
incoming side's shape) rather than as superseded history under `a28d2f52` (the
HEAD side's shape), that distinction was resolved toward HEAD here on timeline
grounds and should be confirmed by the developer.

## Git state

`CHERRY_PICK_HEAD` left intact for `cherry_pick_finalize_resolution`. Only
`git add --sparse` was issued; no `--continue`/`--skip`/`--quit`/`--abort`,
no `reset`, no branch checkout.
