---
uid: story-179b8c06
id: STORY-85
type: story
title: 'Behavioural capability modules: vetted core + typed config + L1 presentation
  slots'
created_by: xgd
created_at: '2026-07-22T19:53:38.072019+00:00'
updated_at: '2026-07-22T19:53:38.072019+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-31e474b9
  capability_uid: capability-ce902be4
  story_kind: feature
  story_points: 3
---

## Story
**As a** site author (and the AI acting on my behalf), **I want** interactive
features like carousels and contact forms to be supplied as vetted capability
modules that I configure with behavioural settings and dress with L1-authored
presentation, **so that** I get safe, tested, shipping behaviour (scroll-snap,
autoplay, form submission, spam protection) without ever writing module code or
raw markup, and a misbehaving feature can never break the rest of my page.

## Description
Since the framework pivot, a "module" is a **capability**, not a bundle of
aesthetic dials. A capability module is a **vetted behavioural core** (framework
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
  responsive) plus **isolation**: a misbehaving capability must degrade inertly,
  never breaking page-level robustness.

An instance is validated against its capability's contract before render:
config values are checked against their typed field specs, and — the **security
line** — every slot subtree must parse as a valid L1 node, so slot content can
never smuggle raw HTML/CSS/JS past the L1 envelope.

The two survivors of the pivot are reframed onto this contract:
- **carousel** — a pure-CSS `scroll-snap` track (swipeable with no JS); config
  drives slides-per-view, a decorative dots row, and optional autoplay/loop;
  every slide's look is an L1 subtree in the repeated `slide` slot. No layout
  dials remain.
- **contact-form** — keeps its functional core (field schema, a11y labels,
  honeypot + Turnstile anti-spam surface, no-JS `<form method=post>` baseline,
  JSON-fetch progressive enhancement); the decorative intro and submit-button
  look move to L1 `intro` / `submit` slots.

Capability **client behaviour** is a first-class shipped asset: each capability
authors a self-contained, defensive `client.js`; the render pipeline folds them
into one page-referenced module script so autoplay/loop and form enhancement
actually ship (closing a dev-path pipeline gap that had silently 404'd the
island scripts).

**In scope**: the capability contract (config/slots/conformance), instance
validation incl. the slot-as-L1 security line, the two reframed survivor
capabilities and their observable behaviour, the shipped-client-JS asset, and
the isolation conformance dimension.

**Out of scope**: the L1 substrate itself (STORY-83 / CAP-70); the capture→L1
fold (STORY-84 / CAP-71); future capabilities (payments, auth, email-capture);
the deleted pre-pivot layout modules and their dials (superseded — tracked as
upgrades to STORY-80/81/82).

## Technical Context
- The contract lives in the framework module layer (`CapabilityMeta`,
  `validateCapabilityConfig/Slots/Instance`); slot validation delegates each
  subtree to the L1 node schema (CAP-70), which is the load-bearing security
  boundary (DOC-2: structured-only, validated by construction).
- The capability catalog is a registry keyed by `<id>@<version>`; the generator
  resolves each site instance's pinned `id`+`version` to its vetted component.
  Module versions bumped by the pivot: carousel v1→v2, contact-form v2→v3.
- The shipped client asset mirrors the existing module-CSS folding
  (`getModuleCss` → `theme.css`; `getModuleClientJs` → `capabilities.js`),
  referenced once per page as `<script type="module">`.
- Isolation is a render-level conformance dimension: degenerate-but-schema-valid
  input must render without throwing and still emit a structurally-intact page
  band; it always runs (needs no browser). The other four dimensions
  (safety/security/x-browser/responsive) are the DOC-20 universal ACs.
- Divergence note: the contract is delivered as a framework runtime notion
  ("behavior module"), distinct from the XGD capability matrix; the operator
  confirmed the slot-attachment seam as Option A (a module *instance* carries L1
  subtrees on named slots; the module wraps L1, never the inverse).

## Dependencies
- Plan item 1 — L1 Layout Substrate + Safety Envelope (STORY-83 / CAP-70): slot
  content is validated and rendered as L1 subtrees.

## Story Points
3
