---
uid: report-012b2e49
id: REPORT-7570
type: report
title: 'Report: mode_override for story-e674c60a'
created_by: xgd
created_at: '2026-11-01T11:16:10.883670+00:00'
updated_at: '2026-11-01T11:16:10.883670+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: story-e674c60a
  anchor_ticket: bundle-94dbe947
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-e5febd9c
  quality_mode: reconcile
  justification: 'AC-960 forbids the active component scope literal anywhere outside
    its one declaration, prose included; tools/generate/src/cli/ai/ledger-core.ts:17
    writes it in a JSDoc, and the reference rewords exactly that comment to drop it.
    Comment-only edit, no runtime effect. The builder-requested app.js change is NOT
    granted: rung 2 shows the reference does not keep the pane on a generic listing
    failure.'
  files:
  - tools/generate/src/cli/ai/ledger-core.ts
  rung: 2
  tip_evidence:
  - file: tools/generate/src/cli/ai/ledger-core.ts
    lines: 17-18
  external_cause: null
  planner_trust_boundary: false
  granted_head: 6a28909362da4a7e9adfe4275239560ad022ed22
---

# Mode override granted: code_frozen

AC-960 forbids the active component scope literal anywhere outside its one declaration, prose included; tools/generate/src/cli/ai/ledger-core.ts:17 writes it in a JSDoc, and the reference rewords exactly that comment to drop it. Comment-only edit, no runtime effect. The builder-requested app.js change is NOT granted: rung 2 shows the reference does not keep the pane on a generic listing failure.

Planner instructions for the batch:

Fix all of the following in one pass. (1) AC960: the test and AC-960 are correct. Do NOT narrow either. Under the granted override, reword ONLY the JSDoc in tools/generate/src/cli/ai/ledger-core.ts lines 17-18 so it no longer writes the scope literal (the reference wording is: The shared `ai-ticketing` component already declares ...). Change no code token. Confirm test_UAT_AC960_ is green and that no other tracked file trips check (b), then run the dependency tests. (2) AC967: do NOT edit apps/control-app/src/builder/app.js. It is outside the override, and the reference keeps the pane only for a refused session (BUG-52, out of scope), not for a generic listing failure. Rewrite AC-967 (acceptance_criterion-92c52943) in place: remove the sentence that a failing listing leaves the pane showing what it had, and its verification sentence (make the listing fail and assert the pane still shows the previous site). Add a one-line note citing this fix_plan. Do NOT replace them with a claim that failure empties the pane; leave that behaviour unasserted. Delete only the failing-listing step in tests/reconciliation-builder-business-scope.test.ts (around lines 695-700) and keep every other assertion. Under the 2026-11-01 Reconciliation Decisions in story-e674c60a, add a correction: clause (c) misdescribed the code (both the tree app.js:700 and the reference map a non-session failure to an empty list) and has been withdrawn from AC-967. (3) AC964 and AC1400: the D1-backed admission gate is correct and the fixtures are stale. In tests/reconciliation-builder-workspace-origin.test.ts (workerEnv around lines 759-766) and tests/reconciliation-workspace-build-artifacts.test.ts (workerEnv around lines 87-93), replace the throwing DB proxy with a real local D1 from tests/support/local-d1.ts: applyLocalD1Schema, then seedIdentity for the email the minted Access token carries, so that identity is invited, entitled and has agreed. Do not hand-write SQL, a stub store or a second schema. Keep R2 (SITES) unreachable so that no route opening the site store remains a real failure mode. Correct the doc comments that say these routes touch no store: they touch D1 for admission only. In AC1400, re-point the TENANT_ID empty-string probe (around line 212) at a configured TENANT_ID for which the seeded store holds no account row, which is what AC-1400 means by a store that holds no account at all. Keep the assertions that an unadmitted caller is refused and that no artifact is ever served in place of a defined route. (4) AC975 shares a file with AC964, and in the quality run it failed at workspace-origin.test.ts:990. Run the whole test_scope together and confirm AC975 passes there. If it fails only alongside AC964, find and remove the state shared between the control-app front describe and the measured against a real browser describe. If a browser cannot launch, make the test fail loudly rather than warn-and-pass. The orphan entries clear once test_UAT_AC975_ and test_UAT_AC1400_ pass in the scoped run.
