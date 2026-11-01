---
uid: report-9cd31107
id: REPORT-7606
type: report
title: 'Report: fix_plan for report-71b1019e'
created_by: xgd
created_at: '2026-11-01T12:59:04.439767+00:00'
updated_at: '2026-11-01T12:59:04.439767+00:00'
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
    - tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts
    - tests/test_UAT_FC_BUG-48_corpus_and_index_agree.test.ts
    hypothesis: AC-2104/2105/2106 are orphaned only because their proving UATs are
      named test_UAT_FC_BUG-48_* rather than test_UAT_AC<N>_*; prior builders were
      stuck on a Bash permission denial, not on any defect, so the batch must be doable
      with Read/Write alone.
    instructions: 'No Bash is needed; do not attempt xgd or vitest commands. Everything
      you need is here. Code, ACs and tests already agree; the only gap is the AC-token
      link. Use the Write tool to create ONE new file tests/reconciliation-l1-reference-coverage.test.ts,
      following the convention of tests/reconciliation-1c-builder-env-layering.test.ts
      (AC-token UATs in a reconciliation file, with the FC suite left untouched).
      Read tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts first
      and reuse its imports: projectL1Vocabulary and l1VocabularyGaps from ../tools/generate/src/cli/kb-projection;
      L1_DOCUMENT_KEYS, L1_ENVELOPE, L1_STRUCTURAL_RULES, l1DocumentSchema, validateL1,
      danglingFontFamilies, danglingAssetReferences from ../packages/site-schema/src/index.
      Write three UATs, each deriving its expected parts from those declarations at
      run time with no hand-written lists. (1) test_UAT_AC2104_reference_documents_the_page_document_keys_and_the_shapes_they_reach:
      a ''## The page itself'' section exists before ''## The kinds of element'';
      every Object.keys(l1DocumentSchema.shape) key appears INSIDE that section as
      a field line `key` — <type>; `widths` reads ''a list of number''; ''### font
      face'' occurs exactly once, carries `family` and `src`, and does not occur inside
      the page section. (2) test_UAT_AC2105_limits_section_states_every_structural_rule_in_the_validators_words:
      inside ''## The limits every page is held to'' (which must contain ''A page
      outside these is refused whole''), every L1_ENVELOPE key is named and every
      L1_STRUCTURAL_RULES VALUE (the statement, not just the key) appears verbatim.
      Provoke each rule as the FC test does (validateL1 for seven rules; danglingFontFamilies
      and danglingAssetReferences for servedFontFamily and heldAssetReference) and
      assert a message contains that rule statement. Also assert the legacy phrases:
      the duplicate-id refusal contains "duplicate node id ''twice''", the javascript:
      image src refusal contains ''not an allowed URL'', and the undeclared keyframe
      width (at: 999) refusal contains ''not one of the document widths''. No suite
      yet asserts the last phrase. (3) test_UAT_AC2106_coverage_check_reports_every_unrendered_part_and_shipped_reference_has_none:
      projectL1Vocabulary().source equals ''the L1 element schemas and their validation
      envelope'', and l1VocabularyGaps() is []. With the body cut before the limits
      heading, the gaps name every ''envelope bound <k>'' and every ''structural rule
      <k>'', and nothing starting with ''element kind''. With the body sliced from
      ''## The kinds of element'' onward, the gaps equal exactly the L1_DOCUMENT_KEYS
      mapped to ''document key <k>''. Do not edit production code, the ACs, or the
      existing FC test file. The validation gate will run the tests for you.'
    test_scope: test_UAT_AC2104_ or test_UAT_AC2105_ or test_UAT_AC2106_ or test_UAT_FC_BUG-48_
    ladder:
      rung1: BUG-48 S4-S6 and C3/C4 demand exactly what AC-2104/2105/2106 state, and
        no later intent in scope touches REF-l1.
      rung2: 'Decided here: the code at the reference implements every clause (validate.ts:106
        rule table; :181/:651/:1011 legacy phrases; kb-projection.ts:1000 l1VocabularyGaps(body)),
        and only the AC-token UAT link is missing.'
      rung3: The existing FC tests stand; the new AC-token UATs add the missing link
        plus the uncovered legacy-phrase assertion.
---

# Fix Plan — Iteration 3

## Hypothesis
AC-2104/2105/2106 are orphaned only because the UATs proving them exist under `test_UAT_FC_BUG-48_*` names, not AC-token names. Both earlier builder attempts got stuck before editing anything because Bash was denied. That is a permission problem, not a product or test defect, so this batch is written so it can be completed with Read and Write alone.

## Analysis
- **The quality report counts 280 tests and 0 failures.** The only failures are three orphaned ACs on story-5836022a (BUG-48 items S4, S5 and S6).
- **Iterations 1 and 2 (report-95e912c1, report-c4d32caf) sent a batch with empty instructions.** Both builders (report-bd1621f7, report-b3516557) returned `status: stuck` with `blocked_by.rule: none (environment permission)`. Bash was denied, so they could not read the ACs, search the tests or run vitest.
  - This is not a mode rule, so there is nothing to grant, decline or supersede.
  - It is not an XGD tooling defect with a `report-bug` id, so BUG-1067's do-not-rebatch rule does not apply.
  - Per the prescription in both assessments, this plan supplies everything the builder was blocked on: the AC content, the existing proving tests and the exact file to write. No shell access is needed.
- **The existing tests already prove the behaviour.** They are in `tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts`:
  - **AC-2104** (page section, every document key with a type, `widths` as a list of numbers, font face described once with `family` and `src`): `every_document_key_appears_in_the_reference`, `the_keys_the_consultant_can_now_write_say_what_they_take`, `the_shapes_a_document_key_reaches_are_described_once`.
  - **AC-2105** (every structural rule is stated in the limits section beside every numeric bound; every rule provoked yields a refusal or finding carrying its statement): `every_structural_rule_is_stated_beside_the_numeric_bounds`, `the_refusals_that_are_not_numbers_are_projected_not_authored`, `every_stated_rule_is_one_the_validator_actually_refuses`.
    - **Gap:** no test asserts the three legacy phrases together through validator output. Production does carry them: `validate.ts:1011` has `duplicate node id '<id>'`, `validate.ts:651` has `not an allowed URL`, `validate.ts:181` has `not one of the document widths`. The new AC-2105 UAT must assert all three, including the keyframe-width phrase, which no suite currently checks.
  - **AC-2106** (coverage check is empty on the shipped body; with the limits section cut it names every bound and rule and no element kind; with the page section cut it names exactly the document keys): `the_reference_covers_everything_it_says_it_is_generated_from`, `the_coverage_check_has_teeth`. `l1VocabularyGaps(body?)` is exported from `kb-projection.ts:1000`.
- **Repo convention for reconciliation UATs:** AC-token tests go in a new `tests/reconciliation-*.test.ts` file, and the `test_UAT_FC_*` suite stays as it is. See `tests/reconciliation-1c-builder-env-layering.test.ts` (AC2162–2164 beside `test_UAT_FC_BUG-50_*`).
- **No conflicts and no isolation issues.** All of this is pure in-process projection and validation with no shared mutable fixtures.

## Spec Changes Made
none. The three ACs match the code as it is.

## Weak Evidence Flags (preventative — best effort)
- `tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts::test_UAT_FC_BUG-48_the_refusals_that_are_not_numbers_are_projected_not_authored` — weak-observation — `/unique/`, `/palette/` and `/column/` match anywhere in the limits section. Assert the `L1_STRUCTURAL_RULES` statement strings instead.
- `tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts::test_UAT_FC_BUG-48_every_document_key_appears_in_the_reference` — weak-observation — it checks that each key appears anywhere in the body. Scope the check to the `## The page itself` section, as the next test does.

## Batches
**Batch 0** holds AC-2104, AC-2105 and AC-2106. They share one production surface (`projectL1Vocabulary`, `L1_STRUCTURAL_RULES`, `l1VocabularyGaps`), so they stay together.
- **Change:** create one new test file, `tests/reconciliation-l1-reference-coverage.test.ts`, with three UATs: `test_UAT_AC2104_…`, `test_UAT_AC2105_…`, `test_UAT_AC2106_…`.
- **Not allowed:** production edits and changes to the ACs.
- **Keep green:** the BUG-48 FC suites and the reconciliation-l1 authoring and navigation suites that read the legacy phrases.

## Resolution ladder (REQ-938)
- **Batch 0 is decided at rung 2.**
- **Rung 1:** BUG-48 S4–S6 and C3/C4 require exactly what the ACs state, and no later intent in scope touches REF-l1.
- **Rung 2:** the code at the reference implements every AC clause (`validate.ts:106` rule table, `:181`, `:651` and `:1011` legacy phrases, `kb-projection.ts:1000` `l1VocabularyGaps`). The ACs, code and tests agree; only the AC-token link is missing.
- **Rung 3:** the existing FC tests stand, and the new AC-token UATs add the missing link plus the legacy-phrase assertion.
