---
uid: report-7c78459c
id: REPORT-5240
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T01:20:27.948845+00:00'
updated_at: '2026-09-28T01:20:27.948845+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` (REQ-148) — **UU, intent/bookkeeping ticket
  (STEP 2e)**, sparse-excluded path. Resolved `--ours` per-fact; every differing fact
  on the incoming side points backwards, so this is subsumption rather than a genuine
  per-fact conflict.

  The ours↔theirs stage diff (the whole dispute) is two frontmatter regions:

  | fact | ours (HEAD) | theirs (incoming `7c91ff7863`) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `completed_at` | `2026-08-31T14:22:36Z` | `null` |
  | `updated_at` | `2026-08-31T14:22:36Z` | `2026-08-24T01:14:11Z` |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  The body never conflicted, and the incoming commit makes no body change, so plain
  `--ours` discards nothing there and git's clean body merge was left alone.

  Mechanics: `git checkout --ours -- <path>` (materialised the file despite the
  sparse-cone warning), then `git add --sparse -- <path>`; plain `git add` fails on
  `.xgd/tickets/**` here.

## Incoming changes preserved

The incoming commit `7c91ff7863` is a declared data-only fix — *"Data fix (BUG-1265):
merge orphaned working_sha 055378794 (the free-REQ-148 merge commit, flattened away by
a later resync rebase, never reachable from xgd-working) into the surviving entry's
working_sha_history. Resolves the purple/stale-commit dispatcher flag; no code change."*

That payload is **already present on HEAD, byte-identically**, so nothing was
discarded:

- Base (`CHERRY_PICK_HEAD^`) carries the pre-fix shape: `working_sha_history: [ade64575,
  a6e92ca2]` plus a separate stub entry `working_sha: 055378794 / working_sha_history: []`.
- Ours (stage 2) and the resolved file both carry the post-fix shape:
  `working_sha_history: [ade64575, 055378794, a6e92ca2]`, stub entry gone.
- Attribution, not inference: `ce11ecb0c4 xgd(ticket): seed_local_overlay request
  request-7ae3c2cc` (2026-08-30) is the HEAD-side commit that introduced the
  `- 055378794f49f1dc39b20fdcf54aa7fa0b1190e3` line and removed the stub — the identical
  hunk — while also advancing `status` to `bundled` and adding `bundled_in:
  bundle-b3b7c399` and `chat_comment: comment-a4605dbc`. `decf67f54a` (2026-08-31) then
  advanced `bundled` → `free_and_reconciled` with `completed_at`.

So the incoming state is an ancestor-equivalent of HEAD reached by a later route:
redundant, not discarded. Taking incoming would have reverted an operator-owned status
and orphaned a completed request from its own bundle.

No BUG-1301 precedence exception was invoked; no test file was touched; no hunk was
dropped.

## Staging state

`git status --porcelain` is empty (no UU/AA/DU/UD lines remain) and `git diff --cached
HEAD` is empty — expected for a subsumption. `CHERRY_PICK_HEAD` (`7c91ff7863`) is intact;
no `--continue`/`--skip`/`--quit`/`--abort` was run. Finalize should detect the clean
staged diff and skip the commit.
