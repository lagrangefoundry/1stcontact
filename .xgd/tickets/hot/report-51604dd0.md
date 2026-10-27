---
uid: report-51604dd0
id: REPORT-6811
type: report
title: 'Report: fix_plan for story-31204812'
created_by: xgd
created_at: '2026-10-27T21:52:14.421026+00:00'
updated_at: '2026-10-27T21:52:14.421026+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-31204812
  fix_iteration: 2
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
      applied 60 s cap, no Node byte cap, no refusal of a cap-tripped capture), and
      the suite-level '0 tests' signature is an infra artefact of this worktree lacking
      generated/, which hides the six per-test failures.
    instructions: 'FIRST, infra: this worktree has no generated/ directory, and without
      it every Workers test file fails to load, so the scoped run exits 1 having parsed
      0 tests (''suite: javascript-vitest''). Copy generated/ in from the main checkout
      (it is untracked build output, not a source edit) before running anything. Then
      verify with `npx vitest run --config vitest.node.config.mts tests/test_reconciliation_capture_site_egress.test.ts`
      (today: 6 failed / 4 passed). RULING on the builder''s code_frozen request (report-ecdedc3f):
      NOT granted, ruled aligned_to_tip. The tip lacks every proposed fix (tip bundle.ts
      still throws on a missing record; tip playwright-driver.ts guards only via page.route;
      tip egress-guard.ts removed the byte cap (BUG-172) and never applies MAX_CAPTURE_MS;
      tip fidelity-core.ts refuses only when the main document was refused). Edit
      only tests/test_reconciliation_capture_site_egress.test.ts, the six AC tickets
      and STORY-159; touch no production file. Rewrite each AC in place, with a one-line
      note pointing at this fix_plan report, and align its test to the code. AC2045
      (acceptance_criterion-2b82c3cf): list_references returns {bundle,url,capturedAt}
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
      fix_plan iteration 2)'' section so the operator can file explicit SSRF/budget
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
---

# Fix Plan — Iteration 2 (resubmitted after validator rejection)

## Hypothesis
AC2045–AC2050 assert REQ-157's stated SSRF and budget intent rather than the code that landed, so the ACs and tests must be aligned to the code. Separately, the suite-level "executed 0 tests" signature is an infra artefact: this worktree has no `generated/`, so the Workers test files fail to load and the six per-test failures never surface.

## Analysis
- **Why the first submission was rejected.** It failed on form, not substance:
  - `dependency_tests` used `file > name` ids, which are not exact selectors.
  - `test_UAT_FC_REQ-157_` was rejected, and it was also wrong: the real tests are named `test_UAT_FC_REQ_157_…`, with an underscore.
  - The item's `tests` used `file > name` ids while `blocked_by_ruling.tests` used bare names, so the ruling's tests did not match the batch's failure list.
- **What this resubmission changes.**
  - `tests`, `blocked_by_ruling.tests` and `dependency_tests` all use bare full test names.
  - The batch keeps `suite: javascript-vitest`, which is the recorded failure.
  - The REQ-157 dependencies are the five guard-related UATs, named in full.
- **Failure signature.** REPORT-6806 recorded total=0 and exit 1, and REQ-160 tests were collected and skipped. Run directly, the target file gives 6 failed / 4 passed. `generated/` is absent from this worktree, which is a known cause of every Workers test failing in 1stcontact worktrees. The batch instructions now tell the builder to copy it in first.
- **Substance.** Unchanged from the earlier iteration-2 plan (report-81c6e0fa). The quoted REQ-157 sentence is verbatim at request-3f8737f2.md:145. All ten test names exist in `tests/test_reconciliation_capture_site_egress.test.ts`.

## Spec Changes Made
None by the planner. The builder rewrites AC2045–AC2050 in place and updates STORY-159 under the ruling.

## Weak Evidence Flags (preventative — best effort)
- test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals — weak-observation — assert that a known refused subresource appears in `refusals` with its reason, not only that `refusals` is an array.
- suite: javascript-vitest — infra — the quality runner reports total=0 when one file fails to load (missing `generated/`). Worth an operator look at the parser and at worktree setup.

## Batches
One batch. All six failures are in one test file and share one root cause (the ACs disagree with the code). AC2044, AC2051–2053 and the five REQ-157 guard UATs are dependency tests on the same guard and `capture_site` path. `it()` names stay unchanged so the scope and the ruling stay traceable.

## Arbitration of last resort (BUG-1462)
- **Root cause.** The ACs assert intended SSRF and budget behaviour that was never implemented.
- **How it was resolved.** At tier 3 (the xgd-working tip), via a REQ-904 `aligned_to_tip` ruling on the builder's `code_frozen` request (report-ecdedc3f). The override is denied because the tip lacks every proposed fix, and a `code_frozen` override may only port tip behaviour.
- **Retired clauses.** Where the tip itself diverges, the disputed clause is retired:
  - AC2049: the per-chain hops change (BUG-127).
  - AC2050: the byte cap (BUG-172) and the 60 s cap.

**Operator: these are real gaps left in the code.** Each needs an explicit fix ticket:
1. A Node redirect hop is not checked, so a capture can be redirected to a private address (server-side request forgery).
2. No capture time limit is applied.
3. A capture whose guard tripped is still adopted as a reference.
4. A bundle with no capture record breaks `list_references`.
