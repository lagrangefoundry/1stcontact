---
uid: report-c65a19a2
id: REPORT-3439
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:58:43.389978+00:00'
updated_at: '2026-09-04T00:58:43.389978+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — UU, intent/bookkeeping ticket (STEP 2 §2e).
  Out of the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict existed only
  in the index with no working-tree markers; resolved via
  `git checkout --ours` + `git add --sparse`.
  Rule applied: **one side is a strict superset** — kept the superset (HEAD/ours).
  - Incoming (`e302557b19135e234ea4a127148245b0dfdf21a6`, `xgd(ticket): update
    request request-3bc4b835`) added exactly one field, `chat_comment:
    comment-6477139e`, and dropped the trailing newline.
  - Ours (`737359c631`, `xgd(ticket): seed_local_overlay request
    request-3bc4b835`) contains that same `chat_comment: comment-6477139e` field
    plus disjoint additional advancement the incoming side never touched:
    `status: draft` → `bundled`, `last_field_updated: created_at` → `status`,
    `updated_at` → `2026-09-02T17:48:27Z`, and new `fields.commits`,
    `fields.version: 0.2.29`, `fields.bundled_in: bundle-203b1dc2`. It likewise
    ends without a trailing newline.
  - No fact is changed differently on the two sides, so no timeline tie-break was
    needed. The auto-enrichment's fallback (take the more recent commit by
    timestamp) points the same way: ours is dated 2026-09-02, the incoming commit
    2026-09-01T01:13Z.
  - No `fields.intent_uid` / `story_uid` / `capability_uid` were modified, and no
    content absent from both sides was introduced.

## Incoming changes preserved

- `.xgd/tickets/hot/request-3bc4b835.md` — **preserved**. The incoming commit's
  sole substantive change, `chat_comment: comment-6477139e`, is present verbatim
  in the resolved file (line 17 of `HEAD:.xgd/tickets/hot/request-3bc4b835.md`).
  Its second change, removing the file-final newline, is also satisfied: the
  resolved version ends without a trailing newline.
- No hunks were dropped; the BUG-1301 precedence exception was not invoked.
- Note for the finalize step: because HEAD already carried the incoming field, the
  resolution stages to no net diff vs HEAD (index blob `4de1054a61` == HEAD blob).
  This is the redundant-commit case (BUG-1109/BUG-1122), not a discard — STEP 3's
  distinguishing check passes, since the incoming key change is present in HEAD
  rather than absent. `--skip` was not called; CHERRY_PICK_HEAD is left intact for
  `cherry_pick_finalize_resolution`.
