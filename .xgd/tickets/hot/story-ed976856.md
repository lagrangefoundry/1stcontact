---
uid: story-ed976856
id: STORY-178
type: story
title: 'Image editing: an edit is a revisable recipe over a kept original, applied
  by one renderer, and editable by the assistant'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:24:47.938665+00:00'
updated_at: '2026-11-09T18:39:09.487243+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-0881342c
  capability_uid: capability-2d32662d
  story_kind: feature
  story_points: 3
---

## Story
**As a** small-business client working with the site assistant, **I want** a picture in my Library to be cropped, turned, sized or colour-corrected by a revisable list of edits laid over the original I gave you, **so that** I never have to leave the product to edit a photo, and "the crop needs to be a little wider" months later is a one-number change and not a request for the file again.

## Description
An edit to a stored picture is a **recipe**: an ordered list of parameterised operations kept on the Library item's record. The original bytes are never altered. Any state of the picture is the original plus that list, and the bytes anyone is shown are derived from it.

**In scope:**
- **The closed, shared vocabulary.** It has four operations and nothing else:
  - `crop`: `left`/`top`/`right`/`bottom` insets, as fractions of the *current* picture.
  - `rotate`: `90`, `180` or `270` degrees.
  - `resize`: `width` and/or `height` in whole pixels. The aspect ratio is kept, and the picture is never enlarged.
  - `adjust`: `brightness`/`contrast`/`saturation` multipliers from 0 to 10, where 1 means unchanged.
- **Named refusals.** Every refusal states its reason and leaves the recipe exactly as it was. The whole list is checked against the picture's real pixels before anything is written.
- **Ordered rendering with dimension tracking.** Operations apply in the author's order. Each operation's fractions are fractions of what the earlier operations left.
- **One renderer, the Cloudflare Images binding, in the Worker.** It produces the builder's view of a picture (`/api/material/file`) and the assistant's view of a stored picture.
- **The assistant's `image` surface.** `list_image_edits` reads the recipe and `edit_image` replaces it whole. A picture is named in the same vocabulary the assistant already uses to look at pictures (STORY-157).
- **Cached renditions.** A rendered result is cached, content-addressed per tenant, outside the material store's keyspace.

**Out of scope:**
- The editing modal and the editable Library name (REQ-220, plan item 5).
- The publish-time width ladder (REQ-222, plan item 1).
- HEIC conversion (REQ-221, plan item 3).
- Carrying the recipe into a published site (REQ-229, see Technical Context).
- `flip`.
- Re-describing a picture after a crop.
- Editing SVG drawings.

## Technical Context
- **Capability.** This story belongs to CAP-94 (capability-2d32662d), next to the generated-images stories. It is the first write path on a picture.
- **Builds on STORY-157 (REQ-218).** That story provides picture naming (one vocabulary across site assets and Library items, with ambiguity refused and the candidates named) and the assistant's stored-picture view. This story fills in the `original` argument that view declared and left open.
- **Architecture.**
  - Rendering is Worker-only: the CLI host has no Images binding, the same precedent as `imagegen.ts`.
  - The binding is declared once as `[images]` in both wrangler environments. That declaration and its UAT are owned by plan item 3 (STORY-140 AC); this story is its second consumer, not a second declaration.
  - A deployment whose binding cannot transform is treated the same as one with no binding: there is no surface, and every picture is served as its original.
- **Storage.**
  - The recipe is `fields.edits` on the material record. An absent field means the empty recipe, so existing pictures need no migration.
  - Renditions live under `rendition/<tenant>/` on the `BLOBS` bucket, keyed on (original hash, recipe, width). They are deliberately outside `t/<tenant>/`, whose orphan sweep deletes any key no attachment record names.
  - These are the first content-addressed keys in that bucket. The material store withdrew content addressing (REQ-108), so this introduces the pattern rather than following it.
- **Evidence limit.** Miniflare's local Images binding honours only `rotate`, `width` and `height`; it silently drops trim and every colour adjustment. UATs therefore assert:
  - the transform chain handed to the binding (one step per operation, in order), recorded by a binding double;
  - the reported dimensions;
  - byte-level results only where the local renderer actually performs the operation.

  A UAT must not compare pixels for crop or adjust locally: it would pass against an unedited image.

## Reconciliation Decisions
- **Intent level.** Settled at ladder level 1. The REQ-219 body, including its in-body corrections from EPIC-1 dated 2026-09-10 and 2026-09-11 and its "Technical consequences, settled in the code" section, agrees with the code on every behaviour formalized here. No transcript was needed.
- **`flip` excluded** (decided at reconciliation, 2026-11-09). The body's original reason ("the platform renderer cannot do it") is wrong and is corrected in the body itself: flip is out of v1 for simplicity. No AC asserts a reason. `flip` falls under the AC refusing any operation outside the vocabulary.
- **Recipe is not yet applied at promotion or publish.** This is not formalized here, and it is a known open contradiction. EPIC-1's decision in the REQ-219 body (option three) is that the material records the site-asset name it was promoted to, the recipe is applied at promotion, and a recipe change re-promotes. Per the 2026-09-11 corrections, none of that exists in the code:
  - `promoteToSiteAsset` copies the original blob and records no asset name.
  - Revising a recipe does not re-promote.

  So a client's crop does not reach their published site. The operator has assigned this gap to **REQ-229** (`request-4b5c10e9`, draft). It is therefore deliberately left out of this story's ACs. It is not a code-issue for this story's regression run.
- **Description staleness** (decided at reconciliation, 2026-11-09). The body settles this as "left undone, deliberately": a crop does not re-describe the picture, and the surface prose tells the assistant that the description describes the original. Formalized as part of the surface AC. No new `description_status` value is invented.
- **GIF refused alongside SVG; picture keeps its stored format; render failure serves stored bytes; capture members never rendered.** These come from the body's "Technical consequences" section and are formalized as ACs.

## Dependencies
None. Plan item 5 (the REQ-220 image modal) depends on this story.

## Story Points
3