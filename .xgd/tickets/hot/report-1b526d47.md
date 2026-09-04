---
uid: report-1b526d47
id: REPORT-3338
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T19:45:59.639160+00:00'
updated_at: '2026-09-02T19:45:59.639160+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **AA** (both added), intent/bookkeeping
  ticket (rule 2e; auto-enrichment rule "take the more recent commit by
  timestamp"). Outside the sparse-checkout cone (`!/.xgd/tickets/**`,
  DOC-986 §2/§4.1) so the conflict existed only in the index, with no
  working-tree markers. Resolved with `git checkout --ours` +
  `git add --sparse`. Staged blob is `bb444506b8dc2be46907b7105ce80916fd41ab72`
  (ours) at stage 0.

### Why ours

The two sides are the **same ticket at two points in its own lifecycle**, not
disjoint edits — so there is nothing to compose under 2e's "apply BOTH" branch.

- Incoming (`830f0264`, free_coded, 2026-08-23 19:10 -0700) is the *creation*
  state of BUNDLE-20: `status: ready_to_reconcile`, `completed_at: null`,
  24 pending `commits[].working_sha` entries, `main_sha`/`reconcile_sha` all null.
- Ours (HEAD, `8e07e601`, 2026-08-31 07:23 -0700 — eight days later) is the
  *completed* state of that same bundle: `status: free_and_reconciled`,
  `result: pass`, `completed_at` set, `merged_at_commit:
  eef7a8b48bfa15c54b64db9541a0e781a016ba9e`, the collapsed post-squash
  `commits` entry carrying that `main_sha`, and a ~100-entry `orphan_commits`
  old_sha→new_sha remap table.

The only genuinely competing fact is `fields.commits`. The incoming side's raw
pre-reconcile `working_sha` list was *consumed* by the reconcile that already
completed for BUNDLE-20 — remapped into `orphan_commits` and squashed to a
single `main_sha`. Taking the incoming side would revert a merged, reconciled
bundle back to `ready_to_reconcile` and drop the remap table that later
reconciles depend on. Per 2e's per-fact timeline rule, the later-positioned side
(ours) wins for that fact; for every other field ours is a strict superset
(`orphan_commits`, `merged_at_commit`, `result`, `completed_at`, `main_sha` exist
only on ours). The sole field present only on the incoming side is
`working_sha_history: []` — schema default, carries no information.

No fields were hand-edited: the resolution selects an existing committed blob
wholesale, so no stale or invented frontmatter is introduced.
`fields.intent_uid` / `story_uid` / `capability_uid` were not touched.

## Incoming changes preserved

The incoming commit `830f0264ef71b7adf47997c74e7b02a3b2074b49` touches exactly
one file (2442 insertions, this ticket). Its substantive payload — the entire
bundle body: `# Bundle`, and the REQ-147 / REQ-143 / REQ-145 / REQ-146 /
REQ-148 (+5 more) narratives, acceptance criteria, implementation notes and
Origin sections — **is present byte-for-byte in the resolved version**.

Verified by diffing the two conflict stages directly: the full diff between
ours (`bb444506`) and theirs (`37ad202e`) is only **two hunks** —
`@@ -5,300 +5,110 @@` (the lifecycle frontmatter discussed above) and
`@@ -2629,4 +2439,4 @@` (a trailing-newline-at-EOF difference only; ours has
no final newline). Every body line is identical, offset by the 190-line
frontmatter delta. No developer prose or structural content was discarded.

No hunks were dropped under the BUG-1301 precedence exception; it does not
apply here. No test functions were involved.

## Net-zero staged diff (expected, not a discard)

`git diff --cached HEAD -- <path>` is empty: the resolution nets to no change
vs HEAD. This is the BUG-1109 / BUG-1122 redundant-commit case, not a STEP 3
discard — the distinguishing check passes, because the incoming commit's key
content **is** present in HEAD (via the later `update bundle` commits that
carried the same body forward), rather than merely absent. Per STEP 4,
`--skip` was NOT called; the tree is staged and left for
`cherry_pick_finalize_resolution` to detect and skip.

## Final state

- No `UU`/`AA`/`DU`/`UD`/`AU`/`UA`/`DD` lines remain in `git status --porcelain`.
- No tracked modifications outstanding; only pre-existing untracked ticket files.
- `CHERRY_PICK_HEAD` still present — no `--continue`/`--skip`/`--quit`/`--abort`,
  no `reset`, no branch checkout was issued.
