---
uid: report-106a03e7
id: REPORT-3531
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T21:59:11.208616+00:00'
updated_at: '2026-09-09T21:59:11.208616+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `package.json` — UU, config/scalar conflict (2g + the enrichment's
  "take the more recent commit by timestamp" rule). Sole conflicting
  hunk was the `version` scalar:
    - HEAD: `0.2.20`, from `510d408238` *[FREE-CODED] REQ-162 — version 0.2.20*, 2026-08-31 14:41 -0700
    - Incoming: `0.2.3`, from `27e08d3891` *Merge branch 'free-REQ-151' into xgd-working*, 2026-08-21 13:30 -0700
  Kept HEAD's `0.2.20`. It is both the later commit by timestamp and the
  higher point on the same monotone version line. No other hunk in the
  file was in conflict; the rest of `package.json` is untouched.

## Incoming changes preserved

The incoming commit `27e08d3891` is a merge whose entire diff against its
first parent is one line:

```
-  "version": "0.2.2",
+  "version": "0.2.3",
```

Verified via `git show 27e08d3891 -m --first-parent -- package.json` and by
reading both parents (`0952a9b71f` = 0.2.2, `38e4a3cf22` = 0.2.3). It carries
no code, test, config, or ticket changes — it is a version-bookkeeping bump
only.

That bump's effect is superseded, not discarded: HEAD already sits at
`0.2.20`, a later bump on the same version line, so `0.2.3` is behind it. No
developer-authored code from the incoming side exists to be lost, and STEP 3's
guard does not fire.

No BUG-1301 precedence exception was invoked; no test function was deleted;
no ticket files were touched.

Note for the finalize step: this resolution nets to no diff vs HEAD (HEAD's
version line is unchanged and it was the only conflicting content). Per
STEP 4 this is expected for a redundant version-bump commit and is not a
failure — `--skip` was not called here; the staged-diff check in
`cherry_pick_finalize_resolution` owns that decision. CHERRY_PICK_HEAD was
left intact.
