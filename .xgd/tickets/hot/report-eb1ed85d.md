---
uid: report-eb1ed85d
id: REPORT-2814
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:44:32.631218+00:00'
updated_at: '2026-08-31T07:44:32.631218+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-94e93caa.md` — class `UU`, intent/bookkeeping ticket (STEP 2 rule **2e**), resolved by **keep the superset (ours)**.
  - Path is outside the sparse-checkout cone (DOC-986 §2/§4.1): no working-tree file existed, conflict lived only in the index (stages 1/2/3 = `ee4b757` / `b878b37` / `94dc843`). Resolved with `git checkout --ours -- <path>` then `git add --sparse -- <path>`.
  - Incoming commit: `082425ccd333debca6a7cb520dfdeca19ca4eaa8` — _xgd(ticket): update request request-94e93caa_ (1 file, +1 line).

## Incoming changes preserved

The incoming commit's entire diff for this file is a single added line under `fields:`:

```
+  chat_comment: comment-18e5a285
```

That exact line is already present in the ours-side blob (`b878b37`, line 25). Ours is a strict superset of theirs relative to the merge base:

| fact | base | theirs (incoming) | ours (HEAD) |
|---|---|---|---|
| `fields.chat_comment` | absent | `comment-18e5a285` | `comment-18e5a285` |
| `fields.bundled_in` | absent | absent | `bundle-b3b7c399` |
| `status` | `ready_to_reconcile` | `ready_to_reconcile` | `bundled` |
| `updated_at` | `2026-08-23T03:29:52Z` | `2026-08-23T03:29:52Z` | `2026-08-24T02:10:41Z` |

No fact was changed differently on the two sides, so no timeline arbitration was needed — ours carries the incoming fact verbatim plus the later bundling bookkeeping. Nothing from either side was dropped; no content was invented; `fields.intent_uid` / `story_uid` / `capability_uid` were not touched.

Resolved worktree file hashes to `b878b37b83d1bee451a58a1765f56f45a91c0782` (identical to the ours stage — verified free of conflict markers).

### Note: resolution nets to no diff vs HEAD

`git diff --cached --stat HEAD` is empty. This is the redundant-commit case (BUG-1109/BUG-1122), not a discard: STEP 3's discriminator confirms the incoming commit's key change **is present in HEAD**, arrived there via the later `bundled` update rather than being lost. Per STEP 4, no `--skip` was issued — the tree is staged and `CHERRY_PICK_HEAD` is left intact for `cherry_pick_finalize_resolution`.

No code/implementation files, spec tickets, or UAT test files were involved in this conflict. The BUG-1301 precedence exception was not invoked; no hunk was dropped.
