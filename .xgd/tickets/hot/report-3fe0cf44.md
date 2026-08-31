---
uid: report-3fe0cf44
id: REPORT-3107
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T22:23:33.751420+00:00'
updated_at: '2026-08-31T22:23:33.751420+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bundle-78f4e2fe.md` — class **AA** (both added), bookkeeping
  ticket under rule **2e** (bundle-*, intent/bookkeeping, not a spec ticket).
  Resolved by taking the **HEAD (ours)** side via `git checkout --ours` +
  `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

  Both sides are the same ticket, `bundle-78f4e2fe` / **BUNDLE-21**
  ("BUG-36 + BUG-37 + BUG-38"), same `uid`, `id`, `title`, `created_at`.
  A full `diff` of index stages 2 and 3 shows the **entire 622-line markdown
  body is byte-identical** on both sides (sole textual difference: ours has no
  trailing newline). Every difference is confined to lifecycle frontmatter:

  | field | incoming (`efdc580`, 2026-08-26 10:36 -0700) | ours (`4b197af`, 2026-08-31 12:19 -0700) |
  |---|---|---|
  | `status` | `ready_to_reconcile` | `free_and_reconciled` |
  | `completed_at` | `null` | `2026-08-31T19:19:32Z` |
  | `last_field_updated` | `created_at` | `result` |
  | `result` | absent | `pass` |
  | `fields.commits` | 5 entries, `working_sha` set, `main_sha: null` | 1 entry, `main_sha: 96a7693` |
  | `fields.orphan_commits` | absent | 21 old→new sha remappings |
  | `fields.merged_at_commit` | absent | `96a7693` |

  This is the ticket's own creation commit racing its own completed state.
  Ours is the strictly later lifecycle position of the same bundle — the state
  the reconcile that already merged BUNDLE-21 wrote. `merged_at_commit`
  `96a76934e010d272feb2d2bfc2b5d9645db10fe8` was verified to exist as a commit
  in this repository, so the completed state is real, not a stale artifact.

  Applied the conflict-intent enrichment's own rule ("intent unknown on one or
  both sides — take the more recent commit by timestamp") and 2e's per-fact
  timeline rule: ours is 5 days later and is a superset on every field except
  `fields.commits`, which both sides set differently.

  `fields.commits` was decided per-fact rather than merged. The incoming 5
  `working_sha` entries and ours' single `main_sha` entry are the *same fact*
  (which commits this bundle covers) recorded at two pipeline stages — the
  reconcile collapsed the five working-timeline commits into one merged entry
  plus the 21-entry `orphan_commits` remap. Splicing the incoming entries back
  alongside ours would have produced a six-commit bundle with five commits
  marked unreconciled: a hybrid state present on neither side, misrepresenting
  a completed bundle and inviting the pipeline to re-attempt work already
  merged. 2e prohibits inventing content not present on either side, so the
  later side wins this fact outright.

  Flagged for post-merge review as the enrichment rule directs, though the
  identical bodies make the risk surface frontmatter-only.

## Incoming changes preserved

No code/implementation files were in conflict — the incoming commit
`efdc5802dbeffa2254dcc3fc00ec12a873e64560` touches exactly one path, the bundle
ticket above (622 insertions, file creation).

`git show efdc5802 -- .xgd/tickets/hot/bundle-78f4e2fe.md` contents versus the
resolved file: the incoming commit's substantive payload is the 622-line bundle
narrative (the BUG-36 tenant-bootstrap writeup, the BUG-37 preview-cache
writeup, and the BUG-38 isolate-churn writeup). All of it is present verbatim in
the resolved version — confirmed by direct `diff`, not by inspection. Nothing
authored by the developer was discarded.

The only incoming lines absent from the resolution are the initial-state
frontmatter values in the table above, each superseded by ours' later value for
the same field. That is supersession by a later write to the same fact, not a
discard of developer intent, and it is the outcome 2e's timeline rule
prescribes.

No hunk was dropped under the BUG-1301 precedence exception; no test file was
involved.

## Note on the staged result

`git diff --cached HEAD` is **empty** — this resolution nets to no change
against HEAD. That is the expected, benign case described in STEP 4
(BUG-1109/BUG-1122): HEAD already carries this commit's entire content, having
reached it through the reconcile that completed BUNDLE-21, so the commit is
genuinely redundant rather than discarded. STEP 3's distinguishing check
confirms the redundant reading: the incoming commit's key changes are *present*
in HEAD, not merely absent from the resolution. `--skip` was not called;
CHERRY_PICK_HEAD is intact at `efdc5802dbeffa2254dcc3fc00ec12a873e64560` for
`cherry_pick_finalize_resolution` to act on.
