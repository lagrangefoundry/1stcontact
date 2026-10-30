---
uid: report-99a97b2a
id: REPORT-4702
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T10:28:45.167920+00:00'
updated_at: '2026-09-21T10:28:45.167920+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

Incoming `CHERRY_PICK_HEAD` = `76b69e1a7d` — *"xgd(ticket): create request
request-3bc4b835"* (REQ-167, "Identity: the invite provisions the account, login
binds it"), 1 file, 163 insertions / 0 deletions. Enrichment reports the OURS
side as *"xgd(ticket): seed_local_overlay request request-3bc4b835"* — intent
unknown on one side, so the enrichment's rule (take the more recent commit by
timestamp, flag for post-merge review) governs alongside STEP 2e.

- `.xgd/tickets/hot/request-3bc4b835.md` — **AA** (both added; no stage-1 base,
  because the incoming commit is the file's creation). An intent/bookkeeping
  ticket under `.xgd/tickets/`, so **STEP 2e** governs. Three conflict hunks,
  all resolved to HEAD.

  **Hunk 1 — frontmatter.** Same fields changed on both sides, so the
  later-positioned intent wins per fact:

  | fact | incoming `76b69e1a7d` | HEAD (ours) | taken |
  |---|---|---|---|
  | `updated_at` | `2026-09-01T00:50:39.990490Z` | `2026-09-09T21:32:50.386750Z` | **ours** |
  | `last_field_updated` | `created_at` | `status` | **ours** |
  | `status` | `draft` | `bundled` | **ours** |

  The incoming commit is the ticket's Aug-31 creation, so its frontmatter is the
  birth state. HEAD's stamp post-dates it by nine days and records `status:
  bundled`, which is strictly downstream of `draft` in the ticket lifecycle.
  Taking incoming would rewind a bundled ticket back to `draft` and re-assert
  its creation timestamp as its last update.

  **Hunk 2 — `fields` block.** The incoming side ends `fields` after
  `needs_review: false`; HEAD carries, in addition, `chat_comment:
  comment-6477139e`, a two-entry `commits` list (`61a0becc61`, `deaf3f98c4`,
  both with `reconcile_sha`/`main_sha` still null), `version: 0.2.29`, and
  `bundled_in: bundle-87be4669`. All of it is accrued state the creation commit
  could not have known. HEAD is a strict superset here — incoming asserts no
  competing value for any of these keys — so per 2e the superset is kept.

  **Hunk 3 — trailing body section.** HEAD appends `## Note: the
  account/business split came after this ticket` (the [[DOC-40]] §2 account ≠
  tenant correction, and the pointer to [[REQ-178]] for pluralising
  `accountFor()` / `Admission.accountId`). Incoming ends at `## Not in scope`.
  Non-overlapping addition with no incoming counterpart — kept.

## Incoming changes preserved

- Nothing the incoming side authored was dropped, and no BUG-1301 precedence
  exception was invoked. `git show 76b69e1a7d -- .xgd/tickets/hot/request-3bc4b835.md`
  diffed against the staged blob is a pure superset relationship: every one of
  the 163 lines the creation commit wrote is present on HEAD verbatim, except
  the three frontmatter values in Hunk 1 that a later edit advanced. The entire
  ticket body — the gap statement, migration `0004_identity.sql` and its three
  tables, the no-CHECK-constraint rationale, the `account_id` + `email` pairing,
  the absent unique index on `entitlements.account_id`, the
  invite-provisions/login-binds split, the denial-oracle argument, and the
  expiry UAT — is carried forward unchanged.

- The only facts not carried forward are the superseded `updated_at` /
  `last_field_updated` stamps and the `status: draft` that later edits advanced
  to `bundled`. All bookkeeping or superseded lifecycle state, not developer
  work.

- No code, test, spec-matrix (`story-`/`acceptance_criterion-`/`capability-`)
  or config files were in this conflict set — the cherry-pick touches exactly
  one path, an xgd bookkeeping ticket. No test function on either side was
  touched, so 2f was never engaged.

## Staging state

Resolved with `git checkout --ours` and staged with `git add --sparse` (the path
sits outside this branch's sparse-checkout cone — 11% of tracked files present;
DOC-986 §2/§4.1). `git status --porcelain` is empty: no unmerged paths, no
modified paths; `grep -c` for conflict markers is `0`.

The staged blob is identical to HEAD's blob (`git diff --cached` is empty), so
this cherry-pick carries an empty net change — expected, since replaying a
ticket's creation onto a branch that already holds the ticket's evolved form can
only re-assert superseded state. Per STEP 4 no `--skip` was called; the finalize
step should detect the clean staged diff and skip the commit itself.

Per the mission constraints, `--continue`, `--skip`, `--quit` and `--abort` were
**not** called and nothing was run that resets or forgets the cherry-pick;
`CHERRY_PICK_HEAD` (`76b69e1a7d5caf55c09e6189f4dc1b5e6f8ef74d`) is intact and
was re-verified after staging.

## Flagged for post-merge review

Per the enrichment rule (intent unknown on the OURS side —
`seed_local_overlay`), `.xgd/tickets/hot/request-3bc4b835.md` is flagged for
post-merge review. Nothing was lost in this resolution, but the OURS-side
operation kind was not determinable from the enrichment metadata.
