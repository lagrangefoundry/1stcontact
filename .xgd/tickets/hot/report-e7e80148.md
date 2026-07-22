---
uid: report-e7e80148
id: REPORT-715
type: report
title: 'Reconciliation Plan: framework pivot (REQ-79 L1) + values-diff coverage (REQ-63)'
created_by: xgd
created_at: '2026-07-22T19:28:18.067778+00:00'
updated_at: '2026-07-22T19:55:27.622295+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-31e474b9
  anchor_uid: bundle-31e474b9
  items:
  - index: 1
    component: L1 Layout Substrate + Safety Envelope
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'The L1 low-level, CSS-faithful layout substrate (REQ-82, commit
      b5138953). A typed element tree (container/box/text/image/slot) carrying the
      captured axes as literals, per-viewport geometry keyframes with per-segment
      interpolate|snap flags, and structure primitives (containers stack|row|grid,
      per-axis sizing fixed|fluid|hug, distribution, visibility). Envelope validator
      (validateL1): typed scalar/enum axes, finite ranges (fontSize 1-400, weight
      1-1000, geometry +/-100k), hex-only colours, image-src URL-scheme allowlist,
      strict objects (no freeform CSS/HTML/JS), tree-depth cap 32 and node-count cap
      2000, keyframe widths subset of declared widths. renderL1Document/renderL1Page
      is the single safe emitter (escaped text, re-checked hex colours, sanitised
      font-family, numeric lengths, unsafe src dropped; geometry keyframes compile
      to media-queried calc()/snap; containers to flex/grid). Round-trip gate wired
      to the capture/values-diff spine measuring capture(render(L1)) ~= L1 on the
      authored Type-A axes.'
    justification: No existing story or capability describes L1. The 8 stories cover
      1c capture/diff tooling and layout-module-dial reproduction; none cover a typed
      layout substrate, its by-construction security envelope, or the single safe
      renderer. This is the load-bearing new capability of the framework pivot.
    story_uid: story-d0a8cfad
  - index: 2
    component: Capture -> L1 Fold + Structural Hints
    item_type: feature
    story_points: 3
    dependencies:
    - 1
    description: 'Mechanical capture->L1 reproduction (REQ-83, commit 7131f5e; adopt-values
      dissolution, commit 94365416). `1c capture page <url>` now folds the 6-width
      sampled ladder into ONE L1 document (l1.json) via foldToL1 (node matching across
      widths reusing responsive-diff alignment; emits geometry keyframes with interpolate|snap
      flags -- fluid width -> interpolate, column reflow -> snap -- and a visibility
      rule from presence), while retaining the multistate.json ladder as the acceptance
      oracle. A separate structural-hint pass emits hints.json: advisory-only signals
      (ancestry/parent-id, sibling-repetition, parent computed layout display/flex-direction/justify/gap/grid-template-columns,
      authored sizing unit %/fr/auto/clamp vs px, position mode, real @media breakpoints,
      semantic tags) read for DIRECTION never EXECUTION. The pre-L1 adopt-values reproduction
      command (capture bundle -> snap flat axes into old-model styled content) is
      dissolved as a vestige superseded by the fold; adopt-gaps (REQ-74) is untouched.'
    justification: No existing story covers folding a multi-viewport capture into
      a single L1 document, retaining the oracle ladder, or extracting advisory structural
      hints. This is a new capability that makes reproduction near-mechanical. The
      adopt-values removal is documented here because the fold is what replaces it.
    story_uid: story-8acc338d
  - index: 3
    component: Capability Modules (contract, carousel, contact-form, shipped client
      JS)
    item_type: feature
    story_points: 3
    dependencies:
    - 1
    description: 'The post-pivot capability-module contract (REQ-85, commits a1f739b,
      0e70641, 0f3f5b1, 3b65fc8). CapabilityMeta = vetted core (framework code; AI
      never writes) + typed behavioural config + named L1 presentation slots + conformance
      obligations. validateCapabilityConfig/Slots/Instance validate slot content as
      L1 subtrees (the security line). Carousel and contact-form reframed onto it:
      carousel = pure-CSS scroll-snap (view + controls) with slides as L1 slots and
      vetted autoplay/loop as shipped client behaviour; contact-form keeps its functional
      core (field schema, honeypot, Turnstile, no-JS POST) with intro/submit presentation
      moved to L1 slots. Capability client JS becomes a first-class shipped asset:
      getModuleClientJs() folds each capability''s self-contained defensive client.js
      into capabilities.js, referenced once as <script type=module> (fixes the dev-path
      island-script 404 that silently broke enhancement). New ''isolation'' conformance
      dimension: schema-valid-but-degenerate config/slots must degrade inertly (render
      without throwing, page stays structurally intact).'
    justification: No existing story or capability describes a module contract, capability
      config/slots, or the conformance harness. Carousel was added as a layout module
      (9ca73953) then reframed; its durable form is a capability module. This is a
      genuinely new capability bucket, not an extension of any reproduction-value
      story.
    story_uid: story-179b8c06
  - index: 4
    component: End-to-End 3-Probe Reproduction Gate
    item_type: feature
    story_points: 3
    dependencies:
    - 1
    - 2
    description: 'The reproduction acceptance boundary (REQ-86, commit b7d32cc). probes.ts
      is an analytic, browser-free layout evaluator that mirrors the renderer''s interpolate/snap
      geometry math and CSS flow stacking and estimates text natural height, emitting
      per-leaf boxes + overlap/clip findings. Three acceptance probes: sampleFidelity
      (evaluated geometry vs the retained oracle at the 6 captured widths, within
      tolerance), offSample (envelope holds -- no overlap/clip -- at intermediate
      500/900px), contentRobustness (envelope holds under perturbed/longer content).
      threeProbeGate runs all three on the absolute-base / structure-overlay split
      and names the framework gap behind each residual. promoteToFlow performs demand-driven
      structure recovery: wraps ONLY the pinned sibling groups that fail content-robustness
      into flow stack containers, leaving passing regions absolute.'
    justification: No existing story covers the end-to-end 3-probe acceptance gate
      or demand-driven flow promotion. It is a distinct new capability wiring the
      L1 pipeline behind an executable acceptance definition (sample + off-sample
      + content-perturbation).
    story_uid: null
  - index: 5
    component: 1c Values-Diff Fidelity
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'Closes further values-diff CSS coverage blind spots (REQ-63, commit
      8c0c6363) and corrects a fontLoad false-positive (part of commit 9ca73953).
      New additive capture+diff axes, each only reducing false negatives: typography
      per text run (font-style, text-decoration, text-transform, font-variant small-caps,
      list-style-type marker); effects per element (backdrop-filter + outline presence,
      mix-blend-mode + ::before/::after pseudo-content, element opacity value); border
      (line style dashed/dotted/solid joins width+colour; box border captured on text
      runs via thickest painted side); media (object-position). Separately, values-diff
      drops the REQ-64 reverse fontLoad direction: a reference fontLoaded:false is
      a capture-side FOUT artifact, not design intent, so a correct render is no longer
      flagged as a HIGH defect.'
    justification: STORY-75 already documents values-diff closing capture blind spots
      (rendered-text extent, composited surface fill, box border, duplicate-text pairing)
      within CAP-63. REQ-63 extends the SAME capability bucket with more render-affecting
      axes; the fontLoad change corrects a diff-direction defect in the same pipeline.
      No new capability bucket is introduced -- this is a strict extension of the
      blind-spot-closure capability, so it is an upgrade, not a feature.
    story_uid: null
    target_story_ids:
    - STORY-75
    acceptance_criteria_changes:
      add:
      - values-diff captures and compares font-style, text-decoration, text-transform,
        font-variant (small-caps) and list-style-type marker per text run
      - values-diff captures and compares backdrop-filter/outline presence, mix-blend-mode
        and pseudo-content, and element opacity
      - border comparison includes line style (dashed/dotted/solid) and captures the
        box border on text runs via the thickest painted side
      - values-diff captures and compares object-position (image crop within its box)
      - a reference fontLoaded:false does not flag a correct render as a defect (capture-side
        FOUT artifact, not design intent)
      modify: []
      remove: []
    intent_delta_summary: Broaden STORY-75's blind-spot-closure capability with additional
      render-affecting axes (typography treatments, effects, border style, object-position)
      and correct the fontLoad false-positive so 0 value-diffs remains a trustworthy
      verdict.
    story_uid_note: null
  - index: 6
    component: Framework Absolute-or-Overlay Value System
    item_type: upgrade
    story_points: 2
    dependencies:
    - 1
    description: 'The absolute-or-overlay value model (colour/length/radius: literal
      OR named overlay) was delivered through layout-module dials on services-grid/text-block/contact-form/hero/header/footer.
      REQ-84 (commit 1a2faeee) deleted those modules and their ~20 dials; the ''absolute
      value OR role'' concept is re-homed in L1 leaf axes (each L1 axis carries a
      validated literal, per item 1). The module-dial delivery of this capability
      (AC-660..665) is superseded -- an intentional supersession per the REQ-79 reconciliation
      note and the REQ-85 superseded-AC list, not a lost-work overwrite.'
    justification: 'STORY-80 documents the same capability (absolute-or-overlay values),
      but its delivery mechanism (module dials) no longer exists in code. This is
      explicit supersession declared by the current intent (REQ-79/84/85), so the
      story is upgraded in place: module-dial ACs removed, capability repointed to
      L1 leaf axes (item 1). No new capability bucket is introduced; the capability
      itself survives, only its delivery moves.'
    story_uid: null
    target_story_ids:
    - STORY-80
    acceptance_criteria_changes:
      add:
      - the absolute-or-overlay value affordance (a literal value OR a named role)
        is carried by L1 leaf axes, validated by the envelope (see L1 substrate story)
      modify: []
      remove:
      - AC-660
      - AC-661
      - AC-662
      - AC-663
      - AC-664
      - AC-665
    intent_delta_summary: Module-dial delivery of absolute-or-overlay colour/length/radius
      values is superseded by the framework pivot; the capability is re-homed in L1
      leaf literals. Remove the module-dial ACs and repoint the capability to L1.
    story_uid_note: null
  - index: 7
    component: Framework Responsive Per-Breakpoint Dials
    item_type: upgrade
    story_points: 2
    dependencies:
    - 1
    - 2
    description: Per-breakpoint length dials and the header navCollapse dial were
      layout-module features (header + spacing-bearing modules), deleted by REQ-84
      (commit 1a2faeee). Per-viewport variation is now delivered by L1 geometry keyframes
      (per-viewport values folded from the capture ladder with interpolate|snap segments,
      per items 1-2). navCollapse depended on the deleted header module and is removed
      entirely. The per-breakpoint module-dial delivery (AC-666..670) and the navCollapse/schema
      ACs (AC-671, AC-673) are superseded.
    justification: STORY-81 documents responsive per-breakpoint values, whose module-dial
      delivery no longer exists. This is explicit supersession by the current intent;
      the responsive-across-widths capability survives as L1 geometry keyframes (items
      1-2). Upgrade in place, no new bucket.
    story_uid: null
    target_story_ids:
    - STORY-81
    acceptance_criteria_changes:
      add:
      - per-viewport value variation is delivered by L1 geometry keyframes (per-width
        values + interpolate|snap segments) rather than per-breakpoint module dials
      modify: []
      remove:
      - AC-666
      - AC-667
      - AC-668
      - AC-669
      - AC-670
      - AC-671
      - AC-673
    intent_delta_summary: Per-breakpoint module dials and navCollapse are superseded
      by the pivot; per-viewport variation is re-homed in L1 geometry keyframes and
      navCollapse (header module) is removed. Remove the module-dial ACs and repoint
      to L1 keyframes.
    story_uid_note: null
  - index: 8
    component: Framework Reproduction Module Treatments
    item_type: upgrade
    story_points: 2
    dependencies:
    - 1
    - 3
    description: 'The module-level reproduction treatments were split by the pivot.
      services-grid cardVeil/cardBorder (AC-674/675) and footer copyright/textColor/linkColor
      overrides (AC-679/680/681) were deleted with their modules (REQ-84) -- that
      presentation is now owned by L1 leaf axes (item 1). contact-form fieldLabels=placeholder
      / submitInline / submitColor (AC-676/677/678) migrate to the capability-module
      model: behavioural config on the contact-form capability with presentation authored
      as L1 slots (item 3). The module-delivered treatment ACs are superseded (intentional,
      per REQ-79/REQ-85).'
    justification: 'STORY-82 documents module authoring treatments whose delivery
      modules were deleted or reframed. Explicit supersession by the current intent:
      the treatment CAPABILITY survives (card look in L1; contact-form presentation
      as capability config + L1 slots) but the module-dial mechanism is gone. Upgrade
      in place; no new bucket.'
    story_uid: null
    target_story_ids:
    - STORY-82
    acceptance_criteria_changes:
      add:
      - contact-form field-labelling, single-row submit, and submit colour are expressed
        as capability config + L1 presentation slots (see Capability Modules story)
      - card/band/footer visual treatments (veil, border, text/link colour) are expressed
        via L1 leaf axes rather than module dials
      modify: []
      remove:
      - AC-674
      - AC-675
      - AC-676
      - AC-677
      - AC-678
      - AC-679
      - AC-680
      - AC-681
    intent_delta_summary: services-grid/footer treatments are re-homed in L1 leaf
      axes; contact-form treatments become capability config + L1 slots. Remove the
      module-treatment ACs and repoint to L1 / the capability model.
    story_uid_note: null
  - index: 9
    component: 1c CLI Argument Parsing & Output Hygiene
    item_type: upgrade
    story_points: 1
    dependencies: []
    description: aligned-crops sandbox routing (commit 09fa7cf5). `1c aligned-crops
      --sandbox` previously rendered and served from sites/ even under --sandbox,
      so a sandbox reproduction diffed an absent/stale site against the reference
      and the perceptual crops could not run at all. A pure subRenderOptions() now
      forwards source+sandbox+cwd to both cmdRender and startServe, so the sandbox
      reproduction is rendered/served and the crop pairs are emitted from it.
    justification: STORY-79 documents 1c CLI argument/flag handling within CAP-66
      (boolean flags keep positionals, --json hygiene). The --sandbox forwarding is
      the same class of behaviour -- a CLI flag correctly plumbed from a subcommand
      into its internal render+serve calls. Extends the existing CLI story; no new
      capability bucket.
    story_uid: null
    target_story_ids:
    - STORY-79
    acceptance_criteria_changes:
      add:
      - 1c aligned-crops --sandbox forwards source+sandbox+cwd to its internal render
        and serve so the perceptual crops run on the sandbox reproduction (not an
        absent/stale sites/ build)
      modify: []
      remove: []
    intent_delta_summary: Extend the 1c CLI flag-plumbing story so --sandbox reaches
      the aligned-crops command's internal render+serve.
    story_uid_note: null
---

# Reconciliation Plan

**Mode**: commits
**Anchor**: bundle-31e474b9 (BUNDLE-7) -- REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + REQ-85 + REQ-86
**Subject**: bundle-31e474b9 (bundle is a first-class reconcile intent)

## Intent (Step 0)

The bundle is dominated by the **REQ-79 framework pivot**: replace the 8 semantic *layout* modules with a single typed **L1 layout substrate** whose value is a security/robustness/cross-browser *safety envelope* (not aesthetic rails), and reduce the module catalog to *capability* modules (carousel, contact-form). Plus **REQ-63**, an independent values-diff coverage audit.

Key nuance from the ticket comments (load-bearing for classification):
- The REQ-79 reconciliation note declares that the strip-layout deletions of services-grid/text-block/footer dials are **intentional supersession, NOT lost-work overwrites** -- do not flag as CRITICAL.
- The REQ-85 comment enumerates the exact **superseded reconciliation ACs**: AC637 (text-fill gradient via module), AC660-665 (colour/length/radius dials), AC666-670 (per-breakpoint dials), AC676-678 (contact-form treatments). The capability is *preserved in L1, re-expression tracked*.
- REQ-85 correction: capability modules **ship vetted client code**; carousel autoplay/loop restored via a shipped client.js.

## Behavior Inventory (Step 1)

```yaml
source: "commits mode: 14 free-coded commits on bundle-31e474b9"
features:
  - name: "values-diff CSS coverage expansion (REQ-63, 8c0c6363)"
    behaviors: [font-style/decoration/transform/variant/list-marker per run, backdrop-filter/outline/blend/pseudo/opacity effects, border line-style + box-border on text runs, object-position]
  - name: "fontLoad false-positive fix (part of 9ca73953)"
    behaviors: [reference fontLoaded:false no longer flags a correct render]
  - name: "aligned-crops --sandbox routing (09fa7cf5)"
    behaviors: [subRenderOptions forwards source+sandbox+cwd to render+serve; sandbox crops emitted]
  - name: "L1 layout substrate + envelope (REQ-82, b5138953)"
    behaviors: [typed element tree, geometry keyframes interpolate|snap, validateL1 envelope, renderL1Document single safe emitter, round-trip gate]
  - name: "capture->L1 fold + hints (REQ-83, 7131f5e)"
    behaviors: [foldToL1 to l1.json, oracle ladder retained, hints.json advisory structural signals]
  - name: "adopt-values dissolved (94365416)"
    behaviors: [pre-L1 adopt-values command + edit.ts logic removed; adopt-gaps untouched]
  - name: "strip layout modules (REQ-84, 1a2faeee)"
    behaviors: [delete header/hero/footer/text-block/services-grid/layer + helpers + ~20 dials; catalog reduces to carousel+contact-form]
  - name: "capability-module contract (REQ-85, a1f739b/0e70641/0f3f5b1/3b65fc8)"
    behaviors: [CapabilityMeta core+config+slots, validateCapability*, carousel+contact-form reframed, isolation conformance dimension, shipped capabilities.js client JS, carousel autoplay/loop restored]
  - name: "3-probe reproduction gate (REQ-86, b7d32cc)"
    behaviors: [analytic layout evaluator, sampleFidelity/offSample/contentRobustness probes, threeProbeGate, demand-driven promoteToFlow]
  - name: "added-then-deleted layout dials (part of 9ca73953, 65b25822, 514b3198)"
    behaviors: [services-grid/carousel/text-block section surfaceFill, footer textWeight -- ALL deleted by REQ-84; no durable capability]
```

## Coverage Map (Step 3)

```yaml
coverage_map:
  - feature: values-diff coverage expansion + fontLoad fix
    status: partial
    existing_stories: [STORY-75]  # CAP-63 values-diff blind spots
    action: upgrade (extend same bucket) -> item 5
  - feature: aligned-crops --sandbox routing
    status: partial
    existing_stories: [STORY-79]  # CAP-66 1c CLI arg/flag handling
    action: upgrade -> item 9
  - feature: L1 substrate + envelope
    status: uncovered
    action: feature -> item 1
  - feature: capture->L1 fold + hints (+ adopt-values removal)
    status: uncovered
    action: feature -> item 2
  - feature: capability-module contract + carousel/contact-form + client JS
    status: uncovered
    action: feature -> item 3
  - feature: 3-probe reproduction gate
    status: uncovered
    action: feature -> item 4
  - feature: absolute-or-overlay values (module dials)
    status: partial (superseded)
    existing_stories: [STORY-80]  # AC-660..665 module-dial delivery deleted
    action: upgrade (remove module-dial ACs, re-home in L1) -> item 6
  - feature: per-breakpoint dials + navCollapse (module)
    status: partial (superseded)
    existing_stories: [STORY-81]  # AC-666..671,673
    action: upgrade (remove, re-home in L1 keyframes) -> item 7
  - feature: module reproduction treatments
    status: partial (superseded)
    existing_stories: [STORY-82]  # AC-674..681
    action: upgrade (remove; L1 axes + capability config/slots) -> item 8
  - feature: added-then-deleted surfaceFill/textWeight dials
    status: not-documented (transient, intentional supersession)
    action: none (see Observations)
```

## Plan Items

| # | Component | Type | Pts | Deps | Description |
|---|-----------|------|-----|------|-------------|
| 1 | L1 Layout Substrate + Safety Envelope | feature | 3 | - | REQ-82 typed tree, envelope validator, single safe renderer, round-trip gate |
| 2 | Capture -> L1 Fold + Structural Hints | feature | 3 | 1 | REQ-83 foldToL1, oracle retention, advisory hints; adopt-values dissolved |
| 3 | Capability Modules | feature | 3 | 1 | REQ-85 CapabilityMeta, carousel/contact-form reframe, isolation conformance, shipped client.js |
| 4 | 3-Probe Reproduction Gate | feature | 3 | 1,2 | REQ-86 analytic probes, threeProbeGate, demand-driven promoteToFlow |
| 5 | 1c Values-Diff Fidelity | upgrade | 3 | - | REQ-63 new axes + fontLoad fix -> STORY-75 |
| 6 | Absolute-or-Overlay Value System | upgrade | 2 | 1 | module dials superseded, re-homed in L1 -> STORY-80 |
| 7 | Responsive Per-Breakpoint Dials | upgrade | 2 | 1,2 | superseded, re-homed in L1 keyframes -> STORY-81 |
| 8 | Reproduction Module Treatments | upgrade | 2 | 1,3 | superseded; L1 axes + capability config/slots -> STORY-82 |
| 9 | 1c CLI Argument Parsing & Output Hygiene | upgrade | 1 | - | aligned-crops --sandbox routing -> STORY-79 |

## Observations (Step 3b + judgment calls)

- **Story count = 9** for a 14-commit major architectural pivot: 4 new features (the L1 pipeline phases the operator themselves treated as REQ-82/83/85/86) + 5 upgrades. Not inflated -- supersessions are grouped at the natural per-affected-story granularity, no per-flag stories.
- **Strip-layout deletion (REQ-84, 1a2faeee) has no standalone item.** Its reconciliation effect *is* the supersession captured by items 6/7/8 (removing the stale module-dial ACs from STORY-80/81/82). There is no new positive capability from a deletion.
- **Added-then-deleted dials are deliberately NOT documented.** services-grid/carousel/text-block section surfaceFill (9ca73953/65b25822) and footer textWeight (514b3198) were added under the abandoned joyful import and deleted by REQ-84 the next day. Per the REQ-79 reconciliation note this is intentional supersession, not overwrite -- they leave no durable capability, so no matrix entry. The carousel *module* from 9ca73953 survives (reframed as a capability, item 3); the fontLoad fix survives (item 5).
- **adopt-values removal (94365416)** documents no new capability (it removes a pre-L1 command with no owning story); it is folded into item 2 because the capture->L1 fold is what supersedes it. adopt-gaps (REQ-74) is explicitly untouched.
- **AC637 (text-fill gradient via module)** is in STORY-76 (gradients), not in the three stories above. Gradient *capture/diff* survives untouched (measurement spine); only the module-authoring vehicle is gone. Judged too minor to warrant a STORY-76 upgrade in this reconcile -- flagged here rather than acted on. Revisit if the regression flags STORY-76.
- **Case 2 (explicit supersession) applies throughout.** STORY-80/81/82 upgrades are warranted because the *current* intent (REQ-79/84/85) explicitly declares the change and enumerates the superseded ACs -- this is not silent drift (Case 3). The capability survives; only its delivery moves from module dials to L1 leaf axes / geometry keyframes / capability config+slots.
- **Uncertainty**: items 6/7/8 remove most ACs from their target stories. This is faithful to code (the modules are deleted) and prevents stale module-dial stories from corrupting the matrix, but the downstream story cycle should confirm the re-homed-in-L1 ACs are adequately owned by items 1-3 before removing, so no capability is orphaned.