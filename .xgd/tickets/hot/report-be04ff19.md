---
uid: report-be04ff19
id: REPORT-11598
type: report
title: 'Report: fix_plan for story-58b2cec4'
created_by: xgd
created_at: '2026-11-08T22:27:36.707982+00:00'
updated_at: '2026-11-08T22:27:36.707982+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-58b2cec4
  fix_iteration: 9
  items:
  - index: 0
    tests:
    - every picture is named one way, and resolves to what it names test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape
    dependency_tests:
    - test_UAT_AC2027_
    - test_UAT_AC2028_
    hypothesis: 'The AC-2026 failure in this iteration input is stale: REPORT-11589
      predates the iteration-8 batch-0 test rewrite (REPORT-11593) that batch_quality_check
      REPORT-11595 shows passing 3/3 with AC2027/AC2028.'
    instructions: Verify-only batch. test_UAT_AC2026 in tests/reconciliation-assistant-looking-surface.test.ts
      was already aligned in iteration 8 (REPORT-11593) to the nine-key, six-kind
      picture declared in tools/generate/src/cli/ai/fidelity-surface.json, and passed
      with AC2027/AC2028 in REPORT-11595. Run the scope at HEAD and confirm all three
      pass. That also clears the AC-2026 orphan. Make no edit unless one of them actually
      fails, and in that case fix the test only, keeping the nine keys after, bundle,
      image, kind, original, page, revision, url, viewport and the six kinds reference,
      draft, edit, revision, url, image. Do not touch production code.
    test_scope: test_UAT_AC2026_ or test_UAT_AC2027_ or test_UAT_AC2028_
    ladder:
      rung1: 'Decided: REQ-218 adds the image kind with image/original keys and REQ-216
        adds after, so AC-2026 (already rewritten) and its test follow.'
      rung2: 'Agrees: reconcile-src-BUNDLE-42 fidelity-surface.json:9-64 declares
        the nine-key, six-kind picture.'
      rung3: Not reached; the test stands as already rewritten.
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
    - test_UAT_AC2025_
    - test_UAT_AC2027_
    - test_UAT_AC2028_
    hypothesis: AC-2479 fails because interact.ts fillNames adds the name attribute
      and id (lines 204-205) and the SELECT branch matches option words OR value in
      one pass (line 284); REQ-216 forbids both, and the fix is production-only, now
      granted under code_frozen for this batch.
    instructions: 'code_frozen is lifted for tools/generate/src/cli/capture/interact.ts
      only, in this batch. Make exactly the change the previous builder diagnosed
      (REPORT-11596 / handoff REPORT-11597). (1) In the STEP_BODY fillNames, stop
      offering the name attribute and the element id as names a field can be matched
      by, so that fill email_input is refused as no-match with INTERACTION_FAILED
      and no picture. Labels, aria-label, aria-labelledby and placeholder stay. (2)
      In the SELECT branch, choose the option in two passes: first the option whose
      normalised words equal the wanted value; only if none matches, the option whose
      value does. Then fill Region with United Kingdom selects the option reading
      United Kingdom (value GB), not an earlier option whose value is United Kingdom.
      Keep the post-fill landed check consistent with the chosen option. Do NOT edit
      test_UAT_AC2479, AC-2479 or any other test or AC. Edit no other production file:
      the screenshot/marking path (fidelity-core.ts, screenshot.ts, picture.ts) is
      out of scope and must not change. Keep AC2477/2478/2480/2481/2482, every test_UAT_FC_REQ-216_
      test and AC2025/2027/2028 green.'
    test_scope: test_UAT_AC2479_ or test_UAT_AC2477_ or test_UAT_AC2478_ or test_UAT_AC2480_
      or test_UAT_AC2481_ or test_UAT_AC2482_ or test_UAT_FC_REQ-216_ or test_UAT_AC2025_
      or test_UAT_AC2027_ or test_UAT_AC2028_
    override:
      rule: code_frozen
      rung: 1
      justification: REQ-216 (in scope) states There is no way to name a selector,
        an id or an attribute, and requires a menu to match option words first and
        value second; the settled AC-2479 test asserts exactly this, and interact.ts
        at the reference contradicts it at lines 204-205 and 284 while its own comments
        at lines 12-17 and 278-279 state the REQ-216 intent. This is batch 1, not
        batch 0 denied by report-07babd4a, and the grant covers a different file with
        no trust-boundary component.
      files:
      - tools/generate/src/cli/capture/interact.ts
      tip_evidence:
      - file: tools/generate/src/cli/capture/interact.ts
        lines: 197-206
      - file: tools/generate/src/cli/capture/interact.ts
        lines: 278-286
      trust_boundary: false
    ladder:
      rung1: 'Decided: REQ-216 says there is no way to name a selector, an id or an
        attribute and that a menu matches label first, value second, so interact.ts
        must change and AC-2479 stands.'
      rung2: reconcile-src-BUNDLE-42 interact.ts:204-205 and :284 lag the intent stated
        in its own comments at :12-17 and :278-279, so the reference does not decide
        against the test.
      rung3: Not reached; the AC-2479 test stands unchanged and the code changes under
        the batch-1 code_frozen grant.
---

# Fix Plan — Iteration 9

## Hypothesis
AC-2479 fails only because `tools/generate/src/cli/capture/interact.ts` lets `fill` reach a field by its `name` attribute or `id` (fillNames, lines 204-205) and picks a menu option by label-OR-value in one pass (line 284), both of which REQ-216 forbids; the AC-2026 failure in this iteration's input is stale — that test was already fixed and passes.

## Analysis

**Inputs are partly stale.** The failure list for iteration 9 comes from quality report REPORT-11589 (report-efc6404e, 21:53, commit a70e0941). The iteration-8 plan (REPORT-11592, report-8f9f5514, 22:17) ran after it:
- Batch 0 (AC-2026, test-only) is **fixed**: REPORT-11593 (report-b5cfdad9) rewrote `tests/reconciliation-assistant-looking-surface.test.ts:479-500` to the nine-key, six-kind picture with the draft-only `after` array, and batch_quality_check REPORT-11595 shows AC2026/2027/2028 at 3/3 pass. The AC-2026 orphan is the same failure and clears with it. No production code was touched.
- Batch 1 (AC-2479) is **stuck, blocked_by `code_frozen`**: REPORT-11596 (report-c93ccd38) and handoff REPORT-11597 (report-e4f1162d). The builder confirmed AC2477/2478/2480/2481/2482 pass and AC2479 fails on exactly two defects: (a) `fill "email_input" with ...` reaches a field by its id and takes a picture instead of refusing; (b) `fill "Region" with "United Kingdom"` selects the earlier option whose *value* is "United Kingdom" instead of the option whose *words* are "United Kingdom" (value "GB"). It proposed a production-only fix in interact.ts.

**Hypothesis history.** The interact.ts hypothesis has now been proposed in iterations 6, 7 and 8 (REPORT-11590/11591/11592) and was confirmed by the builder each time. The only thing stopping it is a mode rule. Re-batching it a fourth time without a grant would give the same stuck result. Rule (b) applies: rule on the blocked_by by the ladder. The ruling is **Grant**.

**Why a grant is admissible here despite report-07babd4a.** That review (override_misjudged, bundle-5607a08d) denied `code_frozen` for **batch 0** of this story. The reason was audit item 5 (trust boundary): an ungranted `fidelity-core.ts` edit preserved marking on the screenshot path, under a grant naming host-core.ts, fidelity-core.ts, ai.ts, router.ts and shot.ts. This blocked_by report comes from **batch 1**, the batch that has carried AC-2479 since iteration 6. The change concerns a different file (interact.ts only) and a different concern: control-name matching in a page script, with no marking, escaping, sanitising or provenance. The grant stays on batch 1, where the blocked tests already live. Batch 0 is not used to carry it, and nothing is moved to a fresh index to get around the review. Batch 0 keeps AC-2026 so the batch numbering of the blocked tests is unchanged.

**Ladder for AC-2479.** Rung 1 decides. REQ-216 (request-a2f3c272, in scope in this bundle) says "There is no way to name a selector, an id or an attribute, and the surface says so in its own absences." It also says a menu "matches the option's label first and its value second". The reference state (`reconcile-src-BUNDLE-42:tools/generate/src/cli/capture/interact.ts`) agrees with that intent in its own words: lines 12-17 ("THE UNIT IS A SHORT PHRASE, NOT A SELECTOR") and lines 278-279 ("A menu is chosen by the words a person reads on it, and only falls back to the value"). Its code contradicts them, at lines 204-205 and line 284. So the reference does not settle the question the other way. Its stated intent and REQ-216 agree, and only the code lags. `aligned_to_tip` is invalid because REQ-216 explicitly requires the behaviour. `declined` cannot be fixed within the rule, since the fix is production-only. `superseded` does not apply because neither AC-2479 nor its test changed.

**Conflicts.** None. `test_UAT_FC_REQ-216_a_menu_is_set_by_the_words_a_person_reads_on_it` uses a single option (value "uk", words "United Kingdom"), and it still passes under a words-first, value-fallback two-pass match. No REQ-216 FC test fills a field by id or name attribute. `test_UAT_FC_REQ-216_a_field_is_named_by_its_label_and_takes_the_value` names by label.

**Other consumers of interact.ts** at HEAD are `screenshot.ts`, `picture.ts` and `fidelity-core.ts`, which reach it through the draft picture path. Their tests (REQ-216 FC tests, AC2025/2027/2028) are in `dependency_tests`.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/test_UAT_FC_REQ-216_drive_the_page.test.ts::test_UAT_FC_REQ-216_a_menu_is_set_by_the_words_a_person_reads_on_it — weak-observation — the fixture has one option, so a one-pass label-or-value match passes it too. Add an earlier option whose value equals the later option's words so that words-first ordering is actually observed (AC-2479 currently carries this alone).
- tests/reconciliation-assistant-looking-surface.test.ts::test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults — weak-observation (drift) — the name says five kinds while the declared picture has six (REQ-218 `image`). Check that the `image` kind is resolved too, and rename if it is.

## Batches
- **Batch 0 — AC-2026 (verify, keep green).** It is already fixed (REPORT-11593/11595), and the failure listed here is from the stale REPORT-11589. The builder confirms it passes at HEAD with AC2027/2028 and makes no edit unless it actually fails. Its files (the looking-surface test file) do not overlap batch 1's (interact.ts), so the split is genuinely disjoint.
- **Batch 1 — AC-2479 plus the other drive-the-draft UATs, with a `code_frozen` grant on interact.ts.** The builder makes the two-part production change the earlier builder diagnosed. Tests and ACs are not changed.

## Mode overrides (REQ-892)
- Batch 1, rule `code_frozen`, rung 1, files: `tools/generate/src/cli/capture/interact.ts` only. Justification: REQ-216 (in scope) requires that no control is named by id or attribute and that a menu is matched by option words first, value second. The settled AC-2479 test asserts exactly this, and interact.ts at the reference contradicts it at 204-205 and 284. The reference's own comments (12-17, 278-279) state the same intent. trust_boundary: false, because the change only narrows name matching inside the page-step script and does not touch marking, escaping or framing. This is distinct from the batch-0 denial in report-07babd4a: it is a different batch, a different file, and has no trust-boundary component.

## Resolution ladder (REQ-938)
- **Batch 0:** rung 1 decided. REQ-218 adds the `image` kind with `image`/`original` keys, and REQ-216 adds `after`, so AC-2026 (already rewritten) and its test follow. Rung 2 agrees: `fidelity-surface.json:9-64` at reference-src declares the nine-key, six-kind picture.
- **Batch 1:** rung 1 decided. REQ-216's sentence "There is no way to name a selector, an id or an attribute" and its label-first/value-second menu rule require the code change. At rung 2 the reference's code lags its own stated intent (interact.ts:204-205, 284 versus 12-17, 278-279), so it does not decide against the test. Rung 3 is not reached, and AC-2479's test stands unchanged.
