---
uid: story-179b8c06
id: STORY-85
type: story
title: 'Behavior modules: vetted core + typed config + L1 presentation slots'
created_by: xgd
created_at: '2026-07-22T19:53:38.072019+00:00'
updated_at: '2026-07-24T22:42:58.227262+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-31e474b9
  capability_uid: capability-ce902be4
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by:
  - request-84af044b
---

## Story
**As a** site author (and the AI acting on my behalf), **I want** interactive
features like carousels and contact forms to be supplied as vetted **behavior
modules** that I configure with behavioural settings and dress with L1-authored
presentation, **so that** I get safe, tested, shipping behaviour (scroll-snap,
autoplay, form submission, spam protection) without ever writing module code or
raw markup, and a misbehaving feature can never break the rest of my page.

## Description
Since the framework pivot, a "module" is a **behavior**, not a bundle of
aesthetic dials. A behavior module is a **vetted behavioural core** (framework
code the author/AI never writes) that exposes exactly three surfaces:

- **config** — typed *behavioural / integration* parameters (how many slides
  show per view, whether the carousel autoplays, the form's submission endpoint
  and field schema). Never aesthetics.
- **slots** — named **L1 presentation slots**. The instance supplies an L1
  subtree per slot (a repeated slot takes an array — one subtree per carousel
  slide or form field group); the core mounts each into its behavioural chrome.
  Presentation is 100% L1, inside the validated L1 security envelope — the module
  owns zero raw markup.
- **conformance** — the universal ACs (safety / security / cross-browser /
  responsive) plus **isolation**: a misbehaving behavior must degrade inertly,
  never breaking page-level robustness.

An instance is validated against its behavior's contract before render:
config values are checked against their typed field specs, and — the **security
line** — every slot subtree must parse as a valid L1 node, so slot content can
never smuggle raw HTML/CSS/JS past the L1 envelope.

The contract is published under the `Behavior*` names: a behavior's contract type,
its config-field and slot specs, its slot values, its instance shape, its catalog
entry, and its conformance declaration all resolve from the framework package
root, alongside the three validators that check config, slots, and a whole
instance. Every catalog module declares the discriminant `kind: 'behavior'`.
There is **no back-compat alias** for the pre-rename `Capability*` names
(CLAUDE.md: no legacy modes) — the rename is atomic, so an author or generator
still using the old names fails to resolve rather than silently diverging.

The two survivors of the pivot are reframed onto this contract:
- **carousel** — a pure-CSS `scroll-snap` track (swipeable with no JS); config
  drives slides-per-view, a decorative dots row, and optional autoplay/loop;
  every slide's look is an L1 subtree in the repeated `slide` slot. No layout
  dials remain.
- **contact-form** — keeps its functional core (field schema, a11y labels,
  honeypot + Turnstile anti-spam surface, no-JS `<form method=post>` baseline,
  JSON-fetch progressive enhancement); the decorative intro and submit-button
  look move to L1 `intro` / `submit` slots.

Behavior **client behaviour** is a first-class shipped asset: each behavior
authors a self-contained, defensive `client.js`; the render pipeline folds them
into one page-referenced module script so autoplay/loop and form enhancement
actually ship (closing a dev-path pipeline gap that had silently 404'd the
island scripts).

**In scope**: the behavior contract (config/slots/conformance) and its published
`Behavior*` naming, instance validation incl. the slot-as-L1 security line, the
two reframed survivor behavior modules and their observable behaviour, the
shipped-client-JS asset, and the isolation conformance dimension.

**Out of scope**: the L1 substrate itself (STORY-83 / CAP-70) — including the L1
slot leaf's own renamed field, which STORY-83 owns; the capture→L1 fold
(STORY-84 / CAP-71); future behavior modules (payments, auth, email-capture); the
deleted pre-pivot layout modules and their dials (superseded — tracked as
upgrades to STORY-80/81/82).

## Technical Context
- The contract lives in the framework module layer (`BehaviorMeta`,
  `validateBehaviorConfig/Slots/Instance`, in `modules/behavior.ts`); slot
  validation delegates each subtree to the L1 node schema (CAP-70), which is the
  load-bearing security boundary (DOC-2: structured-only, validated by
  construction).
- The behavior catalog is a registry keyed by `<id>@<version>`; the generator
  resolves each site instance's pinned `id`+`version` to its vetted component.
  Module versions bumped by the pivot: carousel v1→v2, contact-form v2→v3.
  (REQ-87's rename is mechanical and bumped no module version — the contract
  shape is unchanged, only its identifiers.)
- The shipped client asset mirrors the existing module-CSS folding
  (`getModuleCss` → `theme.css`; `getModuleClientJs` → `capabilities.js`),
  referenced once per page as `<script type="module">`.
- **Deliberate non-change (do not "complete" this rename):** the emitted asset
  filename is still `capabilities.js` and pages still reference
  `./capabilities.js`. It is a plural bundle-output filename, not a type or a
  discriminant, and renaming it would break the page reference. Likewise the
  English-word uses of "capability" (driver capability negotiation in the capture
  layer; "schema-only capability" in the site schema) are correct English and are
  not the renamed type.
- Isolation is a render-level conformance dimension: degenerate-but-schema-valid
  input must render without throwing and still emit a structurally-intact page
  band; it always runs (needs no browser). The other four dimensions
  (safety/security/x-browser/responsive) are the DOC-20 universal ACs.
- The contract is a framework runtime notion ("behavior module"), deliberately
  distinct from the XGD capability matrix — REQ-87 renamed the type precisely to
  end that collision. The operator confirmed the slot-attachment seam as Option A
  (a module *instance* carries L1 subtrees on named slots; the module wraps L1,
  never the inverse).

### Known UAT defect — this story's reconciliation UAT file does not load
`tests/reconciliation-capability-modules.test.ts` carries the UATs for **all
eight** of this story's ACs (AC-697…AC-704), but it still imports
`validateCapabilityConfig / validateCapabilitySlots / validateCapabilityInstance`
and `CapabilityMeta` from `packages/framework/src/modules/capability` — a module
path that no longer exists after the `git mv` to `behavior.ts`. Verified this
session: `npx vitest run tests/reconciliation-capability-modules.test.ts` fails at
import with *"Cannot find module '../packages/framework/src/modules/capability'"*,
collecting **0 tests**. Two fixtures inside it also still author the legacy
discriminant `kind: 'capability'` (lines 83, 454).

The file post-dates the free-coded rename commit (the commit is 21 Jul; this
reconciliation UAT file is 24 Jul matrix work), so the rename's grep-driven sweep
could not have seen it. The per-AC `uat_coverage: pass` markings therefore
predate the rename and are stale — no UAT in this file currently executes.
Repairing the file (imports → `modules/behavior`, identifiers → `Behavior*`,
fixture discriminants → `kind: 'behavior'`) is UAT work owned by this story; it is
a test-only repair with no runtime-code change.

## Dependencies
- Plan item 1 — L1 Layout Substrate + Safety Envelope (STORY-83 / CAP-70): slot
  content is validated and rendered as L1 subtrees.

## Story Points
3