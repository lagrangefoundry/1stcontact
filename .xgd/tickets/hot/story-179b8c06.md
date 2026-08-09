---
uid: story-179b8c06
id: STORY-85
type: story
title: 'Behavior modules: vetted core + typed config + L1 presentation slots'
created_by: xgd
created_at: '2026-07-22T19:53:38.072019+00:00'
updated_at: '2026-08-09T05:42:07.458046+00:00'
completed_at: null
last_field_updated: uat_coverage
status: updated
fields:
  intent_uid: bundle-31e474b9
  capability_uid: capability-ae9d65d6
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by: bundle-0385746c
---

## Story
**As a** site author (and the AI acting on my behalf), **I want** interactive
features like carousels and contact forms to be supplied as vetted **behavior
modules** that I configure with behavioural settings and dress entirely with
L1-authored presentation — including the form's own controls — **so that** I get
safe, tested, shipping behaviour (scroll-snap, autoplay, form submission, spam
protection) without ever writing module code or raw markup, my design is honoured
exactly rather than fought by a module stylesheet, and a misbehaving feature can
never break the rest of my page.

## Description
Since the framework pivot, a "module" is a **behavior**, not a bundle of
aesthetic dials. A behavior module is a **vetted behavioural core** (framework
code the author/AI never writes) that exposes exactly four surfaces:

- **config** — typed *behavioural / integration* parameters (whether the carousel
  autoplays and loops, the form's submission endpoint, field schema, success
  message and submit wording). Never aesthetics.
- **slots** — named **L1 presentation slots**. The instance supplies an L1
  subtree per slot (a repeated slot takes an array — one subtree per carousel
  slide); the core mounts each into its behavioural chrome. This is the
  *module-wraps-L1* direction.
- **controls** — named **module-declared leaf elements** that L1 paints. This is
  the *L1-wraps-module* direction (below).
- **conformance** — the universal ACs (safety / security / cross-browser /
  responsive) plus **isolation**: a misbehaving behavior must degrade inertly,
  never breaking page-level robustness.

### Two composition directions, chosen by whether the element holds children
A slot is the module rendering its chrome *around* an L1 subtree. That works when
the behavioural element is itself a container — a carousel's slide `<li>` really
can hold a slide's entire L1 look. It is structurally unreachable for a **leaf**:
`<input>` is a void element and `<textarea>`'s content is its value, so there is
nowhere to put an L1 subtree. Under the slot model alone a form module therefore
*had* to paint its own fields, and no validator could catch it, because the
contract had no vocabulary for "this element's look belongs to L1".

The contract now carries the inverse direction as well. A behavior **declares**
its leaf elements (which must exist, which are required, whether there is one per
config-list item or one per repeated-slot subtree); an L1 `control` node inside a
slot subtree **names** one, and the published page emits that element carrying
L1's class, geometry and every paint axis while the module contributes only the
attribute bundle that makes it work — `type` / `name` / `required`, the
label↔control association, the endpoint.

| | owns |
|---|---|
| **L1** | class, geometry, and every paint axis — of the behaviour's own controls, not merely the decoration around them |
| **module** | which elements exist; their `type` / `name` / `required` / label wiring; the endpoint; the client behaviour |

Because that split is expressible, it is also **checkable**: instance validation
closes both directions — a bound name the behavior does not declare is a
violation, and a required declared element with no L1 node bound to it is a
violation. The whole-instance check reports the union of config, slot and control
violations.

### A behavior module ships zero CSS — with two declared carve-outs
Neither survivor may paint any longer. Not less — none. The one exception is a
small **declared set of invariant elements**, whose presentation is fixed by an
**obligation rather than by taste**: the honeypot must stay invisible (a designer
must not be able to reveal it), the programmatic label must stay out of the
visual flow while remaining associated, the Turnstile mount must sit where the
widget expects it, the module's own wrapper chrome must contribute no layout of
its own, and a carousel must be able to signal which slide is current — a
behavioural state no static L1 subtree can express. An invariant element is
declared as such, is never bound to an L1 node, and is marked in the emitted DOM
so downstream consumers can tell repro-only chrome from reference content.

The line is not "L1 owns everything"; it is **"L1 owns everything the reference
can legitimately vary."**

The second carve-out is the **settled state**, and it exists because the edit
render (the non-functional channel the editor works on) turns every behaviour
off. A module whose behaviour holds content out of view must declare its own
behaviour-off state, because only the module knows what its behaviour was holding
back: a carousel's slides are all in the DOM — a scroll track, not
`display: none` — but with behaviour off they sit scrolled out of view, where
their copy cannot be read or clicked. The edit channel must not have to know what
a carousel is, so the knowledge stays with the module that owns the behaviour.

It is bounded exactly as the invariant-element carve-out is, and for the same
reason — a carve-out with no stated limit is not a carve-out but a hole:

- **Scoped to the edit channel** by the document-level edit marker, which only the
  edit render sets. The rule is inert in the published and draft-preview channels,
  so the zero-CSS obligation is undiminished everywhere it is load-bearing: what
  a visitor is served is unchanged.
- **It releases; it does not paint.** It may set only flow- and scroll-release
  properties — the ones that undo the module's own mechanics — and no property an
  L1 subtree owns. A settled state can make content *visible*; it can never decide
  how that content *looks*.

So the contract's line holds in the edit channel too: L1 still owns everything the
reference can legitimately vary, and the module owns only what an obligation
fixes — here, the obligation that every editable region be reachable in the
channel built for editing it.

### The two survivors on this contract
- **carousel** (v3) — a pure-CSS `scroll-snap` track (swipeable with no JS);
  config is `autoplay` and `loop` only. Every slide's look is an L1 subtree in the
  repeated `slide` slot, and the optional pagination row is an L1 subtree holding
  one `dot-<i>` control leaf per slide. `config.view` is **deleted**: presented as
  behavioural ("slides per view"), it resolved to a `flex-basis`, which is exactly
  the aesthetic dial the contract forbids — shipped in the worked example the
  contract used to explain the rule. Slide width, the gap between slides, and a
  dot's size and colour are now L1 axes on the subtrees themselves.
- **contact-form** (v4) — keeps its functional core (field schema, a11y label
  association, honeypot + Turnstile anti-spam surface, no-JS `<form method=post>`
  baseline, JSON-fetch progressive enhancement over **only the endpoints that
  enhancement can actually complete**) and **ships no stylesheet beyond its
  invariants**. Its whole presentation is one L1 subtree in a single
  **required** `form` slot; each field's control and the submit button are
  `control` leaves inside it. The slot is required deliberately: a form with no
  authored presentation has no visible controls at all, and failing that loudly at
  validation beats rendering an empty box.

### The deleted look is relocated, not lost
Deleting a module stylesheet has a real cost: a form authored **without** a
capture to transcribe would have no look at all. The default is therefore
re-homed as an **L2 preset** — the optional library of vetted L1 designs — that
returns an ordinary L1 subtree a caller drops straight into the `form` slot, with
a few named design constants (colour, field fill, border, radius, field height,
rhythm, submit fill) overridable. The default look becomes a *starting point*
instead of a *ceiling*, which is the same move the pivot already made for layout
modules.

An instance is validated against its behavior's contract before render: config
values are checked against their typed field specs; every slot subtree must parse
as a valid L1 node (the **security line** — slot content can never smuggle raw
HTML/CSS/JS past the L1 envelope); and every control binding is checked in both
directions.

The contract is published under the `Behavior*` names: a behavior's contract type,
its config-field, slot and control specs, its slot values, its instance shape, its
catalog entry, and its conformance declaration all resolve from the framework
package root, alongside the validators that check config, slots, controls, and a
whole instance. Every catalog module declares the discriminant `kind: 'behavior'`.
There is **no back-compat alias** for the pre-rename `Capability*` names
(CLAUDE.md: no legacy modes) — the rename is atomic, so an author or generator
still using the old names fails to resolve rather than silently diverging.

Behavior **client behaviour** is a first-class shipped asset: each behavior
authors a self-contained, defensive `client.js`; the render pipeline folds them
into one page-referenced module script so autoplay/loop and form enhancement
actually ship (closing a dev-path pipeline gap that had silently 404'd the
island scripts).

**In scope**: the behavior contract (config / slots / controls / conformance) and
its published `Behavior*` naming, instance validation incl. the slot-as-L1
security line and the two-directional control check, the zero-CSS obligation and
its two declared carve-outs (invariant elements, and the edit-channel settled
state), the two reframed survivor behavior modules and
their observable behaviour, the L2 default-look preset, the shipped-client-JS
asset, and the isolation conformance dimension — including its client-side half,
that an enhancement never cancels a baseline it cannot itself complete.

**Out of scope**: the L1 substrate itself (STORY-83 / CAP-70) — including the
`control` node kind, its emitter and the emitter's own safety properties, and the
L1 slot leaf's renamed field, all of which STORY-83 owns; the capture→L1 fold
(STORY-84 / CAP-71), including folding a captured control into a `control` node
and excluding invariant elements from the reproduction value gate; future behavior
modules (payments, auth, email-capture); the deleted pre-pivot layout modules and
their dials (superseded — tracked as upgrades to STORY-80/81/82).

## Technical Context
- The contract lives in the framework module layer (`BehaviorMeta`,
  `validateBehaviorConfig/Slots/Controls/Instance`, in `modules/behavior.ts`);
  slot validation delegates each subtree to the L1 node schema (CAP-70), which is
  the load-bearing security boundary (DOC-2: structured-only, validated by
  construction).
- The behavior catalog is a registry keyed by `<id>@<version>`; the generator
  resolves each site instance's pinned `id`+`version` to its vetted component.
  Module versions bumped by the pivot: carousel v1→v2, contact-form v2→v3; REQ-96
  bumped both again (carousel v3, contact-form v4) because deleting `config.view`
  and replacing the `intro`/`submit` slots with a required `form` slot are
  breaking contract changes. (REQ-87's rename was mechanical and bumped no version.)
- **Supersession (deliberate, recorded).** REQ-96 knowingly changed what an
  earlier intent established: `config.view` was documented as behavioural config
  driving slides-per-view (AC-699) and is now deleted as the aesthetic dial it
  was; `contact-form`'s `intro`/`submit` presentation slots (AC-701) are replaced
  by one required `form` slot carrying control leaves. Nothing was added in
  parallel — the old surfaces are gone, per CLAUDE.md's no-legacy-modes rule.
- **Security stays construction-time.** The inversion moves *presentation* to L1
  and nothing else: the module still authors the `action` through `assertSafeUrl`,
  the `name` / `type` / `required` attributes, and the label pairing; the sole
  emitter escapes every attribute value and refuses `class`, `style` and `on*`
  attribute names outright, so a module cannot hand presentation back to itself
  and there is no freeform key that routes to raw CSS. The safety envelope must
  not degrade from "guaranteed by construction" to "hopefully validated" — that
  is the framework's value proposition (DOC-24).
- **A pre-existing defect fixed here because it made the criterion uncheckable.**
  The module-CSS fold scanned each component's whole source for `<style>`-shaped
  text. Two such things are not style elements: a doc comment that merely
  *mentions* `<style>`, and the self-closing per-instance `<style set:html={…} />`
  in the body. Both opened a match that ran on to the next real `</style>`, so
  `carousel` was folding its own imports, props interface, script body and markup
  into every generated `theme.css`. The scan now skips the frontmatter and strips
  self-closing tags first. Predates REQ-96; fixed inside it because "the module
  ships no CSS" cannot be asserted against a stylesheet containing the component's
  source. Recorded as an in-scope excursion in the reconciliation plan.
- **The invariant declaration has a second consumer.** Invariant elements are
  repro-only chrome — they exist on our side and have no counterpart in a captured
  reference — so the reproduction value gate must exclude them, or the control
  pairing slides and every field mispairs against its neighbour (measured: 15
  repro-only objects, 26 unreadable deltas on gigabytealchemy). The exclusion
  itself is documented on the capture / fold stories, not here; what this story
  owns is that the module *declares* which elements are invariant and marks them
  in the DOM.
- **Measured outcome.** On the gigabytealchemy reproduction the inversion closed
  every form delta the intent named: field surface (fill / border / radius are now
  L1 axes), field height (50px and 146px from the capture, not the deleted 44px
  default), and the submit button inline-vs-stacked — which "ceased to be a
  concept" once each control carries its own geometry. Cross-gate perceptual mean
  fell 2.61 → 0.69/255 and values-diff deltas 26 → 2.
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
- **Isolation has a client-side half (BUG-28).** The contact-form enhancement
  previously suppressed the native submit unconditionally and then attempted the
  submission itself. The module's safety check accepts `mailto:` and `tel:` as
  legitimate endpoints, and the browser cannot send a submission to either — so
  those forms reported a connection failure on a page that would have worked by
  native submit, with the baseline already cancelled. That is the declared
  isolation obligation inverted, and it is the default state of any authored site
  with no backend yet. The enhancement now decides from the endpoint's scheme
  *before* suppressing the submit: `http(s)`, relative and empty endpoints are
  intercepted exactly as before; every other scheme, and anything unreadable,
  keeps the user agent's own submit. Deliberately **no** config field was added —
  the endpoint already determines the answer, and a dial for that would be the
  escape hatch DOC-25 §2 rules out. The guard is an allowlist, so a schemeless
  (relative) value still enhances rather than being mistaken for unparseable.
- Isolation is a render-level conformance dimension: degenerate-but-schema-valid
  input must render without throwing and still emit a structurally-intact page
  band; it always runs (needs no browser). The other four dimensions
  (safety/security/x-browser/responsive) are the DOC-20 universal ACs.
- **The settled-state carve-out was added by the edit-render work, and is
  recorded here deliberately.** The edit render is owned by another story, but the
  *obligation it places on a behavior module* is a change to this contract, so it
  belongs to this story rather than to the channel that motivated it. It was
  flagged as such when the edit render landed; the resolution is this: the
  contract admits the carve-out, bounded and declared, instead of the matrix
  holding both "a module ships no CSS beyond its invariant elements" and "a
  carousel declares its own behaviour-off state" as unreconciled propositions. The
  alternative considered — narrowing the zero-CSS guarantee to the served channels
  only — was rejected as weaker: it would have withdrawn the criterion from a
  channel rather than stating what the criterion permits there, leaving a module
  free to paint in the edit render with nothing to check it.
- The contract is a framework runtime notion ("behavior module"), deliberately
  distinct from the XGD capability matrix — REQ-87 renamed the type precisely to
  end that collision. The operator confirmed the slot-attachment seam as Option A
  (a module *instance* carries L1 subtrees on named slots; the module wraps L1);
  REQ-96 adds the inverse seam for leaves rather than replacing it.

### Reconciliation UAT file
This story's reconciliation UATs (AC-697…AC-704) live in
`tests/reconciliation-behavior-modules.test.ts`. The file was renamed and
repaired in the same reconciliation as the contract rename itself: imports
resolve `modules/behavior`, identifiers use the `Behavior*` names, and fixtures
declare `kind: 'behavior'`. The repair was test-only — no runtime code changed.

## Dependencies
- Plan item 1 — L1 Layout Substrate + Safety Envelope (STORY-83 / CAP-70): slot
  content is validated and rendered as L1 subtrees, and the `control` node kind
  and its emitter live there.

## Story Points
3