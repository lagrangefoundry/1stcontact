---
uid: report-8f9f5514
id: REPORT-11592
type: report
title: 'Report: fix_plan for story-58b2cec4'
created_by: xgd
created_at: '2026-11-08T22:17:49.651192+00:00'
updated_at: '2026-11-08T22:17:49.651192+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_plan
  subject_uid: story-58b2cec4
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
  fell_through:
  - 'batch 0: the instructions name production files that `code_frozen` freezes in
    reconcile mode (tools/generate/src/cli/ai/fidelity-surface.json) and the batch
    grants no `code_frozen` override naming them. Grant the override (the rule is
    overridable), or change the plan so the batch does not edit them'
  - 'batch 1: the instructions name production files that `code_frozen` freezes in
    reconcile mode (tools/generate/src/cli/capture/interact.ts) and the batch grants
    no `code_frozen` override naming them. Grant the override (the rule is overridable),
    or change the plan so the batch does not edit them'
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "every picture is named one way, and resolves to what it names test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape"
      ],
      "dependency_tests": [
        "test_UAT_AC2027_",
        "test_UAT_AC2028_"
      ],
      "hypothesis": "The AC-2026 UAT predates the six-kind, nine-key picture schema (REQ-218 image kind with image/original keys, REQ-216 after) that fidelity-surface.json already declares and that AC-2026 was rewritten to.",
      "instructions": "Test-only batch, no production edits. AC-2026 (acceptance_criterion-19a996bc) now states six kinds and nine keys. Update test_UAT_AC2026 in tests/reconciliation-assistant-looking-surface.test.ts so it asserts exactly the nine keys after, bundle, image, kind, original, page, revision, url, viewport; the six-kind enum reference, draft, edit, revision, url, image; and that after is an array whose description says only a draft picture can be driven. Keep the required, additionalProperties, banned-params and invalid-picture refusal checks as they are. The declaration in tools/generate/src/cli/ai/fidelity-surface.json is correct; do not touch it. Passing this test also clears the AC-2026 orphan.",
      "test_scope": "test_UAT_AC2026_ or test_UAT_AC2027_ or test_UAT_AC2028_",
      "ladder": {
        "rung1": "Decided: REQ-218 (in scope, later than REQ-157) adds the image kind with image/original keys and REQ-216 adds after, so AC-2026 was rewritten and its test follows.",
        "rung2": "Agrees: reconcile-src-BUNDLE-42 fidelity-surface.json:9-64 declares the nine-key, six-kind picture.",
        "rung3": "Not reached; the rewritten test stands as the specification."
      }
    },
    {
      "index": 1,
      "tests": [
        "controls are matched by accessible name, never by selector test_UAT_AC2479_controls_matched_by_accessible_name_and_no_selector_id_or_attribute_names_one",
        "a draft picture is driven by phrases in exactly two forms test_UAT_AC2477_two_forms_quotes_optional_anything_else_refused_before_a_browser_is_leased",
        "steps run in order and the shutter opens on the state they produced test_UAT_AC2478_steps_in_order_first_failure_stops_shutter_on_driven_state_at_its_own_viewport",
        "a step that cannot be done is INTERACTION_FAILED and returns no picture test_UAT_AC2480_each_step_failure_is_refused_naming_what_failed_and_no_picture_is_returned",
        "only a draft picture can be driven test_UAT_AC2481_edit_reference_revision_and_url_pictures_with_after_are_refused_before_a_browser",
        "a picture says which channel it is of test_UAT_AC2482_an_edit_picture_carries_the_caption_compare_reports_it_and_a_draft_carries_none"
      ],
      "dependency_tests": [
        "test_UAT_FC_REQ-216_",
        "test_UAT_FC_REQ-218_"
      ],
      "hypothesis": "AC-2479 fails because interact.ts fillNames adds the name attribute and id (lines 204-205) and the menu branch matches label-or-value in one pass (lines 280-284), which REQ-216 forbids; the fix is production code that code_frozen governs and that cannot be granted on this story (report-07babd4a).",
      "instructions": "Decided at rung 3: test_UAT_AC2479 is correct and stands exactly as written, and AC-2479 stands. Do NOT weaken, rewrite or delete its assertions, and do NOT edit AC-2479, to make it pass. Its two failures are code defects in tools/generate/src/cli/capture/interact.ts: (1) fillNames pushes el.getAttribute(name) and el.id, so fill email_input reaches a field by its id; REQ-216 says there is no way to name a selector, an id or an attribute. (2) The SELECT branch accepts an option whose words OR value match in one pass, so an earlier option whose value equals the wanted words wins; REQ-216 requires option words first and value only as a fallback. The demanded change: drop name/id from fillNames, and choose the option in two passes (words, then value only if no words match). This batch carries no override and code_frozen stays in force, so make no production edit. Confirm the two failures are exactly these, keep AC2477/2478/2480/2481/2482 and the REQ-216/REQ-218 tests green, and report the batch stuck with blocked_by rule code_frozen, the evidence above, and this proposed_change, so the diagnostic report names the interact.ts fix.",
      "test_scope": "test_UAT_AC2479_ or test_UAT_AC2477_ or test_UAT_AC2478_ or test_UAT_AC2480_ or test_UAT_AC2481_ or test_UAT_AC2482_ or test_UAT_FC_REQ-216_ or test_UAT_FC_REQ-218_",
      "ladder": {
        "rung1": "REQ-216 (in scope) requires no naming by id or attribute and option words before value, so interact.ts must change; the code_frozen override for this story batch 0 was denied by review report-07babd4a and is not re-requested.",
        "rung2": "reconcile-src-BUNDLE-42 interact.ts:197-206 adds name/id to fillNames and :280-284 matches label-or-value in one pass; aligning AC-2479 to it is barred because REQ-216 is a later intent in scope that explicitly requires otherwise.",
        "rung3": "Decided: the test stands; the demanded change (drop name/id from fillNames, two-pass option match) is production code that cannot be made under code_frozen here, so the batch is expected to end stuck with blocked_by code_frozen."
      }
    }
  ]
}