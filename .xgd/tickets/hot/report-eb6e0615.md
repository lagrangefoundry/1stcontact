---
uid: report-eb6e0615
id: REPORT-4546
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:49:51.805878+00:00'
updated_at: '2026-09-20T20:51:01.381252+00:00'
completed_at: null
last_field_updated: body
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` (BUNDLE-20) — class **AA** (both added);
  intent/bookkeeping ticket (`bundle-*`) → **STEP 2e**, with 2b's superset rule.
  Resolved by keeping the **HEAD side**, which is a strict superset of the
  incoming side. Staged with `git checkout --ours` + `git add --sparse` (path is
  under `.xgd/tickets/`, sparse-checkout is on at 11% of tracked files).

  Why AA: the incoming commit `830f0264ef71b7adf47997c74e7b02a3b2074b49`
  ("xgd(ticket): create bundle bundle-b3b7c399", 2026-08-23 19:10:41 -0700, no
  free-text commit body) is the *file creation* of this ticket at its birth
  state, so both sides independently "added" the path.

  A blob-level diff of index stage 2 against stage 3 confirms the resolution
  discards nothing outside the frontmatter — verified mechanically, not by eye.
  The diff contains exactly **two hunks**:

  - `@@ -5,300 +5,110 @@` — the frontmatter.
  - `@@ -2629,4 +2439,4 @@` — the trailing newline only.

  The ~2,300-line document body (the bundled REQ-147/143/145/146/148 + 5 more
  source tickets) is **byte-identical on both sides**.

### Per-fact resolution (2e: later-positioned intent wins, per fact)

| Fact | Ours (HEAD) | Incoming (`830f0264ef`) | Taken | Why |
|---|---|---|---|---|
| `status` | `free_and_reconciled` | `ready_to_reconcile` | ours | Ours is *downstream* of incoming on the bundle lifecycle. Incoming-wins would regress the ticket out of its terminal state back to its creation state. |
| `updated_at` | `2026-08-31T14:23:04Z` | `2026-08-24T02:10:41Z` | ours | Ours is 7 days later-positioned. |
| `completed_at` | `2026-08-31T14:22:24Z` | `null` | ours | Travels with the `free_and_reconciled` transition above. |
| `last_field_updated` | `result` | `created_at` | ours | Travels with the same transition; incoming's value is the creation-time default. |
| `fields.commits` | 1 entry: `working_sha: null`, `reconcile_sha: null`, `main_sha: eef7a8b4…` | 24 entries, each `working_sha` set with `reconcile_sha`/`main_sha` `null` and empty `working_sha_history` | ours | The 2026-08-31 reconciliation collapsed the bundle's 24 working-branch commits into the single squashed commit `eef7a8b48bfa15c54b64db9541a0e781a016ba9e` — verified to exist as a commit on this branch (`git cat-file -t` → `commit`). See the note below on the 24 shas. |
| `fields.orphan_commits` | 140 `old_sha`→`new_sha` pairs | *(absent)* | ours | Present only on ours. Incoming-wins would drop the entire post-rewrite sha remap. |
| `fields.merged_at_commit` | `eef7a8b48bfa15c54b64db9541a0e781a016ba9e` | *(absent)* | ours | Present only on ours. |
| `result` | `pass` | *(absent)* | ours | Present only on ours; the bundle's terminal outcome. |
| `fields.auto_merge_back` | `true` | `true` | — | Identical on both sides. No conflict. |
| `fields.priority` | `medium` | `medium` | — | Identical on both sides. No conflict. |
| Trailing newline | absent (git reports "No newline at end of file" on ours) | present | ours | A formatting artifact, not an intent change. Taking ours keeps the resolution byte-identical to HEAD. Note this is the inverse of REPORT-4545's case, where HEAD held the newline; the rule is the same either way. |

`uid`, `id`, `type`, `title`, `created_by` and `created_at` are identical on both
sides — same ticket, same birth timestamp, so the two sides are unambiguously the
same ticket at two points on one lifecycle, not competing intent.

The live ticket state was cross-checked independently with `xgd ticket get
bundle-b3b7c399`: it reports `Status: free_and_reconciled`, the single collapsed
`commits` entry with `main_sha eef7a8b4…`, `orphan_commits`, and
`merged_at_commit` — i.e. the CLI's authoritative view matches the HEAD side that
was staged.

## Incoming changes preserved

No code, test, spec-matrix or UAT files were in this conflict — the sole
conflicted path is an intent/bookkeeping ticket, so STEP 3's
`git show $CPHEAD -- <file>` check on implementation files is vacuous here.

Nothing developer-authored is discarded. Every incoming-side value is an
*earlier* state of a fact that HEAD has already advanced past along the same
lifecycle (`ready_to_reconcile` → `free_and_reconciled`), and the incoming side
contributes no field, section or body text that HEAD lacks.

Stated plainly rather than glossed: the 24 individual `working_sha` values on the
incoming side **are** absent from the resolved blob. That is the correct lifecycle
outcome, not a resolution shortcut, for two reasons:

1. They were collapsed into `main_sha eef7a8b4…` by the 2026-08-31 reconciliation
   that produced HEAD's state — the normal bundle reconcile path, and
   `merged_at_commit` records the same sha.
2. They are pre-rewrite working-branch shas. This is a resync branch rooted at a
   fresh main; those shas do not name commits in this worktree's history. HEAD's
   140-entry `orphan_commits` remap is the post-rewrite successor record, and it
   is present only on the side that was kept.

No hunk was dropped under the BUG-1301 precedence exception; none applied. No
test function was deleted.

## Staging state

`git status --porcelain` is empty. No UU/AA/DU/UD lines remain; `git ls-files -u`
returns 0 rows. The staged blob is
`bb444506b8dc2be46907b7105ce80916fd41ab72`, identical to
`git rev-parse HEAD:.xgd/tickets/hot/bundle-b3b7c399.md`, and contains zero
conflict markers.

Because the resolution IS HEAD's blob, the staged diff for this pick is clean.
Per STEP 4 this was **not** skipped here — `--skip` was not invoked, and the
finalize step (`resync_cherry_pick_finalize_resolution`) owns the empty-diff
decision.

`CHERRY_PICK_HEAD` (`830f0264ef71b7adf47997c74e7b02a3b2074b49`) is intact — no
`--continue`, `--skip`, `--quit`, or `--abort` was run, and no command that
resets or forgets the in-progress cherry-pick was issued.


## Post-merge review flag

The auto-enrichment metadata for `.xgd/tickets/hot/bundle-b3b7c399.md` classified
intent as **unknown on one or both sides** and directed: "Take the more recent
commit by timestamp and flag this file for post-merge review."

- **More-recent-by-timestamp side**: ours — `xgd(ticket): update bundle
  bundle-b3b7c399`, `updated_at 2026-08-31T14:23:04Z`. The incoming side is
  `xgd(ticket): create bundle bundle-b3b7c399`, 2026-08-23 19:10:41 -0700
  (`created_at 2026-08-24T02:10:41Z`). The timestamp rule and STEP 2e's
  superset rule select the same side, so the resolution is unchanged.

- **Flagging it here as instructed.** The resolution discards nothing that is
  not a superseded earlier value of the same fact, but the choice rests on the
  incoming commit being this ticket's own *creation* rather than a competing
  later edit — the fact that made the enrichment's intent classification
  ambiguous in the first place. Reviewer check: confirm the 24 pre-rewrite
  `working_sha` values dropped from `fields.commits` were legitimately
  collapsed into `main_sha`/`merged_at_commit`
  `eef7a8b48bfa15c54b64db9541a0e781a016ba9e` by the 2026-08-31 reconciliation,
  and are not needed independently of the 140-entry `orphan_commits` remap.
