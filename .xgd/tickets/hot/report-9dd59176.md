---
uid: report-9dd59176
id: REPORT-6789
type: report
title: 'Report: fix_plan for story-58b2cec4'
created_by: xgd
created_at: '2026-10-27T20:13:02.889849+00:00'
updated_at: '2026-10-27T20:13:02.889849+00:00'
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
    - every picture is named one way, and resolves to what it names test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found
    - a screenshot reaches the model as an image test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead
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
      string (so the model gets base64 as text and withoutImageData, which only strips
      arrays, passes the bytes to SSE), and workerHost never receives fidelity deps
      (so the Worker offers no looking operation); AC-2028/AC-2033 separately over-specified
      refusal codes and a revision existence check that neither this branch nor the
      tip has, and the planner has rewritten those ACs to the running behaviour.
    instructions: 'Two parts, one batch. PART A (code_frozen granted for the five
      production files named in the override, for AC2031/AC2034/AC2025 only): port
      exactly the two behaviours xgd-working''s tip (052b5e8d5e) already has from
      REQ-206. (1) Image blocks: add contentBlocksFrom(payload) next to the existing
      isContentBlocks in this branch''s fidelity-core.ts, as at tip fidelity-core.ts
      150-198 (it recovers the block array from the Toolbox''s rendered text only
      when that text parses to an array of {type} blocks containing an image; anything
      else returns null). Apply it where this branch''s host-core.ts registers tools
      as box.run(name, input) (around host-core.ts:520), on the non-refused path only,
      returning `contentBlocksFrom(payload) ?? payload` as tip host-core.ts 2995-3006
      does. Do NOT port the tip''s BUG-256 repeated-refusal tracking that sits in
      the same function. withoutImageData (host-core.ts:861) already strips arrays,
      so AC2034 should pass once the result is an array; leave it alone unless the
      test proves otherwise. No second, ungated dispatch path for image operations;
      refusals stay text. (2) Worker composition: give this branch''s workerHost (ai.ts:163)
      a trailing `fidelity: HostDeps[''fidelity''] = null` parameter passed straight
      into the host deps (tip ai.ts 515-524 and 844-848), and have its one caller
      (router.ts:145) build it per site from this branch''s existing shot.ts fidelityDeps(env,
      previewRenderer(store), references, origin, site, deps.launch ? {launch} : {})
      as tip router.ts 614-630 does. null stays the ordinary no-browser case. Do NOT
      port adopt, lowDetail, REQ-218 namespaces, REQ-208/REQ-219 image surfaces or
      anything else from the tip. Edit no AC2031/AC2034/AC2025 test: they already
      describe the intended behaviour. PART B (no production edits; code_frozen is
      NOT lifted for this part): the planner has already rewritten AC-2028 (acceptance_criterion-d1e65a2f)
      and AC-2033 (acceptance_criterion-87f0cadc) in place to the running behaviour,
      because neither this branch nor the tip carries PICTURE_INVALID/NOT_FOUND codes
      (PictureSourceError and PictureNotFoundError are plain Error subclasses, picture.ts
      197-211) or checks that a revision exists before shooting it, and REQ-157 demands
      neither. Read the two rewritten AC tickets and update test_UAT_AC2028 and test_UAT_AC2033
      in tests/reconciliation-assistant-looking-surface.test.ts to assert exactly
      them: keep the kind+field message, the browser-unused check, the unknown-reference
      refusal naming the reference and pointing at listing references, the byte counts,
      the 3 MiB ceiling, the narrower-viewport-or-compare advice, and the absence
      of image bytes; remove the code-token assertions and the revision:99 case. Do
      not add error codes or a revision check to production code. The worker suite
      needs the gitignored apps/control-app/src/generated/ copied into the worktree
      before it can load. All dependency tests must stay green, especially the no-browser
      absence ACs (AC2026/AC2027) and the REQ-146 worker-host tests (AC1404-AC1411).'
    override:
      rule: code_frozen
      justification: REQ-157 (request-3f8737f2) says a screenshot returns an image
        block carrying the bytes, that meta.output is stripped of image data before
        the event leaves streamPrompt, and (Both hosts) that the Worker composition
        root is apps/control-app/src/shot.ts. AC-2031, AC-2034 and AC-2025 state the
        same. The reconcile branch lacks both behaviours (builder report-5ed3d3ee
        observed the failures); the xgd-working tip implements them at the cited lines,
        and the tip's own comment names this exact defect (REQ-206). This ports tip
        behaviour only and invents nothing. The override does not cover AC-2028/AC-2033,
        which the planner aligned to the running code by rewriting the ACs.
      files:
      - tools/generate/src/cli/ai/host-core.ts
      - tools/generate/src/cli/ai/fidelity-core.ts
      - apps/control-app/src/ai.ts
      - apps/control-app/src/router.ts
      - apps/control-app/src/shot.ts
      tip_evidence:
      - file: tools/generate/src/cli/ai/fidelity-core.ts
        lines: 150-198
      - file: tools/generate/src/cli/ai/host-core.ts
        lines: 2995-3006
      - file: apps/control-app/src/ai.ts
        lines: 515-524
      - file: apps/control-app/src/ai.ts
        lines: 844-848
      - file: apps/control-app/src/router.ts
        lines: 614-630
      - file: apps/control-app/src/shot.ts
        lines: 173-180
      trust_boundary: true
    test_scope: test_UAT_AC2031_ or test_UAT_AC2034_ or test_UAT_AC2025_ or test_UAT_AC2028_
      or test_UAT_AC2033_ or test_UAT_AC2022_ or test_UAT_AC2023_ or test_UAT_AC2024_
      or test_UAT_AC2026_ or test_UAT_AC2027_ or test_UAT_AC2029_ or test_UAT_AC2030_
      or test_UAT_AC2032_ or test_UAT_AC2035_ or test_UAT_AC1057_ or test_UAT_AC1404_
      or test_UAT_AC1405_ or test_UAT_AC1406_ or test_UAT_AC1407_ or test_UAT_AC1408_
      or test_UAT_AC1409_ or test_UAT_AC1410_ or test_UAT_AC1411_ or test_UAT_AC1651_
      or test_UAT_AC1652_ or test_UAT_AC1653_
---

# Fix Plan — Iteration 2

## Hypothesis
Two defects that xgd-working's tip has already fixed (REQ-206) cause AC2031, AC2034 and AC2025 to fail. First, `box.run` flattens image blocks to untrusted-framed text, so the model gets base64 instead of an image and the operator stream gets the bytes. Second, `workerHost` is never given fidelity deps, so the Worker offers no looking operation. AC2028 and AC2033 fail for a different reason: their ACs require refusal codes (PICTURE_INVALID/NOT_FOUND) and a revision existence check that neither this branch nor the tip has.

## Analysis
- **History.** Iteration 1 (report-a5579bab) sent one batch with empty instructions. The builder (report-5ed3d3ee) made no edits and returned `blocked_by: code_frozen`, with a run-backed diagnosis of all five failures and a proposed four-part change: (a) image blocks, (b) error codes, (c) revision existence, (d) Worker wiring.
- **First iteration-2 plan rejected.** report-3e92e116 failed validation for two reasons:
  1. It ruled two ways on the single `code_frozen` request: a grant on batch 0 and aligned_to_tip on batch 1.
  2. The validator refused its `test_UAT_FC_REQ-…_` / `test_UAT_FC_BUG-38_` selectors.

  This plan fixes both. It makes a single ruling (a grant). AC-2028 and AC-2033 are brought to the running code as planner spec changes, which reconcile mode allows because the code is authoritative. Dependency tests are expressed as AC tokens only, as the code_frozen grant requires. I checked that every token has a test in the repo.
- **Each part re-checked against the current xgd-working tip (052b5e8d5e; the earlier plan cited 738205b556):**
  - **(a) Image blocks: at the tip.** fidelity-core.ts 150-198 has `contentBlocksFrom` with a comment naming this exact defect. host-core.ts 2995-3006 has `runTool` returning `contentBlocksFrom(payload) ?? payload`. `withoutImageData` already exists on this branch and strips arrays, so AC2034 follows from (a).
  - **(d) Worker wiring: at the tip.** ai.ts 515-524 adds the `fidelity` parameter (null is ordinary) and 844-848 passes it into the host deps. router.ts 614-630 builds `fidelityDeps(...)` per site. shot.ts 173-180 has the `fidelityDeps` export.
  - **(b) Error codes: not at the tip.** `PictureNotFoundError` and `PictureSourceError` are plain `Error` subclasses (picture.ts 198, 206). `git grep PICTURE_INVALID` on the tip finds no production match.
  - **(c) Revision existence: not at the tip.** Nothing checks that a revision exists before it is shot.
  - **REQ-157 (request-3f8737f2).** It demands (a) and (d). It names neither an error code nor a revision existence check.
- **Isolation.** The failures are deterministic behaviour gaps, not contamination.

## Spec Changes Made
- AC-2028 (acceptance_criterion-d1e65a2f) rewritten in place:
  - Kept: an incomplete picture is refused with a message naming the kind and the missing field, and no browser is used.
  - Kept: a reference with no stored screenshot is refused with a message naming the reference and pointing at listing references.
  - Kept: no image is returned.
  - Dropped: the PICTURE_INVALID/NOT_FOUND code tokens and the unknown-revision clause.
- AC-2033 (acceptance_criterion-87f0cadc) rewritten in place: dropped "PICTURE_INVALID-class"; everything else kept (no image, byte size, 3 MiB ceiling, narrower-viewport-or-compare advice).
- Each AC carries a one-line note pointing at this report.

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-assistant-looking-surface.test.ts::test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found` — weak-observation — the `revision: 99` case uses a fake browser that answers every URL, so it could never observe a real preview 404. If revision absence is ever specified, assert it against the preview route, not the browser double.
- `tests/reconciliation-assistant-looking-surface-worker.workers.test.ts::test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft` — infra-reuse-gap — the suite cannot load without the gitignored `apps/control-app/src/generated/` copied in. A shared setup that fails with a named error would be clearer than an opaque load failure.

## Batches
- **One batch, all five failures.** AC2031, AC2034 and AC2033 share one test file and the same screenshot path.
  - Part A ports the tip's image-block recovery and Worker fidelity wiring under the code_frozen grant.
  - Part B updates the AC2028/AC2033 tests to the rewritten ACs, with no production edits.
- **Dependency tests:**
  - this story's passing ACs (AC2022-2024, 2026, 2027, 2029, 2030, 2032, 2035);
  - the completed stories' ACs that drive host-core or the Worker host (AC1057, AC1404-1411, AC1651-1653).

## Mode overrides (REQ-892)
- **Batch 0, rule `code_frozen`.**
  - **Files:** tools/generate/src/cli/ai/host-core.ts, tools/generate/src/cli/ai/fidelity-core.ts, apps/control-app/src/ai.ts, apps/control-app/src/router.ts, apps/control-app/src/shot.ts.
  - **Justification:** REQ-157 and AC-2031/2034/2025 demand three things: an image block to the model, an image-free operator stream, and Worker composition. The tip implements all three at the cited lines, so this is a port only.
  - **trust_boundary: true**, because `contentBlocksFrom` drops the untrusted provenance framing around an image result, as it does at the tip.
  - **Not granted:** the builder's parts (b) and (c). The tip lacks them, so the ACs were aligned to the code instead.

## Arbitration of last resort (BUG-1462)
- **Resolved by tier 3** (xgd-working's current tip), split per proposed change.
  - Where the tip has the behaviour ((a), (d)), the code is ported and the tests are unchanged.
  - Where it lacks the behaviour ((b), (c)), the ACs and tests follow the running code. Here that is the same as the tip.
- **Evidence:** the cited tip line ranges, plus the builder's run-observed refusal text on this branch.
- **Caveat for review:** I did not run the suite at the tip.
