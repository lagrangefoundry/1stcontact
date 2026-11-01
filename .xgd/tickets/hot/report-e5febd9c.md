---
uid: report-e5febd9c
id: REPORT-7569
type: report
title: 'Report: fix_plan for story-e674c60a'
created_by: xgd
created_at: '2026-11-01T11:13:58.469011+00:00'
updated_at: '2026-11-01T11:49:35.064387+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-e674c60a
  fix_iteration: 2
  items:
  - index: 0
    tests:
    - AC-975 (orphaned acceptance criterion)
    - AC-1400 (orphaned acceptance criterion)
    - 'story-e674c60a component scope: one name, written once test_UAT_AC960_component_scope_is_written_in_exactly_one_place'
    - story-e674c60a — site, toolbar and memory follow the business test_UAT_AC967_displayed_site_is_one_the_selected_business_holds_and_follows_a_switch
    - story-e674c60a control-app front test_UAT_AC964_the_admitted_split_holds_with_a_real_access_token
    - story-e674c60a measured against a real browser test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls
    - story-e674c60a — the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate
    dependency_tests:
    - test_UAT_AC1792_
    - test_UAT_AC2110_
    - test_UAT_AC2111_
    - test_UAT_FC_REQ-171_
    hypothesis: 'Three disjoint faults: AC-967 asserts a keep-the-pane-on-failed-listing
      behaviour that neither tree (app.js:700) nor reference (app.js:2588-2593) has;
      AC964/AC1400 fixtures hand the Worker a throwing DB while admit() now reads
      D1 before any route (503); ledger-core.ts:17 JSDoc writes the component scope
      literal that AC-960 forbids and the reference rewords.'
    instructions: 'Fix all of the following in one pass. (1) AC960: the test and AC-960
      are correct. Do NOT narrow either. Under the granted override, reword ONLY the
      JSDoc in tools/generate/src/cli/ai/ledger-core.ts lines 17-18 so it no longer
      writes the scope literal (the reference wording is: The shared `ai-ticketing`
      component already declares ...). Change no code token. Confirm test_UAT_AC960_
      is green and that no other tracked file trips check (b), then run the dependency
      tests. (2) AC967: do NOT edit apps/control-app/src/builder/app.js. It is outside
      the override, and the reference keeps the pane only for a refused session (BUG-52,
      out of scope), not for a generic listing failure. Rewrite AC-967 (acceptance_criterion-92c52943)
      in place: remove the sentence that a failing listing leaves the pane showing
      what it had, and its verification sentence (make the listing fail and assert
      the pane still shows the previous site). Add a one-line note citing this fix_plan.
      Do NOT replace them with a claim that failure empties the pane; leave that behaviour
      unasserted. Delete only the failing-listing step in tests/reconciliation-builder-business-scope.test.ts
      (around lines 695-700) and keep every other assertion. Under the 2026-11-01
      Reconciliation Decisions in story-e674c60a, add a correction: clause (c) misdescribed
      the code (both the tree app.js:700 and the reference map a non-session failure
      to an empty list) and has been withdrawn from AC-967. (3) AC964 and AC1400:
      the D1-backed admission gate is correct and the fixtures are stale. In tests/reconciliation-builder-workspace-origin.test.ts
      (workerEnv around lines 759-766) and tests/reconciliation-workspace-build-artifacts.test.ts
      (workerEnv around lines 87-93), replace the throwing DB proxy with a real local
      D1 from tests/support/local-d1.ts: applyLocalD1Schema, then seedIdentity for
      the email the minted Access token carries, so that identity is invited, entitled
      and has agreed. Do not hand-write SQL, a stub store or a second schema. Keep
      R2 (SITES) unreachable so that no route opening the site store remains a real
      failure mode. Correct the doc comments that say these routes touch no store:
      they touch D1 for admission only. In AC1400, re-point the TENANT_ID empty-string
      probe (around line 212) at a configured TENANT_ID for which the seeded store
      holds no account row, which is what AC-1400 means by a store that holds no account
      at all. Keep the assertions that an unadmitted caller is refused and that no
      artifact is ever served in place of a defined route. (4) AC975 shares a file
      with AC964, and in the quality run it failed at workspace-origin.test.ts:990.
      Run the whole test_scope together and confirm AC975 passes there. If it fails
      only alongside AC964, find and remove the state shared between the control-app
      front describe and the measured against a real browser describe. If a browser
      cannot launch, make the test fail loudly rather than warn-and-pass. The orphan
      entries clear once test_UAT_AC975_ and test_UAT_AC1400_ pass in the scoped run.'
    test_scope: test_UAT_AC960_ or test_UAT_AC967_ or test_UAT_AC964_ or test_UAT_AC975_
      or test_UAT_AC1400_ or test_UAT_AC1792_ or test_UAT_AC2110_ or test_UAT_AC2111_
      or test_UAT_FC_REQ-171_
    ladder:
      rung1: REQ-179/REQ-180 (the intents in scope) are silent on a failed listing
        and on the comment wording; story decision (c) is a description of code, not
        an intent, and nothing in scope conflicts with AC-960, AC-964, AC-975 or AC-1400.
      rung2: 'Decided AC960 and AC967: reference ledger-core.ts:17-18 drops the scope
        literal, so the comment changes; reference app.js:2588-2593 maps any non-session
        listing failure to [] and moves the pane, so AC-967 keep-the-pane clause is
        withdrawn and app.js stays frozen.'
      rung3: AC964, AC975 and AC1400 tests stand on their ACs; only their store-free
        fixtures change to match the D1-backed gate that both tree and reference run.
    override:
      rule: code_frozen
      rung: 2
      justification: 'AC-960 forbids the active component scope literal anywhere outside
        its one declaration, prose included; tools/generate/src/cli/ai/ledger-core.ts:17
        writes it in a JSDoc, and the reference rewords exactly that comment to drop
        it. Comment-only edit, no runtime effect. The builder-requested app.js change
        is NOT granted: rung 2 shows the reference does not keep the pane on a generic
        listing failure.'
      files:
      - tools/generate/src/cli/ai/ledger-core.ts
      tip_evidence:
      - file: tools/generate/src/cli/ai/ledger-core.ts
        lines: 17-18
      trust_boundary: false
  batches_pending: false
---

# Fix Plan — Iteration 2 (re-plan after validator refusal)

## Hypothesis
There are three separate faults. AC-967 asserts a keep-the-pane-on-failed-listing behaviour that neither the frozen tree nor the reference has. The AC964 and AC1400 fixtures hand the Worker a throwing DB, but the gate now admits through D1. And one production JSDoc writes the component scope literal, which AC-960 forbids and the reference has already reworded.

## Analysis
The previous iteration-2 plan (REPORT-7568, report-17b2069d) was refused because it ruled on the builder's `code_frozen` request two ways: `aligned_to_tip` on batch 0 and an override grant on batch 1. Its diagnosis still holds and I re-verified it at `reconcile-src-BUNDLE-35`. This plan keeps the diagnosis and makes one ruling: a **grant** of `code_frozen`, limited to the one file the ladder says must change. Everything is in one batch.

- **AC960 (grant, rung 2).** The tree's `tools/generate/src/cli/ai/ledger-core.ts:17` reads `` `@lagrangefoundry/ai-ticketing` already declares… ``. The reference's lines 17-18 read "The shared `ai-ticketing` component already declares…".
  - AC-960 forbids the scope literal outside its single declaration, "including prose such as comments".
  - Test check (b) in `tests/bug32-webui-scope-rebrand.test.ts` is right, and the comment is wrong.
  - The builder (REPORT-7566) proposed narrowing AC-960 and the test instead. That would contradict both the AC and the reference, so it is declined in substance. The comment changes, and no code token changes.
- **AC967 (no production change; reconcile-mode AC and test edit).** The builder's requested change was to make `app.js` `selectBusiness` keep the pane on a failed listing. The ladder does not support it:
  - Tree: `apps/control-app/src/builder/app.js:700` does `.catch(() => [])`.
  - Reference: `apps/control-app/src/builder/app.js:2588-2593` does `isSessionEnded(error) ? null : []`. Only a refused session keeps the pane, which is BUG-52 and outside this story. Any other failure still yields `[]`, and the pane moves to `list[0] ?? null`.
  - REQ-179 and REQ-180 (the intents in scope) say nothing about a failed listing.
  - The keep-the-pane clause comes from story-e674c60a's own 2026-11-01 Reconciliation Decision (c), which claimed to describe the code and does not. That decision carries no intent weight.
  - So `app.js` is **not** in the grant. AC-967's keep-the-pane clause is withdrawn as an ordinary reconciliation edit (code is authoritative), without writing the opposite claim into the spec.
- **AC964 and AC1400 (rung 3, stale fixtures).** `admit()` reads users, memberships and entitlements from D1 before any route runs: tree `apps/control-app/src/index.ts:266`, reference `index.ts:561`. Both tests pass a DB proxy that throws on any access, so every call answers 503: `tests/reconciliation-builder-workspace-origin.test.ts` workerEnv around lines 759-766, and `tests/reconciliation-workspace-build-artifacts.test.ts` workerEnv around lines 87-93 (assertion at 197).
  - The shared harness `tests/support/local-d1.ts` (`applyLocalD1Schema`, `seedIdentity`) already exists.
  - AC1400's `TENANT_ID: ''` probe (around line 212) can never be admitted. AC-1400's own wording, "a store that holds no account at all", means a configured account with no row. The test drifted; the AC is fine.
- **AC975 and the two orphaned ACs.** AC975 passed on the builder's machine. In the quality run it failed in the same file as AC964 (stack at workspace-origin.test.ts:990), with no JUnit details. There is only one quality report, so there is not enough history to call it flaky or contaminated. It stays in the batch for a fix attempt. The orphan entries for AC-975 and AC-1400 mean "no passing test in scope". They clear when those tests pass.

## Spec Changes Made
None by the planner. The batch builder rewrites AC-967 (acceptance_criterion-92c52943) in place. It removes the failed-listing sentence and its verification sentence, adds a one-line note pointing at this plan, and adds a correction to story-e674c60a's Reconciliation Decision (c).

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-builder-workspace-origin.test.ts::test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls — weak-observation — When Playwright or Chromium is missing, the test warns and returns green (around lines 972-986), but AC-975 requires it to "report loudly". Make those paths fail the same way the existing `unverified()` path does.
- tests/reconciliation-builder-workspace-origin.test.ts::test_UAT_AC964_the_admitted_split_holds_with_a_real_access_token — infra-reuse-gap — Build the env from tests/support/local-d1.ts rather than a bespoke env builder.
- apps/control-app/src/builder/app.js:698-699 (frozen) — the comment "the pane keeps what it had" contradicts the code beneath it. Record this in the story correction only; do not edit it in this story.

## Batches
- **Batch 0 (the only batch):** AC960, AC967, AC964, AC975, AC1400 and the two orphan entries.
  - One batch because only one ruling on `code_frozen` is allowed, and that ruling's override has to sit on the batch carrying the blocked test (AC967).
  - The override lists exactly one file, `tools/generate/src/cli/ai/ledger-core.ts`, and permits a comment-only edit.
  - Every other edit is to tests, ACs or the story, which reconcile mode already permits.

## Mode overrides (REQ-892)
- Batch 0: rule `code_frozen`, rung 2, files `tools/generate/src/cli/ai/ledger-core.ts` (JSDoc at lines 17-18 only).
  - Justification: AC-960 forbids the scope literal in prose outside its declaration, and the reference rewords exactly this comment.
  - Not covered: `apps/control-app/src/builder/app.js`, which the builder asked to change. The ladder (rung 2) shows the reference does not keep the pane on a generic listing failure.
  - Dependency tests: test_UAT_AC1792_, test_UAT_AC2110_, test_UAT_AC2111_, test_UAT_FC_REQ-171_.

## Resolution ladder (REQ-938)
- **AC960, rung 2:** the reference ledger-core.ts:17-18 drops the literal, so the test stands and the comment changes.
- **AC967, rung 2:**
  - The reference app.js:2588-2593 maps any non-session listing failure to `[]` and moves the pane.
  - REQ-179 and REQ-180 are silent on a failed listing.
  - The AC's keep-the-pane clause is withdrawn, and the frozen code stays.
- **AC964, AC1400 and AC975, rung 3:** no intent or reference behaviour conflicts with these ACs. The tests stand, and only their store-free fixtures change to match the D1-backed gate that both the tree and the reference run.