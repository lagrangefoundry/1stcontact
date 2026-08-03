---
uid: report-24e812fb
id: REPORT-1083
type: report
title: 'Reconciliation Plan: BUNDLE-10 (BUG-12..BUG-25 + REQ-88 + REQ-93) — first
  real page reproduction'
created_by: xgd
created_at: '2026-08-03T00:18:37.675264+00:00'
updated_at: '2026-08-03T00:59:50.752507+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-4ff83a8b
  anchor_uid: bundle-4ff83a8b
  items:
  - index: 1
    component: Capture — recording contract (extract / driver / reextract / pipeline
      / theme)
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'Document what a capture RECORDS, as distinct from what the fold
      does with it. The in-page extractor and the capture driver now record: (a) fonts
      as painted — @font-face parsed from cached cross-origin stylesheet BYTES and
      unioned with the same-origin CSSOM so a Google-Fonts family reaches theme.fonts.files;
      the full font-family STACK per run (not the primary token), with the primary
      derived only where a single name is needed (face load-check, @font-face keying,
      theme.ts as the one definition); a web-font barrier re-established AFTER settlePage
      reveals below-fold content plus a fontLoaded probe against the actual painted
      face (real weight + the run''s own text); and offline re-extraction made self-contained
      by rewriting every absolute URL whose basename was mirrored to a loopback /<basename>
      (extensionless CSS mirrors served as text/css). (b) WHO paints what — surfaceFill
      / borderLeft / surfaceGradient resolved GEOMETRICALLY (the painted boxes containing
      the run, tightest first) rather than by a parentElement walk; SurfaceShape (the
      bearing box''s own rect, radius, shadow, border, plus a `self` flag); accentBox
      (the rect of the element that bears an asymmetric accent rule), carried on rawRunToElement
      so it survives the multi-state manifest projection; sections[].box carried for
      every section, not only image-bearing ones; and a translucent scrim resolved
      through the canvas rgbaOf probe (so color-mix/oklab/oklch veils are seen) with
      the fillStyle serialization preferred over the premultiplied pixel read-back.
      (c) per-run geometry — an element split into several text runs gives run i its
      OWN Range-derived box and glyph box instead of the element''s, while a single
      wrapping text node stays one run. (d) behavioural facts no painted axis can
      hold — a captured field''s controlType and formAction. (e) a second-height probe
      viewport (HEIGHT_PROBE_VIEWPORTS) re-shooting one ladder width, deliberately
      outside RESPONSIVE_VIEWPORTS.'
    justification: No existing story documents the capture's recording contract. STORY-84
      documents the FOLD that consumes the capture, STORY-75 documents values-diff's
      COMPARISON of captured values, and STORY-86 documents the gate — but nothing
      states what the capture must record for a reproduction to be possible at all.
      These behaviours are load-bearing for three separate consumers (fold, values-diff,
      gate), which is precisely why they belong in their own story rather than being
      duplicated as capture clauses inside each consumer's story. This is a genuinely
      uncovered capability bucket, not an extension of the fold's.
    story_uid: story-244827df
  - index: 2
    component: Capture-to-L1 fold — surface hierarchy reconstruction
    item_type: upgrade
    story_points: 3
    dependencies:
    - 1
    description: 'The fold''s surface reconstruction is no longer flat and per-run.
      It rebuilds the section-band -> card -> chip/control hierarchy the capture composited
      onto runs: full-width no-treatment runs seed section BANDS which tile full-bleed
      and whose tops snap up / bottoms clamp down to a real captured section edge
      (never crossing the neighbouring band''s content); a full-bleed BAR (footer/nav
      — same-fill distributed runs whose union spans content width with a dominant
      internal gap) folds as a band rather than tiny cards, while an evenly-tiled
      card grid stays cards; distinct-surface runs fold into CARDS that take the captured
      SurfaceShape rect and radius verbatim (cardPadding/cardOutset deleted — where
      no surface shape was captured a card is exactly its runs'' union and nothing
      is invented), with a viewport-wide surface refused as a card because it is the
      band; a run whose own element paints its surface folds as a CHIP (saturated
      pill radius, or an authored vertical inset on a padded control) carrying surfaceFill/radius/shadow/border
      on the text leaf and contributing no card row, so a pill is never duplicated
      by a box behind it; a card''s per-EDGE outset comes from that edge''s own captured
      padding rather than a scalar vertical sum applied on all four sides; an accent
      rule is drawn on the captured accentBox (the bearing wrapper), not on the run
      it insets. Section imagery and veils fold too: a band''s CSS background-image
      becomes a box carrying backgroundImageUrl painted beneath all content (unsafe
      schemes dropped, so no box is emitted for them), and a section folds when it
      paints an image OR a scrim, carrying axes.overlay.'
    justification: 'AC-731 already states that run-composited surfaces are reconstructed
      as a page background band plus backing box leaves — this is the same capability
      bucket, corrected and deepened (measured rects instead of inferred padding,
      a three-level hierarchy instead of one band plus per-run boxes). No new bucket:
      the fold still emits box leaves for painted surfaces; only the reconstruction
      rule changed. Extending AC-730/731 in place is exactly the reuse-first case.'
    story_uid: story-8acc338d
    target_story_ids:
    - story-8acc338d
    intent_delta_summary: STORY-84's surface reconstruction moves from 'the dominant
      band plus one backing box per run' to a measured section-band -> card -> chip
      hierarchy sourced from the capture's own surface rects, plus section background
      images and scrims; and its residual guarantee is narrowed because captured form
      controls now fold to a behaviour seam (item 7) rather than always to a residual.
    acceptance_criteria_changes:
      add:
      - Full-width same-fill runs group into section bands that tile full-bleed, with
        tops and bottoms snapped to real captured section edges and never crossing
        the neighbouring band's content
      - A full-bleed bar (distributed runs spanning content width with a dominant
        internal gap) folds as a band; an evenly-tiled card grid stays separate cards
      - A card adopts the captured surface rect and radius; with no captured surface
        shape a card is exactly its runs' union and no padding is invented; a viewport-wide
        surface is refused as a card
      - A run whose own element paints its surface (saturated pill radius, or an authored
        vertical inset on a padded control) folds its surface onto the text leaf and
        contributes no card row
      - Where an outset is still required it is taken per edge from that edge's own
        captured padding, never a vertical sum applied horizontally
      - An accent rule is folded onto the bearing element's rect, not the run it insets
      - A section's CSS background image folds to a box painted beneath all content,
        and a section folds when it paints an image or a translucent scrim (overlay
        carried as a typed axis)
      modify:
      - AC-731 (run-composited surfaces reconstructed as a page background band plus
        backing boxes) — restated as the section-band -> card -> chip hierarchy built
        from measured surface rects; a run sitting on its own band emits no box
      - AC-733 (no captured element silently dropped; a form control ALWAYS becomes
        a residual) — the residual guarantee holds for everything the fold cannot
        express, but a captured control cluster is now a behaviour seam (item 7),
        so it is no longer a residual
      - 'AC-730 (a text-free element that paints a standalone surface folds to a box
        leaf) — extended to unsafe-scheme background URLs: no section-background box
        is emitted for one'
      remove: []
  - index: 3
    component: L1 layout substrate — typed axes, envelope bounds, safe renderer
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'The L1 language grows the typed primitives a real captured page
      needs, each bounded by the envelope and emitted only through the safe sink:
      node-level `padding` (per-side, non-negative, bounded 0..10000) emitted as longhands
      inside the existing border-box reset so it insets content within the pinned
      keyframe box rather than inflating geometry; per-width `responsive` scalar tracks
      for fontSizePx / lineHeightPx / letterSpacingPx and `responsivePadding` tracks
      per side, emitted as media-queried CSS with the smallest keyframe as the base
      and requiring on-ladder widths; a `borderLeft` box axis (a left rule, not a
      full outline); text-leaf self-surface axes (surfaceFill / borderRadiusPx / boxShadow
      / border) bounded exactly as the box axes, with a glyph gradient still winning
      the background-image slot; `nowrapFromPx` — a WIDTH, not a flag — restating
      the reference''s own line count; `geometry.viewportResponse` (yFactor / heightFactor
      applied against each keyframe''s own atHeight) expressing viewport-relative
      extent as a derivative; and `document.column` + `geometry.anchor` expressing
      `mx-auto max-w-*` in closed form, with x and width fitted and suppressed INDEPENDENTLY,
      a capped column term (min(maxPx, px + fraction*extent)) for a nested max-w-*,
      an `x.pxTrack` inheriting the node''s geometry segments for layout-mode changes,
      and a refusal to anchor a full-bleed band. Renderer correctness: a compound
      anchor expression is always wrapped in calc(), because `left: max(...) + 24px`
      is not a legal bare value and was being dropped, slamming every anchored node
      to x=0.'
    justification: This is CAP-70's own bucket — the typed axis vocabulary, the envelope
      that bounds it, and the single safe renderer that emits it. AC-725/726/686 already
      state the pattern (typed pixel-mover axes render as CSS re-derived from their
      fields; malformed and out-of-range documents are rejected); these are new axis
      families inside that same contract, added in L1 per the project rule rather
      than as raw-CSS holes or new modules. No new capability bucket.
    story_uid: null
    target_story_ids:
    - story-d0a8cfad
    intent_delta_summary: STORY-83's axis vocabulary and envelope grow to cover padding,
      per-width scalar/padding tracks, a left accent rule, self-painted text surfaces,
      an unbreakable-from width, viewport-height response, and the centred-column
      anchor; and AC-723 is narrowed because a bound slot now renders the mounted
      module fragment (item 7) rather than always an inert placeholder.
    acceptance_criteria_changes:
      add:
      - A per-side padding axis validates, bounds and renders as longhands inside
        the border-box reset, insetting content without inflating the pinned box
      - A numeric type axis that varies across the ladder carries a per-width track
        rendered as media-queried CSS; a static axis stays a scalar; keyframe widths
        must be on the ladder
      - Text leaves carry a self-painted surface (fill, radius, shadow, border) under
        the same envelope bounds as box axes, with a glyph gradient taking precedence
        in the background-image slot
      - A box carries a typed left accent rule distinct from a full border
      - nowrapFromPx makes a run unbreakable from a stated width upward, and is a
        width rather than a flag
      - Viewport-height response is carried as a typed derivative resolved against
        each keyframe's own capture height, so a keyframe still evaluates to its captured
        pixels at capture size
      - A document-level centred column plus a per-node anchor place x and width independently
        in closed form, including a capped column term and an in-column offset track;
        a full-bleed band is never anchored
      - Every compound anchor expression is emitted wrapped in calc(), so no anchored
        declaration is dropped as invalid
      modify:
      - AC-725 (typed pixel-mover axes render as CSS re-derived from their typed fields)
        — extended to the padding, track, accent, self-surface, viewport-response
        and anchor families
      - 'AC-726 / AC-686 (malformed / out-of-range / freeform documents rejected)
        — extended to the new axes: non-negative bounded padding, bounded track keyframes
        on ladder widths, bounded font weights and effect lengths'
      - AC-723 (a slot leaf renders as an inert placeholder naming its behavior module)
        — the inert placeholder is now the UNBOUND case; a slot bound to a module
        instance renders that module's fragment in the same positioned box (item 7)
      remove: []
  - index: 4
    component: Capture-to-L1 fold — responsive, viewport-relative and column-anchored
      fitting
    item_type: upgrade
    story_points: 3
    dependencies:
    - 1
    - 3
    description: 'The fold stops pinning everything to the widest sample and fits
      the responsive model from the ladder: a numeric type axis (font size, line height,
      letter spacing) and each padding side earn a per-width track only when they
      actually vary; a TEXT leaf ceils its width so a shrink-to-fit box can never
      be pinned below its own measured glyph extent (box and image leaves keep nearest
      rounding so a surface cannot creep outward); a run''s nowrap threshold is the
      smallest captured width whose entire suffix is single-line, so it never claims
      more than the reference showed; the height probe is read as EVIDENCE to fit
      a viewport-height response (a hero''s heightFactor and every node below it carrying
      the matching yFactor, bands taking their response from section edges rather
      than their runs) while never being read as a ladder cell; and the centred column
      is recovered from where content actually sits (fitted from the MODAL content
      edge, over-determined for capped fits, every fraction bounded, rejected outright
      unless it reproduces every sample) with each node''s x and width anchored independently
      against it.'
    justification: 'Same bucket as item 2 — CAP-71''s fold — but a distinct, separately-sized
      capability: how the fold FITS a responsive/viewport-relative model across the
      ladder, as opposed to how it reconstructs surfaces. AC-691/692/693 already own
      the keyframe/interpolate/visibility model; this extends that model to per-axis
      tracks, viewport height, and the column. It is split from item 2 purely on size:
      combined they exceed 3 points.'
    story_uid: null
    target_story_ids:
    - story-8acc338d
    intent_delta_summary: STORY-84's per-width model widens from geometry keyframes
      alone to per-axis responsive tracks, viewport-height response fitted from a
      height probe, and closed-form column anchoring — with a text leaf's own glyph
      extent as a hard floor on its pinned width.
    acceptance_criteria_changes:
      add:
      - A numeric type axis and each padding side fold to a per-width track only when
        they vary across the ladder; an invariant axis stays a scalar
      - A text leaf's folded width is never below its own measured glyph extent (ceil),
        while box and image leaves keep nearest rounding
      - A run's nowrap threshold is the smallest captured width whose whole suffix
        is single-line
      - A viewport-height response is fitted only from a height probe — never guessed
        from a width correlation — and is expressed as a hero's height factor with
        a matching y factor on everything below it
      - A centred column is fitted from the modal content edge and rejected unless
        it reproduces every sample; a page with no centred column keeps its keyframes
        untouched
      - A node anchors x and width independently, with a capped term for a nested
        max-width and an in-column offset track where the layout mode changes
      modify:
      - AC-691 (each folded node carries a geometry keyframe per sampled width matching
        the captured box) — a keyframe may now be expressed against the document column
        or a viewport-height response instead of an absolute value, and still resolves
        to the captured box at every sampled width
      remove: []
  - index: 5
    component: 1c values-diff — reading an L1 reproduction honestly
    item_type: upgrade
    story_points: 3
    dependencies:
    - 1
    description: 'values-diff is usable as an L1 reproduction scoreboard. The band
      scan (top-level body children >= 8px tall) found nothing on the renderer''s
      flat tree of absolutely-positioned leaves — the wrapper collapses to height
      0 — so every reference element read ''missing (present -> absent)'' and the
      scoreboard froze byte-identical across totally different renders; it now falls
      back to one body-spanning band when the scan finds nothing yet the body still
      paints, leaving semantic sites untouched. Surface axes resolve against the box
      that actually paints them: where the reference represents a control as ONE node
      and the fold as a text leaf plus a sibling backing box, radius / shadow / border
      — and the surface''s GEOMETRY — compare against the bearing box, scoped by the
      capture''s `self` flag so self-painting chips and ordinary band runs are unaffected;
      and the same geometric (containing-box, tightest-first) resolution replaces
      the parentElement walk for surfaceFill / borderLeft / surfaceGradient, which
      had produced ~60 phantom defects (some reported reversed) on pixels that were
      already correct. A saturated pill radius is no longer compared as a magnitude
      (rounded-full computes to 33554400px against our clamped 100000px — identical
      pixels); a pill flattened to a square, a shadow delta and non-pill radius drift
      all still flag. The height probe no longer collides with the ladder cell it
      re-shoots: the first projection at an (engine, width, state) key is the ladder,
      later ones are evidence, so the diff neither overwrites 1280''s reproduction
      with the taller render nor emits a duplicate 1280 cell. Behavioural field facts
      (controlType, formAction) are ignored by the diff because they paint nothing.'
    justification: 'CAP-63 / STORY-75 is exactly this bucket — capture blind spots
      that made values-diff report a defect where there is none, or stay silent where
      there is one. These are more instances of the same contract (a matched axis
      is not proof; a mismatched axis can actively misdirect), not a new capability.
      Reuse-first: extend the existing story rather than open a parallel diff story.'
    story_uid: null
    target_story_ids:
    - story-d5de22a5
    intent_delta_summary: 'STORY-75 widens from ''capture blind spots on a conventionally-nested
      page'' to ''the diff is trustworthy when one side is a flat, absolutely-positioned
      L1 reproduction'': DOM segmentation, node-identity across split controls, surface
      attribution by geometry, saturated-radius desaturation, and probe-vs-ladder
      partitioning.'
    acceptance_criteria_changes:
      add:
      - A flat, absolutely-positioned L1 render is segmented for comparison (body-spanning
        fallback band) so the manifest is populated and the diff moves when the render
        changes; a semantic site's segmentation is unchanged
      - A control the reference carries as one node and the reproduction as a text
        leaf plus a bearing box compares its radius, shadow, border and surface geometry
        against the bearing box
      - Surface fill / accent / gradient are attributed to the painted boxes containing
        a run, tightest first, so a sibling-painted reproduction reports no phantom
        deltas and a nested reference is unchanged
      - A radius saturated at half the painted height is compared as a pill rather
        than a magnitude; a flattened pill, a shadow delta and non-pill radius drift
        still flag
      - 'A second projection at an already-seen (engine, width, state) key is evidence,
        not a ladder cell: no duplicate cell and no overwritten reproduction'
      - Behavioural control facts (control type, form action) are excluded from the
        painted comparison
      modify:
      - AC-631 (surface fill compared as the effective alpha-composited colour) —
        the surface is now resolved geometrically rather than by DOM ancestry, and
        a captured colour with alpha is read losslessly
      - AC-633 (duplicate text paired by nearest rendered position) — pairing is stated
        against the flat L1 shape as well as the reference shape
      remove: []
  - index: 6
    component: 3-probe reproduction gate — responsive resolution and mounted regions
    item_type: upgrade
    story_points: 2
    dependencies:
    - 3
    - 4
    description: 'The analytic gate learns the shapes the fold now emits. The evaluator
      mirrors the renderer''s responsive scalar cascade (evalScalarTrack) so a round-trip
      expectation resolves per viewport instead of reporting a phantom desktop-at-mobile
      delta. Oracle rows apply the shared partition rule — the first projection at
      a key defines the ladder, later ones are evidence — because a second full set
      of 1280 oracle rows drained the per-(key, width) FIFO leaf queue and reported
      every text run on the page as an unmatched coverage gap, failing a reproduction
      that had not changed. And oracle text covered by a behaviour slot is set ASIDE
      and COUNTED (surfaced on the gate line) rather than graded or silently dropped:
      grading markup L1 no longer emits fails a correct reproduction, while dropping
      it quietly turns every mounted region into an ungraded hole.'
    justification: CAP-73 / STORY-86 owns the probes, the analytic evaluator and the
      gate's reporting channels (AC-705, AC-724, AC-737 already state the fidelity
      pairing and the residual channels). These are corrections and extensions to
      that same evaluator and its reporting, not a new gate. No new capability bucket.
    story_uid: null
    target_story_ids:
    - story-24098299
    intent_delta_summary: STORY-86's evaluator and sample-fidelity probe are extended
      to responsive scalar tracks, to a ladder/evidence partition over repeated projections,
      and to a third reporting class — oracle text a mounted behaviour covers, set
      aside and counted rather than graded or dropped.
    acceptance_criteria_changes:
      add:
      - The analytic evaluator resolves a responsive scalar track exactly as the renderer's
        cascade does, so a round-trip expectation is per-viewport
      - Repeated projections at one (key, width) are partitioned into ladder and evidence,
        so a height probe cannot drain the oracle queues and report the whole page
        as unmatched
      - Oracle text covered by a mounted behaviour slot is set aside and counted on
        the gate report, neither graded as a fidelity gap nor silently dropped
      modify:
      - AC-705 (sample-fidelity matches reproduced leaf boxes to the oracle at every
        captured width) — restated over the ladder projection only, with mounted regions
        excluded from the measure and reported separately
      remove: []
  - index: 7
    component: Page composition — behavior modules mounted into L1 slots
    item_type: feature
    story_points: 3
    dependencies:
    - 2
    - 3
    description: 'A page can be an L1 document PLUS the behaviours mounted into it.
      The strict XOR (''a page is either a module stack or a raw L1 document'') made
      the shape a real captured page has — 100% L1 layout plus one behaviour — unrepresentable,
      stranding the behavioural half of every reproduction as a residual. It is replaced
      by the narrower rule the XOR actually intended: modules may accompany l1 when
      each is bound BY NAME to a slot present in the L1 tree. The page validator resolves
      every binding and rejects, each with a machine-readable path: an unbound module
      (the XOR''s intent preserved), a slot naming a seam not in the tree, a seam
      bound by two modules, an orphan seam no module binds, a slot on a module when
      the page has no l1 at all, and a duplicate slot name (an ambiguous mount point).
      The fold clusters captured controls into the forms they visibly belong to (by
      form action where present, else rect proximity at the widest sample) and emits
      each group as a slot seam pinned at the group''s union rect across the ladder
      instead of a field residual; a captured button sitting within the same gap scale
      that separates fields WITHIN a form is lifted into that form''s submit seam,
      which grows to hold it. The renderer replaces the inert data-l1-slot placeholder
      with the bound module''s fragment inside the same positioned box, prefix-namespaced
      per instance. Conformance gains a mountInL1 fixture mode so a behaviour carries
      its five universal obligations in the position it actually ships in.'
    justification: No existing story covers page-level composition. STORY-83 states
      that a slot renders as an INERT placeholder (AC-723), STORY-85 covers a module's
      own contract and its L1-authored presentation slots (AC-698/701), and STORY-84
      states that a form control is ALWAYS a residual (AC-733) — the matrix currently
      asserts, in three places, that this capability does not exist. Binding a module
      instance to a seam inside the page body, validating that binding, folding to
      it and mounting into it is a genuinely new capability bucket that supersedes
      those three statements (each modified under items 2 and 3).
    story_uid: null
  - index: 8
    component: contact-form behavior module — reproducing captured labelling and the
      reference's own submit control
    item_type: upgrade
    story_points: 2
    dependencies:
    - 7
    description: 'The contact-form module stops overriding two facts the capture records.
      Labelling: the reference names its controls with a placeholder while the module
      rendered a visible <label> row above every field, which is not only the wrong
      look — each row pushes the field below it down, so the whole form drifts progressively
      (+25 / +44 / +63px down three fields). The a11y tree''s nameSource is the only
      witness (a label above the box and the same words inside it are both just text
      near a box), so it is carried as a typed labelMode dial through fold -> config
      -> render, with the <label> kept in the DOM and programmatically associated
      — the a11y obligation is moved out of flow, not traded away. Submit: when the
      reference''s own button is claimed into the form''s submit seam, the module
      surrenders its own paint so the authored chip is not nested inside a second,
      differently-coloured button. The trade is recorded: page-absolute keyframes
      are dropped on the way into the seam (they would resolve against the slot''s
      origin), so the button''s exact per-width position becomes flow-approximate
      within its seam — one working control instead of two, one of them inert.'
    justification: Per the project rule, a capability gap that fits an existing behavior
      module's purpose is closed by adding a dial / variant to that module — never
      a new module. CAP-72 / STORY-85 owns the behavior contract and the contact-form's
      L1-authored presentation slots (AC-701 already covers intro/submit presentation);
      labelMode is a new typed config field on that same contract and the submit surrender
      is a change to that same slot's rendering. No new capability bucket.
    story_uid: null
    target_story_ids:
    - story-179b8c06
    intent_delta_summary: STORY-85's contact-form contract gains a typed labelling
      mode driven by the captured a11y name source, and its submit slot surrenders
      the module's own paint when an authored chip is mounted — both stated as captured
      facts the module must not override.
    acceptance_criteria_changes:
      add:
      - A typed labelling mode renders the reference's placeholder-named controls
        without a visible label row, keeping the label in the DOM and programmatically
        associated
      - When an authored submit chip is mounted into the submit slot the module surrenders
        its own paint, so the chip is not nested inside a second button
      modify:
      - AC-701 (contact-form renders a functional form from config with L1-authored
        intro/submit presentation) — extended to a config-driven labelling mode and
        to a submit slot whose authored subtree replaces, rather than nests inside,
        the module's own button
      remove: []
  - index: 9
    component: 1c repro — importing a capture bundle as a self-contained servable
      site
    item_type: feature
    story_points: 3
    dependencies:
    - 7
    description: '`1c repro <slug> --ref <bundle>` writes a site whose home page IS
      the bundle''s folded L1 document and binds it to the bundle''s own bytes. Every
      media handle the fold transcribes is the absolute URL the original page served,
      so the reproduction previously hotlinked the target: it rendered only while
      that host was up, every shot/diff compared the target against a page serving
      the target''s own bytes (a hole in the gate, not just the output), and each
      render silently egressed to a third party. localizeAssets binds image src, box
      backgroundImageUrl and font-face src to the bundle''s origin->mirror map, normalising
      already-local handles to root-relative; an unmirrored absolute handle FAILS
      the import naming each one — a reproduction is self-contained or it does not
      exist, with no partial mode and no silent hotlink path — while mirrored image/font
      assets that no node references are reported as a fold gap (page subresources
      are excluded from that signal rather than reported as noise). The same fold
      that writes l1.json writes forms.json beside it so the two cannot disagree,
      and a part-stale bundle fails loudly instead of stranding; repro derives each
      mounted behaviour''s config from the capture ONLY — fields from the captured
      accessible name, role, control type and required flag, labelling mode from the
      captured name source, action from the captured form action, and an endpoint
      never seen is reported as a residual rather than invented.'
    justification: No story documents the operator-facing reproduction import. STORY-84
      owns the fold, STORY-86 owns the gate, and STORY-79 mentions `repro`/`l1-gate`
      only as commands that must boot quietly — nothing states that a reproduction
      must be self-contained, that an unmirrored handle is a hard failure, or that
      a mounted behaviour's config is derived from the capture and never invented.
      That self-containment property is what makes the perceptual gate measure the
      pipeline instead of the network, so it is a user-visible capability in its own
      right.
    story_uid: null
---

# Reconciliation Plan — BUNDLE-10

**Mode**: commits (23 free-coded commits, 2026-07-23 .. 2026-07-25)
**Anchor**: bundle-4ff83a8b (BUNDLE-10)
**Bundled intents (16)**: BUG-12, BUG-13, BUG-14, BUG-15, BUG-16, BUG-17, BUG-18, BUG-19, BUG-20, BUG-21, BUG-22, BUG-23, BUG-24, BUG-25, REQ-88, REQ-93

## Step 0 — Intent

The bundle is one campaign: **make the first real page (gigabytealchemy.ai) actually reproduce**, and close every capability gap that campaign exposed. REQ-88 is the umbrella (10 recorded rounds, each measured against the live target); the BUG-* tickets are the defects those rounds found; REQ-93 is REQ-88's declared successor, closing the page-shape XOR REQ-88 itself introduced.

The operator's stated method, visible throughout the ticket bodies, is: read the reproduction against the target, attribute each visible defect to a *layer* (capture / language / fold / renderer / scoreboard / gate), and close it there. Several tickets explicitly record a hypothesis that **did not hold** and the corrected cause (BUG-20's "ORIGINAL GUESS, CORRECTED BELOW"; BUG-24's "L1 cannot express alpha" -> the axis existed and was unreachable; REQ-88 round 5's "metric-level, unattributed" -> it was a 0.31px rounding-down). Where a gap could not be closed, it is named rather than hidden (REQ-96 for the leaf-control contract, REQ-94 for gate calibration, the submit button's traded per-width position).

Declared scope boundaries honoured by this plan:
- Capability gaps are closed **in L1** as typed primitives, never as raw-CSS holes or new modules (CLAUDE.md). Every new expressive power in this bundle is a typed axis with envelope bounds and a safe-sink emitter.
- Behaviour belongs to a vetted behavior module; the fold never synthesizes a raw `<input>` (DOC-25/26).
- Two gates, two concerns: `l1-gate` grades geometry and envelope only; appearance is `values-diff` + the perceptual `diff`.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commits on bundle-4ff83a8b (23 commits)"
  entry_files:
    - tools/generate/src/cli/capture/extract.ts
    - tools/generate/src/cli/capture/pipeline.ts
    - tools/generate/src/cli/capture/playwright-driver.ts
    - tools/generate/src/cli/capture/reextract.ts
    - tools/generate/src/cli/capture/theme.ts
    - tools/generate/src/cli/capture/sections.ts
    - tools/generate/src/cli/capture/types.ts
    - tools/generate/src/cli/capture/values-diff.ts
    - tools/generate/src/cli/repro.ts
    - tools/generate/src/cli/index.ts
    - tools/generate/src/l1/fold.ts
    - tools/generate/src/l1/forms.ts
    - tools/generate/src/l1/assets.ts
    - tools/generate/src/l1/probes.ts
    - tools/generate/src/l1/roundtrip.ts
    - tools/generate/src/conformance/harness.ts
    - packages/site-schema/src/l1/schema.ts
    - packages/site-schema/src/l1/validate.ts
    - packages/site-schema/src/l1/slots.ts
    - packages/site-schema/src/schema.ts
    - packages/framework/src/l1/render.ts
    - packages/framework/src/modules/contact-form/
  features:
    - name: "Capture: fonts as painted"
      description: "@font-face recovered from cached cross-origin stylesheet bytes and unioned with the same-origin CSSOM; the full font-family stack carried per run with primaryFamily derived once in theme.ts; a web-font barrier after settlePage plus a fontLoaded probe against the real painted face; offline re-extraction rewritten to the loopback mirror so it is self-contained."
      behaviors:
        - "a Google-Fonts family's woff2 reaches theme.fonts.files and the document resource table"
        - "a run carries 'Cinzel, serif', while the face table and load-check key on 'Cinzel'"
        - "rendered.html re-extracts identically offline; a .invalid src can only load via the served mirror"
      entry_point: "fontFacesFromStylesheets / fontFilesByFamilyOf / primaryFamily / reextract"
    - name: "Capture: who paints what"
      description: "surface axes resolved geometrically (containing boxes, tightest first); SurfaceShape (bearing box rect/radius/shadow/border + self flag); accentBox carried through the manifest projection; sections[].box always carried; scrim alpha read through the canvas probe."
      behaviors:
        - "a sibling-painted L1 reproduction attributes a run's fill to the card, not the body backstop"
        - "a split control's radius/shadow/geometry has a bearing box to compare against"
        - "a color-mix/oklab veil is captured as {color, opacity} instead of null"
      entry_point: "surfaceOf / accentBarOf / overlayOf / rgbaOf / rawRunToElement"
    - name: "Capture: per-run geometry and behavioural facts"
      description: "an element split into several runs gives each run its own Range-derived box and glyph box; a captured field carries controlType and formAction; a second-height probe viewport re-shoots one ladder width."
      behaviors:
        - "two lines of one <h1> fold to two stacked runs, not one overprint"
        - "line-count classification is per line, not per pair"
        - "100vh becomes identifiable as a finite difference rather than a width correlation"
      entry_point: "runsUnder / HEIGHT_PROBE_VIEWPORTS"
    - name: "Fold: surface hierarchy"
      description: "section bands (incl. full-bleed bars) tiled to captured section edges; cards taking the captured surface rect and radius; chips/padded controls painting their own surface; per-edge outsets; accent rules on the bearing rect; section background images and scrims."
      behaviors:
        - "a footer bar renders as one full-bleed navy band, not three tiny navy cards"
        - "sibling card tiles neither merge nor drift; a viewport-wide surface stays a band"
        - "a button is not outset by padding its own box already includes (2x height gone)"
      entry_point: "foldToL1 / buildSolidBands / buildCards / isSelfPaintingRun / foldSectionBackgrounds"
    - name: "Fold: responsive and viewport-relative fitting"
      description: "per-width type and padding tracks only where an axis varies; ceil'd text widths; nowrap thresholds; viewport-height response from the probe; column fit with per-axis anchoring."
      behaviors:
        - "font-size 72 at desktop / 36 at mobile instead of one desktop value everywhere"
        - "a shrink-to-fit run is never pinned below its own glyph extent (hero title stops wrapping)"
        - "left margin exact at 9 widths including off-sample and above-ladder"
      entry_point: "foldPadding / responsive tracks / fitColumn / fitAnchor / viewportResponse"
    - name: "L1 language + safe renderer"
      description: "padding, responsive scalar/padding tracks, borderLeft, text self-surface, nowrapFromPx, viewportResponse, document.column + geometry.anchor — each typed, envelope-bounded, and emitted only through the safe sink; compound anchor expressions wrapped in calc()."
      behaviors:
        - "an unknown key or out-of-range value is rejected, not ignored"
        - "padding insets inside the pinned keyframe box (border-box), so geometry is round-trip safe"
        - "an anchored node lands at its rule position instead of x=0"
      entry_point: "l1*Schema / validateL1 / renderL1Document"
    - name: "values-diff on an L1 reproduction"
      description: "flat-DOM band fallback; split-control surface resolution; geometric attribution; pill-radius desaturation; ladder-vs-evidence partitioning."
      behaviors:
        - "the scoreboard MOVES when the render changes instead of freezing at all-missing"
        - "the printed repair order no longer leads with a no-op phantom"
      entry_point: "EXTRACT_SCRIPT band scan / diffMultiState / partitionProbes"
    - name: "3-probe gate"
      description: "evaluator resolves scalar tracks; oracle rows partitioned; mounted oracle text set aside and counted."
      behaviors:
        - "gate PASS at 0 unmatched / 0 residuals on the real page"
        - "a mounted region is neither graded nor an invisible hole"
      entry_point: "evalScalarTrack / oracleBoxes / sampleFidelityProbe"
    - name: "Page composition (L1 + behaviours)"
      description: "module instances bound by name to slots in the page's L1 tree, validated exhaustively; controls clustered into forms and folded as seams; submit chip claimed; mounted at render; conformance run on the mounted shape."
      behaviors:
        - "unbound / dangling / double-bound / orphan / slot-without-l1 / ambiguous-name each fail with a machine-readable path"
        - "two forms on one page mount as contact-form@form-0 and @form-1; 0 field residuals"
      entry_point: "pageSchema.superRefine / l1SlotNames / foldedFormFor / renderL1Document / mountInL1"
    - name: "contact-form captured facts"
      description: "labelMode carried fold -> config -> render; the module surrenders its own submit paint to the authored chip."
      behaviors:
        - "placeholder-named controls render with no visible label row and no progressive drift"
        - "one working submit control instead of two, one inert"
      entry_point: "contact-form meta/index.astro"
    - name: "1c repro import"
      description: "asset handles bound to the bundle mirror; unmirrored handle fails the import; unreferenced mirrored assets reported; forms.json written by the same fold; config derived from the capture only."
      behaviors:
        - "the reproduction renders with the target host unreachable"
        - "an endpoint never seen is a residual, never invented"
      entry_point: "cmdRepro / localizeAssets / readCaptureAssets"
```

## Coverage Map

```yaml
coverage_map:
  - feature: "Capture recording contract (fonts, paint bearers, per-run geometry, control facts, height probe)"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps:
      - "no AC states what a capture must RECORD; STORY-84 covers the fold that consumes it, STORY-75 the comparison of it"
    notes:
      - "judgment call: made a feature rather than a third upgrade of STORY-84 — the recording contract feeds three consumers and is a distinct surface (extract/driver/reextract/pipeline/theme)"
  - feature: "Fold surface hierarchy (bands, bars, cards, chips, controls, accents, section imagery, scrims)"
    status: partial
    existing_stories: ["story-8acc338d"]
    existing_acs: ["AC-730", "AC-731", "AC-733"]
    gaps:
      - "AC-731 describes one dominant band plus a backing box per run — superseded by the measured three-level hierarchy"
      - "nothing covers full-bleed bars, chip self-surfaces, per-edge outsets, accent bearers, section scrims"
  - feature: "Fold responsive / viewport-relative / column fitting"
    status: partial
    existing_stories: ["story-8acc338d"]
    existing_acs: ["AC-691", "AC-692", "AC-693"]
    gaps:
      - "keyframes are geometry-only; nothing covers per-axis tracks, ceil'd extents, nowrap thresholds, viewport-height response or column anchoring"
  - feature: "L1 typed axes + envelope + renderer for the new families"
    status: partial
    existing_stories: ["story-d0a8cfad"]
    existing_acs: ["AC-725", "AC-726", "AC-686", "AC-683", "AC-723"]
    gaps:
      - "the axis table predates padding, responsive tracks, borderLeft, text self-surface, nowrapFromPx, viewportResponse, column/anchor"
      - "AC-723 asserts a slot is ALWAYS inert — now true only when unbound"
  - feature: "values-diff on a flat L1 reproduction"
    status: partial
    existing_stories: ["story-d5de22a5"]
    existing_acs: ["AC-631", "AC-632", "AC-633", "AC-713"]
    gaps:
      - "nothing covers segmenting a flat abs-positioned DOM, split-control node identity, geometric attribution, saturated-radius desaturation, probe partitioning"
  - feature: "3-probe gate: tracks, partition, mounted regions"
    status: partial
    existing_stories: ["story-24098299"]
    existing_acs: ["AC-705", "AC-724", "AC-737"]
    gaps:
      - "the evaluator does not resolve scalar tracks; oracle rows do not partition ladder vs evidence; mounted regions have no reporting class"
  - feature: "Page composition — modules bound to L1 slots"
    status: uncovered
    existing_stories: ["story-d0a8cfad", "story-179b8c06", "story-8acc338d"]
    existing_acs: ["AC-723", "AC-698", "AC-733"]
    gaps:
      - "the matrix currently asserts in three places that this capability does NOT exist (inert slot, presentation-only slots, control-always-residual)"
    notes:
      - "feature item 7 owns the new capability; the three contradicting ACs are modified under items 2 and 3"
  - feature: "contact-form labelling + submit adoption"
    status: partial
    existing_stories: ["story-179b8c06"]
    existing_acs: ["AC-701"]
    gaps:
      - "no dial for the captured a11y name source; no statement that the module surrenders its submit paint to an authored chip"
  - feature: "1c repro import (self-containment, forms.json, derived config)"
    status: uncovered
    existing_stories: ["story-e15a19ef"]
    existing_acs: ["AC-738"]
    gaps:
      - "STORY-79 mentions repro only as a command that must boot quietly; nothing covers what the import must produce"
  - feature: "1c repro / l1-gate CLI surface itself (04be895dc, already on main, pre-dates this bundle's commits)"
    status: partial
    existing_stories: ["story-e15a19ef"]
    existing_acs: ["AC-738", "AC-739"]
    notes:
      - "Step 3b Case 3: the command scaffolding landed before this bundle's commit window. Item 9 documents only the import behaviour this bundle's commits (BUG-23, REQ-93, REQ-88 round 9) actually deliver, not the command's argument surface."
```

## Plan Items

| # | Component | Type | Points | Deps | Target story | Description |
|---|-----------|------|--------|------|--------------|-------------|
| 1 | Capture recording contract | feature | 3 | - | (new, CAP-71) | Fonts as painted, who paints what, per-run geometry, behavioural control facts, height probe |
| 2 | Fold — surface hierarchy | upgrade | 3 | 1 | STORY-84 | Band -> card -> chip reconstruction from measured rects; section imagery and scrims |
| 3 | L1 language + envelope + renderer | upgrade | 3 | - | STORY-83 | padding, responsive tracks, borderLeft, text self-surface, nowrapFromPx, viewportResponse, column/anchor, calc() |
| 4 | Fold — responsive / viewport / column fitting | upgrade | 3 | 1, 3 | STORY-84 | Per-axis tracks, ceil'd extents, nowrap thresholds, height response, column fit + per-axis anchor |
| 5 | values-diff on an L1 reproduction | upgrade | 3 | 1 | STORY-75 | Flat-DOM segmentation, split-control identity, geometric attribution, pill desaturation, probe partition |
| 6 | 3-probe gate | upgrade | 2 | 3, 4 | STORY-86 | evalScalarTrack, ladder/evidence partition, mounted regions set aside and counted |
| 7 | Page composition (L1 + behaviours) | feature | 3 | 2, 3 | (new, CAP-72/CAP-70 seam) | Slot binding validated, controls folded to seams, submit claimed, mounted at render, conformance |
| 8 | contact-form captured facts | upgrade | 2 | 7 | STORY-85 | labelMode dial; module surrenders its submit paint to the authored chip |
| 9 | 1c repro import | feature | 3 | 7 | (new, CAP-71/CAP-73 seam) | Self-contained assets or hard failure; forms.json; config derived from capture only |

**Totals**: 9 items — 3 feature, 6 upgrade — 25 story points.

## Commit -> item attribution

| Commit | Intent | Item(s) |
|---|---|---|
| 049d5960 | BUG-12 | 1 |
| a389b4ac | BUG-13 | 2 |
| 7b1f3512 | BUG-14 | 2, 3 (borderLeft axis) |
| d99396af | BUG-15 | 5 |
| 47facbfd | BUG-16 | 1 |
| 7317a149 | BUG-17 | 3, 4 |
| 11161056 | BUG-18 | 3, 4, 6 (evaluator) |
| 638cd403 | BUG-19 | 2 |
| e90be7e1 | BUG-20 | 3 (text self-surface), 2 (chip fold), 5 (pill desaturation) |
| 96540eaa, 79990228 | REQ-88 (font stack, geometric attribution, band edges) | 1, 2, 5 |
| ff0f8b1b | BUG-23 | 9 |
| 1e1ecc23 | BUG-21 | 2 |
| e5406112 | BUG-22 | 1 (SurfaceShape), 5 (split-control diff) |
| 04e0aef9 | BUG-24 | 1 (scrim capture), 2 (scrim fold) |
| f272c3c1 | REQ-88 round 5 | 2 (surface rect), 1 (face binding) |
| f44b5c6c | REQ-88 round 5 follow-up | 4 (ceil) |
| 1084dce0 | REQ-88 round 6 | 1 (accentBox, height probe), 3 (axes), 4 (fitting), 5 |
| c888317d | REQ-88 round 7 | 5, 6 (partition), 1 (accentBox projection) |
| a218f14f | REQ-88 round 8 | 3 (per-axis anchor, calc()), 4 (fit) |
| 14f94bb9 | REQ-93 | 7, 1 (controlType/formAction), 9 (forms.json/config), 5 (diff ignores behavioural fields) |
| 10bfa06f | BUG-25 | 1 |
| 3960a32c | REQ-88 round 9 | 8, 7 (submit seam), 6 (mounted set-aside), 9 (labelMode in config) |

## Observations

- **Three features, six upgrades.** The reuse-first bias was applied: every behaviour that extends an existing capability bucket is an upgrade of the story that owns that bucket. The three features are cases where the matrix is not merely thin but *contradicts* the code: page composition is asserted impossible in three separate ACs (inert slot, presentation-only slots, control-always-residual); the capture's recording contract has no owning story at all; and the reproduction import's self-containment property — the thing that makes the perceptual gate measure the pipeline instead of the network — is stated nowhere.
- **STORY-84 is targeted by two upgrade items (2 and 4).** Combined they exceed 3 points by a wide margin (roughly 1,400 changed lines in `fold.ts` alone across the bundle), so they are split on the natural seam the code already has: reconstructing surfaces vs fitting the responsive model. Item 4 depends on item 3 because the axes it populates must exist first.
- **Judgment call on item 1.** The alternative was a third STORY-84 upgrade. The capture's recording contract was made its own story because it feeds the fold, values-diff and the gate independently — folding it into the fold's story would make the same facts un-findable from the other two consumers, and STORY-84's own scope statement is explicitly "the fold".
- **Supersession is explicit, not silent.** Items 2 and 3 carry `modify` entries for AC-731, AC-733, AC-730 and AC-723 precisely because item 7's capability makes the current wording false. A reviewer should read items 2, 3 and 7 together.
- **Deliberate residuals are documented as intent, not gaps.** The bundle knowingly leaves: the submit button's exact per-width position (traded for one working control, handed to REQ-96); the color-mix wide-gamut serialization falling back to the pixel probe (bounded at <=1 level per channel and self-cancelling across both diff sides); and BUG-20's borderLeft x20 / surfaceGradient x3, measured as an attribution artifact between two visually equivalent DOM shapes rather than a paint gap. These are stated in the plan items' descriptions so the ACs generated downstream do not over-claim.
- **Step 3b, Case 3 — code outside the bundle's intent.** `1c repro` / `1c l1-gate` were introduced by 04be895dc (2026-07-22), which is already on `main` and is **not** in this bundle's commit window. REQ-88's ticket body does declare that pipeline, so item 9 is legitimate scope — but it is deliberately scoped to the *import behaviour* this bundle's commits deliver (asset localization, forms.json, derived config), not to the commands' argument surface, which belongs to whatever intent owns 04be895dc.
- **Two intents in the bundle are visibly cross-cutting.** REQ-88 spans ten rounds and touches every layer; REQ-93 spans schema, fold, repro, render and conformance. Neither maps to one story, which is why the decomposition is by capability layer rather than by ticket.
- **FC tests: the reported list was empty, but 21 FC suites exist on disk.** The prompt's `fc_tests` list came back `[]` because the scan looks for `test_UAT_FC_<TICKET>_*.py`; this is a TypeScript project and the suites are `.ts` (`tests/bug12-…` through `tests/bug25-…`, plus `req88-surface-attribution`, `req88-surface-shape-and-fontface`, `req88-viewport-relative-and-nowrap`, `req88-nowrap-x-browser`, `req88-form-labelling-and-submit`, `req88-l1-repro-pipeline`, `req93-l1-slot-mounted-behaviors`). They are treated as binding evidence: the commit→item attribution table above maps every one of them to a plan item, so no FC suite is left without an AC to be renamed onto.