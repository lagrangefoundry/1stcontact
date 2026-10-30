---
uid: report-57eae347
id: REPORT-5814
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T19:05:26.843501+00:00'
updated_at: '2026-10-02T19:05:26.843501+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Resolved conflict: cherry-pick `9e36aac12b` — `xgd(ticket): update report report-377b581e`

- Picked commit: `9e36aac12b8a8cd2a663cbffc5f6964812493711` (author 2026-09-28 15:35:56 -0700, +3/-0)
- HEAD: `8ff178e62c7d869e0a2b864f16918e3b54bbd8f1`
- Apply target: `ec118d67626fd31cfce67ca88dc9908ecdde70ed`
- `prior_stage_failure`: empty (retry count 1)
- Conflicted paths: 1 — `.xgd/tickets/hot/report-377b581e.md` (`UU`, not materialized in the sparse checkout)

### Resolution: INCOMING (theirs), whole file

The only region is the tail of `fields.skipped_commits` (an append-only list).

| side | blob | `skipped_commits` tail |
|---|---|---|
| base (`9e36aac12b^` = merge `f67705f840`) | `78107e96a2` | ends `…aed29a32`, then 6 entries `c5153f10 … 0c7b4f90` |
| ours (HEAD) | `c7b7b6654b` | ends `…aed29a32` (lacks those 6) |
| theirs | `77bb313089` | base + 3 entries `12b451f5`, `48b29f7a`, `68679783` |

Evidence that ours is a strict ancestor state of incoming, not a competing edit:

- `HEAD:<path>` blob `c7b7b6654b` is **byte-identical** to `79560d87a8:<path>` — the xgd-working commit
  (15:17:08) immediately before the merge on incoming's own history. HEAD's last write to this file,
  `7ea44838da`, is the replay of that commit.
- The 6 entries ours lacks were added by merge commit `f67705f840` ("Merge branch 'free-REQ-343' into
  xgd-working", +6/-0 on this path). Resync does not replay merge commits, so they never reached this
  branch; ours' entire base→ours delta is exactly those 6 deletions and nothing else.
- Theirs' entire base→theirs delta is 3 appended list entries. No other field differs on any side.

So incoming is a linear successor of ours: theirs = ours + 6 (merge) + 3 (this pick). Taking theirs
loses nothing from HEAD and restores the merge-carried entries. The enrichment's "more recent by
timestamp" rule agrees (theirs 15:35:56 vs ours 15:17:08), but the blob identity is what settles it.

### State after resolution

- `git checkout --theirs` + `git add --sparse`; staged blob `77bb313089` == `9e36aac12b:<path>`.
- `git ls-files -u` empty; staged `--stat HEAD` = 1 file, +9/-0 (6 merge-carried + 3 from this pick).
- `CHERRY_PICK_HEAD` intact; not committed (left for finalize).
- No tests run: frontmatter-only ticket change, no code touched.

### Forecast

188 further xgd-working commits touch this path after the pick (next: `a5e4198dfe` 15:37:40,
`8758929097`, `5bf19918bb`, …). HEAD now equals incoming's blob at this point, so they should apply
clean until the next merge commit that edits the file; when one does, the same shape recurs — check
`HEAD:<path>` against the pre-merge xgd-working blob and take theirs if identical.

Flag for post-merge review: this file is the resync anchor for the run doing the replay; the copy on
this branch is replayed xgd-working history, not the live anchor in the main checkout.
