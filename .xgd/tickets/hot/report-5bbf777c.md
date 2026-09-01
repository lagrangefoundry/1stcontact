---
uid: report-5bbf777c
id: REPORT-3177
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:00:19.934460+00:00'
updated_at: '2026-09-01T02:00:19.934460+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — class **AA** (both added), intent/bookkeeping
  ticket (rule 2e + the auto-enriched rule for this file: "take the more recent commit by
  timestamp and flag for post-merge review"). Resolved to the **HEAD (ours)** side via
  `git checkout --ours` + `git add --sparse`.

  Rationale, per-fact (2e forbids blanket whole-file picks, so each differing fact was
  checked independently):
  - The two sides are the *same ticket at two lifecycle points*, not competing edits.
    Incoming (830f0264ef, 2026-08-23 19:10, `xgd(ticket): create bundle bundle-b3b7c399`)
    is the creation snapshot; HEAD (`updated_at 2026-08-31T14:23`, `xgd(ticket): update
    bundle bundle-b3b7c399`) is the post-reconcile state produced by consuming that
    snapshot.
  - `status`: `ready_to_reconcile` (incoming) vs `free_and_reconciled` (HEAD) — same fact,
    HEAD later → HEAD.
  - `fields.commits`: incoming lists 24 un-reconciled `working_sha` entries; HEAD holds the
    collapsed post-merge form (`working_sha: null`, `main_sha:
    eef7a8b48bfa15c54b64db9541a0e781a016ba9e`). Same fact, HEAD later → HEAD. Taking
    incoming would regress the bundle to un-reconciled and re-queue already-merged commits.
  - Present only on HEAD (HEAD is a strict superset for these): `completed_at`, `result:
    pass`, `fields.merged_at_commit`, and `fields.orphan_commits` (73 old→new rewrite
    pairs). Kept.
  - Present only on incoming: nothing that is an independent fact. The 24 `working_sha`
    values and the empty `working_sha_history` lists are members of `fields.commits`, the
    same fact HEAD advanced — not a disjoint field, so 2e's "apply BOTH" branch does not
    apply.
  - Second conflict region (worktree lines 2739–2743) was byte-identical text on both
    sides, differing only in trailing newline. No content decision involved.
  - Ticket **body** (all 2400+ lines below the frontmatter) is identical on both sides —
    the entire delta is frontmatter bookkeeping. Verified by filtering the ours↔theirs
    diff: the only non-`*_sha` lines that differ are `updated_at`, `completed_at`,
    `last_field_updated`, `status`, `orphan_commits`, `merged_at_commit`, `result`, and the
    final-newline nit.

  `checkout --ours` was verified lossless before staging: the two marker regions bracket the
  frontmatter and the final body line respectively, everything outside them auto-merged
  identically, and post-resolution `git diff HEAD -- <path>` is empty with 0 marker lines
  remaining.

## Incoming changes preserved

No code/implementation files were in conflict — the incoming commit 830f0264ef touches
exactly one file, this bookkeeping ticket, and nothing else (`git show --stat`: 1 file
changed, 2442 insertions).

The staged tree nets to **no diff vs HEAD** for this cherry-pick. Per STEP 4 this is not a
failure and `--skip` was NOT called; the finalize step will detect the clean staged diff.
Per STEP 3's redundant-vs-discarded test, this is **redundant, not discarded**: the incoming
commit's intent (create bundle-b3b7c399) is already present in HEAD, via a strictly later
state of that very ticket — same `uid`/`id` (bundle-b3b7c399 / BUNDLE-20), same
`created_at` (2026-08-24T02:10:41.035843+00:00), byte-identical body, and the reconcile
lifecycle it was created to start has already run to completion (`result: pass`,
`merged_at_commit eef7a8b4`). The developer's content is in HEAD, not overwritten by it.

No hunks were dropped under the BUG-1301 precedence exception; no test files were involved.

## Flagged for post-merge review

Per the enrichment rule for this file ("flag this file for post-merge review"):
`.xgd/tickets/hot/bundle-b3b7c399.md` — HEAD's `fields.commits` no longer carries the 24
original `working_sha` values that the incoming creation snapshot listed. That collapse was
performed by xgd's own reconcile lifecycle (not by this resolution), and the commit
identities survive as `fields.orphan_commits` old→new pairs plus `merged_at_commit`. Worth a
confirming glance if anything downstream expects to read the pre-reconcile working shas off
this bundle.
