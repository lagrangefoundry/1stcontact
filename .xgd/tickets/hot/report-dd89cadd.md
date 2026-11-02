---
uid: report-dd89cadd
id: REPORT-8042
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:40:07.319296+00:00'
updated_at: '2026-11-02T00:40:07.319296+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `package.json` — UU, config/manifest scalar conflict on `"version"` only (single hunk). Enrichment rule: intent unknown on one side → take the more recent commit by timestamp and flag for post-merge review. HEAD side (aacdc97d5a, "feat(people): a contact sits on two axes, and the pipeline starts at Lead [FREE-CODED]", 2026-11-01) is more recent than incoming 569160c406 ("Merge branch 'free-REQ-189' into xgd-working", 2026-09-05). Kept HEAD `"version": "0.2.81"`. **Flagged for post-merge review** per enrichment rule.

## Incoming changes preserved

- `package.json`: the incoming commit's only change to this file is a version bump `0.2.76 -> 0.2.77`. HEAD is already at `0.2.81`, which supersedes that bump (monotonic version line), so the incoming intent (advance the version) is already present; reverting to 0.2.77 would be a regression. No other hunks in the file. The resolution nets to no diff vs HEAD — the commit is redundant for this file, not discarded (left for finalize step to detect clean staged diff).

No BUG-1301 precedence drops.
