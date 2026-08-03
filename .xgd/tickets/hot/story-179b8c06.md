---
uid: story-179b8c06
id: STORY-85
type: story
title: 'Behavior modules: vetted core + typed config + L1 presentation slots'
created_by: xgd
created_at: '2026-07-22T19:53:38.072019+00:00'
updated_at: '2026-08-03T03:42:20.031342+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-31e474b9
  capability_uid: capability-ce902be4
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by: bundle-4ff83a8b
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

### The module must not override facts the reference records

Once a behavior is mounted into a reproduced page, two of the module's defaults
were silently overriding facts the source page states — so they became typed
parts of the contract rather than module opinions:

- **Labelling is config, not a fixed choice.** Each field carries an optional
  labelling mode (`visible` | `placeholder`, default `visible`). A page that
  names its controls with a placeholder is reproduced by putting the words inside
  the box; a label row above every field is not just the wrong look, it pushes
  each successive field down the page. The `<label>` is **kept** in the DOM and
  kept programmatically associated — the a11y obligation is moved out of flow,
  never traded away for the look. The witness for the difference is the a11y
  tree's name source, since a label above a box and the same words inside it are
  both just text near a box.
- **An authored submit chip is the button.** When the `submit` slot is filled,
  the module surrenders its own decoration (padding, fill, radius, colour,
  weight) so the authored subtree is not nested inside a second,
  differently-coloured button, and the default `Send` button does not appear
  alongside it. The element stays a real `<button type="submit">`: only its paint
  is surrendered.

Behavior **client behaviour** is a first-class shipped asset: each behavior
authors a self-contained, defensive `client.js`; the render pipeline folds them
into one page-referenced module script so autoplay/loop and form enhancement
actually ship (closing a dev-path pipeline gap that had silently 404'd the
island scripts).

**In scope**: the behavior contract (config/slots/conformance) and its published
`Behavior*` naming, instance validation incl. the slot-as-L1 security line, the
two reframed survivor behavior modules and their observable behaviour — including
the contact-form's typed labelling mode and its submit-paint surrender — the
shipped-client-JS asset, and the isolation conformance dimension.

**Out of scope**: the L1 substrate itself (STORY-83 / CAP-70) — including the L1
slot leaf's own renamed field, which STORY-83 owns; the capture→L1 fold
(STORY-84 / CAP-71), including how a captured control cluster becomes a form seam
and how a captured button is claimed into one; page-level composition (binding a
module instance to a slot in an L1 page and mounting it at render) and the
derivation of a module's config from a capture, which belong to the page
composition and reproduction-import capabilities; future behavior modules
(payments, auth, email-capture); the deleted pre-pivot layout modules and their
dials (superseded — tracked as upgrades to STORY-80/81/82).

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
- The labelling mode is an **additive optional** config field on the existing
  per-field item schema, so contact-form's version is deliberately unchanged at
  v3: a config that never states a mode renders exactly as it did. An
  unrecognised value is a config violation (the enum is closed); the renderer
  additionally treats anything other than `placeholder` as `visible`, so a
  bypassed validation cannot produce an unlabelled control.
- Placeholder labelling is implemented as a visually-hidden (not removed, not
  `display:none`) label so it remains in the accessibility tree; the submit
  surrender is a decoration-only reset applied when — and only when — the slot is
  filled.
- **Recorded fidelity trade (deliberate, reversible).** A button claimed into the
  `submit` slot loses its page-absolute geometry on the way in: the module places
  its own button, and page-absolute keyframes would resolve against the slot's
  origin rather than the page's. The button's exact per-width position therefore
  becomes flow-approximate within its seam — accepted for one working control
  instead of two (one inert), and handed to REQ-96 along with the leaf-control
  contract gap (an `<input>` is void, so DOC-25 §1.3's "every behavioural element
  is a container L1 can fill" does not hold for leaf controls, leaving field
  surface and height decided by the module's stylesheet rather than the capture).
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

### Reconciliation UAT file
This story's reconciliation UATs (AC-697…AC-704) live in
`tests/reconciliation-behavior-modules.test.ts`. The file was renamed and
repaired in the same reconciliation as the contract rename itself: imports
resolve `modules/behavior`, identifiers use the `Behavior*` names, and fixtures
declare `kind: 'behavior'`. The repair was test-only — no runtime code changed.

## Dependencies
- Plan item 1 — L1 Layout Substrate + Safety Envelope (STORY-83 / CAP-70): slot
  content is validated and rendered as L1 subtrees.
- Page composition (modules bound to slots in an L1 page and mounted at render):
  the labelling mode and the submit surrender are only observable on a mounted
  form.

## Story Points
3