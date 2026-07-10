---
uid: report-3cce7b69
id: REPORT-402
type: report
title: 'Reconciliation Plan: BUNDLE-4 (REQ-45/39/40/46/47/48)'
created_by: xgd
created_at: '2026-07-10T00:10:31.463615+00:00'
updated_at: '2026-07-10T00:52:34.347319+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-df065afc
  anchor_uid: bundle-df065afc
  items:
  - index: 1
    component: Module Conformance Harness
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'New shared conformance harness (tools/generate/src/conformance):
      assertModuleConforms(slug, fixtures, opts) renders each fixture as a one-module
      page through the real catalog renderer, serves it over loopback (the 1c shot
      / values-diff seam), drives Chromium, and throws on any non-excepted violation.
      Isolation model: each fixture renders/serves under its own mkdtemp root (never
      storage/), removed on pass and preserved+logged on failure, so no site-data
      pollution is structurally possible. Fast safety dimension (default): no console/page
      errors or unhandled rejections, no failed requests, no horizontal overflow (scrollWidth<=viewport.width),
      no collapsed expected-content container, no clipped text; runs at desktop +
      one mobile viewport. `except` option opts a fixture out of a declared AC. Security
      dimension ({dimension:''security''}): schema-derived injection payloads (script
      tags, on* handlers, javascript:/data: URLs, markdown-embedded HTML) asserted
      inert, a CSS-breakout guard, and an egress allowlist (requested URLs vs same-origin
      assets + declared fonts). Negative-fixture self-tests (overflow / console-error
      / collapsed / css-breakout / xss-url / xss-handler / egress) prove the discriminator
      flags red while a clean fixture passes. Enabling seam changes: BrowserDriver.navigate(url,
      viewport?) + diagnostics()/requestedUrls (console errors, page errors, failed
      + requested URLs captured during load) and renderSite gains an injectable resolveModule
      + extraCss so deliberately-broken test-only modules render through the SAME
      renderer without touching the shipping catalog. A ContentSafetyError thrown
      while serving a fixture is counted as a conformant safe-rejection.'
    justification: No existing story covers a module-conformance harness. This is
      a genuinely new capability bucket (the DOC-20 test seam every thin module leaf
      will delegate to), not an extension of any capture/framework story. Both the
      core safety dimension (REQ-39) and the security dimension (REQ-40) are modes
      of the same single assertModuleConforms seam, so they are ACs of one coarse
      story rather than two — combined per parsimony. Likely seeds a new capability
      downstream.
    story_uid: story-a6962b23
  - index: 2
    component: Framework Render-Path Content Safety
    item_type: feature
    story_points: 2
    dependencies: []
    description: 'The render/validate path now FAILS LOUD on dangerous content instead
      of silently emitting it. New packages/framework/src/modules/safety.ts is the
      single definition of unsafe (mirroring the REQ-40 security probe): ContentSafetyError,
      isUnsafeUrl(url), assertSafeUrl(url, context), assertSafeHtml(html, context).
      Unsafe = any URL scheme outside {http,https,mailto,tel} except relative/#hash/no-scheme
      (safe) and data:image/* (safe for image src only) — so javascript:, vbscript:,
      data:text/html, file: are rejected; dangerous HTML = a script/iframe/object/embed
      tag, an inline on*= handler, or an href/src/action/formaction carrying an unsafe
      scheme. renderMarkdown runs its produced HTML through assertSafeHtml before
      every set:html sink (so raw <script> in a markdown body is rejected, not executed
      — the load-bearing ''raw HTML is the validator''s concern'' comment is removed
      and the renderer now owns it). navHref routes url targets through assertSafeUrl
      (header/footer nav), and every module href/src/action sink wraps its value:
      hero (cta.href, image.src), services-grid (item.cta.href, item.icon.src), contact-form
      (action), header/footer (logo.src). A dangerous value throws ContentSafetyError
      at renderSite so the build fails loudly and surfaces the offending field+value
      to the generating AI (a recoverable content failure). No live CSS-breakout vector
      exists: every inline style= is framework-computed from closed enum dials, never
      free content.'
    justification: 'No existing story documents a render-path content-sanitization
      boundary. The enforcement is cross-cutting (markdown.ts, nav.ts, safety.ts +
      every module''s URL sinks) — it is not the behaviour of any single module catalog
      story (STORY-55/56 document module composition/dials, not a safety boundary).
      It is a genuinely new capability (the product thesis: the module is the sanitization
      boundary for untrusted content), so feature, not upgrade.'
    story_uid: story-38de5800
  - index: 3
    component: 'Chrome Catalog: Hero/Header Typography Fidelity Dials'
    item_type: upgrade
    story_points: 1
    dependencies: []
    description: 'REQ-45 adds last-mile typography-fidelity dials to the chrome catalog:
      a token-backed `tracking` dial (normal/tight/tighter) on the hero heading and
      the header wordmark, backed by three new --tracking-* typography tokens (0 /
      -0.025em / -0.05em); and a `subheadLeading` dial (tight/normal/relaxed) on the
      hero subhead mapping to --line-height-* independently of the global relaxed
      default. Each dial defaults to prior behaviour (`normal` emits no tracking override
      so a display wordmark keeps its font-face tracking; `relaxed` preserves the
      prior subhead line-height). The tracking typography-token group uses a schema
      .default() so themes predating it keep validating while the resolved type stays
      required.'
    justification: Extends the existing chrome/token story in place — it adds new
      art-direction dials (tracking, subheadLeading) and three token slots to the
      same hero/header modules and the same token-driven-CSS surface STORY-55 already
      documents (which already covers heading/wordmark colour treatment, alignment,
      sizing, scrim/anchor and the --*-token naming scheme). No new capability bucket,
      no parallel module or token system — a dial+token addition to existing modules,
      so upgrade.
    target_story_ids:
    - story-a224111f
    acceptance_criteria_changes:
      add:
      - Hero heading and header wordmark accept a token-backed `tracking` dial (normal/tight/tighter);
        `normal` emits no letter-spacing override, tight/tighter emit var(--tracking-*).
      - The token-driven stylesheet emits three new --tracking-* custom properties
        (0 / -0.025em / -0.05em); the tracking token group validates against pre-existing
        themes via a schema default.
      - Hero subhead accepts a `subheadLeading` dial (tight/normal/relaxed) mapped
        to --line-height-*; `relaxed` preserves the prior subhead line-height.
      modify: []
      remove: []
    intent_delta_summary: STORY-55 gains three ACs documenting the REQ-45 typography-fidelity
      dials (hero/header tracking, hero subhead leading) and the new --tracking-*
      token slots; all prior chrome/token intent preserved.
    story_uid: story-a224111f
  - index: 4
    component: 'Content Catalog: Column-Width & Contact-Form Fidelity Dials'
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'REQ-45 adds last-mile fidelity dials to the content modules. A `contentWidth`
      dial (default/narrow/wide) on text-block and services-grid caps the content
      within the section''s full-width frame; the flex cross-start pins a narrow column
      to the left gutter (the header/hero content edge), collapsing cumulative vertical
      drift — `default` fills the frame (unchanged). On contact-form: a `submitForeground`
      dial (auto + palette roles incl. bg) paints the submit label a framework-computed
      var(--color-<role>) (e.g. bg = legible on-primary white) instead of inheriting
      a surface tint (`auto` keeps the treatment colour); `subheadSize` and `captionSize`
      dials size the intro subhead and a small caption independently; and a new `caption`
      markdown content slot. Each dial defaults to prior behaviour so a site omitting
      it is unchanged. (Includes the a96677a test-robustness follow-up: the REQ-5
      services-grid card-count UATs now match the leading `services-grid__card` class
      token rather than an exact attribute, robust to the trailing card-size-*/treatment
      classes — no behaviour change.)'
    justification: Extends the existing content-module story in place — contentWidth,
      submitForeground, subheadSize/captionSize and the caption slot are new structured,
      token-backed dials/content-fields on the same text-block, services-grid and
      contact-form modules STORY-56 already documents (which already covers per-card/form/prose
      treatments and the content-contract). No new module, no parallel catalog — dial
      and content-slot additions to existing modules, so upgrade.
    target_story_ids:
    - story-903e3e3a
    acceptance_criteria_changes:
      add:
      - text-block and services-grid accept a `contentWidth` dial (default/narrow/wide)
        that caps content within the section frame and pins a narrow column to the
        left gutter; `default` fills the frame unchanged.
      - contact-form accepts a `submitForeground` dial (auto + palette roles incl.
        bg) painting the submit label a framework-computed var(--color-<role>); `auto`
        keeps the treatment colour.
      - contact-form accepts `subheadSize` and `captionSize` dials sizing the intro
        subhead and caption independently, plus a `caption` markdown content slot.
      modify: []
      remove: []
    intent_delta_summary: STORY-56 gains ACs documenting the REQ-45 content-fidelity
      dials (contentWidth on text-block/services-grid; submitForeground, subheadSize,
      captionSize and caption slot on contact-form); prior content-module intent preserved.
    story_uid: null
  - index: 5
    component: 'Reference Capture: Richer & Multi-State Rendered Projection'
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'REQ-47 (Part A) and REQ-48 extend the capture''s rendered projection
      from a single static section-level frame to a rich, multi-state, multi-viewport,
      multi-engine element-level projection — every field expressed in rendered/geometric/a11y
      terms, never CSS mechanism. Per-element facts (descended from sections to every
      rendered element): box{x,y,w,h}, borderRadiusPx, boxShadow, a11yRole, and arrangement
      (row/stack, from geometry vs the previous element). Text-free elements (inputs,
      dividers, and — REQ-48 — img children, via capture descent into layer/montage
      children) captured as fields paired on a11yRole + document order (unmatched
      -> presence), each with an accessible-name source (placeholder=inside vs label/aria=outside).
      Additional REQ-48 projected axes: zIndex (paint order), filter/textShadow/maskEdge
      treatments, objectFit + intrinsicAspect (media), a decomposed transform (rotation
      deg + uniform scale) plus declared motion (animation/transition/both), and a
      per-run fontLoaded fact. Capture-timing preconditions: await document.fonts.ready
      after networkidle (FOUT), and emulate prefers-reduced-motion:reduce to freeze
      animation for determinism. Multi-dimension orchestration: a RESPONSIVE_VIEWPORTS
      ladder {320,375,768,1024,1280,1440} with a per-run viewport tag; a cross-engine
      driver seam (createEngineDriver over chromium|webkit|firefox with engineAvailable()
      so missing engines skip cleanly); and runMultiStateCapture() looping engine
      x viewport x interaction-state, actuating :hover/:focus/:active via CDP forcePseudoState
      (BrowserDriver.actuate()/canActuate()), each projection a provenance-tagged
      ValueManifest, persisted via writeMultiState/readMultiState (multistate.json),
      with unavailable engines / non-actuating drivers held back and NOTED.'
    justification: Extends the existing reference-capture story in place — every change
      adds rendered-facts and capture states to the same 1c capture projection / BrowserDriver
      seam STORY-57 already documents (per-element computed value manifest, screenshot,
      self-contained bundle). No new command, no parallel capture path — a richer
      projection and additional capture states/engines/viewports on the existing pipeline,
      so upgrade.
    target_story_ids:
    - story-8f33f14c
    acceptance_criteria_changes:
      add:
      - Capture descends per-element geometry (box), shape (borderRadiusPx, boxShadow)
        and a11y (role, accessible-name source) from sections to every rendered element,
        and captures text-free elements (inputs, dividers, img children) as fields
        paired on a11yRole + document order.
      - 'Capture projects additional rendered axes per element: zIndex, treatments
        (filter/textShadow/maskEdge), media (objectFit/intrinsicAspect), a decomposed
        transform (rotation/scale), declared motion, and a per-run fontLoaded fact
        and viewport tag.'
      - 'Capture-timing preconditions: await document.fonts.ready (FOUT) and emulate
        prefers-reduced-motion:reduce to freeze animation for deterministic projection.'
      - 'Multi-state/dimension capture: a responsive viewport ladder, a cross-engine
        driver seam (chromium/webkit/firefox with clean skip when unavailable), and
        a multi-state loop actuating :hover/:focus/:active, persisted as provenance-tagged
        manifests (multistate.json) with unavailable/non-actuating cells noted.'
      modify: []
      remove: []
    intent_delta_summary: 'STORY-57 gains ACs documenting the REQ-47/REQ-48 projection
      enrichment: per-element geometry/shape/a11y, the new rendered axes (z-order,
      treatments, media, transform, motion, font-load), the freeze/font preconditions,
      and the multi-viewport/cross-engine/multi-state capture orchestration. Prior
      capture intent preserved.'
    story_uid: null
  - index: 6
    component: 'Values-Diff: Severity-Ranked Structural Diff, New-Axis Deltas & Trust'
    item_type: upgrade
    story_points: 3
    dependencies:
    - 5
    description: 'REQ-47 (Part B) and REQ-48 evolve 1c values-diff from area/property-scalar
      ranking to a severity-ranked structural diff over the richer projection, plus
      new delta axes and diff-quality/trust controls. Severity taxonomy: every delta
      tagged with a kind mapped to a fixed tier table (CRITICAL presence/containment/arrangement/position/text;
      HIGH size/fontSize/fontFamily; MEDIUM shape/borderLeft/gradient/fontWeight;
      LOW colour/overlay/contentAnchor/lineHeight/padding/letterSpacing). Sort = (tier,
      kind-within-tier, magnitude) — pixel area is never an input, so a small 100%-wrong
      element outranks a large mildly-wrong one; the REQ-31 overlay>contentAnchor
      / text>colour / colour>letterSpacing orderings are preserved (contentAnchor
      stays LOW, superseded by the per-element CRITICAL position kind). The three
      REQ-20 misses now surface as explicit CRITICAL text deltas (hero block position
      dy~195, placeholder-vs-label containment, subscribe button arrangement). New
      delta kinds compared from the richer projection: zOrder (HIGH), treatment (MEDIUM,
      presence-based), media (HIGH: object-fit mismatch + >10% aspect drift), transform
      (HIGH: rotation>2deg / scale>0.05) + motion (MEDIUM presence), a CRITICAL viewport-mismatch
      precondition + HIGH horizontal-overflow check, and a HIGH fontLoad (FOUT) check;
      a diffMultiState() pairs reference<->repro cell-for-cell on {engine,width,state},
      surfacing missing cells. Diff-quality/trust: colorDistance replaced by perceptual
      OKLab deltaE (scale ~0..1, default tol 0.02); systemic sub-threshold aggregation
      emits one escalated headline row when a LOW/MEDIUM kind recurs on >=N elements
      (capped at HIGH, never CRITICAL); ignore-masks (ignoreDynamicYear default-on
      folding 4-digit years in the join key + comparison, and --ignore regex masks
      with a suppressed count); and an anti-self-grading calibration oracle (SEEDED_DEFECTS
      one-per-axis, calibrateDiscriminator / discriminatorIsCalibrated) that a consumer
      runs before trusting a clean verdict, naming any blind axis. formatReport leads
      each row with the severity tier.'
    justification: Extends the existing values-diff story in place — severity ranking,
      the new delta kinds, colour distance, aggregation, masks and calibration are
      all changes to how the same 1c values-diff projects, compares and ranks the
      manifest STORY-62 already documents (which covers the value-manifest diff, its
      per-metric noise controls, colour distance and severity-ranked report). No new
      command, no parallel diff — a richer comparator and quality/trust controls on
      the existing diff, so upgrade. Depends on item 5 because the new-axis compares
      consume the enriched projection captured there.
    target_story_ids:
    - story-f826e5ca
    acceptance_criteria_changes:
      add:
      - Every delta is tagged with a kind -> fixed severity tier and sorted (tier,
        kind, magnitude) with pixel area never an input, so a small structural defect
        outranks a large tonal one; the three REQ-20 misses surface as CRITICAL position/containment/arrangement
        text deltas; the REQ-31/REQ-35 orderings are preserved.
      - 'New delta kinds compared from the enriched projection: zOrder (HIGH), treatment
        (MEDIUM presence), media (HIGH object-fit/aspect), transform (HIGH) + motion
        (MEDIUM), a CRITICAL viewport-mismatch precondition, HIGH horizontal-overflow,
        and HIGH fontLoad; diffMultiState pairs cells on {engine,width,state} and
        surfaces missing cells.'
      - Colour distance uses perceptual OKLab deltaE (default tol 0.02); a LOW/MEDIUM
        kind recurring on >=N elements escalates to one capped-at-HIGH headline row
        while keeping the per-element rows.
      - 'Ignore-masks: ignoreDynamicYear (default on, folds 4-digit years in join
        key + comparison; --compare-years opts out) and --ignore regex masks with
        a suppressed count; malformed patterns are inert.'
      - An anti-self-grading calibration oracle seeds one known defect per fidelity
        axis and reports which fired, so a consumer can confirm the discriminator
        is calibrated (naming any blind axis) before trusting a clean verdict.
      modify: []
      remove: []
    intent_delta_summary: STORY-62 gains ACs documenting the REQ-47 severity-tier
      comparator, the REQ-48 new-axis delta kinds and multi-state diff, the OKLab
      colour distance and systemic aggregation, the dynamic-content ignore-masks,
      and the anti-self-grading calibration oracle. Prior values-diff intent (noise
      controls, existing orderings) preserved.
    story_uid: null
---

# Reconciliation Plan — BUNDLE-4 (bundle-df065afc)

**Mode**: commits
**Source**: 20 free-coded commits across REQ-45, REQ-39, REQ-40, REQ-46, REQ-47, REQ-48
**Subject (indexing)**: bundle-df065afc

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commits (bundle REQ-45/39/40/46/47/48)"
  groups:
    - req: REQ-45
      commits: [111d3c5, a96677a]
      files: [modules/{hero,header,text-block,services-grid,contact-form}, tokens/{css,defaults}, dials.ts, site-schema]
      behaviors:
        - hero/header `tracking` dial + new --tracking-* tokens
        - hero `subheadLeading` dial
        - text-block/services-grid `contentWidth` dial (left-gutter narrow column)
        - contact-form submitForeground / subheadSize / captionSize / caption slot
        - (a96677a) services-grid card-count UAT robustness (no behaviour change)
    - req: REQ-39
      commits: [0a3e029]
      files: [conformance/{harness,checks,types,index}, render/render.ts, capture/playwright-driver.ts]
      behaviors:
        - assertModuleConforms seam + one-module mkdtemp isolation (no pollution)
        - fast safety checks (overflow/collapse/clip/console+page errors/failed requests)
        - `except` exemption; negative-fixture proof-of-discrimination
        - BrowserDriver diagnostics seam; renderSite injectable resolveModule+extraCss
    - req: REQ-40
      commits: [a7ef810, e83ed32, bb2414a]
      files: [conformance/{checks,payloads,harness}, fixtures/conformance/*, driver requestedUrls]
      behaviors:
        - security dimension: schema-derived injection payloads -> inert; egress allowlist
        - security negative fixtures; gap tests migrated to REQ-46 RED spec
    - req: REQ-46
      commits: [8064f06]
      files: [modules/safety.ts, markdown.ts, nav.ts, hero/services-grid/contact-form/header/footer sinks]
      behaviors:
        - fail-loud ContentSafetyError on unsafe URL schemes + dangerous HTML at render
        - assertSafeUrl/assertSafeHtml single unsafe definition; harness counts safe-rejection
    - req: REQ-47
      commits: [df5732b]
      files: [capture/{extract,sections,types}, values-diff.ts, fidelity.ts]
      behaviors:
        - A: per-element geometry/shape/a11y projection + text-free field pairing
        - B: severity-tier comparator (structural-small > tonal-large)
    - req: REQ-48
      commits: [0805f9c, def1504, b73ecc6, a8eae22, 78d20ce, 29e80bc, b63e9e8, 6ef4c9a, a0d7e63, afb8f25, 2a2a7ba, 22446c3]
      files: [capture/{extract,sections,types,index,pipeline,bundle,playwright-driver,calibration}, values-diff.ts, args.ts]
      behaviors:
        - diff-quality: ignore-masks, systemic aggregation, OKLab deltaE, calibration/anti-self-grading
        - new axes: z-order, treatments, media/child-descent, motion/transforms+freeze, viewport/overflow, font-load
        - orchestration: cross-engine driver seam, viewport ladder, multi-state hover-actuation capture loop
```

## Coverage Map

```yaml
coverage_map:
  - feature: REQ-45 chrome dials (hero/header tracking, subhead leading, --tracking tokens)
    status: partial
    existing_stories: [story-a224111f]  # STORY-55 chrome+tokens
    -> item 3 (upgrade)
  - feature: REQ-45 content dials (contentWidth, contact-form submit fg / sizes / caption)
    status: partial
    existing_stories: [story-903e3e3a]  # STORY-56 content modules
    -> item 4 (upgrade)
  - feature: Module conformance harness (REQ-39 core+safety, REQ-40 security)
    status: uncovered
    existing_stories: []
    -> item 1 (feature)
  - feature: Render-path content-safety enforcement (REQ-46)
    status: uncovered
    existing_stories: []
    -> item 2 (feature)
  - feature: Richer + multi-state rendered capture projection (REQ-47 A, REQ-48 capture)
    status: partial
    existing_stories: [story-8f33f14c]  # STORY-57 capture
    -> item 5 (upgrade)
  - feature: Severity-ranked structural diff + new-axis deltas + trust (REQ-47 B, REQ-48 diff)
    status: partial
    existing_stories: [story-f826e5ca]  # STORY-62 values-diff
    -> item 6 (upgrade)
```

## Plan Items

| # | Component | Type | Pts | Deps | Target |
|---|-----------|------|-----|------|--------|
| 1 | Module Conformance Harness | feature | 3 | - | (new) |
| 2 | Framework Render-Path Content Safety | feature | 2 | - | (new) |
| 3 | Chrome Catalog: Hero/Header Typography Fidelity Dials | upgrade | 1 | - | STORY-55 |
| 4 | Content Catalog: Column-Width & Contact-Form Fidelity Dials | upgrade | 2 | - | STORY-56 |
| 5 | Reference Capture: Richer & Multi-State Rendered Projection | upgrade | 3 | - | STORY-57 |
| 6 | Values-Diff: Severity-Ranked Structural Diff, New-Axis Deltas & Trust | upgrade | 3 | 5 | STORY-62 |

## Observations

- **Parsimony / bundle mapping.** 6 REQs -> 6 items. REQ-45 splits by capability bucket (chrome vs content = STORY-55 / STORY-56). REQ-47 + REQ-48 both extend the SAME two fidelity-tooling stories, so they collapse into one capture-side upgrade (item 5) and one diff-side upgrade (item 6) rather than one-item-per-axis (which would be classic per-flag inflation). The natural boundary is capture-captures-facts / diff-compares-facts: new-axis *facts* land on STORY-57, their *compare logic* on STORY-62.
- **Conformance harness = one feature, not two.** REQ-39 (safety) and REQ-40 (security) are two dimensions of the one `assertModuleConforms` seam ({dimension:'safety'|'security'}), so they are ACs of a single new story, combined per 'when in doubt, combine'. The renderSite injectable-resolver and BrowserDriver diagnostics seam are enabling changes folded into the same story (added by and used for the harness).
- **REQ-46 is feature, not upgrade.** The content-safety boundary is cross-cutting (markdown.ts, nav.ts, safety.ts + every module URL sink) and is a genuinely new capability (the module-as-sanitization-boundary thesis); no single existing module story owns it, so a parallel-implementation upgrade would be wrong.
- **Cross-ticket coupling handled.** REQ-40's gap-demonstration UATs were migrated to REQ-46's RED acceptance spec (commits e83ed32 -> bb2414a) and flip GREEN when REQ-46's hardening lands (commit 8064f06); the harness then counts a ContentSafetyError as a conformant safe-rejection. This coupling is documented across items 1 and 2 but needs no extra plan item.
- **a96677a folded, not itemised.** It is a test-robustness fix for STORY-56's REQ-5 services-grid card-count UATs (match leading class token vs exact attribute), no user-visible behaviour change; noted inside item 4 rather than given its own (test-only) story per the hard prohibition.
- **Item 6 depends on item 5** because the new-axis comparators (z-order/treatment/media/transform/motion/viewport/font-load, and diffMultiState) consume the enriched projection captured in item 5.
- **Untouched stories confirmed.** STORY-63 (perceptual 1c diff) is not modified — REQ-47/48 corrected only the *description* of its scoring formula; the code changes are confined to values-diff.ts / capture/ / fidelity.ts. STORY-61 (framework motion) is unaffected — REQ-48 'motion' is diff-side *detection* of declared motion/transforms, not the framework's declarative motion params.
- **Uncertainty.** Items 5 and 6 are large (3 pts each) but each maps to exactly one existing story, avoiding conflicting mutations; splitting them further would fragment one coherent capability across many per-axis stories against the granularity rules.