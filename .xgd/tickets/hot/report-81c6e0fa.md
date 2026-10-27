---
uid: report-81c6e0fa
id: REPORT-6810
type: report
title: 'Report: fix_plan for story-31204812'
created_by: xgd
created_at: '2026-10-27T21:46:34.684685+00:00'
updated_at: '2026-10-27T21:46:34.684685+00:00'
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
    - tests/test_reconciliation_capture_site_egress.test.ts > test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time
    - tests/test_reconciliation_capture_site_egress.test.ts > test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_refuses_unknown
    - tests/test_reconciliation_capture_site_egress.test.ts > test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing
    - tests/test_reconciliation_capture_site_egress.test.ts > test_UAT_AC2048_every_request_is_guarded_refused_ones_never_sent_and_reported
    - tests/test_reconciliation_capture_site_egress.test.ts > test_UAT_AC2049_redirect_cap_counts_hops_not_subresource_origins
    - tests/test_reconciliation_capture_site_egress.test.ts > test_UAT_AC2050_byte_and_time_budgets_abandon_the_capture_in_both_hosts
    dependency_tests:
    - tests/test_reconciliation_capture_site_egress.test.ts > test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals
    - tests/test_reconciliation_capture_site_egress.test.ts > test_UAT_AC2051_capture_site_audit_record_carries_url_and_refusal_is_refused
    - tests/test_reconciliation_capture_site_egress.test.ts > test_UAT_AC2052_capture_results_are_untrusted_and_the_surface_says_why
    - tests/test_reconciliation_capture_site_egress.test.ts > test_UAT_AC2053_capture_site_leaves_counter_definition_and_journal_unchanged
    - tests/test_UAT_FC_REQ-157_fidelity_surface.test.ts
    hypothesis: AC2045-AC2050 were written to REQ-157's stated intent and the story's
      own 'Code issues' list, not to the code that landed; the production code (in
      the window and at the xgd-working tip) does not implement the null/NOT_FOUND
      fallbacks, Node redirect-hop guarding, the 60 s cap, a Node byte cap, or refusal
      of a tripped capture, so the ACs and tests must be aligned to the code rather
      than the code changed.
    instructions: 'RULING: the builder''s code_frozen request (report-ecdedc3f) is
      NOT granted; the batch is ruled aligned_to_tip. Its proposed fixes are new behaviour
      that the xgd-working tip does not have either (tip bundle.ts:96-100 still throws
      on a missing record; tip playwright-driver.ts:115-147 still guards only via
      page.route; tip egress-guard.ts:157-170 removed the byte cap entirely (BUG-172)
      and still never applies MAX_CAPTURE_MS; tip fidelity-core.ts:487-498 refuses
      only when the main document was refused). A code_frozen override can only port
      tip behaviour, so it cannot be granted. Edit tests, AC tickets and the story
      only; no production file. Run with `npx vitest run --config vitest.node.config.mts
      tests/test_reconciliation_capture_site_egress.test.ts` (a direct run today gives
      6 failed / 4 passed; the suite-level ''executed 0 tests'' signature is a reporting
      artefact of the scoped full-suite run, not a separate failure). Align each AC
      (rewrite it in place, adding a one-line note pointing at this fix_plan report)
      and its test to what the code under test does. AC2045 (acceptance_criterion-2b82c3cf):
      list_references returns {bundle,url,capturedAt} from each bundle''s capture
      record. Retire the ''null for a bundle without a record'' clause, because readCapture
      (bundle.ts:95-99) throws first (fidelity-core.ts:352). Drop that case from the
      test; do not assert the throw. AC2046 (acceptance_criterion-d553d8fb): an unknown
      name is an error that names the bundle and says it has no capture record ("Bundle
      ''<name>'' has no capture.json."), not PictureNotFoundError/NOT_FOUND (fidelity-core.ts:245-253
      is unreachable). AC2047 (acceptance_criterion-7db0225c): for scheme and credential
      refusals, REFUSED names the refused scheme or the reason rather than echoing
      the URL. The code deliberately never echoes a credentialed URL; keep the literal-URL
      check for address-space refusals. AC2048 (acceptance_criterion-b4af8127): the
      Worker driver checks every request including each redirect hop (cf-driver.ts:231-232).
      The Node driver checks every request its page.route seam sees, i.e. the navigation
      and every subresource (playwright-driver.ts:101-110). Playwright does not route
      redirect hops, so a Node redirect hop is not checked. State that in the AC and
      the story as a known limitation next to the DNS-rebinding non-goal. Remove the
      Node redirect-hop assertion; never assert that the forward to the private address
      happens. AC2049 (acceptance_criterion-e4c4d77e): the window code counts distinct
      origins over ALL allowed requests, latches, and refuses every later request
      with reason redirect-cap (egress-guard.ts:234-261). Rewrite the AC to what both
      window and tip agree on: a redirect chain through more than 5 distinct hosts
      is refused with reason redirect-cap and reported in refusals (on the Worker
      host, which sees hops). Retire the ''subresource origins are not hops'' clause;
      out-of-window BUG-127 changes it later and will be reconciled with that intent.
      AC2050 (acceptance_criterion-26d0ac51): retire the 60 s clause (MAX_CAPTURE_MS
      is declared at egress-guard.ts:72 and applied nowhere, here or at the tip) and
      the Node byte-cap clause. The surviving behaviour: on the Worker host, response
      bytes are recorded (cf-driver.ts:280); past 32 MiB the guard trips with reason
      response-cap and refuses every later request (egress-guard.ts:246,264-273);
      capture_site still returns the bundle with the trip listed in refusals (fidelity-core.ts:324-333).
      Assert that, and note in the AC that out-of-window BUG-172 later removes the
      byte cap. Retitle the AC2048-2050 describe/it names to match the rewritten ACs
      while keeping the test_UAT_AC<N>_ prefixes. Update STORY-159''s body: move ''Code
      issues'' 1-4 and the Node redirect-hop gap into a ''Known gaps (aligned to code,
      see fix_plan iteration 2)'' section, so the operator can file the SSRF fixes
      explicitly. Keep AC2044 and AC2051-2053 and the REQ-157 fidelity-surface UATs
      green. Add no skips and weaken no assertion beyond the clauses this ruling retires.'
    test_scope: test_UAT_AC2044_ or test_UAT_AC2045_ or test_UAT_AC2046_ or test_UAT_AC2047_
      or test_UAT_AC2048_ or test_UAT_AC2049_ or test_UAT_AC2050_ or test_UAT_AC2051_
      or test_UAT_AC2052_ or test_UAT_AC2053_ or test_UAT_FC_REQ-157_
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: aligned_to_tip
      reason: 'REQ-157 owns these ACs and is the only in-window intent on this surface.
        No later in-window intent requires the behaviour, so intent order does not
        settle the conflict, and xgd-working decides it. Neither the window code nor
        the tip implements the builder''s proposed fixes: no tolerant readCapture,
        no Node redirect-hop guard, no applied 60 s cap, no refusal of a cap-tripped
        capture. The later out-of-window intents move further from the ACs: BUG-172
        deletes the byte cap, and BUG-127 refuses only a refused main document. So
        a code_frozen grant would invent behaviour rather than port it. The ACs are
        rewritten to the code as landed. Where the tip later diverges (BUG-127 per-chain
        hops, BUG-172 no byte cap), the clause in dispute is retired rather than asserted
        either way.'
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

# Fix Plan — Iteration 2

## Hypothesis
The six failing UATs in `tests/test_reconciliation_capture_site_egress.test.ts` (AC2045 to AC2050) were written to REQ-157's intent and to the story's own "Code issues" list, not to the code that landed. Neither the window code nor the xgd-working tip implements what they assert, so the ACs and tests must be aligned to the code. The production code stays as it is.

## Analysis
- **Failure signature.** The scoped quality report (report-6734c008) shows the "javascript-vitest executed 0 tests" signature. It is a reporting artefact. A direct `npx vitest run --config vitest.node.config.mts tests/test_reconciliation_capture_site_egress.test.ts` gives 6 failed / 4 passed, which matches the iteration-1 builder.
- **Iteration 1.** report-e63d5b68 was an empty plan with no hypothesis. The builder (report-b6bb201d) made no edits and filed `blocked_by: code_frozen` (report-ecdedc3f), proposing five production changes.
- **Tip check (BUG-1462 tier 3 / REQ-892 condition 3).** None of the proposed production changes exists at the xgd-working tip:
  - Tip `bundle.ts:96-100` still throws on a missing `capture.json`.
  - Tip `playwright-driver.ts:115-147` still guards only via `page.route`, which does not see redirect hops.
  - Tip `egress-guard.ts:157-170` deletes the byte cap outright (BUG-172) and still applies `MAX_CAPTURE_MS` nowhere.
  - Tip `fidelity-core.ts:487-498` refuses a capture only when the main document was refused (BUG-127), not when a cap tripped.
  - The tip does move from origin-counting to per-chain hop counting (BUG-127). BUG-127 and BUG-172 are outside this bundle's window.
- **Intent order (REQ-904).** REQ-157 is the only in-window intent on this surface and owns the ACs. No later in-window intent requires the behaviour, so step 2 applies: the code decides.
- **No production-code issue remains** for this batch once the ACs are aligned. The test-only part of the builder's proposal (item 5, AC2047's literal-URL check) is kept.

## Spec Changes Made
None by the planner. The builder rewrites AC2045, AC2046, AC2047, AC2048, AC2049 and AC2050 in place under the ruling below, and updates STORY-159's body. The batch instructions give the change for each AC.

## Weak Evidence Flags (preventative — best effort)
- `test_UAT_AC2044_capture_site_returns_name_address_counts_and_refusals`: weak-observation. If it checks only that `refusals` is an array, also assert that a known refused subresource is listed with its reason.
- `suite: javascript-vitest` scoped run: infra. The scoped full-suite run reported total=0 with exit 1 while the file itself runs 10 tests. This is a possible XGD quality-runner parse defect worth an operator look, and it is not this story's code.

## Batches
One batch. All six failures are in one test file and share one root cause (the ACs and the code disagree), so it is not split. AC2044, AC2051-2053 and the REQ-157 fidelity-surface UATs are dependency tests because they touch the same guard and `capture_site` path.

## Superseded blocked_by request (BUG-1535)
Not used. The ruling is aligned_to_tip; see below.

## Arbitration of last resort (BUG-1462)
Root cause: the ACs assert intended SSRF and budget behaviour that the code never implemented. Resolved at tier 3 (xgd-working tip), applied through the REQ-904 `aligned_to_tip` ruling on the builder's `code_frozen` request. The request is **not granted**, because a code_frozen override may only port tip behaviour and the tip lacks every proposed fix.

Where the tip itself diverges from the window code, the clause in dispute is retired rather than asserted:
- **AC2049:** "subresource origins are not hops" (BUG-127, per-chain hop counting).
- **AC2050:** the Node byte cap and the 60 s time cap (BUG-172 removed the byte cap).

**Operator note: these are real SSRF and budget gaps, left as code.** STORY-159 will record them as known gaps, and each needs an explicit fix ticket:
1. A Node redirect hop is not checked, so a public page can redirect to a private address.
2. No capture time limit is applied.
3. A capture whose guard tripped is still adopted as a reference.
4. A record-less bundle breaks `list_references`.
