---
uid: report-be9583b8
id: REPORT-4557
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T21:17:18.264437+00:00'
updated_at: '2026-09-20T21:17:18.264437+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-94e93caa.md` (REQ-153, "Reserve locale-shaped page slugs") — **UU**, class **2e** (intent/bookkeeping ticket, `request-*`). Working-tree markers were present, but the path sits outside the sparse-checkout cone (DOC-986 §2/§4.1), so staging required `git add --sparse`. The conflict region was the frontmatter status block alone (`updated_at` / `completed_at` / `status`); the body and the whole `fields:` map were byte-identical on both sides.
  - Incoming (`CHERRY_PICK_HEAD` = `7f82df8148`, working-timeline `2026-08-24T02:10:42+00:00`): `status: ready_to_reconcile → bundled`, `updated_at → 2026-08-24T02:10:41`, `completed_at: null`, plus `fields.bundled_in: bundle-b3b7c399`.
  - Ours (`f7bd4caa5e`, working-timeline `2026-08-31T14:22:27+00:00`): `status: free_and_reconciled`, `completed_at` set to `2026-08-31T14:22:27`, `updated_at → 2026-08-31T14:22:27`.
  - Both sides wrote the same three facts, so the 2e per-fact rule applies: the later-positioned intent wins. Confirmed via `xgd working-timeline f7bd4caa5e 7f82df8148` (not raw `updated_at`) — ours is 7 days later on the working timeline. Took ours for that block and staged with `git add --sparse`.

## Incoming changes preserved

- No code or implementation files were in conflict — the sole conflicted path is a bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` check applies only to it.
- Ours is a strict superset of the incoming side; nothing incoming was discarded:
  - `fields.bundled_in: bundle-b3b7c399` — the incoming commit's only field addition — is already present verbatim in HEAD outside the conflict region and survives in the resolved file (line 33).
  - `status: bundled` is a lifecycle predecessor of HEAD's `free_and_reconciled` (per `xgd ticket schema --type request`); HEAD's terminal state already incorporates having been bundled, so adopting it supersedes rather than drops the incoming transition. `completed_at: null → <set>` is the same supersession.
  - `git show 7f82df8148 -- .xgd/tickets/hot/request-94e93caa.md` is a 3-insertion/2-deletion frontmatter-only diff; the incoming commit made no body changes.
- No hunks were dropped under the BUG-1301 precedence exception; none applied.

## Staging state

- `git status --porcelain` is empty: no `UU`/`AA`/`DU`/`UD` lines remain and `git diff --cached --stat` is empty, because the resolution is identical to HEAD (main already carries the later transition for this ticket).
- Per STEP 4, `--skip` was **not** called — `CHERRY_PICK_HEAD` is intact and Python's finalize step will detect the clean staged diff and skip the commit.
