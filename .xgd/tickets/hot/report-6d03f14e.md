---
uid: report-6d03f14e
id: REPORT-3846
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T01:24:15.664209+00:00'
updated_at: '2026-09-11T01:24:15.664209+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — UU, intent/bookkeeping ticket
  (rule 2e; auto-enrichment says intent unknown on both sides, take the
  more recent commit by timestamp and flag for post-merge review).

  The path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so there
  was no working-tree copy and no in-file conflict markers — the conflict
  existed only as index stages 1/2/3. All three were extracted with
  `git show :N:<path>` and merged per-fact.

  Incoming commit `d86269421c` (2026-08-31 14:41:19 -0700) makes seven
  changes against the merge base (`914093b08d`, the previous cherry-pick's
  blob). OURS is `026822d1a6`, whose content is dated 2026-09-02 and is the
  post-reconcile state. Per-fact:

  - **`updated_at`, `completed_at`, `last_field_updated`, `status`** — kept
    OURS. The incoming advances the ticket to `free_coded` with
    `completed_at: null`; OURS is already at `free_and_reconciled` with
    `completed_at` set, `result: pass` and `fields.merged_at_commit`. OURS
    is both the later intent and downstream of the incoming in the
    lifecycle — taking the incoming would regress a reconciled ticket back
    to free-coded.
  - **`fields.commits`** — kept OURS. Genuine same-field conflict: the
    incoming adds three entries (`fc117f1d35`, `2284bf4bbd`, `bc36b2cce9`)
    with `reconcile_sha`/`main_sha` null; OURS carries a single entry with
    `main_sha: 4b43dd9a5c`. Resolved by later intent rather than by
    combining, deliberately: none of the three working SHAs appears
    anywhere in OURS (checked against `fields.orphan_commits`' full
    old_sha→new_sha remap table as well), so re-adding them with null
    `main_sha` would assert "these three working commits never reached
    main" inside a ticket that simultaneously says `free_and_reconciled`
    with `merged_at_commit` set. That is a fact neither side states, and
    2e prohibits inventing content not present on either side. **This is
    the fact to look at in the post-merge review the enrichment asks for.**
  - **`fields.version: 0.2.20`** — identical on both sides, no conflict.
  - **Blank line between the frontmatter delimiter and the H1** — applied
    the INCOMING's removal. OURS is identical to the merge base here, so
    this is a unilateral incoming edit, not a competing one.
  - **Trailing newline at EOF** — applied the INCOMING's removal (the
    incoming blob ends `\ No newline at end of file`). Same reasoning: OURS
    matched the base, only the incoming changed it.

## Incoming changes preserved

Diffing the incoming blob (stage 3) against the resolved file, the only
lines present on the incoming side and absent from the resolution are the
four lifecycle fields and the three `working_sha` commit entries named
above — every one of them a bookkeeping fact that OURS supersedes with a
later, post-reconcile value. Nothing else differs.

The incoming made no prose or body-content changes at all this time: its
entire body delta against the base is the two whitespace facts, and both
are applied. Diffing OURS against the resolved file shows exactly those
two edits and nothing more.

No hunks were dropped under the BUG-1301 precedence exception. No code or
test files were involved — the commit touches one ticket file.

Staged result is `M .xgd/tickets/hot/request-13a5e206.md`, 1 insertion /
2 deletions against HEAD. No conflict classes remain. `CHERRY_PICK_HEAD`
is left in place for `cherry_pick_finalize_resolution`; no
`--continue`/`--skip`/`--abort`/`reset` was run.
