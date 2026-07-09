---
uid: report-dc923632
id: REPORT-318
type: report
title: 'Reconciliation Plan: BUNDLE-2 (BUG-1 + REQ-12/13/14/15/16/22/23/24/25)'
created_by: xgd
created_at: '2026-07-09T20:08:08.630691+00:00'
updated_at: '2026-07-09T20:43:37.016147+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-f39884d2
  anchor_uid: bundle-f39884d2
  items:
  - index: 1
    component: Capture / headless-browser vision
    item_type: feature
    story_points: 3
    dependencies: []
    description: '`1c capture page <url>` — rendered-only reference capture. A real
      headless browser (BrowserDriver seam over local Playwright, CF-Browser-Rendering-shaped
      and injectable) navigates a live URL, JS hydrates, every response is intercept-cached,
      computed signals are queried, and a self-contained, gitignored capture bundle
      is written (capture.json + screenshot.full.png + rendered.html + raw.html +
      assets/). capture.json carries var()-resolved computed theme colors, fonts+mirrored
      files, type/spacing/container, style-signature-segmented sections (box, background
      incl. text-over-image overlay, flat layout, verbatim role-tagged content runs
      with exact color/font/size, flattened items), and assets. Never setContent();
      browser failure retries, never a static fallback. Re-extraction runs offline
      from the written bundle.'
    justification: No existing story covers reference capture — this is a genuinely
      new capability bucket (a headless-browser capture subsystem). Prior stories
      (53-56) cover the platform scaffold, schema validation, and the framework module
      catalog only; none touch capture, the BrowserDriver seam, or the capture bundle.
    story_uid: story-8f33f14c
  - index: 2
    component: Capture / headless-browser vision
    item_type: feature
    story_points: 1
    dependencies:
    - 1
    description: '`1c shot` — page screenshot primitive (AI eyes) built on the BrowserDriver
      seam. `1c shot <slug> [--source draft|published] [--out]` renders the chosen
      source, serves it over loopback, and screenshots the served page so /assets/
      images resolve (fixing the blank-screenshot bug); `1c shot --url <url>` screenshots
      any URL. Deterministic viewport presets (mobile|tablet|desktop) yield stable
      dimensions; PNG output.'
    justification: No existing story covers a screenshot primitive. Distinct user-visible
      command with distinct value (screenshot own/any rendered output) versus REQ-12's
      capture bundle. Depends on the BrowserDriver seam introduced by item 1 but is
      a separate capability, not a flag of capture.
    story_uid: story-3ae5b34e
  - index: 3
    component: 'Framework: art-direction language'
    item_type: feature
    story_points: 2
    dependencies: []
    description: Section-level `background` capability. site-schema adds a `Background`
      discriminated union on `type` (color→value | image→asset+fit | gradient→gradient),
      each with an optional overlay (hex color + 0..1 opacity), attached as an optional
      field on the module instance; malformed values fail with path-pointed errors.
      Framework `wrapWithBackground` stacks module markup in three layers (background
      / optional overlay / content) so text renders legibly over imagery; per-instance
      layer/overlay styles are framework-computed inline (no raw instance CSS), and
      static SECTION_CSS is folded into the per-site stylesheet. Backgrounds are scoped
      to their own section; modules without one are unchanged.
    justification: 'Sections could not carry backgrounds before — a genuinely new
      capability bucket (the biggest reproduction gap from the capture design: text
      over background images). Not an extension of an existing chrome/content module;
      it is a cross-cutting section primitive spanning schema + render pipeline.'
    story_uid: story-6af935e7
  - index: 4
    component: 'Framework: art-direction language'
    item_type: feature
    story_points: 2
    dependencies:
    - 3
    description: '`layer` module + z-compositing — free-positioned structured layout.
      site-schema adds Position (numeric x/y/z + width/height/rotate + per-breakpoint
      overrides), image treatments (shape circle/rounded, edge soft-mask/torn-asset),
      and a Layer (ordered positioned children + reflow + overlay) as an optional
      strict field on the module instance; a raw style/css prop is a path-pointed
      validation error. Framework LAYER_CSS + renderLayer/wrapWithLayer emit framework-computed
      CSS custom properties (never instance CSS); a registered `layer` host module
      gives standalone art-directed sections, and a layer composites over the host
      module''s own markup (z-compositing over another module). reflow=stack collapses
      absolute positioning to normal flow below a breakpoint.'
    justification: No prior story expresses free-positioned/layered composition —
      a new capability bucket (the first 'grow the language' art-direction primitive).
      Reuses the REQ-14 wrap pattern and depends on the overlay mechanism (item 3)
      but is a distinct positioning capability, not an extension of an existing module.
    story_uid: story-4f50c054
  - index: 5
    component: 'Framework: art-direction language'
    item_type: feature
    story_points: 2
    dependencies: []
    description: Structured motion primitive. site-schema adds a strict `motion` object
      (type fade|slide|scale|stagger; trigger load|scroll|hover; duration/delay ms;
      named easing enum — raw cubic-bezier rejected) attachable to a module instance
      and a layer child. Framework motion.ts renders MOTION_CSS (keyframes, hover
      transitions, a bounded stagger nth-child cascade, and a prefers-reduced-motion
      block that disables animation and forces scroll-revealed content visible) plus
      a self-contained IntersectionObserver island (MOTION_SCRIPT) injected once per
      page only when scroll motion is present; params flow into framework-computed
      --fc-motion-* custom properties only. A layer child's motion wraps its inner
      content so a keyframe never clobbers the child's positioning transform.
    justification: No prior story covers motion/animation — a new capability bucket
      (structured entrance/scroll-reveal/hover). Structured-only (named easing enum,
      no raw CSS) and content-safe under reduced motion; distinct from the background
      and layer primitives.
    story_uid: null
  - index: 6
    component: Site Definition Schema & Validation
    item_type: upgrade
    story_points: 1
    dependencies: []
    description: REQ-23 widens the module content-value contract so structured list
      content persists and validates. contentValueSchema is extended from string |
      assetRef | array to also permit object (a record of content values, recursively)
      and the scalars number and boolean — unblocking services-grid items, contact-form
      fields (field.required is a real boolean, maxLength a number), and footer links.
      assetRef precedes the generic record so asset values still type as AssetRef;
      moduleInstanceSchema's .strict() raw-prop rejection is untouched (no raw CSS/HTML
      escape hatch).
    justification: 'Extends the existing structural-validation capability bucket in
      place — the content-value shape is already owned by STORY-54 (AC-425/426, structure-only
      content validation). No new capability bucket, no parallel validator: contentValueSchema
      is widened, not replaced. Prefer upgrade because STORY-54 already documents
      the content-value contract but currently omits object/number/boolean forms.'
    story_uid: null
    target_story_ids:
    - story-6fc151b1
    acceptance_criteria_changes:
      add:
      - A module content value may be a structured object (a record of content values),
        so list-of-record content (services-grid items, contact-form fields, footer
        links) round-trips through validateSite
      - Scalar content values include number and boolean in addition to string
      - 'Widening content values preserves the raw-prop rejection: a style/css/html
        prop on a module instance is still a path-pointed validation error'
      modify: []
      remove: []
    intent_delta_summary: The content-value contract in STORY-54 is widened from string
      | assetRef | array to also permit object (record of content values) and the
      scalars number/boolean, while preserving the structure-only boundary and the
      strict raw-prop rejection.
  - index: 7
    component: 'Website Framework: Theming & Chrome Rendering'
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: Three in-place extensions to the framework theming & chrome-rendering
      story shipped in this bundle. (BUG-1) The render pipeline previously dropped
      each module's scoped <style> (Astro container renderToString returns HTML only),
      so theme.css carried only :root tokens and pages rendered unstyled; getModuleCss
      now extracts each catalogued module's raw <style> blocks and the render pipeline
      folds them into the per-site theme.css so rendered pages are fully styled. (REQ-24)
      generateThemeCss now emits @font-face rules from a structured theme.fonts declaration
      (family + mirrored asset src + optional weight/style/display) and always emits
      a --font-family-display custom property (falling back to the heading family);
      the header gains logoFont (heading|body|display) and logoTreatment (plain|gold)
      wordmark dials. (REQ-25) the header gains an `overlay` variant rendered as transparent
      chrome that the render pipeline floats over the immediately-following module's
      band (OVERLAY_BAND_CSS), so header + hero share one continuous background image
      band, reusing the REQ-14 overlay legibility mechanism.
    justification: All three extend the existing 'Theming & Module Catalog' bucket
      already owned by STORY-55 — theme-CSS generation (AC-433/434) and the header
      chrome module (AC-439). BUG-1 restores intended behavior (pages should be styled)
      and is a bug fix → upgrade. REQ-24 and REQ-25 extend theme-CSS emission and
      the header module in place (no @font-face or wordmark/overlay before), introducing
      no new capability bucket and no parallel stylesheet-generation or header implementation.
    story_uid: null
    target_story_ids:
    - story-a224111f
    acceptance_criteria_changes:
      add:
      - The per-site stylesheet includes module component CSS (each module's <style>
        folded into theme.css) so a rendered page is fully styled, not just token
        :root variables
      - Theme CSS emits an @font-face rule for each structured site-declared display
        font (family + mirrored woff2/ttf asset + optional weight/style/display) and
        always emits a --font-family-display custom property falling back to the heading
        family
      - The header exposes logoFont (heading|body|display) and logoTreatment (plain|gold)
        dials that style a text wordmark
      - 'The header supports an overlay variant: transparent chrome that the render
        pipeline composites over the immediately-following module''s background band
        as one continuous image band'
      modify: []
      remove: []
    intent_delta_summary: STORY-55 is extended with (a) module-component-CSS folding
      into the per-site stylesheet (BUG-1 fix), (b) @font-face emission + a display-font
      slot + header wordmark dials (REQ-24), and (c) a header overlay variant composited
      over a shared image band (REQ-25) — all extensions to the existing theme-CSS
      generation and header chrome module, no new bucket.
---

# Reconciliation Plan

**Mode**: commits
**Anchor**: bundle-f39884d2 (BUNDLE-2, type=bundle → used directly as subject_uid)
**Source**: 11 free-coded commits bundling BUG-1 + REQ-12/13/14/15/16/22/23/24/25 (+ a version-bump chore)

Code is ground truth. Stories/ACs are created or extended to match the diffs. No code changes.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commits: ffdd60c1(BUG-1), 306c2108(REQ-12), 19fdbf37(REQ-13), cf26a7d5(REQ-14), 80a7b735(REQ-15), 60b2a712(REQ-16), 6328691d(REQ-22), 1f7213dc(REQ-23), 98569bf2(chore), 492684e3(REQ-24), 94cd1ecf(REQ-25)"
  features:
    - name: "1c capture page <url> (REQ-12)"
      description: "Rendered-only reference capture via headless browser; writes a self-contained gitignored capture bundle"
      behaviors:
        - "BrowserDriver seam (CF-shaped) over local Playwright, injectable fake for tests"
        - "navigate live -> intercept-cache every response -> query computed signals -> full-page screenshot"
        - "capture.json: var()-resolved colors, fonts+files, type/spacing/container, style-signature-segmented sections, verbatim content runs, assets"
        - "background incl. text-over-image overlay captured; hidden elements filtered out"
        - "offline re-extraction from the written bundle; retry on browser failure, never static fallback"
      entry_point: "tools/generate/src/cli/capture/*, cli/index.ts dispatch"
    - name: "1c shot (REQ-13)"
      description: "Screenshot primitive over the BrowserDriver seam (AI eyes)"
      behaviors:
        - "shot <slug> renders + serves over loopback + screenshots served page (assets resolve)"
        - "shot --url screenshots any URL"
        - "deterministic viewport presets (mobile|tablet|desktop) -> stable dimensions; PNG out"
      entry_point: "tools/generate/src/cli/shot.ts"
    - name: "section background (REQ-14)"
      description: "Section-level color|image|gradient background + overlay, text-over"
      behaviors:
        - "schema Background discriminated union + optional overlay on module instance; malformed -> path-pointed error"
        - "wrapWithBackground three-layer stack (bg/overlay/content); SECTION_CSS folded into theme.css; scoped per-section"
      entry_point: "packages/framework/src/modules/background.ts; site-schema schema.ts"
    - name: "layer module + z-compositing (REQ-15)"
      description: "Structured free-positioned layered layout"
      behaviors:
        - "schema Position (x/y/z + size/rotate + per-breakpoint), treatments, Layer strict field; raw-css rejected"
        - "LAYER_CSS + wrapWithLayer emit computed custom props; standalone layer host module; composites over host; reflow=stack"
      entry_point: "packages/framework/src/modules/layer.ts + layer/"
    - name: "structured motion (REQ-16)"
      description: "Entrance/scroll-reveal/hover motion as structured params"
      behaviors:
        - "schema motion (type/trigger/duration/delay/named-easing) on instance + layer child; raw easing rejected"
        - "MOTION_CSS (keyframes, hover, stagger, prefers-reduced-motion) + IntersectionObserver island injected once per page when scroll motion present"
      entry_point: "packages/framework/src/modules/motion.ts"
    - name: "storage/ consolidation (REQ-22) [refactor]"
      description: "Move sites/sandbox/dist/references under storage/ via central path builders; gitignore retargeted; git mv preserves history"
      behaviors:
        - "1c new -> storage/sites/<slug>/; render -> storage/dist/; capture -> storage/references/"
      entry_point: "tools/generate/src/store/paths.ts, cli/capture/bundle.ts, cli/commands.ts"
    - name: "structured content values (REQ-23)"
      description: "contentValueSchema widened to string|number|boolean|assetRef|array|record"
      behaviors:
        - "list-of-object content (services-grid items, contact-form fields, footer links) round-trips validateSite"
        - "scalar number/boolean content values; strict raw-prop rejection preserved"
      entry_point: "packages/site-schema/src/schema.ts"
    - name: "display font + @font-face (REQ-24)"
      description: "@font-face emission from structured theme.fonts + display-font slot + header wordmark dials"
      behaviors:
        - "generateThemeCss emits @font-face + --font-family-display (heading fallback)"
        - "header logoFont (heading|body|display) + logoTreatment (plain|gold) dials"
      entry_point: "packages/framework/src/tokens/css.ts; modules/header, dials.ts"
    - name: "header overlay variant (REQ-25)"
      description: "Header composited over the following section's shared image band"
      behaviors:
        - "header overlay variant = transparent chrome; render pipeline floats it over the next band (OVERLAY_BAND_CSS)"
        - "reuses hero bg-image / REQ-14 background + overlay legibility; no raw CSS"
      entry_point: "packages/framework/src/modules/overlay.ts, header/; render.ts"
    - name: "version bump chore (98569bf)"
      description: "0.0.14 -> 0.0.15 package.json bump for REQ-22"
      behaviors: ["no capability"]
      entry_point: "package.json"
```

## Coverage Map

```yaml
coverage_map:
  - feature: "1c capture page (REQ-12)"
    status: uncovered
    existing_stories: []
    gaps: ["no story for reference capture / BrowserDriver seam / capture bundle"]
    -> item 1 (feature)
  - feature: "1c shot (REQ-13)"
    status: uncovered
    existing_stories: []
    gaps: ["no story for a screenshot primitive"]
    -> item 2 (feature, dep 1 for the shared driver seam)
  - feature: "section background (REQ-14)"
    status: uncovered
    existing_stories: []
    gaps: ["sections had no background capability; new cross-cutting primitive"]
    -> item 3 (feature)
  - feature: "layer module (REQ-15)"
    status: uncovered
    existing_stories: []
    gaps: ["no free-positioned/layered composition primitive"]
    -> item 4 (feature, dep 3)
  - feature: "structured motion (REQ-16)"
    status: uncovered
    existing_stories: []
    gaps: ["no motion/animation capability"]
    -> item 5 (feature)
  - feature: "structured content values (REQ-23)"
    status: partial
    existing_stories: ["story-6fc151b1 (STORY-54)"]
    existing_acs: ["AC-425", "AC-426"]
    gaps: ["content-value contract omits object/number/boolean"]
    -> item 6 (upgrade STORY-54)
  - feature: "module CSS folding (BUG-1) + display font (REQ-24) + header overlay (REQ-25)"
    status: partial
    existing_stories: ["story-a224111f (STORY-55)"]
    existing_acs: ["AC-433", "AC-434", "AC-439"]
    gaps: ["theme.css carried only tokens (no module CSS); no @font-face/display slot/wordmark dials; no header overlay variant"]
    -> item 7 (upgrade STORY-55)
  - feature: "storage/ consolidation (REQ-22)"
    status: refactor (no matrix change)
    existing_stories: []
    notes: ["pure path relocation, no user-visible capability; the generate CLI (REQ-9/11) is itself unreconciled and owns these paths; documented as observation, no plan item"]
  - feature: "version bump (98569bf)"
    status: chore
    notes: ["no capability; no plan item"]
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Capture / headless-browser vision | feature | 3 | - | `1c capture page` rendered-only reference capture + BrowserDriver seam + capture bundle (REQ-12) |
| 2 | Capture / headless-browser vision | feature | 1 | 1 | `1c shot` screenshot primitive over the driver seam (REQ-13) |
| 3 | Framework: art-direction language | feature | 2 | - | Section background (color/image/gradient + overlay, text-over) (REQ-14) |
| 4 | Framework: art-direction language | feature | 2 | 3 | `layer` module + z-compositing, structured free-positioned layout (REQ-15) |
| 5 | Framework: art-direction language | feature | 2 | - | Structured motion (entrance/scroll-reveal/hover) (REQ-16) |
| 6 | Site Definition Schema & Validation | upgrade | 1 | - | Widen content-value contract to object/number/boolean (REQ-23) → STORY-54 |
| 7 | Website Framework: Theming & Chrome Rendering | upgrade | 3 | - | Module-CSS folding (BUG-1) + @font-face/display slot + header wordmark dials (REQ-24) + header overlay variant (REQ-25) → STORY-55 |

**Totals**: 7 items — feature: 5, upgrade: 2 — 14 points.

## Observations

- **REQ-22 (storage/ consolidation) is a pure refactor** — path relocation via central builders with no user-visible capability change. Reconciliation produces only feature/upgrade items and a refactor changes neither stories nor ACs, so it gets no plan item. It is worth noting that the generate CLI itself (`1c new/render/serve/list`, from REQ-9/REQ-11) has no story in the current matrix — these commands and their storage paths are unreconciled. That is outside this bundle's scope; flagged for a future reconciliation of the generate CLI surface.
- **Three framework primitives kept as three features** (background/layer/motion) rather than collapsed into one. Each is a genuinely distinct capability bucket with its own schema types, framework module, wrap-in-render integration, and UATs — a user would want them independently. They share the wrapWith*/*_CSS pattern (coherence), and layer depends on background's overlay (dependency 3→4). Not inflation: none is a flag/option of another.
- **Capture and shot kept as two features** sharing the BrowserDriver seam (dependency 1→2). Capture writes a reference bundle; shot screenshots served/any output. Distinct commands, distinct value.
- **BUG-1 folded into the STORY-55 upgrade** as a bug fix (a bug = existing intent not behaving as intended → upgrade). STORY-55 already implies fully-styled rendered pages; the fix restores that. Grouped with REQ-24/REQ-25 because all three extend the same theme-CSS-generation + header-chrome-module surface owned by STORY-55.
- **Schema touch-points across features**: REQ-14/15/16 each add optional strict fields to the module instance schema; those schema additions ride their owning feature story (they arrive with the capability), whereas REQ-23 widens the *core* contentValueSchema primitive and therefore upgrades the structural-validation story (STORY-54) directly.
- **Two duplicate-titled schema capabilities exist** (CAP-49 capability-9a061909 and CAP-50 capability-785f2608, both 'Site Definition Schema & Validation'). STORY-54 hangs off capability-785f2608; the REQ-23 upgrade targets STORY-54 regardless. The duplicate capability is pre-existing and out of scope for this reconciliation.
- **Version-bump commit 98569bf** is a chore with no capability surface; no plan item.