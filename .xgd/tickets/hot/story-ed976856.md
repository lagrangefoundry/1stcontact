---
uid: story-ed976856
id: STORY-178
type: story
title: 'Image editing: an edit is a revisable recipe over a kept original, applied
  by one renderer, and editable by the assistant'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:24:47.938665+00:00'
updated_at: '2026-11-10T00:03:15.530524+00:00'
completed_at: null
last_field_updated: story_kind
status: completed
fields:
  intent_uid: bundle-0881342c
  capability_uid: capability-2d32662d
  story_kind: upgrade
  story_points: 3
---

## Story
**As a** small-business client working with the site assistant, **I want** a picture in my Library to be cropped, turned, sized or colour-corrected by a revisable list of edits laid over the original I gave you, and the picture on my site to be that edited picture, **so that** I never have to leave the product to edit a photo, "the crop needs to be a little wider" months later is a one-number change and not a request for the file again, and a crop I can see in the Library is the crop my visitors see once I publish.

## Description
An edit to a stored picture is a **recipe**: an ordered list of parameterised operations kept on the Library item's record. The original bytes are never altered. Any state of the picture is the original plus that list, and the bytes anyone is shown are derived from it. That includes the copy on the client's site: the site holds the picture *as currently edited*, under one stable name, and an edit replaces it in place.

**In scope:**
- **The closed, shared vocabulary.** It has four operations and nothing else:
  - `crop`: `left`/`top`/`right`/`bottom` insets, as fractions of the *current* picture.
  - `rotate`: `90`, `180` or `270` degrees.
  - `resize`: `width` and/or `height` in whole pixels. The aspect ratio is kept, and the picture is never enlarged.
  - `adjust`: `brightness`/`contrast`/`saturation` multipliers from 0 to 10, where 1 means unchanged.
- **Named refusals.** Every refusal states its reason and leaves the recipe exactly as it was. The whole list is checked against the picture's real pixels before anything is written.
- **Ordered rendering with dimension tracking.** Operations apply in the author's order. Each operation's fractions are fractions of what the earlier operations left.
- **One renderer, the Cloudflare Images binding, in the Worker.** It produces the builder's view of a picture (`/api/material/file`), the assistant's view of a stored picture, and the bytes promotion puts on a site.
- **The assistant's `image` surface.** `list_image_edits` reads the recipe and `edit_image` replaces it whole. A picture is named in the same vocabulary the assistant already uses to look at pictures (STORY-157).
- **Cached renditions.** A rendered result is cached, content-addressed per tenant, outside the material store's keyspace.
- **The recipe reaches the site (REQ-229).** Both doors are covered:
  - *Crop, then promote.* Promotion writes the material's current render, not its stored original. It also records, per site, the asset name it actually wrote, which may differ from the requested name when that name was taken.
  - *Promote, then crop.* A recipe change replaces the bytes at each recorded name, as one operation, so the site's pages keep their reference and there is no moment when the picture is missing. The client's modal and the assistant's `edit_image` go through the same propagation.
  - A second promotion of an already-placed picture to the same site overwrites at the recorded name and does not mint a new one.
  - A recorded name the site no longer holds is reported for that placement and is never re-added.
  - It is the **draft** that changes. A published revision stays as it was until the client publishes again.

**Out of scope:**
- The editing modal and the editable Library name (REQ-220, plan item 5).
- The publish-time width ladder (REQ-222, plan item 1). It ladders whatever bytes are on the site and needs to know nothing about recipes.
- HEIC conversion (REQ-221, plan item 3).
- The rights gate, free-name selection for a first placement, and the `placed_on` list (STORY-143).
- `flip`.
- Re-describing a picture after a crop.
- Editing SVG drawings.

## Technical Context
- **Capability.** This story belongs to CAP-94 (capability-2d32662d), next to the generated-images stories. It is the first write path on a picture.
- **Builds on STORY-157 (REQ-218).** That story provides picture naming (one vocabulary across site assets and Library items, with ambiguity refused and the candidates named) and the assistant's stored-picture view. This story fills in the `original` argument that view declared and left open.
- **Builds on STORY-143.** Promotion (the rights gate, the cross-bucket copy, free names, `placed_on`) is STORY-143's. This story adds what the recipe changes about it: which bytes are copied, the recorded name, and re-placement.
- **Architecture.**
  - Rendering is Worker-only: the CLI host has no Images binding, the same precedent as `imagegen.ts`.
  - The binding is declared once as `[images]` in both wrangler environments. That declaration and its UAT are owned by plan item 3 (STORY-140 AC); this story is its second consumer, not a second declaration.
  - A deployment whose binding cannot transform is treated the same as one with no binding: there is no surface, and every picture is served as its original.
- **Storage.**
  - The recipe is `fields.edits` on the material record. An absent field means the empty recipe, so existing pictures need no migration.
  - The recorded name is `fields.placed_as`, a list of `{ slug, name }` declared beside `placed_on`. Both are written in one patch by the one function that performs a placement. `placed_on` is unioned, not derived from `placed_as`, so material placed before REQ-229 (a slug with no recorded name) keeps its placement and records a name on its next promotion. An absent field, or an entry that is not a `{ slug, name }` pair, reads as "no recorded name", which is the first-placement branch.
  - Renditions live under `rendition/<tenant>/` on the `BLOBS` bucket, keyed on (original hash, recipe, width). They are deliberately outside `t/<tenant>/`, whose orphan sweep deletes any key no attachment record names.
  - These are the first content-addressed keys in that bucket. The material store withdrew content addressing (REQ-108), so this introduces the pattern rather than following it.
- **Replacement is its own verb.** The site store gained `editAssetReplace` beside `editAssetAdd`: bytes at an existing name, in one write, with an `asset.replace` draft-journal note, and `NOT_FOUND` if the name is absent. `editAssetAdd` still refuses a taken name and `freeAssetName` still renames on collision. The record decides which door a promotion takes, not a caller's flag.
- **Propagation.** `reviseRecipe` (the client's `POST /api/material/recipe`) calls `republishMaterial` after the recipe is written and returns its outcome as `republished`: one entry per recorded placement with `slug`, `name`, `replaced`, and `error` where it was not replaced. The assistant's recipe port is wrapped by `republishingRecipes`, which calls the same function. A failed propagation never undoes the edit.
- **Empty recipe costs nothing.** Promotion and re-promotion skip the renderer when the recipe is empty. That keeps promotion's cost unchanged for unedited pictures, which REQ-222's publish-latency budget relies on.
- **Evidence limit.** Miniflare's local Images binding honours only `rotate`, `width` and `height`; it silently drops trim and every colour adjustment. UATs therefore assert:
  - the transform chain handed to the binding (one step per operation, in order), recorded by a binding double;
  - the reported dimensions;
  - byte-level results only where the local renderer actually performs the operation. REQ-229's UATs use `rotate`, whose result is checkable because width and height swap.

  A UAT must not compare pixels for crop or adjust locally: it would pass against an unedited image.

## Reconciliation Decisions
- **Intent level.** Settled at ladder level 1. The REQ-219 body, including its in-body corrections from EPIC-1 dated 2026-09-10 and 2026-09-11 and its "Technical consequences, settled in the code" section, agrees with the code on every behaviour formalized here. No transcript was needed. REQ-229 (in BUNDLE-44) and its EPIC-1 answers of 2026-09-11 and 2026-09-12 settle the propagation behaviour at level 1 as well.
- **`flip` excluded** (decided at reconciliation, 2026-11-09). The body's original reason ("the platform renderer cannot do it") is wrong and is corrected in the body itself: flip is out of v1 for simplicity. No AC asserts a reason. `flip` falls under the AC refusing any operation outside the vocabulary.
- **The recipe now reaches the site; the earlier open contradiction is closed** (decided at reconciliation, 2026-11-09, BUNDLE-44). This story previously recorded that promotion copied the original, recorded no name, and that a recipe change did not re-promote, and deferred that to REQ-229. REQ-229 has landed, and the operator's EPIC-1 answers kept both widenings in scope: promotion applies the recipe, and `edit_image` propagates the same way the modal does. Both are formalized as ACs here.
- **No `republishable` re-check on re-promotion** (decided at reconciliation, 2026-11-09). REQ-229 §4 asked for one. The EPIC-1 answer of 2026-09-12 withdraws it: `republishable` is derived only by `reviseRole`, which refuses to narrow a material that is already placed, so a material with recorded placements cannot have stopped being republishable. No AC asserts a re-check, and its absence is not a code-issue. A material with no recorded placement acquires no site bytes through a recipe change.
- **No renderer: the recipe lands and nothing is re-promoted** (decided at reconciliation, 2026-11-09). This is stated by REQ-229 and the 2026-09-12 answer. Promotion without a renderer places the stored bytes, and a recipe change without a renderer reports `rendered: false` and an empty `republished`. Formalized as clauses of the new ACs.
- **A render that fails during promotion fails the promotion** (decided at reconciliation, 2026-11-09). The intent is silent. The code does not fall back to the original, because writing the unedited picture under the name the pages reference would be the bug REQ-229 closes, recorded as a success. The failure surfaces as STORY-143's named placement failure (AC-1712). Not given its own AC; recorded so a future change does not add a silent fallback.
- **Open assumption: `edit_image` does not carry the per-placement report** (recorded at reconciliation, 2026-11-09; `xgd intent resolve` returned `unsettled`). REQ-229 says the report goes "beside the row the edit returns", and says the assistant's change re-promotes "on the same terms". It does not say whether the assistant's tool result must carry the report. The code returns it only on the client's recipe route. Through `edit_image`, a missing name is still not re-added, but the assistant is not told. The criteria assert the report on the client route only, and assert that `edit_image` replaces bytes and never re-adds. If the operator wants the assistant told, that is a new requirement.
- **Description staleness** (decided at reconciliation, 2026-11-09). The body settles this as "left undone, deliberately": a crop does not re-describe the picture, and the surface prose tells the assistant that the description describes the original. Formalized as part of the surface AC. No new `description_status` value is invented.
- **GIF refused alongside SVG; picture keeps its stored format; render failure serves stored bytes; capture members never rendered.** These come from the body's "Technical consequences" section and are formalized as ACs. "Render failure serves stored bytes" applies to the file route (a view), not to promotion (a write); see above.

## Dependencies
STORY-143 (promotion, the rights gate and `placed_on`), for the REQ-229 criteria. Plan item 5 (the REQ-220 image modal) depends on this story.

## Story Points
3
