---
uid: story-179b8c06
id: STORY-85
type: story
title: 'Behavior modules: vetted core + typed config + L1 presentation slots'
created_by: xgd
created_at: '2026-07-22T19:53:38.072019+00:00'
updated_at: '2026-11-09T23:16:14.942546+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-31e474b9
  capability_uid: capability-ae9d65d6
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by: bundle-374f88d6
---

## Story
**As a** site author (and the AI acting on my behalf), **I want** interactive
features like carousels, contact forms and sign-in chrome to be supplied as vetted **behavior
modules** that I configure with behavioural settings and dress entirely with
L1-authored presentation — including the form's own controls — **so that** I get
safe, tested, shipping behaviour (scroll-snap, autoplay, form submission, spam
protection) without ever writing module code or raw markup, my design is honoured
exactly rather than fought by a module stylesheet, my site renders wherever the
platform serves it, and a misbehaving feature can never break the rest of my page.

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

### What a behavior module *is*, as an artifact
A behavior is a **plain typed function from props to markup**. It takes the
instance's config, its slot subtrees, its instance id, the channel flag, and the
site's resolved locale and declared **capabilities**, and returns the HTML string
it contributes to the page. It is not a template, and
nothing has to compile it before it can run.

That is the whole reason the module layer is portable. A module that ships a
template can only render where the template's build transform runs — which is a
filesystem-bound toolchain, so a page mounting a behavior module could be
rendered by the operator's own machine and by nothing else. As a function it has
no such precondition: **the catalog resolves anywhere, the render path names the
module lookup directly, and one render entry point serves both hosts** — no
container to create, no module resolver to inject, no "this page needs the
transform" branch, and no second, thinner render for the runtime that could not
run the first. A site mounting a behavior module therefore renders in the edge
runtime, and the bytes it serves are the component's own output.

Parity between the two hosts is **structural rather than compared**: both call
the same function, so there is no second implementation that could disagree. The
parity that matters is host-to-host; it is deliberately *not* parity with the
previous template compiler's output, whose inter-element whitespace differs and
is semantically inert.

One thing the template compiler did implicitly the function must now do
explicitly: **escape every value it interpolates**. A module is the sanitization
boundary for its own config, so each of its two string sinks — element text and
attribute value — is a named escape with the same rules as the L1 emitter, and
there is deliberately no raw-passthrough helper to blur which sink a value went
through. Values a module emits raw (an already-emitted L1 fragment, its own
serialized CSS) are visible as such at the call site. The refusal path is
unchanged and still loud: an unsafe endpoint scheme is *rejected*, not escaped
into harmlessness.

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
config-list item or one per repeated-slot subtree, and which tag each is: a form
affordance such as `input` / `textarea` / `button` / `select`, a `label`, the
invariant `span`, or a **link** `a`, because not every control is part of a form,
REQ-200); an L1 `control` node inside a
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

**The contract is closed at the write boundary (BUG-76).** Config and slots are
checked against the *declared* names in both directions, exactly as controls
are: a config key or a slot name the behavior does not declare is a violation
that names the key and the declared set (`config key 'account' is not declared
(declared: signIn, portal, …)`), so a typo or a key belonging to another module
is refused instead of being stored, echoed back as applied, and ignored. The
refusal lands where an instance is *written* (every edit verb that sets a
behavior instance), not in the render path: an instance already stored with a
stray key still paints, because isolation says a malformed instance costs its
own corner of the page and not the page.

**A schema error inside a slot is as precise as the same error in the page
tree (BUG-76).** A slot value is either one L1 node or an array of them, which
wraps the node union in a second union. Error localisation applies one general
rule to every union: a branch that failed at the union's own root is the wrong
shape; a branch that failed deeper is the right shape with bad content, and when
exactly one branch is the right shape that branch is reported. So a bad axis key
inside a behavior slot reports the offending path and key — the same path tail
and key the identical node reports in the page's own `l1` tree — instead of
"Invalid input" at the slot root. When no branch survives but every branch was
rejected on the same tag, the message names the tag and its valid values
(`kind is not one of: …`). A refused write reports **every** error it found
(up to a cap, stating how many more were cut), not only the first.

### Where a behaviour sits on a page: it must name the seam it mounts into
Instance validation proves a module is internally well-formed. **REQ-93 adds the
page-level half**: a behaviour does not float alongside an L1 document, it mounts
*inside* one. A captured page is routinely 100% L1 layout plus one behaviour bound
to a seam within it — the composition DOC-25/26 describe — so `modules` and `l1`
are not exclusive: modules may accompany `l1` **when each is bound by name to a
`slot` present in the L1 tree**.

Binding is validated, never best-effort. Each of these is an error with a
machine-readable path, not a silent no-op:

| rejection | why |
|---|---|
| **unbound module** — a module on an L1 page that names no slot | there is no defined place for it to render |
| **dangling slot name** — names a seam absent from the L1 tree | the binding resolves to nothing |
| **double-bound seam** — two modules name the same slot | one mount point cannot hold two behaviours |
| **`slot` with no `l1`** — a module names a slot on a page carrying no L1 document | nothing to mount into |
| **duplicate slot names** in one document | a mount point must be unambiguous |

Both empty is legal — that is the empty starter page. So is an **orphan seam**: a
`slot` in the tree that no module binds is *not* rejected. It stays the inert
labelled placeholder — the mount is simply absent — and STORY-83 owns what it
emits in that state. The rule is one-directional **on an L1 page**: every module
mounted there must name a live, unique seam; a seam need not attract a module. A
module on a page carrying no L1 document names no seam at all — that is the
standalone shape `mountInL1` contrasts with.

Because the binding is proved here, the L1 renderer can insert the bound module's
already-rendered fragment into the seam verbatim; STORY-83 records that emitter
carve-out and the trust boundary it rests on. This story owns the rule; STORY-83
owns the emission.

**`mountInL1` — the mounted shape is a shipping shape.** A behaviour's
conformance obligations are not weaker inside a seam than standing alone, so the
conformance harness carries a `mountInL1` mode that runs the *same universal ACs*
against the mounted shape: the fixture's instance is bound to a single full-width,
unstyled `slot` in a minimal L1 host document, with a keyframe at every probed
width so the wrapper can never be the thing that overflows. A form that overflows
only once it is inside a pinned slot is still a violation, and this is the
position that catches it.

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

**An invariant control states what its pinned presentation is (BUG-76).** The
declaration carries one sentence, `invariantPresentation`, saying what the
pinned presentation actually *is* (for example "visually hidden — clipped to
1×1px …"). Every reference surface that describes the control projects that
sentence rather than writing its own words, and states that an invariant
control **cannot be bound from L1** — which is why the edit catalogue omits it.
One source, many surfaces: a hand-written description that contradicts the
stylesheet is the failure this closes.

That invariant presentation is a **real stylesheet beside the component** — an
ordinary CSS file, not a block embedded in a template. It is read once at build
time into the committed artifact the render composes the page stylesheet from,
and pinned against staleness by re-extracting from the sources and comparing. The
move was verbatim: byte-equivalent to what the template's block held, modulo the
dedent from leaving it. The conversion adds no rule and entrenches none that is
being removed elsewhere.

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
channel built for editing it. The edit channel keeps switching the behaviour off
in the portable render as it did in the filesystem one: a module-mounting page
served from the edge emits its markup with the endpoint and the submission verb
dropped, so a submit cannot leave the page the editor is working on.

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

### A third module on the same contract: `account-chrome` (REQ-200, v2 by BUG-76)
Sign In and the account portal are **not platform chrome**. They are a feature
of *any* site that has accounts, and the platform's own front page is simply the
first such site. They therefore ship as a behavior module beside `contact-form`,
bound to an L1 slot like any other, so **L1 decides where they go and what they
look like**. A site can put the portal link in its footer and the Sign In
control in its header.

- **Gated by a site-level declaration, never derived.** A site declares what it
  *has* in a small closed record on its own definition,
  `config.capabilities.accounts`. The renderer hands the whole record to
  **every** module as a prop, exactly as it hands down the locale, and the gate
  is the module's own: `account-chrome` renders nothing unless `accounts` is
  declared. The renderer grows no branch naming a capability. The flag is not
  derived from "does this business have any members", because the first member
  signs up *through* this control.
- **Every state is in the published snapshot.** A published site is immutable
  bytes, so the module renders all three states (signed out with a Sign In
  control, signed in with a portal link, and the builder link) and marks the
  module root as signed out. The serving Worker names the current state by
  rewriting that one attribute, which this story does not own. The rules that
  hide the non-current states are the module's own CSS: they express a
  behavioural state no static L1 subtree can, the same reasoning as the
  carousel's current-dot rule. The builder link is a third state, visible only
  when the signed-in person **operates at least one business**. That is a fact
  about the person, so the module has no branch on which site or business it
  renders for.
- **The no-JS baseline is a working sign-in.** The dialog is a real
  `<form method="post">` against the configured sign-in endpoint, rendered
  **open**. Script folds it behind the Sign In control, makes it a modal and
  upgrades the submit to `fetch`, so script only ever subtracts.
- **The address field's prompt has a visible route (BUG-76).** The field's
  programmatic `<label>` is an invariant element, clipped to 1×1px under every
  setting; it carries the configured `emailLabel` to assistive technology and
  never paints. Where a visitor *reads* the prompt is `config.labelMode`, with
  the same two answers `contact-form` gives the name: `placeholder` puts the
  words inside the address box as the field's `placeholder`; `visible` (the
  default) leaves them to be authored as an L1 text run beside the control. A
  panel authored purely from config therefore shows a visible prompt.
- **The panel becomes the confirmation (BUG-76).** The overlay form holds three
  parts and shows one: the authored `dialog` subtree (with the clipped label),
  the authored `sent` subtree, and the authored `error` subtree. When the request
  **completes, at any status**, the dialog part is hidden and the `sent` part
  shown, so the field, the submit and the close are no longer presented. The
  response is never read, so a known and an unknown address are
  indistinguishable by construction. Only a request that never reached the
  server (a thrown `fetch`) shows the `error` part, and it leaves the form
  standing for a retry. There is no module-painted message anywhere: both texts
  are the author's L1 subtrees, styled and placed like the panel.
- **The portal and builder controls are links**, which is why `a` joined the
  control tags. Their `href` is the module's attribute and passes the module's
  URL safety check.
- It **ships an L2 slot preset** registered by behavior id: one L1 subtree for
  each of its six required slots (including a default sent card and a default
  error card), so a site can mount it without authoring L1.

**All three modules convert through the one mechanism, with no per-module
machinery.** `contact-form` is the module three real sites actually mount;
`carousel` is in the catalog and in no site — and it converts by exactly the same
route, which is what proves nothing was special-cased for the module that
happened to be in use.

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
values are checked against their typed field specs and config keys against the
declared set; every slot subtree must parse as a valid L1 node (the **security
line** — slot content can never smuggle raw HTML/CSS/JS past the L1 envelope)
and slot names are checked against the declared set; and every control binding
is checked in both directions.

The contract is published under the `Behavior*` names: a behavior's contract type,
its **component type** (the props-to-markup function), its props, its
config-field, slot and control specs, its slot values, its instance shape, its
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
its published `Behavior*` naming, the plain-function component artifact and the
portable catalog that follows from it, the module's own escaping boundary,
instance validation incl. the slot-as-L1 security line, the two-directional
control check and **the closed config and slot key sets refused at the write
boundary (BUG-76)**, **the localisation of schema errors inside behavior slots and
the complete error report on a refused write (BUG-76)**, **the page-level binding
rule and its rejections (REQ-93)** and **`mountInL1` as the shape a behaviour
inherits its obligations in**, the zero-CSS obligation and its two declared
carve-outs (invariant elements as a real stylesheet, with their declared
`invariantPresentation` projected to every reference surface, and the
edit-channel settled state), the two reframed survivor behavior modules and their
observable behaviour in both the filesystem and the edge runtime, **the
`account-chrome` module (REQ-200, contract v2 by BUG-76)**: its site-capability
gate, its three-state snapshot, its no-JS baseline, its `labelMode`, its
one-of-three overlay with authored `sent` and `error` slots and the status-blind
confirmation, its link controls and its slot preset, together with the
capabilities prop every module receives and the `a` and `label` control tags.
Also in scope are the L2 default-look presets, the shipped-client-JS asset, and
the isolation conformance dimension — including its client-side half, that an
enhancement never cancels a baseline it cannot itself complete.

**Out of scope**: the L1 substrate itself (STORY-83 / CAP-70) — including the
`control` node kind, its emitter and the emitter's own safety properties, and the
L1 slot leaf's renamed field, all of which STORY-83 owns; the capture→L1 fold
(STORY-84 / CAP-71), including folding a captured control into a `control` node
and excluding invariant elements from the reproduction value gate; the CLI
launcher's own server and the removal of the build framework from the repository
(STORY-e15a19ef — a separate failure surface: this story is the module contract,
that one is the launcher and the dependency); the builder origin, the store it
reads and the routes that serve these channels (STORY-e674c60a). Also out of
scope: the serving Worker's half of account-chrome (reading the session, checking
the cookie domain, rewriting the state attribute, refusing the shared cache, and
the apex site), which the public-site serving story owns; the sign-in issue
endpoint and anything that mints a session (not built by REQ-200); future
behavior modules (payments, email-capture); the deleted pre-pivot layout modules and
their dials (superseded — tracked as upgrades to STORY-80/81/82).

## Technical Context
- The contract lives in the framework module layer (`BehaviorMeta`,
  `BehaviorComponent`, `BehaviorProps`,
  `validateBehaviorConfig/Slots/Controls/Instance`, in `modules/behavior.ts`);
  slot validation delegates each subtree to the L1 node schema (CAP-70), which is
  the load-bearing security boundary (DOC-2: structured-only, validated by
  construction).
- The behavior catalog is a registry keyed by `<id>@<version>`; the generator
  resolves each site instance's pinned `id`+`version` to its vetted component.
  Module versions bumped by the pivot: carousel v1→v2, contact-form v2→v3; REQ-96
  bumped both again (carousel v3, contact-form v4) because deleting `config.view`
  and replacing the `intro`/`submit` slots with a required `form` slot are
  breaking contract changes. (REQ-87's rename was mechanical and bumped no version.
  REQ-148's conversion bumped no version either: it changes the artifact a module
  *ships*, not the contract an instance is written against.) BUG-76 bumped
  account-chrome v1→v2: removing `sentMessage` and requiring two new slots is
  breaking by the same definition.
- **The mechanism is removal, not precompilation (REQ-148).** The ticket opened
  framed as "precompile the templates and bundle the compiled render function";
  investigation settled the opposite. Neither survivor used a single feature of
  the template framework — no island, no hydration, no request/URL access, no
  layout, no child slot — only its props object, plain TypeScript, a call into the
  L1 fragment renderer (already portable) and two raw-HTML interpolations.
  Precompiling would still have dragged the framework's *runtime* into the edge
  bundle (the markdown/Shiki/Prism graph and a `virtual:` specifier no Worker
  bundle resolves) and added a build artifact that can go stale. Becoming plain
  functions **deleted** the container factory, the injected container option, the
  "needs the transform" render branch, the unresolvable-module resolver seam, the
  node-only render wrapper, the template ambient declarations and the CSS
  scanner — and left one render entry point, which is what makes host parity true
  by construction rather than by comparison.
- **A pre-existing defect is now structurally impossible rather than fixed.** The
  module-CSS fold used to scan each component's whole source for `<style>`-shaped
  text, and two such things are not style elements: a doc comment that merely
  *mentions* `<style>`, and the self-closing per-instance style tag in the body.
  Both opened a match that ran on to the next real closing tag, folding a
  component's imports, props interface, script body and markup into every
  generated stylesheet. REQ-96 repaired the scanner; REQ-148 deleted it. Module
  chrome is a real `styles.css` read whole, so there is no scan to mis-anchor and
  no component source anywhere near the stylesheet composition.
- **Security stays construction-time, and the module now owns an explicit half.**
  The inversion moves *presentation* to L1 and nothing else: the module still
  authors the `action` through `assertSafeUrl`, the `name` / `type` / `required`
  attributes, and the label pairing; the L1 emitter escapes every attribute value
  and refuses `class`, `style` and `on*` attribute names outright, so a module
  cannot hand presentation back to itself and there is no freeform key that routes
  to raw CSS. What changed with the conversion is that the module's *own* chrome
  is no longer escaped by a compiler on its behalf — the two sinks are named and
  the rules are the L1 emitter's, deliberately identical because the two emit into
  one document. The safety envelope must not degrade from "guaranteed by
  construction" to "hopefully validated" — that is the framework's value
  proposition (DOC-24).
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
- **Rendered-output equivalence across the conversion was measured, not assumed.**
  Both real sites (4 live `contact-form` instances between them) were rendered on a
  clean pre-conversion checkout and again after: the pages are identical once
  inter-element whitespace and the compiler's inert per-component scope attribute
  are normalised; the page stylesheet is identical ignoring the dedent; the client
  bundle is byte-identical. The one non-whitespace difference is an empty `action`
  emitted as `action=""` rather than omitted — the same thing in HTML.
- The shipped client asset mirrors the module-chrome fold (`getModuleCss` →
  `theme.css`; `getModuleClientJs` → `capabilities.js`), referenced once per page
  as `<script type="module">`. Both read the committed build artifact rather than
  the sources, so the composition runs in a runtime with no filesystem; a UAT
  re-extracts from the sources and compares, because a generated file that goes
  stale silently would serve last week's chrome with nothing to signal it.
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
  (safety/security/x-browser/responsive) are the DOC-20 universal ACs. The
  harness's negative fixtures — the deliberately-broken modules that prove the
  dimensions discriminate — are plain behavior components too, mounted through the
  *same* render path via the injected test-only resolver, so a fixture needs no
  build step and cannot drag a transform back in through the test suite.
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
- **account-chrome (REQ-200).** `account-chrome@2` (`modules/account-chrome/`)
  sits beside `contact-form`, `carousel` and `account-portal` in the catalog.
  `BehaviorProps` gains an optional `capabilities` (the site's
  `SiteCapabilities`), which the generator passes to every module instance from
  `site.config.capabilities ?? {}`. The marker the serving Worker rewrites
  (`data-account-chrome="signed-out"` / `"signed-in"`, plus
  `data-account-chrome-businesses`) is declared in the module's `session.ts` and
  exported from the framework's worker entry, so producer and consumer are one
  file. `L1ControlTag` gains `'a'` (REQ-200) and `'label'` (BUG-76). The `control`
  node and its emitter remain STORY-83's. What this story owns is that a module
  may *declare* a link control. The preset lives in `l2/account-chrome.ts` and is
  registered in `l2/presets.ts` under the behavior id. The sign-in POST sends
  `{ email }` as JSON with `credentials: 'same-origin'`.
- **account-chrome v2 (BUG-76).** Config gains `labelMode: 'visible' |
  'placeholder'` (default `visible`; any other value reads as the default) and
  loses `sentMessage`. Slots become `signedOut, signedIn, businesses, dialog,
  sent, error`, all required. Inside the `<form>` the component emits three
  wrappers (`data-account-chrome-form`, `-sent`, `-error`); the latter two start
  `hidden`, and `client.js` toggles `hidden` on them. The two invariant `<p>`
  message elements and their stylesheet rules are deleted; there is no fallback
  message text in the module. The `emailLabel` control's declared `element` is
  `label`, and `contact-form`'s label control carries the same correction.
  `BehaviorControlSpec.invariantPresentation` is the one sentence the KB
  projection (REF-behaviors) appends for an invariant control, after "cannot be
  bound from L1, and is absent from the catalogue for that reason". The committed
  `1stcontact` draft instance was migrated to v2 in the same change.
- **account-chrome endpoint doc (BUG-76 D6).** `meta.ts`'s `signIn` doc names
  `POST /sign-in` on the control app (REQ-202) as a 1c-hosted site's endpoint.
  This is doc-only with no runtime surface; per the operator's decision it
  carries no AC or UAT.
- **Strict behavior keys and slot-error localisation (BUG-76).**
  `validateBehaviorConfig` and `validateBehaviorSlots` prepend one error per
  undeclared key (`field: config.<k>` / `slots.<k>`, message naming the key and
  `(declared: …)`). The render path does not call them, which is what lets a
  stored instance with a stray key still paint. `chooseBranch` in
  `site-schema/src/issues.ts` picks the single branch whose failures are not a
  root-level type mismatch; `tagVocabulary` names the tag and its values when
  every branch was rejected on it. `validateOrThrow` (`cli/edit.ts`) joins up to
  10 errors and appends "…and N more" when it cuts; `path` still names the first.
- **Resolved: the capability record is closed (REQ-200).** `siteCapabilitiesSchema`
  was a plain `z.object({ accounts })`, so zod stripped an unknown key such as
  `acounts` instead of rejecting it. It is now `.strict()` (report-078b06e6,
  BUNDLE-38), so a misspelt capability key fails site validation, as AC-2329 states.

### Reconciliation Decisions

**2026-11-09 (BUNDLE-44 / BUG-76): account-chrome v2 supersedes parts of
AC-2331 and AC-2330, which are modified rather than retired.** BUG-76's
operator decision (2026-09-11, "change the contract") explicitly removes
`sentMessage` and the hardcoded error string, adds required `sent` and `error`
slots, and replaces "message shown, field and submit disabled" with a swap that
hides the form. Most of each criterion (catalog membership, URL config, preset,
conformance, no-JS baseline, status-blindness) still holds, so each is rewritten
in place to the v2 contract. The resolution ladder stopped at level 1: the
ticket's own Decision section states every point.

**2026-11-09 (BUG-76): the cap on reported errors is formalised.** BUG-76 D5
says a refused write reports "every error it was given". The code reports up
to 10 and states how many more were cut. Intent is silent on a cap; the code's
reasoning (a single bad node can produce a long tail of consequent issues) is
sound and the stated count keeps a truncated report from passing as complete.
The AC therefore says "every error, up to a stated cap, with the remainder
counted". This is a reconciliation decision, not a contradiction.

**2026-11-09 (BUG-76): slot-error localisation is recorded here, not on
STORY-83.** The fix lives in the site-schema error projector, which STORY-83's
substrate also uses. The observable failure BUG-76 names is specific to behavior
slots, and the criterion is stated as "an error inside a behavior slot reports
what the same node reports in the page tree", so it sits with the behavior
contract. STORY-83's own error-reporting criteria are left untouched.

**2026-11-05: account-chrome is recorded on this story, not on a new one.**
REQ-200 calls it "the second such module" beside `contact-form` and builds it
entirely on the existing contract: catalog, slots, controls, preset, conformance
and the invariant stylesheet. It adds no new capability bucket, only a module in
an existing catalog, a prop every module receives, and a control tag. The
Worker-side half (session reading, cookie-domain check, cache refusal, the apex
site) is a serving concern and stays with the public-site serving story.

**2026-11-05: the error path and the edit-channel endpoint are formalised.**
REQ-200 says only that a known and an unknown address are indistinguishable. The
code also shows a distinct *could not reach the server* outcome when `fetch`
throws, and leaves the form usable. In the edit render it omits the form's
`action`. Both are formalised in AC-2330. The first is the only exception to
status-blindness, and the ticket's own "What was built" justifies it as a fact
about the network rather than the address. The second matches the edit-channel
rule this story already holds for module-mounting pages (AC-1413). (Since
BUG-76 the network-failure outcome is the author's `error` slot rather than a
module-painted string.)

**2026-11-05: account-chrome's CSS fits the zero-paint line without a new
carve-out.** Its stylesheet holds wrapper zeroing, state-visibility rules, the
invariant label, and the modal geometry that applies only after enhancement. The
first three map onto existing categories in AC-809: behavioural mechanics, a
behavioural state signal like the carousel's current dot, and an invariant
element. Modal geometry is behavioural mechanics, because a modal that did not
cover the page would not be one. AC-809's wording ("neither survivor") is left
for its owning reconciliation. AC-2331 states the obligation for this module
directly.

**2026-08-31 — the module's own escaping boundary is formalised as a criterion.**
REQ-148's stated ACs cover the runtime, the mechanism, the two survivors, the
conformance harness and the byte-equivalence of the chrome. They are silent on
escaping: the ticket notes only that each component "emits HTML with a couple of
`set:html` fragments". The conversion nevertheless moved a real obligation from
the compiler to the module — a template compiler escaped every interpolation
implicitly, and a function returning a template literal escapes nothing unless it
is written to. The code implements this deliberately (one named sink per
destination, matching the L1 emitter's rules, with no raw-passthrough helper), and
it is the single thing the conversion could silently have lost while every other
criterion still passed. Reconciliation formalises it now as an acceptance
criterion of this story rather than leaving the matrix with a security property
that only a comment asserts. Rationale: DOC-2 makes the structured-only boundary
load-bearing, and a module is the sanitization boundary for its own config
(DOC-25 §10.4) — an unstated obligation there is exactly the kind of gap
reconciliation exists to close.

**2026-08-31 — the conformance-fixture criterion states the fixture shape, not
the skip count.** REQ-148's implementation record notes conformance moving from
"5 passed, 15 skipped" to 20/20. That improvement was environmental (the matching
headless-browser build was installed), not a consequence of this story's code, so
the criterion asserts what the code delivers — the negative fixtures are plain
behavior components resolved through the same path as a catalog module, and they
still discriminate — and does not claim credit for the browser becoming
available.

**2026-11-08 (BUNDLE-42 / BUG-75): the composed asset is loaded as a module, not pattern-matched.**
The intent (BUG-75's "What must change"), the code and these ACs agree on every
point: own-block scoping, `export` stripped, behavior marker kept, and a UAT that
parses the composed asset as an ES module. The resolution ladder stopped at level
1, and no transcript was needed. One choice was left to reconciliation: BUG-75
asks the UAT to "parse" the asset. AC-702 sharpens that to *load it as an ES
module*, because parsing as a module is the behaviour the browser applies, and
pattern-matching the text would not have caught this defect.

### Reconciliation UAT file
This story's reconciliation UATs (AC-697…AC-704) live in
`tests/reconciliation-behavior-modules.test.ts`. The file was renamed and
repaired in the same reconciliation as the contract rename itself: imports
resolve `modules/behavior`, identifiers use the `Behavior*` names, and fixtures
declare `kind: 'behavior'`. The repair was test-only — no runtime code changed.
BUG-76's free-coded UATs are `test_UAT_FC_BUG-76_{account_chrome_contract,
undeclared_keys,slot_error_localisation,sign_in_confirmation}`; the REQ-200
account-chrome UAT was updated to the v2 shape, carrying its REQ-134 property
(one outcome at every status) across.

### Composing the client asset (BUG-75, BUNDLE-42)

The shipped client asset (`capabilities.js`) is built by composing every
catalogued behavior's `client.js`, in catalog order. Each behavior goes into
**its own block**, preceded by its `/* behavior: <id> */` marker, with its
statement-leading `export` keywords stripped. A block gives each behavior its own
lexical scope: `const`, `let`, `class` and (in a module, which is always strict)
`function` are block-scoped. So two behaviors may declare the same top-level name
and the asset still parses. Stripping `export` costs nothing. Every behavior wires
itself up when the DOM is ready, and nothing imports the asset. The exports exist
only for the per-behavior unit tests, which import each `client.js` source
directly.

The asset must be **valid, not just fresh**. Before this fix the behaviors were
spliced flat into one module scope. `contact-form`, `account-portal` and
`account-chrome` each declare `ERROR_SELECTOR`, so the whole file was a parse-time
`SyntaxError` and no behavior ran on any site. Nothing caught it, because the only
check on the composed asset compared its bytes to its sources. AC-702 now requires
that the asset load as an ES module. AC-2476 requires that a shared top-level name
can never break the asset or stop any behavior from running.

**Remaining hazard (not new behavior):** a `var` declaration would still escape
its block. No `client.js` uses `var` today. That constraint is recorded here so
that a future behavior author sees it.

**Out of scope:** REQ-212's L1 dialog emits its own inline `<script>` and does not
go through `capabilities.js`. This change leaves that path alone.

## Dependencies
- Plan item 1 — L1 Layout Substrate + Safety Envelope (STORY-83 / CAP-70): slot
  content is validated and rendered as L1 subtrees, and the `control` node kind
  and its emitter live there.

## Story Points
3