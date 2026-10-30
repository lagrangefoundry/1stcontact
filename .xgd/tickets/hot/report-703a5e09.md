---
uid: report-703a5e09
id: REPORT-5534
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T10:17:37.462068+00:00'
updated_at: '2026-09-29T10:17:37.462068+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e: `request-*` under `.xgd/tickets/`, not a matrix-defining
  spec ticket). Resolved by taking the incoming (CHERRY_PICK_HEAD
  `7becbf64`) version whole, on the **strict-superset** branch of 2e —
  not on the later-`updated_at` branch.

  Three-way comparison:

  | stage | `updated_at` | `status` | body |
  |---|---|---|---|
  | base (1) | 2026-09-02T23:54:00 | `free_coding` | full |
  | ours (2), HEAD `cb56b11e` | 2026-09-02T**23:39:13** | `free_coding` | **~95 lines removed** |
  | theirs (3), `7becbf64` | 2026-09-03T00:02:06 | `free_coded` | full + `commits` list + `version: 0.2.51` |

  The OURS side is a stale write: its `updated_at` is *older than the
  merge base*, and it drops the entire "What was implemented" and "Test
  plan" sections that the base already carried — an agent rewrote the
  file from a snapshot taken before the 23:54 body update. It contributes
  no fact absent from theirs.

  The THEIRS side is base plus a clean forward step: the
  `free_coding` → `free_coded` transition, the two `working_sha` entries,
  and the version bump, with the body intact. Theirs ⊇ base ⊋ ours, so
  "keep the superset" applies and no per-fact tie-break was needed.
  Nothing from ours was discarded that exists anywhere else.

  Sparse-checkout note (DOC-986 §2/§4.1): `/.xgd/tickets/**` is excluded
  from this worktree's sparse cone, so the conflict lived in the index
  only, with no working-tree markers and no file on disk. Staged via
  `git add --sparse`, then `git sparse-checkout reapply` to restore the
  intended sparse state. Resolution is held in the index.

## Incoming changes preserved

- `.xgd/tickets/hot/request-407a6fd8.md`: verified byte-identical, not
  merely equivalent — `git rev-parse` reports the staged blob
  (`:0:`) and `CHERRY_PICK_HEAD:` blob are both
  `bda5080681cc493c8ab73bd633d3208e6e9b7967`, including the file's
  missing trailing newline. Every incoming change (`status: free_coded`,
  `commits[]`, `version: 0.2.51`, `updated_at`, full body) is present.

No hunks were dropped; the BUG-1301 precedence exception was not
invoked. No UAT test files were involved in this conflict.

Post-merge review flag (per the enrichment rule, both sides' subjects
being identical `xgd(ticket): update request request-407a6fd8`): the
OURS-side commit `cb56b11e` wrote this ticket with an `updated_at`
predating the merge base, which indicates a raced ticket write in the
working repo worth investigating independently of this resync.
