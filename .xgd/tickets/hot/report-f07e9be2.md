---
uid: report-f07e9be2
id: REPORT-11718
type: report
title: 'Reconciliation Plan: free-coded BUNDLE-43 (REQ-222, REQ-221, REQ-219, REQ-220,
  BUG-78)'
created_by: xgd
created_at: '2026-11-09T06:16:50.788808+00:00'
updated_at: '2026-11-09T18:46:34.617477+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-0881342c
  anchor_uid: bundle-0881342c
  items:
  - index: 1
    component: Site Delivery — publish builds the image width ladder
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: Extends existing stories STORY-94 (story-5349d01f, publish) and STORY-95
      (story-d34eccd8, serve). Publish (POST /api/publish and the CLI, one implementation)
      now builds a width ladder for every picture the revision references, in the
      Worker through the Cloudflare Images binding, during the render — nothing is
      resized on request. Renditions are written under the revision's own R2 prefix,
      content-addressed on (original, recipe, width), so republishing an unchanged
      picture costs no transform. Conventional widths are capped at the source's measured
      width (never upscaled); a source narrower than the smallest rung is served as-is.
      The draft gets no ladder and serves the working rendition. The publish records
      a ladder manifest (with measured intrinsic dimensions) through the store port
      (d1r2/fs/memory stores, revision model). public-site serves content-addressed
      renditions with immutable caching.
    justification: STORY-94 owns what publish writes and STORY-95 owns how public-site
      serves bytes and caches them; the ladder is more frozen revision bytes and one
      more caching rule, so it extends the Site Delivery bucket rather than introducing
      a new capability. No story currently describes rendition generation or immutable
      caching.
    target_story_ids:
    - story-5349d01f
    - story-d34eccd8
    acceptance_criteria_changes:
      add:
      - 'STORY-94: publishing a revision that references a picture writes a width
        ladder of renditions under that revision''s R2 prefix, generated through the
        Images binding during publish'
      - 'STORY-94: ladder widths are capped at the source width — no rendition is
        wider than the original, and a source narrower than the smallest rung gets
        no resized renditions'
      - 'STORY-94: renditions are content-addressed on original, recipe and width;
        republishing an unchanged picture performs no new transform'
      - 'STORY-94: the draft channel builds no ladder and serves the working rendition'
      - 'STORY-94: the publish records a ladder manifest with each picture''s measured
        intrinsic dimensions through the store port, identically on the cloud and
        filesystem stores'
      - 'STORY-95: a content-addressed rendition is served with an immutable cache
        header; other published bytes keep their existing caching'
      modify: []
      remove: []
    intent_delta_summary: Publish additionally freezes a per-revision, content-addressed,
      never-upscaled width ladder and manifest; serving marks renditions immutable.
      The draft is unchanged.
    story_uid: story-5349d01f
  - index: 2
    component: L1 renderer — srcset, sizes, intrinsic dimensions and the background
      ladder
    item_type: upgrade
    story_points: 2
    dependencies:
    - 1
    description: Extends existing story STORY-83 (story-d0a8cfad). The L1 renderer
      (packages/framework/src/l1/render.ts with delivery.ts) is the one emitter of
      <img>. Given a ladder manifest it emits srcset and sizes on the <img>, and stamps
      width/height from the measured intrinsic dimensions so there is no layout shift.
      A band background image (a CSS url() on a box) takes the same ladder through
      per-width background-image rules riding the existing per-breakpoint machinery.
      The base rule takes the smallest rung, a rule is emitted only where the choice
      changes, and the layer stack is emitted from one function so an override never
      drops a scrim/gradient layer. assetRefSchema is unchanged ({id, src, alt, focalPoint?});
      delivery is a property of the publish, not the document. Without a manifest
      (draft/edit) output is as before. Rendition URLs still pass the renderer's URL-safety
      checks.
    justification: STORY-83 owns the L1 renderer as the single safe emitter of image
      markup and background layers; srcset/sizes/width/height and per-width background
      rules extend that emitter in place, so no new capability bucket is introduced.
      No existing AC describes responsive image emission.
    target_story_ids:
    - story-d0a8cfad
    acceptance_criteria_changes:
      add:
      - Rendering with a ladder manifest emits srcset listing each rung with its width
        descriptor, plus sizes, on the <img>; rendering without one emits the plain
        src as before
      - Every laddered <img> carries width and height from the picture's measured
        intrinsic dimensions
      - 'A background image takes the ladder through per-breakpoint background-image
        rules: the base rule uses the smallest rung and a rule is emitted only where
        the choice changes'
      - A per-width background override keeps the whole layer stack (scrim/gradient
        layers over the image) intact
      - 'The site document schema is unchanged: assetRefSchema carries no delivery
        fields, and rendition URLs pass the same URL-safety sanitisation as any src'
      modify: []
      remove: []
    intent_delta_summary: The renderer consumes a publish-time ladder manifest to
      emit responsive <img> and background markup with intrinsic dimensions; the document
      schema stays delivery-free.
    story_uid: story-d0a8cfad
  - index: 3
    component: Material Ingestion & upload — HEIC converts at the door
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'Extends existing stories STORY-140 (story-6ccaedd5, ingestion) and
      STORY-145 (story-325da65f, upload overlay). ingestUpload detects HEIC/HEIF from
      the bytes'' ftyp major brand (never the declared type; eight HEIF brands convert,
      avif/avis are left alone) and converts it to JPEG through the Images binding
      before any material is created, so no record can name absent bytes. The filename
      changes with the bytes (shopfront.HEIC -> shopfront.jpg). Three distinct refusals,
      none creating material: no Images binding (deployment), too large (file), conversion
      threw (bytes). The [images] binding is declared in both wrangler environments.
      In the builder the file picker now carries an accept list stating what it takes,
      and a refusal from the Library route is reported to the client instead of the
      row silently never appearing.'
    justification: STORY-140 owns settling a file's type and storing it as material;
      HEIC conversion is a new branch of that same pipeline. STORY-145 owns the browser
      path a file takes in; the accept list and refusal reporting extend it. No new
      capability bucket.
    target_story_ids:
    - story-6ccaedd5
    - story-325da65f
    acceptance_criteria_changes:
      add:
      - 'STORY-140: a HEIC/HEIF upload, detected by its ftyp brand whether the declared
        type is image/heic or empty, is stored as JPEG and recorded as an image material
        named with a .jpg extension'
      - 'STORY-140: AVIF (avif/avis brands) is not converted'
      - 'STORY-140: conversion happens before any material is created; with no Images
        binding, an oversize file, or a conversion that throws, the upload is refused
        with a distinct message for each and no material or bytes are written'
      - 'STORY-140: the Images binding is declared in both deployment environments'
      - 'STORY-145: the file picker declares the types it accepts'
      - 'STORY-145: an upload refused by the Library route is reported to the client
        in the Library rather than silently disappearing'
      modify: []
      remove: []
    intent_delta_summary: Ingestion gains HEIC→JPEG conversion at the door with three
      explicit refusals; the upload UI states what it accepts and reports Library-route
      refusals.
    story_uid: story-6ccaedd5
  - index: 4
    component: Image editing — an edit is a recipe, one renderer, edit_image
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'New capability (REQ-219): an edit to a stored picture is an ordered,
      parameterised recipe kept on the material''s record; the original bytes are
      kept forever. image-recipe.ts defines the closed vocabulary (crop, rotate, resize,
      adjust) with its refusals, and compileRecipe() turns a recipe plus real dimensions
      into a transform chain — one step per operation in author order, tracking dimensions
      so each operation''s fractions are fractions of what came before. image-edit.ts
      puts the Images binding behind an ImageRenderer port and writes content-addressed
      renditions under rendition/<tenant>/ (outside the ticketing keyspace and its
      orphan sweep). A new `image` control surface (two groups, own grant) lets the
      assistant edit_image a picture named in the REQ-218 picture vocabulary; a site
      asset is refused because it has no recipe store. /api/material/file serves the
      current (recipe-applied) state by default, ?original=1 the stored bytes, and
      ?width= a delivery size that never touches the recipe. The Images binding is
      pinned in both environments.'
    justification: 'No story covers editing a picture at all: STORY-157 lets the assistant
      look at an `image` picture and STORY-172 generates one, but nothing stores an
      edit, compiles a recipe, or offers a write tool on a picture. This is a genuinely
      new capability; suggested home CAP-94 (Site Authoring Beyond The Element Tree
      … Generated Images, capability-2d32662d).'
    story_uid: story-ed976856
  - index: 5
    component: 'Library — the image modal: viewer, editable name, editing tools'
    item_type: upgrade
    story_points: 3
    dependencies:
    - 4
    description: Extends existing story STORY-144 (story-1500b111). Clicking a picture
      in the Library detail pane, or the same picture in the chat, opens one modal
      with the Library name and the four REQ-219 tools (crop, rotate, resize, adjust).
      picture-kind.js is the one predicate deciding which material is an editable
      picture (a capture or drawing is not offered a button the route would refuse).
      material-name.js is one name field mounted in both pane and modal, committed
      through reviseName. Undo/redo span the sitting; only the pending operation is
      drawn locally as CSS (image-preview.js), and committing writes the recipe through
      reviseRecipe (parsed and compiled via image-recipe.ts) and re-fetches the file
      route, so what the client sees came out of the publishing renderer. No control
      sends bytes.
    justification: STORY-144 owns seeing and correcting the client's material in the
      Library; renaming a picture and correcting how it looks extend that same surface.
      The editing semantics live in item 4, so this does not create a parallel capability
      — it is a second producer of the same recipe. No new capability bucket.
    target_story_ids:
    - story-1500b111
    acceptance_criteria_changes:
      add:
      - Clicking an editable picture in the Library detail pane opens the image modal
        showing the picture as it currently stands and its Library name
      - Clicking the same picture in the chat opens the same modal
      - Only materials the picture-kind predicate accepts are offered editing; captures
        and drawings are not
      - The material name is editable in both the detail pane and the modal through
        one commit path, and persists
      - Crop, rotate, resize and adjust each commit one operation to the material's
        recipe; the modal then shows the re-fetched rendered picture, and no original
        bytes are rewritten
      - Undo and redo step through operations made in the sitting and persist the
        resulting recipe
      modify: []
      remove: []
    intent_delta_summary: The Library gains a picture modal (also reachable from chat)
      for renaming and recipe-based editing, writing through the item-4 recipe path.
    story_uid: story-1500b111
  - index: 6
    component: Public forms — the draft preview submits for real
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: Extends existing story STORY-177 (story-f2e5032c). control-app answers
      POST /preview/<slug>/draft/api/lead through public-site's own handleLead and
      calls captureLead in process (no second implementation, no self service binding).
      The site key comes from the slug through the store, never the body. The form
      definition is read from the channel being previewed (the draft), not hardcoded
      to the live revision. The lead is a real contact in the real tenant and records
      its channel (preview) so it does not read as a public enquiry. Turnstile and
      the rate limiter are skipped behind a server-set `identified` flag no request
      can carry, because Access has already identified the submitter. The edit channel
      still refuses.
    justification: STORY-177 owns the lead-capture endpoint and its controls; the
      preview route is the same handler on another host, so this extends that story.
      Its description states authored values are read from the live published definition,
      which BUG-78 explicitly changes for the preview channel. No new capability bucket.
    target_story_ids:
    - story-f2e5032c
    acceptance_criteria_changes:
      add:
      - A submission to /preview/<slug>/draft/api/lead on the builder lands one lead
        contact in the tenant the slug names, through the same handler as the published
        endpoint
      - A preview submission resolves its form definition from the draft, so a form
        that exists only on the draft is accepted
      - A preview-captured lead records the preview channel in its provenance
      - A preview submission is not subject to Turnstile or the rate limiter; a public
        submission cannot obtain that bypass by anything in the request
      modify:
      - 'AC-2504: the tenant comes only from the URL — on the published site from
        the site path, in preview from the slug resolved through the store — never
        from the body'
      - 'AC-2505: authored values are read from the definition the submitter was served
        — the live revision for the published site, the draft for the preview'
      - 'AC-2515: a published form carries its instance id; the preview channel posts
        for real; the edit render still cannot post'
      remove: []
    intent_delta_summary: 'Lead capture now also works from the draft preview: same
      handler, draft definition, channel recorded, anti-abuse controls skipped only
      for server-identified preview submitters.'
    story_uid: null
---

# Reconciliation Plan

**Mode**: commits
**Source**: free-coded commits on BUNDLE-43 (REQ-222, REQ-221, REQ-219, REQ-220, BUG-78), 12 commits (5 are version bumps and carry no behaviour).

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commits: 923fa442, 12ffdb23, 82467050, 809d4ac2, 8168e001, c29be3d0, 1276ffa7 (+ bumps 44027cb8, c1c910ab, e00f79c4, 9fd8e588, 27478ac5)"
  features:
    - name: "Publish-time width ladder (REQ-222)"
      entry_files: [tools/generate/src/publish/ladder.ts, tools/generate/src/publish/publish.ts, apps/control-app/src/image-ladder.ts, tools/generate/src/store/*.ts, apps/public-site/src/index.ts]
      behaviors:
        - renditions generated at publish via Images binding into revision R2 prefix
        - content-addressed on original+recipe+width; unchanged picture => no transform
        - widths capped at source; never upscaled
        - draft gets no ladder
        - manifest with intrinsic dimensions recorded via store port
        - public-site serves renditions with immutable caching
    - name: "Renderer responsive images (REQ-222)"
      entry_files: [packages/framework/src/l1/render.ts, packages/framework/src/l1/delivery.ts]
      behaviors:
        - <img> gains srcset + sizes from manifest
        - width/height stamped from measured dimensions
        - background images get per-width rules on per-breakpoint machinery; smallest rung at base; layer stack preserved
        - assetRefSchema unchanged
    - name: "HEIC at the door (REQ-221)"
      entry_files: [apps/control-app/src/heic.ts, apps/control-app/src/material.ts, apps/control-app/src/builder/upload.js, apps/control-app/src/builder/library.js]
      behaviors:
        - ftyp-brand detection; 8 HEIF brands convert to JPEG; avif/avis untouched
        - conversion before material creation; filename extension follows bytes
        - three distinct refusals (no binding / too large / conversion failed)
        - picker accept list; Library-route refusal reported
    - name: "Image edit recipe (REQ-219)"
      entry_files: [tools/generate/src/cli/image-recipe.ts, apps/control-app/src/image-edit.ts, tools/generate/src/cli/ai/image-core.ts, tools/generate/src/cli/ai/image-surface.json, apps/control-app/src/router.ts]
      behaviors:
        - closed vocabulary crop/rotate/resize/adjust; compileRecipe ordered chain with dimension tracking
        - recipe stored on material record; original kept
        - renditions under rendition/<tenant>/
        - `image` surface with edit_image; site assets refused
        - /api/material/file current | ?original=1 | ?width=
    - name: "Image modal (REQ-220)"
      entry_files: [apps/control-app/src/builder/image-editor.js, image-preview.js, material-name.js, picture-kind.js, library.js, chat.js, apps/control-app/src/material.ts]
      behaviors:
        - modal from Library pane and from chat
        - editable name (reviseName) in pane and modal
        - four tools commit recipe (reviseRecipe), re-fetch rendered result; undo/redo
    - name: "Preview form submission (BUG-78)"
      entry_files: [apps/control-app/src/lead.ts, apps/control-app/src/router.ts, apps/public-site/src/lead.ts]
      behaviors:
        - POST /preview/<slug>/draft/api/lead via shared handleLead + in-process captureLead
        - definition from draft channel; channel recorded on lead
        - Turnstile/rate limit skipped behind server-set identified flag; edit channel refuses
```

## Coverage Map

```yaml
coverage_map:
  - feature: Publish-time width ladder
    status: partial
    existing_stories: [STORY-94 story-5349d01f, STORY-95 story-d34eccd8]
    gaps: [rendition generation, content addressing, no-upscale cap, draft exclusion, manifest, immutable caching]
  - feature: Renderer responsive images
    status: partial
    existing_stories: [STORY-83 story-d0a8cfad]
    gaps: [srcset/sizes, intrinsic width/height, background ladder rules]
  - feature: HEIC at the door
    status: partial
    existing_stories: [STORY-140 story-6ccaedd5, STORY-145 story-325da65f]
    gaps: [HEIC detection+conversion, refusals, picker accept, refusal reporting]
  - feature: Image edit recipe
    status: uncovered
    existing_stories: []
    notes: [STORY-157 (picture vocabulary, read-only) and STORY-172 (generation) are adjacent but neither edits]
  - feature: Image modal
    status: partial
    existing_stories: [STORY-144 story-1500b111]
    gaps: [modal viewer, editable name, editing tools, open-from-chat]
  - feature: Preview form submission
    status: partial
    existing_stories: [STORY-177 story-f2e5032c]
    existing_acs: [AC-2504, AC-2505, AC-2515]
    gaps: [preview route, draft definition, channel provenance, identified bypass]
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Site Delivery: publish width ladder | upgrade (STORY-94, STORY-95) | 3 | - | Ladder built at publish, content-addressed, capped, draft-free; immutable rendition caching |
| 2 | L1 renderer: srcset/sizes/dimensions/backgrounds | upgrade (STORY-83) | 2 | 1 | Responsive <img> and background emission from the manifest |
| 3 | Ingestion: HEIC at the door | upgrade (STORY-140, STORY-145) | 2 | - | HEIC→JPEG before material creation, three refusals, picker accept, refusal reporting |
| 4 | Image editing: recipe, renderer, edit_image | feature | 3 | - | Recipe vocabulary/compiler, ImageRenderer port, `image` surface, file route modes |
| 5 | Library: image modal | upgrade (STORY-144) | 3 | 4 | Modal from Library and chat, editable name, recipe-writing tools |
| 6 | Public forms: preview submits | upgrade (STORY-177) | 2 | - | Preview lead route, draft definition, channel recorded, identified bypass |

Total: 6 items (1 feature, 5 upgrade), 15 points.

## Reconciliation Decisions

- Intent resolved at ladder level 1: the ticket bodies, commit messages and code agree on every point, so no transcripts were consulted.
- REQ-220 is classed as an upgrade of STORY-144, not a feature: the Library already owns seeing and correcting material, and the editing semantics are owned by item 4 (REQ-219), so the modal is a second producer of an existing recipe rather than a new capability.
- REQ-219 has no existing story; suggested capability is CAP-94 (capability-2d32662d), which already holds generated images. CAP-112/CAP-113 are reasonable alternatives if the story cycle prefers.
- BUG-78 explicitly supersedes STORY-177's "authored values are read from the live published definition" for the preview channel; AC-2504/2505/2515 are modified (not removed) because their published-site behaviour still holds.
- No ACs are removed: none of these intents retracts prior behaviour outright.

## Observations

- No FC test files were found by the prompt's scan, but the commits add tests named test_UAT_FC_REQ-222_*, test_UAT_FC_REQ-221_*, test_UAT_FC_REQ-219_*, test_UAT_FC_REQ-220_* and test_UAT_FC_BUG-78_* (.ts). Their coverage maps: REQ-222 → items 1–2; REQ-221 → item 3; REQ-219 → item 4; REQ-220 → item 5; BUG-78 → item 6. The story cycle must rename them, or check_fc_orphans may fail.
- Commit 8168e001 adds the [images] binding with a UAT pinning it, as REQ-221 also does; both are covered by the binding AC in item 3 and the item-4 description.
- Commits 44027cb8, c1c910ab, e00f79c4, 9fd8e588, 27478ac5 are version bumps with no behaviour.
- The REQ-221 and REQ-219 commit messages both say that local Miniflare Images does not decode HEIC or honour crop. UATs therefore assert the converter call and compiled chain, not pixels; this is a known evidence limit, not a gap.
- xgd ticket search failed in this sandbox (it tried to write the embeddings cache in the main worktree), so stories were located by capability listing and a full story list.