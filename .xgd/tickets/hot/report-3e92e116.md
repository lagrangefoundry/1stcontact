---
uid: report-3e92e116
id: REPORT-6788
type: report
title: 'Report: fix_plan for story-58b2cec4'
created_by: xgd
created_at: '2026-10-27T20:05:40.537369+00:00'
updated_at: '2026-10-27T20:05:40.537369+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-58b2cec4
  fix_iteration: 2
  items:
  - index: 0
    tests:
    - a screenshot reaches the model as an image test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn
    - a screenshot reaches the model as an image test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes
    - a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft
    dependency_tests:
    - test_UAT_AC2022_
    - test_UAT_AC2023_
    - test_UAT_AC2024_
    - test_UAT_AC2026_
    - test_UAT_AC2027_
    - test_UAT_AC2029_
    - test_UAT_AC2030_
    - test_UAT_AC2032_
    - test_UAT_AC2035_
    - test_UAT_FC_REQ-157_
    - test_UAT_FC_REQ-146_
    - test_UAT_FC_REQ-123_
    - test_UAT_FC_REQ-174_
    - test_UAT_FC_BUG-38_
    - test_UAT_AC1057_
    - test_UAT_AC1404_
    - test_UAT_AC1405_
    - test_UAT_AC1406_
    - test_UAT_AC1407_
    - test_UAT_AC1408_
    - test_UAT_AC1409_
    - test_UAT_AC1410_
    - test_UAT_AC1411_
    - test_UAT_AC1651_
    - test_UAT_AC1652_
    - test_UAT_AC1653_
    hypothesis: host-core registers every tool as box.run(name,input), whose Toolbox
      contract renders the screenshot's [text,image] block array to an untrusted-framed
      string, so the model gets base64 as text and withoutImageData (which only strips
      arrays) passes the bytes to SSE; separately workerHost in apps/control-app/src/ai.ts
      never receives fidelity deps, so the Worker offers no looking operation.
    instructions: 'Grant: code_frozen is lifted for this batch only, to port two behaviours
      xgd-working''s tip already has (REQ-206 found and fixed the same defect). (1)
      Image blocks: at the tip, fidelity-core.ts exports contentBlocksFrom(payload)
      (tip lines 136-198), which recovers the block array from the Toolbox''s rendered
      text only when it is a JSON array of {type} blocks containing an image, and
      host-core.ts runTool returns `contentBlocksFrom(payload) ?? payload` for a non-refused
      result (tip lines 2995-3006). Port exactly that: add contentBlocksFrom next
      to the existing isContentBlocks in this branch''s fidelity-core.ts and apply
      it where this branch''s host-core registers tools as box.run(name, input) (around
      host-core.ts:520), only on the non-refused path. withoutImageData (host-core.ts:861)
      already strips arrays, so AC2034 should pass once the result is an array again;
      do not change it unless the test shows otherwise. Do not add a second, ungated
      dispatch path for image operations. Refusals must stay text. (2) Worker composition:
      at the tip, router.ts assembles fidelityDeps(env, previewRenderer(store), references,
      origin, site, deps.launch ? {launch} : {}) per site (tip router.ts 614-630)
      and passes it into the Worker host, where the `fidelity: HostDeps[''fidelity'']
      = null` parameter (tip ai.ts 518-524) goes straight into the host deps (tip
      ai.ts 846-848), and null stays the normal case when there is no browser binding.
      Port that shape into this branch''s workerHost (ai.ts:163) and its one caller
      (router.ts:145), using this branch''s existing shot.ts fidelityDeps export.
      Do not port any other tip behaviour (no adopt, no REQ-218 namespaces, no image-edit
      surface). The worker suite needs the gitignored apps/control-app/src/generated/
      copied into the worktree before it can load. Edit no test or AC: the three tests
      already describe the intended behaviour. All dependency tests must stay green,
      especially the no-browser absence ACs (AC2026/AC2027 area) and the REQ-146 worker
      host tests.'
    override:
      rule: code_frozen
      justification: REQ-157 (request-3f8737f2) says a screenshot returns 'an image
        block carrying the bytes', that `meta.output` is stripped of image data before
        the event leaves streamPrompt, and under 'Both hosts' that the Worker composition
        root is apps/control-app/src/shot.ts ('In the cloud the assistant has none'
        is the problem it exists to fix). AC-2031, AC-2034 and AC-2025 state the same.
        The reconcile branch lacks both behaviours, and the xgd-working tip implements
        them at the cited lines. This ports tip behaviour; it invents nothing.
      files:
      - tools/generate/src/cli/ai/host-core.ts
      - tools/generate/src/cli/ai/fidelity-core.ts
      - apps/control-app/src/ai.ts
      - apps/control-app/src/router.ts
      - apps/control-app/src/shot.ts
      tip_evidence:
      - file: tools/generate/src/cli/ai/fidelity-core.ts
        lines: 136-198
      - file: tools/generate/src/cli/ai/host-core.ts
        lines: 2995-3006
      - file: apps/control-app/src/ai.ts
        lines: 518-524
      - file: apps/control-app/src/ai.ts
        lines: 846-848
      - file: apps/control-app/src/router.ts
        lines: 614-630
      - file: apps/control-app/src/shot.ts
        lines: 173-200
      trust_boundary: true
    test_scope: test_UAT_AC2031_ or test_UAT_AC2034_ or test_UAT_AC2025_ or test_UAT_AC2022_
      or test_UAT_AC2023_ or test_UAT_AC2024_ or test_UAT_AC2026_ or test_UAT_AC2027_
      or test_UAT_AC2029_ or test_UAT_AC2030_ or test_UAT_AC2032_ or test_UAT_AC2035_
      or test_UAT_FC_REQ-157_ or test_UAT_FC_REQ-146_ or test_UAT_FC_REQ-123_ or test_UAT_FC_REQ-174_
      or test_UAT_FC_BUG-38_ or test_UAT_AC1057_ or test_UAT_AC1404_ or test_UAT_AC1405_
      or test_UAT_AC1406_ or test_UAT_AC1407_ or test_UAT_AC1408_ or test_UAT_AC1409_
      or test_UAT_AC1410_ or test_UAT_AC1411_ or test_UAT_AC1651_ or test_UAT_AC1652_
      or test_UAT_AC1653_
  - index: 1
    tests:
    - every picture is named one way, and resolves to what it names test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found
    - a screenshot reaches the model as an image test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead
    dependency_tests: []
    hypothesis: 'Neither this branch nor xgd-working''s tip gives PictureSourceError/PictureNotFoundError
      a declared code (both are plain Error subclasses, and the fidelity operations
      are installed on the Toolbox untranslated), so refusals render as ''Error: screenshot
      failed. <message>'' with no PICTURE_INVALID or NOT_FOUND token; and resolvePicture''s
      revision case builds the preview URL without checking that the revision exists,
      so AC-2028/AC-2033 assert codes and a revision existence check that the running
      code does not have.'
    instructions: 'Aligned to tip: no production edits in this batch. The tip refuses
      these pictures by message, not by declared code, and it does not check that
      a revision exists before shooting it. Rewrite AC-2028 (acceptance_criterion-d1e65a2f)
      and AC-2033 (acceptance_criterion-87f0cadc) in place to match, each with a one-line
      note pointing at this fix_plan report. AC-2028: an incomplete picture is refused,
      with a message naming both the kind and the missing field, and no browser is
      used; a reference naming a bundle the site does not hold is refused with a message
      naming the bundle and pointing at list_references; no image bytes appear in
      either refusal. Drop the ''unknown revision is refused with NOT_FOUND'' clause
      and the NOT_FOUND / PICTURE_INVALID code tokens. AC-2033: the refusal carries
      no image and states the byte size, the 3 MiB ceiling, and the narrower-viewport-or-compare
      advice; drop ''PICTURE_INVALID-class''. Then update the two tests to assert
      exactly the rewritten ACs: keep the kind/field/bundle text, the browser-unused
      check, the byte counts, the advice, and the absence of PNG base64. Remove the
      code-token assertions and the revision:99 case. Do not weaken anything else,
      and do not add assertions about behaviour the code lacks.'
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: aligned_to_tip
      reason: REQ-157 requires an over-ceiling picture to be refused and incomplete
        pictures to be refused by naming the field. It does not require a particular
        declared error code to appear in the refusal text, and it does not require
        a revision existence check in picture resolution. No later in-window intent
        requires either. At xgd-working's tip, PictureSourceError and PictureNotFoundError
        are plain Error subclasses with no code (picture.ts 197-211), the fidelity
        operations are installed on the Toolbox without the CommandError translation
        the L1 surface has (fidelity-core.ts 650-665, contrasting toolbox-core.ts
        321-336), and the revision case resolves without an existence check (picture.ts
        574-580). Granting code_frozen here would invent behaviour the tip lacks,
        so the ACs follow the tip.
      acs:
      - acceptance_criterion-d1e65a2f
      - acceptance_criterion-87f0cadc
      tests:
      - every picture is named one way, and resolves to what it names test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found
      - a screenshot reaches the model as an image test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead
      files:
      - tests/reconciliation-assistant-looking-surface.test.ts
      - .xgd/tickets/hot/acceptance_criterion-d1e65a2f.md
      - .xgd/tickets/hot/acceptance_criterion-87f0cadc.md
      tip_evidence:
      - file: tools/generate/src/cli/picture.ts
        lines: 197-211
      - file: tools/generate/src/cli/picture.ts
        lines: 574-580
      - file: tools/generate/src/cli/ai/fidelity-core.ts
        lines: 650-665
      intent:
        ticket: request-3f8737f2
        sentence: and is refused if it still exceeds a declared byte ceiling
    test_scope: test_UAT_AC2028_ or test_UAT_AC2033_
---

# Fix Plan — Iteration 2

## Hypothesis
The builder's code_frozen block is correct, and it splits by what xgd-working's tip does. Two defects the tip has already fixed (REQ-206): image blocks are flattened to text by `box.run`, and `workerHost` gets no fidelity dependencies. Those are ported under an override. Two AC demands the tip never implemented (declared PICTURE_INVALID/NOT_FOUND codes in the refusal text, and a revision existence check) are aligned to the tip.

## Analysis
- Iteration 1 sent one batch with empty instructions. The builder (report-5ed3d3ee) made no edits and came back `blocked_by: code_frozen`, with a run-backed diagnosis of all five failures and a four-part proposed change (a)-(d).
- I checked each part against xgd-working (738205b556):
  - (a) Image blocks: implemented at the tip. `fidelity-core.ts` `contentBlocksFrom` (136-198) and `host-core.ts` `runTool` returning `contentBlocksFrom(payload) ?? payload` (2995-3006). The tip's comment names this exact defect: the Toolbox renders a call to text, so the picture was described rather than shown. `withoutImageData` already exists on this branch and strips arrays, so AC2034 follows from (a).
  - (d) Worker wiring: implemented at the tip. `router.ts` 614-630 builds `fidelityDeps(...)` per site, and the `ai.ts` `fidelity` parameter (518-524) is passed into the host deps (846-848).
  - (b) Error codes: NOT at the tip. `PictureSourceError` and `PictureNotFoundError` are plain `Error` subclasses with no code (`picture.ts` 197-211). No `.ts` file at the tip maps them to PICTURE_INVALID or NOT_FOUND. FidelityToolbox installs the operations raw (650-665), unlike the L1 surface's `refusal()` translation (`toolbox-core.ts` 321-336).
  - (c) Revision existence: NOT at the tip. `picture.ts` 574-580 resolves `revision` straight to a preview URL with no check.
- REQ-157 (request-3f8737f2) demands (a) and (d) explicitly: "an image block carrying the bytes", "`meta.output` is stripped of image data", and the Worker composition root in "Both hosts". For refusals it asks only that a picture over the ceiling be refused and that incomplete pictures be refused by naming the field. It names no code token and no revision existence check. No later in-window intent requires either.
- Isolation: there is only one iteration of history, and the failures are deterministic behaviour gaps, not contamination.
- On "rules more than one way": these are two rulings on one `blocked_by` report, each covering a disjoint set of tests. The override covers the tests whose behaviour the tip has; aligned_to_tip covers the tests whose demanded behaviour the tip lacks. No test gets two rulings.

## Spec Changes Made
None by the planner. Batch 1 rewrites AC-2028 (acceptance_criterion-d1e65a2f) and AC-2033 (acceptance_criterion-87f0cadc) in place under the aligned_to_tip ruling.

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-assistant-looking-surface.test.ts::test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found — weak-observation — the `revision: 99` case uses a fake browser that answers every URL, so it could never observe a real preview 404. If revision absence is ever asserted, assert it against the preview route, not the browser double.
- tests/reconciliation-assistant-looking-surface-worker.workers.test.ts::test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft — infra-reuse-gap — the suite cannot load without the gitignored apps/control-app/src/generated/ being copied in. Consider a shared setup that fails with a named error instead of an opaque load failure.

## Batches
- Batch 0 (AC2031, AC2034, AC2025): port tip behaviour under a code_frozen override. Covers the image-block recovery at the host-core tool registration and the fidelity deps through workerHost and router. Dependency tests are this story's passing ACs plus every completed story's tests that drive host-core or the Worker host.
- Batch 1 (AC2028, AC2033): aligned_to_tip. Tests and ACs only; no production edits.
- The two batches edit disjoint files: batch 0 touches production only, batch 1 touches the test file and AC tickets only. Batch 0's behaviour doesn't change the refusal strings batch 1 asserts.

## Mode overrides (REQ-892)
- Batch 0, rule `code_frozen`, files: tools/generate/src/cli/ai/host-core.ts, tools/generate/src/cli/ai/fidelity-core.ts, apps/control-app/src/ai.ts, apps/control-app/src/router.ts, apps/control-app/src/shot.ts. Justification: REQ-157 and AC-2031/2034/2025 demand an image block to the model, image-free SSE, and Worker composition, and the tip implements all three at the cited lines. trust_boundary is true because `contentBlocksFrom` drops the untrusted provenance framing around an image result, as it does at the tip.

## Arbitration of last resort (BUG-1462)
Tier 3 (xgd-working's current tip) settled it, split per proposed change. Where the tip has the behaviour ((a) and (d)), the code is ported and the tests are unchanged. Where the tip lacks it ((b) and (c)), the ACs and tests follow the tip, via aligned_to_tip on batch 1. Evidence: the tip line ranges cited in both batch items. Caveat for review: I did not run the suite at the tip. The claim that the tip renders picture refusals without a code rests on the absence of any mapping in the tip's source, plus the same shared ToolboxSurface rendering the builder observed on this branch.
