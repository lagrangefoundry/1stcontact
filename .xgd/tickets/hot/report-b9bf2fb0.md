---
uid: report-b9bf2fb0
id: REPORT-527
type: report
title: 'Report: fix_plan for report-29765550'
created_by: xgd
created_at: '2026-07-13T21:20:31.047264+00:00'
updated_at: '2026-07-13T21:47:06.793606+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-29765550
  items:
  - index: 0
    tests:
    - test_UAT_AC575
    - test_UAT_AC576
    - test_UAT_AC577
    - test_UAT_AC578
    - test_UAT_AC579
    - test_UAT_AC580
    - test_UAT_AC581
    - test_UAT_AC582
    - test_UAT_AC583
    - test_UAT_AC584
    - test_UAT_AC585
    - test_UAT_AC586
    - test_UAT_AC587
    - test_UAT_AC588
    - test_UAT_AC589
    - test_UAT_AC590
    - test_UAT_AC591
    - test_UAT_AC592
    - test_UAT_AC593
    - test_UAT_AC594
    - test_UAT_AC595
    - test_UAT_AC596
    - test_UAT_AC597
    - test_UAT_AC598
    - test_UAT_AC599
    - test_UAT_AC600
    - test_UAT_AC601
    - test_UAT_AC602
    - test_UAT_AC603
    - test_UAT_AC604
    - test_UAT_AC605
    - test_UAT_AC606
    - test_UAT_AC607
    - test_UAT_AC608
    - test_UAT_AC609
    - test_UAT_AC610
    - test_UAT_AC611
    - test_UAT_AC612
    - test_UAT_AC613
    - test_UAT_AC614
    - test_UAT_AC615
    - test_UAT_AC616
    - test_UAT_AC617
    - test_UAT_AC618
    - test_UAT_AC619
    - test_UAT_AC620
    - test_UAT_AC621
    - test_UAT_AC622
    - test_UAT_AC623
    - test_UAT_AC624
    - test_UAT_AC625
    - test_UAT_AC626
    - test_UAT_AC627
    - test_UAT_AC628
    dependency_tests: []
    hypothesis: The shipped site document storage/sites/faelan/draft/site.json still
      declares retired pre-REQ-55 container-width token keys (narrow/default/wide)
      under theme.container, which the migrated code (CONTAINER_STEPS / CONTENT_WIDTH_DIAL
      / containerTokensSchema) no longer defines; AC-609 requires no shipped site
      document to reference retired width names.
    instructions: 'Stabilize mode — code is the source of truth. The regression report
      flagged 54 orphaned ACs (AC-575..AC-628) plus a failed javascript-vitest suite
      showing total=0. The total=0 is a REGRESSION-ENVIRONMENT ARTIFACT: the JS suite
      collected zero tests in the regression worktree (pnpm/node_modules hoisted-symlink
      glitch), so the AC-coverage gate marked every in-scope AC orphaned because no
      test passed to cover it. When the suite collects normally (node_modules present),
      53 of the 54 AC tests PASS and exactly ONE fails: test_UAT_AC609_retired_width_names_removed
      in tests/reconciliation-content-width-scale.test.ts. The genuine evidence gap
      is AC-609 only. The production code has fully migrated the content-width vocabulary
      to the Tailwind scale: packages/framework/src/modules/dials.ts CONTAINER_STEPS
      and CONTENT_WIDTH_DIAL, and packages/site-schema/src/schema.ts containerTokensSchema,
      all expose only ''bleed'' + sm..7xl with none of the retired names (xnarrow/narrow/readable/default/wide).
      The only thing still carrying retired names is the shipped, git-tracked site
      document storage/sites/faelan/draft/site.json, whose theme.container object
      still defines narrow:''40rem'', default:''72rem'', wide:''90rem'' (plus a valid
      bleed:''100%''). These retired container-token keys are DEAD DATA — no framework
      code reads theme.container overrides (the resolver uses CONTAINER_STEPS), and
      no faelan module references them as a contentWidth/rowWidth value (the module-scan
      half of the AC-609 test already passes). Align the stale site data to the shipped
      code so AC-609''s test observes real, migrated data: the faelan draft site document
      must not carry retired container-width token keys. Ensure the suite collects
      (node_modules present) so all 54 AC tests run; end this batch with test_UAT_AC609
      green and the other 53 AC tests still green. Do NOT weaken or edit the AC-609
      test — it correctly encodes REQ-55 intent. Nit while you are in schema.ts: the
      containerTokensSchema doc-comment (~line 722) still mentions ''default''/''readable''
      as canonical, though the schema object no longer defines them — a stale comment
      worth correcting, not gating.'
    test_scope: test_UAT_AC575 or test_UAT_AC576 or test_UAT_AC577 or test_UAT_AC578
      or test_UAT_AC579 or test_UAT_AC580 or test_UAT_AC581 or test_UAT_AC582 or test_UAT_AC583
      or test_UAT_AC584 or test_UAT_AC585 or test_UAT_AC586 or test_UAT_AC587 or test_UAT_AC588
      or test_UAT_AC589 or test_UAT_AC590 or test_UAT_AC591 or test_UAT_AC592 or test_UAT_AC593
      or test_UAT_AC594 or test_UAT_AC595 or test_UAT_AC596 or test_UAT_AC597 or test_UAT_AC598
      or test_UAT_AC599 or test_UAT_AC600 or test_UAT_AC601 or test_UAT_AC602 or test_UAT_AC603
      or test_UAT_AC604 or test_UAT_AC605 or test_UAT_AC606 or test_UAT_AC607 or test_UAT_AC608
      or test_UAT_AC609 or test_UAT_AC610 or test_UAT_AC611 or test_UAT_AC612 or test_UAT_AC613
      or test_UAT_AC614 or test_UAT_AC615 or test_UAT_AC616 or test_UAT_AC617 or test_UAT_AC618
      or test_UAT_AC619 or test_UAT_AC620 or test_UAT_AC621 or test_UAT_AC622 or test_UAT_AC623
      or test_UAT_AC624 or test_UAT_AC625 or test_UAT_AC626 or test_UAT_AC627 or test_UAT_AC628
  fix_iteration: 1
  batches_pending: false
---

# Fix Plan — Iteration 1

## Hypothesis
The shipped, git-tracked site document `storage/sites/faelan/draft/site.json` still declares retired pre-REQ-55 container-width token keys (`narrow`/`default`/`wide`) under `theme.container`, which the migrated production code no longer defines; AC-609 requires that no shipped site document reference retired width names. This is the only genuine failure — the reported "54 orphan ACs" is an artifact of the regression suite collecting zero tests.

## Analysis
**Reported symptom:** regression quality report report-01173ec0 (parent of the regression-anchor subject report-29765550) failed with 54 orphaned ACs (AC-575..AC-628) and a `javascript-vitest` suite showing `total: 0, exit_code: 1`.

**Root cause of the orphan count — environment artifact, not a test/code defect.** The AC-coverage gate (`xgd_source/quality/ac_coverage_gate.py`) builds its "covered" set from tests whose `status == "passed"`, then set-diffs the in-scope active ACs against it. In the regression worktree the JS suite collected **zero** tests (a pnpm hoisted-symlink / `node_modules` glitch — see the repair machinery in `xgd_source/quality/worktree_setup.py`), so the covered set was empty and *every* AC-575..628 was reported orphaned. This is not 54 independent failures; it is one collection failure fanned out.

**Reproduction in a normal environment (this worktree, node_modules present):** running the exact plugin filter `npx vitest run --reporter=verbose -t "test_UAT_AC575|…|test_UAT_FC_REQ_57" tests` collects the 54 AC tests and yields **53 passed, 1 failed**. All 54 `test_UAT_AC575..628` tests exist (0 missing); the 8 `test_UAT_FC_*` filter entries are ticket IDs with no JS test and match nothing (expected).

**The single genuine failure — AC-609.** `tests/reconciliation-content-width-scale.test.ts::test_UAT_AC609_retired_width_names_removed` asserts no shipped site document references a retired width name. It fails on:
`storage/sites/faelan/draft/site.json container.narrow: expected { narrow:'40rem', … } to not have property "narrow"`.
faelan's `theme.container` still holds `narrow:'40rem'`, `default:'72rem'`, `wide:'90rem'` (plus a valid `bleed:'100%'`).

**Code is already migrated (stabilize: code is truth).** `packages/framework/src/modules/dials.ts` `CONTAINER_STEPS` and `CONTENT_WIDTH_DIAL`, and `packages/site-schema/src/schema.ts` `containerTokensSchema`, all expose only `bleed` + `sm..7xl` — none of the retired names. The retired keys in faelan are **dead data**: no framework code reads `theme.container` overrides (the resolver uses `CONTAINER_STEPS`), and no faelan module references them as a `contentWidth`/`rowWidth` value (the module-scan half of the AC-609 test already passes). Removing them is safe and does not affect the 53 passing tests.

**Conflicts:** none. AC-609 does not contradict any other AC; it is the authoritative REQ-55 intent and the other 53 tests already agree with the migrated code.

**Isolation:** iteration 1, no prior history. The failure reproduces deterministically in a full-collection run, so it is not order-sensitive or flaky.

## Spec Changes Made
None. AC-609 correctly encodes shipped REQ-55 intent; no AC needed reconciling.

## Weak Evidence Flags (preventative — best effort)
`packages/site-schema/src/schema.ts:722` — stale-doc-comment — the `containerTokensSchema` doc-comment still calls `default`/`readable` canonical though the schema object no longer defines them; correct the comment when in the file (non-gating).

## Batches
**One batch (55 signatures collapse to a single evidence gap).** Every reported failure traces to one collection artifact plus one real failing test in one file (`reconciliation-content-width-scale.test.ts`) whose fix touches one data file (`storage/sites/faelan/draft/site.json`). There is no disjoint file set to split across, and splitting would only hide the shared cause. The batch's `tests` list carries all 54 AC test names so the builder keeps the 53 currently-green ones green while making AC-609 pass; `test_scope` is the OR of all 54 so the validation gate re-collects the whole set and confirms zero orphans remain.