---
uid: report-970d838d
id: REPORT-4677
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T09:34:59.338464+00:00'
updated_at: '2026-09-21T09:34:59.338464+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU**, intent/bookkeeping ticket
  (`request-*`, STEP 2e). Resolved by a recorded skip of the incoming commit
  `33e3d1d4aa15` (`xgd cherry-pick-skip report-7b4182de`), because the incoming
  side was a strict subset of HEAD rather than a competing edit:

  | fact | ours (HEAD) | theirs (`33e3d1d4aa`) |
  |---|---|---|
  | `status` | `bundled` | `free_coded` |
  | `updated_at` | 2026-09-09T21:32:49Z | 2026-08-31T23:39:02Z |
  | `last_field_updated` | `status` | `status` |
  | `fields.commits[0].working_sha` | `d99c1f438572` | `d99c1f438572` (identical) |
  | `fields.version` | `0.2.24` | `0.2.24` (identical) |
  | `fields.bundled_in` | `bundle-87be4669` | *(absent)* |
  | body | adds "Resolved after implementation (2026-08-31)" section | no body change except stripping the file's trailing newline |

  Per 2e, the per-fact rule applies: every fact the incoming side carries is
  either byte-identical to ours (`working_sha`, `version`) or is a
  later-superseded earlier value of the same fact (`status`: `free_coded` is the
  state HEAD has already advanced past to `bundled`, with `bundled_in` set). The
  incoming side contributes no field or section that HEAD lacks. Its only unique
  change is the removal of the trailing newline, which is not an intent.

  Resolving as "ours" would therefore have produced a tree byte-identical to
  HEAD, making the cherry-pick empty. The skip was recorded on the anchor via
  `xgd cherry-pick-skip` (not bare `git cherry-pick --skip`) so the resync gate
  does not count `33e3d1d4aa15` as still pending.

  Note: the file is outside the sparse-checkout cone (this worktree has 11% of
  tracked files present, `.xgd/tickets/**` excluded per DOC-986 §2/§4.1), so the
  conflict existed only in the index with no working-tree markers. All three
  stages were inspected via `git show :1:` / `:2:` / `:3:` rather than by reading
  the worktree.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path was a
`request-*` intent ticket, not a spec ticket, source file, or UAT test. No UAT
test function on either side was deleted, and the BUG-1301 precedence exception
was not invoked.

All incoming facts from `33e3d1d4aa` are present in the resolved tree:

- `fields.commits[0].working_sha = d99c1f438572f2da868db0bc384c798858681cac` — present in HEAD, identical.
- `fields.version = 0.2.24` — present in HEAD, identical.
- `status` transition to `free_coded` — superseded in HEAD by `bundled`, which is
  the strictly later state of the same fact (HEAD `updated_at` 2026-09-09 vs
  incoming 2026-08-31), accompanied by `bundled_in: bundle-87be4669`. Nothing was
  discarded: the incoming value is an earlier point on the same lifecycle field.

The only incoming change not carried forward is the removal of the file's
trailing newline, which encodes no intent.

## Final state

`git status --porcelain` is empty; no conflict-class entries (UU/AA/DU/UD/AU/UA)
remain. `CHERRY_PICK_HEAD` is absent because the recorded skip consumed the
paused cherry-pick. `--continue`, `--quit`, and `--abort` were not called.
