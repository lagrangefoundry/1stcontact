---
uid: report-d95aee6a
id: REPORT-4315
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T05:55:10.412346+00:00'
updated_at: '2026-09-18T05:55:10.412346+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — AA (both added), intent/bookkeeping
  ticket (bundle BUNDLE-20). Rules 2b + 2e, resolved per-fact by the timeline
  rule → **ours (HEAD) kept in full**.

  Incoming (`830f0264ef`, "xgd(ticket): create bundle bundle-b3b7c399",
  2026-08-23) is the original creation snapshot of BUNDLE-20's ticket.
  HEAD received the identical ticket body via a different route —
  `4b7f40157d` ("xgd(ticket): seed_local_overlay bundle bundle-b3b7c399",
  2026-08-30) — and then advanced it through its full lifecycle across
  five further `update bundle` commits, last at `8e07e6015d` (2026-08-31).

  Two conflict regions only:

  1. **Frontmatter.** Same facts recorded at two lifecycle points, not
     disjoint content:
     - `status`: incoming `ready_to_reconcile` vs ours `free_and_reconciled`
     - `updated_at`: incoming 2026-08-24 vs ours 2026-08-31
     - `completed_at`: incoming `null` vs ours 2026-08-31
     - `result`: absent on incoming, `pass` on ours
     - `fields.commits`: incoming's 24 pre-reconcile `working_sha` entries vs
       ours' terminal single entry carrying
       `main_sha: eef7a8b48bfa15c54b64db9541a0e781a016ba9e`
     - `fields.orphan_commits` (140 old→new remap pairs) and
       `merged_at_commit`: present only on ours, written by the reconcile
       that completed this bundle.

     Every one of these is the *same field* rewritten later by the reconcile
     workflow's own bookkeeping. Taking the incoming side would revert a
     completed, merged bundle back to `ready_to_reconcile`, drop its
     `main_sha`/`merged_at_commit`/`orphan_commits`, and clear
     `result: pass` — i.e. discard operator-owned lifecycle state. Combining
     the two `fields.commits` lists would produce a nonsense 25-entry mix of
     pre- and post-reconcile state. Per 2e, the later-positioned intent wins
     per fact, and HEAD is later on every contested fact.

  2. **End of file (line 2739).** Whitespace only — identical text
     (`flagged there as discretionary.`), differing solely in the trailing
     newline. Ours kept.

  The ticket body (lines ~300–2439, the whole Bundle narrative) is
  byte-identical on both sides, so nothing in it was at stake.

  No `fields.intent_uid` / `story_uid` / `capability_uid` was touched, and no
  content absent from both sides was introduced.

## Incoming changes preserved

The incoming commit is a pure file creation (2442 insertions, one file, no
code). Its entire payload — the bundle ticket body — is present in HEAD
verbatim, delivered by `4b7f40157d` (seed_local_overlay) before this branch's
updates. Verified by diffing the two conflict-stage blobs
(`bb444506b8` ours vs `37ad202e8f` theirs): the only hunks are the frontmatter
block and the trailing newline; the 2100+ body lines match exactly.

This is therefore the *redundant* case of STEP 3/STEP 4, not the *discarded*
case: the incoming commit's key change is present in HEAD via a different
route, so the resolution correctly stages to no diff vs HEAD
(`git diff --cached HEAD` is empty). Per STEP 4 this is not a failure —
`--skip` was NOT called; the staged tree and `CHERRY_PICK_HEAD` are left
intact for `cherry_pick_finalize_resolution` to skip the commit itself.

No BUG-1301 precedence exception was invoked. No test file was involved and no
test function was deleted.

`git status --porcelain` is empty: no conflict classes remain.
