---
uid: story-58b2cec4
id: STORY-157
type: story
title: 'The Assistant Can See: A Read-Only Looking Surface With One Picture Vocabulary'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:41:11.984108+00:00'
updated_at: '2026-10-30T21:32:40.171812+00:00'
completed_at: null
last_field_updated: body
status: completed
fields:
  intent_uid: bundle-5607a08d
  capability_uid: capability-00e77e55
  story_kind: feature
  story_points: 3
---

## Story
**As a** client working with the consultant on my site, **I want** the assistant to be able to look at a picture of my draft, the page I am editing, a published revision, a captured reference or any web page — and actually see it — **so that** its judgements about how the site looks rest on what is there rather than on guesswork.

## Description
Before REQ-157 the assistant's whole tool surface was site-editing operations; nothing it could call returned an image. This story gives it a **second, read-only declared surface** ("Looking and judging", group `SeeSite`) composed beside the site-editing surface rather than merged into it, and the part of it that lets the assistant *see*:

- **One picture vocabulary.** Every operation names a picture the same way: a `kind` of `reference` (captured bundle), `draft`, `edit`, `revision` (published, frozen) or `url`, plus the fields that kind needs and a viewport (`mobile` / `tablet` / `desktop`, default `desktop`). The offered tool schema shows the model that exact shape.
- **`screenshot`** returns a short text line naming what was shot and at what size, and the picture itself as an image the model receives inside the same tool loop.
- **Bounded pictures.** Images are reduced (by averaging, not sampling) to a 1024px longest edge and refused over a byte ceiling; the operator's live activity stream carries the text but not the image bytes.
- **A published revision is pictured as it was** — rendered from the frozen snapshot with that revision's own asset bytes.
- **Bound to one site**, read-only, granted to the consultant, and absent (without breaking the editing assistant) where the deployment has no browser.

**In scope:** surface composition and grant, picture vocabulary and resolution of all five kinds, `screenshot`, image bounding, SSE stripping, read-only guarantee, both hosts.
**Out of scope (sibling stories in this bundle):** `compare` / `check_fidelity` verdicts (plan item 5); `capture_site`, `list_references`, `describe_reference` and the egress guard (plan item 6). Also out of scope, named by REQ-157 itself: redacting the capped base64 from the durable session transcript (upstream follow-up), attaching ingestion descriptions to assets, prompting a backdrop-or-subject question.

## Technical Context
- Declared as data (`fidelity-surface.json`), implemented against the store and an injected browser seam — same declared/granted/validated/audited model as CAP-92's site control surface (STORY-105). The surface list replaces the former single knowledge-surface slot; the knowledge surface is the first entry and is unchanged.
- The consultant grant (`fidelity: {groups: [SeeSite]}`) is local, in the instance config beside the L1 grant; the grant is narrowed to the surfaces actually composed, so it can only ever lose keys, never widen.
- Builds on STORY-124/125 (deployment screenshot primitive), the preview channels (CAP-84 edit channel), REQ-149 revisions, and CAP-63 capture bundles. Architecture policy #7/#8 (Workers + Browser Rendering) and #29 (AI makes structured changes only — this surface makes none).
- Evidence: `tests/test_UAT_FC_REQ-157_fidelity_surface.test.ts` (AC1, AC2, AC3, AC7, AC8 blocks), `tests/reconciliation-assistant-looking-surface.test.ts` (Node host and Toolbox) and `tests/reconciliation-assistant-looking-surface-worker.workers.test.ts` (Worker host inside workerd: AC-2025, and AC-2024's no-`BROWSER` branch).
- **The untrusted-content frame is kept on the picture path (REQ-157; fixes BUG-316).**
  - `host-core.ts` registers every tool as `box.run`. The Toolbox renders each result as text and wraps every `provenance: untrusted` result (every operation on this surface) in `<<<untrusted>>>` … `<<</untrusted>>>`.
  - `contentBlocksFrom` (`fidelity-core.ts`) recovers a picture's blocks from that text so that the model is shown the image, and `host-core.ts` hands them to the model as `contentBlocksFrom(payload) ?? payload`.
  - The text around the recovered array is carried onto the blocks: the text before the array prefixes the first text block (or becomes a new leading text block when the first block is an image), and the text after it suffixes the last text block (or becomes a new trailing text block). The image itself lies strictly inside the frame (AC-2067). Unframed payloads come back unchanged; refusals come back as `null` and stay text.
  - History: the frame was dropped by the batch-0 code_frozen grant report-be7d1be4 (13aa65737c); an ungranted fixer edit (0a0f97f216) restoring it was reverted (review report-84f2f9bc F1); review report-b5be9c7c F1 directed restoring it under a new rung-1 code_frozen grant (REQ-157, Grant and safety) scoped to `tools/generate/src/cli/ai/fidelity-core.ts` only. That grant landed as report-d58b23f8 (trust-boundary audit fields computed, conformance pass), and the AC-2067 UATs now pass against it.

### Code issue flagged earlier — resolved
- **The Worker host now composes the looking surface.** Reconciliation flagged that the Worker's host construction (`apps/control-app/src/ai.ts`, `workerHost`) passed only the knowledge surface, so a Worker-hosted consultant with a Browser Rendering binding was offered no looking operation, contrary to REQ-157's "Both hosts". Commit 13aa65737c fixed this. `router.ts` `sessionFidelity` now builds the surface's dependencies from `shot.ts` `fidelityDeps` when a `BROWSER` binding (or an injected launcher) and `BLOBS` are present, and `workerHost` composes it. AC-2025 passes inside workerd. Where there is no browser it composes nothing, and the session still edits (AC-2024, Worker branch).

## Reconciliation Decisions
- **Picture defaults** (decided at reconciliation, 2026-10-27): REQ-157 names each kind's required fields but not defaults; the declaration defaults `viewport` to `desktop` and `page` to `/`. Formalized in the resolution AC because the model is told these defaults and relies on them.
- **No slug anywhere** (decided at reconciliation, 2026-10-27): the original table names draft/edit/revision "by slug + page"; REQ-157's own "Behaviour the build settled" supersedes that — the surface is bound to one site at construction and no picture names a site. Formalized as the binding AC; this follows the later intent passage, not a code deviation.
- **Byte ceiling value** (decided at reconciliation, 2026-10-27): intent says "a declared byte ceiling" without a number; code uses 3 MiB after reduction and names both size and ceiling in the refusal. Formalized at that value since the refusal text tells the model what to do instead.
- **SSE elision form** (decided at reconciliation, 2026-10-27): intent says image data is stripped while the text survives; code replaces the image data with a marker naming its byte count and media type. Formalized: text block intact, no base64 in the streamed event.
- **Screenshots keep the untrusted-content frame** (decided at reconciliation, 2026-10-30, review report-b5be9c7c F1; supersedes the 2026-10-30 alignment under report-84f2f9bc F1).
  - REQ-157 says "a captured page's text must never be able to read as an instruction", and the surface declares every operation `provenance: untrusted`. The intent therefore demands the frame on the picture path too, and this follows the intent rather than the reference state (`reconcile-src-BUNDLE-32` returns the array bare).
  - An earlier pass aligned AC-2067 to the unframed running code as a known gap. The review ruled that a recorded follow-up does not satisfy the override audit's trust-boundary item, so AC-2067 again requires the frame. The code change was made under the rung-1 code_frozen grant report-d58b23f8 on `fidelity-core.ts` (batch 0's code_frozen grant for this story was denied: report-1312a88f, report-07babd4a). BUG-316 (bug-d9778adf) was resolved by that change.
- **Absence without a browser** (decided at reconciliation, 2026-10-27): stated in intent ("a deployment without a browser still starts an editing assistant"; Node "absent an origin there is no fidelity surface"). Formalized as its own AC because it is the failure path of composition.

## Dependencies
None (plan item 4). Plan items 5 and 6 depend on this story.

## Story Points
3
