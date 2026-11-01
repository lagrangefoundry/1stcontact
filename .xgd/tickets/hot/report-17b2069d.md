---
uid: report-17b2069d
id: REPORT-7568
type: report
title: 'Report: fix_plan for story-e674c60a'
created_by: xgd
created_at: '2026-11-01T11:07:00.062467+00:00'
updated_at: '2026-11-01T11:07:00.062467+00:00'
completed_at: null
last_field_updated: created_at
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
    - story-e674c60a — site, toolbar and memory follow the business test_UAT_AC967_displayed_site_is_one_the_selected_business_holds_and_follows_a_switch
    - story-e674c60a control-app front test_UAT_AC964_the_admitted_split_holds_with_a_real_access_token
    - story-e674c60a measured against a real browser test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls
    - story-e674c60a — the workspace serves what the build wrote test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate
    dependency_tests: []
    hypothesis: AC-967 asserts a keep-the-pane-on-failed-listing behaviour that neither
      the frozen tree (app.js:700 .catch(() => [])) nor the reference (app.js:2588-2594,
      only a refused session keeps the pane) has; AC964 and AC1400 hand the Worker
      a DB proxy that throws, while admit() now reads users/memberships/entitlements
      from D1 before any route runs, so every call is 503.
    instructions: 'This batch must not change any production file. Do these three
      things. (1) AC-967 (acceptance_criterion-92c52943), under the aligned_to_tip
      ruling. Rewrite it in place. Delete the sentence ''A site listing that fails
      to answer leaves the pane showing what it had rather than an empty pane.'' and
      the verification sentence ''Make the listing fail and assert the pane still
      shows the previous site.'' Add a one-line note pointing at this fix_plan ruling.
      Do NOT replace them with a claim that a failure empties the pane; the behaviour
      stays unasserted. Delete the failing-listing step in tests/reconciliation-builder-business-scope.test.ts
      (around lines 695-700) and keep every other assertion in the test. Under story-e674c60a''s
      2026-11-01 Reconciliation Decisions, add a correction: clause (c) was a false
      description of the code. Both the frozen tree (app.js:700) and the reference
      turn a non-session listing failure into an empty list, the code comment at app.js:698-699
      is wrong as well, and the clause has been withdrawn from AC-967. (2) AC964 and
      AC1400: the D1-backed admission gate is correct; the fixtures are stale. In
      tests/reconciliation-builder-workspace-origin.test.ts (workerEnv, ~759-766)
      and tests/reconciliation-workspace-build-artifacts.test.ts (workerEnv, ~87-93),
      replace the throwing DB proxy with a real local D1. Build it from the shared
      tests/support/local-d1.ts: run applyLocalD1Schema, then seedIdentity for the
      email the minted Access token carries, so the identity is invited, entitled
      and has agreed. Do not hand-write SQL, a stub store or a second schema. Keep
      R2 (SITES) unreachable, so ''no route opens the site store'' is still something
      the test can fail on. Correct the doc comments that say these routes touch no
      store: they touch D1 for admission only. In AC1400, point the TENANT_ID=''''
      probe (build-artifacts.test.ts ~212) at a configured TENANT_ID that the seeded
      store holds no account row for. That is AC-1400''s own wording, ''a store that
      holds no account at all''; the gate needs a configured account to admit anyone,
      so the empty-tenant probe asserts something the AC never asked for. Keep the
      assertions that an unadmitted caller is refused and that no artifact is ever
      served in place of a defined route. (3) AC975 shares a file with AC964 and passed
      on the last builder''s machine. Run this batch''s whole test_scope together
      (not just AC975 alone) and confirm AC975 passes there. If it fails only there,
      find the shared state between the ''control-app front'' describe and the ''measured
      against a real browser'' describe and remove it. The two orphan entries clear
      once the tests carrying test_UAT_AC975_ and test_UAT_AC1400_ pass in the scoped
      run. Confirm both AC tokens appear in passing results.'
    test_scope: test_UAT_AC967_ or test_UAT_AC964_ or test_UAT_AC975_ or test_UAT_AC1400_
    ladder:
      rung1: REQ-179/REQ-180, the intents in scope, say nothing about a failed listing
        (the story records clause (c) as 'behaviour the intent is silent on'), and
        nothing in scope conflicts with AC-964, AC-975 or AC-1400.
      rung2: 'Decided AC967: the reference''s app.js:2588-2594 turns any non-session
        listing failure into [] and moves the pane to list[0] ?? null, so the keep-the-pane
        clause does not hold; the reference index.ts:561 admits through D1, as the
        tree does.'
      rung3: AC964, AC975 and AC1400 stand as written; only their fixtures, which
        assume a store-free gate, change.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: aligned_to_tip
      reason: The builder asked to change app.js so a failed listing keeps the pane,
        relying on AC-967 and the story's Reconciliation Decision (c). That decision
        describes the code; it is not an intent. It is listed under behaviour REQ-179/REQ-180
        leave open, 'formalised as the code does it', and the code does not do it.
        The reference also turns a generic listing failure into [] (app.js:2588-2590)
        and keeps the pane only for a refused session (BUG-52, out of this story's
        scope). No intent in scope requires keeping the pane, so the clause is retired
        rather than the frozen code changed.
      acs:
      - AC-967
      tests:
      - story-e674c60a — site, toolbar and memory follow the business test_UAT_AC967_displayed_site_is_one_the_selected_business_holds_and_follows_a_switch
      files:
      - tests/reconciliation-builder-business-scope.test.ts
      - tests/reconciliation-builder-workspace-origin.test.ts
      - tests/reconciliation-workspace-build-artifacts.test.ts
      - .xgd/tickets/hot/acceptance_criterion-92c52943.md
      - .xgd/tickets/hot/story-e674c60a.md
      tip_evidence:
      - file: apps/control-app/src/builder/app.js
        lines: 2588-2594
      intent:
        ticket: REQ-179
        sentence: A business has exactly one site in v1 ([[DOC-40]] §2.3), so the
          switcher yields both.
  - index: 1
    tests:
    - 'story-e674c60a component scope: one name, written once test_UAT_AC960_component_scope_is_written_in_exactly_one_place'
    dependency_tests:
    - test_UAT_AC1792_
    - test_UAT_AC2110_
    - test_UAT_AC2111_
    - test_UAT_FC_REQ-171_
    hypothesis: The JSDoc at tools/generate/src/cli/ai/ledger-core.ts:17 writes the
      active component scope literal (`@lagrangefoundry/ai-ticketing`), which AC-960
      forbids anywhere outside its one declaration, prose included; the reference
      has reworded that comment.
    instructions: 'AC-960 and check (b) in tests/bug32-webui-scope-rebrand.test.ts
      are correct as written. Do NOT narrow the test or AC-960 to excuse other packages
      under the same scope: the AC forbids the scope literal everywhere outside its
      declaration, comments included. Fix the one offending file. Reword the JSDoc
      in tools/generate/src/cli/ai/ledger-core.ts (lines 17-18) so it names the shared
      ticketing component without writing the scope literal; the reference uses the
      wording ''the shared `ai-ticketing` component''. Change the comment only; do
      not alter any code token. Run test_UAT_AC960_ to confirm it is green and no
      other tracked file trips check (b). Run the dependency tests to confirm the
      file still compiles and behaves the same.'
    test_scope: test_UAT_AC960_ or test_UAT_AC1792_ or test_UAT_AC2110_ or test_UAT_AC2111_
      or test_UAT_FC_REQ-171_
    ladder:
      rung1: No intent in scope speaks to this comment; AC-960's 'including prose
        such as comments' is the operative constraint.
      rung2: 'Decided: the reference''s ledger-core.ts:17-18 reads ''The shared `ai-ticketing`
        component already declares…'' and no longer writes the scope literal, so the
        comment changes and the test is right.'
      rung3: The AC960 test stands unchanged.
    override:
      rule: code_frozen
      rung: 2
      justification: AC-960 forbids the active component scope literal anywhere outside
        tools/generate/src/cli/webui.ts, comments included. ledger-core.ts:17 writes
        it in a JSDoc, and the reference rewords that same comment to drop the literal.
        The edit is a comment only, with no runtime effect.
      files:
      - tools/generate/src/cli/ai/ledger-core.ts
      tip_evidence:
      - file: tools/generate/src/cli/ai/ledger-core.ts
        lines: 17-18
      trust_boundary: false
---

# Fix Plan — Iteration 2

## Hypothesis
Three things went wrong. AC-967 asserts that the pane is kept on a failed listing, but neither the code-frozen tree nor the reference does that. AC964 and AC1400 still use a store-free fixture, but the gate now admits through D1. AC960 is caught by one production comment that writes the active component scope (`@lagrangefoundry`), and the reference has already reworded that comment.

## Analysis
Iteration 1's plan was mechanical, with empty instructions. Its builder (report-555646dd) changed nothing and filed `blocked_by: code_frozen` for AC967. This plan rules on that request and on each failure.

- **AC967 (blocked_by code_frozen). Ruling: aligned_to_tip.** In the working tree, `apps/control-app/src/builder/app.js:700` does `loadSitesFor(...).catch(() => [])`. An empty list then empties the pane. The reference (`reconcile-src-BUNDLE-35:apps/control-app/src/builder/app.js:2588-2594`) changes only one case: a *refused session* keeps the pane (`isSessionEnded(error) ? null : []`, which is BUG-52 and not in this story's scope). Any other listing failure still becomes `[]` and moves the pane to `list[0] ?? null`. The reference's own BUG-52 comment (2581-2584) says that an empty list is what empties the pane.
  - Rung 1: the intents in scope (REQ-179, REQ-180) say nothing about a failed listing. The story's own Reconciliation Decisions place clause (c) under "behaviour the intent is silent on… formalised as the code does it".
  - Clause (c) is a false claim about the code, from an earlier reconciliation decision. It is not an intent, so it has no weight on the ladder.
  - Rung 2 decides: a generic failure does not keep the pane.
  - The AC's "a site listing that fails to answer leaves the pane showing what it had" and its last verification sentence are retired (narrowed in place). The story's decision (c) gets a correction.
  - The builder's worry about "writing a bug into the spec" is respected. The rewrite **removes** the claim and does not pin "a failure empties the pane". The `.catch(() => [])` behaviour stays unasserted, so a later fix can change it freely.
- **AC964 and AC1400 (rung 3, fixture drift).** Both tests build a Worker env whose `DB` proxy throws when touched (`tests/reconciliation-builder-workspace-origin.test.ts:759-766` and `tests/reconciliation-workspace-build-artifacts.test.ts:87-93`). Admission (`apps/control-app/src/index.ts:266`, `admit(env, …)`, and the same at the reference index.ts:561) now looks the verified email up in D1 `users`/`memberships`/`entitlements` before any route runs, so every call answers 503. The code is right, and both the tests' premise ("these routes never open a store") and their fixture are stale.
  - The shared harness already exists: `tests/support/local-d1.ts` (`applyLocalD1Schema`, `seedIdentity`), used by `tests/req115-builder-shell.test.ts`.
  - AC1400's `TENANT_ID: ''` probe (`build-artifacts.test.ts:212`) can never pass the gate, because admission requires a configured account. AC-1400's own wording is "an artifact request must succeed against a store that **holds no account at all**". That means a configured account with no row in the store, not an unconfigured one. The test drifted, not the AC, so no AC change is needed.
- **AC960 (code_frozen override, rung 2).** Check (b) of `tests/bug32-webui-scope-rebrand.test.ts` finds the active scope literal in a JSDoc comment at `tools/generate/src/cli/ai/ledger-core.ts:17`. AC-960 explicitly forbids the scope literal anywhere outside its one declaration, "including prose such as comments".
  - The reference rewords exactly that comment (`reconcile-src-BUNDLE-35:tools/generate/src/cli/ai/ledger-core.ts:17-18`: "The shared `ai-ticketing` component already declares…"), so rung 2 says the test is right and the comment is wrong.
  - The builder's suggestion to narrow the test and AC-960 would contradict both the AC and the reference, so it is not taken.
  - The change is a comment only, with no runtime effect.
- **AC975 plus the two orphaned ACs.** AC975 passed on the builder's machine. The quality run gave no structured details (JUnit XML missing). AC975 lives in the same file and module setup as AC964 (`reconciliation-builder-workspace-origin.test.ts`), so it stays in batch 0.
  - The orphaned AC-975 and AC-1400 entries most likely mean that no passing test result was recorded for them in the scoped run, not that the links are missing: test names carry the right AC tokens.
  - There is not yet enough history to call AC975 flaky or contaminated, so a fix attempt comes first.
- **Isolation:** there is only one quality report so far, so there is no isolated-versus-full pattern to read yet.

## Spec Changes Made
None by the planner. Batch 0 narrows AC-967 under the aligned_to_tip ruling (the builder edits it in place with a one-line note pointing at the ruling) and adds a correction to story-e674c60a's 2026-11-01 Reconciliation Decision (c).

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-builder-workspace-origin.test.ts::test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls — weak-observation — When playwright or chromium is missing, the test logs `console.warn` and returns green (lines 972-986). AC-975 requires that it "report loudly rather than skip silently". Make those paths fail, or use the same `unverified()` helper as the no-components path.
- tests/reconciliation-builder-workspace-origin.test.ts::test_UAT_AC964_the_admitted_split_holds_with_a_real_access_token — infra-reuse-gap — Build the env from `tests/support/local-d1.ts` rather than writing a second env builder.
- apps/control-app/src/builder/app.js:698-699 (production, frozen) — the comment "the pane keeps what it had" contradicts the `.catch(() => [])` beneath it. Record it in the story decision correction; do not edit it in this story.

## Batches
- **Batch 0 (tests, ACs and story only):** AC967, AC964, AC975, AC1400 and the two orphan entries. AC964 and AC975 share a test file. AC964 and AC1400 share one root cause (the fixture is store-free but the gate admits through D1). AC967 carries the aligned_to_tip ruling, which forbids any production edit in its batch.
- **Batch 1 (one production comment, under override):** AC960 only. Its files do not overlap batch 0's at all (`tests/bug32-webui-scope-rebrand.test.ts` and `ledger-core.ts`). It has to be a separate batch because an aligned_to_tip batch may not touch production files.

## Mode overrides (REQ-892)
- Batch 1: rule `code_frozen`, rung 2. File: `tools/generate/src/cli/ai/ledger-core.ts` (comment only). The reference rewords the JSDoc at lines 17-18 so it no longer writes the active component scope, and AC-960 forbids that literal in prose. Dependency tests: test_UAT_AC1792_, test_UAT_AC2110_, test_UAT_AC2111_, test_UAT_FC_REQ-171_.

## Resolution ladder (REQ-938)
- **Batch 0, decided at rung 2 for AC967:** REQ-179 and REQ-180 say nothing about a failed listing. The reference, app.js:2588-2594, turns a non-session failure into `[]` and moves the pane away. AC-967's keep-the-pane clause is retired.
- **Batch 0, decided at rung 3 for AC964, AC1400 and AC975:** no intent or reference behaviour conflicts with the ACs. The tests stand on their ACs, and their fixtures are rebuilt to match the D1-backed gate that both the tree and the reference run.
- **Batch 1, decided at rung 2:** the reference's ledger-core.ts:17-18 reworded the comment, so the test is right and the comment changes.
