---
uid: report-c96a7504
id: REPORT-5246
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T01:45:34.973188+00:00'
updated_at: '2026-09-28T01:45:34.973188+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), STEP 2e. Resolved per fact by later-positioned intent; result
  is identical to the HEAD-side blob, staged via `git checkout --ours` +
  `git add --sparse`.

  Single conflict hunk (4 frontmatter lines). `bundled_in: bundle-b3b7c399`
  merged cleanly outside the hunk — both sides added it identically. Body
  untouched by both sides.

  | fact | HEAD | incoming (`9099dbbd`) | taken |
  |---|---|---|---|
  | `updated_at` | `2026-08-31T14:22:44.216414+00:00` | `2026-08-24T02:10:41.151671+00:00` | HEAD (later) |
  | `completed_at` | `2026-08-31T14:22:44.216414+00:00` | `null` | HEAD (later; consistent with completed status) |
  | `last_field_updated` | `status` | `status` | identical |
  | `status` | `free_and_reconciled` | `bundled` | HEAD (downstream in lifecycle) |

  Rationale — this is not a competing-intent conflict. `xgd ticket history`
  on the HEAD side shows the ledger passed *through* the incoming state and
  then advanced one step further:

  - `e0ffd3bf` `xgd(ticket): seed_local_overlay request request-23fd6e61`
    (2026-08-30): `reconciling` → `bundled`, setting
    `updated_at: 2026-08-24T02:10:41.151671+00:00` and adding
    `bundled_in: bundle-b3b7c399`. This is byte-identical to the incoming
    side, including the timestamp — the overlay replayed the working-branch
    state verbatim.
  - `02c0d390` `xgd(ticket): update request request-23fd6e61` (2026-08-31):
    `bundled` → `free_and_reconciled`, setting `completed_at`.

  Incoming commit `9099dbbd` *is* that `→ bundled` transition arriving from
  xgd-working, which HEAD had already absorbed. Taking incoming wholesale
  would have regressed the lifecycle `free_and_reconciled` → `bundled` and
  cleared `completed_at`, discarding the later, strictly-downstream state.

## Incoming changes preserved

- `.xgd/tickets/hot/request-23fd6e61.md`: verified against
  `git show 9099dbbd -- <file>`. The incoming commit contributes exactly two
  facts, both present in the staged result:
  - `bundled_in: bundle-b3b7c399` — present at line 29 of the staged blob.
  - the `bundled` status transition — present in the ledger as `e0ffd3bf`
    and superseded in the same monotonic lifecycle direction by `02c0d390`.

  Nothing from the incoming side was dropped. No BUG-1301 precedence
  exception was invoked; no test files were involved.

## Staging state

`git status --porcelain` is empty: the conflict class line is gone and the
resolved content is byte-identical to HEAD, so the staged diff for this
cherry-pick is empty. Per STEP 4 this was left alone rather than skipped —
`CHERRY_PICK_HEAD` (`9099dbbd884752c508e73dc085176d56b2314309`) is intact for
the finalize step to detect the clean diff and skip the commit.
