---
uid: report-f2b243d0
id: REPORT-6934
type: report
title: 'Regression success: 1 caught (reconciliation)'
created_by: xgd
created_at: '2026-10-30T21:56:11.322416+00:00'
updated_at: '2026-10-30T21:56:11.322416+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: regression_success
  subject_uid: bundle-5607a08d
  cycle: reconciliation
  intent_uid: bundle-5607a08d
  regression_count: 1
  dropped_scope_members: []
  left_for_regression: []
  aligned_to_running_code:
  - subject_uid: story-31204812
    batch_index: 0
    acs:
    - acceptance_criterion-2b82c3cf
    - acceptance_criterion-d553d8fb
    - acceptance_criterion-7db0225c
    - acceptance_criterion-b4af8127
    - acceptance_criterion-e4c4d77e
    - acceptance_criterion-26d0ac51
    reason: REQ-157 owns these ACs and is the only in-window intent on this surface,
      so no later in-window intent orders the conflict in the ACs' favour; xgd-working's
      tip decides. Neither the window code nor the tip implements the builder's proposed
      fixes (tolerant readCapture, Node redirect-hop guard, applied 60 s cap, refusal
      of a cap-tripped capture), and out-of-window BUG-172/BUG-127 move further from
      the ACs, so a code_frozen grant would invent behaviour rather than port it.
      The ACs are rewritten to the code as landed; clauses where the tip later diverges
      are retired rather than asserted either way.
    intent_ticket: REQ-157
    intent_sentence: '`capture_site` is refused for private address space, over-large
      responses and redirect loops;'
    tip_ref: reconcile-src-BUNDLE-32
    tip_evidence:
    - tools/generate/src/cli/capture/bundle.ts:95-99
    - tools/generate/src/cli/ai/fidelity-core.ts:245-253
    - tools/generate/src/cli/ai/fidelity-core.ts:309-357
    - tools/generate/src/cli/capture/egress-guard.ts:228-275
    - tools/generate/src/cli/capture/playwright-driver.ts:101-110
    - tools/generate/src/cli/capture/cf-driver.ts:231-232
    - tools/generate/src/cli/capture/cf-driver.ts:280-280
---

[
  {
    "id": "reg-001",
    "capability_uid": "capability-00e77e55",
    "capability_name": "Site Control Surface: Declared, Granted, Validated & Audited",
    "story_uid": "story-58b2cec4",
    "ac_uid": "acceptance_criterion-827e8986",
    "ac_human_id": "AC-2067",
    "ac_summary": "A picture from an untrusted-provenance operation reaches the model inside the untrusted-content frame: the frame opens before the image and closes after it",
    "failing_uats": [
      "a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 3\n\n## Hypothesis\n`contentBlocksFrom` (tools/generate/src/cli/ai/fidelity-core.ts:142-155) parses only the JSON array between the first `[` and the last `]` and throws away the Toolbox's `<<<untrusted>>>` / `<<</untrusted>>>` frame on either side. As a result, a screenshot reaches the model unframed. This is a production defect, and the `code_frozen` rule is the only thing blocking the fix.\n\n## Analysis\n- Iteration 2 (report-234be966) re-batched the two AC-2067 UATs with em",
    "resolved": true,
    "description": null,
    "severity": null
  }
]