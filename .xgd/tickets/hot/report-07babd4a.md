---
uid: report-07babd4a
id: REPORT-6909
type: report
title: 'Report: override_misjudged for bundle-5607a08d'
created_by: xgd
created_at: '2026-10-30T20:28:24.871032+00:00'
updated_at: '2026-10-30T20:28:24.871032+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: override_misjudged
  subject_uid: bundle-5607a08d
  anchor_uid: bundle-5607a08d
  review_kind: reconciliation_review
  by_rule:
    code_frozen: 2
  denied:
  - subject_uid: story-58b2cec4
    batch_index: '0'
    rule: code_frozen
---

override_misjudged: the review judged a planner-granted mode override wrong. The fix step works from the finding below.

- rule `code_frozen`, override report report-be7d1be4 (files: ['tools/generate/src/cli/ai/host-core.ts', 'tools/generate/src/cli/ai/fidelity-core.ts', 'apps/control-app/src/ai.ts', 'apps/control-app/src/router.ts', 'apps/control-app/src/shot.ts']): item 5 (trust boundary): marking on the screenshot path is preserved at HEAD only by an ungranted fidelity-core.ts edit in 0a0f97f216 (fix_reconciliation_review), made after code_frozen was denied for this batch (report-1312a88f) and not present at the reference state; the trust-boundary preservation therefore has no audited grant
  Rule `code_frozen` is now denied for batch 0 of story-58b2cec4; it will not be granted again there, so the next plan decides that batch at the next rung.

Misjudged overrides by rule: {'code_frozen': 2}.