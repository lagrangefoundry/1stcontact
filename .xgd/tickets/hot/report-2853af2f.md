---
uid: report-2853af2f
id: REPORT-4556
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T21:14:07.604151+00:00'
updated_at: '2026-09-20T21:14:07.604151+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-a03967f2.md` — **UU**, class **2e** (intent/bookkeeping ticket; `request-*`, outside the sparse-checkout cone per DOC-986 §2/§4.1, so the conflict existed in the index only with no working-tree markers). The conflict region was the frontmatter status block alone; the body was byte-identical on both sides.
  - Incoming (`CHERRY_PICK_HEAD` = `1d63b11c15`, working-timeline `2026-08-24T02:10:41+00:00`): `status: ready_to_reconcile → bundled`, `updated_at → 2026-08-24T02:10:41`, plus `fields.bundled_in: bundle-b3b7c399`.
  - Ours (`6558127a6b`, working-timeline `2026-08-31T14:22:29+00:00`): `status: free_and_reconciled`, `completed_at` set, `updated_at → 2026-08-31T14:22:29`.
  - Both sides wrote the same facts (`status`, `updated_at`, `completed_at`), so the 2e per-fact rule applies: the later-positioned intent wins. Confirmed with `xgd working-timeline 6558127a6b 1d63b11c15` rather than raw `updated_at` — ours is 7 days later on the working timeline. Took ours for that block and staged with `git add --sparse`.

## Incoming changes preserved

- No code/implementation files were in conflict — the sole conflicted path is a bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` verification applies only to it.
- Ours is a strict superset of the incoming side; nothing incoming was discarded:
  - `fields.bundled_in: bundle-b3b7c399` — the incoming commit's only field addition — is already present verbatim in HEAD outside the conflict region and survives in the resolved file (line 25).
  - `status: bundled` is a lifecycle predecessor of HEAD's `free_and_reconciled` (per `xgd ticket schema --type request`); HEAD's terminal state already incorporates having been bundled, so adopting it supersedes rather than drops the incoming transition.
  - `git show 1d63b11c15 -- .xgd/tickets/hot/request-a03967f2.md` touches frontmatter only — the incoming commit made no body changes.
- No hunks were dropped under the BUG-1301 precedence exception, and no UAT test functions were touched.

## Staging state

`git status --porcelain` is empty and `git ls-files -u` reports no unmerged entries — the resolution is byte-identical to HEAD, so the staged diff against HEAD is clean. Per STEP 4 that outcome is expected and was left as-is: `--skip`/`--continue`/`--quit`/`--abort` were **not** invoked, and `CHERRY_PICK_HEAD` (`1d63b11c15`) is intact for Python's finalize step to detect the empty commit.
