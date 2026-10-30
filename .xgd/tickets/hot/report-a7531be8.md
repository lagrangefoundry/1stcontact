---
uid: report-a7531be8
id: REPORT-5313
type: report
title: 'Conflict resolution: bundle-8eef3846 (BUNDLE-22) on resync-377b581e'
created_by: xgd
created_at: '2026-09-28T07:10:06.405537+00:00'
updated_at: '2026-09-28T07:10:06.405537+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: bundle-8eef3846
---

# Conflict resolution — `xgd(ticket): update bundle bundle-8eef3846`

## Context

Resync branch `resync-377b581e`. Cherry-pick paused with `CHERRY_PICK_HEAD` =
`232a68212a`, authored Mon Aug 31 12:21:08 2026 -0700 (19:21:08 UTC), subject
`xgd(ticket): update bundle bundle-8eef3846`. The commit touches exactly one
path (4 insertions, 4 deletions).

Note: the resolver prompt body rendered empty for this invocation. The live
`CHERRY_PICK_HEAD` identified it as a real task rather than a priming call,
and the task was recovered from branch state plus the prior resolver's
conventions in the session log.

## Resolution

`.xgd/tickets/hot/bundle-8eef3846.md` (BUNDLE-22, "BUG-39 + REQ-154"), class
**UU**, intent/bookkeeping ticket → **STEP 2e**. Resolved to **ours**; staged
blob `fb4a6e5694` (= stage 2). One conflict hunk, in the frontmatter status
block; the rest of the file auto-merged.

The incoming commit's entire content change was a lifecycle advance
`ready_to_reconcile` → `reconciling` plus its bookkeeping stamps, and a
trailing-newline strip. Ours is strictly further along the same lifecycle.
Resolved fact by fact:

| fact | ours | incoming | verdict |
|---|---|---|---|
| `status` | `free_and_reconciled` | `reconciling` | **ours** — terminal state; incoming is an earlier stage of the same lifecycle |
| `completed_at` | `2026-08-31T23:59:50.119536+00:00` | `null` | **ours** — incoming-wins would null out a completion stamp |
| `updated_at` | `2026-09-01T00:00:07.956062+00:00` | `2026-08-31T19:21:08.797753+00:00` | **ours** — ~4h41m later |
| `last_field_updated` | `result` | `status` | **ours** — consistent with the `result`/`completed_at` write that produced ours |
| trailing newline | present | stripped | **ours** — cosmetic, and the file ours ships is the one later commits build on |

Everything outside the conflict hunk (the collapsed `commits` entry carrying
`main_sha: 90527353c0`, the 40+ entry `orphan_commits` remap table, and the
rest of `fields`) exists only on ours; the incoming side predates it and git
merged it without conflict.

This is the "overlay advances past incoming status" shape: the bundle
completed its reconcile on 2026-09-01, and the picked commit is a snapshot
from partway through that same reconcile. Taking incoming would regress
`free_and_reconciled` → `reconciling` and drop the completion stamp.

## Verification

- `git status --porcelain` — clean; no `UU`/`AA`/`DU`/`UD` lines remain.
- `git ls-files -u` for the path — empty; no unmerged stages.
- `git ls-files -s` — `100644 fb4a6e5694... 0`, staged at stage 0.
- Resolved working file `diff`s byte-identical against stage 2.
- `git rev-parse --verify CHERRY_PICK_HEAD` — still `232a68212a`; no
  `--continue` / `--skip` / `--quit` / `--abort` was issued.

Staging required `git add --sparse`: `.xgd/tickets` is outside this worktree's
sparse-checkout cone, so a plain `git add` refused the path with the index
left unmerged.

## Note for the sequencer

The resolution takes ours verbatim, so the staged tree is identical to `HEAD`
and this cherry-pick will be **empty** when resumed. That is the correct
outcome here — the post-watermark sync already carried this bundle past the
state the picked commit was trying to set. Per the resolver contract, `--skip`
was **not** called; the finalize step should detect the no-op.
