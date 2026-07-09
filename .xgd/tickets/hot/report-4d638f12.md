---
uid: report-4d638f12
id: REPORT-356
type: report
title: 'Reconciliation Plan: BUNDLE-3 (REQ-26/27/28/20/31/32/33/35/37/38 — import-fidelity
  primitives + vision tooling)'
created_by: xgd
created_at: '2026-07-09T21:51:41.494402+00:00'
updated_at: '2026-07-09T23:11:05.005889+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-adc60ee8
  anchor_uid: bundle-adc60ee8
  items:
  - index: 1
    component: Framework chrome modules + theme palette (hero / header / footer +
      palette roles + gradient treatment)
    item_type: upgrade
    story_points: 3
    dependencies: []
    target_story_ids:
    - story-a224111f
    description: 'Extends the chrome catalog and theme-token generation (STORY-55)
      with the art-direction dials and palette roles surfaced by the gigabytealchemy
      import. Hero gains headingTreatment (plain/accent/gold/gradient), height (auto/fold),
      markdown subhead, subheadColor, subheadSize, overlay scrim, and contentAnchor.
      Header gains align (left/center), logoSize (sm/md/lg/xl), roomier xl top spacing,
      and a tight-tracking / true-weight display wordmark (no faux-bold). Footer gains
      layout (center/spread). A generalized gradient text treatment carries a structured
      {direction, stops[]} (any of 8 directions, multi-stop, palette-role-backed)
      for header wordmark / hero heading, replacing the fixed vertical gold preset.
      Theme palette gains optional, defaulted roles: secondary, neutralCool, accentLight,
      accentDeep, accent-mid — all backfilled so existing 9-role themes keep validating.'
    justification: 'No new capability bucket: every behavior extends STORY-55''s existing
      chrome catalog (header/hero/footer are its declared modules) and its token-driven
      theme CSS (palette roles are new token slots emitted by the same generator,
      defaulted like every other slot). These are new dials/variants/roles on existing
      modules, not parallel modules or a new surface — matching CLAUDE.md''s generalize-first
      rule.'
    acceptance_criteria_changes:
      add:
      - hero exposes a headingTreatment dial (plain/accent/gold/gradient) setting
        heading colour independently of the surface text colour; gradient reads a
        structured {direction, stops[]} of palette roles.
      - hero exposes height (auto|fold — fold fills the viewport to the fold with
        content vertically centred), a markdown-rendered subhead, subheadColor (palette-role
        tint, default inherit), subheadSize (sm/md/lg), an overlay scrim dial, and
        a contentAnchor dial (top/center/bottom).
      - header exposes align (left/center), logoSize (sm/md/lg/xl), an xl top-spacing
        step, and a display-wordmark treatment with tight tracking and the display
        face's true weight (no synthesised faux-bold).
      - footer exposes a layout dial (center|spread) justifying copyright/links to
        opposite ends.
      - a gradient text treatment on header wordmark / hero heading computes a clipped
        linear-gradient from a structured {direction, stops[]} (8 principal directions,
        multi-stop, palette-role-backed), with the prior gold preset preserved.
      - the theme palette accepts optional secondary, neutralCool, accentLight, accentDeep
        and accent-mid roles, each emitted as a --color-<role> custom property and
        filled from defaults when omitted so pre-existing themes still validate.
      modify:
      - chrome-module description updated to note that header/hero/footer carry structured,
        token-backed art-direction dials (alignment, sizing, heading/wordmark treatment,
        scrim/anchor, footer layout) with no raw CSS in the site definition.
      remove: []
    intent_delta_summary: STORY-55 grows from 'token CSS + versioned chrome catalog'
      to also documenting the per-instance art-direction dials on hero/header/footer,
      a generalized multi-stop/any-direction gradient text treatment, and the expanded
      palette-role set — all structured, token-backed, backward-compatible.
    story_uid: story-a224111f
  - index: 2
    component: Framework content modules (services-grid / contact-form / text-block
      markdown) + module content-contract validation
    item_type: upgrade
    story_points: 3
    dependencies: []
    target_story_ids:
    - story-903e3e3a
    description: 'Extends the content-module catalog (STORY-56) with the card/form/prose
      treatments surfaced by the import, plus the generalized content-contract validation
      they depend on. services-grid gains structured per-card treatments — accent
      left border (palette role), status badge pill {label, variant}, ✓ checklist
      (rendered as real leading text runs keyed to the badge/status colour), a card
      surface field (default/muted), a stacked full-width variant, and a size dial
      + per-card size. contact-form gains a width dial (full/half) with consecutive
      half-width bands grouped side-by-side in a shared fc-row (ROW_CSS render-pipeline
      primitive), and a submitTreatment dial (primary/neutral) with font:inherit on
      the submit button. The shared markdown renderer gains GFM-alert callout left-bars
      (`> [!accent] …`) rendered as semantic left-bar callouts at medium (500) weight,
      and smartypants disabled so rendered text equals its verbatim source (straight
      quotes / -- preserved). The module content contract generalizes: ContentFieldSpec
      carries `values` (enum) and `itemSchema` (list/object), and validateModuleContent
      recurses into per-item object schemas enforcing required + enum to arbitrary
      depth with dotted/indexed error paths.'
    justification: 'No new capability bucket: services-grid, contact-form and text-block
      are STORY-56''s three declared content modules; every item here is a new dial/variant/structured
      content field on one of them, or a generalization of the shared module content-contract
      validator that already governs those modules'' content. No parallel modules
      or new surfaces are introduced (CLAUDE.md generalize-first). The content-contract
      recursion is deliberately module-agnostic but is driven by and reported under
      the content-module catalog.'
    acceptance_criteria_changes:
      add:
      - services-grid items accept structured accent (palette-role enum), badge {label
        required, variant enum}, checklist (list, max 8), and surface (default|muted)
        fields; the framework emits per-instance accent border-left, a top-right badge
        pill, and ✓ checklist items keyed to the status colour — untreated cards render
        exactly as before.
      - services-grid gains a stacked variant (full-width single column at every breakpoint)
        and a size dial + per-card size, consistent with hero/text-block size.
      - the ✓ checklist mark is a real leading text run (present in the DOM / a11y
        tree), not a ::before pseudo-element.
      - contact-form gains a width dial (full|half); consecutive half-width forms
        share one fc-row row so subscribe/contact sit side-by-side, via a ROW_CSS
        primitive wired into the theme.css assembly.
      - 'contact-form gains a submitTreatment dial (primary|neutral) and the submit
        button inherits the site font/size (font: inherit).'
      - the shared markdown renderer transforms GFM-alert blockquotes (e.g. `> [!accent]
        …`, `> [!secondary italic] …`) into semantic left-bar callouts rendered at
        medium (500) weight, available in any markdown body.
      - markdown is rendered with smartypants disabled so straight quotes and -- are
        preserved and rendered text equals its verbatim/captured source.
      - the module content contract supports `values` (enum) and `itemSchema` (list/object)
        field specs, and validateModuleContent recurses through itemSchema enforcing
        required + enum to arbitrary depth, reporting violations with dotted/indexed
        paths (e.g. items[0].badge.variant).
      modify:
      - services-grid and contact-form descriptions updated to include their structured
        treatments/variants; text-block markdown coverage updated to include callout
        left-bars and verbatim (smartypants-off) rendering.
      remove: []
    intent_delta_summary: STORY-56 grows from the base three content modules to also
      documenting card treatments (accent/badge/checklist/surface/size/stacked), side-by-side
      half-width forms + submit treatment, markdown callouts + verbatim rendering,
      and the generalized recursive content-contract validation those structured fields
      require.
    story_uid: story-903e3e3a
  - index: 3
    component: Framework section background (background + surface composition)
    item_type: upgrade
    story_points: 1
    dependencies: []
    target_story_ids:
    - story-6af935e7
    description: 'Extends the section-background story (STORY-59) with a documented
      precedence rule so a background and a surface dial compose in one section. Previously
      a module''s surface-* class set an opaque background on its own <section>, painting
      over the REQ-14 background layer and making the background inert. SECTION_CSS
      now suppresses the wrapped band''s own background-color/background-image when
      a background wrapper is present (a specificity-(0,2,0) two-class rule emitted
      after module CSS), while leaving the surface''s `color` text-contrast contract
      intact. Documented precedence: background paints; surface contracts. Surface-only
      bands (no background wrapper) are unaffected.'
    justification: 'No new capability bucket: this is the same section-background
      primitive from STORY-59, now composing correctly with the pre-existing surface
      dial. It adds a structural precedence rule to the existing three-layer wrap,
      not a new field, module, or surface. Bug-fix-shaped work is classified as upgrade
      per STORY-TYPES.'
    acceptance_criteria_changes:
      add:
      - 'when a section declares both a background and a surface dial, the background
        paints and the surface supplies only the text-colour/contrast contract (documented
        precedence: background paints, surface contracts), with no raw CSS in the
        site definition.'
      - a surface-only band (no background wrapper) is unaffected — its surface fill
        paints normally.
      modify:
      - background description updated to state the background/surface composition
        precedence rule.
      remove: []
    intent_delta_summary: 'STORY-59 gains the background+surface composition contract:
      the two compose deterministically via a SECTION_CSS precedence rule rather than
      surface silently painting over the background.'
    story_uid: story-6af935e7
  - index: 4
    component: Framework layer primitive — art-direction treatments (typography, image
      shadow/border, feather, geometry, titled-block)
    item_type: upgrade
    story_points: 3
    dependencies: []
    target_story_ids:
    - story-4f50c054
    description: 'Extends the layer primitive (STORY-60) with token-backed art-direction
      treatments surfaced by the faelan.com import. Layer text children gain structured
      typography (size, weight, color, font, tracking, align, leading, shadow presets
      soft|glow) and a multi-line `lines: [{text, typography?}]` titled-block form
      (one positioned flow block, content-based fixed inter-line gap at any viewport
      height, exactly one of text/lines enforced). Layer image children gain shadow
      (theme shadow token, incl. a new defaulted xl token) and border ({width step,
      palette-role colour}), plus a soft-mask feather control (sm/md/lg → radial mask
      stop). Geometry fidelity fixes: transform-origin:center for in-place rotation,
      motion-wrapper transparent to image sizing + shape-circle aspect-ratio:1 (circle
      no longer collapses to an ellipse), box-sized ellipse soft-mask, and text-link
      underline offset. All strictly structured/token-backed; no raw CSS reaches the
      page.'
    justification: 'No new capability bucket: every treatment is a generalization
      of the existing layer child (image | text) from STORY-60, not a new module or
      child kind (CLAUDE.md generalize-first). Positioning, masking and compositing
      already belong to this story; this adds structured typography/shadow/border/feather
      fields and corrects the geometry the existing positioning contract depends on.'
    acceptance_criteria_changes:
      add:
      - layer text children carry structured typography (size/weight/color/font/tracking/align/leading
        and a shadow preset soft|glow), all resolving to theme-token custom properties.
      - 'a layer text child may carry `lines: [{text, typography?}]` (mutually exclusive
        with `text`) rendered as one positioned flow block, so the inter-line gap
        is content-based and fixed across viewport heights.'
      - 'layer image children carry a shadow treatment (theme shadow token, including
        a defaulted xl token) and a border ({width: none|thin|medium|thick, color:
        palette-role}).'
      - layer image children (soft-mask) carry a feather control (sm|md|lg) emitted
        as a --fc-feather custom property, default preserved when absent.
      - 'layer geometry is faithful: transform-origin is center (rotate in place),
        the motion wrapper is transparent to image sizing and a shape-circle child
        is a true circle (aspect-ratio:1), the soft-mask is a box-sized ellipse, and
        layer text links carry a tasteful underline offset.'
      modify:
      - layer description updated to note text-child typography/titled-block and image-child
        shadow/border/feather treatments and the corrected rotation/sizing geometry.
      remove: []
    intent_delta_summary: STORY-60 grows from bare positioned image/text children
      to documenting token-backed typography, multi-line titled blocks, image shadow/border/feather
      treatments, and the transform-origin/sizing/mask geometry corrections that make
      art-directed montages reproduce faithfully.
    story_uid: story-4f50c054
  - index: 5
    component: Reference capture — per-element computed values + section scrim/anchor
    item_type: upgrade
    story_points: 2
    dependencies: []
    target_story_ids:
    - story-8f33f14c
    description: 'Extends the headless capture (STORY-57) so capture.json records
      the computed per-element values a mechanical fidelity diff needs. Each text/box
      run now carries lineHeightPx, letterSpacingPx, a normalized text-fill gradient
      ({angleDeg, stops}), a left-border treatment ({widthPx, color}), and paddingLeftPx
      — all read from computed styles with Tailwind/var() already resolved. Per band,
      capture also detects a full-bleed translucent overlay (scrim) routed onto Background.overlay
      and measures a content vertical-anchor ratio (content-box centre / band height)
      onto Layout.contentAnchorRatio. A run whose painted colour is unresolvable is
      flagged colorInferred (falling back to the #000/#fff sentinel). All fields optional
      so pre-existing bundles still parse.'
    justification: 'No new capability bucket: this deepens the existing capture essence
      (STORY-57''s capture.json) with more computed-style fields on the same section/content-run
      model — the capture command and its bundle contract are unchanged in shape,
      only richer. It is the reference half of the fidelity loop; the diff itself
      is a separate new command (item 6).'
    acceptance_criteria_changes:
      add:
      - capture.json content runs record lineHeightPx, letterSpacingPx, a normalized
        text-fill gradient ({angleDeg, stops}), a left-border treatment ({widthPx,
        color}) and paddingLeftPx, resolved from computed styles.
      - capture detects a per-band scrim (a full-bleed semi-transparent overlay descendant)
        and records it on the band background overlay, and measures a content vertical-anchor
        ratio from geometry.
      - 'a run with an unresolvable painted colour is flagged colorInferred and falls
        back to a #000/#fff sentinel; all new fields are optional so pre-REQ-31 bundles
        still parse.'
      modify:
      - capture essence description updated to enumerate the added per-element computed
        values, the section scrim/anchor, and the colorInferred flag.
      remove: []
    intent_delta_summary: STORY-57 grows its structured essence to carry per-element
      computed styling (line-height, letter-spacing, text-fill gradient, left-bar,
      padding), section-level scrim/anchor, and a colorInferred sentinel — the reference
      data a mechanical values-diff consumes.
    story_uid: story-8f33f14c
  - index: 6
    component: Mechanical values-diff (1c values-diff)
    item_type: feature
    story_points: 3
    dependencies:
    - 5
    target_story_ids: []
    description: 'New capability: a mechanical, value-level fidelity diff exposed
      as `1c values-diff <slug> --ref <bundle> [--source] [--out] [--json] [--actual
      <manifest.json>] [--strict] [--*-tol]`. flattenCapture/flattenSignals project
      both a capture bundle and our rendered draft to a flat value manifest keyed
      by verbatim text; diffManifests aligns runs (FIFO by document order) and diffs
      each field, emitting a severity-ranked ValueDelta[] (missing > text/casing >
      colour/gradient/border > weight/family > line-height/padding/letter-spacing).
      It also diffs a SectionValues[] slice by ordinal index, emitting overlay (scrim)
      and contentAnchor deltas. Casing is compared case-sensitively on a collapsed-but-case-preserving
      form (small-caps vs literal caps flagged) while whitespace noise is ignored.
      Noise controls (REQ-35): per-metric tolerances (fontSize/lineHeight-proportional/letterSpacing/padding/border),
      font-weight bucketing, perceptual redmean-ΔE colour tolerance (near-neighbour
      gold still flagged), a strict mode zeroing measurement tolerances, and skipping
      hard colour deltas against colorInferred reference values. Renders+serves+extracts
      the draft through the same BrowserDriver seam as the eyes loop; exits non-zero
      on any remaining delta.'
    justification: No existing story covers a value-level reconciliation of two rendered
      representations. STORY-57 captures a reference and STORY-58 screenshots; neither
      aligns manifests or diffs computed values field-by-field. This is a genuinely
      new command and capability (the anti-recurrence mechanism REQ-31/REQ-35), so
      it is a feature, not an extension of an existing story. Depends on item 5 because
      the diff compares the per-element/section values that capture must record.
    story_uid: story-f826e5ca
  - index: 7
    component: Perceptual-diff eye (1c diff + 1c crop)
    item_type: feature
    story_points: 3
    dependencies: []
    target_story_ids: []
    description: 'New capability: a screenshot-to-screenshot perceptual fidelity check
      complementing the value-manifest diff. `1c diff <slug> [--source] [--ref <bundle|png>]
      [--actual <png>] [--sandbox] [--out <dir>]` renders→serves→shoots the draft
      (reusing the 1c shot seam) or accepts a pre-shot PNG, crops both to a common
      top-anchored rectangle, and emits diff.png (per-pixel max-channel heatmap),
      diff-blocks.png (block-averaged de-noised heatmap), a stdout summary (mean/255,
      % over threshold, horizontal band profile), and regions.json — severity-ranked
      regions of interest derived by connected-components over the block grid (score
      = Σ block-diffs), each with ref/ours/diff crop triptychs for the top-N. Core
      diff logic (computeDiff/deriveRegions) is pure and browser-free; sharp handles
      decode/encode/extract (declared as a generate-tool dependency). `1c crop <image>
      --box x,y,w,h [--out <png>]` extracts a box from an existing on-disk image (distinct
      from the live 1c shot). Exits non-zero when ≥1 region of interest is found.'
    justification: No existing story covers pixel-level perceptual diffing or region
      derivation. STORY-58 screenshots a single page; STORY-57 captures; the value-diff
      (item 6) is structurally blind to composition/geometry. `1c diff`/`1c crop`
      are new commands surfacing a class of delta nothing else can see, so they are
      a feature.
    story_uid: story-1570884a
  - index: 8
    component: 1c launcher + quiet SSR server
    item_type: feature
    story_points: 1
    dependencies: []
    target_story_ids: []
    description: 'New capability: a bin/1c shell launcher that resolves the repo root
      from its own location (works from any CWD) and dispatches to tools/generate/bin/1c.mjs,
      deliberately preserving the caller''s working directory so sites/ and dist/
      paths resolve relative to CWD; documents adding bin/ to PATH for a bare `1c`.
      Separately, the launcher''s Vite SSR server sets server.ws:false so it never
      binds Vite 8''s fixed HMR port 24678 — a long-running `1c serve` no longer makes
      every other `1c` invocation log ''Port 24678 is already in use''.'
    justification: No existing story documents how the 1c CLI is invoked or its SSR-server
      configuration. This is distinct tooling/ergonomics (launcher + port-collision
      fix), not a behavior of capture, shot, or any framework module, so it is a small
      standalone feature.
    story_uid: null
---

# Reconciliation Plan — BUNDLE-3 (bundle-adc60ee8)

**Mode**: commits (23 free-coded commits)
**Anchor**: bundle-adc60ee8 (type=bundle; used directly as subject_uid + anchor_uid)
**Bundled intents**: REQ-26, REQ-27, REQ-28, REQ-20, REQ-31, REQ-32, REQ-33, REQ-35, REQ-37, REQ-38 (+ faelan REQ-21 layer work under REQ-32 cap 5)

All 23 commits are `[FREE-CODED]` fidelity/tooling work driven by the founder-site import milestone (REQ-20 gigabytealchemy, REQ-21 faelan). The intents repeatedly state the code is *generalizations of existing modules* (CLAUDE.md generalize-first) — so the plan is upgrade-heavy: existing stories are extended, and only the genuinely new vision/tooling commands become features.

## Intent vs implementation footprint

Case 1/2 (implementation matches or knowingly extends declared intent) throughout. Every framework change is a new dial/variant/role/treatment on an existing module or the theme-token generator, exactly as the tickets declare. No Case-3 undeclared regressions found: the only areas touched outside the framework modules are the capture/vision tooling (its own new stories) and the launcher. Site-definition/config edits (storage/sites/gigabytealchemy, storage/sites/faelan) are the REQ-20/REQ-33/REQ-21 reproduction milestones and are free-coding-exempt config — they are *evidence* the dials work, not matrix behavior, so they generate no plan items.

## Behavior inventory (grouped by capability bucket)

```yaml
behavior_inventory:
  source: "commits mode: 23 free-coded commits on reconcile-BUNDLE-3"
  buckets:
    - capability: CAP-51 Theming & Module Catalog
      chrome_modules (STORY-55):
        - hero: headingTreatment(plain/accent/gold/gradient), height(auto/fold), markdown subhead, subheadColor, subheadSize(sm/md/lg), scrim, contentAnchor  # REQ-28, df9d, REQ-32, REQ-33
        - header: align(left/center), logoSize(sm/md/lg/xl), xl top-spacing, tight-tracking true-weight display wordmark  # REQ-28, df9d, REQ-33
        - footer: layout(center/spread)  # df9d
        - gradient text treatment {direction, stops[]} multi-hue/any-direction on wordmark/heading  # REQ-32 cap1, ef43bea accent-mid
        - palette roles: secondary, neutralCool, accentLight, accentDeep, accent-mid (optional, defaulted)  # 0c506c9, REQ-32 cap4, 04d9e56, ef43bea
      content_modules (STORY-56):
        - services-grid: accent border, badge{label,variant}, checklist(real ✓ text run), surface(default/muted), stacked variant, size dial + per-card size  # REQ-26, REQ-28, 0c506c9, ddfcba9, ef43bea
        - contact-form: width(full/half)+fc-row row grouping (ROW_CSS), submitTreatment(primary/neutral), submit font:inherit  # df9d, 04d9e56, ddfcba9
        - markdown: GFM-alert callout left-bars @ medium weight, smartypants off (verbatim)  # REQ-32 cap2, 72b3e12, ddfcba9
        - module content contract: ContentFieldSpec values/itemSchema + recursive validateModuleContent (nested required/enum, dotted paths)  # REQ-26 686fbd6
    - capability: CAP-53 Art-Direction Language
      background (STORY-59):
        - background + surface compose via SECTION_CSS precedence (background paints, surface contracts)  # REQ-27 b2cef07
      layer (STORY-60):
        - text typography + lines titled-block; image shadow/border/feather; transform-origin/circle/mask geometry; link underline offset; xl shadow token  # REQ-32 cap5 + faelan follow-ups 25f1c91/502cbbc/898d0ce/5e6dcd/d4fd3f
    - capability: CAP-52 Reference Capture: Headless-Browser Vision
      capture (STORY-57, upgrade):
        - per-element computed values (lineHeight, letterSpacing, text-fill gradient, left-bar, padding); section scrim + content-anchor ratio; colorInferred sentinel  # REQ-31 6fdd574 + 6db3069 + REQ-35 extract
      NEW value-diff (feature):
        - 1c values-diff: manifest projection, field/section severity-ranked diff, casing delta, per-metric tolerances/strict/inferred-colour  # REQ-31 6fdd574/c7219d6/6db3069 + REQ-35 5151cf7
      NEW perceptual-diff (feature):
        - 1c diff (block-averaged heatmap + connected-components regions.json + crop triptychs) + 1c crop  # REQ-38 b76cf7f
      NEW launcher (feature):
        - bin/1c launcher + server.ws:false quiets HMR port 24678 collision  # REQ-37 cf37056
```

## Coverage map

```yaml
coverage_map:
  - feature: chrome-module dials + palette roles + gradient treatment
    status: partial
    existing_stories: [story-a224111f (STORY-55)]
    gaps: [hero/header/footer art-direction dials, multi-stop/any-direction gradient, expanded palette roles]
  - feature: content-module treatments + recursive content validation
    status: partial
    existing_stories: [story-903e3e3a (STORY-56)]
    gaps: [services-grid card treatments/variants/size, half-width forms + submit treatment, markdown callouts/verbatim, itemSchema validation]
  - feature: background + surface composition
    status: partial
    existing_stories: [story-6af935e7 (STORY-59)]
    gaps: [background/surface precedence rule]
  - feature: layer art-direction treatments
    status: partial
    existing_stories: [story-4f50c054 (STORY-60)]
    gaps: [text typography/lines, image shadow/border/feather, rotation/circle/mask geometry]
  - feature: capture per-element computed values + scrim/anchor
    status: partial
    existing_stories: [story-8f33f14c (STORY-57)]
    gaps: [per-element computed styling, section scrim/anchor, colorInferred]
  - feature: mechanical values-diff (1c values-diff)
    status: uncovered
    existing_stories: []
  - feature: perceptual-diff eye (1c diff + 1c crop)
    status: uncovered
    existing_stories: []
  - feature: 1c launcher + quiet SSR server
    status: uncovered
    existing_stories: []
```

## Plan items

| # | Component | Type | Points | Deps | Target |
|---|-----------|------|--------|------|--------|
| 1 | Chrome modules + palette roles + gradient treatment | upgrade | 3 | - | STORY-55 |
| 2 | Content modules + content-contract validation | upgrade | 3 | - | STORY-56 |
| 3 | Background + surface composition | upgrade | 1 | - | STORY-59 |
| 4 | Layer art-direction treatments | upgrade | 3 | - | STORY-60 |
| 5 | Capture per-element computed values + scrim/anchor | upgrade | 2 | - | STORY-57 |
| 6 | Mechanical values-diff (1c values-diff) | feature | 3 | 5 | (new) |
| 7 | Perceptual-diff eye (1c diff + 1c crop) | feature | 3 | - | (new) |
| 8 | 1c launcher + quiet SSR server | feature | 1 | - | (new) |

**Totals**: 8 items (upgrade: 5, feature: 3), 19 points.

## Observations

- **Upgrade-heavy by design.** The tickets themselves invoke CLAUDE.md's generalize-first rule commit after commit; the code confirms it (new dials/roles/treatments on existing modules, zero new framework modules). Every framework behavior lands in an existing capability bucket, so 5 of 8 items are upgrades.
- **The two big chrome/content upgrades (items 1, 2) accumulate many ACs** because ~15 commits pile dials onto hero/header/footer and services-grid/contact-form/markdown across REQ-28/32/33/20. They are single story buckets (STORY-55 chrome+tokens, STORY-56 content modules), so they stay one item each with multiple ACs rather than fragmenting per-dial (per reconciliation parsimony).
- **REQ-20 / REQ-33 / REQ-21 milestones themselves generate no plan items.** They are site-reproduction milestones; their storage/sites/* edits are free-coding-exempt config. The framework primitives those imports *drove* (accent-mid, services size, callouts, layer treatments, warm/cool roles) are folded into the module upgrades they belong to.
- **validateModuleContent generalization** (recursive itemSchema/enum) is module-agnostic but folded into the STORY-56 content-module upgrade as the content-contract mechanism its structured card fields depend on — avoids a thin standalone item while STORY-54 (site-definition *structural* validation) explicitly excludes per-module field/dial validation.
- **Item 6 depends on item 5**: the values-diff compares exactly the per-element/section values capture must first record. Split feature/upgrade (not one story) because capture (STORY-57) pre-exists and the diff is a new command.
- **REQ-35 noise reduction folds into the new values-diff feature (item 6)**, not a separate item — the story it would upgrade doesn't exist yet, so its tolerances/strict/inferred-colour behaviors are ACs of the same new story.
- **Uncertainty / judgment calls**: (a) REQ-37 launcher is filed as a small standalone feature under the vision/tooling capability for lack of a CLI-ergonomics story; could alternatively attach to whichever story owns the 1c CLI root if one is later designated. (b) The gradient treatment and palette roles sit in STORY-55 (token/chrome) though they also serve content modules — placed with the theme-token generator that emits them.
- FC-test scan reported empty ([]) — the harness scans for Python test_UAT_FC_*.py; this project's FC UATs are TypeScript (tests/reqNN-*.test.ts). Their behaviors are nonetheless fully covered by the plan items above (each item cites the commits whose UATs evidence it), so no orphan risk remains.