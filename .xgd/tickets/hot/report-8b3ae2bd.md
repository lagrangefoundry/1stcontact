---
uid: report-8b3ae2bd
id: REPORT-4524
type: report
title: 'Resync resolve conflicts: 18ffaec45665d29545db8bfd323ee4bf6d1f8678'
created_by: xgd
created_at: '2026-09-20T19:33:52.866063+00:00'
updated_at: '2026-09-20T19:33:52.866063+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` — AA (both added), intent/bookkeeping
  ticket (`request-*`), rule 2e. Resolved in favour of OURS (HEAD side).

  The two sides differ only in the frontmatter, and every differing fact moves
  in the same direction — ours is strictly later and a superset:

  | field | ours (HEAD) | theirs (incoming) |
  |---|---|---|
  | `updated_at` | `2026-08-31T14:22:44Z` | `2026-08-20T12:51:32Z` |
  | `completed_at` | `2026-08-31T14:22:44Z` | `null` |
  | `status` | `free_and_reconciled` | `reconciling` |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  Taking the incoming side would have regressed the lifecycle status
  (`free_and_reconciled` → `reconciling`), cleared `completed_at`, and dropped
  the `bundled_in` back-reference to `bundle-b3b7c399`. There is no fact on the
  incoming side that ours does not already carry, so no per-fact composition was
  needed: ours is the later-positioned intent on every contested field.

  Staged via `git checkout --ours` + `git add --sparse` (the path is outside the
  sparse-checkout cone on this resync branch, DOC-986 §2/§4.1).

## Incoming changes preserved

No code, test, or spec-matrix files were involved in this conflict — the sole
conflicted path is a bookkeeping `request-*` ticket, so STEP 3's incoming-code
verification does not apply and no BUG-1301 precedence exception was invoked.

The incoming commit (`7fb577286f7919b819583a27f010f5e11167060d`) touched only
the frontmatter fields listed above, all of which represent an *earlier* state
of the same ticket than HEAD already records. Nothing from the incoming side was
discarded that HEAD does not already supersede.

Resolution leaves an empty staged diff against HEAD (HEAD already carries the
resolved content). Per the step instructions, `--skip` was NOT invoked; the
cherry-pick remains paused with `CHERRY_PICK_HEAD` intact for the finalize step.
