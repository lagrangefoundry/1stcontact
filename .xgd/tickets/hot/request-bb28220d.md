---
uid: request-bb28220d
id: REQ-48
type: request
title: 'Fidelity gate: extend beyond the static single-state frame — motion/interaction,
  layering/compositing, treatments, media, multi-viewport, cross-engine (successor
  to REQ-47)'
created_by: xgd
created_at: '2026-07-07T02:57:33.983265+00:00'
updated_at: '2026-07-09T23:59:27.117207+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  story_points: 13
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 0805f9c758553b2fb8a29d2a2a40529f0198ca83
    reconcile_sha: null
    main_sha: null
  - working_sha: def150456ad3ea0536ca3ef6cc8c21a00ad39591
    reconcile_sha: null
    main_sha: null
  - working_sha: b73ecc634b7e43d2dc4eed5cc66adac4a4692df7
    reconcile_sha: null
    main_sha: null
  - working_sha: a8eae22bd96f322e757fcb41da9a23ff3898bb58
    reconcile_sha: null
    main_sha: null
  - working_sha: 78d20cedb88121d635cdce69527914b051090c10
    reconcile_sha: null
    main_sha: null
  - working_sha: 29e80bc5b835c2196853868f8ad78a6980061d93
    reconcile_sha: null
    main_sha: null
  - working_sha: b63e9e815299387fe4616cd75e8bc815e3eb626c
    reconcile_sha: null
    main_sha: null
  - working_sha: 6ef4c9a96f52821ba78c05687503999078560941
    reconcile_sha: null
    main_sha: null
  - working_sha: a0d7e63d0ac2f91534ea8c526ef7856225428485
    reconcile_sha: null
    main_sha: null
  - working_sha: afb8f2593f572a8124a07649bb382e7f5f0db60b
    reconcile_sha: null
    main_sha: null
  - working_sha: 2a2a7ba8973221250a6b44d35abe14e9a66aea87
    reconcile_sha: null
    main_sha: null
  - working_sha: 22446c3a8dea55fc8ff0af3c407142775531cff3
    reconcile_sha: null
    main_sha: null
  version: 0.0.60
  bundled_in: bundle-df065afc
---

## Scope

Successor to [[REQ-47]] (delivered: severity-ranked structural diff over a richer rendered projection — per-element geometry, shape, a11y containment, arrangement, over-emit + severity taxonomy). REQ-47 fixed the *static-frame* blind spots that let the gigabytealchemy misses (hero 195px position, placeholder-vs-label, inline-vs-stacked) sail past. But REQ-47 compares **one static, motion-frozen, single-viewport, single-engine rendered frame**. A cross-transcript review of every import/ceiling benchmark ([[REQ-20]] gigabytealchemy, [[REQ-21]] faelan, [[REQ-36]] joyfulculinary, [[REQ-19]] ceiling) shows the remaining fidelity differences all live on axes that single frame **cannot contain**. This ticket extends the fidelity gate along those axes.

**Core finding:** the art-directed benchmark (faelan) repeatedly hit differences the mechanical gate called "clean / 6 matched" while the pixels were visibly wrong — *"the values-diff is structurally blind to exactly the deltas that are obvious to you… it called an ellipse-portrait, mis-rotated collage, and doubled footer 'excellent'."* REQ-47 closed the 2D-static subset; the rest is motion, depth, treatment, viewport, and engine.

## Tier 1 — diff-tool itself (highest impact; extend REQ-47's projection + capture)

1. **Motion & interaction states.** REQ-47 has no time axis and never actuates states — *"hover can't be screenshotted"*; hover-scale / carousel / scroll-reveal / parallax leave zero signal in a resting frame. Extend the capture from single-state to multi-state:
   - project + diff at `:hover` / `:focus` / `:active`, not just rest;
   - project **transforms** (`rotate` / `scale` / `transform-origin`) as first-class — `transform-origin: top-left` vs center displaced whole photos and is absent from the schema today; record the *effective* post-transform box;
   - capture animation/transition specs (entrance, scroll-reveal, hover-transition, `background-attachment: fixed` parallax);
   - **freeze-determinism precondition** (`prefers-reduced-motion` / fixed snapshot) or the whole gate is flaky.
   - *(This item alone changes capture from single- to multi-state and cross-links [[REQ-16]]; it is the largest sub-scope and may warrant its own split.)*

2. **Layering / z-order / overlay / scrim.** REQ-47's arrangement is 2D-plane only — no paint-order axis, so correctly-positioned-but-wrongly-stacked is invisible (faelan: hand-fixed `violin < alley < torn < circle < text`). Plus a proven **false-negative**: an overlay nested in a layer background renders identically (`#000000 @ 0.3`) but is uncompared / mis-flagged. Add per-element z-order + overlay / scrim / background-gradient as explicit projected fields.

3. **Treatments beyond box-shadow.** REQ-47 shape = radius/border/box-shadow only. The pixel-obvious, values-blind cases were **mask / clip-path feather geometry (halos), filters, text-shadow / glow, translucent-vs-solid rings**, and the compose case (rounded + mask). Extend the treatment fields.

4. **Media/image fidelity + capture descends into children.** Circle-rendered-as-ellipse (object-fit/aspect); and critically the montage photos were captured as **`items: []`** — text-free media children were never captured, so *"nothing for values-diff to compare"* while the gate said "matched". Add object-fit / aspect / crop-framing / intrinsic-vs-rendered, and fix capture to descend into layer/montage children (generalises REQ-47's text-free-element hard case from "one input" to "whole child sets").

## Tier 2 — run the diff across more dimensions (cross-reference existing tickets, don't duplicate)

5. **Multi-viewport / responsive reflow** as a gate dimension — layout recomposes at mobile (faelan mobile needed a full `reflow` redo; wordmark overflow). Run projection+diff across `{320,375,768,1024,1280,1440}`; include the cheap deterministic `scrollWidth <= viewport.width` no-horizontal-overflow check. **Viewport-match is a precondition** — shooting at the wrong viewport makes the whole diff lie (false-positive trap). *(Ties [[REQ-41]].)*
6. **Cross-engine divergence** (Blink vs WebKit vs Gecko) — a real faelan `%-top` shift in Safari/FF; harness had only Chromium installed. Diff as layout-box equivalence (±2px / ±1%), not pixel-equality (AA/fonts differ per engine). *(Ties [[REQ-42]].)*
7. **Web-font load / FOUT / fallback-metrics** as a capture-timing precondition — wait for fonts + network-idle; verify the intended face actually resolved (not a fallback with different metrics). *"Skip this and the whole suite is flaky."* Contaminates every downstream delta if skipped.

## Tier 3 — diff-quality refinements

8. **Systemic sub-threshold aggregation + perceptual colour distance.** The near-black-vs-slate-700 body-tone miss slipped through because a small per-element delta repeated across ~30 elements is individually below threshold but collectively obvious. B (REQ-47) ranks per-element → a pervasive LOW delta is buried. Add an **escalate-when-repeated-on-N-elements** rule, and use **ΔE / OKLCH** colour distance, not raw RGB, for the tolerance.
9. **Ignore-masks for legitimate dynamic content.** `© 2025` hardcoded vs our dynamic `2026` year is a permanent, correct-by-design false-positive; live counters likewise. Needs an allowlist / ignore-mask. *(Ties [[REQ-35]].)*
10. **Stale-capture / re-capture discipline.** Gradient stops were missed pre-[[REQ-31]] because the bundle predated the field. When the projection schema grows (as it just did in REQ-47, and again here), bundles MUST be re-captured or the new fields silently compare null↔null.

## Tier 4 — trust / verifier independence

11. **Anti-self-grading.** *"we already watched the faelan agent grade its own diff against a number it could influence."* A severity score authored and read by the same agent that built the repro is self-certification. The gate's output needs an **independent / adversarial consumer + negative-fixture calibration** — prove the discriminator actually discriminates (seed known-bad fixtures and confirm it fires) before trusting a "clean" verdict. Pairs with the REQ-47 principle that the aggregate mean is not "% done".

## Acceptance

- The fidelity gate produces high-severity, *localised* deltas (no unaided eyes required) for each blind spot on its benchmark:
  - motion/interaction: a hover-scale / rotation / parallax present in the reference but absent/wrong in the repro is flagged (multi-state capture);
  - layering: a wrong z-order or a missing overlay/scrim is flagged (not a false-negative);
  - treatment: mask-feather halo / missing text-glow / rounded-vs-mask edge is flagged;
  - media: circle-vs-ellipse and an uncaptured photo child are flagged (capture descends into children);
  - multi-viewport: a mobile reflow break (overflow / recomposition) is flagged at ≥1 non-desktop viewport.
- Colour tolerance is perceptual (ΔE/OKLCH); a systemic low delta on N elements escalates above an isolated one.
- Dynamic-content false-positives are suppressible via an ignore-mask.
- A negative-fixture suite proves the gate fires on seeded defects (verifier independence).
- `test_UAT_FC_<TICKET>_*` cover each capability's emitted delta on a seeded fixture, plus the unchanged-pass on a faithful control.

## Notes

- Evidence sourced from a cross-transcript review of [[REQ-19]] / [[REQ-20]] / [[REQ-21]] / [[REQ-36]] plus the [[REQ-47]] design sessions; the art-directed faelan case ([[REQ-21]]) is the dominant source (motion, layering, treatments, media).
- Bundled per the "fewer, generic tickets" preference, but **Tier-1 item 1 (motion/interaction, multi-state capture) is large and self-contained — split it into a sibling if it grows**, cross-linked to [[REQ-16]].
- Runbook [[DOC-19]] should point here for "fidelity axes the static structural diff does not yet cover."
- The through-line lesson (carried from [[REQ-47]]): the fidelity gate must not report an aggregate score as "≈% done" — a single-state/single-viewport/single-engine "clean" is only clean *on those axes*; state that scope explicitly in every verdict.