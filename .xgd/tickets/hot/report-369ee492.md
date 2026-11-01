---
uid: report-369ee492
id: REPORT-7254
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-01T03:43:53.481794+00:00'
updated_at: '2026-11-01T03:43:53.481794+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: STORY-141
  mode_override_uid: report-8ad43fd3
  parent_report_uid: report-fddeb967
  batch_index: 0
  attempt: 1
  findings: []
---

# Override conformance

- Item 1 (named files): PASS. `unnamed_files_touched` is empty. The only production file changed is `apps/control-app/src/ai.ts`, which the override names. The edit to `tests/test_UAT_FC_REQ-173_describer_session.test.ts` is a test file, so it is outside the scope of `code_frozen` and cannot fail this item.
- Item 3 (intent/AC consistency): PASS. AC-2097 says the system instruction must be 'the fixed document-digest instruction and nothing else'. Replacing the ignored `system`/`source` keys with a single `priming: [new lib.Entry({ name: 'digest-system', text: DOCUMENT_DIGEST_SYSTEM })]` sends exactly that content, where before the system prompt was empty.
- Item 4 (planner scope): PASS. The `ai.ts` diff contains only the Role priming change and the doc-comment fix at ai.ts:123 that the planner asked for. There is no REQ-207 consolidation and no change to backend registration. The AC2097 test (`tests/reconciliation-material-description-digest.workers.test.ts`, `test_UAT_AC2097_...`) is unchanged, as the planner instructed.
- Item 5 (trust boundary): PASS. `trust_boundary_touched` is false and `trust_boundary_mismatch` is false.
- Item 6 (code_frozen, rung 2): PASS. The reference state `reconcile-src-BUNDLE-34:apps/control-app/src/ai.ts` lines 297-304 builds the role with `priming: [new lib.Entry({ name: 'digest-system', text: system })]` as its only entry. The diff matches that behaviour, adds no branches, error handling or API, and edits no production file the override does not name.

Not a finding, recorded for information: the batch also edited `test_UAT_FC_REQ_173_the_describer_is_primed_with_the_digest_prompt_and_nothing_else`. It added a local `systemText()` helper and changed `toContain` to an exact `toBe(DOCUMENT_DIGEST_SYSTEM)`. The production fix makes the library send the system prompt as content blocks, and on an array `toContain` checks whether one element equals the string, not whether the text appears. The change makes the assertion stricter, not looser, and matches AC-2097's 'only system content' wording. The planner's instructions did not mention this test. The reference-state version of the test also flattens with `systemText` (it imports the helper from `./support/scripted-model-client`), whereas this batch duplicates the helper locally. That is a hygiene point for later and does not affect conformance.
