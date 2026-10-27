---
uid: report-5ed3d3ee
id: REPORT-6786
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-10-27T19:59:45.318898+00:00'
updated_at: '2026-10-27T19:59:45.318898+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-58b2cec4
  parent_report_uid: report-a5579bab
  batch_index: '0'
---

I couldn't fix any of the five failures, and I made no edits. Each one fails because the frozen code doesn't do what the story and its ACs describe, so the right fix is in production code, which `code_frozen` blocks. Making the tests match the code would mean asserting that the model gets the picture as text and the operator gets the image bytes, which is the opposite of what this story is for.

I ran both suites and printed what the code actually returns. The Node suite had 4 of 13 tests failing (the other 9 pass); the Worker suite had its 1 test failing. The only change to the worktree is the gitignored `apps/control-app/src/generated/` copied in so the Worker suite could load.

| Test | What the code actually does |
|---|---|
| **AC2031** (image reaches the model) | The `tool_result` content is one *string*: `"<<<untrusted>>>\n[{text…},{image…data:"iVBORw0KGgo…"}]\n<<</untrusted>>>"`. The model is handed base64 as text, not an image block. Nothing ever calls `isContentBlocks` (`fidelity-core.ts:113`), so the block array gets turned into text on the way out. |
| **AC2034** (stream drops image bytes) | Because the output is a string, `withoutImageData` (`host-core.ts:861`) sees no array and returns the event untouched, so the full base64 PNG goes to the operator's browser. |
| **AC2028** (incomplete / unknown picture) | Refusals read `"Error: screenshot failed. a picture of kind 'reference' needs 'bundle'…"` with no `PICTURE_INVALID` code, and an unknown bundle gives no `NOT_FOUND`. `revision: 99`, which doesn't exist, gets a picture back (`"studio revision 99/ at desktop — 8×8"` with a PNG) instead of being refused. |
| **AC2033** (byte ceiling) | The message has both byte counts and the "narrower viewport, or compare" advice, but no `PICTURE_INVALID` code. The error is thrown as a plain `PictureSourceError` and the Toolbox doesn't map it to a code. |
| **AC2025** (Worker offers the surface) | 32 tools are offered and none of the six looking operations is among them. `apps/control-app/src/ai.ts` never mentions `fidelity`; `fidelityDeps` in `shot.ts` is exported but never wired in. The story already flagged this as a code issue to be fixed. |

To unblock, someone needs to lift `code_frozen` for this story or send it to the code-issue route the story already names. The code changes are spelled out below.

```yaml
## Assessment
blocked_by:
  rule: code_frozen
  evidence: "Ran `npx vitest run --config vitest.node.config.mts tests/reconciliation-assistant-looking-surface.test.ts` (4/13 fail) and `--config vitest.workers.config.mts tests/reconciliation-assistant-looking-surface-worker.workers.test.ts` (1/1 fail), and printed the real outputs. (1) screenshot's tool_result content and the streamed tool_activity meta.output are both the string '<<<untrusted>>>\\n[...base64 PNG...]\\n<<</untrusted>>>'; the block array is turned into text and nothing calls isContentBlocks, so the model never gets an image block and withoutImageData never strips anything (base64 reaches the SSE stream). (2) Refusals read 'Error: screenshot failed. <message>' with no PICTURE_INVALID/NOT_FOUND code; PictureSourceError/PictureNotFoundError are not mapped to the declared codes. (3) screenshot {kind:'revision', revision:99} on a site with only revision 1 returns a picture instead of NOT_FOUND. (4) apps/control-app/src/ai.ts has no reference to fidelity; workerHost never composes the looking surface (the story's own flagged code issue). Changing the tests to match would mean asserting the model gets base64 as text and the operator stream carries image bytes, the opposite of the story's purpose."
  proposed_change: "(a) tools/generate/src/cli/ai/fidelity-core.ts (FidelityToolbox) and/or toolbox-core.ts: when an operation returns isContentBlocks(value), pass the block array through as the tool_result content (keeping the untrusted framing as a text block, not by turning the array into text), so host-core's withoutImageData sees an array. (b) Map PictureSourceError -> PICTURE_INVALID and PictureNotFoundError -> NOT_FOUND through the Toolbox's declared-error mechanism, so the refusal text carries the code. (c) In picture.ts resolvePicture, for kind 'revision', check the revision exists in the store and throw PictureNotFoundError if not. (d) apps/control-app/src/ai.ts workerHost: when env has the Browser Rendering binding, set HostDeps.fidelity = (slug) => fidelityDeps(env, new PreviewRenderer(store), references, origin, slug, { launch: bindingLauncher(env) }). No test or AC changes needed; the five tests already state the intended behaviour."
```
