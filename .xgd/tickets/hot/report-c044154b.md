---
uid: report-c044154b
id: REPORT-604
type: report
title: 'Reconciliation Plan: gigabytealchemy repro capabilities (REQ-58/59/61/62)'
created_by: xgd
created_at: '2026-07-19T02:14:24.621932+00:00'
updated_at: '2026-07-19T02:51:54.322037+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-ab9e0cb6
  anchor_uid: bundle-ab9e0cb6
  items:
  - index: 1
    component: 1c capture / values-diff — capture axes & pairing fidelity
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'The 1c capture+values-diff pipeline gains several new captured-and-compared
      axes that close blind spots so ''0 value-diffs'' means pixel-faithful: (a) a
      tight rendered-text-box axis measuring a run''s real glyph extent via Range.getBoundingClientRect,
      compared as a ratio (default 1.2%), catching rendered size/tracking/weight-fallback
      drift that computed fontSizePx/weight miss; (b) alpha-composited surfaceFill
      — rgbaOf preserves alpha and surfaceFillOf composites each ancestor fill (Porter-Duff
      over) until opaque, reporting the effective rendered colour instead of a translucent
      card reading as #ffffff; (c) a box-border axis — boxBorderOf reads an element''s
      uniform box border (width+colour, distinct from the asymmetric accent bar),
      threaded through Field/ValueElement.border and compared as a MEDIUM delta; (d)
      duplicate-text pairing by nearest rendered box centre instead of document-order
      FIFO, so repeated strings (''checkmark'', ''Read more'', a duplicated nav label)
      no longer cross-pair across containers and report false swaps.'
    justification: No existing story covers this behavior — the capability matrix
      is empty. Commits 80f356ab (rendered-text-box axis), 7588aa9a (alpha compositing),
      fe875baa (box-border axis), 6543bc60 (duplicate-text pairing) each add a user-observable
      diff axis or fix a diff-correctness bug with no matrix entry.
    story_uid: story-d5de22a5
  - index: 2
    component: 1c gradient fidelity — capture, author & diff gradients
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'Gradients become a first-class captured, authorable, and diffable
      value. (REQ-59) Text-fill gradient stops now record their position offsets:
      normalizeGradient parses each stop''s ''... 60%'' offset so TextGradient.stops
      is a GradientStop[] ({color, position|null}); values-diff compares stop positions
      within a ±2% tolerance (gradientPositionTolerancePct), flagging a position-only
      mismatch (the ''orange too soon'' wordmark drift) that previously passed clean,
      while positionless stops fall back to colour-only so no false deltas. (REQ-62)
      Panel/surface background gradients are captured (surfaceGradientOf reads the
      nearest painting ancestor''s background-image gradient, skipping background-clip:text,
      alongside the composited solid surfaceFill), diffed (new surfaceGradient axis
      reusing normalizeGradient/gradientsMatch, flagging a missing panel gradient),
      and authored (a standalone ''gradient'' content-field type + resolveSurfaceGradient;
      text-block gains a panelGradient field painting a padded/rounded panel with
      absolute-or-overlay stops).'
    justification: No existing story covers this behavior. Commits 064ee3a (REQ-59
      stop positions) and 3c5d60d (REQ-62 gradient panel capture+author+diff) deliver
      a coherent gradient-as-value capability bucket with no matrix entry.
    story_uid: story-82eb6908
  - index: 3
    component: 1c diff — size-aware diffing across the viewport ladder
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'Both diff commands gain a --size mobile|tablet|desktop selector
      (default preserves the single-width desktop path). For values-diff, the reference
      side is read from the persisted viewport ladder (multistate.json) at the chosen
      width and the actual side is rendered at that viewport, so a %-vs-fixed reflow
      that only shows at a narrow width is compared like-for-like; a stale (no-ladder)
      bundle or an un-captured width terminal-fails loudly instead of silently comparing
      at the wrong width. For the pixel diff, the actual side is shot at the chosen
      viewport and paired against a same-width screenshot-<width>.png rather than
      the desktop shot. Capture support: captureLadderScreenshots shoots a full-page
      screenshot at each ladder width, written as screenshot-<width>.png siblings
      (a separate pass so the JSON matrix stays byte-free), with readLadderScreenshotPath
      resolving a width or returning null so a miss fails loudly.'
    justification: No existing story covers this behavior. Commits c74a0fcb (--size
      values-diff), 32ae6eef (ladder screenshots), b01970c3 (--size pixel diff) add
      a user-facing size dimension to both diff commands with no matrix entry.
    story_uid: story-16f2793c
  - index: 4
    component: 1c responsive-diff — N-way cross-size analysis + change classifier
    item_type: feature
    story_points: 3
    dependencies:
    - 3
    description: 'A new standalone command that analyzes ONE captured site across
      sizes (not a reproduction comparison). It reads the persisted ladder''s per-width
      manifests and lines up nodes into an N-way table — one row per DOM node, one
      column per size (default mobile,tablet,desktop, selectable via --sizes) — so
      a font step, a reflow, or a component that departs on mobile reads left-to-right;
      nodes align by join key (normalized text, or role for text-free) in document
      order, mirroring values-diff pairing, and it terminal-fails on a stale or un-captured
      width. With --classify, classifyResponsiveTable labels each changed node by
      its reproduction move: presence-flip (per-breakpoint visibility, dominant when
      a node appears/departs), layout-swap (module-internal row/stack or nav/hamburger
      arrangement flip), or value-step (per-breakpoint value override), grouped structural-moves-first.'
    justification: No existing story covers this behavior. Commits b92a5cbe (N-way
      table, Phase 1) and cb388975 (classifier, Phase 2) introduce a genuinely new
      CLI command with no matrix entry.
    story_uid: story-2c7069fe
  - index: 5
    component: 1c CLI — flag parsing & --json stdout hygiene
    item_type: feature
    story_points: 1
    dependencies: []
    description: 'Two CLI-correctness guarantees. (a) --multi-viewport is registered
      as a boolean flag so ''values-diff --multi-viewport <slug>'' no longer consumes
      the slug as the flag''s value; the slug survives as a positional in either flag
      order. (b) --json output is clean, parseable JSON: render-time Astro/Vite chatter
      is wrapped in withCleanStdout (aliases stdout->stderr for the render then restores),
      and a one-time Astro ''Missing pages directory'' WARN routed to stdout during
      createServer bootstrap is diverted to stderr in bin/1c.mjs, so diagnostics land
      on stderr and stdout carries only the command''s document.'
    justification: No existing story covers this behavior. Commits 4f681c73 (boolean
      flag) and a4323720 (--json stdout hygiene) fix user-observable CLI behavior
      (arg parsing correctness, scriptable JSON output) with no matrix entry.
    story_uid: null
  - index: 6
    component: Framework — absolute-or-overlay value system (colour / length / radius)
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'Every value-typed dial accepts an absolute literal OR a named overlay
      (role/step/shape), the reproduction mandate ''absolute values are the base;
      a palette/step scale is a design overlay''. COLOUR: a schema type ''color''
      (validated literal-or-role) + exported resolveColor route card accent, per-card
      checkColor, footer link, and submit fill through per-instance CSS vars (--fc-accent/--fc-check/etc.),
      #hex or role. LENGTH: classifyLength/isLength (absolute px+physical / token
      / relative %/vw/em / content fit-content) + schema type ''length'' + validateLength;
      resolveStep resolves a named step to a token OR an absolute px verbatim, replacing
      per-step CSS classes with inline vars across spacingTop/Bottom, gap, logoSize,
      contentOffsetTop, contentInset, panelPad, contentWidth on all spacing-bearing
      modules (text-block, services-grid, contact-form, hero, header, footer). RADIUS:
      ctaShape and panelCorner resolve via resolveStep to inline --fc-cta-radius/--fc-panel-radius
      (named shape -> token, or absolute px). Same step/role values are byte-identical
      to prior behaviour; genuine modes stay enums.'
    justification: No existing story covers this behavior. Commits a50760a0 (colour
      escape hatch), 02ccf386 (length value model), b8c4d642 (spacing), 8d9ce579 (remaining
      length dials), 58be1d98 (radius dials) deliver one coherent value-model capability
      with no matrix entry.
    story_uid: null
  - index: 7
    component: Framework — per-breakpoint length dials + configurable nav collapse
    item_type: feature
    story_points: 3
    dependencies:
    - 6
    description: The absolute-or-overlay value model extended across the breakpoint
      dimension. A shared breakpoints.ts primitive (BREAKPOINTS/BREAKPOINT_PX/overrideChain
      + responsivePropertyRules, lifted out of layer.ts so the REQ-15 position model
      and the dial model share one 'override-and-up' vocabulary). A length dial may
      be a per-breakpoint object { base, sm?, md?, lg?, xl? }, each entry a scalar
      length (absolute px OR named step); responsiveStepVars emits base + per-breakpoint
      --fc-<key>-<bp> override vars through the same resolveStep seam, and responsiveContainerWidthVars
      is the cap sibling (contentWidth can mean 'no cap'). Rolled to every length
      dial the audit enumerated (spacing on services-grid/header/hero/footer/contact-form,
      gap, logoSize, contentOffsetTop/contentInset, panelPad, contentWidth) with scoped
      media-query override chains; scalar dials remain byte-identical. Plus a navCollapse
      dial (sm/md/lg/xl/none, default md) replacing the hardcoded 768px hamburger
      collapse — a named overlay because media-query thresholds can't read a custom
      property.
    justification: No existing story covers this behavior. Commits 0c485b20 (shared
      breakpoint primitive + resolver), 687a0cfd (rollout to all length dials), a92e9022
      (per-breakpoint contentWidth), 7e1649b6 (nav collapse) deliver the per-breakpoint
      value capability with no matrix entry.
    story_uid: null
  - index: 8
    component: Framework — reproduction treatments (services-grid / contact-form /
      footer)
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'New module authoring treatments that faithful reproduction forced.
      services-grid: cardVeil (none, or an opacity percentage painting rgba(255,255,255,.NN)
      over the band so translucent cards composite to the correct tint) and cardBorder
      (default | none — none zeroes the base 1px hairline but re-asserts a has-accent
      card''s 4px left bar). contact-form: fieldLabels (above default | placeholder
      — placeholder moves each label into the input placeholder and visually hides
      the <label>, retained for a11y) and submitInline (single field + button on one
      row) + submitColor (absolute-or-overlay button fill). footer: a verbatim copyright
      override (absolute string) + textColor/linkColor escape hatches (absolute #hex
      OR role) so copyright and links inherit slate instead of the surface default.
      Note: an earlier text-block ''accent'' dial (fb42ac7a) was removed (49e03566)
      as broken and redundant — manifesto left-bars are authored with the existing
      ''> [!role]'' fc-callout syntax, not a new dial.'
    justification: No existing story covers this behavior. Commits fb42ac7a (fieldLabels;
      the accent half later removed by 49e03566), b80a92e4 (cardVeil), 366119fc (cardBorder),
      a5c295c4 (submitColor/submitInline + footer overrides), 80c4adb6 (footer textColor)
      add user-authorable module treatments with no matrix entry.
    story_uid: null
---

# Reconciliation Plan

**Mode**: commits
**Source**: bundle-ab9e0cb6 (REQ-58 gigabytealchemy pass-3 + REQ-59 gradient stop positions + REQ-61 responsive-diff + REQ-62 gradient panel)
**Anchor**: bundle-ab9e0cb6 (type: bundle) — subject_uid = bundle itself (case c)

The capability matrix is currently EMPTY (no capability or story tickets exist). Every behavior these commits implement is therefore uncovered, so all plan items are `feature`. No upgrade items and no `target_story_ids` apply.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commits on bundle-ab9e0cb6 (REQ-58/59/61/62)"
  entry_files:
    - "tools/generate/src/cli/capture/values-diff.ts"
    - "tools/generate/src/cli/capture/extract.ts"
    - "tools/generate/src/cli/fidelity.ts"
    - "tools/generate/src/cli/perceptual.ts"
    - "tools/generate/src/cli/responsive-diff.ts"
    - "tools/generate/src/cli/args.ts"
    - "tools/generate/src/cli/stdio.ts"
    - "tools/generate/bin/1c.mjs"
    - "packages/framework/src/modules/dials.ts"
    - "packages/framework/src/modules/breakpoints.ts"
    - "packages/framework/src/modules/text-style.ts"
    - "packages/framework/src/modules/{services-grid,contact-form,footer,text-block,hero,header}/*"
  features:
    - name: "values-diff capture axes & pairing"
      behaviors: ["rendered-text-box ratio axis", "alpha-composited surfaceFill", "box-border axis", "duplicate-text pairing by nearest centre"]
    - name: "gradient fidelity"
      behaviors: ["text-fill stop positions (GradientStop[])", "position tolerance diff", "surfaceGradient capture", "surfaceGradient diff axis", "panelGradient authoring field"]
    - name: "size-aware diff"
      behaviors: ["--size on values-diff (ladder ref)", "--size on pixel diff (same-width screenshot)", "per-width ladder screenshots", "stale/uncaptured-width terminal-fail"]
    - name: "responsive-diff command"
      behaviors: ["N-way per-node table across sizes", "--sizes column selection", "--classify presence-flip/layout-swap/value-step"]
    - name: "CLI hygiene"
      behaviors: ["--multi-viewport boolean flag keeps slug", "--json clean stdout"]
    - name: "absolute-or-overlay value system"
      behaviors: ["colour literal-or-role (resolveColor)", "length model + resolveStep", "spacing/gap/logoSize/offset/inset/panelPad/contentWidth literals", "radius literals (ctaShape/panelCorner)"]
    - name: "per-breakpoint dials"
      behaviors: ["{base,sm,md,lg,xl} length objects", "responsiveStepVars override-and-up", "per-breakpoint contentWidth cap", "navCollapse breakpoint dial"]
    - name: "reproduction treatments"
      behaviors: ["cardVeil", "cardBorder", "fieldLabels=placeholder", "submitInline/submitColor", "footer copyright/textColor/linkColor"]
```

## Coverage Map

```yaml
coverage_map:
  - feature: "(all features above)"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps: ["capability matrix is empty — no capability/story tickets exist"]
    notes: ["all items classified feature; no upgrade candidates"]
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | capture/values-diff axes & pairing | feature | 3 | - | rendered-text-box, alpha surfaceFill, box-border, duplicate-text pairing |
| 2 | gradient fidelity (capture/author/diff) | feature | 3 | - | REQ-59 stop positions + REQ-62 panel gradient |
| 3 | size-aware diff across the ladder | feature | 3 | - | --size on both diff commands + ladder screenshots |
| 4 | responsive-diff command + classifier | feature | 3 | 3 | N-way table + presence/layout/value classifier |
| 5 | CLI flag & --json stdout hygiene | feature | 1 | - | --multi-viewport boolean; clean JSON stdout |
| 6 | absolute-or-overlay value system | feature | 3 | - | colour + length + radius literal-or-overlay |
| 7 | per-breakpoint dials + nav collapse | feature | 3 | 6 | {base,sm,md,lg,xl} lengths + navCollapse |
| 8 | reproduction module treatments | feature | 3 | - | cardVeil/cardBorder/fieldLabels/submit/footer |

## Observations

- **Empty matrix.** No capability or story tickets exist, so this is a greenfield reconciliation — 8 feature stories, 0 upgrades. If this bundle is reconciled alongside sibling bundles that also seed the matrix, some of these may later be candidates for consolidation, but nothing to upgrade exists today.
- **Coarse-grained grouping.** 29 commits collapse into 8 stories along capability-bucket lines, not per-commit or per-flag. Tooling axes (item 1), gradients (2), size-aware diff (3), responsive-diff (4), and CLI hygiene (5) are the 1c CLI surface; the value system (6), per-breakpoint (7), and module treatments (8) are the framework surface.
- **Added-then-removed capability.** The text-block `accent` dial (commit fb42ac7a) was removed by 49e03566 as broken+redundant; manifesto left-bars use the pre-existing `> [!role]` fc-callout syntax. No story documents a text-block accent dial — item 8 covers only the surviving contact-form fieldLabels half of fb42ac7a plus the later treatments.
- **Site-data commit excluded.** df70fcda (gigabytealchemy literal contentWidth 880px) is site authoring (storage/sites/...), ceremony-exempt per DOC-21, and documents no framework capability — no plan item.
- **Dependencies.** Item 4 (responsive-diff) reuses the ladder/screenshot + selectProjectionAtWidth machinery from item 3. Item 7 (per-breakpoint) generalizes the resolveStep seam and length model from item 6. All other items are independent.
- **Grounding.** Verified new entry points exist in-tree: resolveStep/resolveColor/classifyLength/resolveSurfaceGradient/responsiveStepVars/responsiveContainerWidthVars (dials.ts, text-style.ts), responsive-diff.ts, stdio.ts, breakpoints.ts, and the dials cardVeil/cardBorder/navCollapse/panelGradient/submitInline/submitColor/fieldLabels/checkColor/linkColor/copyright.