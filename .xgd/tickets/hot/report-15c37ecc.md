---
uid: report-15c37ecc
id: REPORT-5314
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T07:11:15.812947+00:00'
updated_at: '2026-09-28T07:11:15.812947+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-8eef3846.md` — BUNDLE-22 ("BUG-39 + REQ-154"),
  class **UU**, intent/bookkeeping ticket → **STEP 2e**. One conflict hunk,
  in the frontmatter status block; the rest of the file auto-merged.
  Resolved per-fact to the later-positioned intent, which on every
  conflicting fact is **ours**. Staged blob `fb4a6e5694` (= stage 2).

  `CHERRY_PICK_HEAD` = `232a68212a`, `xgd(ticket): update bundle
  bundle-8eef3846`, authored Mon Aug 31 12:21:08 2026 -0700 (19:21:08 UTC),
  touching this one path (4 insertions, 4 deletions).

  The incoming commit's entire content change was a lifecycle advance
  `ready_to_reconcile` → `reconciling` plus its bookkeeping stamps, and a
  trailing-newline strip. Ours is strictly further along the same lifecycle
  — the bundle completed its reconcile ~4h41m after the incoming snapshot:

  | fact | ours | incoming | verdict |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `reconciling` | **ours** — terminal state; incoming is an earlier stage of the same lifecycle |
  | `completed_at` | `2026-08-31T23:59:50.119536+00:00` | `null` | **ours** — incoming-wins would null out a completion stamp |
  | `updated_at` | `2026-09-01T00:00:07.956062+00:00` | `2026-08-31T19:21:08.797753+00:00` | **ours** — later by 4h38m59s |
  | `last_field_updated` | `result` | `status` | **ours** — consistent with the `result`/`completed_at` write that produced ours |
  | trailing newline | present | stripped | **ours** — cosmetic; ours is the form later commits build on |

  No fact was non-overlapping, so there was nothing to combine: every
  field in the conflict hunk is the same field set differently on the two
  sides, and on each one the later-positioned intent is ours.

  Bundle tickets carry no `intent_uid`, so `xgd working-timeline` has no
  input here; per the documented fallback the tie-break used commit
  timestamp, which agrees with the `updated_at` ordering above.

  Everything outside the conflict hunk — the collapsed `commits` entry
  carrying `main_sha: 90527353c0`, the 40+ entry `orphan_commits` remap
  table, and the rest of `fields` — exists only on ours and git merged it
  without conflict.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's
"incoming changes appear in the resolved version" check has no code-file
subjects. The single conflicted path is a bookkeeping ticket resolved
under STEP 2e, whose rule is per-fact later-intent — not incoming-wins —
so the incoming side's frontmatter values are correctly absent from the
result. No BUG-1301 PRECEDENCE exception was invoked; no test function
was deleted; no code hunk was dropped.

## Verification

- `git status --porcelain` — empty; no `UU`/`AA`/`DU`/`UD` lines remain.
- `git ls-files -u` — empty; no unmerged stages.
- `git ls-files -s` — `100644 fb4a6e5694... 0`, staged at stage 0.
- Resolved working file `diff`s byte-identical against stage 2.
- `git rev-parse --verify CHERRY_PICK_HEAD` — still `232a68212a`; no
  `--continue` / `--skip` / `--quit` / `--abort` was issued, and no other
  command touched the sequencer state.

Staging required `git add --sparse`: `.xgd/tickets` is outside this
worktree's sparse-checkout cone (DOC-986 §2/§4.1), so a plain `git add`
refused the path and left the index unmerged.

## Note for the sequencer

The resolution takes ours verbatim, so the staged tree is identical to
`HEAD` and this cherry-pick will be **empty** when resumed. That is the
expected outcome: the post-watermark sync already carried this bundle
past the state the picked commit was setting. Per STEP 4, `--skip` was
**not** called — finalize should detect the clean staged diff and skip
the commit.
