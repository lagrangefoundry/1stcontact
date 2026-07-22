---
uid: request-87b26bca
id: REQ-79
type: request
title: 'Framework pivot: L1 layout substrate + capability modules (safety envelope)'
created_by: xgd
created_at: '2026-07-19T00:32:33.543948+00:00'
updated_at: '2026-07-22T18:51:58.993008+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 09fa7cf5c6eec2b40cc8055e3e97facbd7eba6fe
    reconcile_sha: null
    main_sha: null
  - working_sha: 9ca7395307bdd2064ce4d444fa2e9766ffd2493f
    reconcile_sha: null
    main_sha: null
  - working_sha: 65b2582276cace7344ef011f7e81b4ed73a13deb
    reconcile_sha: null
    main_sha: null
  - working_sha: 514b3198ee477422ef863703ee39aa0552a2e8b6
    reconcile_sha: null
    main_sha: null
  version: 0.0.159
  story_points: 2
  bundled_in: bundle-31e474b9
---

# ⚠️ Framework changes under this ticket (reconciliation note)

Four `[FREE-CODED]` commits landed under REQ-79 during the (now-abandoned) joyful import. The **site** is throwaway; the **code** is not — classify for reconcile:

**SURVIVES the pivot — reconcile & keep (measurement spine + behavior module):**
- `09fa7cf5` `fix(1c): forward --sandbox from aligned-crops to render+serve` — aligned-crops CLI (measurement spine, reusable). KEEP.
- `9ca73953` (part) values-diff **fontLoad false-positive fix** — capture/values-diff (measurement spine). KEEP.
- `9ca73953` (part) **carousel module** (index.astro + meta + registry + dial) — becomes a **behavior module** (reframed in the behavior-contract REQ). KEEP.

**SUPERSEDED by the pivot — deleted in the "strip layout" REQ; NOT a regression/overwrite:**
- `9ca73953` (part) services-grid `surfaceFill` + dial — layout module → deleted.
- `65b25822` text-block section `surfaceFill` (absolute #hex OR palette role) — layout module → deleted. (The "absolute value OR role" concept carries into L1 leaf axes.)
- `514b3198` footer `textWeight` (`FONT_WEIGHT_DIAL`) — layout module → deleted. (`FONT_WEIGHT_DIAL` stays in the shared-dials subset; the footer usage dies.)

**Reconcile instruction:** the strip-layout deletions of the services-grid / text-block / footer dials above are **intentional supersession**, not lost free-coded work — do **not** flag as CRITICAL overwrite.

---
# Framework Pivot — L1 layout substrate + behavior modules under a safety envelope

**Repurposed 2026-07-20** from "Import joyfulculinarycreations.com" (abandoned). This ticket is now the umbrella decision + end-to-end plan for the framework pivot.

## Abandoned work
- The joyfulculinary reproduction (previous purpose) is **abandoned**. It may be redone later in the new system as a validation exercise (Phase E), not resumed as-is.
- Prior commits in `fields.commits` belong to that import and are superseded by this pivot. **Workflow follow-up:** those commits no longer match this ticket's purpose — reconcile/revert is an open state question (they were free-coded against the old import).

## Decision — the new architecture (what changed)
1. **Framework purpose = safety envelope**, NOT aesthetic rails. Value = security, robustness (won't crash/hang the browser), cross-browser compatibility. Aesthetics come from Claude + flexibility, not enums/palettes/presets.
2. **L1 — one low-level CSS-faithful layout substrate.** A typed tree of positioned/flowed boxes + text runs + images carrying the ~48 captured axes as literals. **Safe by construction:** fields are typed scalars/enums, never a freeform CSS/HTML/JS string; numeric bounds deliver robustness; a feature-allowlist + the existing 3-engine capture gate deliver cross-browser. Replaces the 8 semantic layout modules.
3. **"Module" = capability, not layout.** A behavior module = vetted behavioral/integration core (**AI configures, never writes code**) + typed config (behaviour/integration params) + named **L1 presentation slots**. Small curated set: payments (subscription / one-off), auth (sign-up/sign-in), email-capture, carousel, scroll-animation. `carousel` + `contact-form` are the first two exemplars.
4. **L2 (design library) = PARKED.** Possibly never needed — Claude authors L1 directly; the envelope keeps it safe. Revisit only if direct L1 authoring proves insufficient.
5. **Acceptance = round-trip identity:** `capture(render(L1)) ≈ L1`, measured on the existing capture / values-diff / aligned-crops spine — which also enforces the envelope. Reproduction becomes near-mechanical (capture → serialize to L1 → render → gate).
6. **Reuse:** ~92% of the codebase survives untouched (store/versioning; capture + values-diff ~5.3k LOC; perceptual/aligned-crops; serve). The rebuild is the ~860 LOC render/authoring layer.

## Execution principle
- **Working code first, docs second, SAME session does both.** Every phase bundles implementation with its DOC-ticket updates — no doc-only sessions.
- Module code changes follow the free-coding process (scope ticket + `test_UAT_FC_*` + `[FREE-CODED]`). This ticket is the umbrella; Phases B–E each get their own scope ticket at execution time.
- Order among the changes is not load-bearing (the whole cutover completes before reproduction resumes), but the sequence below minimises rework — the L1 renderer is written once.

## Outstanding DESIGN work — Phase A (resolve before Phase B code)
- **D1 — L1 layout model (the hard one).** How boxes position/flow: flow+box vs absolute vs grid/flex; how it is DERIVED from captured geometry (`box` + `arrangement`); how it stays resilient cross-engine (not pixel-pinned). The 48 leaf axes are known; the layout model is not.
- **D2 — L1 schema shape.** Typed element tree: element kinds (box/text/image/slot), axis fields, nesting, how a behavior-module instance is referenced inside an L1 tree.
- **D3 — Safety-envelope formalization.** Validator rule set (typed axes, value ranges, feature allowlist, depth/count caps) + empirical gate (render → 3-engine capture → pass/fail on hang/OOM/divergence). Re-found DOC-7 §6.2/§6.5 on L1.
- **D4 — Behavior-module contract.** core/config/slots boundary; per-module conformance obligations; runtime isolation so a misbehaving capability cannot break page-level robustness.
- **D5 — L1 ↔ capability composition.** How L1 hosts behavior instances in slots; render/compose order.
- **D6 — Round-trip acceptance test.** Tolerance definition for `capture(render(L1)) ≈ L1` reusing values-diff.

## CODE changes (modify existing)
- `render/render.ts` — remove all layout-composition logic (overlay-header, row buffering, `wrapWithLayer/Motion/Background`); becomes the L1 render loop (written once, Phase B).
- `modules/registry.ts`, `modules/index.ts`, `framework/src/index.ts` — drop the 6 layout metas + helper exports; catalog reduces to behavior modules.
- `modules/dials.ts` — split: keep shared resolvers (`resolveStep`, `responsiveStepVars`, `classifyLength`) + capability subset; delete ~20 layout-only dials.
- `cli/scaffold.ts` — replace header/hero/footer starter with an L1 (or empty) starter.
- `carousel/`, `contact-form/` — reframe onto the behavior contract (strip layout dials; content → L1 slots; keep behavioural core + `enhance.ts`).
- ~14 mixed/conformance/schema tests — repoint fixtures off `text-block`/layout types onto capability or synthetic modules.

## CODE additions (new)
- **L1 schema** (site-schema package): typed element/layout tree + validator.
- **L1 renderer**: L1 tree → safe HTML/CSS (the by-construction emitter).
- **Envelope validator + empirical gate**: static rules + the 3-engine render/capture pass, wired to the existing capture spine.
- **capture → L1 serializer**: capture bundle → L1 doc (replaces adopt-values/scaffold; makes reproduction mechanical).
- **Behavior-module contract types + conformance hooks**: core/config/slots interface.

## CODE deletions
- Module dirs: `header/ hero/ footer/ text-block/ services-grid/ layer/`.
- Layout helpers: `layer.ts overlay.ts row.ts nav.ts motion.ts background.ts`.
- ~19 pure-layout tests (req14/15/16/24/25/27/32/36/48/49/56/61/62/66 + the hero/textBlock/services-grid reconcile tests).

## DOC changes (modify existing) — written in the same session as their code
- **DOC-7** (Phase C) — split: delete the semantic-module-catalog half (§2–4, §7); keep/re-found the security half (§6.2/§6.5) on L1.
- **DOC-2** (Phase B) — write the Security Policy: structured-only + validated invariant as a property of L1.
- **DOC-19** (Phase E) — rewrite the repro runbook for L1 (keep the value model + gate methodology; drop module-specific capability lists).
- **DOC-8 / DOC-15 / DOC-16 / DOC-20 / DOC-21** — re-point tool surface / coverage classification / attribution ladder / conformance ACs from the module catalog to L1 axes + capability gaps; promote DOC-20's four universal ACs as the envelope definition.
- **CLAUDE.md** (Phase C) — rewrite "Generalize Modules Before Adding New Ones" (lines 49–60): generalize the one L1 primitive; new module only for a distinct capability.
- **packages/framework/README.md** — refresh the module-catalog description.

## DOC additions (new)
- **L1 Layout Substrate spec** (Phase B) — the typed box/text/image model, its axes, why it is safe/robust/cross-browser by construction (absorbs DOC-19 value model + DOC-20 AC-M1/M3/M4).
- **Behavior-Modules spec** (Phase D) — the contract; carousel + contact-form as worked examples (replaces DOC-14).
- **Framework Purpose / Positioning** (Phase B) — safety envelope, not aesthetic rails; L2 parked.
- **Behavior-Module Authoring & Vetting process** (Phase D) — framework-team lifecycle (successor to DOC-14 Tier-B, minus AI-authored code).
- **Supersede** DOC-14 and DOC-6.

## Phased execution (each = code THEN docs, same session, own scope ticket)
- **Phase A — Design.** Resolve D1–D6 → L1 schema + envelope + behavior-contract design notes. (No code.)
- **Phase B — L1 substrate + envelope.** L1 schema + renderer + validator + round-trip gate; prove on a one-section spike (captured hero → L1 → render → round-trip + envelope pass). Docs: L1 spec, DOC-2, Framework-Purpose.
- **Phase C — Strip layout.** Delete layout modules/helpers/tests; trim registry/barrels/dials/scaffold. Docs: DOC-7 split, supersede DOC-14/DOC-6, CLAUDE.md rewrite.
- **Phase D — Behavior contract.** Formalize the contract; reframe carousel + contact-form. Docs: Behavior-Modules spec, Authoring/Vetting process, DOC-8/20/21 updates.
- **Phase E — Reproduce in the new system.** capture→L1 serializer; reproduce a site end-to-end gated by round-trip + envelope + perceptual. Docs: DOC-19 rewrite, DOC-15/16 updates.


## Reproduction exercise (new system) & language-triviality principles

Reproduction must collapse to one mechanical serialization — this is a DESIGN CONSTRAINT on L1, not an aspiration. Sharpens D1/D2/D6 and defines the `reproduce` command.

**Exercise:**
1. `1c capture page <url>` — unchanged; manifest (48 axes × elements × 6 viewports × 3 engines).
2. `1c reproduce <bundle>` — NEW; replaces adopt-values + scaffold + all hand-authoring. Mechanically serialize the manifest into an L1 doc. Zero authoring.
3. `1c render` — L1 → safe HTML/CSS.
4. Gates (existing spine): round-trip values-diff + envelope validator/3-engine pass + perceptual aligned-crops.
5. Residual delta = serializer bug or missing L1 axis → a FRAMEWORK fix, not a site fix. Each site hardens the language; the site is disposable.

**Target (by construction):** `capture(render(reproduce(capture))) ≈ capture` closes to ~0 with no manual work — `reproduce` is nearly the identity function.

**Language-triviality principles (force L1's shape):**
1. L1 element schema = the capture manifest's `ValueElement` — one vocabulary, not two; serialization = transcription.
2. One value = one literal field — no shared styles, dials, or theme-role indirection IN L1 (those are authoring conveniences, not the substrate). Direct fix for why adopt-values returned 0.
3. Absolute geometry is a first-class, always-valid layout form — baseline reproduction needs zero inference (absolute-layout-as-base; structure is the overlay).
4. Multi-viewport by construction — per-element per-viewport values mirror the manifest.
5. Structure is an optional overlay, never a prerequisite.

**Absolute-base + structure-overlay (D1 must deliver):**
- Baseline (always trivial, always closes round-trip): per-viewport absolute transcription, media-queried between the 6 captured widths. A pure copy — free.
- Refinement (optional, adds resilience): an inference pass PROMOTES absolute clusters into flow/grid where geometry supports it; every promotion VERIFIED by the round-trip still holding across widths. Structure is earned against the gate, never assumed. The trivial path is never blocked by the hard problem.


## D2 / D6 refinement — structure is observed→recovered; the gate proves it

**D2 — L1 carries observed→recovered structure.** Capture fills L1's leaf VALUES + GEOMETRY (keyframes). It CANNOT observe RELATIONSHIPS — containment, flow, fluid-vs-fixed, distribution, "hugs content" — because those are not painted. So L1's schema must carry structure primitives (containers, per-axis sizing rules, distribution, visibility) that capture leaves empty and the AI RECOVERS. L1 spans observed (pinned keyframes) → recovered (clean flow/grid). Framing: **capture sets PARAMETERS, the AI recovers RELATIONSHIPS** = Type-A vs Type-B = capture's job vs AI's job. At the exact captured point (same width/content/engine), pinning ≡ structure's output; they diverge only OFF that point.

**D6 — acceptance = 3 probes, not 1.** Round-trip at the 6 sampled widths is necessary but NOT sufficient — a pinned bag-of-boxes passes it while being structurally wrong and breaking on any new content. Acceptance =
  (a) **sample-fidelity** — matches the oracle ladder at the captured widths;
  (b) **off-sample fidelity** — renders sanely at intermediate widths (e.g. 500/900);
  (c) **content-perturbation robustness** — feed longer text / taller image → envelope holds (no overlap/clip).
(c) is the mechanical definition of "structure is correct": a well-structured doc survives content it wasn't captured with; a pinned one does not. **Flow-promotion is demand-driven** — applied only where (b)/(c) fail. The frozen reproduction (fixed content, fixed widths) is the degenerate case where pinning suffices; living sites (owner's changing content) are the general case where structure is mandatory — which is why reproduction is a throwaway validation, not the deliverable.


## Capture stage — structural hints (extends DOC-13: rendered-only → rendered + hints)

Rendered-only capture (DOC-13) discards the DOM/CSS where RELATIONSHIPS live — the single richest structural signal. Add a **structural-hint pass** to capture (runs in the existing headless browser; `raw.html` already persisted) that annotates each element/group with ADVISORY structure signals for the AI's relationship recovery. Hints are never executed and never authoritative — the geometry oracle stays truth; the AI may override; the gate catches errors.

Signals to extract:
- **ancestry / parent-id** — the containment tree capture flattens away (biggest signal)
- **sibling-repetition** — "one of N identical siblings under X" → a collection/grid
- **parent's COMPUTED layout** — `display` / `flex-direction` / `justify-content` / `align-items` / `gap` / `grid-template-columns` (computed = post-cascade/post-JS; avoids resolving the cascade ourselves)
- **sizing intent** — width unit `%`/`fr`/`auto`/`clamp` vs `px` → the fluid-vs-fixed answer, directly
- **position mode** — static/relative/absolute/sticky
- **real `@media` breakpoints** — exact px, replacing the snap-at-midpoint guess
- **semantic tags** — `<form>`/`<nav>`/`<ul>` → also hint behavior-module placement

Loop: **hints = priors (direction) · geometry oracle = truth (fidelity) · AI = reconcile+clean+verify** → a confidence-rated structure recovery. This is the primary defence against naive reproduction that looks perfect with captured content but breaks with new content — the source carries the fluid / hugs-content / space-between intent that geometry alone cannot distinguish. Rule: **read the source for DIRECTION, not EXECUTION** (distill, don't import; wrapper-div/CSS-in-JS noise stays out; prefer computed styles).

**DOC change:** DOC-13 rendered-only → rendered + structural hints.


## Phase tickets (created 2026-07-20, status: draft)
- **B1 → REQ-82** (request-11efc10f) — L1 substrate + envelope (schema, renderer, validator; one-section spike)
- **B2 → REQ-83** (request-56d62b72) — capture→L1 fold (keyframes + oracle) + structural-hint extractor
- **C  → REQ-84** (request-f243b6b9) — strip layout modules to L1
- **D  → REQ-85** (request-015e42ac) — behavior-module contract + reframe carousel/contact-form
- **E  → REQ-86** (request-58e96ad1) — reproduce a site end-to-end (3-probe gate)

Sequence: B1 → B2 → C → D → E (C may follow B1). Each = code first, then its docs, same session. Created as `draft` to stay out of the headless develop queue; move to `ready_to_implement` when starting each.


## Final coherence review (gate before Phase E / the gigabyte re-import)

Run after B1–D, before re-importing gigabyte. A thorough (multi-agent) pass verifying the pivot is **coherent** — code ↔ docs ↔ tickets tell ONE story, and grounded divergences from the plan were **reconciled into the docs**, not left stale. "As planned" = coherent, not literal conformance to the frozen ticket text.

Checklist:
- **No old-model vestiges** — no code/doc reference to layout modules or dials-as-aesthetic-rails that would mislead a future session.
- **DOC-7 split clean** (security half re-founded on L1; catalog half gone); DOC-2 written; DOC-14/DOC-6 superseded; DOC-13/DOC-19 reflect the real pipeline.
- **Docs ↔ code match** — L1 Substrate spec ↔ actual schema; Behavior-Modules spec ↔ carousel/contact-form as built; DOC-19 ↔ the real repro pipeline.
- **No dangling refs**; catalog = behavior modules only.
- **Build hygiene / latent type-drift** — a CLEAN full rebuild of ALL packages (site-schema, framework, tools) + `tsc --noEmit` across the workspace passes with **ZERO** errors. No stale-`dist`-masked type errors (e.g. the REQ-84 subScales drift) and **nothing like it** hiding behind partial typechecking. **Green vitest is NOT sufficient** — dist staleness masks cross-package type drift.
- **Reconciliation note** (top of REQ-79) still accurately reflects survived-vs-superseded.

Then Phase E: **gigabyte (smoke) → joyful (stress)**, each through the 3-probe gate (sample + off-sample + content-perturbation).