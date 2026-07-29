---
uid: report-fea0d724
id: REPORT-1011
type: report
title: 'Reconciliation Plan: BUNDLE-8 (L1 language power + folder rebuild + gate evaluator,
  free-coded)'
created_by: xgd
created_at: '2026-07-29T03:46:13.561155+00:00'
updated_at: '2026-07-29T04:06:13.234242+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-cceaba25
  anchor_uid: bundle-cceaba25
  items:
  - index: 1
    component: L1 layout substrate — typed pixel-mover axes + document resource table
    item_type: upgrade
    story_points: 3
    dependencies: []
    target_story_ids:
    - story-d0a8cfad
    intent_delta_summary: 'STORY-83 already documents the L1 typed tree, envelope
      validator, and single safe renderer. This reconciliation extends the same bucket
      in two directions: (a) LANGUAGE POWER — every captured pixel-mover that L1 had
      no axis for is now a typed axis (text: gradientFill/textDecoration/textShadow/fontVariantCaps/listMarker;
      box: surfaceGradient/backgroundImageUrl/overlay scrim/border/boxShadow/backdropBlurPx/blendMode;
      image: blendMode/border/boxShadow; any node: transform/mask), each non-scalar
      family carried as a typed structured form (l1Gradient/l1Shadow/l1Border/l1Mask/l1Transform/l1Overlay)
      whose CSS the renderer re-derives from numeric/enum/hex fields — never a passthrough
      string; (b) LANGUAGE FORM — a document-level `resources.fonts` table binds a
      font *handle* (text.axes.fontFamily) to its pixel-determining *substance* (a
      served .woff2), and the renderer emits @font-face through the same sole safe
      sink. The envelope grew correspondingly: effectPx / transformScale bounds, hex-only
      gradient stops and border colours, URL-scheme allowlist on backgroundImageUrl
      and each font src, font weight range. No new capability bucket: this is the
      same typed-tree + envelope + safe-emitter surface, wider.'
    description: 'Document the L1 substrate''s grown axis vocabulary and its new document-level
      font resource table: the typed structured forms accepted by the schema, the
      bounds/rejections the envelope enforces on them, the CSS the sole renderer re-derives
      for each family (including @font-face binding a named family to a served asset
      so a custom face paints instead of a serif fallback), and the invariant that
      no raw CSS escapes the sink for any of them.'
    justification: 'Commits 48772509 (REQ-91) and fd5f477c (REQ-90) add ~15 new typed
      axes plus a document-level resources table across packages/site-schema/src/l1/{schema,types,validate}.ts
      and packages/framework/src/l1/render.ts. STORY-83''s existing ACs (AC-682/685/686)
      speak only to the original axis set — nothing in the matrix says a gradient/shadow/border/mask/transform/blend
      axis exists, is bounded, or is emitted safely, and nothing says a font handle
      can be bound to served substance. FC tests test_UAT_FC_REQ-91_* (12) and test_UAT_FC_REQ-90_*
      (8) exist with no AC behind them. Classified upgrade, not feature: the behaviour
      extends the existing ''L1 Layout Substrate + Safety Envelope'' bucket (capability-ae9d65d6)
      — same schema, same validator, same single emitter — and introduces no parallel
      substrate.'
    acceptance_criteria_changes:
      add:
      - 'Typed pixel-mover axes are accepted on their target leaves and emitted as
        CSS re-derived from numeric/enum/hex fields: text gradientFill paints glyphs
        via background-clip:text, textDecoration/textShadow/fontVariantCaps/listMarker
        render; box surfaceGradient/backgroundImageUrl/overlay composite as ordered
        background layers, with border/boxShadow/backdropBlur/blendMode; image blendMode/border/boxShadow;
        transform and mask on any node; identity/no-op values are omitted rather than
        emitted.'
      - 'The envelope rejects malformed structured axes: a non-hex gradient stop or
        border colour, an off-allowlist backgroundImageUrl, an out-of-range shadow
        offset/blur/spread or transform scale, and any freeform (unknown) key on a
        structured form.'
      - 'A document-level resources.fonts table binds a family handle to its served
        substance, and the renderer emits one @font-face rule per entry through the
        sole safe sink — name-sanitised family, allowlisted + escaped url, derived
        format(), font-display: swap — so a captured custom face paints at its own
        glyph metrics instead of the serif fallback.'
      - The envelope scheme-checks each font src against the image URL allowlist (no
        data:/javascript:/remote smuggle through the @font-face sink) and bounds a
        declared font weight to the CSS range.
      modify:
      - 'AC-685 (injection payloads inert): extend to the new families — a payload
        placed in a gradient stop, border colour, background-image URL, mask/transform
        field, or font family/src produces no </style>, @import, javascript:, or expression(
        in the emitted document.'
      - 'AC-686 (out-of-range/oversize/freeform rejected): extend the rejection surface
        to the structured forms and the resource table (effectPx and transformScale
        bounds, hex-only colours, font src allowlist, font weight range).'
      remove: []
    story_uid: story-d0a8cfad
  - index: 2
    component: Capture-to-L1 fold — full-language folder + signalled residuals
    item_type: upgrade
    story_points: 3
    dependencies:
    - 1
    target_story_ids:
    - story-8acc338d
    intent_delta_summary: 'STORY-84 documents the fold as ''multi-viewport ladder
      -> one L1 document'', but its ACs describe a TEXT-ONLY fold (AC-689/691/692/693).
      The folder rebuild makes the fold emit the full language: image leaves (src/alt
      plumbed extract -> RawField -> Field -> ValueElement, geometry with height,
      objectFit/radius/opacity/blend/border/shadow axes, stable id, visibility); box
      leaves for standalone painted surfaces; reconstructed run surfaces (the capture
      composites a card/panel/section fill ONTO each run, never as a standalone box
      — the dominant solid run-fill becomes doc.background, and each run whose surface
      differs from that band, or carries a gradient, gets a backing box emitted before
      the content); the new text axis families incl. textShadow; and the resources.fonts
      table populated with only the families a folded text leaf actually paints. It
      also converts silent drops into a signalled contract: every element the fold
      cannot yet express becomes a typed FoldResidual {kind, reason, capturedAxes,
      widths} via an opt-in out-collector, and form controls are routed to field residuals
      (the behavior-module seam) rather than synthesized into raw L1 leaves. No new
      capability bucket: this is the same capture->L1 fold surface (capability-2049c9ec),
      widened from text-only to full-language, with drops made explicit.'
    description: 'Document what the folder now emits from a captured ladder: text,
      image, box and reconstructed-surface leaves plus a page background band and
      a font resource table — and the typed residual it emits for anything it still
      cannot express (media without a resolvable src, geometry-less runs, form controls,
      unclassifiable text-free elements), so nothing is silently dropped.'
    justification: 'Commits be8d9a7d, 9de5d55b and 248548ae rewrite tools/generate/src/l1/fold.ts
      (~440 lines changed) plus capture plumbing in extract.ts/sections.ts/values-diff.ts.
      The matrix currently asserts only that the fold emits one validated document
      with per-width keyframes for text nodes; it says nothing about image leaves,
      box/surface leaves, doc.background, the resource table, or residual signalling.
      FC tests test_UAT_FC_REQ-92_* (15), test_UAT_FC_BUG-6_* and test_UAT_FC_BUG-11_*
      exist with no AC behind them. Upgrade rather than feature: the fold capability
      bucket already exists and is being widened in place, with no parallel folder
      introduced.'
    acceptance_criteria_changes:
      add:
      - A text-free media element folds to an L1 image leaf carrying its resolved
        src and alt (captured onto the media field and carried through the manifest),
        a height-bearing geometry track, its image axes (objectFit/radius/opacity/blend/border/shadow),
        a stable id and its visibility rule; media with no resolvable src or no geometry
        signals a residual instead of emitting a broken leaf.
      - A text-free element that paints a standalone surface folds to an L1 box leaf
        carrying its fill/gradient/border/radius/opacity/backdropBlur/blend axes and
        height-bearing geometry.
      - 'Run-composited surfaces are reconstructed: the solid fill the most runs sit
        on becomes the document background band, and each run whose surface differs
        from the band — or carries a gradient the body cannot paint — folds a backing
        box leaf emitted before the content so every leaf paints over its own surface.'
      - The fold carries the new text axis families (gradient fill, decoration, small-caps,
        list marker, text shadow) and populates the document font resource table with
        only the families a folded text leaf actually paints.
      - 'No captured element is silently dropped: every element the fold cannot express
        becomes a typed residual naming its kind, the reason, the painted axes it
        carried, and the widths it appeared at — and a form control is always routed
        to a residual (the behavior-module seam) rather than synthesized into a raw
        L1 leaf.'
      modify:
      - 'AC-689 (one validated L1 reproduction document): the emitted document is
        now full-language — text, image, box and backing-surface leaves plus an optional
        document background and font resource table — not text leaves alone.'
      - 'AC-691 (a geometry keyframe per sampled width matching the captured box):
        box and image leaves pin all four sides (height included); a text leaf''s
        height stays natural from flow.'
      remove: []
    story_uid: story-8acc338d
  - index: 3
    component: 3-probe reproduction gate — analytic evaluator + region-aware recovery
      + residual channel
    item_type: upgrade
    story_points: 3
    dependencies:
    - 2
    target_story_ids:
    - story-24098299
    intent_delta_summary: 'STORY-86 documents the browser-free evaluator, the three
      probes, and demand-driven recovery. Five behaviours in this bundle change or
      extend it: (1) the evaluator now models a real flex row — each row child takes
      its own main-axis width (declared fixed, else an equal share of the leftover
      extent), the cursor advances by that width, row height is the tallest child
      — replacing the model that gave every child the full parent width and false-flagged
      overflow; grid stays conservatively modelled as a stack. (2) evalGeometry resolves
      a width against half-open segments [a.at, b.at), mirroring the renderer''s highest-min-width-wins
      CSS, so at an exact interior breakpoint the segment STARTING there wins — previously
      a snap ending at that breakpoint returned the held lower keyframe and cascaded
      the whole page (the 1616px 768 failure). (3) sample-fidelity now measures non-text
      leaves, pairing image/box leaves to oracle samples by kind-keyed document-order
      occurrence, with the oracle classified through the fold''s own classifyElement.
      (4) a backing surface box sitting behind the content it backs is excluded from
      the sibling-overlap check (a background is not a collision) while still subject
      to the horizontal-clip check. (5) recovery became region-aware and recursive:
      at each node the direct children that collide under perturbation are grouped
      into connected components of the perturbed-overlap graph, each becoming its
      own flow sub-stack with its own interior gap, and a recovering node flows ALL
      its children so nothing pinned is left behind; a node with no colliding group
      stays absolute, promoted reports nested region paths, and fidelity is still
      measured on the untouched absolute base. Additionally the gate report carries
      the fold''s residuals as a channel distinct from probe mispairing/fidelity residuals.
      Same capability bucket (capability-8108afab) — the gate is corrected and widened,
      not replaced.'
    description: Document the corrected analytic layout evaluator (flex-row tiling,
      half-open breakpoint resolution, backing surfaces are not collisions), the fidelity
      probe's coverage of non-text leaves, region-aware recursive structure recovery,
      and the gate's separate folder-power (fold residual) channel.
    justification: 'Commits ec20c756 (BUG-7), 9de5d55b (evalGeometry + non-text pairing),
      319e42f5 (BUG-9), ce978d97 (BUG-8 guard) and 248548ae (overlap exception) rewrite
      ~250 lines of tools/generate/src/l1/probes.ts; be8d9a7d adds the foldResiduals
      channel through repro.ts and the l1-gate output. The matrix''s AC-705 speaks
      only of text-run pairing, AC-709 describes single-level promotion of pinned
      sibling groups, and no AC covers row layout, breakpoint-interval semantics,
      surface-box overlap, or the residual channel — so regression would enforce the
      superseded behaviour. FC tests test_UAT_FC_BUG-7_*, _BUG-8_*, _BUG-9_* and the
      gate clauses of _BUG-6_* have no AC behind them. Upgrade: the reproduction-gate
      bucket exists and is modified in place; no parallel gate is introduced.'
    acceptance_criteria_changes:
      add:
      - 'The analytic evaluator models a flex row as the renderer does: children tile
        side by side taking their own main-axis width (declared fixed width, else
        an equal share of the leftover gap-aware extent), the row''s height is its
        tallest child, and a well-formed row raises no overflow — while fixed widths
        that genuinely exceed the extent still surface a clip. Column stacking is
        unchanged and grid is modelled conservatively as a stack.'
      - 'Geometry resolves against half-open per-segment intervals so that at an exact
        interior breakpoint the segment starting there wins (mirroring the renderer''s
        highest-min-width-wins CSS): a reflow that snaps at a captured breakpoint
        reproduces the post-reflow frame at that width and does not cascade stale
        geometry down the page.'
      - A painted surface box that sits behind the content it backs is not reported
        as a sibling overlap, while a box that overflows the viewport is still reported
        as a horizontal clip.
      - The combined gate report carries the fold's residuals as a distinct channel
        from the fidelity probe's residuals and unmatched entries, so folder-power
        gaps are legible as framework gaps rather than mistaken for mispairing.
      modify:
      - 'AC-705 (sample-fidelity pairing): extend beyond text — image and box leaves
        pair with oracle samples by kind-keyed document-order occurrence, with oracle
        samples classified through the fold''s own element classifier so controls
        and empty runs are excluded from the measure.'
      - 'AC-709 (demand-driven recovery): recovery is region-aware and recursive —
        at each node the direct children that collide under perturbation form connected
        components of the perturbed-overlap graph, each promoted to its own flow stack
        with its own interior gap; a recovering node flows all of its children so
        no pinned sibling is left behind; a node with no colliding group stays absolute;
        promoted reports nested region paths (a whole-node region still reports the
        node path); and fidelity is still measured on the untouched absolute base.'
      - 'AC-706 / AC-707 (off-sample and content-robustness envelope): both hold after
        region-aware recovery on a real multi-region capture, where single-level promotion
        previously left them failing at every width.'
      remove: []
    story_uid: null
  - index: 4
    component: 1c CLI output hygiene — quiet bootstrap and Astro-free L1 render path
    item_type: upgrade
    story_points: 1
    dependencies: []
    target_story_ids:
    - story-e15a19ef
    intent_delta_summary: 'STORY-79''s AC-658 records that render/bootstrap diagnostics
      are routed to stderr so --json stays clean. REQ-89 supersedes the mechanism
      for the ''Missing pages directory'' warning specifically: it was never suppressed,
      only diverted, so it printed on stderr for every command including ones that
      never render. The launcher now passes logLevel:''error'' as the second (Astro)
      argument to getViteConfig — gating Astro''s own logger, which the Vite-level
      logLevel never touched — so the warning is not emitted at all, while genuine
      errors still surface and the stdout->stderr diversion remains as defence in
      depth. Separately the render path became Astro-lazy: astro/container is a dynamic
      import and a container is created only when a page actually has behavior modules,
      so a folded L1 reproduction or the empty starter renders with zero Astro container
      involvement while module pages render unchanged. Same CLI argument-parsing/output-hygiene
      bucket (capability-ac7ca849), extended.'
    description: Document that every 1c command boots quietly (no 'Missing pages directory'
      warning on stdout or stderr) and that the render path constructs an Astro container
      only for pages carrying behavior modules — an L1-only reproduction renders Astro-free.
    justification: 'Commit 5dc46d0f changes tools/generate/bin/1c.mjs and tools/generate/src/render/render.ts.
      AC-658 asserts only that diagnostics land on stderr rather than stdout — it
      does not assert the warning is absent, and it says nothing about the conditional
      container. FC tests test_UAT_FC_REQ-89_* exist with no AC behind them. Upgrade:
      output hygiene and CLI bootstrap behaviour already form a capability bucket
      owned by STORY-79; no new bucket or parallel launcher is introduced.'
    acceptance_criteria_changes:
      add:
      - Every 1c command — including the ones that never render (list, repro, l1-gate,
        capture, values-diff) — boots without emitting the 'Missing pages directory'
        warning on either stream, while genuine bootstrap errors still surface.
      - 'The render path creates an Astro container only when a page carries behavior
        modules: a behavior-module site renders identically with a container, and
        an L1-only reproduction (or the empty starter) renders correctly with no container
        constructed.'
      modify:
      - 'AC-658 (render and bootstrap diagnostics on stderr, not stdout): the stdout
        diversion remains defence in depth, but the specific ''Missing pages directory''
        warning is now suppressed at its source (Astro''s own logger) rather than
        merely rerouted.'
      remove: []
    story_uid: null
  - index: 5
    component: Capture fidelity — list marker recorded only where a marker is painted
    item_type: upgrade
    story_points: 1
    dependencies: []
    target_story_ids:
    - story-d5de22a5
    intent_delta_summary: 'STORY-75''s AC-711 covers typography treatments including
      the list marker being captured and compared. BUG-10 corrects the capture rule
      behind it: list-style-type has a CSS initial value of ''disc'' on EVERY element,
      so reading it unconditionally stamped a phantom marker on 43 of 55 captured
      runs (including an h1 wordmark), which the fold carried and the renderer faithfully
      painted as a bullet. A ::marker box is generated only for a display:list-item
      element, so the extractor now gates on that — genuine list items keep their
      marker, list-style-type:none still suppresses one, and everything else reports
      no marker. Fold and renderer are unchanged; they were correct once the input
      was clean. Same values-diff/capture-fidelity bucket (capability-aa030c83).'
    description: Document that the capture records a list marker only for elements
      that actually generate a marker box, so a non-list run carries no marker and
      a reproduction shows no phantom bullets.
    justification: 'Commit 6f642b53 changes listMarkerOf in tools/generate/src/cli/capture/extract.ts.
      AC-711 states the list marker is captured and compared but does not pin the
      painted-marker precondition — the defect it documents is precisely a capture
      that satisfied the letter of that AC while producing a wrong value. FC tests
      test_UAT_FC_BUG-10_* (4, running the real extract script under jsdom) exist
      with no AC behind them. Upgrade: capture axis fidelity is an existing bucket
      owned by STORY-75; no new capability or parallel extractor is introduced.'
    acceptance_criteria_changes:
      add: []
      modify:
      - 'AC-711 (typography treatments and list marker captured and compared): pin
        the painted-marker precondition — a list marker is recorded only for an element
        that generates a marker box (display:list-item), so a heading or paragraph
        carrying the CSS initial value reports none; a genuine list item keeps its
        marker type; and list-style-type:none suppresses the marker on a real list
        item.'
      remove: []
    story_uid: null
---

# Reconciliation Plan — BUNDLE-8 (bundle-cceaba25)

**Mode**: commits (11 free-coded commits on `reconcile-BUNDLE-8`)
**Source tickets bundled**: BUG-7, REQ-91, REQ-89, REQ-90, REQ-92, BUG-6, BUG-8, BUG-9, BUG-10, BUG-11
**Scope frame**: all of it sits under REQ-88 (`request-7ff1bacd`) — "language first, then rebuild the folder once", per DOC-27 (an axis earns its place iff it moves a pixel), DOC-23 (L1 substrate), DOC-24 (safety envelope), DOC-21 (growth loop).

## Intent (Step 0)

Read from the bundle body and the source tickets. The operator's declared sequence was: fix the analytic layout math (BUG-7) *before* the folder emits row/multi-child structure; raise the L1 language's **power** (REQ-91 pixel-mover axes) and **form** (REQ-90 font/asset resource table) so the folder has a full language to fold into; make dropping **signalled** rather than silent (BUG-6); then rebuild the folder **once** against the completed language (REQ-92), with the appearance-population and robustness defects the gigabytealchemy re-run surfaced (BUG-8 breakpoint cascade, BUG-9 coarse promotion, BUG-10 phantom bullets, BUG-11 vanished surfaces) closed alongside. REQ-89 (quiet Astro boot) was explicitly split out of the REQ-88 walkthrough so REQ-88 stayed scoped to the pipeline.

Two corrections recorded in the ticket bodies and honoured here:
- **BUG-8's stated root cause was disproven.** The fold does *not* drop the reflowed 768 cell; the defect was the analytic evaluator's closed upper bound on a geometry segment. The commit landed a regression guard only — no production change. The matrix therefore documents the *evaluator's* interval semantics (item 3), not a fold repair.
- **BUG-6's behaviour shipped inside REQ-92's rebuild**; its own commit adds only the UATs that lock the contract under BUG-6's name, including the gate-separation clause REQ-92's tests never exercise. The behaviour is still reconciled (item 2 fold side, item 3 gate side) because no AC covers it.
- **REQ-89's original diagnosis (eager module-registry import) was also disproven** and deliberately not implemented; the launcher's Astro logger was the real source.

## Behavior Inventory (Step 1)

```yaml
behavior_inventory:
  source: "free-coded commits: ec20c75, 4877250, 5dc46d0, fd5f477, be8d9a7, 6c20054, 9de5d55, ce978d9, 319e42f, 6f642b5, 248548a"
  entry_files:
    - "packages/site-schema/src/l1/schema.ts"
    - "packages/site-schema/src/l1/validate.ts"
    - "packages/framework/src/l1/render.ts"
    - "tools/generate/src/l1/fold.ts"
    - "tools/generate/src/l1/probes.ts"
    - "tools/generate/src/cli/capture/{extract,sections,capture,values-diff}.ts"
    - "tools/generate/src/cli/{repro,index}.ts"
    - "tools/generate/bin/1c.mjs"
    - "tools/generate/src/render/render.ts"
  features:
    - name: "L1 typed pixel-mover axes"
      description: "~15 axes added across text/box/image/any-node, each a typed scalar, closed enum, or structured form (l1Gradient with >=2 hex stops, l1Shadow, l1Border, l1Mask, l1Transform, l1Overlay). render.ts re-derives CSS from numeric/enum/hex fields only; box background composites overlay -> gradient -> url as comma layers; text gradient overrides flat colour via -webkit-text-fill-color."
      behaviors:
        - "text: gradientFill (background-clip:text), textDecoration, textShadow, fontVariantCaps, listMarker"
        - "box: surfaceGradient, backgroundImageUrl (isSafeUrl-checked), overlay scrim, border, boxShadow, backdropBlurPx, blendMode"
        - "image: blendMode, border, boxShadow; any node: transform (rotate/scale), mask (circle/ellipse/feather)"
        - "validate.ts: effectPx [-10k,10k] and transformScale [0.01,100] bounds; backgroundImageUrl allowlist; .strict() rejects freeform keys"
        - "identity/no-op values are omitted rather than emitted"
      entry_point: "l1TextAxesSchema / l1BoxAxesSchema / l1ImageAxesSchema; renderL1Document"
    - name: "L1 document resource table (fonts)"
      description: "doc.resources.fonts binds family -> served src (+ optional weight/style). fontFaceRules() is the sole @font-face sink: fontFaceName() sanitises the family to a name, isSafeUrl gates the src, escapeHtml neutralises it inside url(\"...\"), format() is derived, font-display: swap."
      behaviors:
        - "validate.ts scheme-checks every /resources/fonts/<i>/src and bounds weight to 1..1000"
        - "fold keeps only faces a folded text leaf actually paints (usedFontFaces / primaryFamily)"
        - "capture.ts converts the bundle's mirrored ThemeFont faces into L1FontFace entries"
      entry_point: "l1ResourcesSchema; fontFaceRules(); fontResourcesFromTheme()"
    - name: "Full-language fold (foldToL1)"
      description: "Per aligned responsive-table row, the fold now classifies and emits text, image, or box leaves, reconstructs run surfaces, sets the page band, populates the font table, and signals whatever it cannot express."
      behaviors:
        - "image leaf: widest.src + alt/accessibleName, height-bearing geometry, imageAxes(), id image-<n>, visibility"
        - "box leaf: paintsSurface() text-free element -> boxAxes(), id box-<n>"
        - "backing surfaces (BUG-11): per-run surfaceFill/surfaceGradient -> box id surface-<n>, emitted BEFORE content; dominant solid fill -> doc.background; runs on the band get no box"
        - "text axes: gradientFill/textDecoration/fontVariantCaps/listMarker/textShadow folded from the capture"
        - "residuals (BUG-6): opt-in out-collector; kinds image|field|box|text with reason, capturedAxes, widths; form-control roles -> field residual (behavior-module seam), never synthesized"
        - "capture plumbing: src/alt added to RawField -> Field -> ValueElement (RawSignals.images never reaches the fold)"
      entry_point: "foldToL1(); classifyElement(); FoldResidual"
    - name: "Analytic layout evaluator (evaluateLayout / evalGeometry)"
      description: "Browser-free evaluator corrected in three places."
      behaviors:
        - "row branch: rowChildWidths() gives each child its fixed width (clamped by min/max) or an equal share of the gap-aware leftover; cursor advances by that width; row height = tallest child; grid modelled as stack"
        - "evalGeometry: half-open [a.at, b.at) segment match — at an exact interior breakpoint the segment STARTING there is active (mirrors highest-min-width-wins CSS)"
        - "overlap set excludes kind 'box' (a backing surface behind its content is not a collision) and 'slot'; boxes remain in the horizontal-clip check"
      entry_point: "evaluateLayout(); evalGeometry(); rowChildWidths()"
    - name: "Fidelity probe over non-text leaves"
      description: "oracleBoxes() classifies each oracle element through the fold's own classifyElement and tags it text|image|box; sampleFidelityProbe pairs non-text leaves by kind-keyed document-order occurrence (parallel to the existing normalized-text occurrence queues)."
      behaviors:
        - "controls and empty runs are excluded from the fidelity measure"
        - "an unpaired oracle occurrence surfaces as unmatched, labelled '(image)'/'(box)' when textless"
      entry_point: "oracleBoxes(); sampleFidelityProbe()"
    - name: "Region-aware structure recovery (promoteToFlow)"
      description: "Recursive rewrite: overlap pairs are collected once per captured width at the perturbation scale; at each node, links between direct children form connected components (union-find, overlapComponents) restricted to pinned children; each component >=2 becomes its own flow stack with its own medianGap; survivors are flowed alongside so nothing stays pinned; a node with no component is returned untouched."
      behaviors:
        - "single region covering all children -> node path reported (backward-compatible ['0'])"
        - "multiple regions -> nested paths (0.0, 0.1, ...)"
        - "result is re-validated through validateL1; fidelity measured on the untouched absolute base"
        - "groupKeyframes / failingSiblingGroups (single-pile helpers) deleted"
      entry_point: "promoteToFlow(); overlapComponents(); medianGap()"
    - name: "l1-gate fold-residual channel"
      description: "repro.ts collects FoldResiduals during the fold and returns them on the report as `foldResiduals`, distinct from sampleFidelity.residuals; cli/index.ts prints 'fold residuals (folder-power gaps): N' with up to 10 detail lines."
      behaviors:
        - "a clean pure-text bundle emits an empty list (no false framework-gap noise)"
      entry_point: "cmdL1Gate / repro.ts"
    - name: "Capture list-marker gate"
      description: "listMarkerOf(s) returns null unless s.display === 'list-item'; otherwise returns listStyleType unless 'none'."
      behaviors:
        - "non-list runs carrying the CSS initial 'disc' report no marker"
        - "a genuine <li> keeps its marker type (disc/decimal/...); 'none' still suppresses"
      entry_point: "EXTRACT_SCRIPT / listMarkerOf()"
    - name: "1c launcher + render Astro-laziness"
      description: "getViteConfig(viteCfg, { logLevel: 'error' }) gates Astro's own logger (the first-arg logLevel only ever gated Vite's); the stdout->stderr diversion stays as defence in depth. renderSite computes needsAstro = pages.some(p => !p.l1 && p.modules.length > 0) and dynamically imports astro/container only then; renderModules/renderPage take Container | undefined and throw defensively if a module page ever reaches them without one."
      behaviors:
        - "no 'Missing pages directory' output on any command"
        - "L1-only reproduction and the empty starter render with zero Astro container"
      entry_point: "tools/generate/bin/1c.mjs; renderSite()"
```

## Coverage Map (Step 3)

```yaml
coverage_map:
  - feature: "L1 typed pixel-mover axes"
    status: partial
    existing_stories: ["story-d0a8cfad (STORY-83)"]
    existing_acs: ["AC-682", "AC-685", "AC-686"]
    gaps:
      - "no AC names any structured axis family (gradient/shadow/border/mask/transform/overlay/blend)"
      - "no AC pins the emitted CSS per family, nor the identity/no-op omission"
      - "AC-686's rejection surface predates effectPx/transformScale bounds and the background-image allowlist"
  - feature: "L1 document resource table (fonts)"
    status: uncovered
    existing_stories: ["story-d0a8cfad (STORY-83)"]
    existing_acs: []
    gaps:
      - "the handle->substance binding, the @font-face sink, and the font-src allowlist have no AC anywhere"
    notes:
      - "Folded into item 1 rather than a standalone story: same substrate bucket, and splitting would put two upgrade items on one story."
  - feature: "Full-language fold (image/box/surface leaves, band, residuals)"
    status: partial
    existing_stories: ["story-8acc338d (STORY-84)"]
    existing_acs: ["AC-689", "AC-690", "AC-691", "AC-692", "AC-693"]
    gaps:
      - "existing ACs describe a text-only fold; nothing covers image leaves, box leaves, backing surfaces, doc.background, or the font table"
      - "nothing covers the signal-not-drop residual contract or the form-control -> behavior-seam routing"
  - feature: "Analytic evaluator: row layout, breakpoint interval, surface overlap"
    status: partial
    existing_stories: ["story-24098299 (STORY-86)"]
    existing_acs: ["AC-705", "AC-706", "AC-707", "AC-708", "AC-724"]
    gaps:
      - "no AC describes row/flex semantics — the ACs assume the stack path"
      - "no AC pins exact-breakpoint resolution; the superseded closed-interval behaviour is what regression would currently defend"
      - "no AC states that a backing surface box is not an overlap"
  - feature: "Fidelity probe over non-text leaves"
    status: partial
    existing_stories: ["story-24098299 (STORY-86)"]
    existing_acs: ["AC-705"]
    gaps: ["AC-705 is text-run specific; image/box pairing by kind-keyed occurrence is undocumented"]
  - feature: "Region-aware structure recovery"
    status: partial
    existing_stories: ["story-24098299 (STORY-86)"]
    existing_acs: ["AC-709"]
    gaps: ["AC-709 documents the single-level pinned-sibling-group promotion that BUG-9 replaced"]
  - feature: "l1-gate fold-residual channel"
    status: uncovered
    existing_stories: ["story-24098299 (STORY-86)"]
    existing_acs: []
    gaps: ["the gate's folder-power channel and its separation from probe residuals have no AC"]
  - feature: "Capture list-marker gate"
    status: partial
    existing_stories: ["story-d5de22a5 (STORY-75)"]
    existing_acs: ["AC-711 (pending)"]
    gaps: ["AC-711 says the marker is captured and compared but does not require a painted marker box — the defect satisfied its letter"]
  - feature: "1c launcher + render Astro-laziness"
    status: partial
    existing_stories: ["story-e15a19ef (STORY-79)"]
    existing_acs: ["AC-658"]
    gaps:
      - "AC-658 asserts diagnostics are on stderr, not that the warning is absent"
      - "the conditional Astro container (module page vs L1-only page) is undocumented"
```

## Step 3b — Intent scope vs implementation footprint

Every file this bundle touches is declared by one of the bundled intents (Case 1/2). Specifically:

- **Case 2 (explicit supersession)**: BUG-9 supersedes AC-709's single-level promotion; REQ-92's evaluator change supersedes the closed-interval geometry match implied by AC-705/AC-724; BUG-11 supersedes the evaluator's "any two leaves overlapping is a finding" rule; REQ-89 supersedes AC-658's mechanism for one specific warning. All four are reconciled as `modify` entries on their owning stories rather than as new stories.
- **Case 1**: REQ-91, REQ-90, REQ-92's fold rebuild, BUG-7, BUG-10 all land inside the footprint their tickets declare.
- **No Case 3 found.** The only changes reaching outside the L1/probe/fold triangle are (a) `values-diff.ts` + `sections.ts` carrying `src`/`alt` through `Field -> ValueElement`, which is pure plumbing for the fold and changes no comparison behaviour (reconciled inside item 2, not as a values-diff AC), and (b) `render/render.ts`'s container threading, which REQ-89 explicitly declares and whose module-render behaviour is unchanged.
- One deliberate **non-implementation** worth recording: REQ-89's originally-proposed lazy module-registry/`getModule`-async change was skipped as unnecessary; the matrix documents what shipped (launcher logger + conditional container), not the abandoned proposal.

## Plan Items (Step 4)

| # | Component | Type | Points | Deps | Target story | Description |
|---|-----------|------|--------|------|--------------|-------------|
| 1 | L1 layout substrate — typed pixel-mover axes + document resource table | upgrade | 3 | - | STORY-83 (story-d0a8cfad) | Grown axis vocabulary as typed structured forms + font handle->substance table, all through the sole safe sink |
| 2 | Capture-to-L1 fold — full-language folder + signalled residuals | upgrade | 3 | 1 | STORY-84 (story-8acc338d) | Image/box/backing-surface leaves, page band, font table, typed FoldResiduals, form-control seam |
| 3 | 3-probe reproduction gate — evaluator + recovery + residual channel | upgrade | 3 | 2 | STORY-86 (story-24098299) | Flex-row model, half-open breakpoint intervals, non-text pairing, surfaces-are-not-collisions, region-aware recursive recovery, folder-power channel |
| 4 | 1c CLI output hygiene — quiet bootstrap + Astro-free L1 render | upgrade | 1 | - | STORY-79 (story-e15a19ef) | No 'Missing pages directory' on any command; container created only for behavior-module pages |
| 5 | Capture fidelity — list marker only where painted | upgrade | 1 | - | STORY-75 (story-d5de22a5) | listMarker gated on display:list-item; no phantom bullets |

**Total: 5 items, 11 points — all upgrades, no features.**

## FC test coverage check

The prompt's `fc_tests` list was empty, but FC test files for this bundle exist on disk and were read as binding evidence. Every one maps to a plan item:

| FC test file | Ticket prefix | Covered by |
|---|---|---|
| tests/bug7-row-layout.test.ts | BUG-7 | item 3 |
| tests/req91-l1-pixel-mover-axes.test.ts | REQ-91 (12) | item 1 |
| tests/req89-astro-lazy.test.ts | REQ-89 | item 4 |
| tests/req90-l1-font-resources.test.ts | REQ-90 (8) | item 1 |
| tests/req92-fold-full-language.test.ts, tests/req92-image-box-fold.test.ts | REQ-92 (15) | items 2 + 3 |
| tests/bug6-signal-not-drop.test.ts | BUG-6 | item 2 (fold contract) + item 3 (gate separation) |
| tests/bug8-reflow-breakpoint.test.ts | BUG-8 | item 3 (evaluator interval) |
| tests/bug9-region-aware-promote.test.ts | BUG-9 | item 3 |
| tests/bug10-list-marker-gate.test.ts | BUG-10 | item 5 |
| tests/bug11-fold-surface-fill.test.ts | BUG-11 | item 2 + item 3 |

## Observations

- **Zero feature items.** Every behaviour in this bundle widens or corrects an existing capability bucket — the substrate, the fold, the gate, the CLI, the capture. That is exactly what REQ-88's "language first, then rebuild the folder once" implies: no new capability surface was invented, the existing four were deepened.
- **One item per target story, deliberately.** BUG-7/BUG-8/BUG-9/BUG-11's probe changes and REQ-92's evaluator change all land on STORY-86; REQ-90 and REQ-91 both land on STORY-83. Rather than emit two or five upgrade items against the same story (which would make the downstream story cycle rewrite one story several times, risking each pass overwriting the last), each target story gets a single upgrade item whose `acceptance_criteria_changes` carries the whole delta. This also matches the coarse-grained rule: STORY-86 is one story with many ACs.
- **Two ticket root-cause hypotheses were disproven during implementation** (BUG-8's fold-drop, REQ-89's module-registry import), and in both cases the operator recorded the correction in the ticket body. The matrix follows the corrections, so the ACs describe the evaluator interval and the Astro logger — not the fold or the registry.
- **BUG-6 is the clearest example of why FC tests are binding evidence**: its behaviour shipped inside another ticket's commit and its own commit is tests-only. Under the test-only-story prohibition it cannot be its own item, but its contract (typed residual + separate gate channel) is genuinely uncovered, so it is reconciled as ACs on items 2 and 3.
- **Judgment call — where the font table lives.** REQ-90 spans schema + validator + renderer + fold + capture. The doc-level table and its @font-face emission are documented on STORY-83 (item 1, the substrate that owns the form); the fold *populating* it with only painted families is documented on STORY-84 (item 2). Splitting on that seam keeps each AC verifiable in its owning story's terms.
- **Judgment call — image src/alt plumbing.** It touches `values-diff.ts`, but it adds no comparison axis and changes no diff output, so it is reconciled as part of the fold's image-leaf AC (item 2) rather than as a values-diff (STORY-75) change. Only BUG-10 — a genuine capture-value correctness defect — lands on STORY-75.
- **Uncertainty**: AC-711 (STORY-75) is `pending`, so item 5's modify lands on an AC that is not yet proven by a UAT. If the story cycle treats a pending AC as not-yet-authored, item 5's clause should be authored fresh under that AC rather than edited in place; either way the behaviour ends up covered once, not twice.
- **Uncertainty**: the evaluator models grid as a stack and gives flex children an equal share of the leftover extent — both are envelope-conservative stand-ins, not CSS-faithful. The ACs are worded to pin the *observable guarantee* (a well-formed row raises no false overflow; genuine overflow still clips) rather than the share formula, so a later real flex-basis model does not falsify them.