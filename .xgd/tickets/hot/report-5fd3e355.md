---
uid: report-5fd3e355
id: REPORT-11590
type: report
title: 'Report: fix_plan for story-58b2cec4'
created_by: xgd
created_at: '2026-11-08T21:57:08.383618+00:00'
updated_at: '2026-11-08T21:57:08.383618+00:00'
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
    - controls are matched by accessible name, never by selector test_UAT_AC2479_controls_matched_by_accessible_name_and_no_selector_id_or_attribute_names_one
    - a draft picture is driven by phrases in exactly two forms test_UAT_AC2477_two_forms_quotes_optional_anything_else_refused_before_a_browser_is_leased
    - steps run in order and the shutter opens on the state they produced test_UAT_AC2478_steps_in_order_first_failure_stops_shutter_on_driven_state_at_its_own_viewport
    - a step that cannot be done is INTERACTION_FAILED and returns no picture test_UAT_AC2480_each_step_failure_is_refused_naming_what_failed_and_no_picture_is_returned
    - only a draft picture can be driven test_UAT_AC2481_edit_reference_revision_and_url_pictures_with_after_are_refused_before_a_browser
    - a picture says which channel it is of test_UAT_AC2482_an_edit_picture_carries_the_caption_compare_reports_it_and_a_draft_carries_none
    dependency_tests:
    - test_UAT_FC_REQ-216_
    - test_UAT_FC_REQ-218_
    - test_UAT_AC2027_
    - test_UAT_AC2028_
    hypothesis: AC-2026s UAT predates REQ-218s sixth picture kind (image, original
      keys) and REQ-216s after key, while interact.ts still reaches a fill field by
      its name/id attribute (fillNames, lines 204-205) and picks a menu option by
      label-or-value in one pass (lines 280-284), both of which REQ-216 forbids.
    instructions: 'Two gaps, one batch. (1) AC-2026 was rewritten this iteration to
      the six-kind shape REQ-218 introduced. Update test_UAT_AC2026 in tests/reconciliation-assistant-looking-surface.test.ts
      so it asserts exactly the nine keys after, bundle, image, kind, original, page,
      revision, url, viewport; the six-kind enum reference, draft, edit, revision,
      url, image; and that after is an array whose description says only a draft picture
      can be driven. Keep the required, additionalProperties, banned-params and invalid-picture
      refusal checks. The declaration is right, so do not touch fidelity-surface.json.
      (2) test_UAT_AC2479 is right and the code is wrong, by REQ-216 (There is no
      way to name a selector, an id or an attribute; the option label first and its
      value second). In tools/generate/src/cli/capture/interact.ts: remove the name
      attribute and id from fillNames, so a field is reached only by label, aria-label,
      aria-labelledby text or placeholder. Make menu selection two passes: first look
      for an option whose words match, then fall back to an option whose value matches
      only when no option words match. An earlier option whose value equals the wanted
      words must not win. Update the header and STEP_BODY comments to match. Every
      test_UAT_FC_REQ-216_ test must stay green, especially menu-by-words, label-fill
      and no-match. Leave the AC2479 assertions as they are.'
    test_scope: test_UAT_AC2026_ or test_UAT_AC2479_ or test_UAT_AC2477_ or test_UAT_AC2478_
      or test_UAT_AC2480_ or test_UAT_AC2481_ or test_UAT_AC2482_ or test_UAT_AC2027_
      or test_UAT_AC2028_ or test_UAT_FC_REQ-216_ or test_UAT_FC_REQ-218_
    ladder:
      rung1: 'Decided: REQ-218 (in scope, later than REQ-157) adds the image kind
        with image/original keys, so AC-2026 and its test change; REQ-216 forbids
        naming a field by id/attribute and requires option words before value, so
        interact.ts changes for AC-2479.'
      rung2: Reference fidelity-surface.json:9-64 declares the nine-key six-kind picture
        (agrees for AC-2026); reference interact.ts:197-206 and 280-284 match name/id
        and use a single-pass label-or-value option match (contradicts REQ-216, outranked
        by rung 1).
      rung3: Not reached; both tests (after the AC-2026 rewrite) stand as the specification.
    override:
      rule: code_frozen
      rung: 1
      justification: REQ-216, in scope in BUNDLE-42, states There is no way to name
        a selector, an id or an attribute, and that a menu matches the option label
        first and its value second. AC-2479 restates both. interact.ts at reconcile-src-BUNDLE-42
        adds name and id to fillNames and matches options by label-or-value in one
        pass, so the code must change for the test to hold.
      files:
      - tools/generate/src/cli/capture/interact.ts
      tip_evidence:
      - file: tools/generate/src/cli/capture/interact.ts
        lines: 197-206
      - file: tools/generate/src/cli/capture/interact.ts
        lines: 280-286
      trust_boundary: false
---

# Fix Plan — Iteration 6

## Hypothesis
There are two separate gaps. (1) The AC-2026 UAT still expects the five-kind, six-key picture shape, but REQ-218 added a sixth kind (`image`) with `image`/`original` keys, and REQ-216 added `after`. (2) `interact.ts` still lets `fill` reach a field by its `name`/`id` attribute, and it chooses a menu option by label-or-value in a single pass. REQ-216 and AC-2479 forbid both.

## Analysis
These failures are new since iteration 5 (that plan's AC2028/2031/2033/2034/2025 now pass). Neither hypothesis has been tried before. I ran the two failing tests directly; here is the actual output.

**AC-2026** (`tests/reconciliation-assistant-looking-surface.test.ts:479`): the offered picture schema has the keys `after, bundle, image, kind, original, page, revision, url, viewport`. The test expects `bundle, kind, page, revision, url, viewport`, and its `kind` enum check (line 487) lists five kinds. The declaration at the reference, `reconcile-src-BUNDLE-42:tools/generate/src/cli/ai/fidelity-surface.json` lines 9-64, has the six kinds and all nine keys. REQ-218 ("a sixth picture kind", in scope in BUNDLE-42) asks for exactly that. The AC itself was out of date: its text already named `after`, but not `image` or `original`. The code is right; the AC and its test were behind. The orphan on AC-2026 is only a consequence of this test failing.

**AC-2479** (`tests/reconciliation-assistant-drives-the-draft.test.ts`) has two soft-assertion failures:
- Line 452: `fill "Region" with "United Kingdom"` picked the earlier option whose *value* is "United Kingdom", not the option whose *words* are "United Kingdom" (GB). At the reference, `tools/generate/src/cli/capture/interact.ts:280-284` loops once over the options and tests `norm(opt.textContent)===want||norm(opt.value)===want`, so the first option matching either way wins. That breaks the file's own comment ("chosen by the words … only falls back to the value").
- Lines 480-484: `fill "email_input" with …` succeeded and took a picture. At the reference, `fillNames` (`interact.ts:197-206`) adds `el.getAttribute('name')` (line 204) and `el.id` (line 205) to the field's names.

The working tree's `interact.ts` is identical to the reference (empty diff). REQ-216's "What was built" text in BUNDLE-42 says: "There is no way to name a selector, an id or an attribute", and "matches the option's label first and its value second, because a value attribute is a developer's word". AC-2479 states both rules. Rung 1 therefore decides: the intent in scope requires the behaviour, the code in reconcile-src does not provide it, and the code must change. That needs a `code_frozen` override on `interact.ts` only.

Other consumers of `interact.ts`: `tests/test_UAT_FC_REQ-216_drive_the_page.test.ts` reaches fields by label (`fill "Email address"`) and menus by words (`"United Kingdom"` → `uk`), and asserts a no-match for an unnamed field. Nothing there depends on name/id reachability or on value-first matching, so those tests must stay green. `test_UAT_FC_REQ-218_stored_picture` goes through `picture.ts`/`screenshot.ts`, which import the step driver; I've added it as a dependency.

There's no cross-suite contamination. Both tests fail deterministically in isolation, with concrete assertion diffs.

## Spec Changes Made
- AC-2026 (acceptance_criterion-19a996bc): title and body rewritten in place. It now lists six kinds (adds `image`) and nine keys (adds `image`, `original`; `after` was already there), with an erratum note citing REQ-218 and `fidelity-surface.json:9-64` at the reference. Rung 1: REQ-218 is later than REQ-157 and in scope.
- AC-2479: unchanged. It already says what REQ-216 says, and the code is what has to move.

## Weak Evidence Flags (preventative — best effort)
- tests/test_UAT_FC_REQ-216_drive_the_page.test.ts::test_UAT_FC_REQ-216_a_menu_is_set_by_the_words_a_person_reads_on_it — weak-observation — its fixture has no option whose value equals another option's words, so a value-first or single-pass matcher still passes; add an earlier option whose value collides.
- tests/test_UAT_FC_REQ-216_drive_the_page.test.ts::test_UAT_FC_REQ-216_a_field_is_named_by_its_label_and_takes_the_value — weak-observation — never checks that the field's id/name is *not* a usable name, so the name/id leak in `fillNames` went unnoticed; a negative case would pin it.

## Batches
One batch. The AC-2026 schema test and the AC-2479 matching test share the `after` picture key and the drives-the-draft fixtures, so keeping them together lets the builder see both. The only production file is `interact.ts`.

## Mode overrides (REQ-892)
- Batch 0: `code_frozen`, rung 1. Files: `tools/generate/src/cli/capture/interact.ts`. Reason: REQ-216 (in scope) says no id or attribute can name a control and that a menu matches option words before value. `interact.ts:197-206` (`fillNames` adds `name`/`id`) and `:280-284` (single-pass label-or-value option match) at reconcile-src-BUNDLE-42 contradict it. The fix is in page-side matching, not escaping or sanitising, so trust_boundary is false. Dependency tests: test_UAT_FC_REQ-216_, test_UAT_FC_REQ-218_, and the story's other drive-the-draft ACs (2477, 2478, 2480, 2481, 2482).

## Resolution ladder (REQ-938)
- Batch 0, AC-2026: **rung 1** decided. REQ-218 (in scope) adds the `image` kind with `image`/`original` keys, and REQ-216 adds `after`. The AC was rewritten and the test must follow. Rung 2 agrees: `fidelity-surface.json:9-64` at the reference declares this exact shape.
- Batch 0, AC-2479: **rung 1** decided. REQ-216's operative sentences forbid naming by id/attribute and require option words before value. Rung 2 (the reference state) shows the opposite, but rung 1 outranks it, so the code changes under a `code_frozen` override.
