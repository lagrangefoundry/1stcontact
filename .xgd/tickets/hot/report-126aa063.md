---
uid: report-126aa063
id: REPORT-3843
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T01:19:52.138393+00:00'
updated_at: '2026-09-11T01:19:52.138393+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `package.json` — UU (config/manifest scalar, rule 2g + version-scalar precedent). Kept `"version": "0.2.20"` (HEAD side); dropped the incoming `"version": "0.2.19"`.

Rationale: the incoming commit `81ebc997d4` (`Merge branch 'free-REQ-162' into xgd-working`, 2026-08-31 14:39:25 -0700) touches exactly one file and its entire effect is the scalar bump `0.2.18 -> 0.2.19`, carried by its second parent `2284bf4bbd` / `e0c632c535` (`[FREE-CODED] REQ-162 — version 0.2.19`). `git merge-base --is-ancestor e0c632c535 HEAD` confirms that bump is ALREADY an ancestor of HEAD. HEAD then advanced to `0.2.20` in `510d4082` (`[FREE-CODED] REQ-162 — version 0.2.20`, 2026-08-31 14:41:02 -0700) — the same REQ-162 developer work, two minutes later. Both sides are `free_coded`, so the later working-timeline position wins for this fact; the enrichment's "more recent commit by timestamp" rule points the same way.

## Incoming changes preserved

- `package.json`: the incoming commit's only change (`version` 0.2.18 -> 0.2.19) is present in HEAD via a different route — its own second parent is an ancestor of HEAD — and has since been superseded by the developer's own 0.2.20 bump. Nothing was discarded: this is STEP 3's "present via a different route (redundant)" case, not the "genuinely absent (discarded)" case. No code hunks existed on either side.

No BUG-1301 precedence drops were needed. No test files were involved.

Note for the operator: the staged tree nets to zero diff vs HEAD, since the incoming commit's effect was already integrated and superseded. Per STEP 4 the resolution was staged as normal and `--skip` was NOT invoked; the finalize step is expected to detect the clean staged diff and skip the commit.
