---
uid: report-32f5ff75
id: REPORT-6919
type: report
title: 'Report: fix_plan for report-00553335'
created_by: xgd
created_at: '2026-10-30T20:56:35.526120+00:00'
updated_at: '2026-10-30T20:56:35.526120+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-00553335
  fix_iteration: 3
  items:
  - index: 0
    tests:
    - AC-2067 (orphaned acceptance criterion)
    - a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame
    - a picture keeps the untrusted-content frame on its way to the model test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame
    dependency_tests:
    - test_UAT_AC2022_
    - test_UAT_AC2023_
    - test_UAT_AC2024_
    - test_UAT_AC2025_
    - test_UAT_AC2026_
    - test_UAT_AC2027_
    - test_UAT_AC2028_
    - test_UAT_AC2029_
    - test_UAT_AC2030_
    - test_UAT_AC2031_
    - test_UAT_AC2032_
    - test_UAT_AC2033_
    - test_UAT_AC2034_
    - test_UAT_AC2035_
    hypothesis: contentBlocksFrom in tools/generate/src/cli/ai/fidelity-core.ts parses
      only the bracketed JSON array and discards the Toolbox untrusted frame text
      on either side, so screenshot blocks reach the model unframed; only code_frozen
      blocked the fix.
    instructions: The code_frozen block reported in report-1449ee72 is granted for
      tools/generate/src/cli/ai/fidelity-core.ts only. The AC-2067 tests are right
      and must not be changed back to assert the frame is absent. Change contentBlocksFrom
      so that, when the rendered payload has text before the JSON array and/or after
      it (the untrusted frame), that text is carried onto the recovered blocks, exactly
      as the second UAT specifies. Leading text is prepended to the first block when
      that block is text; otherwise it becomes its own leading text block. Trailing
      text is appended to the last block when that block is text; otherwise it becomes
      its own trailing text block. An unframed rendering comes back unchanged, a refusal
      still returns null, and the scan stays bracket-based rather than keyed to the
      marker spelling. Update the function doc comment, which currently says the frame
      is given up. host-core.ts:525 needs no change.
    test_scope: test_UAT_AC2067_ or test_UAT_AC2022_ or test_UAT_AC2023_ or test_UAT_AC2024_
      or test_UAT_AC2025_ or test_UAT_AC2026_ or test_UAT_AC2027_ or test_UAT_AC2028_
      or test_UAT_AC2029_ or test_UAT_AC2030_ or test_UAT_AC2031_ or test_UAT_AC2032_
      or test_UAT_AC2033_ or test_UAT_AC2034_ or test_UAT_AC2035_
    ladder:
      rung1: REQ-157 (in scope) requires that a captured page text never read as an
        instruction and screenshot is declared provenance untrusted; AC-2067 encodes
        this and was upheld by review report-b5be9c7c F1 and audit report-e1298f76,
        so rung 1 decides.
      rung2: At reconcile-src-BUNDLE-32 fidelity-core.ts:185-198 discards the frame
        and lines 178-184 document that as accepted; this disagrees but is outranked
        by rung 1.
      rung3: Tests stand; production code changes.
    override:
      rule: code_frozen
      rung: 1
      justification: REQ-157 (in scope) requires untrusted capture content never read
        as an instruction; AC-2067 requires recovered screenshot blocks keep the untrusted
        frame, and contentBlocksFrom is the sole point where the frame is dropped.
      files:
      - tools/generate/src/cli/ai/fidelity-core.ts
      tip_evidence:
      - file: tools/generate/src/cli/ai/fidelity-core.ts
        lines: 185-198
      trust_boundary: true
---

# Fix Plan — Iteration 3

## Hypothesis
`contentBlocksFrom` (tools/generate/src/cli/ai/fidelity-core.ts:142-155) parses only the JSON array between the first `[` and the last `]` and throws away the Toolbox's `<<<untrusted>>>` / `<<</untrusted>>>` frame on either side. As a result, a screenshot reaches the model unframed. This is a production defect, and the `code_frozen` rule is the only thing blocking the fix.

## Analysis
- Iteration 2 (report-234be966) re-batched the two AC-2067 UATs with empty instructions. The builder (report-1449ee72) correctly reported `blocked_by: code_frozen`. It diagnosed the cause precisely: `contentBlocksFrom` returns `parsed` and discards `payload.slice(0, open)` and `payload.slice(close+1)`, which hold the frame. Re-batching without a ruling would get the same stuck result, so this plan rules on the block.
- The tests are correct. An earlier version asserted that the frame was absent. Reconciliation review report-b5be9c7c F1 and override audit report-e1298f76 rejected that version, and AC-2067 was rewritten to require the frame. Going back to "frame absent" would repeat a fix that review threw out and would weaken a security assertion.
- "AC-2067 (orphaned acceptance criterion)" is the same failure seen from the matrix side. Its only UATs are the two failing tests in tests/reconciliation-assistant-looking-surface.test.ts, and the orphan clears once they pass. No separate action is needed.
- The only consumer of `contentBlocksFrom` is host-core.ts:525 (`contentBlocksFrom(payload) ?? payload`). Blast radius is therefore the looking-surface UATs (AC2022–AC2035) and the worker-side looking UAT (AC2025). These are listed as dependency_tests.
- This is not a cross-suite contamination problem: the tests fail deterministically both in isolation and in the full suite, for the reason above.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-assistant-looking-surface.test.ts::test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame — weak-observation risk is low, but the closing-marker case for a last block that is an image (not text) is not exercised — consider asserting the closing marker becomes its own trailing text block.

## Batches
One batch: the two AC-2067 UATs plus the AC-2067 orphan entry. They share one root cause in one function. The test_scope includes the looking-surface ACs that share host-core.ts:525 so that a regression in picture recovery is caught.

## Mode overrides (REQ-892)
- Batch 0: rule `code_frozen`, rung 1. Files: tools/generate/src/cli/ai/fidelity-core.ts. Justification: REQ-157, which is in scope, requires that "a captured page's text must never be able to read as an instruction", and `screenshot` is declared `provenance: untrusted`. AC-2067 was deliberately rewritten (after review report-b5be9c7c F1 and audit report-e1298f76) to require that recovered blocks keep the untrusted frame. The reference state's own comment says the frame is "given up" in the round trip; this override deliberately overturns that, by rung 1. trust_boundary: true.

## Resolution ladder (REQ-938)
- Batch 0 — decided at rung 1. REQ-157 (in scope) says third-party content from a capture must never read as an instruction, and the screenshot result is declared untrusted. AC-2067 encodes this, and two prior review rulings upheld it. Rung 2 points the other way: at reconcile-src-BUNDLE-32, fidelity-core.ts:185-198 discards the frame, and :178-184 documents that as accepted. But rung 1 decides first, so the code changes and the tests stand.
