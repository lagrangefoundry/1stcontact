---
uid: report-e1298f76
id: REPORT-6913
type: report
title: 'Report: override_misjudged for bundle-5607a08d'
created_by: xgd
created_at: '2026-10-30T20:41:27.346907+00:00'
updated_at: '2026-10-30T20:41:27.346907+00:00'
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

- rule `code_frozen`, override report report-be7d1be4 (files: ['tools/generate/src/cli/ai/host-core.ts', 'tools/generate/src/cli/ai/fidelity-core.ts', 'apps/control-app/src/ai.ts', 'apps/control-app/src/router.ts', 'apps/control-app/src/shot.ts']): item 5 (trust boundary): the granted diff 13aa65737c (fidelity-core.ts contentBlocksFrom + host-core.ts box.run wrapper) returns the block array carved out of the Toolbox's rendering and drops the <<<untrusted>>> frame on every screenshot/picture result; at HEAD (production code identical to 13aa65737c since 53d17b5ccd reverted 0a0f97f216) marking is not preserved on that path, and the only test on it (AC-2067) asserts the frame's ABSENCE. Recording the gap as BUG-316 does not satisfy item 5.
  Rule `code_frozen` is now denied for batch 0 of story-58b2cec4; it will not be granted again there, so the next plan decides that batch at the next rung.

Misjudged overrides by rule: {'code_frozen': 2}.