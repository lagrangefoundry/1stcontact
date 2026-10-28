---
uid: report-7713f9da
id: REPORT-6818
type: report
title: 'Report: fix_plan for story-31204812'
created_by: xgd
created_at: '2026-10-28T03:50:59.225690+00:00'
updated_at: '2026-10-28T20:16:44.704855+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-31204812
  fix_iteration: 6
  items:
  - index: 0
    tests:
    - test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time
    - test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_refuses_unknown
    - test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing
    - test_UAT_AC2048_every_request_is_guarded_refused_ones_never_sent_and_reported
    - test_UAT_AC2049_redirect_cap_counts_hops_not_subresource_origins
    - test_UAT_AC2050_byte_and_time_budgets_abandon_the_capture_in_both_hosts
    - 'suite: javascript-vitest'
    dependency_tests:
    - test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals
    - test_UAT_AC2051_capture_site_audit_record_carries_url_and_refusal_is_refused
    - test_UAT_AC2052_capture_results_are_untrusted_and_the_surface_says_why
    - test_UAT_AC2053_capture_site_leaves_counter_definition_and_journal_unchanged
    - test_UAT_FC_REQ_157_private_and_link_local_space_is_refused
    - test_UAT_FC_REQ_157_each_refusal_names_its_reason
    - test_UAT_FC_REQ_157_the_guard_caps_redirects_and_size_and_records_both
    - test_UAT_FC_REQ_157_a_refused_capture_is_journalled_with_its_url
    - test_UAT_FC_REQ_157_the_audit_record_carries_the_refused_url
    hypothesis: AC2045-AC2050 assert REQ-157's stated SSRF/budget intent rather than
      the code that landed (no record-less fallback, no Node redirect-hop guard, no
      applied 60 s cap, no Node byte cap, no refusal of a cap-tripped capture); the
      ACs and tests must be aligned to the code, and the suite-level '0 tests' entry
      is a separate vitest-plugin parse defect (BUG-1574) that does not block the
      ruling now that BUG-1573 has landed.
    instructions: 'RULING on the builder''s code_frozen request (report-b6bb201d /
      report-ecdedc3f): NOT granted, ruled aligned_to_tip. The tip lacks every proposed
      fix (tip bundle.ts still throws on a missing record; tip playwright-driver.ts
      guards only via page.route; tip egress-guard.ts removed the byte cap (BUG-172)
      and never applies MAX_CAPTURE_MS; tip fidelity-core.ts refuses only when the
      main document was refused). Do NOT copy generated/ into the worktree: iteration
      4 disproved that hypothesis (the egress file loads and runs without it). Verify
      with `npx vitest run --config vitest.node.config.mts tests/test_reconciliation_capture_site_egress.test.ts`
      (today: 6 failed / 4 passed). The suite-level ''executed 0 tests'' entry is
      XGD plugin defect BUG-1574 (out of scope; do not try to fix it); this batch
      is done when the direct run is 10/10 green and the REQ-157 dependency UATs stay
      green. Edit only tests/test_reconciliation_capture_site_egress.test.ts, the
      six AC tickets and STORY-159; touch no production file. Rewrite each AC in place,
      with a one-line note pointing at this fix_plan report, and align its test to
      the code. AC2045 (acceptance_criterion-2b82c3cf): list_references returns {bundle,url,capturedAt}
      from each bundle''s capture record; retire the ''null for a bundle without a
      record'' clause (readCapture, bundle.ts:95-99, throws first); drop that case
      and do not assert the throw. AC2046 (acceptance_criterion-d553d8fb): an unknown
      name is an error naming the bundle and saying it has no capture record ("Bundle
      ''<name>'' has no capture.json."), not PictureNotFoundError/NOT_FOUND (fidelity-core.ts:245-253
      is unreachable). AC2047 (acceptance_criterion-7db0225c): for scheme and credential
      refusals REFUSED names the scheme or reason rather than echoing the URL (credentialed
      URLs are deliberately never echoed); keep the literal-URL check for address-space
      refusals. AC2048 (acceptance_criterion-b4af8127): the Worker driver checks every
      request including each redirect hop (cf-driver.ts:231-232); the Node driver
      checks every request its page.route seam sees (navigation and subresources,
      playwright-driver.ts:101-110), and Playwright does not route redirect hops,
      so a Node redirect hop is NOT checked. State that as a known limitation beside
      the DNS-rebinding non-goal; remove the Node redirect-hop assertion and never
      assert that the forward to the private address happens. AC2049 (acceptance_criterion-e4c4d77e):
      a redirect chain through more than 5 distinct hosts is refused with reason redirect-cap
      and reported in refusals (on the Worker host); retire the ''subresource origins
      are not hops'' clause (BUG-127, out of window, changes it). AC2050 (acceptance_criterion-26d0ac51):
      retire the 60 s clause (MAX_CAPTURE_MS declared at egress-guard.ts:72, applied
      nowhere) and the Node byte-cap clause; assert that on the Worker host response
      bytes are recorded (cf-driver.ts:280), past 32 MiB the guard trips with reason
      response-cap and refuses every later request (egress-guard.ts:246,264-273),
      and capture_site still returns the bundle with the trip in refusals (fidelity-core.ts:324-333);
      note that out-of-window BUG-172 later removes the byte cap. Keep every it()
      test name exactly as it is (the ruling and scope reference those names); reword
      describe blocks and comments only. Update STORY-159''s body: move ''Code issues''
      1-4 and the Node redirect-hop gap into a ''Known gaps (aligned to code, see
      fix_plan iteration 6)'' section so the operator can file explicit SSRF/budget
      fixes. AC2044, AC2051-2053 and the listed REQ-157 guard UATs must stay green.
      No skips; weaken no assertion beyond the clauses this ruling retires.'
    test_scope: test_UAT_AC2044_ or test_UAT_AC2045_ or test_UAT_AC2046_ or test_UAT_AC2047_
      or test_UAT_AC2048_ or test_UAT_AC2049_ or test_UAT_AC2050_ or test_UAT_AC2051_
      or test_UAT_AC2052_ or test_UAT_AC2053_ or test_UAT_FC_REQ_157_private_and_link_local_space_is_refused
      or test_UAT_FC_REQ_157_each_refusal_names_its_reason or test_UAT_FC_REQ_157_the_guard_caps_redirects_and_size_and_records_both
      or test_UAT_FC_REQ_157_a_refused_capture_is_journalled_with_its_url or test_UAT_FC_REQ_157_the_audit_record_carries_the_refused_url
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: aligned_to_tip
      reason: REQ-157 owns these ACs and is the only in-window intent on this surface,
        so no later in-window intent orders the conflict in the ACs' favour; xgd-working's
        tip decides. Neither the window code nor the tip implements the builder's
        proposed fixes (tolerant readCapture, Node redirect-hop guard, applied 60
        s cap, refusal of a cap-tripped capture), and out-of-window BUG-172/BUG-127
        move further from the ACs, so a code_frozen grant would invent behaviour rather
        than port it. The ACs are rewritten to the code as landed; clauses where the
        tip later diverges are retired rather than asserted either way.
      acs:
      - acceptance_criterion-2b82c3cf
      - acceptance_criterion-d553d8fb
      - acceptance_criterion-7db0225c
      - acceptance_criterion-b4af8127
      - acceptance_criterion-e4c4d77e
      - acceptance_criterion-26d0ac51
      tests:
      - test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time
      - test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_refuses_unknown
      - test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing
      - test_UAT_AC2048_every_request_is_guarded_refused_ones_never_sent_and_reported
      - test_UAT_AC2049_redirect_cap_counts_hops_not_subresource_origins
      - test_UAT_AC2050_byte_and_time_budgets_abandon_the_capture_in_both_hosts
      files:
      - tests/test_reconciliation_capture_site_egress.test.ts
      - .xgd/tickets/hot/acceptance_criterion-2b82c3cf.md
      - .xgd/tickets/hot/acceptance_criterion-d553d8fb.md
      - .xgd/tickets/hot/acceptance_criterion-7db0225c.md
      - .xgd/tickets/hot/acceptance_criterion-b4af8127.md
      - .xgd/tickets/hot/acceptance_criterion-e4c4d77e.md
      - .xgd/tickets/hot/acceptance_criterion-26d0ac51.md
      - .xgd/tickets/hot/story-31204812.md
      tip_evidence:
      - file: tools/generate/src/cli/capture/bundle.ts
        lines: 95-99
      - file: tools/generate/src/cli/ai/fidelity-core.ts
        lines: 245-253
      - file: tools/generate/src/cli/ai/fidelity-core.ts
        lines: 309-357
      - file: tools/generate/src/cli/capture/egress-guard.ts
        lines: 228-275
      - file: tools/generate/src/cli/capture/playwright-driver.ts
        lines: 101-110
      - file: tools/generate/src/cli/capture/cf-driver.ts
        lines: 231-232
      - file: tools/generate/src/cli/capture/cf-driver.ts
        lines: 280-280
      intent:
        ticket: REQ-157
        sentence: '`capture_site` is refused for private address space, over-large
          responses and redirect loops;'
  batches_pending: false
---

# Fix Plan — Iteration 6

## Hypothesis
AC2045–AC2050 assert REQ-157's stated SSRF and budget intent rather than the code that landed, so the ACs and tests must be aligned to the code (`aligned_to_tip`). The suite-level "executed 0 tests" entry is a separate vitest-plugin parse defect (BUG-1574) and does not block the ruling.

## Analysis
- **What changed since iteration 5.** Iterations 4 and 5 (report-4d4de3ac, report-07eba08d) terminal-failed under BUG-1067, naming BUG-1574 as the blocker. BUG-1574's body now carries a correction from EPIC-27. The "no failing test in blocked_by_ruling.tests belongs to `acceptance_criterion-2b82c3cf`" rejection never compared the ruling against the quality report's failures. `validate_fix_plan` builds its AC-to-test map from the ruling's own `tests`, keyed by the human AC id parsed from the test name (`AC-2045`). The ruling named ACs by UID, so the lookup could never match. That is **BUG-1573**, which landed before this run (commit 236b13b4ba9, "aligned_to_tip ruling accepts ACs named by UID"). BUG-1574's Consequence section is withdrawn. BUG-1067 therefore no longer applies: nothing in XGD's tooling still stands between this story and the ruling.
- **Diagnosis, confirmed in iterations 2–5 and unchanged.** Run directly, the egress file gives 6 failed / 4 passed. Neither the window code nor the xgd-working tip implements any of these: a tolerant `readCapture` (bundle.ts:95-99 still throws), a Node redirect-hop guard, an applied 60 s cap, a Node byte cap, or refusal of a cap-tripped capture. REQ-157 is the only in-window intent on this surface.
- **Re-checked this iteration.**
  - All ten `it()` names are still present in `tests/test_reconciliation_capture_site_egress.test.ts`.
  - All five REQ-157 dependency UATs exist.
  - The quoted REQ-157 sentence is verbatim in request-3f8737f2.md.
  - bundle.ts:95-99 is unchanged.
  - Since iteration 5, only xgd bookkeeping files have changed.
- **Dropped from the iteration-2/3 brief.** The "copy `generated/` in" step: iteration 4 showed the egress file runs without it.

## Spec Changes Made
None by the planner. The builder rewrites AC2045–AC2050 in place under the ruling and updates STORY-159.

## Weak Evidence Flags (preventative — best effort)
- test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals — weak-observation — assert that a known refused subresource appears in `refusals` with its reason, not only that `refusals` is an array.
- suite: javascript-vitest — infra — BUG-1574: the plugin drops parseable per-test results in the multi-project run. This belongs to the plugin and is out of this story's scope.

## Batches
One batch. All six failures are in one test file and share one root cause (the ACs disagree with the code). AC2044, AC2051–2053 and the five REQ-157 guard UATs are dependency tests on the same guard and `capture_site` path.

## Arbitration of last resort (BUG-1462)
- **Root cause.** The ACs assert intended SSRF and budget behaviour that was never implemented.
- **Resolved at tier 3** (the xgd-working tip), applied as a REQ-904 `aligned_to_tip` ruling on the builder's `code_frozen` block. The override is denied: a `code_frozen` grant may only port tip behaviour, and the tip lacks every proposed fix.
- **Retired clauses.** Where the tip itself diverges, the disputed clause is retired rather than asserted:
  - AC2049: per-chain hop counting (BUG-127).
  - AC2050: the byte cap (BUG-172) and the 60 s cap.

**Operator: real security and limit gaps stay in the code.** Each needs an explicit fix ticket:
1. A Node redirect hop is not checked, so a capture can be redirected to a private address (server-side request forgery).
2. The 60 s capture limit (MAX_CAPTURE_MS) is never applied.
3. A capture whose guard tripped is still adopted as a reference.
4. A bundle with no `capture.json` breaks `list_references` and `describe_reference`.

## Aligned to running code (REQ-895)

REQ-157 owns these ACs and is the only in-window intent on this surface, so no later in-window intent orders the conflict in the ACs' favour; xgd-working's tip decides. Neither the window code nor the tip implements the builder's proposed fixes (tolerant readCapture, Node redirect-hop guard, applied 60 s cap, refusal of a cap-tripped capture), and out-of-window BUG-172/BUG-127 move further from the ACs, so a code_frozen grant would invent behaviour rather than port it. The ACs are rewritten to the code as landed; clauses where the tip later diverges are retired rather than asserted either way.

- **ACs retired or rewritten**: acceptance_criterion-2b82c3cf, acceptance_criterion-d553d8fb, acceptance_criterion-7db0225c, acceptance_criterion-b4af8127, acceptance_criterion-e4c4d77e, acceptance_criterion-26d0ac51
- **Failing tests covered**: test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time, test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_refuses_unknown, test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing, test_UAT_AC2048_every_request_is_guarded_refused_ones_never_sent_and_reported, test_UAT_AC2049_redirect_cap_counts_hops_not_subresource_origins, test_UAT_AC2050_byte_and_time_budgets_abandon_the_capture_in_both_hosts
- **Tip evidence** (read at `reconcile-src-BUNDLE-32`):
  - `tools/generate/src/cli/capture/bundle.ts` lines 95-99
  - `tools/generate/src/cli/ai/fidelity-core.ts` lines 245-253
  - `tools/generate/src/cli/ai/fidelity-core.ts` lines 309-357
  - `tools/generate/src/cli/capture/egress-guard.ts` lines 228-275
  - `tools/generate/src/cli/capture/playwright-driver.ts` lines 101-110
  - `tools/generate/src/cli/capture/cf-driver.ts` lines 231-232
  - `tools/generate/src/cli/capture/cf-driver.ts` lines 280-280
- **Intent** `REQ-157`: "`capture_site` is refused for private address space, over-large responses and redirect loops;"