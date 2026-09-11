---
uid: report-90b1340a
id: REPORT-4081
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T22:52:44.251140+00:00'
updated_at: '2026-09-11T22:52:44.251140+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` — UU, intent/bookkeeping ticket (`request-*`) → rule **2e**, resolved per-fact.

Incoming commit: `7c91ff7863` (Aug 23 18:14 -0700), `xgd(ticket): update request request-7ae3c2cc` — "Data fix (BUG-1265): merge orphaned working_sha 055378794 ... into the surviving entry's working_sha_history".
HEAD-side commit: `decf67f54a` (Aug 31 07:22 -0700), same subject, lifecycle advance `bundled` → `free_and_reconciled`.

Per-fact resolution of the single conflicted region (the frontmatter scalar block):

- `status`, `completed_at`, `updated_at`, `last_field_updated` — the SAME facts changed on both sides, so the timeline rule applies per-fact. HEAD's operation is the later one (2026-08-31T14:22:36Z vs 2026-08-24T01:14:11Z) and is the operator-owned lifecycle advance (`ready_to_reconcile` → `bundled` → `free_and_reconciled`, with `completed_at` stamped). Kept HEAD: `status: free_and_reconciled`, `completed_at: '2026-08-31T14:22:36.772226+00:00'`, `updated_at: '2026-08-31T14:22:36.772226+00:00'`, `last_field_updated: status`. The incoming side's `status: ready_to_reconcile`/`completed_at: null` is carried-along older state, not its declared operation — its own `last_field_updated: commits` says the operation was the commits fix.
- `fields.commits` (the incoming commit's actual intent) — NOT conflicted; merged cleanly. Present in the result.
- `fields.bundled_in: bundle-b3b7c399` — HEAD-only addition, not touched by incoming. Preserved.

No field was invented; nothing present on either side was dropped other than the older values of the four scalars above, each decided by timeline.

## Incoming changes preserved

The incoming commit's only substantive change is already present in HEAD, verbatim. Diffing base (stage 1, `1070c734e2`) against ours (stage 2, `51cb2b203b`) shows the identical hunk the incoming commit authored:

```
     working_sha_history:
     - ade64575a4706348dc54df0ed2d2b3f384fe3eb2
+    - 055378794f49f1dc39b20fdcf54aa7fa0b1190e3
     - a6e92ca2603cba91fb5b905c826566ac208737ac
-  - working_sha: 055378794f49f1dc39b20fdcf54aa7fa0b1190e3
-    reconcile_sha: null
-    main_sha: null
-    working_sha_history: []
```

So the orphaned `055378794` entry is folded into the surviving entry's `working_sha_history` in the resolved file — this is STEP 3's "present via a different route" case (the data fix reached HEAD through a post-watermark sync), not a discard. No hunk was dropped; the BUG-1301 precedence exception was not needed and is not invoked.

Consequence: the staged tree has **no net diff vs HEAD** — this cherry-pick is genuinely redundant. Per STEP 4 this is not a failure and `--skip` was not called; the cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `7c91ff7863`) is left intact for `cherry_pick_finalize_resolution`.

No code, test, or UAT files were involved in this conflict.
