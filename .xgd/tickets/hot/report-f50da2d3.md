---
uid: report-f50da2d3
id: REPORT-11591
type: report
title: 'Report: fix_plan for story-58b2cec4'
created_by: xgd
created_at: '2026-11-08T22:10:04.071062+00:00'
updated_at: '2026-11-08T22:10:04.071062+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-58b2cec4
  fix_iteration: 6
  items:
  - index: 0
    tests:
    - every picture is named one way, and resolves to what it names test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape
    dependency_tests:
    - test_UAT_AC2027_
    - test_UAT_AC2028_
    hypothesis: The AC-2026 UAT predates the six-kind, nine-key picture schema (REQ-218
      image kind with image/original keys, REQ-216 after) that fidelity-surface.json
      already declares and that AC-2026 was rewritten to.
    instructions: Test-only batch, no production edits. AC-2026 (acceptance_criterion-19a996bc)
      now states six kinds and nine keys. Update test_UAT_AC2026 in tests/reconciliation-assistant-looking-surface.test.ts
      so it asserts exactly the nine keys after, bundle, image, kind, original, page,
      revision, url, viewport; the six-kind enum reference, draft, edit, revision,
      url, image; and that after is an array whose description says only a draft picture
      can be driven. Keep the required, additionalProperties, banned-params and invalid-picture
      refusal checks as they are. The declaration in tools/generate/src/cli/ai/fidelity-surface.json
      is correct; do not touch it. Passing this test also clears the AC-2026 orphan.
    test_scope: test_UAT_AC2026_ or test_UAT_AC2027_ or test_UAT_AC2028_
    ladder:
      rung1: 'Decided: REQ-218 (in scope, later than REQ-157) adds the image kind
        with image/original keys and REQ-216 adds after, so AC-2026 was rewritten
        and its test follows.'
      rung2: 'Agrees: reconcile-src-BUNDLE-42 fidelity-surface.json:9-64 declares
        the nine-key, six-kind picture.'
      rung3: Not reached; the rewritten test stands as the specification.
  - index: 1
    tests:
    - controls are matched by accessible name, never by selector test_UAT_AC2479_controls_matched_by_accessible_name_and_no_selector_id_or_attribute_names_one
    - a draft picture is driven by phrases in exactly two forms test_UAT_AC2477_two_forms_quotes_optional_anything_else_refused_before_a_browser_is_leased
    - steps run in order and the shutter opens on the state they produced test_UAT_AC2478_steps_in_order_first_failure_stops_shutter_on_driven_state_at_its_own_viewport
    - a step that cannot be done is INTERACTION_FAILED and returns no picture test_UAT_AC2480_each_step_failure_is_refused_naming_what_failed_and_no_picture_is_returned
    - only a draft picture can be driven test_UAT_AC2481_edit_reference_revision_and_url_pictures_with_after_are_refused_before_a_browser
    - a picture says which channel it is of test_UAT_AC2482_an_edit_picture_carries_the_caption_compare_reports_it_and_a_draft_carries_none
    dependency_tests:
    - test_UAT_FC_REQ-216_
    - test_UAT_FC_REQ-218_
    hypothesis: AC-2479 fails because interact.ts fillNames adds the name attribute
      and id (lines 204-205) and the menu branch matches label-or-value in one pass
      (lines 280-284), which REQ-216 forbids; the fix is production code that code_frozen
      governs and that cannot be granted on this story (report-07babd4a).
    instructions: 'Decided at rung 3: test_UAT_AC2479 is correct and stands exactly
      as written, and AC-2479 stands. Do NOT weaken, rewrite or delete its assertions,
      and do NOT edit AC-2479, to make it pass. Its two failures are code defects
      in tools/generate/src/cli/capture/interact.ts: (1) fillNames pushes el.getAttribute(name)
      and el.id, so fill email_input reaches a field by its id; REQ-216 says there
      is no way to name a selector, an id or an attribute. (2) The SELECT branch accepts
      an option whose words OR value match in one pass, so an earlier option whose
      value equals the wanted words wins; REQ-216 requires option words first and
      value only as a fallback. The demanded change: drop name/id from fillNames,
      and choose the option in two passes (words, then value only if no words match).
      This batch carries no override and code_frozen stays in force, so make no production
      edit. Confirm the two failures are exactly these, keep AC2477/2478/2480/2481/2482
      and the REQ-216/REQ-218 tests green, and report the batch stuck with blocked_by
      rule code_frozen, the evidence above, and this proposed_change, so the diagnostic
      report names the interact.ts fix.'
    test_scope: test_UAT_AC2479_ or test_UAT_AC2477_ or test_UAT_AC2478_ or test_UAT_AC2480_
      or test_UAT_AC2481_ or test_UAT_AC2482_ or test_UAT_FC_REQ-216_ or test_UAT_FC_REQ-218_
    ladder:
      rung1: REQ-216 (in scope) requires no naming by id or attribute and option words
        before value, so interact.ts must change; the code_frozen override for this
        story batch 0 was denied by review report-07babd4a and is not re-requested.
      rung2: reconcile-src-BUNDLE-42 interact.ts:197-206 adds name/id to fillNames
        and :280-284 matches label-or-value in one pass; aligning AC-2479 to it is
        barred because REQ-216 is a later intent in scope that explicitly requires
        otherwise.
      rung3: 'Decided: the test stands; the demanded change (drop name/id from fillNames,
        two-pass option match) is production code that cannot be made under code_frozen
        here, so the batch is expected to end stuck with blocked_by code_frozen.'
---

# Fix Plan — Iteration 6 (attempt 2)

## Hypothesis
There are two separate gaps. (1) The AC-2026 UAT still expects the five-kind, six-key picture schema, but REQ-218 added the `image` kind with `image`/`original` keys, and REQ-216 added `after`. (2) `interact.ts` lets `fill` reach a field by its `name` attribute or `id`, and it picks a menu option by label-or-value in a single pass. REQ-216 and AC-2479 forbid both. The second gap can only close with a production change, and that change cannot be authorised in this batch set.

## Analysis
This is a re-plan. Attempt 1 (REPORT-11590, report-5fd3e355) was refused by the validator with: "batch 0: the `code_frozen` override was refused: rule 'code_frozen' was rejected by a review for this batch". The rejection is report-07babd4a (override_misjudged, reconciliation_review of bundle-5607a08d). It judged the earlier batch-0 `code_frozen` grant report-be7d1be4 wrong on audit item 5 (trust boundary): marking on the screenshot path was preserved only by an ungranted `fidelity-core.ts` edit (0a0f97f216), made after code_frozen had already been denied for this batch (report-1312a88f). It states: "Rule `code_frozen` is now denied for batch 0 of story-58b2cec4; it will not be granted again there, so the next plan decides that batch at the next rung." That denial is not about `interact.ts`, but it binds the story's batch 0. This plan does not re-request the grant, and it does not move the same grant to another batch index to get round the review.

**AC-2026** (`tests/reconciliation-assistant-looking-surface.test.ts:479`): the offered picture schema has the keys `after, bundle, image, kind, original, page, revision, url, viewport` and six kinds. The test expects six keys and five kinds. `reconcile-src-BUNDLE-42:tools/generate/src/cli/ai/fidelity-surface.json:9-64` declares the nine-key, six-kind shape, and REQ-218 (in scope) asks for exactly that. AC-2026 was rewritten in place in attempt 1 (acceptance_criterion-19a996bc, commit bd89f39398). Only the test still has to follow, which is a test-only change. The AC-2026 orphan is a consequence of that test failing.

**AC-2479** (`tests/reconciliation-assistant-drives-the-draft.test.ts`): two deterministic assertion failures, both confirmed against the reference with `git show reconcile-src-BUNDLE-42:tools/generate/src/cli/capture/interact.ts`:
- `fillNames` (lines 197-206) pushes `el.getAttribute('name')` (line 204) and `el.id` (line 205), so `fill "email_input" with ...` succeeds and a picture is taken.
- The SELECT branch (lines 280-284) loops once and accepts `norm(opt.textContent)===want||norm(opt.value)===want`, so an earlier option whose value is "United Kingdom" beats the option whose words are "United Kingdom". This contradicts the file's own comment at line 278.

REQ-216 (in scope, "What was built") says "There is no way to name a selector, an id or an attribute", and a menu "matches the option's label first and its value second". The test is right and the code is wrong.

Each ladder rung gives the same answer:
- **Rung 1** requires the code change.
- **Rung 2:** the reference shows the opposite behaviour, but an `aligned_to_tip` ruling is invalid because REQ-216, a later intent in scope, explicitly requires the behaviour. Weakening AC-2479 to match the code would invert the intent.
- **Rung 3:** the test stands and `interact.ts` must change.

That change is production code, which `code_frozen` governs, and an override cannot be granted on the story's batch 0. So AC-2479 is planned as its own batch with no override and rung 3 recorded. The builder must leave the test and the AC as they are, make no production edit, and report the batch `stuck` with `blocked_by: code_frozen` naming the exact change below. If the run still cannot converge, the diagnostic report then carries a precise code-issue prescription instead of a weakened test.

No cross-suite contamination: both tests fail deterministically in isolation (attempt 1 ran them directly) with concrete assertion diffs.

The required code change, for whoever is authorised to make it in `tools/generate/src/cli/capture/interact.ts`:
1. Remove the `name` attribute and `id` from `fillNames` (lines 204-205).
2. Match menu options in two passes: words first, then value only if no option's words match (lines 280-284).
3. Keep `test_UAT_FC_REQ-216_` and `test_UAT_FC_REQ-218_` green.

## Spec Changes Made
- AC-2026 (acceptance_criterion-19a996bc): rewritten in attempt 1 of this iteration (six kinds, nine keys, erratum citing REQ-218 and `fidelity-surface.json:9-64`). No further change.
- AC-2479: unchanged. It restates REQ-216 correctly.

## Weak Evidence Flags (preventative — best effort)
- tests/test_UAT_FC_REQ-216_drive_the_page.test.ts::test_UAT_FC_REQ-216_a_menu_is_set_by_the_words_a_person_reads_on_it — weak-observation — no option's value collides with another option's words, so a single-pass label-or-value matcher still passes; add an earlier colliding-value option.
- tests/test_UAT_FC_REQ-216_drive_the_page.test.ts::test_UAT_FC_REQ-216_a_field_is_named_by_its_label_and_takes_the_value — weak-observation — never asserts that a field's id or name attribute is NOT a usable name; add the negative case.

## Batches
- **Batch 0: AC-2026 only, test-only.** The builder updates `test_UAT_AC2026` to the nine-key, six-kind declaration. No production file is touched and no override is requested, which is all batch 0 can carry after report-07babd4a.
- **Batch 1: AC-2479 and its drive-the-draft neighbours, no override, rung 3.** This is split from batch 0 because the two batches are genuinely disjoint. Batch 0 asserts on the static surface JSON in `reconciliation-assistant-looking-surface.test.ts` and drives no browser. Batch 1 lives in `reconciliation-assistant-drives-the-draft.test.ts` against `interact.ts` behaviour. The split stops AC-2026's test-only fix from being held hostage by a batch that is expected to end `stuck`. It is not a vehicle for an override: batch 1 carries none.

## Resolution ladder (REQ-938)
- **Batch 0 (AC-2026): rung 1** decided. REQ-218 (in scope, later than REQ-157) adds the `image` kind with `image`/`original` keys, and REQ-216 adds `after`. The AC was rewritten, so the test follows. Rung 2 agrees: `fidelity-surface.json:9-64` at the reference declares this shape.
- **Batch 1 (AC-2479): rung 3** decided. Rung 1 (REQ-216) requires the code change, but `code_frozen` cannot be lifted on this story's batch 0 (report-07babd4a). Rung 2 (`interact.ts:197-206`, `:280-284`) shows the opposite behaviour, and aligning to it is barred because REQ-216 is a later intent in scope that explicitly requires otherwise. The test stands. The code change it demands is named above and cannot be made under this mode, so the batch is expected to end `stuck` with `blocked_by: code_frozen`.
