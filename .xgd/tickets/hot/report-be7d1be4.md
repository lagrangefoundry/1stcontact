---
uid: report-be7d1be4
id: REPORT-6790
type: report
title: 'Report: mode_override for story-58b2cec4'
created_by: xgd
created_at: '2026-10-27T20:15:01.055701+00:00'
updated_at: '2026-10-27T20:15:01.055701+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: story-58b2cec4
  anchor_ticket: bundle-5607a08d
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-9dd59176
  quality_mode: reconcile
  justification: REQ-157 (request-3f8737f2) says a screenshot returns an image block
    carrying the bytes, that meta.output is stripped of image data before the event
    leaves streamPrompt, and (Both hosts) that the Worker composition root is apps/control-app/src/shot.ts.
    AC-2031, AC-2034 and AC-2025 state the same. The reconcile branch lacks both behaviours
    (builder report-5ed3d3ee observed the failures); the xgd-working tip implements
    them at the cited lines, and the tip's own comment names this exact defect (REQ-206).
    This ports tip behaviour only and invents nothing. The override does not cover
    AC-2028/AC-2033, which the planner aligned to the running code by rewriting the
    ACs.
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
  external_cause: null
  planner_trust_boundary: true
  granted_head: 401d2f4628a1e62f2cd752bd0e282b20301ef788
---

# Mode override granted: code_frozen

REQ-157 (request-3f8737f2) says a screenshot returns an image block carrying the bytes, that meta.output is stripped of image data before the event leaves streamPrompt, and (Both hosts) that the Worker composition root is apps/control-app/src/shot.ts. AC-2031, AC-2034 and AC-2025 state the same. The reconcile branch lacks both behaviours (builder report-5ed3d3ee observed the failures); the xgd-working tip implements them at the cited lines, and the tip's own comment names this exact defect (REQ-206). This ports tip behaviour only and invents nothing. The override does not cover AC-2028/AC-2033, which the planner aligned to the running code by rewriting the ACs.

Planner instructions for the batch:

Two parts, one batch. PART A (code_frozen granted for the five production files named in the override, for AC2031/AC2034/AC2025 only): port exactly the two behaviours xgd-working's tip (052b5e8d5e) already has from REQ-206. (1) Image blocks: add contentBlocksFrom(payload) next to the existing isContentBlocks in this branch's fidelity-core.ts, as at tip fidelity-core.ts 150-198 (it recovers the block array from the Toolbox's rendered text only when that text parses to an array of {type} blocks containing an image; anything else returns null). Apply it where this branch's host-core.ts registers tools as box.run(name, input) (around host-core.ts:520), on the non-refused path only, returning `contentBlocksFrom(payload) ?? payload` as tip host-core.ts 2995-3006 does. Do NOT port the tip's BUG-256 repeated-refusal tracking that sits in the same function. withoutImageData (host-core.ts:861) already strips arrays, so AC2034 should pass once the result is an array; leave it alone unless the test proves otherwise. No second, ungated dispatch path for image operations; refusals stay text. (2) Worker composition: give this branch's workerHost (ai.ts:163) a trailing `fidelity: HostDeps['fidelity'] = null` parameter passed straight into the host deps (tip ai.ts 515-524 and 844-848), and have its one caller (router.ts:145) build it per site from this branch's existing shot.ts fidelityDeps(env, previewRenderer(store), references, origin, site, deps.launch ? {launch} : {}) as tip router.ts 614-630 does. null stays the ordinary no-browser case. Do NOT port adopt, lowDetail, REQ-218 namespaces, REQ-208/REQ-219 image surfaces or anything else from the tip. Edit no AC2031/AC2034/AC2025 test: they already describe the intended behaviour. PART B (no production edits; code_frozen is NOT lifted for this part): the planner has already rewritten AC-2028 (acceptance_criterion-d1e65a2f) and AC-2033 (acceptance_criterion-87f0cadc) in place to the running behaviour, because neither this branch nor the tip carries PICTURE_INVALID/NOT_FOUND codes (PictureSourceError and PictureNotFoundError are plain Error subclasses, picture.ts 197-211) or checks that a revision exists before shooting it, and REQ-157 demands neither. Read the two rewritten AC tickets and update test_UAT_AC2028 and test_UAT_AC2033 in tests/reconciliation-assistant-looking-surface.test.ts to assert exactly them: keep the kind+field message, the browser-unused check, the unknown-reference refusal naming the reference and pointing at listing references, the byte counts, the 3 MiB ceiling, the narrower-viewport-or-compare advice, and the absence of image bytes; remove the code-token assertions and the revision:99 case. Do not add error codes or a revision check to production code. The worker suite needs the gitignored apps/control-app/src/generated/ copied into the worktree before it can load. All dependency tests must stay green, especially the no-browser absence ACs (AC2026/AC2027) and the REQ-146 worker-host tests (AC1404-AC1411).
