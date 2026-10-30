---
uid: report-99afad95
id: REPORT-5295
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T04:55:21.486699+00:00'
updated_at: '2026-09-28T04:55:21.486699+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` (BUNDLE-20) — **§2e intent/bookkeeping ticket** (`bundle-*`), UU, out of the sparse-checkout cone. One conflict hunk, in frontmatter only (4 lines: `updated_at`, `completed_at`, `last_field_updated`, `status`). Resolved to **ours**, per §2e's "same field changed differently on both sides → take the later-positioned intent, per fact":
  - Ours: `updated_at: 2026-08-31T14:23:04`, `completed_at: 2026-08-31T14:22:24`, `last_field_updated: result`, `status: free_and_reconciled`.
  - Incoming (`726b77db28`, `xgd(ticket): update bundle bundle-b3b7c399`, authored 2026-08-27 20:57:06 -0700): `updated_at: 2026-08-28T03:57:06`, `completed_at: null`, `last_field_updated: status`, `status: ready_to_reconcile`.
  - Both sides changed the *same* four facts; there are no disjoint incoming edits to combine. The incoming commit's entire diff vs. its own parent is those two lines (`updated_at`, and `status: reconciling` → `ready_to_reconcile`) — it carries no other content.
  - Ours is later on both axes: wall-clock (`2026-08-31` vs `2026-08-28`) and lifecycle position (`free_and_reconciled` is downstream of `ready_to_reconcile`, and ours additionally carries a non-null `completed_at`). Bundle tickets carry no `intent_uid`, so `xgd working-timeline` has no input here; the tie-break falls back to commit/field timestamps, which agree with the lifecycle ordering. Taking incoming would regress the bundle `free_and_reconciled` → `ready_to_reconcile` and re-null `completed_at`.
  - Everything outside that hunk merged cleanly with ours winning, correctly: the picked commit touched only those two lines, so base == incoming for the rest of the file, and ours' post-reconcile state (the `commits` list collapsed to a single entry with `main_sha: eef7a8b48b`, plus the recorded `orphan_commits`) is preserved intact.
  - Staged with `git add --sparse` (DOC-986 §2/§4.1: `.xgd/tickets/**` is out of cone on resync branches). Resulting index blob is `bb444506b8` — byte-identical to the ours stage-2 blob, so the staged diff against HEAD is empty. Per STEP 4 this is left as-is for Python's finalize step to skip; `--skip`/`--continue`/`--quit`/`--abort` were not called and `CHERRY_PICK_HEAD` (`726b77db28`) is still present.

Verified afterwards: no conflict markers anywhere in the file, frontmatter parses as YAML (`status: free_and_reconciled`, 1 `commits` entry), `git ls-files -u` empty, `git status --porcelain` empty.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted path is an intent/bookkeeping ticket, so STEP 3's code-preservation check does not apply and the BUG-1301 precedence exception was not invoked.

For completeness, the incoming frontmatter values are deliberately *not* present in the resolved file. That is the §2e resolution itself, not a discarded developer change: the incoming side's only content is an older lifecycle snapshot of the same four facts ours already advanced past, and §2e resolves a genuine same-fact conflict in favour of the later-positioned intent. No incoming hunk with an independent target was dropped.
