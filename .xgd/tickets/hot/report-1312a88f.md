---
uid: report-1312a88f
id: REPORT-6903
type: report
title: 'Report: override_misjudged for bundle-5607a08d'
created_by: xgd
created_at: '2026-10-30T19:56:25.081529+00:00'
updated_at: '2026-10-30T19:56:25.081529+00:00'
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

- rule `code_frozen`, override report report-be7d1be4 (files: ['tools/generate/src/cli/ai/host-core.ts', 'tools/generate/src/cli/ai/fidelity-core.ts', 'apps/control-app/src/ai.ts', 'apps/control-app/src/router.ts', 'apps/control-app/src/shot.ts']): item 5 (trust boundary): trust boundary change without a test — contentBlocksFrom (fidelity-core.ts, applied in host-core.ts box.run wrapper) slices the JSON array out of the Toolbox's rendered text and returns it, discarding the untrusted-content frame the Toolbox wraps around every `provenance: untrusted` result (fidelity-surface.json:186 screenshot). Marking is therefore NOT preserved on the screenshot path to the model, and no test asserts marking on that path (only the manual-wide 'untrusted' mention, looking-surface.test.ts:387). The report also lacks computed trust_boundary_touched / files_touched / conformance_verdict fields although planner_trust_boundary is true.
  Rule `code_frozen` is now denied for batch 0 of story-58b2cec4; it will not be granted again there, so the next plan decides that batch at the next rung.

Misjudged overrides by rule: {'code_frozen': 2}.