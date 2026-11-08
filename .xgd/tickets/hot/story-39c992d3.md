---
uid: story-39c992d3
id: STORY-172
type: story
title: The consultant can generate a raster picture that lands as an ordinary, legibly-generated
  piece of the client's material
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:41:24.865738+00:00'
updated_at: '2026-11-08T06:41:24.865738+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-c0301347
  capability_uid: capability-2d32662d
  story_kind: feature
  story_points: 3
---

## Story
**As a** small-business client building my site with the consultant, **I want** the assistant to make a draft picture when I have no photograph for what the page needs, **so that** a missing asset becomes a draft I can judge instead of a point where the conversation stops, and so that, months later, I can still tell which pictures in my Library were made by a machine and which ones I supplied.

## Description
The consultant gets an image-generation tool (the framework's `create_image` plugin over the image-generation component, adopted and not authored here). A generated picture:
- lands as a `material` in the client's Library, indistinguishable from an uploaded image everywhere downstream (Library rows and detail, knowledge index, re-describe pass, promote-to-site), apart from saying it was generated;
- uses its generation prompt as its description, so it can be searched for as soon as it exists;
- is never placed on a site by being generated. Promoting it to the site is still a separate, deliberate step.

The image credential (`OPENAI_API_KEY`) is optional. Without it there is no image tool, sessions still open, every other tool works, and the product does not report itself unconfigured.

**Out of scope:** running a session's turns on a non-Anthropic chat backend; image editing, reference images or seeds; any change to how uploaded material is described; letting the assistant write arbitrary tickets.

## Technical Context
- Intent: REQ-208 (body, "Implementation decisions taken in this session", "Amendments, made during implementation") and its chat transcript COMMENT-2318. Commits 59e2b440 (feature) and 3cac1876 (version).
- Code: `apps/control-app/src/imagegen.ts` (`imageSurface`, `generatedMaterialStore`, `IMAGE_BUDGET`, `GENERATED_ORIGIN`), wired in `router.ts` beside the fidelity surface; `tickets.ts` adds `generated` to the `material` `origin` enum; `secretsOf()` gains `OPENAI_API_KEY`; deploy hook `bin/deploy.d/secrets/30-openai-api-key`; Worker shim in `tools/generate/src/cli/assets.ts`.
- Provider is `openai` (`gpt-image-1`). It is named only where the plugin is constructed. The model is given no provider parameter, and no error message or manual line names the vendor.
- The plugin gets a scoped, normalising store as its `options.store`. At create it merges in `kind: image`, `origin: generated`, `rights: owned`, `republishable: true`, `exportable: false`, `role: site`, `description_status: ok` and `description_model` (the backend's model id). At attach it adds `content_type`/`filename`, taken from the same values the attachment record gets, and then indexes the material through the same path an upload uses. The store refuses any type other than `material`, and any attach against a ticket it did not create.
- The grant comes from the plugin's own declaration (`instanceConfig()`), not from `instances.json`, so it cannot name a capability the surface does not have. This is the opposite of the REQ-206 fidelity surface, on purpose.
- The per-session cap is the framework default of 10. It is a stop for runaway loops, not a cost control. An attempt counts even if it fails, and hitting the cap refuses only image generation.
- Architecture: AI is limited to structured changes (DOC-5 rule 29). Material a client puts on their public site may go to the disclosed AI/media providers (rule 26). The prompt is the client's own site-description text, not private lead data.
- Existing evidence: `tests/test_UAT_FC_REQ-208_the_assistant_can_make_pictures.workers.test.ts` (12 UATs through `route()` in workerd over real D1/R2; only the Anthropic client and the image provider's HTTP endpoint are doubled).
- Related: CAP-112/CAP-113 (material ingestion and Library, which render `origin` under "Where it came from"); CAP-106 (material store); promote-to-site is unchanged.

## Reconciliation Decisions
- **Deploy hook outcomes when the key is absent** (decided at reconciliation, 2026-11-07): REQ-208 says only that the deploy must not fail. The code also tells apart push (key in environment), keep (already stored in Cloudflare) and skip (absent, or the store could not be read), and reports each one, including under a dry run. Formalized as the deploy-hook AC because the operator relies on that output to know whether image generation is live.
- **`rights` / `republishable` / `exportable` / `role` values** (decided at reconciliation, 2026-11-07): set in the ticket's implementation-decisions section, not in its "What changes" spec. Formalized in the ordinary-material AC because without `republishable: true` a generated picture could never be promoted to a site.
- **Attach scope** (decided at reconciliation, 2026-11-07): intent says the plugin "cannot write arbitrary tickets". The code also refuses an attach to any ticket it did not create in that session. Formalized in the scope AC as part of the same guarantee.

No contradictions between intent and code were found.

## Dependencies
None.

## Story Points
3
