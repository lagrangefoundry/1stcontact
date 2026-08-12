---
uid: report-91f4f6a2
id: REPORT-1892
type: report
title: 'Reconciliation Plan: REQ-136 phase 1 — a picture''s framing, shape and colour
  adjustment'
created_by: xgd
created_at: '2026-08-12T21:05:59.448505+00:00'
updated_at: '2026-08-12T21:49:33.003253+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: request-8a132869
  anchor_uid: request-8a132869
  items:
  - index: 1
    component: L1 substrate — the framing, shape and colour-adjustment axes and their
      emission
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'L1 gains three axis families, all typed, all closed, all emitted
      by the sole renderer. (a) `image.axes.objectPosition` — a percentage pair on
      the image leaf only, both components required because CSS silently defaults
      an unspecified one to 50%, so a half-written position is a value the document
      never said; deliberately not hoisted to the shared group, because `background-position`
      is a different CSS family still pinned by BUG-13. (b) `filter` — a colour-adjustment
      stack (`grayscale`/`sepia`/`invert`/`saturate`/`brightness`/`contrast`/`hueRotateDeg`/`blurPx`)
      on the SHARED surface group, so every painting kind carries it; held as CSS-canonical
      fractions (what `getComputedStyle` reports), emitted as ONE `filter` declaration
      in an order fixed by the renderer rather than taken from object key order, with
      each function''s identity emitting nothing; distinct from `backdropBlurPx`,
      which blurs what is behind the node. (c) `mask.shape` gains `parallelogram`
      (with `slantPct`, ±45) and `blob` (with `roughness` 0..1 and `seed`), both compiled
      to `clip-path: polygon(…)` built entirely by the renderer from those numbers
      — the document names an intent and never geometry. A blob is pseudo-random but
      DETERMINISTIC in its seed (24 vertices, seeded hash smoothed across neighbours;
      vertex count is a renderer constant, on the same rule as pointerAccent''s lobe
      count). The envelope gains `filterAmount = {min: 0, max: 4}` bounding the three
      scaling functions, `hueRotateDeg` taking the existing rotation bounds and `blurPx`
      the effect-length bounds — all checked inside `checkSurface`, so an interaction
      state''s adjustment is bounded by the same rule as the base.'
    justification: 'STORY-83 is the story that owns the L1 axis vocabulary, the safety
      envelope and the single safe emitter — it already states the DOC-27 rule that
      an axis earns its place iff it moves a pixel, and already carries the shared
      surface/paint group these axes join. This is that same vocabulary widening by
      three families with no new node kind, no new emitter and no new value shape,
      so it extends an existing capability bucket rather than opening one. But the
      story is currently incomplete about it in two ways: its shared-surface group
      does not name the node''s own colour adjustment (only `backdropBlurPx`, which
      is the other effect), and its mask vocabulary is the pre-REQ-136 `circle | ellipse
      | feather*`. FC UAT `test_UAT_FC_REQ-136_a_picture_can_take_a_typed_shape_the_renderer_draws`
      documents the shape half and has no AC.'
    story_uid: story-d0a8cfad
    target_story_ids:
    - story-d0a8cfad
    intent_delta_summary: 'STORY-83''s shared surface group grows by the node''s OWN
      colour adjustment, stated alongside — and explicitly distinguished from — the
      backdrop blur it already carries: one blurs what is behind the node, the other
      adjusts what the node itself paints, and one field could not express both at
      once. The mask vocabulary stops being ''a circular crop or a feathered edge''
      and becomes a shape vocabulary the renderer draws: `parallelogram` and `blob`
      join it, parameterised by numbers whose meaning belongs to the shape that names
      them and which are inert on the rest — exactly as `l1PatternSchema`''s `angleDeg`
      is inert on `dots`. Two properties become load-bearing claims of the story rather
      than implementation detail. First, EMISSION ORDER IS THE RENDERER''S: CSS filter
      functions compose in sequence, so `grayscale(1) saturate(2)` and `saturate(2)
      grayscale(1)` paint differently, and taking order from a JSON object''s key
      order — an accident of how a file was written or a diff applied — would let
      identical axes render two ways. Second, A GENERATED SHAPE IS DETERMINISTIC IN
      ITS SEED: a blob that differed between two renders of one document would break
      the round-trip identity the substrate is gated on (AC-683, DOC-23 §7) and make
      the picture twitch on every editor save. The image leaf gains one axis the shared
      group does not get, and the story says why rather than leaving it as an inconsistency:
      framing replaced content (`object-position`) and framing a paint layer (`background-position`)
      are different CSS families, and the background one is still pinned to `center`
      by BUG-13. The envelope section gains the ceiling on a scaling adjustment, on
      the same reasoning the story already applies to a texture''s period: `brightness(400)`
      is not an adjustment but a way to delete content the page still pays to download.
      Nothing previously claimed is withdrawn.'
    acceptance_criteria_changes:
      add:
      - 'A picture declares which part of itself its box shows: a typed percentage
        pair rendered as `object-position`, carried on the image leaf alone, with
        an absent axis meaning the browser''s own centre rather than a recorded default'
      - A node's own paint carries a typed colour adjustment on the shared surface
        group — offered by every painting kind, held as CSS-canonical fractions, and
        emitted as exactly one declaration whose function order is the renderer's
        and not the document's
      - A colour adjustment at a function's identity emits nothing, and the identity
        differs per function, so a fully desaturated surface and an unadjusted one
        never collapse to the same output
      - 'A typed shape names an intent and never geometry: a leaning quadrilateral
        and an organic outline are drawn by the renderer from bounded numbers, and
        a generated outline is identical on every render of the same document and
        different for a different seed'
      - The safety envelope bounds a colour adjustment through the shared surface
        check, so an adjustment that only fires on hover or focus is held to the same
        ceiling as the one the node paints at rest
      modify:
      - AC-802 (Every node kind admits the same shared axis groups) — the shared surface
        group is re-stated to include the node's own colour adjustment alongside the
        backdrop blur it already names, so the two effects are distinguished rather
        than conflated, and the one axis image alone carries (which part of the picture
        its box shows) is named as a deliberate exception with its reason
      remove: []
  - index: 2
    component: Structured copy editing — a picture's framing, shape and colour adjustment
      on the one write path
    item_type: upgrade
    story_points: 3
    dependencies:
    - 1
    description: 'The one validated, atomic write path now answers an image region
      with how the picture is SEEN as well as which picture it is. `copyFieldsOf`
      returns, after `src` and `alt` and in that order: fill mode, pan across/down
      (%), shape, corner rounding (px), rotate (°), scale (%), and six colour adjustments
      (brightness, contrast, saturation, black & white, hue shift, blur). Every one
      is a bounded integer or the axis''s own keyword list — no free-form control
      — and all of them route through REQ-135''s existing `''integer''`/`''enum''`
      descriptors, so no new field type, command, route or endpoint was added. `applyCopyFields`
      gains one branch writing those into the node''s `axes` / `mask` / `transform`
      IN PLACE. Four rules the write path holds to: IDENTITY REMOVES THE AXIS (`fill`
      is the CSS initial `object-fit`, 50/50 the initial `object-position`, 1 the
      identity of every scaling filter, 0 of the rest); NO EMPTY BAGS (emptying `filter`/`transform`
      drops the container, and an identity edit on a picture with no `axes` at all
      leaves it with none); PERCENTAGES ARE A PROJECTION over the fractions the substrate
      holds, with this module the single place that knows which is which (REQ-135''s
      `italic`-over-`fontStyle` precedent); and THE SHAPE LIST CARRIES WHAT THE NODE
      ALREADY HOLDS, including a `featherBottom` this control does not offer, because
      a select whose options omit its own value renders with the first option selected.
      Framing is offered on the `image` leaf only. No control on this surface touches
      a file.'
    justification: 'STORY-100 already owns field derivation, the change map, per-field
      refusal, atomicity and the bake-nothing guarantee for this exact surface — this
      is the same `copyFieldsOf` gaining one more answer and the same `applyCopyFields`
      gaining one more branch, with no new command, route or write path, so it extends
      an existing capability bucket rather than opening one. But the story is currently
      and explicitly WRONG about this behaviour: its Out of scope section names ''**Image
      framing** — crop, scale, scrim, rotation, edge effects, free positioning'' as
      deferred, and AC-1024 states an image region''s answer as which image goes there
      ''alongside its alt text'', which is now an incomplete list. AC-1027 (choosing
      an image bakes nothing) is stated of CHOOSING alone, when the load-bearing claim
      of REQ-136 is that ADJUSTING bakes nothing either. AC-1121 and AC-1122 state
      the bound-binds-a-change and the write-in-place rules of a typography edit specifically,
      when both now hold of a framing edit identically. Six FC UATs in tests/test_UAT_FC_REQ-136_image_framing.test.ts
      document the new behaviour and have no AC.'
    story_uid: story-37a3921b
    target_story_ids:
    - story-37a3921b
    intent_delta_summary: 'STORY-100 stops deferring image framing and starts owning
      it. Its Out of scope entry (''crop, scale, scrim, rotation, edge effects, free
      positioning — deferred rather than forgotten'') is withdrawn and replaced by
      the reason it was deferred being SATISFIED: DOC-28 §13 Q5 asked that the editor
      write the same fields the capture fold writes rather than a parallel vocabulary,
      and these controls are projections over `objectFit` / `objectPosition` / `filter`
      / `mask` / `transform`, which is exactly what the fold measures (item 3 makes
      that literally true for the two the fold had been dropping). An image region
      no longer exposes which picture and its alt text alone; it exposes those FIRST,
      IN THAT ORDER — order is load-bearing, because the modal opens into the picker
      and that depends on `src` being first — and then how the picture is framed,
      shaped and adjusted. Three of the story''s existing claims generalise rather
      than being replaced: bakes-nothing extends from choosing a picture to adjusting
      one, which is the whole design (one uploaded asset serves many framings; no
      image-decoding pipeline joins the attack surface, DOC-2); the bound-binds-a-change-not-the-status-quo
      rule extends from a run''s size to every bounded control, which matters because
      the modal posts every staged field and a picture the fold clamped to the pill
      radius sentinel must survive being opened and re-saved; and the write-in-place,
      remove-the-default, no-diff-for-a-no-op rule extends from a typography edit
      to a framing edit. Two boundaries are held deliberately and should be stated
      rather than left implicit. FRAMING IS THE IMAGE LEAF ONLY: on a painted surface
      the same intent lands on a different CSS family and BUG-13''s `cover / center
      / no-repeat` pin is still in place. And COLOUR ADJUSTMENT IS NOT COLOUR CHOICE:
      the story''s separate deferral of colour (a run''s own colour, a panel''s paint)
      is untouched and still blocked on REQ-133, because that needs a pick from the
      site''s palette, whereas adjusting a picture''s brightness or saturation is
      a bounded number that needs no palette at all. `sepia` and `invert` exist in
      the substrate and in the fold but are deliberately not offered here — stylisation
      rather than adjustment, and the AI addresses them directly. Nothing previously
      claimed is withdrawn beyond the superseded deferral itself.'
    acceptance_criteria_changes:
      add:
      - Panning a picture writes a typed percentage pair — both components or neither,
        because an unspecified component is a silent default the document never said
        — and returning it to centre removes the pair rather than recording the browser's
        own value
      - A picture's colour is adjusted through bounded percentage controls over the
        fractions the definition holds, and a control returned to its identity leaves
        the definition exactly as it found it, container and all
      - The shapes a picture offers include whatever shape it already carries, even
        one this surface does not itself offer, so opening a picture the AI shaped
        and saving something else about it cannot silently reshape it
      - A picture answers with the values a browser would actually paint — its fill
        mode, its centre, unrotated and unadjusted — rather than with blanks, when
        it carries no framing parameters at all
      modify:
      - AC-1024 (Asking an image region what it exposes returns which image goes there
        — a closed list of the site's images — alongside its alt text) — re-stated
        so the pair is what an image region leads with, in that order, followed by
        how the picture is framed, shaped and colour-adjusted; the claim becomes what
        the answer starts with rather than the whole of what it contains
      - 'AC-1027 (Choosing an image bakes nothing: no asset file is touched and every
        other parameter the region carries survives untouched) — generalised from
        choosing to choosing OR adjusting: no framing, shape or colour edit writes,
        copies, resizes or processes a file either, and the region still points at
        the same handle afterwards'
      - AC-1121 (The size bound binds a change and never the status quo) — generalised
        from a run's size to every bounded control on this surface, so a picture whose
        corner radius is outside the control's range survives being opened and re-saved
        unchanged, while a newly-posted out-of-range framing value is refused rather
        than clamped
      - 'AC-1122 (A typography edit writes into the parameters the run already carries
        and disturbs no other, an undeclared default is removed rather than written
        in, and a change map that changes nothing produces no diff) — generalised
        to a framing edit, with the empty-container half made explicit: emptying a
        group drops the group, and an identity edit on a picture carrying no parameters
        at all leaves it carrying none'
      remove: []
  - index: 3
    component: The fold — a captured pan and colour adjustment now have somewhere
      to land
    item_type: upgrade
    story_points: 2
    dependencies:
    - 1
    description: '`capture/extract.ts` read `object-position` (per image) and `filter`
      (per painted element) all along; `fold.ts` dropped both because L1 had nowhere
      to put them — and `filter` was already a Type-A axis the values-diff compares,
      so every target painting one reported a delta that nothing could close. `foldObjectPosition`
      and `foldFilter` now carry both onto the folded document. Their rules: the browser''s
      own default folds to nothing (`50% 50%`, `filter: none`, any function at its
      identity), because an axis is worth carrying only when it says something the
      browser would not do anyway; a ratio written as a percentage and as a number
      are the same filter and both land as the fraction (`saturate(40%)` and `saturate(0.4)`);
      THE IDENTITY DIFFERS PER FUNCTION, so the skip rule is a per-function table
      rather than one constant — `grayscale(0)` and `saturate(1)` are both no-ops
      while `grayscale(1)` and `saturate(0)` are both extremes, and one rule for both
      would silently fold a fully desaturated photograph to no filter at all; a form
      the fold cannot read (`left top`, a px pair) folds to nothing and shows up as
      a residual rather than a guess; a value past the envelope ceiling is clamped
      to the nearest expressible one rather than dropped, because a real treatment
      the target paints reproduces better near-missed than absent, while a negative
      one is not a treatment at all; and `drop-shadow` is deliberately NOT read, because
      L1 already carries a typed shadow and folding it here would give the substrate
      two ways to say one thing.'
    justification: 'STORY-84 owns the fold from a multi-viewport capture into one
      L1 reproduction document, and already claims that a text-free media element
      folds to an image leaf carrying its image axes and that no captured element
      is silently dropped. This is that same fold gaining two more axes it can now
      express — the same function, the same document, no new command or pipeline —
      so it extends an existing capability bucket rather than opening one. But the
      story''s coverage is incomplete in a way that mattered: it does not say which
      image axes survive the fold, and for these two the honest answer until this
      commit was ''neither'', which made the reproduction wrong on any target that
      panned a `cover` image or adjusted a photograph''s colour. FC UAT `test_UAT_FC_REQ-136_the_fold_now_carries_a_captured_pan_and_colour_adjustment`
      documents the new behaviour and has no AC.'
    story_uid: story-8acc338d
    target_story_ids:
    - story-8acc338d
    intent_delta_summary: 'STORY-84 gains the two axes the capture had been measuring
      and the fold had been discarding, and states the discipline that governs how
      a measured CSS value becomes a typed axis — which is the story''s actual subject
      and was previously only implicit. Three rules become explicit claims. THE BROWSER''S
      OWN DEFAULT IS NOT WORTH CARRYING: a folded definition that recorded `50% 50%`
      or `saturate(1)` would grow on every page with declarations that cost a composite
      layer and move no pixel. THE IDENTITY IS PER-FUNCTION, NOT GLOBAL: this is the
      rule whose absence would have failed silently rather than loudly, folding a
      fully desaturated photograph to no filter and reproducing it in full colour.
      AND AN UNREADABLE FORM IS A RESIDUAL, NEVER A GUESS: a keyword or length form
      of `object-position` the fold cannot parse becomes a findable gap, which is
      what the story''s existing no-element-silently-dropped claim already promises
      for elements and should promise for values too. One deliberate omission is recorded
      rather than left to look like a miss: `drop-shadow` is not read, because L1
      already carries a typed shadow and a second way to say one thing is the legacy-mode
      state the project forbids. Nothing previously claimed is withdrawn.'
    acceptance_criteria_changes:
      add:
      - A captured pan folds to the typed pair the substrate holds, while the browser's
        own centre and any form the fold cannot read fold to nothing and remain findable
        as a residual rather than becoming a guess
      - A captured colour adjustment folds to the typed stack, with a ratio landing
        as the same fraction however the browser spelled it, each function's own identity
        skipped rather than one rule applied to all, and a value past the envelope
        carried at the nearest expressible one
      modify:
      - AC-729 (A text-free media element folds to an image leaf with its resolved
        source and alternative text) — extended to name the framing the leaf carries
        with them, so the claim covers how the picture is seen and not only which
        picture it is and what it is called
      remove: []
  - index: 4
    component: Edit render channel — an adjustment paints in the editor exactly as
      it does on the page
    item_type: upgrade
    story_points: 1
    dependencies:
    - 1
    - 2
    description: 'The editor''s preview IS the edit render channel (DOC-28 §5.1) —
      same renderer, same L1 document — so an adjustment expressed as a typed axis
      cannot appear one way while adjusting and another once published. The commit
      asserts this rather than assuming it: a picture given a fill mode, a pan, a
      saturation, a rotation and a generated shape emits an identical set of `object-*`
      / `filter` / `clip-path` / `transform` declarations in both channels, and the
      comparison is proved non-vacuous by checking the adjustment really is in the
      emitted output.'
    justification: 'STORY-98 owns the edit render channel and already claims content
      parity with the preview render (AC-948) plus the rule that the shipped channels
      carry no edit-channel artefacts (AC-956). Paint parity is the same subject one
      step further and belongs to the same story — it is not a property of the write
      path (which is item 2''s bucket) but of the channel, so putting it anywhere
      else would misfile it. It is not covered today: AC-948''s claim is about the
      CONTENT the edit render carries, which says nothing about whether the two channels
      paint that content identically. FC UAT `test_UAT_FC_REQ-136_the_edit_render_paints_an_adjustment_exactly_as_the_page_does`
      documents the behaviour and has no AC.'
    story_uid: story-af36c2cb
    target_story_ids:
    - story-af36c2cb
    intent_delta_summary: 'STORY-98 adds the claim that the edit channel and the shipped
      channel paint identically, not merely that they carry the same content. This
      is currently STRUCTURAL rather than maintained — there is one emitter and one
      document, so it cannot be otherwise — and the story should say exactly that,
      and then assert it anyway. The reason to assert something that is true by construction
      is named in REQ-136 itself: the day someone adds a second emitter for drag-time
      feedback (the anticipated phase-2 mechanism, where a pointer-move cannot afford
      a server round-trip and the adjustment→CSS mapping is applied as inline style
      by the modal) is the day it can stop being true, and the assertion is what would
      catch that. The claim is deliberately scoped to paint rather than to the whole
      rule set, because the channel''s existing intent is that the edit render deliberately
      does NOT work — its behaviour differs on purpose (AC-948, AC-950), and only
      how it paints must not. Nothing previously claimed is withdrawn.'
    acceptance_criteria_changes:
      add:
      - 'What I see while adjusting a picture is what the page will show: the edit
        render and the shipped render emit the same paint for the same definition,
        because they are one emitter reading one document and not two things kept
        in step'
      modify: []
      remove: []
---

# Reconciliation Plan — REQ-136 phase 1

**Mode**: commits
**Anchor**: `request-8a132869` (REQ-136 — an intent ticket, used directly as the subject)
**Commit**: `a1a43d2a99d076f85e868d828a4d6649e8880a65` (on this branch as `94ba66626`) — *feat(editor): a picture's framing, shape and colour are editable [FREE-CODED]*

## Intent (step 0)

REQ-136's body declares a two-phase ticket and records **phase 1 as DELIVERED**. The intent is narrower and more load-bearing than "add image controls":

- **Adjust the view, never the bytes.** *No operation touches a file.* Every tool writes a typed L1 axis and the renderer applies it. The ticket names four compounding reasons: one asset serves many framings; an adjustment is an ordinary structured diff with the same validator, change map and undo as any other edit; no image-decoding pipeline joins the attack surface (DOC-2, DOC-12 §8); and the adjustment stays *legible* — the AI can read `saturate: 0.4` and reason about it, and cannot read pixels, so the capability matrix keeps meaning something.
- **The cost is named and deferred deliberately.** A 4000px hero cropped to a thumbnail still ships 4000px. That is performance, not correctness, and its fix is additive (a derived-render cache keyed on `(asset, adjustment)`, no model change).
- **Editor/page parity is structural, not a feature.** The editor's preview *is* the edit render channel (DOC-28 §5.1). Parity is therefore unavoidable — and the ticket asserts it anyway, "because the day someone adds a second emitter for drag feedback is the day it can stop being true."
- **Explicitly out of phase 1**: zoom / true source-rect crop (`object-view-box` is not Baseline — no Firefox — so it fails the 3-engine gate), tint/duotone over an `<img>`, background-surface framing (BUG-13's `cover / center / no-repeat` pin stands), drag-driven handles, the derived-render cache, and offering `sepia` / `invert` in the editor.

The body also records, as an explicit **intent conflict**, that REQ-136 supersedes the pinned "an image segment exposes exactly `src` + `alt`" in five earlier suites — the same treatment REQ-135 applied on the copy side, for the same reason.

## Step 3b — intent scope vs implementation footprint

**Case 1 (matches)** for the substance: every file in the diff is declared in the ticket's phase-1 section. `render.ts`, `schema.ts`, `types.ts`, `validate.ts` and `edit.ts` implement the three axis families and the control panel; `fold.ts` implements the two declared capture gaps; `package.json` is a version bump (0.1.37 → 0.1.38) with no matrix impact.

**Case 2 (explicit supersession)** in two places, both handled as `modify` entries rather than as new claims:

1. **STORY-100's Out of scope** names *"**Image framing** — crop, scale, scrim, rotation, edge effects, free positioning. Deferred rather than forgotten: the capture/fold pipeline already folds those parameters into the definition, and this surface must eventually write **the same fields**, not a parallel vocabulary (DOC-28 §13 Q5)."* REQ-136 satisfies precisely that condition — the controls are projections over `objectFit` / `objectPosition` / `filter` / `mask` / `transform`, and item 3 makes the fold literally write the two it had been dropping. The deferral is withdrawn knowingly.
2. **Five suites re-stated.** `reconciliation-copy-edit-image-selection`, `-write-path`, `-background-selection`, `-form-presentation` and `req118-image-selection` pinned the image field list as exactly `['src','alt']`. Each is re-stated as its actual subject (the pair comes **first, in that order**; `toMatchObject` rather than `toEqual`; the background picker is *absent* from an image's fields; the form-presentation claim is *more than one field → none opened*, not a row count).

**No Case 3 found.** No file in the diff touches an area whose owning intent is silent about it. Two supersession targets — **AC-1028** and **AC-1044**, both on **STORY-101** (*Click the words on my page and change them*) — are deliberately **not** given plan items: their AC text never claimed the field list was exhaustive (AC-1028 is "a picker of the site's images, with its current handle always among them"; AC-1044 is "exactly one field opens in its control, a box with more opens none"). Both remain true verbatim; it was the **tests** that over-asserted, and re-stating a test to match an AC that was already right is not a matrix change. Flagged here so the review does not read the untouched STORY-101 as an omission.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commit a1a43d2a (REQ-136 phase 1)"
  entry_files:
    - "packages/site-schema/src/l1/schema.ts"
    - "packages/site-schema/src/l1/validate.ts"
    - "packages/site-schema/src/l1/types.ts"
    - "packages/site-schema/src/l1/edit.ts"
    - "packages/framework/src/l1/render.ts"
    - "tools/generate/src/l1/fold.ts"
  features:
    - name: "L1 axis: image.axes.objectPosition"
      description: "The pan half of a crop, on the image leaf only. A typed {xPct, yPct} pair, 0..100 each, BOTH REQUIRED."
      behaviors:
        - "Both components or neither: CSS silently defaults an unspecified one to 50%, so a half-written position is a value the document never said"
        - "Renders as `object-position: X% Y%`, emitted beside object-fit because the pair is one idea"
        - "Not hoisted to the shared surface group: background-position is a different CSS family, still pinned by BUG-13"
      entry_point: "l1ObjectPositionSchema / emitNode case 'image'"
    - name: "L1 axis: filter (shared surface group)"
      description: "A typed colour-adjustment stack on every painting kind. grayscale/sepia/invert/saturate/brightness/contrast/hueRotateDeg/blurPx, held as CSS-canonical fractions."
      behaviors:
        - "Fractions not percentages, because that is what getComputedStyle reports and therefore what the fold can write unconverted"
        - "Emitted as exactly ONE `filter` declaration, in an order fixed by the renderer — filter functions compose in sequence, so key order must not decide the pixels"
        - "A function at its identity emits nothing; the identity is 1 for the scaling functions and 0 for the rest"
        - "Distinct from backdropBlurPx: this adjusts the node's own paint, that blurs what is behind it"
        - "Bounded by L1_ENVELOPE.filterAmount {0, 4} inside checkSurface, so an interaction state's delta is bounded by the same rule as the base (the REQ-99 hole)"
      entry_point: "l1FilterSchema / filterDecls / checkSurface"
    - name: "L1 axis: mask.shape gains parallelogram and blob"
      description: "The shape vocabulary widens; the geometry is built entirely by the renderer."
      behaviors:
        - "parallelogram + slantPct (±45): top edge leans one way, bottom the opposite, so the shape stays a parallelogram rather than becoming a trapezium"
        - "blob + roughness (0..1) + seed (0..9999): 24 vertices at evenly-spaced angles, radius perturbed by a seeded hash and smoothed across neighbours"
        - "DETERMINISTIC in its seed — a shape differing between two renders would break round-trip identity (DOC-23 §7) and twitch on every editor save"
        - "Vertex count is a renderer constant, on the same rule as pointerAccent's lobe count"
        - "Both compile to clip-path: polygon(…): the document names an intent and never geometry"
        - "Rounding (borderRadiusPx) and masking are independent — a rounded blob is expressible"
      entry_point: "l1MaskSchema / parallelogramPoints / blobPoints / maskDecls"
    - name: "Editor: the image segment's property sheet"
      description: "copyFieldsOf answers an image node with src, alt, then thirteen framing/shape/colour controls."
      behaviors:
        - "Field order: src, alt, objectFit, objectPositionXPct, objectPositionYPct, shape, cornerRadiusPx, rotateDeg, scalePct, brightnessPct, contrastPct, saturatePct, grayscalePct, hueRotateDeg, blurPx"
        - "Order is load-bearing: the modal opens into the picker, which depends on src being first"
        - "Every control is a bounded integer or the axis's own keyword list — no free-form control, so widening this surface never widens the attack surface"
        - "A bare picture reads back what a browser would paint (fill, 50/50, 0°, 100%) rather than blanks"
        - "Colour controls are PERCENTAGE PROJECTIONS over fractional axes (REQ-135's italic-over-fontStyle precedent); edit.ts is the single place that knows which is which"
        - "The shape list is the geometric set UNION whatever the node already carries, so an AI-feathered picture is not silently squared off by saving its alt text"
        - "sepia/invert exist in L1 and in the fold but are not offered — stylisation, not adjustment"
        - "NO NEW PLUMBING: REQ-135's 'integer' descriptor with min/max covers every control; the modal's existing type !== 'string' split routes them with no client change"
      entry_point: "copyFieldsOf / imageFramingFields"
    - name: "Editor: the image-framing write path"
      description: "applyCopyFields gains one branch writing framing fields into axes / mask / transform, in place."
      behaviors:
        - "Assignment INTO the existing bags, never replacement — an image carries a full surface group and replacing axes would drop what the derivation does not know about"
        - "IDENTITY REMOVES THE AXIS: fill, 50/50, scaling-filter 1, everything-else 0"
        - "NO EMPTY BAGS: emptying filter/transform drops the container; an identity edit on a picture with no axes leaves it with none"
        - "Shape written bare — a mask's parameters belong to the shape that names them; renderer defaults apply, tuning is the AI's"
        - "Out-of-range is REFUSED, never clamped, leaving the draft byte-identical"
        - "The bound binds a CHANGE and not the status quo: a pill-radius sentinel survives a re-save (the modal posts every staged field)"
        - "No edit touches the asset directory; the node still points at the same handle"
      entry_point: "applyCopyFields / writeImageFraming / applyFraming"
    - name: "Fold: foldObjectPosition and foldFilter"
      description: "Two axes the capture read all along and the fold dropped, because L1 had nowhere to put them."
      behaviors:
        - "filter was already a Type-A axis the values-diff compares, so every target painting one reported a delta nothing could close"
        - "The browser's own default folds to nothing (50% 50%, filter: none, any function at identity)"
        - "A ratio written as a percentage and as a number are the same filter; both land as the fraction"
        - "THE IDENTITY DIFFERS PER FUNCTION — one rule would silently fold a fully desaturated photograph to no filter"
        - "An unreadable form (left top, a px pair) is a residual, never a guess"
        - "Past the envelope ceiling is clamped to the nearest expressible value; negative is not a treatment and is skipped"
        - "drop-shadow deliberately NOT read: L1 already has a typed shadow, and two ways to say one thing is the forbidden legacy-mode state"
      entry_point: "foldObjectPosition / foldFilter / imageAxes / boxAxes"
    - name: "Parity between the edit render and the shipped render"
      description: "One emitter, one document — so an adjustment paints identically in both channels."
      behaviors:
        - "Same object-*, filter, clip-path and transform declarations from renderL1Document(doc) and renderL1Document(doc, {edit: true})"
        - "Asserted rather than assumed, because a second emitter for drag feedback would end it"
      entry_point: "renderL1Document"
```

## Coverage Map

```yaml
coverage_map:
  - feature: "L1 axes: objectPosition, filter, mask shapes + envelope + emission"
    status: partial
    existing_stories: ["story-d0a8cfad"]  # STORY-83
    existing_acs: ["AC-802", "AC-725", "AC-832", "AC-683", "AC-849"]
    gaps:
      - "The shared surface group is described without the node's own colour adjustment; only backdropBlurPx is named, and the two are different effects"
      - "The mask vocabulary is the pre-REQ-136 circle | ellipse | feather* set"
      - "No claim that emission order is the renderer's rather than the document's — load-bearing, because filter functions compose in sequence"
      - "No claim that a generated shape is deterministic in its seed — required by AC-683's round-trip identity"
      - "No envelope claim for a colour adjustment, and specifically none for an interaction state's adjustment (the REQ-99 hole)"
      - "No claim for the one axis the image leaf carries alone, nor the reason it is not hoisted"
    notes:
      - "AC-725 (typed axes render as CSS re-derived from their fields) and AC-802 (every kind admits the same shared groups) are generic enough to cover EXISTENCE, but neither covers order, determinism or the bound — the three properties whose absence would fail silently"

  - feature: "The image segment's property sheet and its write path"
    status: partial
    existing_stories: ["story-37a3921b"]  # STORY-100
    existing_acs: ["AC-1024", "AC-1027", "AC-991", "AC-988", "AC-1121", "AC-1122", "AC-981", "AC-983", "AC-984"]
    gaps:
      - "The story's Out of scope EXPLICITLY defers image framing — the single clearest misalignment in this reconciliation"
      - "AC-1024 states an image region's answer as the src/alt pair, which is now an incomplete list rather than a wrong one"
      - "AC-1027's bakes-nothing claim is made of CHOOSING an image; the whole design of REQ-136 rests on it holding of ADJUSTING one"
      - "AC-1121 and AC-1122 are stated of a typography edit specifically; both hold identically of a framing edit"
      - "No claim for the both-or-neither pan, the percentage-over-fraction projection, the union shape list, or reading back browser defaults instead of blanks"
    notes:
      - "AC-991 (every control is plain text, a pick, a bounded whole number or a yes/no) already covers the closed-control claim — REQ-135 generalised it, and REQ-136's thirteen controls fall inside it unchanged. Not a gap."
      - "AC-983/984/985/986/987 (atomicity, byte-identical refusal, fault shape, whole-definition validation, address refusal) hold unchanged: this adds no command, route or write path"

  - feature: "The fold carries a captured pan and colour adjustment"
    status: partial
    existing_stories: ["story-8acc338d"]  # STORY-84
    existing_acs: ["AC-729", "AC-733", "AC-689"]
    gaps:
      - "AC-729 names an image leaf's source and alt text but not the framing it carries — and for these two axes the honest answer until this commit was that the fold discarded them"
      - "No claim about how a measured CSS value becomes a typed axis: default-is-not-worth-carrying, identity-is-per-function, unreadable-is-a-residual"
      - "No claim recording drop-shadow as a deliberate omission rather than a miss"
    notes:
      - "AC-733 (no captured element silently dropped; unexpressed becomes a residual) makes the promise for ELEMENTS; these two axes are the same promise one level down, for VALUES"

  - feature: "Edit render / page render paint parity"
    status: partial
    existing_stories: ["story-af36c2cb"]  # STORY-98
    existing_acs: ["AC-948", "AC-956"]
    gaps:
      - "AC-948 claims the edit render carries the same CONTENT as the preview render — which says nothing about whether the two channels PAINT that content identically"
    notes:
      - "Scoped to paint on purpose: the channel's existing intent is that the edit render deliberately does NOT work (AC-948, AC-950). Its behaviour differs by design; only its paint must not."

  - feature: "Five suites re-stated (the 'exactly src + alt' pin)"
    status: covered
    existing_stories: ["story-37a3921b", "story-3bf94bd4"]
    existing_acs: ["AC-1024", "AC-981", "AC-988", "AC-1045", "AC-1049", "AC-1028", "AC-1044"]
    gaps: []
    notes:
      - "AC-1024 needs modification and is handled inside item 2. AC-981/988/1045/1049 hold verbatim — the tests over-asserted, the ACs did not."
      - "AC-1028 and AC-1044 are STORY-101's and are deliberately given NO plan item: both texts remain true word for word. See step 3b."

  - feature: "Phase 2 (zoom/source-rect crop, tint, background framing, drag handles, derived-render cache, sepia/invert in the editor)"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps: []
    notes:
      - "NOT PLANNED — no code exists. Reconciliation documents what the commits do; these are declared phase-2 in the ticket body and would be inventing behaviour."
```

## Plan Items

| # | Component | Type | Points | Deps | Target | Description |
|---|-----------|------|--------|------|--------|-------------|
| 1 | L1 substrate — framing, shape and colour-adjustment axes and their emission | upgrade | 3 | — | STORY-83 `story-d0a8cfad` | Three axis families join L1: an image-only pan, a shared colour-adjustment stack emitted in a renderer-fixed order, and two renderer-drawn shapes with a seed-deterministic blob — plus the envelope ceiling that binds them through the shared surface check |
| 2 | Structured copy editing — a picture's framing, shape and colour adjustment | upgrade | 3 | 1 | STORY-100 `story-37a3921b` | The one write path answers an image with thirteen closed controls beside its picker, writes them in place, removes an axis at its identity, invents no empty container, refuses rather than clamps — and touches no file |
| 3 | The fold — a captured pan and colour adjustment now have somewhere to land | upgrade | 2 | 1 | STORY-84 `story-8acc338d` | Two axes the capture always read and the fold always dropped now land as typed values, with per-function identities, both ratio spellings, and an unreadable form left as a residual |
| 4 | Edit render channel — an adjustment paints in the editor exactly as on the page | upgrade | 1 | 1, 2 | STORY-98 `story-af36c2cb` | Paint parity between the edit channel and the shipped channel, asserted rather than assumed |

**Totals**: 4 items — feature 0, upgrade 4 — 9 points.

## FC test evidence

The dispatcher passed `fc_tests: []`, but `tests/test_UAT_FC_REQ-136_image_framing.test.ts` **is present on disk** and was added by this commit. It is treated as binding evidence. Verified during planning: `npx vitest run tests/test_UAT_FC_REQ-136_image_framing.test.ts` — **9 passed / 9**.

Every FC test has a home, so `check_fc_orphans` will find none left:

| FC test | Item | Lands on |
|---|---|---|
| `an_image_offers_framing_shape_and_colour_beside_the_picker` | 2 | modify AC-1024 |
| `panning_a_picture_writes_a_typed_object_position_pair` | 2 | add (typed both-or-neither pair) |
| `colour_adjustment_lands_as_fractions_and_renders_in_a_fixed_order` | 2 | add (percentage-over-fraction projection) |
| `a_picture_can_take_a_typed_shape_the_renderer_draws` | 1 | add (a shape names an intent, never geometry) |
| `the_shape_list_carries_a_shape_the_control_does_not_offer` | 2 | add (union shape list) |
| `a_framing_edit_disturbs_no_other_axis_and_invents_no_empty_bag` | 2 | modify AC-1122 |
| `an_out_of_range_ask_is_refused_and_no_edit_touches_the_asset` | 2 | modify AC-1121 + AC-1027 |
| `the_edit_render_paints_an_adjustment_exactly_as_the_page_does` | 4 | add (paint parity) |
| `the_fold_now_carries_a_captured_pan_and_colour_adjustment` | 3 | add (fold carries the adjustment) |

## Observations

- **Four items, four capability buckets, no overlap.** The commit is a single coherent feature that lands in four places by construction: the substrate that can express the adjustment (`capability-ae9d65d6`), the surface that writes it (`capability-f753cecd`), the fold that reads it back off a captured page (`capability-2049c9ec`), and the channel that shows it while you work (`capability-12fee326`). Collapsing any two would file a claim under a bucket that does not own it. Item 4 is a single AC and was still worth its own item, because the alternative — hanging paint parity off the write-path story — would put a render-channel property in the editing bucket, and the FC test proving it would then be orphaned when the review checks bucket alignment.
- **Zero feature items.** Every behaviour extends a bucket that already exists. This is what the reuse-first bias predicts for a ticket whose own design principle is *no new mechanism*: the commit adds no command, no route, no endpoint, no field type and no value vocabulary. It is the third in a row (REQ-132, REQ-135, REQ-136) shaped to fail if it became a second mechanism, and the plan should read that way too.
- **The most valuable thing this reconciliation does is retire a stale deferral.** STORY-100's Out of scope currently tells a reader that image framing is not implemented and states the precondition under which it would be. Both halves are now wrong. A capability matrix that says a shipped capability is deferred is worse than one that is merely silent about it — silence is a gap, a stale deferral is a false negative that a future planner would act on.
- **Three properties are documented because their absence would fail SILENTLY.** Filter emission order (identical axes painting two ways depending on how a file was written), blob determinism (a picture twitching on every save, round-trip identity broken), and the per-function fold identity (a fully desaturated photograph folding to no filter and reproducing in full colour). None would throw; each would just be quietly wrong. They are stated as claims rather than left as implementation detail for exactly that reason.
- **Judgment call — AC-1028 and AC-1044 get no plan item.** They are among the five suites the commit re-stated, so they look like supersession targets. They are not: both AC texts were always narrower than the assertions written against them. Modifying an AC that is already correct would be churn, and would misrepresent the tests' over-assertion as an intent change. Flagged in step 3b so the review does not read the omission as a miss.
- **Judgment call — generalise rather than add, four times.** AC-1027, AC-1121, AC-1122 and AC-729 are each modified to cover a wider subject rather than paired with a framing-specific sibling. The rules genuinely are the same rule (bakes nothing; the bound binds a change; write in place and remove the default; an image leaf carries its framing), and a matrix with a typography copy and an image copy of one claim invites them to drift apart.
- **Area of uncertainty — item 1's boundary with AC-725 and AC-802.** Both existing ACs are written generically enough that a reader could argue they already cover the new axes' existence. They do. What they do not cover is order, determinism and the envelope bound, which is where item 1's added ACs sit. If the story cycle finds the added ACs restating AC-725, the right correction is to narrow the additions, not to drop item 1 — the mask vocabulary and the shared-group description are stale regardless.
- **Phase 2 is deliberately unplanned.** Zoom / true source-rect crop, tint over an `<img>`, background-surface framing, drag handles, the derived-render cache and `sepia`/`invert` in the editor are all named in the ticket and all unimplemented. Reconciliation documents commits; planning them here would invent behaviour.