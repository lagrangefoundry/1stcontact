---
uid: story-39c992d3
id: STORY-172
type: story
title: The consultant can generate a raster picture that lands as an ordinary, legibly-generated
  piece of the client's material
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:41:24.865738+00:00'
updated_at: '2026-11-09T22:40:26.225490+00:00'
completed_at: null
last_field_updated: story_kind
status: completed
fields:
  intent_uid: bundle-c0301347
  capability_uid: capability-2d32662d
  story_kind: upgrade
  story_points: 3
---

## Story
**As a** small-business client building my site with the consultant, **I want** the assistant to make a draft picture when I have no photograph for what the page needs, and to show me that picture in the conversation where it made it, **so that** a missing asset becomes a draft I can judge instead of a point where the conversation stops, and so that, months later, I can still tell which pictures in my Library were made by a machine and which ones I supplied.

## Description
The consultant gets an image-generation tool (the framework's `create_image` plugin over the image-generation component, adopted and not authored here). A generated picture:
- lands as a `material` in the client's Library, indistinguishable from an uploaded image everywhere downstream (Library rows and detail, knowledge index, re-describe pass, promote-to-site), apart from saying it was generated;
- uses its generation prompt as its description, so it can be searched for as soon as it exists;
- is never placed on a site by being generated. Promoting it to the site is still a separate, deliberate step;
- **appears in the turn that made it** (REQ-217). In a builder session, the result carries a `display` sentence holding one markdown image line that the model is told to include in its reply exactly as written. The line addresses the new material on the material file route under the current business's own path (`/b/<businessId>/api/material/file?uid=<uid>`). Because the picture is in the assistant's own turn, it shows again when the conversation is reloaded. Where the host supplies no way to address material, there is no `display` field and the manual describes none; generation is otherwise unchanged.

The image credential (`OPENAI_API_KEY`) is optional. Without it there is no image tool, sessions still open, every other tool works, and the product does not report itself unconfigured.

**Out of scope:** running a session's turns on a non-Anthropic chat backend; image editing, reference images or seeds; any change to how uploaded material is described; letting the assistant write arbitrary tickets; opening a generated picture in the image editor by clicking it in the conversation (REQ-220's).

## Technical Context
- Intent: REQ-208 (body, "Implementation decisions taken in this session", "Amendments, made during implementation") and its chat transcript COMMENT-2318. Commits 59e2b440 (feature) and 3cac1876 (version). Display line: REQ-217 ("What landed, 2026-09-11 — both halves, in one pass"), bundled in BUNDLE-44.
- Code: `apps/control-app/src/imagegen.ts` (`imageSurface`, `generatedMaterialStore`, `IMAGE_BUDGET`, `GENERATED_ORIGIN`), wired in `router.ts` beside the fidelity surface; `tickets.ts` adds `generated` to the `material` `origin` enum; `secretsOf()` gains `OPENAI_API_KEY`; deploy hook `bin/deploy.d/secrets/30-openai-api-key`; Worker shim in `tools/generate/src/cli/assets.ts`.
- Provider is `openai` (`gpt-image-1`). It is named only where the plugin is constructed. The model is given no provider parameter, and no error message or manual line names the vendor. The stored material body is the exception. It carries the plugin's `Provider`/`Model` lines and is indexed (see Reconciliation Decisions, BUG-381).
- The plugin gets a scoped, normalising store as its `options.store`. At create it merges in `kind: image`, `origin: generated`, `rights: owned`, `republishable: true`, `exportable: false`, `role: site`, `description_status: ok` and `description_model` (the backend's model id). At attach it adds `content_type`/`filename`, taken from the same values the attachment record gets, and then indexes the material through the same path an upload uses. The store refuses any type other than `material`, and any attach against a ticket it did not create.
- The grant comes from the plugin's own declaration (`instanceConfig()`), not from `instances.json`, so it cannot name a capability the surface does not have. This is the opposite of the REQ-206 fidelity surface, on purpose.
- The per-session cap is the framework default of 10. It is a stop for runaway loops, not a cost control. An attempt counts even if it fails, and hitting the cap refuses only image generation.
- **Display line (REQ-217).** `ImageSurfaceOptions.materialUrl` (`(uid) => string`) is passed to the plugin through upstream's `display` construction option (lagrange-framework REQ-149's seam), as `generatedDisplay(materialUrl)`. This is product vocabulary supplied through the plugin's seam, not the local workaround `imagegen.ts`'s header forbids. `router.ts` supplies `materialUrl` from `scope.businessId` via `scope.ts`'s `businessPath()`, the inverse of `splitBusinessPrefix`. The markdown is composed by `displayLine(name, url)` in `toolbox-core.ts`, the same composer `write_image` uses (STORY-107), so the chat pane reads one address shape. REQ-220's `materialUidFromUrl` exact-matches `/api/material/file` and does not yet read the `/b/<id>` prefix; per REQ-217 that is REQ-220's to fix, and this story emits the scoped form deliberately.
- Architecture: AI is limited to structured changes (DOC-5 rule 29). Material a client puts on their public site may go to the disclosed AI/media providers (rule 26). The prompt is the client's own site-description text, not private lead data. The display URL is same-origin and business-scoped and never reaches a published page.
- Existing evidence: `tests/test_UAT_FC_REQ-208_the_assistant_can_make_pictures.workers.test.ts` (12 UATs through `route()` in workerd over real D1/R2; only the Anthropic client and the image provider's HTTP endpoint are doubled); `tests/test_UAT_FC_REQ-217_a_picture_in_the_conversation.workers.test.ts` (material URL fetched back through the route table; no display field without a factory).
- Related: CAP-112/CAP-113 (material ingestion and Library, which render `origin` under "Where it came from"); CAP-106 (material store); promote-to-site is unchanged; STORY-107 (`write_image`'s half of REQ-217, the surface prose and the chat pane's image bounds).

## Reconciliation Decisions
- **Deploy hook outcomes when the key is absent** (decided at reconciliation, 2026-11-07): REQ-208 says only that the deploy must not fail. The code also tells apart push (key in environment), keep (already stored in Cloudflare) and skip (absent, or the store could not be read), and reports each one, including under a dry run. Formalized as AC-2392 because the operator relies on that output to know whether image generation is live.
- **`rights` / `republishable` / `exportable` / `role` values** (decided at reconciliation, 2026-11-07): set in the ticket's implementation-decisions section, not in its "What changes" spec. Formalized in AC-2383 because without `republishable: true` a generated picture could never be promoted to a site.
- **Attach scope** (decided at reconciliation, 2026-11-07): intent says the plugin "cannot write arbitrary tickets". The code also refuses an attach to any ticket it did not create in that session. Formalized in AC-2390 as part of the same guarantee.
- **When to generate, and how the result is presented, is left to model judgement** (decided at reconciliation, 2026-11-08): REQ-208's "How it behaves" says the assistant does not generate what the client already has, and says what it made and why, as a draft. Nothing in this product instructs that. The adopted plugin's manual (the `imagegen` surface's overview and the `CreateImage` description) says only that generation is slow and costs money and so is not to be done speculatively; it does not tell the model to check the client's existing material first, nor to present the result as a draft with its reasons. The consultant role's priming (`priming.json`) says nothing about generating images. So there is no instruction reaching the model's tool list or system text that an AC could assert, and the behaviour depends on the model's own judgement in conversation. No AC is written for it. Making it a guarantee would need a priming or manual line (product priming, or upstream in the plugin's declaration), which is a production change outside this reconciliation. (REQ-217 now adds one such instruction, to show the picture, and that one is asserted in the new display-line AC.)
- **The vendor reaches the model through the stored material body: divergence from intent, not fixed here** (decided at reconciliation, 2026-11-08): REQ-208 says the model never learns which vendor drew the image. The tool's manual, schema and error text keep that promise (AC-2380). The material body does not. The `ai-imagegen` plugin writes `- Provider:` / `- Model:` lines (`toolbox.js:757-758`), `generatedMaterialStore.create` stores them unchanged, and `attach` indexes the material (`imagegen.ts:260`), so the session knowledge base can return the vendor name. Fixing it is a production change to `imagegen.ts`. The `code_frozen` override for it was refused in fix_plan iteration 11, so this reconciliation records the code as it is: AC-2380 is scoped to the tool's own channels, and the fix is BUG-381 (`bug-da5f9050`).
- **Display-line alt text drops the extension and square brackets** (decided at reconciliation, 2026-11-09, BUNDLE-44): REQ-217 says the alt text is the file's name, not a description. Stripping the extension and any `[`/`]` comes from the code, so the alt never breaks the markdown. The intent does not mention it, and it is formalized in AC-2567.
- **A display sentence, not a bare line, for `create_image`** (decided at reconciliation, 2026-11-09, BUNDLE-44): the plugin seam takes a sentence and wraps it in no prose of its own. So the instruction to include the line "exactly as written" is part of the `display` value itself and not in this product's l1 surface. AC-2567 asserts the line inside that sentence.
- **No display field where no factory is supplied** (decided at reconciliation, 2026-11-09, BUNDLE-44): REQ-217 says absence is the default. The production router always supplies `materialUrl`, so absence is reached only by a host assembling the surface without one. AC-2568 records that such a host gets no field, not an empty one, and that generation is unaffected.

One contradiction between intent and code was found: the vendor reaches the model through the stored material body. It is recorded above and tracked as BUG-381. REQ-217's display line matches its intent; no contradiction.

## Dependencies
None.

## Story Points
3
