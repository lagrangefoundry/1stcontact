---
uid: report-4c0ed970
id: REPORT-1339
type: report
title: 'Reconciliation Plan: BUNDLE-11 free-coded commits (L1 substrate, behavior
  modules, reproduction pipeline)'
created_by: xgd
created_at: '2026-08-06T01:11:35.745903+00:00'
updated_at: '2026-08-06T01:18:24.921522+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-ee56a66e
  anchor_uid: bundle-ee56a66e
  items:
  - index: 1
    component: L1 Substrate — Axis Groups
    item_type: upgrade
    story_points: 3
    dependencies: []
    story_uid: story-d0a8cfad
    target_story_ids:
    - story-d0a8cfad
    description: 'Document that L1''s paint group and its node-level axis groups are
      declared once and spread into every node kind, so any kind can paint, size and
      measure itself (REQ-97, REQ-98, REQ-105). Extends STORY-83 (L1 layout substrate
      rendered safe by construction), whose axis table is currently per-kind: box
      paints but does not lay out, container lays out but does not paint, slot carries
      neither. In code: l1SurfaceAxesSchema (surfaceFill, gradients, border, shadow,
      radius, opacity, blend, backdrop blur, overlay, backgroundImageUrl) is spread
      into box/container/text/image/slot/control and l1BoxAxesSchema is gone; l1NodeAxisGroupsSchema
      does the same for geometry, sizing, visibility, transform, mask, padding, responsivePadding,
      interaction and reveal; render.ts emits the group through a single surfaceDecls();
      validate.ts bounds it once for every kind (closing borderLeft''s unbounded width
      and the backgroundImageUrl scheme check that ran on box only); localizeAssets
      resolves a background image on any kind; probes.constrainWidth narrows a node''s
      frame by its own sizing.width for every kind so the analytic gate mirrors the
      renderer. A painted, internally-laid-out element is now ONE node, a text run
      declares its own measure with no wrapper container, and a mounted behavior module
      can be sized through its slot.'
    justification: 'Upgrade, not feature: this extends the existing L1 axis vocabulary
      that STORY-83 already documents (AC-682 typed tree, AC-725 typed pixel-mover
      axes, AC-686/AC-726 envelope bounds) — no new capability bucket is introduced,
      no parallel substrate is created, and every prior intent is preserved (the change
      is strictly additive; the gigabytealchemy, xgd and joyful reproductions render
      byte-identically). The user-visible capability documented is: an author can
      carry any paint or layout axis on the node that needs it, instead of stacking
      wrapper nodes, and the safety envelope bounds that axis on every kind rather
      than on the kinds someone remembered.'
    intent_delta_summary: 'STORY-83''s per-kind axis table becomes a shared-group
      statement: the surface group and the node-level groups are declared once and
      inherited by every kind (box, container, text, image, slot, control). Add ACs
      for one-node painted-and-laid-out elements, a text run''s own measure, a sized
      slot, uniform envelope bounding of the shared group, background-image localization
      on any kind, and the analytic probe mirroring sizing for every kind.'
    acceptance_criteria_changes:
      add:
      - A container carries the full surface group (fill, gradient, border, radius,
        shadow, blend, backdrop blur, overlay, background image) and renders it while
        still laying out its children — a painted, internally-laid-out element is
        one node, not two.
      - The surface group and the node-level groups (geometry, sizing, visibility,
        transform, mask, padding, responsivePadding, interaction, reveal) are declared
        once and spread into every node kind, so a newly added kind inherits them
        rather than re-declaring a slice.
      - A text run declares its own measure via sizing (fixed/fluid/hug, px/minPx/maxPx)
        and the renderer emits width/min-width/max-width for it; a run with no sizing
        emits no sizing declarations.
      - A slot node accepts sizing and the renderer honours it, so a mounted behavior
        module can be given a measure without a wrapper container.
      - The envelope bounds the shared surface group once for every kind — including
        borderLeft's width and the backgroundImageUrl scheme allowlist, which previously
        ran on box alone — and asset localization resolves a background image on any
        kind rather than hotlinking the captured origin.
      modify:
      - 'AC-725 / AC-726: restate the axis coverage as one shared group carried by
        every kind instead of a per-kind subset, and record that the analytic layout
        probe narrows every kind''s frame by its own sizing so the gate models the
        CSS the renderer emits.'
      remove: []
  - index: 2
    component: Behavior Modules — Leaf-Control Composition
    item_type: upgrade
    story_points: 3
    dependencies: []
    story_uid: null
    target_story_ids:
    - story-179b8c06
    - story-d0a8cfad
    description: 'Document the second composition direction (REQ-96): for leaf elements
      L1 wraps the module, so a behavior module ships zero CSS. An L1 control node
      names a module-declared element; renderL1Fragment(nodes, prefix, controls) emits
      that element with L1''s class, geometry and paint axes while the module supplies
      only the attribute bundle (type/name/required, the for<->id wiring, the endpoint).
      The emitter neutralises UA chrome once, re-points ::placeholder so an authored
      colour reaches it, and renders nothing at all for a control naming an element
      no mounted module declares. validateBehaviorControls closes both directions
      — every bound name must be declared, every required declared element must be
      bound. contact-form and carousel now paint only their declared data-fc-invariant
      elements (honeypot, Turnstile mount, visually-hidden label, current-slide signal)
      — presentation fixed by an obligation, not by taste. carousel.config.view is
      deleted as the aesthetic dial it was (it resolved to a flex-basis). getModuleCss
      skips the Astro frontmatter and strips self-closing <style set:html/> tags,
      so theme.css carries module chrome and no component source. The deleted default
      look is relocated to an L2 preset (contactFormPreset) so an uncaptured form
      still renders. AC ownership: the control node kind and its emitter belong to
      STORY-83; the module contract, invariants, config and preset belong to STORY-85.'
    justification: 'Upgrade, not feature: STORY-85 already owns the behavior-module
      contract (config / slots / conformance) and STORY-83 already owns the L1 node
      kinds — this changes what those contracts say rather than introducing a parallel
      module system, and it explicitly supersedes prior intent (AC-699''s slides-per-view
      config dial) rather than adding alongside it. No new capability bucket. The
      user-visible capability documented is: the look of a form field or a carousel
      slide is authored in L1 and honoured exactly, including for void elements that
      no slot could ever reach, while the module keeps sole authorship of the wiring
      that makes the control safe and accessible.'
    intent_delta_summary: STORY-85 gains the two-composition-directions rule (module
      wraps L1 for containers via slots; L1 wraps the module for leaves via control
      nodes), the zero-CSS obligation with its declared invariant-element carve-out,
      and the L2 preset as the home of a vetted default look; its carousel ACs lose
      config.view. STORY-83 gains the control node kind and the emitter properties
      that make it safe.
    acceptance_criteria_changes:
      add:
      - An L1 control node renders the element its mounted behavior declared, carrying
        L1's class, geometry and every paint axis, while the module contributes only
        the attribute bundle; UA chrome is neutralised and ::placeholder follows the
        authored colour.
      - A control naming an element no mounted module declares renders nothing, and
        instance validation rejects both a bound name that is undeclared and a required
        declared element that is unbound.
      - contact-form and carousel emit no CSS beyond their declared invariant elements,
        whose presentation is pinned by an obligation (honeypot invisible, Turnstile
        mount placed, label out of flow, current-slide signalled) and not by the author.
      - The generated theme.css carries module chrome only — a doc comment mentioning
        <style> and a self-closing <style set:html/> no longer fold component source
        into it.
      - An L2 preset supplies a vetted default L1 look for a contact form authored
        without a capture, so deleting the module stylesheet costs an uncaptured site
        nothing.
      - 'The safety envelope survives the inversion: action still clears assertSafeUrl,
        label association stays module-authored, values are escaped, and class/style/on*
        are refused by the emitter with no freeform route back to raw CSS.'
      modify:
      - 'AC-699 (carousel renders an L1-authored slide track driven by behavioural
        config): drop config.view — slides-per-view was an aesthetic dial that resolved
        to a flex-basis; slide width is now an L1 axis on the slide subtree.'
      - 'AC-701 (contact-form renders a functional form with L1-authored presentation):
        extend from intro/submit slots to every control, each carrying its own L1
        geometry and paint.'
      remove: []
  - index: 3
    component: Reproduction Pipeline — Capture & Fold Fidelity
    item_type: upgrade
    story_points: 3
    dependencies:
    - 2
    story_uid: null
    target_story_ids:
    - story-8acc338d
    - story-d5de22a5
    description: 'Document what the extractor now looks at and what the fold does
      with it (BUG-27, plus REQ-96''s reproduction half). A band''s box is the painted
      extent of its subtree, clamped to the document canvas, so a header whose children
      are absolutely positioned (0px tall while painting a full nav bar) keeps its
      subtree instead of being dropped before extraction. Backdrops — a background-image
      url() or an opaque full-bleed background-color — are indexed document-wide rather
      than only off a top-level band root, and projected onto the existing text-free
      Field shape so they reuse the whole field -> fold -> box leaf -> localizeAssets
      path. Deliberately not indexed: data: payloads, non-full-bleed boxes (already
      reconstructed from run surfaces), and full-bleed translucent fills (scrims,
      already recorded as the band''s overlay — indexing one again painted it twice
      and opaque). Full-bleed means touching both document edges, never a fraction
      of width. The fold places a backdrop as a box leaf in the BACKGROUND layer,
      feeds its edges into sectionEdges (giving the band clamp the interior edges
      a page-builder page never had) and counts it toward the page-base inference.
      values-diff gains a backgroundImage delta axis compared by mirrored basename.
      On the control side: a captured form control folds to a control node with its
      geometry rebased to the form''s seam instead of being routed to a residual,
      capture skips data-fc-invariant subtrees and the accessible names they would
      source, and values-diff no longer pairs against module-invariant elements. 1c
      refold re-runs the fold offline against the retained multistate oracle, rewriting
      only what the fold produced.'
    justification: 'Upgrade, not feature: STORY-84 already documents the fold''s full-language
      emission (AC-730 box leaf, AC-731 reconstructed run surfaces, AC-733 residuals)
      and STORY-75 already documents capture/values-diff fidelity closures — this
      corrects and extends what those stories say, and it explicitly supersedes AC-733''s
      rule that a form control always becomes a residual. No new capability bucket;
      no parallel capture path. The user-visible capability documented is: a page
      whose substance is photography reproduces as that photography rather than as
      flat colour, and a reproduced form''s controls carry the reference''s own measured
      geometry.'
    intent_delta_summary: STORY-84's fold gains backdrop leaves in the background
      layer (feeding sectionEdges and the page-base inference) and control leaves
      rebased to the form seam, and loses the always-residual rule for form controls;
      it also gains an offline re-fold verb. STORY-75 gains the capture-side band-extent
      and document-wide backdrop rules, a backgroundImage delta axis, and the exclusion
      of module-invariant elements from pairing.
    acceptance_criteria_changes:
      add:
      - A band's captured box is the painted extent of its subtree clamped to the
        document canvas, so a collapsed (0px-tall) top-level band keeps its children
        and an overflow-clipped carousel slide cannot inflate it.
      - 'Backdrops are indexed anywhere in the document, not only on a top-level band
        root, and are excluded where they would report something that is not there:
        data: payloads, non-full-bleed boxes, and full-bleed translucent scrims already
        recorded as the band''s overlay.'
      - A captured backdrop folds to a box leaf carrying its background image in the
        background layer — behind the band's own runs — and its edges feed the section-edge
        set used to clamp reconstructed bands.
      - values-diff compares a backgroundImage axis by mirrored basename, so a correctly
        reproduced image (site-local mirror vs captured origin URL) raises no delta
        while a missing or wrong one does.
      - A captured form control folds to a control node whose geometry is rebased
        to its form's seam, so the reference's measured field heights and the submit
        button's per-width position survive the fold.
      - Capture skips module-invariant subtrees and the accessible names they would
        source, and values-diff excludes module-invariant elements from pairing, so
        repro-only chrome cannot slide every field against its neighbour.
      - An offline re-fold re-runs the fold against the retained multi-state oracle
        and rewrites only fold output, so a fold change can be picked up without re-hitting
        the captured origin or re-rolling the oracle.
      modify:
      - 'AC-733 (no captured element is silently dropped; a form control always becomes
        a residual): a form control now folds to a control node bound to its behavior
        module; the residual channel remains for elements the fold genuinely cannot
        express.'
      remove: []
  - index: 4
    component: L1 Substrate — Interaction & Motion
    item_type: feature
    story_points: 3
    dependencies:
    - 1
    story_uid: null
    description: 'Document L1''s typed vocabulary for interaction state and scroll-driven
      motion (REQ-99 + REQ-100). node.interaction carries a transition (durationMs
      plus a closed easing enum) and hover / focus state deltas drawn from the shared
      surface group plus colour, text-decoration and a typed motion (offsetXPx/offsetYPx/scale/rotateDeg);
      the transition sits on the interaction rather than inside a state so it governs
      the leave as well as the enter. node.reveal carries yPx, fromOpacity, durationMs,
      easing and delayMs, and container.staggerMs indexes revealing children by position.
      The renderer is the sole pseudo-class sink and the sole animation sink: an instance
      names typed values and never a selector, a keyframe or a script. The focus indicator
      is an obligation — the schema has no way to say ''no ring'' (positive widthPx,
      no none variant) and every bound control gets a currentColor ring when none
      is authored; the ring is excluded from the transition property list because
      a ring that fades in is briefly absent. Reveal is driven by one renderer-owned
      IntersectionObserver, gated on a data-l1-motion marker set only when motion
      will actually run, so no JS, a thrown error or a reduced-motion preference leaves
      the page fully settled; the pre-state sits under :not(.l1-in) so settling restores
      the node''s own authored paint with no second rule; the observer''s root is
      expanded upward so a reader who jumps to the foot of the page still settles
      every band jumped over. Reveal''s translate and interaction''s transform compose,
      and both features'' transitions are merged into one declaration set. prefers-reduced-motion
      drops the travel and keeps the paint.'
    justification: 'Feature: no existing story covers this — before these commits,
      grep for transition, animation, scroll, hover or focus returned nothing in either
      the L1 schema or the renderer, so L1 had no state axis and no time axis at all.
      This is a new capability bucket (presentation that responds to the user agent
      and to the reader''s position) rather than an extension of the static paint
      axes STORY-83 documents, and it carries its own safety obligations (the focus
      indicator, fail-visible motion, reduced-motion) that no existing AC expresses.
      The user-visible capability documented is: a published site''s controls respond
      to pointer and keyboard and its bands arrive as the reader reaches them, with
      the safety of that motion owned by the renderer rather than by the author.'
    acceptance_criteria_changes:
      add: []
      modify: []
      remove: []
  - index: 5
    component: L1 Substrate — Texture
    item_type: upgrade
    story_points: 2
    dependencies:
    - 1
    story_uid: null
    target_story_ids:
    - story-d0a8cfad
    description: 'Document L1''s typed texture vocabulary (REQ-103). A pattern axis
      on the shared surface group carries shape (dots | grid | lines), spacingPx,
      thicknessPx, a hex colour and an angleDeg that tilts lines and is inert elsewhere;
      the renderer compiles it to repeating gradients — dots to one tiled radial-gradient,
      grid to two tiled linear-gradient layers, lines to a repeating-linear-gradient
      that carries its own period — with no asset and no raw CSS. l1GradientSchema
      becomes linear | radial: kind is optional on the linear branch (what a folded
      capture emits) and required on radial, which carries a typed origin (one of
      the nine CSS box positions, never an ''at 30% 40%'' string) and extent; the
      branch axes do not mix, so a radial carrying an angleDeg is rejected rather
      than silently ignored. The background sizing triple becomes positional (one
      value per layer) when a pattern is present so a tiled texture and a cover backdrop
      coexist on one box, and emits exactly the single value it always did when no
      pattern is present. Layer order, top-most first: scrim, texture, gradient wash,
      image, fill. The envelope bounds spacingPx (floor 1px — a sub-pixel period tiles
      a band millions of times) and thicknessPx inside the shared checkSurface, so
      an interaction-state pattern delta is bounded by the same rule as the base node,
      and a rule wider than its own period saturates rather than bleeding into the
      next tile.'
    justification: 'Upgrade, not feature: this extends the surface axis vocabulary
      STORY-83 already documents (AC-725 typed pixel-mover axes rendered as re-derived
      CSS, AC-726 malformed structured axes rejected) — pattern is another typed structured
      axis in the same group and radial is another branch of the gradient axis already
      there. No new capability bucket, no parallel renderer path, prior intent preserved
      (an untextured document emits byte-identical CSS). The user-visible capability
      documented is: a premium surface — a dot grid, a hairline grid, a radial glow
      — is authored as numbers and a hex colour rather than as a full-bleed raster
      that distorts at every viewport it was not authored for.'
    intent_delta_summary: STORY-83's surface axis set gains a typed pattern axis and
      a radial gradient branch, and its background-layer composition becomes an explicit
      ordered stack rather than a single image treatment.
    acceptance_criteria_changes:
      add:
      - A node paints a dot grid, a hairline grid or a set of tilted rules from a
        typed pattern axis (shape, spacing, thickness, hex colour, angle) with no
        image asset and no raw CSS.
      - 'A gradient is linear or radial: the radial branch carries a typed origin
        and extent, and a radial declaring a linear-only axis is rejected by the schema
        rather than ignored by the renderer.'
      - A pattern composes with surfaceFill, surfaceGradient, overlay and a background
        image in a defined layer order, and a document declaring no pattern renders
        byte-identically to before.
      - The envelope bounds the pattern's spacing and thickness through the shared
        surface check, so a base node and an interaction-state delta are bounded by
        the same rule, and the colour goes through the hex-only literal check.
      modify: []
      remove: []
  - index: 6
    component: L1 Substrate — Responsive Layout
    item_type: upgrade
    story_points: 2
    dependencies: []
    story_uid: null
    target_story_ids:
    - story-3569e1a4
    description: 'Document per-width layout variation in L1 (REQ-104). container.responsiveLayout
      is a keyframe track of the layout mode — the first keyframe is the base and
      each later one a min-width override — whose at values are free authored breakpoints
      rather than captured samples, so unlike a geometry or scalar track they are
      not constrained to the document''s widths. container.wrap gives a row flex-wrap:
      wrap, restated whole at each breakpoint so a row that becomes a stack cannot
      inherit a wrapping column. resolveLayoutMode in site-schema is the one cascade
      both the renderer and the analytic evaluator call, so the gate models the mode
      the page actually renders. Two ordering fixes land with it: media blocks now
      serialize by ascending min-width (they were ordered by first appearance across
      the document, so a node emitting 768 before another emitted 520 cascaded backwards),
      and visibility is emitted last so display: none outranks a track that would
      otherwise re-show the node at that width. This replaces the only previously
      expressible answer — authoring the subtree twice under paired visibility.fromPx/untilPx
      — which doubled node count against the 2000 cap, fed staggerMs phantom peers,
      and for a control node was not merely expensive but malformed (two inputs sharing
      one name and one id, with the hidden copy still submitting).'
    justification: 'Upgrade, not feature: STORY-81 is the story that owns per-viewport-width
      variation in L1 — its module-dial delivery was deleted by the REQ-79 pivot and
      re-homed in L1 geometry keyframes, and this extends that same bucket from per-width
      geometry to per-width layout mode. No new capability bucket and no parallel
      responsive mechanism; prior intent is preserved (a page declaring no responsive
      layout renders unchanged). The user-visible capability documented is: a row
      of cards or of form fields becomes a column on a narrow screen as ONE subtree,
      with exactly one input per field in the DOM and its label association intact
      at every width.'
    intent_delta_summary: 'STORY-81''s per-viewport variation extends from geometry
      keyframes to the layout mode itself: a responsiveLayout track plus a wrap axis,
      resolved by one shared cascade that the renderer and the analytic gate both
      call, with media blocks ordered by ascending min-width and visibility emitted
      last.'
    acceptance_criteria_changes:
      add:
      - A row container is authored to lay out as a stack below a stated width as
        one subtree, via a responsiveLayout keyframe track whose breakpoints are free
        authored values rather than captured sample widths.
      - A row of control nodes reflows to a column at mobile with exactly one input
        per field in the DOM, one id per control and an intact label association at
        every width, and a container's stagger indexes only children that exist once.
      - A row can wrap, restated per breakpoint so a stacking width cannot inherit
        a wrapping row, and one shared layout-mode cascade serves both the renderer
        and the analytic layout evaluator.
      - Media blocks are emitted in ascending min-width order and visibility is emitted
        last, so a node declaring two interleaved breakpoints cascades forward and
        a hidden node is not re-shown by a later track.
      - A page declaring no responsive layout renders unchanged.
      modify: []
      remove: []
  - index: 7
    component: L1 Substrate — Navigation
    item_type: feature
    story_points: 2
    dependencies: []
    story_uid: null
    description: 'Document L1''s link role and DOM id emission (REQ-106). A link is
      a role any subtree can take rather than a seventh node kind, so link (href,
      newTab, ariaLabel) is a node-level field. The renderer RETAGS the element the
      author already styled — a text run''s <p>, a box or container''s <div> becomes
      an <a> keeping its class verbatim — rather than wrapping it, because a wrapper
      would move focus off the styled class and silently cost a linked node its focus
      ring; image is the exception, since a void element cannot be an anchor and so
      is wrapped. control is excluded at validation: a submit button inside an anchor
      is malformed interactive nesting and the module owns that element''s semantics.
      href clears the same isSafeUrl allowlist as image.src and backgroundImageUrl,
      and an unsafe href degrades to the plain un-linked element rather than emitting
      a live javascript: link; newTab always carries rel=noopener noreferrer with
      no way to ask for _blank without it; text-decoration: none and color: inherit
      are pushed before the node''s own axes so a link paints from L1 while an authored
      decoration still wins. A node''s id is emitted as a real DOM id so #anchor navigation
      has a target, and the envelope validator rejects a document with two nodes sharing
      an id — which also protects the for<->id association the control contract depends
      on.'
    justification: 'Feature: no existing story expresses navigation. Before these
      commits the schema had no href and no anchor kind, and the renderer emitted
      zero <a> elements, so an L1 page had no navigation of any kind — a functional
      floor rather than an extension of an existing capability. It is L1''s to own
      by the CLAUDE.md test (navigation is presentation plus a URL, not a behaviour
      with its own core), and it brings its own validation rule (unique DOM ids) that
      no existing AC covers. The user-visible capability documented is: a published
      L1 page''s nav, calls to action, in-page anchors and footer actually navigate,
      safely.'
    acceptance_criteria_changes:
      add: []
      modify: []
      remove: []
  - index: 8
    component: Site Validation — Authored Envelope
    item_type: upgrade
    story_points: 2
    dependencies:
    - 7
    story_uid: null
    target_story_ids:
    - story-d0a8cfad
    description: Document that the L1 safety envelope now runs on authored pages,
      not only on reproductions (REQ-107). validateL1 had exactly two call sites,
      both on the reproduction path (fold and probes), so a hand-authored page cleared
      only the shape check — zod strictness and closed enums — while numeric range
      bounds, the URL-scheme allowlist, the node-count cap, geometry-track well-formedness
      and the duplicate-id rule never ran on the one path where a human or an AI free-types
      values into a JSON file. validateSite now runs the envelope over every page
      carrying an l1 block, with the envelope's paths prefixed into the page (/pages/0/l1/root/...)
      so an error points at the offending node rather than at a detached /root/...
      . Because all four consuming layers use that one validator, 1c render, 1c publish,
      1c edit and 1c repro are covered by the single change. Triage found every storage/sites/**
      document and every test fixture already inside the envelope, so no document
      needed fixing and no bound was relaxed. The renderer keeps its independent isSafeUrl
      degradation at every URL sink — this adds a line of defence rather than replacing
      one.
    justification: 'Upgrade, not feature: STORY-83 already owns the safety envelope
      (AC-686 out-of-range/oversize/freeform rejection, AC-687 full per-field error
      list) — this corrects where those criteria are proven, extending them from the
      reproduction path to the authoring path. No new capability bucket, no second
      validator. The user-visible capability documented is: an author or an AI editing
      a site definition gets the envelope''s actionable error message at edit time
      instead of shipping an out-of-range axis, an over-cap tree or a duplicate id
      that only the emitted HTML would reveal.'
    intent_delta_summary: 'STORY-83''s envelope ACs extend from documents produced
      by the fold to every validated site definition: the envelope runs wherever a
      site is validated, its errors are path-prefixed into the page, and the renderer''s
      independent URL degradation remains as defence in depth.'
    acceptance_criteria_changes:
      add:
      - A site definition whose page l1 block violates the envelope fails validation,
        with each error path-prefixed into the page so it names the offending node.
      - An out-of-range numeric axis, an unsafe image src, an over-cap node count
        and a duplicate node id are each rejected at authoring time, on the same path
        that render, publish, edit and import use.
      - The renderer keeps its independent safe-URL degradation at every URL sink,
        so authoring-time validation is a line of defence added rather than one replaced.
      modify:
      - 'AC-686 / AC-687: state that the envelope''s rejection and full per-field
        error list are guaranteed for an authored document, not only for one produced
        by the fold.'
      remove: []
  - index: 9
    component: Reproduction Gate — Cross-Gate Reconciliation
    item_type: upgrade
    story_points: 3
    dependencies:
    - 3
    story_uid: null
    target_story_ids:
    - story-24098299
    description: Document 1c gate <slug> --ref <bundle>, the verb that reconciles
      the three eyes (REQ-94). A reproduction 80% wrong by pixel count passed the
      pipeline because l1-gate grades geometry only, by design, and values-diff can
      only compare elements present in both manifests — so a capture that missed the
      page's imagery left it nothing to raise a delta against, and nothing compared
      the gates to each other. The verb runs the two browser-free gates first (l1-gate
      and reference coverage), then the perceptual and value eyes through their existing
      offline seams; applies a perceptual floor (mean and percent-over-threshold)
      that fails the run regardless of what the value gates say; reports reference
      coverage every run — mirrored-vs-referenced images and page height per captured
      section, both numbers the pipeline already computed and never surfaced; and
      names the likely cause as capture-incomplete, reproduction-wrong or unexplained-disagreement,
      with the next step to take, so 'fix the capture' and 'fix the reproduction'
      stop looking identical. Value-gate deltas are evidence rather than part of the
      exit code — 1c values-diff already exits non-zero on any delta and stays the
      sharp instrument for a text-led page. A bundle with no retained multi-state
      oracle is a hard error, never a vacuous pass, because coverage measured against
      nothing reports clean.
    justification: 'Upgrade, not feature: STORY-86 is the story that defines the reproduction
      acceptance boundary (AC-708 the combined gate passes only when all three probes
      pass and is non-vacuous, AC-710 diagnostic findings, AC-737 residual channels).
      REQ-94''s whole argument is that the boundary was drawn too narrowly — geometry-only
      — so this extends that story''s bucket rather than adding a second, competing
      verdict about whether a reproduction is good enough. A parallel story would
      leave two stories each claiming to say when a reproduction passes. The user-visible
      capability documented is: an operator learns from the pipeline, not from a screenshot,
      that a page did not reproduce — and is told which of the two different fixes
      it needs.'
    intent_delta_summary: 'STORY-86''s acceptance boundary extends from the three
      geometry probes to a cross-gate verdict: a perceptual floor that can fail a
      run on its own, a reference-coverage report emitted every run, and a named cause
      distinguishing an incomplete capture from a wrong reproduction.'
    acceptance_criteria_changes:
      add:
      - A single gate verb reconciles the geometry gate, reference coverage, the perceptual
        eye and the value eye for one reproduction against its bundle, running the
        browser-free gates first.
      - A perceptual mean or percent-over-threshold above the floor fails the run
        regardless of a clean geometry gate and a low value-delta count, and the floor
        the run was held to is echoed into the report rather than left implicit.
      - Reference coverage is reported every run — mirrored versus referenced media
        and page height per captured section — so an impoverished reference manifest
        is visible without an operator inspecting a screenshot.
      - A failing run names its likely cause (capture-incomplete, reproduction-wrong,
        or unexplained-disagreement) and the next step, so an incomplete capture and
        a wrong reproduction stop presenting identically.
      - Value-gate deltas are reported as evidence and do not themselves set the exit
        code, and a bundle with no retained multi-state oracle is a hard error rather
        than a vacuous pass.
      modify: []
      remove: []
  - index: 10
    component: Font Provenance
    item_type: feature
    story_points: 3
    dependencies: []
    story_uid: null
    description: 'Document the font provenance registry and its gate (REQ-101). fonts/registry.yaml
      is a project-level index over every font file in the repo, recording family,
      foundry, source URL, download date, licence (name, URL, commercial_use, self_host,
      redistribute_in_product), outstanding actions and the file list; font files
      stay per-site under draft/assets/ so a site remains self-contained, and the
      registry is the index over them rather than their home. The load-bearing field
      is licence.redistribute_in_product, three-state rather than boolean — true,
      false, or REVIEW_REQUIRED for ''asked, not answered'' — because ''may I use
      this on our own site'' and ''may I ship this to 10,000 customer sites'' are
      different questions with different answers, and every gate treats REVIEW_REQUIRED
      as no so an unresolved licence cannot leak into product distribution. siteConfig.distribution
      (internal | product, default internal) marks which question a site is asking.
      1c fonts check joins every site''s l1 font resources against the registry AND
      scans the source trees on disk, raising four violations: unregistered-family,
      unregistered-file, unprovenanced-file (bytes in the tree that no entry records,
      even where nothing references them — the class a capture bundle produces), and
      redistribution-not-permitted. The disk scan covers .woff2/.woff/.ttf/.otf under
      storage/ minus the gitignored dist/ render output and vendored node_modules/,
      so a finding is never doubled and the check does not depend on whether anyone
      had rendered recently. Outstanding actions warn but do not fail — that is the
      state a font legitimately sits in while cleared for this repo and not yet cleared
      for the product — and a missing or malformed registry is a hard error, never
      a vacuous pass. All 23 font files on disk are backfilled across 10 families
      in two provenance classes (authored versus capture-derived).'
    justification: 'Feature: no existing story covers licence provenance. STORY-83''s
      AC-727/AC-728 cover the L1 document''s font resource table — binding a family
      handle to a served face and bounding it in the envelope — which is a different
      concern from where the bytes came from and what their licence permits. This
      is a new capability bucket (a compliance artifact with its own registry, its
      own site-config marker and its own CLI verb) that constrains the product rather
      than the document. The user-visible capability documented is: every font byte
      in the repo is accounted for, and a site that ships across customer domains
      cannot be published carrying a face whose redistribution question is unanswered.'
    acceptance_criteria_changes:
      add: []
      modify: []
      remove: []
  - index: 11
    component: Site Scaffolding
    item_type: feature
    story_points: 1
    dependencies: []
    story_uid: null
    description: 'Document that 1c new scaffolds a minimal valid L1 document (REQ-102).
      The starter page was { modules: [] } with no l1 block, so authoring began by
      hand-writing the whole document — the width ladder, the background, the root
      container — before a single pixel existed, and every author had to know the
      ladder convention by heart or copy it out of an unrelated site. starterHomePage
      now seeds a flowed, centred root container with one placeholder text run, on
      the capture width ladder derived from RESPONSIVE_VIEWPORTS rather than restated,
      using the theme''s own background and text colours, so 1c render and 1c shot
      succeed immediately on a fresh site with no editing. There is no flag and no
      second shape: L1 is the way to author a page, so a --l1 opt-in would be exactly
      the mode detection CLAUDE.md forbids. The root is deliberately un-keyframed
      — keyframes are what a capture folds to, and inventing a set here would hand
      the author absolute boxes to unpick before their first edit, where flow centres
      itself at every width. 1c repro empties the site directory before writing, so
      a scaffolded skeleton cannot contaminate a reproduction import.'
    justification: 'Feature: no story owns what 1c new produces. STORY-79 mentions
      ''the empty starter'' only as a condition of the Astro-free render path, not
      as a scaffolding capability, and no capability describes the shape of a new
      site. The user-visible capability documented is: a fresh site renders a real
      page from the moment it is created, on the correct width ladder, with no hand-written
      L1 and no mode flag.'
    acceptance_criteria_changes:
      add: []
      modify: []
      remove: []
  - index: 12
    component: Behavior Modules — Enhancement Gate
    item_type: upgrade
    story_points: 1
    dependencies:
    - 2
    story_uid: null
    target_story_ids:
    - story-179b8c06
    description: 'Document that contact-form enhances only the submissions fetch()
      can actually send (BUG-28). client.js previously called preventDefault() unconditionally
      and then fetched the action; assertSafeUrl accepts mailto: and tel:, which fetch
      cannot send to, so those forms rejected, showed ''could not reach the server'',
      and could not fall back — the native submit they would have worked by had already
      been cancelled. That inverts the module''s declared isolation obligation, which
      promises a failure degrades to the no-JS post baseline, and it is the default
      state of any authored site that does not yet have a backend. Enhancement is
      now decided from the action''s scheme BEFORE preventDefault: http(s), relative
      and empty (post-to-self) actions are intercepted and fetched exactly as before;
      any other permitted scheme, and any action that cannot be parsed, falls through
      to the user agent''s native submit without throwing. No config field is added
      — the data already determines the answer, and an enhance dial would be an escape
      hatch for something the scheme already says.'
    justification: 'Upgrade, not feature: STORY-85 already declares the isolation
      obligation (AC-703, degenerate input degrades inertly) and the contact-form''s
      no-JS post baseline (AC-701) — this corrects behaviour those criteria already
      claim rather than adding a capability, so it extends an existing bucket in place
      with no parallel client path and no new config surface. The user-visible capability
      documented is: a form whose action is an email or phone endpoint submits natively
      instead of dying silently with a server error the visitor cannot act on.'
    intent_delta_summary: 'STORY-85''s isolation obligation extends from ''a throwing
      core degrades inertly'' to ''the client enhancement only intercepts what it
      can complete'': the enhancement decision is made from the action''s scheme before
      the native submit is cancelled, so a non-fetchable or unparseable action keeps
      the vetted no-JS baseline.'
    acceptance_criteria_changes:
      add:
      - A contact form whose action carries a non-fetchable but permitted scheme (mailto:,
        tel:) performs the user agent's native submit with no error banner, and an
        action that cannot be parsed falls back the same way without throwing.
      - A form whose action is http(s), relative or empty is enhanced exactly as before
        — intercepted, submitted as JSON, with an inline success swap and an inline
        error on a non-2xx response — and no config field governs the choice.
      modify:
      - 'AC-703 (isolation conformance): extend the obligation to cover an action
        the enhancement cannot complete, not only a throwing core — the enhancement
        must never cancel the baseline it cannot replace.'
      remove: []
---

# Reconciliation Plan — BUNDLE-11

**Mode**: commits
**Anchor**: bundle-ee56a66e (BUNDLE-11 — BUG-27 + REQ-94 + REQ-96 + REQ-97 + REQ-98 + 10 more)
**Source**: 16 free-coded commits on `reconcile-BUNDLE-11`, covering 15 source intents.

## Intent read (Step 0)

The bundle body carries all 15 source-intent bodies plus their as-implemented
outcome sections. Read in full. The intents fall into four families:

| family | intents |
|---|---|
| L1 substrate language growth | REQ-97 (text measure), REQ-98 (uniform paint group), REQ-105 (node-level group hoist), REQ-99 (interaction state), REQ-100 (scroll reveal/stagger), REQ-103 (texture + radial gradients), REQ-104 (responsive layout track + wrap), REQ-106 (link role + DOM ids) |
| Module contract | REQ-96 (`control` node, modules ship zero CSS, L2 preset), BUG-28 (contact-form enhances only fetchable actions) |
| Reproduction pipeline | BUG-27 (backdrops + painted-subtree band extent), REQ-94 (`1c gate` cross-gate reconciliation) |
| Safety / operations | REQ-107 (envelope runs on authored pages), REQ-101 (font provenance registry + `1c fonts check`), REQ-102 (`1c new` scaffolds an L1 document) |

The recurring frame the operator states explicitly across REQ-97/98/99/103/104/105:
since REQ-96 made L1 the sole owner of appearance and modules ship zero CSS, an
axis L1 cannot carry is an axis a module must paint — so each of these is a hole
in the REQ-96 contract, not an ergonomics complaint. That framing is what makes
these upgrades to the existing L1 substrate story rather than parallel work.

## Behavior inventory

```yaml
behavior_inventory:
  source: "free-coded commits (16) on bundle-ee56a66e"
  entry_files:
    - packages/site-schema/src/l1/schema.ts
    - packages/site-schema/src/l1/validate.ts
    - packages/site-schema/src/l1/layout.ts
    - packages/site-schema/src/validate.ts
    - packages/site-schema/src/fonts.ts
    - packages/framework/src/l1/render.ts
    - packages/framework/src/l2/contact-form.ts
    - packages/framework/src/modules/behavior.ts
    - packages/framework/src/modules/contact-form/{index.astro,controls.ts,meta.ts,client.js}
    - packages/framework/src/modules/carousel/{index.astro,meta.ts,client.js}
    - packages/framework/src/modules/styles.ts
    - tools/generate/src/cli/{index.ts,gate.ts,fonts.ts,scaffold.ts,repro.ts}
    - tools/generate/src/cli/capture/{extract.ts,sections.ts,types.ts,values-diff.ts}
    - tools/generate/src/l1/{fold.ts,probes.ts,assets.ts,forms.ts}
    - fonts/registry.yaml
  features:
    - name: "Shared L1 axis groups"
      description: "l1SurfaceAxesSchema (paint) and l1NodeAxisGroupsSchema (geometry, sizing, visibility, transform, mask, padding, responsivePadding, interaction, reveal) are declared once and spread into every node kind; l1BoxAxesSchema is gone."
      behaviors:
        - "container/slot/control paint; a painted, internally-laid-out element is ONE node"
        - "text carries sizing (its own measure); slot carries sizing"
        - "envelope bounds the surface group once for every kind (closes borderLeft width, backgroundImageUrl scheme on non-box kinds)"
        - "localizeAssets resolves a background image on any kind"
        - "probes.constrainWidth narrows a node's frame by its own sizing.width for every kind"
      entry_point: "schema.ts surfaceAxesShape / nodeAxisGroupsShape; render.ts surfaceDecls(); probes.ts constrainWidth()"
    - name: "L1 control node + zero-CSS behavior modules"
      description: "Second composition direction — L1 wraps the module for leaf elements."
      behaviors:
        - "l1ControlSchema leaf naming a module-declared element; renderL1Fragment(nodes, prefix, controls) emits it with L1 class/geometry/paint"
        - "UA-chrome reset and ::placeholder re-pointing emitted once by the sole emitter"
        - "a control naming no declared element renders nothing (inert degradation)"
        - "validateBehaviorControls: every bound name declared, every required declared element bound"
        - "contact-form and carousel ship no CSS beyond declared data-fc-invariant elements (honeypot, Turnstile mount, hidden label, current-slide signal)"
        - "carousel config.view deleted (a flex-basis wearing behavioural clothes)"
        - "getModuleCss skips Astro frontmatter and self-closing <style set:html/>, so theme.css no longer carries component source"
        - "L2 contactFormPreset carries the deleted default look"
      entry_point: "schema.ts l1ControlSchema; render.ts renderL1Fragment; modules/behavior.ts; l2/contact-form.ts; modules/styles.ts"
    - name: "Capture/fold/values-diff backdrop + control fidelity"
      description: "What the extractor looks at, and what the fold does with it."
      behaviors:
        - "a band's box is the painted extent of its subtree, clamped to the document canvas (a 0px-tall header keeps its subtree)"
        - "document-wide backdrop index: any visible element painting background-image url() or an opaque full-bleed background-color, projected onto the text-free Field shape"
        - "deliberate exclusions: data: payloads, non-full-bleed boxes, full-bleed translucent fills (scrims, already the band's overlay)"
        - "full-bleed = touching both document edges, not a fraction of width"
        - "fold: a backdrop becomes a box leaf with axes.backgroundImageUrl in the BACKGROUND layer, feeds sectionEdges and the page-base inference"
        - "values-diff: backgroundImage delta axis compared by mirrored basename"
        - "fold: a captured control folds to a control node rebased to the form seam instead of a residual"
        - "capture skips data-fc-invariant subtrees and the accessible names they would source"
        - "1c refold re-runs the fold offline against the retained multistate oracle"
      entry_point: "capture/extract.ts; l1/fold.ts; capture/values-diff.ts; cli/index.ts case 'refold'"
    - name: "L1 interaction state and motion"
      description: "Typed hover/focus deltas and scroll-driven reveal/stagger, compiled only by the renderer."
      behaviors:
        - "node.interaction: transition (durationMs + closed easing enum), hover/focus state delta bags over the shared surface group + colour/textDecoration/motion"
        - "renderer is the sole pseudo-class sink; no document names a selector"
        - "focus indicator is an obligation: no way to author widthPx 0/none; every bound control gets a currentColor ring by default; ring excluded from the transition list"
        - "node.reveal (yPx, fromOpacity, durationMs, easing, delayMs) and container.staggerMs"
        - "one renderer-owned IntersectionObserver, gated on a data-l1-motion marker so the page fails visible"
        - "pre-state under :not(.l1-in) so settling restores authored paint with no second rule"
        - "reveal translate and interaction transform compose; transitions merged into one declaration set"
        - "prefers-reduced-motion drops travel, keeps paint; observer root expanded upward so a jump-to-foot still settles"
      entry_point: "schema.ts l1InteractionSchema/l1RevealSchema; render.ts L1_REVEAL_SCRIPT, transitionDecls"
    - name: "L1 texture"
      description: "pattern axis + radial gradient branch."
      behaviors:
        - "pattern: shape dots|grid|lines, spacingPx, thicknessPx, hex colour, angleDeg (tilts lines) compiled to repeating gradients — no asset"
        - "l1GradientSchema = linear | radial; kind optional on linear, required on radial; a radial with angleDeg is rejected"
        - "background sizing triple becomes positional when a pattern is present; layer order scrim, texture, gradient wash, image, fill"
        - "envelope bounds spacingPx [1,1000] and thicknessPx [0,1000] inside the shared checkSurface"
      entry_point: "schema.ts l1PatternSchema/l1RadialGradientSchema; render.ts"
    - name: "L1 responsive layout"
      description: "per-width layout mode + wrapping rows."
      behaviors:
        - "container.responsiveLayout keyframe track (at = a free authored breakpoint, not constrained to doc.widths)"
        - "container.wrap for a row, restated whole at each breakpoint"
        - "resolveLayoutMode is the one cascade both renderer and analytic evaluator call"
        - "media blocks serialize by ascending min-width; visibility emitted last so display:none outranks a re-showing track"
      entry_point: "schema.ts l1ResponsiveLayoutSchema; l1/layout.ts resolveLayoutMode; render.ts; probes.ts"
    - name: "L1 link role"
      description: "navigation as a node-level role."
      behaviors:
        - "link.href/newTab/ariaLabel on text/box/container (retag to <a> keeping the class), image wraps, control rejects link"
        - "href clears isSafeUrl; unsafe degrades to the un-linked element; newTab always carries rel=noopener noreferrer"
        - "text-decoration:none and color:inherit pushed before authored axes"
        - "node id emitted as a DOM id; envelope rejects duplicate ids"
      entry_point: "schema.ts l1LinkSchema; render.ts nodeLink/idAttr; validate.ts scanIds"
    - name: "Authored-page envelope"
      description: "validateSite runs validateL1 over every page carrying l1, path-prefixed to /pages/<i>/l1/..."
      behaviors:
        - "numeric ranges, URL allowlist, node cap, geometry-track well-formedness and duplicate ids now fire on authored pages"
        - "covers 1c render / publish / edit / repro through the one validator"
        - "renderer keeps its independent isSafeUrl degradation"
      entry_point: "packages/site-schema/src/validate.ts"
    - name: "1c gate"
      description: "Cross-gate reconciliation verb."
      behaviors:
        - "runs l1-gate and reference coverage browser-free first, then perceptual and value eyes through existing offline seams"
        - "perceptual FLOOR (mean 8 / 25% over threshold) fails the run regardless of the value gates"
        - "reference coverage reported every run: mirrored-vs-referenced images, page height per captured section"
        - "verdict names the cause: capture-incomplete | reproduction-wrong | unexplained-disagreement, with a next step"
        - "value deltas are evidence, not part of the exit code; a bundle with no multistate.json is a hard error"
      entry_point: "tools/generate/src/cli/gate.ts; cli/index.ts case 'gate'"
    - name: "Font provenance"
      description: "fonts/registry.yaml + 1c fonts check."
      behaviors:
        - "registry records family, foundry, source, downloaded, licence (name/url/commercial_use/self_host/redistribute_in_product), actions, files"
        - "redistribute_in_product is three-state; REVIEW_REQUIRED is treated as no by every gate"
        - "siteConfig.distribution internal|product"
        - "violations: unregistered-family, unregistered-file, unprovenanced-file, redistribution-not-permitted"
        - "source-tree scan over storage/**/*.woff2|woff|ttf|otf minus dist/ and node_modules/"
        - "outstanding actions warn but do not fail; a missing/malformed registry is a hard error"
      entry_point: "packages/site-schema/src/fonts.ts; tools/generate/src/cli/fonts.ts"
    - name: "1c new scaffolding"
      description: "starterHomePage seeds a minimal valid L1 document."
      behaviors:
        - "flowed centred root container with one placeholder text run, on the capture width ladder derived from RESPONSIVE_VIEWPORTS"
        - "theme background/text colours; root deliberately un-keyframed"
        - "no flag, no mode detection; 1c repro emptyDirs the site so a skeleton cannot contaminate an import"
      entry_point: "tools/generate/src/cli/scaffold.ts starterHomePage"
    - name: "contact-form enhancement gate"
      description: "BUG-28 — enhance only what fetch() can send."
      behaviors:
        - "canEnhance(action) decided from the scheme BEFORE preventDefault; http(s), relative and empty enhance"
        - "mailto:/tel: and any unparseable action fall through to the native submit"
        - "no config field added — the data already determines the answer"
      entry_point: "packages/framework/src/modules/contact-form/client.js canEnhance()"
```

## Coverage map

```yaml
coverage_map:
  - feature: "Shared L1 axis groups (REQ-97/98/105)"
    status: partial
    existing_stories: [story-d0a8cfad]   # STORY-83 L1 layout substrate
    existing_acs: [AC-682, AC-725, AC-726, AC-686]
    gaps:
      - "the story's axis table is per-kind (box paints, container lays out); the shared group and its uniformity is undocumented"
      - "text measure, slot sizing, and the probe's sizing mirror have no AC"
  - feature: "L1 control node + zero-CSS behavior modules (REQ-96)"
    status: partial
    existing_stories: [story-d0a8cfad, story-179b8c06]   # STORY-83, STORY-85
    existing_acs: [AC-723, AC-698, AC-699, AC-701]
    gaps:
      - "STORY-85 documents slots as the ONLY composition direction; leaf controls have no vocabulary"
      - "AC-699 documents carousel config driving slides-per-view — config.view is deleted"
      - "no AC says a module ships zero CSS, nor names the invariant-element carve-out"
      - "no AC for the L2 preset library"
  - feature: "Capture/fold backdrops, band extent, control fold, refold (BUG-27 + REQ-96 repro side)"
    status: partial
    existing_stories: [story-8acc338d, story-d5de22a5]   # STORY-84 fold, STORY-75 values-diff
    existing_acs: [AC-730, AC-731, AC-733, AC-689]
    gaps:
      - "AC-733 states a form control ALWAYS routes to a residual — superseded by the control fold"
      - "no AC for backdrops read outside a top-level band root, nor for band box = painted subtree extent"
      - "values-diff has no media/backgroundImage axis and no invariant-exclusion rule"
      - "no AC for an offline re-fold verb"
  - feature: "L1 interaction state and scroll motion (REQ-99/100)"
    status: uncovered
    existing_stories: []
    gaps:
      - "no story mentions hover, focus, transition, reveal or stagger; L1 had no state and no time axis at all"
  - feature: "L1 texture (REQ-103)"
    status: partial
    existing_stories: [story-d0a8cfad]
    existing_acs: [AC-725, AC-726]
    gaps:
      - "surface axes cover a single linear gradient and a cover/no-repeat background image; no pattern, no radial, no layer order"
  - feature: "Responsive layout track + wrap (REQ-104)"
    status: partial
    existing_stories: [story-3569e1a4]   # STORY-81 responsive per-breakpoint variation
    existing_acs: []                     # module-dial ACs removed by the pivot; the story is a repointer with no ACs
    gaps:
      - "per-viewport variation is documented for geometry keyframes only; layout MODE is one enum for every width"
      - "no wrap axis; no shared resolveLayoutMode cascade; media-block ordering is undocumented"
  - feature: "L1 link role + DOM ids (REQ-106)"
    status: uncovered
    existing_stories: []
    gaps:
      - "no story expresses navigation; the renderer emitted no <a> and no DOM id at all"
  - feature: "Envelope on authored pages (REQ-107)"
    status: partial
    existing_stories: [story-d0a8cfad]
    existing_acs: [AC-686, AC-687]
    gaps:
      - "those ACs are proven on the reproduction path only; validateL1 had two call sites, both in fold/probes"
  - feature: "1c gate (REQ-94)"
    status: partial
    existing_stories: [story-24098299]   # STORY-86 3-probe acceptance gate
    existing_acs: [AC-708, AC-710, AC-737]
    gaps:
      - "the combined gate is geometry-only; nothing compares it to the perceptual and value eyes"
      - "no perceptual floor, no reference-coverage report, no cause attribution"
  - feature: "Font provenance registry + 1c fonts check (REQ-101)"
    status: uncovered
    existing_stories: []
    existing_acs: [AC-727, AC-728]   # the L1 font RESOURCE table — a different concern (binding, not provenance)
    gaps:
      - "no story covers licence provenance, product-distribution gating, or a fonts verb"
  - feature: "1c new scaffolds an L1 document (REQ-102)"
    status: uncovered
    existing_stories: []
    gaps:
      - "STORY-79 mentions 'the empty starter' only as a render-path condition; no story owns what 1c new produces"
  - feature: "contact-form enhancement gate (BUG-28)"
    status: partial
    existing_stories: [story-179b8c06]
    existing_acs: [AC-703]   # isolation: degenerate input degrades inertly
    gaps:
      - "the isolation obligation is asserted for a throwing core, not for an action the enhancement cannot send"
```

## Step 3b — intent scope vs implementation footprint

Every commit's footprint is inside its intent's declared scope, with four
deliberate in-scope excursions the intents record and justify:

1. **`getModuleCss` frontmatter/self-closing `<style>` fix** (REQ-96). Pre-existing
   defect (`carousel` shipped its own source as `theme.css`), fixed inside REQ-96
   because it makes the "ships no CSS" criterion uncheckable. Recorded in the
   ticket's Outcome section — explicit, not drift. Covered by item 2.
2. **`1c refold`** (REQ-96). Not in the ticket's seven scope items; added because
   every fold change staled every bundle and the only refresh path re-hit a
   third-party site. Recorded in the Outcome section. Covered by item 3.
3. **Media-block ascending-`min-width` serialization** (REQ-104). A latent
   pre-existing ordering bug (blocks were ordered by first appearance) that only
   bites once two authored breakpoints interleave. In scope by necessity.
4. **`constrainWidth` made generic rather than text-only** (REQ-97). Closes a
   pre-existing probe/renderer mirror gap for wrapper containers. Recorded as a
   design decision in the ticket.

Case-2 supersessions (an intent knowingly changing what a prior intent
established), each handled by an upgrade item rather than a parallel story:

- `carousel.config.view` deleted — supersedes STORY-85 AC-699's slides-per-view
  config (REQ-96 §The change).
- "a form control is always routed to a residual" — supersedes STORY-84 AC-733
  (REQ-96 scope item 4).
- `l1BoxAxesSchema` / `L1BoxAxes` renamed and dissolved into the shared group —
  supersedes the per-kind axis table in STORY-83 (REQ-98).

No Case-3 findings: no commit touches an area silent in its owning intent.

**Untracked-site caveat.** REQ-97 and REQ-99 both record that
`storage/sites/xgd/**` edits were made in the working tree but deliberately not
committed under those tickets; `storage/sites/xgd/` lands with REQ-100's commit
(62b5217). Site definition data is not capability surface — no plan item covers
it, and none of the ACs below should be written against xgd.dev's content.

**Split-commit note.** Bundle commits `f3cc945a3` (REQ-106) and `03cff18f`
(BUG-28) carry test files only. Their implementation is on this branch in
`0956bf3ee` ("typed link role + DOM id emission; contact-form only enhances
fetchable actions"), one of the anchor's `orphan_commits` remaps. Verified
present: `l1LinkSchema`, the renderer retag/`idAttr`, the duplicate-id scan, and
`canEnhance()` in `client.js`. Items 7 and 12 are therefore in scope, not
phantom.

## Plan items

| # | Component | Type | Points | Deps | Targets | Description |
|---|-----------|------|--------|------|---------|-------------|
| 1 | L1 substrate — axis groups | upgrade | 3 | – | STORY-83 | Paint and node-level axis groups declared once, spread into every kind; text measure; slot sizing; probe mirror |
| 2 | Behavior modules — leaf-control composition | upgrade | 3 | – | STORY-85, STORY-83 | L1 `control` node; modules ship zero CSS beyond declared invariants; `config.view` deleted; L2 preset |
| 3 | Reproduction pipeline — capture & fold fidelity | upgrade | 3 | 2 | STORY-84, STORY-75 | Backdrops document-wide; band box = painted subtree extent; control fold; invariant-blind capture/diff; `backgroundImage` axis; `1c refold` |
| 4 | L1 substrate — interaction & motion | feature | 3 | 1 | – | Typed hover/focus states, focus-ring obligation, scroll reveal + stagger, one renderer-owned observer |
| 5 | L1 substrate — texture | upgrade | 2 | 1 | STORY-83 | `pattern` axis (dots/grid/lines) + radial gradient branch + positional background layer stack |
| 6 | L1 substrate — responsive layout | upgrade | 2 | – | STORY-81 | `responsiveLayout` track, `wrap`, one `resolveLayoutMode` cascade, ordered media blocks |
| 7 | L1 substrate — navigation | feature | 2 | – | – | `link` role retagging to `<a>`, safe-URL degradation, DOM id emission, duplicate-id rejection |
| 8 | Site validation — authored envelope | upgrade | 2 | 7 | STORY-83 | `validateSite` runs the L1 envelope on every authored page, path-prefixed |
| 9 | Reproduction gate — cross-gate reconciliation | upgrade | 3 | 3 | STORY-86 | `1c gate`: perceptual floor, reference coverage, named cause |
| 10 | Font provenance | feature | 3 | – | – | `fonts/registry.yaml` + `1c fonts check` + `distribution` marker |
| 11 | Site scaffolding | feature | 1 | – | – | `1c new` seeds a minimal valid L1 document |
| 12 | Behavior modules — enhancement gate | upgrade | 1 | 2 | STORY-85 | contact-form enhances only actions `fetch()` can send |

Totals: 12 items — 8 upgrade, 4 feature — 28 points.

## Observations

- **Why upgrades dominate.** Eight of the fifteen intents state their own
  justification as "REQ-96 made L1 the sole owner of appearance, so this gap is a
  hole in that contract". They extend the same capability bucket (the L1 axis
  vocabulary and its envelope) and are therefore upgrades to STORY-83, not new
  stories. Only four items open genuinely new buckets: state/motion (L1 had no
  interaction and no time axis at all), navigation (the renderer emitted no `<a>`),
  font provenance (a compliance artifact with its own CLI verb), and scaffolding.
- **Interaction+motion combined deliberately.** REQ-99 and REQ-100 are one story,
  not two: REQ-100 reuses REQ-99's `l1EasingSchema` rather than minting a second
  timing vocabulary, and the load-bearing behaviour — merging the two features'
  transitions into one declaration set so the second does not silently cancel the
  first — is only expressible as an AC that spans both.
- **REQ-97/98/105 combined deliberately.** Three commits, one capability: an axis
  group declared once and shared by every kind. Splitting them would produce three
  stories that each say "and now this group too".
- **Two items carry two target stories each** (items 2 and 3). The capability
  genuinely spans two buckets — the `control` contract has an L1 half and a module
  half; the backdrop/control work has a capture half and a fold half. Splitting on
  the story boundary would put half a criterion in each.
- **STORY-81 has zero ACs today** (its module-dial ACs were removed by the REQ-79
  pivot and never replaced). Item 6 is the first content it regains, and the fit is
  exact: it is the story that owns per-viewport-width variation in L1.
- **Judgment call — where `1c gate` lands.** It could read as a new command story.
  It is an upgrade to STORY-86 because that story defines the reproduction
  *acceptance boundary*, and REQ-94's whole argument is that the boundary was
  drawn too narrowly (geometry-only). A parallel story would leave two stories
  each claiming to say when a reproduction is good enough.
- **Uncertainty — STORY-79's "empty starter" AC.** REQ-102 means the starter is no
  longer empty. The Astro-free render-path AC still holds (a scaffolded page carries
  no behavior module), so no upgrade item is raised; if the story cycle finds the AC
  worded against emptiness rather than against module-freeness, it should be reworded
  under item 11 rather than left stale.
- **No FC test files were reported for this anchor** (`fc_tests` empty), but the
  commits do carry `test_UAT_FC_REQ-97_*`, `test_UAT_FC_REQ-103_*` and
  `test_UAT_FC_REQ-82_*` style names inside the TypeScript suites
  (`tests/req9*.test.ts`, `tests/req10*.test.ts`). The FC-orphan gate scans for
  Python `test_UAT_FC_*.py`, which this repo does not use; the story cycle should
  rename the TypeScript FC-named tests to their new AC numbers as it writes each AC.