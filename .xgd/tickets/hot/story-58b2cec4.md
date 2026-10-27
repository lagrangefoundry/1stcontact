---
uid: story-58b2cec4
id: STORY-157
type: story
title: 'The Assistant Can See: A Read-Only Looking Surface With One Picture Vocabulary'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:41:11.984108+00:00'
updated_at: '2026-10-27T19:41:11.984108+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
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
- Evidence: `tests/test_UAT_FC_REQ-157_fidelity_surface.test.ts` (AC1, AC2, AC3, AC7, AC8 blocks). No existing UAT covers the SSE strip, grant narrowing / absence without a browser, revision-asset fidelity, or the Worker host composition — those ACs are expected to drive new UATs.

### Code issue flagged (intent contradicts code)
- **The Worker host never composes the looking surface.** REQ-157's *Why* names the problem as "In the cloud the assistant has none", and its *As built → Both hosts* section states "The Worker composition root is `apps/control-app/src/shot.ts` … Node is wired too." In the landed code `shot.ts` exports the Worker's surface dependencies, but the Worker's host construction (`apps/control-app/src/ai.ts`, `workerHost`) passes only the knowledge surface and no fidelity dependencies, so a Worker-hosted consultant with a Browser Rendering binding is offered no looking operation. The AC captures intent (the Worker-hosted assistant with a browser is offered the surface); `fix_uat_coverage`'s code-issue lever should wire it.

## Reconciliation Decisions
- **Picture defaults** (decided at reconciliation, 2026-10-27): REQ-157 names each kind's required fields but not defaults; the declaration defaults `viewport` to `desktop` and `page` to `/`. Formalized in the resolution AC because the model is told these defaults and relies on them.
- **No slug anywhere** (decided at reconciliation, 2026-10-27): the original table names draft/edit/revision "by slug + page"; REQ-157's own "Behaviour the build settled" supersedes that — the surface is bound to one site at construction and no picture names a site. Formalized as the binding AC; this follows the later intent passage, not a code deviation.
- **Byte ceiling value** (decided at reconciliation, 2026-10-27): intent says "a declared byte ceiling" without a number; code uses 3 MiB after reduction and names both size and ceiling in the refusal. Formalized at that value since the refusal text tells the model what to do instead.
- **SSE elision form** (decided at reconciliation, 2026-10-27): intent says image data is stripped while the text survives; code replaces the image data with a marker naming its byte count and media type. Formalized: text block intact, no base64 in the streamed event.
- **Absence without a browser** (decided at reconciliation, 2026-10-27): stated in intent ("a deployment without a browser still starts an editing assistant"; Node "absent an origin there is no fidelity surface"). Formalized as its own AC because it is the failure path of composition.

## Dependencies
None (plan item 4). Plan items 5 and 6 depend on this story.

## Story Points
3
