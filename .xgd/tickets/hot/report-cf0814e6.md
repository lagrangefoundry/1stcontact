---
uid: report-cf0814e6
id: REPORT-2827
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:59:46.195283+00:00'
updated_at: '2026-08-31T07:59:46.195283+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-3cd338cd.md` — **AA** (both added), intent/bookkeeping ticket (`request-*`) → rule **2e** (with 2b superset test). Both sides added the same 188-line request ticket. The only difference between the two stages is a single added frontmatter field on the incoming side:

  ```
  +  chat_comment: comment-a3fa692b
  ```

  Incoming (stage 3, blob `6e8e6f5`) is a **strict superset** of ours (stage 2, blob `9f832a5`): zero deletions, zero modified lines, one added field that the HEAD side never touched. No per-fact conflict exists, so no `xgd working-timeline` disambiguation was required. Resolved by taking the incoming version wholesale (`git checkout --theirs`), which is simultaneously the 2e superset rule and the free_coded-is-authoritative default. Staged blob verified identical to stage 3 (`6e8e6f5`).

## Incoming changes preserved

- `.xgd/tickets/hot/request-3cd338cd.md` — incoming commit `353b6f8` (`xgd(ticket): update request request-3cd338cd`, Martin Westhead, Sun Aug 23 13:19:41 2026 -0700) adds the file with `chat_comment: comment-a3fa692b`. Confirmed present at line 24 of the resolved file. No conflict markers remain. Nothing from either side was dropped — the resolution is a superset of both stages.

No hunks were dropped under the BUG-1301 precedence exception; no code or UAT test files were involved in this conflict.

Staged diff vs HEAD: 1 file changed, 1 insertion(+). Cherry-pick sequencer state (`CHERRY_PICK_HEAD`) left intact for `cherry_pick_finalize_resolution`.
