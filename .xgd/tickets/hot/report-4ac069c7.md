---
uid: report-4ac069c7
id: REPORT-7607
type: report
title: 'Report: fix_plan for report-71b1019e'
created_by: xgd
created_at: '2026-11-01T13:05:37.965435+00:00'
updated_at: '2026-11-01T13:05:37.965435+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-71b1019e
  fix_iteration: 3
  items:
  - index: 0
    tests:
    - AC-2104 (orphaned acceptance criterion)
    - AC-2105 (orphaned acceptance criterion)
    - AC-2106 (orphaned acceptance criterion)
    dependency_tests:
    - test_UAT_FC_BUG-48_
    hypothesis: AC-2104/2105/2106 are orphaned only because their proving UATs are
      named test_UAT_FC_BUG-48_* rather than test_UAT_AC<N>_*; code, ACs and tests
      already agree.
    instructions: 'No Bash is needed; do not attempt xgd or vitest commands — the
      validation gate runs the tests. Code, ACs and tests already agree; the only
      gap is the AC-token link. With the Write tool, create ONE new file tests/reconciliation-l1-reference-coverage.test.ts,
      following the convention of tests/reconciliation-1c-builder-env-layering.test.ts
      (AC-token UATs in a reconciliation file; the FC suite untouched). Read tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts
      first and reuse exactly its imports and fixtures (projectL1Vocabulary, l1VocabularyGaps
      from tools/generate/src/cli/kb-projection; L1_DOCUMENT_KEYS, L1_ENVELOPE, L1_STRUCTURAL_RULES,
      l1DocumentSchema, validateL1 and the dangling-font/asset helpers from packages/site-schema).
      Write three UATs, each deriving expectations from those declarations at run
      time with no hand-written lists. (1) test_UAT_AC2104_reference_documents_the_page_document_keys_and_the_shapes_they_reach:
      a ''## The page itself'' section exists before ''## The kinds of element'';
      every Object.keys(l1DocumentSchema.shape) key appears INSIDE that section as
      a field line; ''### font face'' occurs exactly once, carries `family` and `src`,
      and is not inside the page section. (2) test_UAT_AC2105_limits_section_states_every_structural_rule_in_the_validators_words:
      inside ''## The limits every page is held to'', every L1_ENVELOPE key is named
      and every L1_STRUCTURAL_RULES VALUE appears verbatim; provoke each rule the
      way the FC test does and assert a message contains that rule statement; also
      assert the legacy phrases ''duplicate node id'', ''not an allowed URL'' (javascript:
      image src) and ''not one of the document widths'' (keyframe at a width the document
      does not declare) — the last is asserted by no suite today (validate.ts:473).
      (3) test_UAT_AC2106_coverage_check_reports_every_unrendered_part_and_shipped_reference_has_none:
      l1VocabularyGaps() is [] on the shipped body; with the body cut before the limits
      heading the gaps name every envelope bound and structural rule and no element
      kind; with the body cut from ''## The kinds of element'' onward the gaps are
      exactly the document keys. Use the gap-string format the FC test already asserts.
      Do not edit production code, the ACs, or the existing FC test file.'
    test_scope: test_UAT_AC2104_ or test_UAT_AC2105_ or test_UAT_AC2106_ or test_UAT_FC_BUG-48_
    ladder:
      rung1: BUG-48 S4-S6 and C3/C4 demand exactly what AC-2104/2105/2106 state, and
        no later intent in scope touches REF-l1.
      rung2: 'Decided here: at reconcile-src-BUNDLE-35 the code implements every clause
        (packages/site-schema/src/l1/validate.ts:239 rule table, :473/:1481/:2169
        legacy phrases; tools/generate/src/cli/kb-projection.ts:822 l1VocabularyGaps(body));
        only the AC-token UAT link is missing.'
      rung3: The existing FC tests stand; new AC-token UATs add the link plus the
        uncovered keyframe-width phrase assertion.
---

# Fix Plan — Iteration 3 (re-filed)

## Hypothesis
AC-2104/2105/2106 are orphaned only because the UATs that prove them are named `test_UAT_FC_BUG-48_*`, not `test_UAT_AC<N>_*`. The behaviour, the ACs and the tests already agree; the only gap is the AC-token link.

## Analysis
- **Why this is a re-file.** The first iteration-3 plan (report-9cd31107) was refused by `validate_fix_plan` (`fix_plan_filter_rejected`, session log seq 16863). Its `dependency_tests` named two test FILE PATHS, which are not exact selectors under BUG-1530. The diagnosis in that plan was not disputed. This plan keeps the diagnosis and expresses the dependency tests as the `test_UAT_FC_BUG-48_` prefix.
- **Line citations corrected.** The earlier plan cited `validate.ts:106/181/651/1011` and `kb-projection.ts:1000`. At `reconcile-src-BUNDLE-35` the facts are:
  - `packages/site-schema/src/l1/validate.ts:239` declares `L1_STRUCTURAL_RULES`.
  - `:473` and `:574` give "not one of the document widths".
  - `:1481` gives the image-src "not an allowed URL".
  - `:2169` gives "duplicate node id '<id>'".
  - `tools/generate/src/cli/kb-projection.ts:822` declares `l1VocabularyGaps(body = projectL1Vocabulary().body)`.
- **Quality report-23d8ec61.** It ran 280 tests with 0 failed. The only failures are 3 orphaned ACs on BUG-48 S4–S6.
- **Iterations 1–2.** The builders (report-bd1621f7, report-b3516557) were stuck on an environment Bash denial. That is not a mode rule and not an XGD report-bug, so there is no blocked_by to rule on and BUG-1067 does not apply. This batch is completable with Read and Write alone.
- **Existing proof.** It is in `tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts`:
  - AC-2104 is proved by `every_document_key_appears_in_the_reference`, `the_keys_the_consultant_can_now_write_say_what_they_take` and `the_shapes_a_document_key_reaches_are_described_once`.
  - AC-2105 is proved by `every_structural_rule_is_stated_beside_the_numeric_bounds`, `the_refusals_that_are_not_numbers_are_projected_not_authored` and `every_stated_rule_is_one_the_validator_actually_refuses`. No suite asserts the "not one of the document widths" legacy phrase.
  - AC-2106 is proved by `the_reference_covers_everything_it_says_it_is_generated_from` and `the_coverage_check_has_teeth`.
- **Repo convention.** AC-token reconciliation UATs go in a new `tests/reconciliation-*.test.ts` file beside the untouched FC suite; see `tests/reconciliation-1c-builder-env-layering.test.ts`.
- **No conflicts and no isolation issues.** These are pure in-process projection and validation checks.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts::test_UAT_FC_BUG-48_the_refusals_that_are_not_numbers_are_projected_not_authored — weak-observation — /unique/, /palette/ and /column/ match anywhere in the limits section; assert the L1_STRUCTURAL_RULES statement strings instead.
- tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts::test_UAT_FC_BUG-48_every_document_key_appears_in_the_reference — weak-observation — checks the key anywhere in the body; scope the check to the '## The page itself' section.

## Batches
**Batch 0** covers AC-2104, AC-2105 and AC-2106. They share one surface (`projectL1Vocabulary`, `L1_STRUCTURAL_RULES`, `l1VocabularyGaps`), so they stay in one batch.
- **Change:** create one new file, `tests/reconciliation-l1-reference-coverage.test.ts`, with three AC-token UATs.
- **Not allowed:** production edits and AC edits.
- **Keep green:** the BUG-48 FC suites.

## Resolution ladder (REQ-938)
Batch 0 is decided at rung 2.
- **Rung 1:** BUG-48 S4–S6 and C3/C4 require exactly what the ACs state, and no later intent in scope touches REF-l1.
- **Rung 2:** the reference implements every clause (`validate.ts:239`, `:473`, `:1481`, `:2169`; `kb-projection.ts:822`), so only the link is missing.
- **Rung 3:** the FC tests stand, and the new UATs add the link plus the uncovered keyframe-width phrase.
