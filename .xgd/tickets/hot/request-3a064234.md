---
uid: request-3a064234
id: REQ-96
type: request
title: 'Behavior modules must be layout-agnostic by construction: an L1 `control`
  node for leaf elements'
created_by: xgd
created_at: '2026-07-26T00:46:55.683452+00:00'
updated_at: '2026-08-06T04:55:03.571900+00:00'
completed_at: '2026-08-06T04:55:03.571900+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: aa9c49e144c991ba34ad30de044206612f7d46df
    reconcile_sha: null
    main_sha: null
  version: 0.0.208
  story_points: 13
  bundled_in: bundle-ee56a66e
  chat_comment: comment-4fbb25f7
---

## The gap

[[DOC-25]] §1.3 states the rule plainly — *"Appearance is 100% L1, inside the
validated L1 security envelope. The module **wraps** L1; it never paints it."* —
and §2 says config is data-only, *"never aesthetics."*

Neither module obeys this today, and one of them **cannot**.

### Both modules paint

`contact-form` carries a full stylesheet: field `border`, `border-radius`,
`background`, `padding`, the `flex-direction: column` stack, the `gap` between
fields, label typography, and the submit button's fill/padding/`align-self`.

`carousel` is no better, and its violation is more instructive:

```css
.carousel__track { gap: var(--space-6) }
.carousel.view-peek .carousel__slide { flex-basis: 85% }   /* → 60% at ≥768px */
.carousel__dot { width: var(--space-2); background: var(--color-border) }
```

`config.view = 'peek'` is an **aesthetic dial wearing behavioural clothes** — it
resolves to a flex-basis. That is exactly what §2 forbids, shipped in the worked
example the doc uses to explain the rule.

### Why `contact-form` cannot comply

The slot model has exactly one composition direction: **the module wraps L1**. A
slot is a container the module renders *around* an L1 subtree.

That works when the behavioural element is itself a container — a carousel's
`<li class="carousel__slide">` really can hold a slide's entire L1 look.

It is structurally impossible for **leaves**. `<input>` is a void element;
`<textarea>`'s content is its value. There is nowhere to put an L1 subtree. So
for form controls, "appearance is 100% L1" is not merely unmet — it is
unreachable, the module *must* paint, and **no validator can catch it** because
the contract has no vocabulary for "this element's look belongs to L1".

The `submit` slot is the tell. It works only because `<button>` happens to be a
container — and even so, REQ-88 had to add `.contact-form__submit--l1` to make
the module stop painting over the L1 chip bound into it. That modifier class is
the design gap made visible.

## The change

Add the second composition direction: **L1 wraps the module**, for leaves.

An L1 node carries `control: '<name>'`. At render, L1 emits the element the
module declared under that name, with L1's class, geometry and paint axes. The
module supplies only the element's **attribute bundle**.

| | owns |
|---|---|
| **L1** | class, geometry, every paint axis — for the behaviour's own controls, not merely decoration around them |
| **module** | which elements must exist; their `type` / `name` / `required` / `for`↔`id` wiring; the endpoint; the client behaviour |

The module then ships **zero CSS**. Not less — none. Layout-agnostic *by
construction* rather than by discipline, which is the only version a contract can
enforce.

### Two refinements that fall out

**1. Not every element is L1's to style.** The honeypot must be invisible, the
Turnstile mount must sit where the widget expects it, the visually-hidden label
must stay out of flow. Those are **obligations, not taste** — a designer must not
be able to reveal the honeypot. So a module keeps a small set of **invariant**
elements whose presentation is fixed by the obligation rather than by the author.
The line is not "L1 owns everything"; it is "L1 owns everything the reference can
legitimately vary."

This also explains a measurement defect seen on GA: those invariant elements
(hidden labels, honeypot inputs, Turnstile divs) put **15 repro-only objects**
into `values-diff`, sliding the control pairing so every field mispaired against
its neighbour and all 26 reported deltas became unreadable. Same category, second
consumer — the gate must exclude module-invariant elements. See [[request-16253634]].

**2. Security stays construction-time.** L1 contributes class + geometry + paint
and *only* those. The module still authors `action` through `assertSafeUrl`, the
`name`/`type`/`required`, and the label pairing. The safety envelope ([[DOC-24]])
must not degrade from "guaranteed by construction" to "hopefully validated" —
that is the framework's entire value proposition.

## The cost (deliberate)

Deleting a module's stylesheet means a form authored **without** a capture has no
look at all, so every site would pay authoring cost for something that used to be
drop-in.

The stylesheet is therefore **relocated, not deleted** — to an **L2 preset**, the
optional library of vetted L1 designs [[DOC-24]] already anticipates. The default
look becomes a starting point instead of a ceiling. This is the same move the
pivot already made for layout modules ([[DOC-14]] → [[DOC-23]]).

## Why now

[[request-7ff1bacd]] (REQ-88) reproduced gigabytealchemy.ai to a passing
cross-gate (perceptual mean 2.61/255, l1-gate maxΔ 0.9px, 0 fold residuals). The
**only** visible defect left is the form, and the perceptual diff is emphatic —
the top 5 regions are all form, the two buttons worst (mean 120 and 145), while
the rest of the page sits near zero.

Three deltas, one root cause — the module's stylesheet deciding presentation the
capture had already measured:

| | reference | ours |
|---|---|---|
| field surface | transparent, dark 1px border | white fill, `#e5e7eb` border (invisible) |
| field height | 50px (textarea 146) | 44px (textarea 116) |
| Subscribe | inline, right of its field | stacked below it |

All three close under this change: fill/border/radius become L1 axes, 44→50
becomes L1 geometry, and **inline-vs-stacked stops being a concept** because each
control carries its own geometry. It also recovers the submit button's exact
per-width position, which REQ-88 knowingly traded away (previously pinned to
0.5px by [[bug-24975383]]) when it lifted the captured chip into the `submit`
slot and had to drop its page-absolute geometry.

## Scope

1. **Amend [[DOC-25]]** — the two composition directions, the invariant-element
   carve-out, and the `control` node contract. (Done alongside this ticket.)
2. **L1**: a `control` node kind in the schema + `renderL1Fragment`, emitting a
   module-declared element with L1 class/geometry/axes.
3. **`contact-form`**: declare elements + attribute bundles; delete the
   stylesheet; keep the invariants.
4. **fold / repro**: emit a `control` node per captured control, geometry rebased
   to the form's seam; bind them.
5. **GA**: re-measure — target is the three deltas closed and the submit position
   recovered.
6. **`carousel`**: same treatment; `config.view` is expected to fall out as the
   aesthetic dial it is.
7. **L2 preset** carrying the current default look, so an uncaptured form still
   renders.

## Acceptance

- `contact-form` and `carousel` ship no CSS beyond their invariant elements.
- A `control` node renders the module's element with L1's paint and geometry.
- GA's three form deltas close; the submit button's per-width position is pinned
  to the oracle again.
- The safety envelope is unchanged: `action` still passes `assertSafeUrl`, labels
  stay associated, the honeypot stays hidden — all module-authored.
- `values-diff` no longer pairs against module-invariant elements.


---

## Outcome (as implemented)

All seven scope items landed. What the implementation added beyond the plan:

### The `control` node

`packages/site-schema/src/l1/schema.ts` gains an `l1ControlSchema` leaf carrying
`control` (the module-declared element name) plus the same paint/geometry axis
bag a `text` run has. `renderL1Fragment(nodes, prefix, controls)` takes the
mounted behavior's element roster and emits the declared tag with L1's class and
axes; the module contributes only its attribute bundle.

Three properties the plan did not call out but the emitter needs:

- **UA-chrome reset.** A form control arrives with a border, fill, padding and
  its own font that paint *through* an L1 subtree which simply declined to set
  those axes. The sole emitter neutralises it once, before the authored axes, so
  no module needs a reset stylesheet.
- **`::placeholder` re-pointing.** The placeholder pseudo-element does not
  inherit `color`, so a placeholder-labelled field kept the browser's grey inside
  the box regardless of what L1 authored.
- **Inert degradation.** A control naming an element no mounted module declares
  renders nothing. A bare `<input>` would paint UA chrome and collect a field
  nothing submits.

`validateBehaviorControls` closes the loop the old contract could not express:
every bound name must be declared, and every required declared element must be
bound.

### `getModuleCss` was shipping component source as CSS

Found while pinning "the module ships no CSS". Two `<style>`-shaped things in a
module source are not style elements — a doc comment that *mentions* `<style>`,
and the self-closing `<style set:html={…} />` that carries per-instance CSS — and
the scan treated both as opening tags, running each match on to the next real
`</style>`. `carousel` was folding its own imports, props interface, script body
and markup into every generated `theme.css`. Pre-existing (predates REQ-96), but
it makes the acceptance criterion uncheckable, so it is fixed here: the scan
skips the frontmatter and strips self-closing tags first.

### Offline `1c refold`

`l1.json` and `forms.json` are a pure function of the retained oracle and the
current fold, so every fold change makes every stored bundle stale. The only way
to pick that up was `1c capture page <url>` — re-hitting a third-party site to
re-derive something we hold every input for, and re-rolling the oracle in the
process, landing a fold change and a reference change inseparably. `1c refold`
re-runs the fold against the retained `multistate.json` and rewrites only what
the fold produced.

## Measured result — gigabytealchemy

Cross-gate **PASS** (`1c gate gigabytealchemy --ref …`):

| | REQ-88 baseline | now |
|---|---|---|
| perceptual mean | 2.61 / 255 | **0.69 / 255** |
| values-diff deltas | 26 | **2** (both Type-B emergent) |
| unmatched reference objects | — | **0** |
| repro-only objects | 15 | 7 (all pre-existing L1 band boxes; no form element among them) |

The four reference controls now pair one-to-one and reproduce exactly:

| control | reference box @1280 | ours |
|---|---|---|
| Your name | 664,3784 528×50 | identical |
| Your email | 664,3850 528×50 | identical |
| Your message | 664,3916 528×146 | identical |
| Your email address | 88,3900 313×50 | identical |

All three deltas the ticket named are closed:

- **field surface** — fill/border/radius are L1 axes; 0 deltas on all four controls.
- **field height** — 50px and 146px, from the capture, not the deleted 44px default.
- **Subscribe inline** — at ≥768 the button sits on its field's row, starting after
  it ends; at 320/375 it stacks below, as the reference does. "Inline vs stacked"
  ceased to be a concept.

The submit button's per-width position is pinned to the oracle again: the
seam-relative offset equals `round(ref.x − refField.x)` at every width ≥768.

## Test plan

`tests/req96-control-composition.test.ts` (13 UATs) pins the acceptance criteria
the per-module suites do not:

- both modules paint only their declared invariant elements (selector allowlist +
  absence of the exact properties the deleted stylesheets pinned);
- `theme.css` carries module chrome and no component source;
- a control node emits the declared element with L1's paint, and an unbound one
  degrades inertly;
- the safety envelope survived the inversion — `class` / `style` / `on*` are
  refused by the emitter, values are escaped, the label association stays
  module-authored, and controls stay inside the numeric envelope with no freeform
  key route back to raw CSS;
- capture skips `data-fc-invariant` subtrees *and* the accessible name they would
  otherwise source;
- the gigabytealchemy field heights and submit position match the retained oracle;
- the L2 preset gives an uncaptured form a valid L1 look.

Plus the three REQ-96 UATs already added to the per-module suites
(`req88-form-labelling-and-submit`, `reconciliation-behavior-modules`,
`req85-carousel`).

Full suite: 821 passing. Workspace typecheck clean.

## Follow-ups (not done here)

- `values-diff` still reports 7 repro-only objects on gigabytealchemy. All are
  pre-existing L1 section-band boxes with painted backgrounds that the reference
  capture never attributed to an element — unrelated to forms, and unchanged by
  this work.
- The bundle reports one unreferenced mirrored image asset
  (`AlchemistLabWithTech.png`) — a capture-attribution gap, also pre-existing.