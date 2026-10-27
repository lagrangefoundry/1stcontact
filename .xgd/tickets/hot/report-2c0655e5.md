---
uid: report-2c0655e5
id: REPORT-6787
type: report
title: 'Report: blocked_by_handoff for story-58b2cec4'
created_by: xgd
created_at: '2026-10-27T19:59:50.934541+00:00'
updated_at: '2026-10-27T19:59:50.934541+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-58b2cec4
  rule: code_frozen
  evidence: 'Ran `npx vitest run --config vitest.node.config.mts tests/reconciliation-assistant-looking-surface.test.ts`
    (4/13 fail) and `--config vitest.workers.config.mts tests/reconciliation-assistant-looking-surface-worker.workers.test.ts`
    (1/1 fail), and printed the real outputs. (1) screenshot''s tool_result content
    and the streamed tool_activity meta.output are both the string ''<<<untrusted>>>\n[...base64
    PNG...]\n<<</untrusted>>>''; the block array is turned into text and nothing calls
    isContentBlocks, so the model never gets an image block and withoutImageData never
    strips anything (base64 reaches the SSE stream). (2) Refusals read ''Error: screenshot
    failed. <message>'' with no PICTURE_INVALID/NOT_FOUND code; PictureSourceError/PictureNotFoundError
    are not mapped to the declared codes. (3) screenshot {kind:''revision'', revision:99}
    on a site with only revision 1 returns a picture instead of NOT_FOUND. (4) apps/control-app/src/ai.ts
    has no reference to fidelity; workerHost never composes the looking surface (the
    story''s own flagged code issue). Changing the tests to match would mean asserting
    the model gets base64 as text and the operator stream carries image bytes, the
    opposite of the story''s purpose.'
  proposed_change: '(a) tools/generate/src/cli/ai/fidelity-core.ts (FidelityToolbox)
    and/or toolbox-core.ts: when an operation returns isContentBlocks(value), pass
    the block array through as the tool_result content (keeping the untrusted framing
    as a text block, not by turning the array into text), so host-core''s withoutImageData
    sees an array. (b) Map PictureSourceError -> PICTURE_INVALID and PictureNotFoundError
    -> NOT_FOUND through the Toolbox''s declared-error mechanism, so the refusal text
    carries the code. (c) In picture.ts resolvePicture, for kind ''revision'', check
    the revision exists in the store and throw PictureNotFoundError if not. (d) apps/control-app/src/ai.ts
    workerHost: when env has the Browser Rendering binding, set HostDeps.fidelity
    = (slug) => fidelityDeps(env, new PreviewRenderer(store), references, origin,
    slug, { launch: bindingLauncher(env) }). No test or AC changes needed; the five
    tests already state the intended behaviour.'
  batch_index: 0
  parent_report_uid: report-a5579bab
  anchor_ticket: bundle-5607a08d
---

# Builder blocked by `code_frozen`

**Evidence**: Ran `npx vitest run --config vitest.node.config.mts tests/reconciliation-assistant-looking-surface.test.ts` (4/13 fail) and `--config vitest.workers.config.mts tests/reconciliation-assistant-looking-surface-worker.workers.test.ts` (1/1 fail), and printed the real outputs. (1) screenshot's tool_result content and the streamed tool_activity meta.output are both the string '<<<untrusted>>>\n[...base64 PNG...]\n<<</untrusted>>>'; the block array is turned into text and nothing calls isContentBlocks, so the model never gets an image block and withoutImageData never strips anything (base64 reaches the SSE stream). (2) Refusals read 'Error: screenshot failed. <message>' with no PICTURE_INVALID/NOT_FOUND code; PictureSourceError/PictureNotFoundError are not mapped to the declared codes. (3) screenshot {kind:'revision', revision:99} on a site with only revision 1 returns a picture instead of NOT_FOUND. (4) apps/control-app/src/ai.ts has no reference to fidelity; workerHost never composes the looking surface (the story's own flagged code issue). Changing the tests to match would mean asserting the model gets base64 as text and the operator stream carries image bytes, the opposite of the story's purpose.

**Proposed change**: (a) tools/generate/src/cli/ai/fidelity-core.ts (FidelityToolbox) and/or toolbox-core.ts: when an operation returns isContentBlocks(value), pass the block array through as the tool_result content (keeping the untrusted framing as a text block, not by turning the array into text), so host-core's withoutImageData sees an array. (b) Map PictureSourceError -> PICTURE_INVALID and PictureNotFoundError -> NOT_FOUND through the Toolbox's declared-error mechanism, so the refusal text carries the code. (c) In picture.ts resolvePicture, for kind 'revision', check the revision exists in the store and throw PictureNotFoundError if not. (d) apps/control-app/src/ai.ts workerHost: when env has the Browser Rendering binding, set HostDeps.fidelity = (slug) => fidelityDeps(env, new PreviewRenderer(store), references, origin, slug, { launch: bindingLauncher(env) }). No test or AC changes needed; the five tests already state the intended behaviour.
