---
uid: bundle-0d00566a
id: BUNDLE-41
type: bundle
title: REQ-210 + REQ-212 + REQ-213 + REQ-211 + BUG-69 + 4 more
created_by: xgd
created_at: '2026-11-08T12:30:04.545337+00:00'
updated_at: '2026-11-08T16:25:08.317540+00:00'
completed_at: null
last_field_updated: regression_anchor_uid
status: reconciling
fields:
  bundle_type: reconcile
  commits:
  - working_sha: b6aa1e567b777fbfa6ade0b5e7ae25f06b38c966
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 80ca5f5df92d496e7cf5ea516cce8f85c9bea2f0
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: f71b451f9b94150ca41140cf3a89fe5f8bab29d0
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: c8b1a59d9942bae3aef046e7747b1795d0754518
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 81d73b41afce173501734660d4ae37853aa9f1b9
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 3d8815a00e408c2543475389f3fc39f26ac50efd
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 40d7ed46ed3ed5913c9ca1970b4b062a10faf538
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 40a62e1a20812d3e9efcbaca908632b30c07cfbc
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 5c6afe51e32b612d8e91b7ea8ec840f9ace462e3
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 6dcdd7da7fc2f84376bd666a0109657c213d989f
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: b875d2fd67420185e56f557e88a9d6d0bdd62d99
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 6a892d8dbb1fffb0d43385c74a090a7fdb81643e
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: db47b9ce3b9cf98db59454829c128a348ed30867
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 3ddbd06a3a923ea99eeebce1c2b18191e4049de9
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 529687183a22ee27b8702dfe52ed541f975c0c82
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: f567a2eec2317ae71143f36054b7795a2ca4f140
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 37c1489a6bb5832721d84ed45c2cc5458c4956c0
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 32ecb0a35a913a469ad7d72816a5ef34cb191792
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  auto_merge_back: true
  priority: medium
  regression_anchor_uid: report-49607926
  session_builder: 8f67a0f4-f71f-4f88-9656-224802979826
  session_builder_started_at: '2026-11-08T16:05:23.977978+00:00'
---

# Bundle

This ticket bundles the following source tickets:


---

## REQ-210: The user can point: Marked Points on the edit preview

## What changes

**The user can point at the page instead of describing where they mean.**

*"Move the st a little closer to the 1."* **A little** is a continuous quantity with no
efficient encoding in language, so every iteration is a lossy round trip — intent →
words → guess → render → perception → words — and nothing in the loop carries a
number, so nothing converges. The session that produced [[DOC-52]] ran thirteen
iterations of exactly this and did not land the logo. That was not the AI being dim;
it was a channel with no bandwidth for the thing being communicated.

Marked Points gives that quantity a channel: **the user points, and the pointing
becomes text in the message.**

Specified in full in [[DOC-52]] §4.

## The principle

> The user's hand is a better encoder of position than the user's vocabulary, and the
> machine is a better encoder of alignment than either.

The user supplies intent — *roughly there, that feels right*. The AI supplies
precision — *exactly cap-aligned to 0.1 units*. **The AI retains final say over every
number actually written.** The user is not editing anything; they are saying what they
mean.

## The interaction

1. **Edit mode only.** View mode must behave exactly as published ([[DOC-28]] §7.1),
   and the edit bridge already refuses to bind without the `data-fc-edit` marker.
2. **A "Mark Points" toggle** within edit mode.
3. **Left click places a point** — a small high-contrast X with a label (*Point A*,
   *Point B*, …). Letters are reused after deletion.
4. **The label fades when the pointer moves away from it, or when the next point
   lands**, and returns on hover. **Not on a timer** — a timed fade fires while the
   user is still reading. The fade exists so a label never occludes where the next
   point goes.
5. **The label carries `x` and `+`.** `x` deletes the point. `+` inserts another pill
   referring to it.
6. **Dragging the X moves the point**, updating any live pill. First placement is
   usually approximate, so nudging beats delete-and-replace.
7. **Placing a point inserts a pill into the message composer.** On send the pill
   expands to the full spatial description below.

**A toggle, not a modifier-click.** Alt-click would avoid a mode, but it is a
power-user idiom, it is undiscoverable, and it does not exist on touch. The cost is
that the toggle **reassigns edit mode's primary gesture** — today a click resolves a
segment and opens its modal. If Mark Points is on and clicking the headline does not
open its editor, that must be unmistakable: crosshair cursor, persistent visible
state, and hover outlines kept but **dimmed**, because knowing which element you are
marking inside previews what the pill will say.

## The pill behaves like a pill

- **Atomic** — one backspace removes the whole chip, never part of it.
- **Cut, copy and paste work as expected**, carrying the pill's identity with it.
- **Deletion is undoable** — Ctrl-Z in the composer is what the user reaches for
  first.
- **Coordinates on hover**, so a reused letter can always be disambiguated.
- **Typing `Point A` re-resolves to it**, given lenient matching. A free safety net.

The `+` control exists because of a real and common failure: the user places a point,
starts typing, makes a mistake and **accidentally deletes the pill** — the X is still
on the page but there is no way to refer to it. `+` is preferred over "click near the
X again" because a proximity tolerance fights directly with placing a *new* point
nearby, which is exactly what a tight spacing question requires. It also independently
serves *"move this to A, and align that to A too"* — one point, two references, one
message.

## What a point resolves to

**This is the load-bearing decision.** `screenshot` takes `kind: 'edit'` but renders
**server-side**, so the marks — which live in the user's browser overlay — are never
in a render the AI sees. That is good twice over: marks cannot pollute `compare` and
cannot leak into the fidelity gates. But it means **the pill's expansion is the entire
channel.** There is no fallback where the AI squints at a red X.

A pill must **not** expand to raw viewport pixels. `(142, 88)` asks the AI to invert a
transform chain it cannot see. A point resolves **through the hit chain** and carries
every useful frame at once:

```
Point A — inside image node 0.1 (asset wordmark-option-a.svg)
  svg user space: (31.2, 24.8)    [viewBox 0 0 320 86]
  node-relative:  (58, 46) of 148×40
  viewport:       (142, 88) at width 375
  near:           cap-top of "1" (2.1u above), left edge of "Contact" (17u right)
```

- **Viewport width is essential.** L1 geometry is keyframed across six widths, so a
  point at 375 means something different at 1200.
- **Document coordinates, not client** — then scroll position stops mattering rather
  than becoming a third number to carry.
- **The render it was taken against** is included, so a stale reference is detectable.
- **Device pixel ratio is excluded.** User space is already CSS px.

**`near:` is not decoration.** The user is pointing at *"the top of the t"* — a
feature, approximately. If the pill reports a cap-height line two units away, the AI
can recognise the intent and place the element **exactly** on that line rather than at
the user's approximate pixel. That is the principle above made concrete, and it is
strictly better than snapping the X for the user, which would be a guess made at the
wrong end and would fight them when they genuinely meant *just below*. `near:` uses
the anchor vocabulary from [[REQ-209]].

**SVG user space does not require inlining the SVG.** The renderer emits
`<img src="…svg">` and one cannot hit-test inside an `<img>` — but given the img's
rect, the asset's viewBox and `preserveAspectRatio`, user space is a pure
scale-and-offset inversion, and the server knows the viewBox.

**Most of the resolution already exists.** The edit bridge already resolves a click to
`{ moduleId, slot, path }` plus the element, including the module/slot address-space
scoping, which is the genuinely hard part. It currently hands that to a modal instead
of to the chat.

**Implementation contract:** the preview iframe is currently unscaled, and point
capture depends on that. If a "fit to pane" zoom is ever added, click coordinates must
be un-scaled or every point silently lands in the wrong place.

## Lifetime — points last one turn

**Points clear on send.** Persistence only pays when a marked point stays valid across
a turn, and in the real loop it almost never does: the user marks a point *because*
they want that thing to move, and then it moves. Persistence would buy the minority
case at the cost of re-projection machinery — anchor to node plus offset, re-project
after render, invalidate when the node disappears. Clearing on send makes that entire
category of problem disappear.

Sent pills keep their literal coordinates in the transcript. That is history and needs
no machinery, and it means a reused letter can never confuse the AI.

**On send the Xs grey out and stay visible until the new render arrives**, so the user
can still see what they referred to while the answer is coming. They are already
inert, so this reintroduces no staleness.

**Dragging still earns its place within a turn.** It just does not need to survive the
send.

## The width-ambiguity rule

A point **inside a drawing** is width-independent — one coordinate space, no
breakpoints, one meaning. A point **on an L1 node** is width-dependent: marked at
desktop, *"move it here"* might mean at this width or at every width, which are
different edits to different keyframes.

**When a point resolves to an L1 node rather than into a drawing, the AI asks which
width the instruction is for, unless the user has said.** The viewport width in the
pill is what tells it to ask.

## Why this does not breach DOC-28 §7.3

[[DOC-28]] §7.3 is explicit: *"no adding, removing, reordering, resizing or
repositioning segments."* Marked Points does not touch it. **There is no write path,
no diff, no validation and no re-render** — a gesture produces a **message**, not a
mutation. Specifying intent is the same category of act as *"make the headline
shorter"*.

It also stays on the right side of [[DOC-46]] / [[DOC-33]]: **pointing at where you
want something is communicating, not designing.**

## What this does not do

- **No drag-to-communicate.** A drag is a delta, and a delta is redundant — once the
  AI can measure, it already knows where the thing is, so only the destination is
  needed. One point plus measurement is all a move requires.
- **No grid overlay.** As a positioning channel it is dominated by pointing:
  *"three squares closer"* requires a quantisation performed in the user's head and is
  only meaningful if the AI knows the square size. It remains worth building later for
  a different job — discussing spacing that already exists.
- **No freehand annotation.** Valuable for what language and pointing are both bad at,
  but it is critique rather than positioning and costs an image round trip.
- **No keyboard-only point placement.** Acceptable provided pointing never becomes the
  only way to express a position.

## Behaviour to verify

- With Mark Points off, a click in edit mode still opens the segment's modal.
- With Mark Points on, a click places a point and does not open a modal.
- A point inside an image node whose asset is an SVG reports SVG user-space
  coordinates consistent with the asset's viewBox, without the SVG being inlined.
- A pill expansion carries the viewport width, and coordinates are document-relative
  rather than client-relative.
- Deleting a pill from the composer and pressing `+` on its label restores a pill for
  the same point.
- A pill survives cut and paste within the composer.
- Points clear on send; the Xs remain visible and greyed until the next render.
- Multiple points marked in one turn expand to distinct labelled entries.


---

## Implementation — what was built, and the decisions taken along the way

*Added at the end of the free-coding session; the sections above are the intent and
stand unchanged.*

### Where each half lives

- **`packages/framework/src/l1/marked-points.ts`** — what a pointed-at pixel resolves
  to. Beside `edit-client.ts` for the same reason the bridge is beside the renderer:
  it reads the same stamp, and a copy in another package is free to drift from the
  markup it depends on. It holds the label namespace, the pill's text grammar, the
  transform-chain inversion, and the expansion.
- **`apps/control-app/src/builder/points.js`** — the overlay: the toggle's state, the
  Xs, the labels, the drag, the two label controls, and the send. It is here because
  this is where the chrome and the composer are.
- **`packages/site-schema/src/anchors.ts`** gains `nearestAnchors` — *which named
  lines are near this point*, which is [[REQ-209]]'s arithmetic asked from the other
  end. It belongs beside `anchorValue` rather than in whichever surface happens to be
  pointing, and it is what makes `near:` name features from the closed set rather than
  invent words for lines.

### Three modules are now served to the browser

`marked-points.ts`, `anchors.ts` and `measure-svg.ts` join `edit-client.ts` in
`FRAMEWORK_SOURCES`, so the browser runs the **one** implementation of each rather
than a hand-written copy. `anchors.ts` is what `relate` and `solve` answer from, and
`measureScript` is what the capture driver evaluates — a second copy of either would
be a second opinion about what `cap-top` means or where the ink is.

### `near:` is measured in the browser, by evaluating REQ-209's own script

`measureScript` is a string of browser JS **by design** — that is what the capture
driver evaluates in a page — so evaluating the same string in the builder is exact
reuse rather than a reimplementation. It cannot be done server-side in the deployed
product: `measure_drawing` needs a browser the Worker does not have.

It runs in the **builder's own document**, not the preview's, and that is not a
shortcut. A drawing referenced by `<img>` renders as an isolated document, so the
page's `@font-face` rules cannot reach inside it; measuring against the page would
measure a drawing the visitor never sees. The script hosts the drawing in a shadow
root under `all: initial`, which is the same isolation from whichever document calls
it.

**`near:` degrades to nothing rather than to a guess.** A measurement that could not
be taken costs that one line; every other frame is already exact.

### The inversion has two stages, and both are real

`object-fit` decides the box the drawing is painted into; the drawing's own
`preserveAspectRatio` then decides how its viewBox maps into *that*. They agree — and
collapsing them looks harmless — right up until an `object-fit: fill` on a box of a
different ratio, where a single stage puts every point in the wrong place.

### The mode

- The toggle is named by the **edit mode only**, so the strip does not render it in
  View. That is not sufficient on its own: a toggle that is merely unreachable is
  still on, so leaving edit mode also turns it off, and the strip's omission becomes
  true rather than decorative.
- The overlay listens in the **capture phase** and stops the event, so the bridge is
  neither modified nor consulted. Turning the mode off removes the listener and the
  bridge is exactly what it was.
- The overlay's own controls are excluded from that interception — otherwise the mode
  would consume its own `+` and `×` and place a second point on top of the first every
  time someone tried to delete one.
- Its chrome is **injected into the preview** rather than emitted by the renderer: a
  published or standalone edit render has no business carrying a builder feature's
  stylesheet, and injecting it means the mode needs no re-render to appear.
- The marks live **inside the preview document**, positioned in document coordinates
  against the initial containing block, so scrolling is the browser's problem rather
  than a third number to carry.

### Deleting a point takes its pills with it

Not merely tidy. Letters are reused the moment they are free, so a `[Point A]` left
behind in the draft would quietly bind to a **different** point the next time A is
handed out — a message that says one thing and means another, with nothing on screen
to show it.

### Only referenced points are sent

A point whose pill was deleted and never restored is one the reader chose not to
mention; sending it anyway would make the `+` control pointless and the message wrong.

### The bubble keeps the pill; the turn carries the expansion

Expansion happens in `createChatPanel`'s new `expandPrompt` seam — the last thing that
happens to a draft before it becomes a turn — rather than in the composer. So the
bubble the reader watches appear keeps the short form they typed, while the assistant
is told the whole thing. A reloaded transcript replays what the session recorded, the
expansion, which is the honest archive: it is what the assistant was actually told.

### Staleness is an ordinal, not a clock

The pill reports `page home, render 3`. It has to be *comparable*, not meaningful: a
later message quoting a lower ordinal is a stale reference, and that is decidable
without anyone knowing what time it is. A new preview document is a new render, so the
ordinal advances and the marks — including the greyed ones a send left behind — go
with the document they were taken against.

### Known limits, stated rather than discovered later

- **A pill is inserted at the end of the draft, not at the caret.** The shared
  composer exposes `getInputMarkdown`/`setInputMarkdown` and no caret API; the pill
  goes where the reader was almost certainly about to type anyway.
- **A pill is a literal in the draft's own markdown**, which is what makes cut, copy,
  paste and lenient re-typing work for free, and what makes it not an atomic chip: a
  backspace takes one character. `+` is the recovery the ticket already specifies, and
  it is what the reader reaches for when a pill has been damaged rather than deleted.
- **`near:` is drawing-only.** Page anchors are `measure_page`'s (DOC-52 §3.6, §5.6),
  which is deliberately unscheduled; a point on an L1 node reports every other frame
  and carries the width-ambiguity note instead.


---

## REQ-212: Modals in L1 — the overlay role and the disclosure verb

# Modals in L1 — the overlay role and the disclosure verb

**Status:** design + free-coded substrate change. Amends [[DOC-23]] (L1 substrate)
and cross-references [[DOC-25]] §10 (the behavior-module contract).

## 1. What prompted it

1st Contact's own header wants a Sign In link that opens a modal: an email field
and a Continue button, which on submit replace the panel's contents with *"Please
check your email. If you are already a member we have just sent you a sign-in
link."*

That exact flow already exists as a behaviour module — `account-chrome`
([[REQ-200]]) — so putting it on the site is a site-definition job. The question
this ticket answers is the general one behind it: **can the AI author a modal at
all, for any content, without a module being written for that specific flow?**

Today it cannot, and the substrate says so out loud.
`modules/account-chrome/styles.css` ships:

```css
.account-chrome[data-account-chrome-enhanced] .account-chrome__dialog {
  position: fixed; inset: 0; z-index: 2147483000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}
```

with the comment *"Covering the page and centring on it is behavioural — a modal
that did not would not be one — and no L1 axis can express `position: fixed`."*

[[DOC-25]] §10.2 says a conforming behaviour ships **zero CSS beyond §10.3
invariants**. A 50%-black scrim no site can vary is not an obligation-pinned
invariant, it is taste that had nowhere else to live. That block is an honest
admission of a **substrate gap**, not a principled carve-out.

## 2. The line this is decided on

[[DOC-25]] §10.3 states the rule: *L1 owns everything the reference can
legitimately vary; the module owns what an obligation pins.* Decomposing a modal
against it:

| part | before | belongs to |
|---|---|---|
| panel look (fill, radius, padding, width, type) | L1 already | L1 — nothing needed |
| overlay presentation (cover, centre, scrim, layer) | module CSS, unvariable | **L1 — the gap** |
| what opens it, what closes it | module `client.js` + `data-*` | **L1 says which; the renderer owns how** |
| dialog obligations (role, focus, Escape, scroll lock) | largely absent | **the renderer** |
| step transitions ("swap for the message") | module, per flow | module — it is a server round-trip |

The last row stays a module deliberately. `account-chrome`'s "one message
whatever the server answers" is [[REQ-134]] policy — it exists so a known and an
unknown address are indistinguishable — and no L1 axis can or should express it.
**This ticket adds no L1 state machine and no multi-step vocabulary.**

## 3. Why this is a node ROLE and not a module

The precedent is [[REQ-100]]'s scroll reveal, whose own note argues the case:
motion became an L1 *adjective* rather than a module partly because *"putting it
in a module would make animated content unfoldable by construction — `fold` maps
captured node axes onto L1 node axes and never authors a module."*

A captured reference site with a modal has exactly that problem. If modal-ness
exists only inside a module, reproduction can never fold one.

The precedent for L1 carrying an **obligation** is [[REQ-106]]'s link:
`l1LinkSchema` pins `rel="noopener noreferrer"` whenever `newTab` is set — *"there
is deliberately no way to ask for `_blank` without its `rel`"* — and `href` clears
`isSafeUrl`. `l1FocusRingSchema` exists because [[DOC-24]] holds focus above
taste. The renderer being the sole sink is already how L1 carries what is not
negotiable. A dialog's obligations ride in on the same rail.

## 4. What is added

### 4.1 `dialog` — the overlay role

A node-level field on `box` and `container` — the two kinds that hold children,
because a modal panel always frames content. Not a seventh node kind, for the
same reason `link` is not: a modal is a role a subtree takes, not a species of
thing.

It carries only what a reference can legitimately vary:

- `backdrop` — the scrim painted over the page behind the panel, as a colour and
  an opacity. Absent means no scrim.
- `placement` — where the panel sits in the covered viewport: `center`, `top` or
  `bottom`.
- `dismissOnEscape` — whether Escape closes it. Defaults to true.
- `dismissOnBackdrop` — whether a click on the scrim closes it. Defaults to true.
- `ariaLabel` — the panel's accessible name, for when its visible content is not
  a sufficient one.

Everything else about how the panel looks is the node's ordinary surface, sizing,
padding and paint axes. The dialog role adds no way to paint.

**A node carrying `dialog` must declare an `id`.** The id is what an action
names, and a dialog nothing can open is a dialog nobody sees.

### 4.2 `action` — the disclosure verb

A node-level field on `box`, `container` and `text` — the kinds a reader
activates. A **closed** set of two verbs, not an event system:

- `opens` — the id of a node carrying `dialog`.
- `closes` — the id of a node carrying `dialog`.

**Exactly one of the two.** A node that both opens and closes the same panel is
a toggle nobody asked for and a contradiction the shape should refuse.

`action` and `link` are **mutually exclusive** on one node. A node either
navigates somewhere or acts on this page; both at once is a control whose
behaviour depends on which handler wins.

`image` deliberately cannot carry it. A void element cannot be a button, and
wrapping one would move focus to an outer element and cost the node its
[[REQ-99]] focus ring — the same reasoning that makes `link` retag every other
kind and wrap only this one. A close affordance built from a picture is authored
as a `box` around the `image`.

`control` deliberately cannot carry it either, for the reason it cannot carry
`link`: the module owns that element's semantics.

### 4.3 Validation

Three structural rules, checked over the whole document:

- a node carrying `dialog` must declare an `id`;
- an `action` must name exactly one verb;
- the id an `action` names must exist **and must carry `dialog`**. Opening
  something that is not a dialog is a no-op the author would never see.

`action` alongside `link` is refused by the node shape itself, because every node
object is `.strict()` and the two fields cannot both be present — the same
enforcement-by-construction `control`'s exclusion from `link` already relies on.

## 5. How it renders

### 5.1 The action node retags to a button

The renderer **retags** the node's own element as `<button type="button">` rather
than wrapping it, so the class, every paint axis and the focus ring stay on the
element the author styled. This is [[REQ-106]]'s discipline, verbatim.

An **opening** action carries `aria-haspopup="dialog"`, `aria-controls` naming
the panel, and `aria-expanded`. A **closing** action carries neither
`aria-haspopup` nor `aria-expanded`: a Close is not the thing that reveals the
panel, and a control claiming a disclosure state it does not own is worse than
one claiming nothing.

### 5.2 The dialog element, inside a covering shell

`role="dialog"` and `aria-modal="true"`, plus `aria-label` when the role named
one. The panel is focusable as a fallback target (`tabindex="-1"`) so focus has
somewhere to land in a panel holding nothing focusable.

Here — and only here — the renderer **wraps** rather than retags. Covering the
page and dimming it is a statement about the page *around* the panel, which the
panel's own element cannot make; and unlike a link, the wrap costs nothing,
because focus goes to the panel and every axis the author wrote stays on it. The
`id` stays on the panel, so `aria-controls` points at the region rather than at
the scrim.

The shell contributes **no box** until the script marks the document, so an
unenhanced page lays the panel out exactly where it would have been unwrapped.

Two things about the covered viewport are the renderer's rather than the
author's, because an obligation pins them: the shell scrolls when a panel is
taller than the screen, and the panel does not shrink to fit it. A modal whose
foot cannot be reached is broken, and no axis an author writes could rescue it.

Several panels may be open at once, and each opens and closes on its own. The
scroll lock lifts only when the last of them closes.

### 5.3 The no-JS baseline: script only ever subtracts

The server renders the dialog **in flow and open**, exactly as `account-chrome`
does and for the same reason: a visitor with no script meets real content they
can actually use, and every failure of the script — a blocked bundle, a throw,
an ancient browser — leaves a working page rather than a blank one.

So an opener's `aria-expanded` starts `true`, and the script folds the panel away
before wiring anything. The overlay presentation itself is gated on a marker only
the script sets, so with no script the panel lays out as an ordinary part of the
page rather than a fixed sheet over content nothing can dismiss.

### 5.4 One renderer-owned script, carrying no instance data

Like [[REQ-100]]'s observer and [[REQ-108]]'s pointer listener, the dialog
behaviour is a single vetted script, identical for every site, emitted **only
when a document actually carries a dialog**. It owns everything an obligation
pins:

- closing every dialog on start-up, and marking the document so the overlay CSS
  applies;
- opening on an `opens` activation and closing on a `closes` activation, keeping
  each opener's `aria-expanded` honest;
- moving focus into the panel on open, and **returning it to the opener** on
  close;
- **trapping Tab** inside the open panel;
- **Escape** closes, unless the role turned that off;
- a click on the **scrim** closes, unless the role turned that off — a click
  inside the panel never does;
- **locking page scroll** while a panel is open.

No document can name a selector, a key, or a script. Every number and colour the
author wrote is compiled into the stylesheet by the renderer; the script reads
only its own markers — so it is byte-identical for every site, which is what
makes it vettable once. The script and the invariant stylesheet are exported by
name, so a CSP-bound consumer can hash them rather than hunt for them in markup.

### 5.5 A panel's scroll entrance is not emitted

A panel starts closed, so it never scrolls into view; a `reveal` on it could
therefore never fire, and REQ-100's pre-state rule would leave it at `opacity: 0`
forever — visible only as a modal that opens onto nothing. The two axes do not
compose, so the emitter declines the one that cannot work rather than shipping
the trap. A reveal on the panel's *contents* is unaffected.

### 5.6 A document that declares no modal is unchanged

No shell, no stylesheet, no script, and every other role — a link above all —
renders byte-for-byte as it did before.

### 5.7 The edit render

The edit channel emits **no dialog script**, and an action node keeps its
`<button>` element while losing the target attribute that would act — precisely
as a link keeps its `<a>` and loses its `href`. The edit render therefore differs
from the draft render by the missing behaviour and nothing else: same tag, same
class, same declarations, same box. The panel renders in flow, settled, editable.

## 6. What is deliberately NOT in this ticket

- **No multi-step vocabulary.** See §2.
- **No general event system.** Two verbs, closed set.
- **`account-chrome` is not migrated.** Its stylesheet keeps the block quoted in
  §1 for now; moving its dialog slot onto the L1 role is a follow-up, and doing
  it here would put a live authentication surface inside a substrate change.
- **No `<dialog>` element.** The platform element cannot be reached without
  `showModal()`, which would make every modal script-only and break §5.3's
  baseline outright.

## 7. Documentation

The system knowledge base gains this vocabulary:

- `REF-l1` is projected from the schemas, so the new role, the new verb and their
  shapes appear there from the declaration itself — including the three new
  structural rules, whose prose is their doc comment.
- The judgement a field list cannot carry — **when a modal is the right answer
  and when it is not** — goes to the two authored documents that already own
  those questions rather than to a new one: [[DOC-48]] gains a section on the
  craft (the three cases it genuinely fits, the many it does not, and the rule
  that decides between them), and [[DOC-47]] records that a modal is now
  something the assistant can build, and that it is ordinary layout rather than a
  new component.

## 8. Acceptance

1. A `box` or `container` may carry `dialog`; a `text`, `image`, `control` or
   `slot` may not.
2. A `box`, `container` or `text` may carry `action`; an `image`, `control` or
   `slot` may not.
3. A node carrying `dialog` without an `id` is refused.
4. An `action` naming neither verb, or both, is refused.
5. An `action` naming an id that does not exist, or that exists but carries no
   `dialog`, is refused.
6. A node carrying both `action` and `link` is refused.
7. An action node renders as `<button type="button">` keeping its own class; an
   opening one carries `aria-haspopup="dialog"`, `aria-controls` and
   `aria-expanded="true"`, and a closing one carries neither `aria-haspopup` nor
   `aria-expanded`.
8. A dialog node renders with `role="dialog"`, `aria-modal="true"`, `tabindex="-1"`
   and its `aria-label` when one was given, inside a shell that contributes no box
   until the script marks the document.
9. The scrim colour and opacity, the placement, and the panel's own paint all
   come from the document; none of them appear in any module's stylesheet.
10. A document carrying a dialog emits the dialog script exactly once; a document
    carrying none emits no dialog script at all.
11. The script contains no value taken from the document.
12. The edit render emits no dialog script, and an action node keeps its
    `<button>` while losing the attribute that would act.
13. The overlay presentation is gated on a marker only the script sets, so the
    unenhanced page lays the panel out in flow.
14. A `reveal` on a panel is not emitted, and a document declaring no modal
    renders byte-for-byte as it did before.
15. The reader can open a panel, close it, dismiss it with Escape and with a
    click on the scrim but never with a click inside it, and can turn either
    dismissal off; focus moves in on open and returns to whatever opened it on
    close; Tab cannot leave an open panel; the page behind does not scroll, and
    stops being locked only when the last panel closes.
16. `REF-l1` renders the new role, the new verb, their shapes and the four new
    structural rules, with no vocabulary gap reported.


---

## REQ-213: Library: the client can correct what a material is for

## What the client asked for

> "I'd like to be able to Edit the *What it's for* label on a piece of content
> to change from Background to Asset."

In the Library's detail pane the rights block shows **What it is for** — `Site
asset` or `Background information`, the two areas the upload overlay drops into
(REQ-161). It is read-only. A client who dropped a photograph on *"just for you
to read"* by mistake has no way to say so, and the file can never reach their
site: `classify` writes `republishable: role !== 'reference'`, and
`promoteToSiteAsset` refuses anything not republishable.

## What changes

**The field becomes an editable select**, offering the same two labels the
overlay uses. `mountFields` already supports a per-field whitelist
(`editable: ['role']`) and a `type: 'enum'` select, so this is configuration of
the existing rights block, not a second editing vocabulary — the same argument
the description field already rests on.

**The select offers the words the pane already displays.** The block has always
rendered a role as its label, so the options are those labels and the wire value
is mapped back from one. A field that reads one way and edits another teaches
the client the wrong vocabulary for their own data. Both directions derive from
the upload overlay's own area list, so the drop areas stay the single place the
two roles are named.

**Only for material the client uploaded.** The gate is `origin`, and it is
`uploaded` and nothing else. The other two origins each fail it for their own
reason:

- *fetched* — nobody was asked. `classify` writes the role from provenance
  alone, because something we pulled on the client's behalf is by construction
  background to read rather than something they handed us to publish. Editing it
  would not be a correction; it would be DOC-38 §5's gate opening from outside.
- *captured* — the role came from the captured **host**, and a capture of the
  client's own old site is even `owned` and republishable. It still fails, for a
  structural reason as well as a rights one: a capture is 11–99 attachment
  records under one ticket and `promoteToSiteAsset` takes the first, so "put it
  on the site" has no single file to mean — and a capture carries no `filename`
  at all, which is why the pane already drops that row.

This is what keeps DOC-38 §10.1 intact: an upload's role *was* asserted by the
client, so correcting a mis-drop asserts nothing new; a fetched or captured
role is inferred and stays inferred. **A field the origin will refuse is not
offered as editable** — a control that always fails is worse than no control —
so the surface holds the same rule as the gate.

**`republishable` is recomputed from the role, server-side, never accepted from
the client.** `promoteToSiteAsset` reads that bit off the ticket, so a
client-supplied value would be the gate handing over its own key. The derivation
is `classify`'s verbatim, so the two cannot drift about what a role means.

**Changing to `Site asset` puts the bytes on the site**, by the same
`promoteToSiteAsset` path the upload takes, recording `placed_on`. Without it
the row would flip straight to REQ-181's *"Not on the site"* warning — which
would be true and useless. It fails soft exactly as the upload's `placeOnSite`
does: the role change stands and the placement failure is reported, because a
site store that refuses the write must not read as *the correction did not
happen*. **The upload's own behaviour is unchanged by the sharing** — the two
callers converge on one gate, one soft failure and one scrub rather than the
second growing a copy.

**Changing to `Background information` sets `republishable: false`**, and is
refused when the bytes are already on a site. `placed_on` records where bytes
went (BUG-47) and there is no removal path; allowing the narrowing would leave a
row saying *"just for you to read"* while the file is live on the client's own
site. The refusal names the reason and says what to do.

**The whole rights block repaints after a change, not just the row that was
picked.** A role change is not confined to its own field — the origin derives
`republishable` from it, and widening places the bytes and writes `placed_on`.
Both sit two rows below on the same block, and leaving them showing the old
answer would make the record contradict itself on screen. The list redraws too,
because the row's role badge and REQ-181's warning are read off exactly what
changed.

## Surface

`POST /api/material/role` — `{uid, role}`, role validated against
`'site' | 'reference'` and refused rather than coerced, matching the upload
route's own handling of the same value. Unlike the upload, **absent is not
allowed**: there is no pipeline entry point here that could predate the
question, only a person who picked one of two options.

The two refusals carry the status that says whose problem it is, the way the
existing material refusals do:

- **403** for material whose role was never chosen. The request is well formed
  and forbidden — the same §5 gate as `NotRepublishableError`, one step earlier.
- **409** for a file already on the site. The difference from 403 is whether it
  could ever succeed: this is a conflict with the material's *current state*, and
  the same client may make the same change once the file is off their site.
  Answering it as a permission would tell them to stop trying.

The Library sends the change and splices the returned row back into the list,
the way the description save already does.

## The site slug

The Library is business-scoped and deliberately does not know which site is open
(REQ-181) — threading a slug back through the panel would restore the dimension
that ticket deleted, in the one module whose suite asserts it cannot ask. So the
route resolves it from the tenant store, which is already scoped to this
business: a business holds one site in v1, and `slugs()` answers which.

**Zero sites or several means "do not place", not "fail".** A business with no
site has nowhere to put a picture and has done nothing wrong; a business with
several has a question nobody asked it, and guessing would put a logo on a site
they were not looking at. Both land on the existing soft path, so the correction
stands and the row honestly reports that the bytes are not on a site — which is
what REQ-181's warning badge is for. A store that will not open is the same
answer, for the same reason.

## Test plan

UATs named `test_UAT_FC_REQ-213_*`, driven through the real route and the real
panel:

- Background → Asset on an upload: role and `republishable` change, and the
  bytes land in the site's asset store with `placed_on` recorded.
- Asset → Background on an unplaced upload: role and `republishable` change.
- Asset → Background on a placed upload: refused 409, with the reason.
- Fetched and captured material: the field is not editable, and the route
  refuses with 403 even when called directly.
- `republishable` sent by the client is ignored; the value is derived.
- An absent or misspelled role is a 400, never coerced.
- A business with no site: the role change lands and nothing is placed.
- A placement failure leaves the role changed and reports the failure.
- The select offers the labels the block displays, and picking one repaints
  `republishable` and `placed_on` alongside it.
- The upload path still places, and still refuses a reference-role upload.


---

## REQ-211: Text can vary within a run: multi-variate L1 text

## What changes

**One string of page text can vary within itself** — a coloured word in a headline, an
ordinal set as a superscript, an emphasised phrase in a paragraph.

Today it cannot. `l1TextSchema` is one flat string with one set of axes:

```ts
export const l1TextSchema = z.object({
  kind: z.literal('text'),
  text: z.string(),                     // ← flat string
  axes: l1TextAxesSchema.optional(),    // ← applies to the whole run
  …
}).strict()
```

Specified in [[DOC-52]] §3.7.

## This is a latent hazard, not a missing nicety

The only way to get one coloured word in a headline today is **three text nodes
positioned absolutely** — which is exactly the trap that produced [[DOC-52]] §2, except
worse on the page than in a drawing: absolutely-positioned text fragments are fragile
at every breakpoint and break the moment copy reflows.

**The schema actively pushes the AI toward brittle geometry for ordinary typography.**
An ordinal, a trademark, an emphasised phrase — each currently costs a hand-positioned
fragment whose coordinates are a guess and whose responsive behaviour is wrong. The
session in [[DOC-52]] §2 reached for exactly this construction, believed inline
formatting was impossible, and was correct about L1 while being wrong about SVG.

## The shape

`text` accepts **either** a string — unchanged, so every existing document stays
valid — **or** a one-level array of `{ text, axes? }` runs.

- **Run axes are a narrow subset**: fill / palette ref, size scale, weight, baseline
  shift. Not the full text axis set.
- **One level only.** No nesting, no links inside runs. The schema stays closed.
- **The string form remains canonical for single-run text.** A one-element array is
  not the preferred spelling of a plain string; the fold and the renderer should not
  produce one.

## The blast radius is the real cost

The schema change is small. What it touches is not:

- **The renderer** emits a span per run, carrying the run's axes.
- **The fold** must *recover* runs from captured HTML — a capture of a real site with
  an emphasised word currently flattens it, and after this it should not.
- **`probes.ts` text estimation** measures a run's natural height; a multi-run text
  node changes what it is estimating.
- **The editor's exposure rule.** [[DOC-28]] §3 promises the user *"a plain string or
  a pick from a closed list"*. Multi-run copy has to be exposed without breaking that.
  **One field per run** is the proposed answer — simple, honest, and it keeps every
  control a plain string. Whether it survives contact with a real example is the open
  question ([[DOC-52]] §7 Q3).

## What this does not do

- **It does not add inline links.** A link inside a run is a second addressing
  problem; the renderer remains the sole `<a>` sink.
- **It does not add nesting.** One level is deliberate. Arbitrary nesting is rich text,
  and rich text is a different product decision.
- **It does not replace outlines for logos.** For a *mark* the right answer is
  `outline_text` ([[DOC-52]] §3.5), because a logo needs to be identical everywhere.
  Runs are for *page copy*. Different surfaces, different answers — these do not
  compete.
- **It does not change how the AI draws.** Inline formatting inside an SVG already
  works via `<tspan>`; that is [[REQ-209]].

## Decisions taken while implementing

Each of these is a consequence of the shape above rather than a separate intent, and
each is recorded because it is a claim the tests make.

### The run-axis subset, exactly

`color`, `sizeScale`, `fontWeight`, `fontStyle`, `baselineShiftEm` — and nothing else.

- **`fontStyle` is in the subset**, though [[DOC-52]] §3.7's list omitted it. An
  emphasised phrase is the ticket's own motivating example, and in prose emphasis is
  italic at least as often as it is bold; a subset that could not express it would not
  cover the case it was written for.
- **Both sizes are relative** — `sizeScale` is a multiplier emitted as `em`,
  `baselineShiftEm` is `em` of the run's own size. This is not shorthand. A node
  routinely carries a per-width `responsive.fontSizePx` track (BUG-18), and a run
  declaring absolute pixels would win at every width that track covers — pinning the
  ordinal at its desktop size on a phone, which is the responsive failure this whole
  capability exists to avoid.
- **Everything else stays a node axis.** Alignment, measure, family, tracking,
  line-height, the painted surface, the wrap threshold: each either describes the
  block (meaningless on a fragment of a line) or describes the face (what makes a
  paragraph read as one paragraph).
- **`baselineShiftEm` renders as `vertical-align`**, not a transform, so the line box
  still accounts for the lifted run and neighbouring lines do not collide with it.

### The canonical form is structural

A one-element run array is **refused by the schema**, not merely discouraged. Two
spellings of the same thing is the drift this codebase refuses everywhere else: the
fold, the renderer and the editor would each need a rule about which one they emit,
and the first one to disagree makes a document that reads differently depending on
who wrote it.

The renderer follows the same rule in its output: **a run with no axes emits no
span**, so the markup a multi-run node produces is the markup the same copy would
have produced as a plain string, plus exactly the spans that carry a difference.

### Run axes are inside the envelope

A run is a piece of the same paragraph, so the L1 envelope reaches into it: weight
takes the existing `fontWeight` bounds, and two new bounds are added —
`runSizeScale` (a scale so small the reader cannot see it still reserves a line box;
a scale so large is a display heading smuggled into a paragraph) and
`runBaselineShiftEm` (a lift large enough to fling a run clear of its own line box,
overlapping whatever is above it, with nothing in flow to say so). An envelope that
stopped at the node would leave the one place inline variation can be authored as the
one place it is unbounded.

### The fold rejoins only flows that *vary*

The capture already walks text nodes, so a sentence with an emphasised word has always
arrived as several runs. What it did not record is **which runs are pieces of one
inline flow**, so five new capture fields say so: the flow's id, the run's position in
it, the flow root's rect, the run's text with its own separating spaces kept, and the
run's `vertical-align`. A `<br>` ends a flow, and so does any element the browser
blockifies — which is what keeps a flex row of links from silently becoming one
sentence.

The fold then rejoins **only the flows whose runs actually differ** in fill, size,
weight or slope. A flow that varies in nothing has no inline variation to express, and
rejoining it would trade a set of exactly-transcribed boxes for one flowed box on
nothing but a hope that the browser re-wraps them identically. This also means a
rejoined node always carries at least one run with axes, so the canonical-form rule
above is satisfied by construction.

The node's own axes — its family, its measure, its alignment, its per-width size track —
come from the flow's **longest** run, not its first. Those axes belong to whichever run is
the paragraph rather than the ornament, and length is what tells them apart: an ordinal is
two characters and a headline is forty. Taking the first would hand a sentence that opens
with an emphasised word its emphasis's type as the paragraph's own. Ties go to the earlier
run, so the choice is stable across widths.

A rejoined node lays out in the **flow root's** rect, not in the tight box of whichever
fragment carries it, and it does **not** take a `nowrapFromPx` pin: that threshold
states a fact about one fragment's glyph extent inside a box the fold pinned to it, and
a rejoined node's box is one the reference already sized to hold the whole sentence.

### The fidelity oracle rejoins the same flows

**This is the property that keeps the change from breaking the gate.** The oracle is
the reference side of the fidelity measure; if the fold rejoins a flow the oracle still
counts as three elements, every page that emphasises a word reports two phantom
`unmatched` runs — the measure manufacturing the defects it exists to find. So the
decision is stated once, in one module, and both sides ask it.

For the same reason the **round-trip expected manifest projects one element per run**,
not per node: the browser gives a run its own text node the moment the run paints
anything, so a projection that expected one element for a three-run heading would
report the two it never claimed as unmatched while saying nothing about whether the
coloured word was actually coloured.

### The editor's fields

A plain-string node keeps the field name `text` it has always had. A multi-run node
exposes `text1 … textN`, labelled `Text 1 … Text N`, each a plain string and each
first in the schema so the modal still puts the cursor in the words. Editing one run
writes only that run's words and leaves its axes — and every other run — untouched.

Per-run *axes* are deliberately not exposed. The words are content; the axes are the
AI's, like every other axis on the node.

A name that addresses no run — `text9` on a three-run node, or `text` on a multi-run one —
is refused naming the field, not guessed at. That is the rule the modal's write path
already applies to every field it did not derive, and a run field is not an exception to
it: a name outside the derivation means the client resolved against a different node than
the one it is writing to, and writing part of that map would land a partial edit.

## Behaviour to verify

- An L1 document whose text node is a plain string validates and renders exactly as
  before.
- An L1 document whose text node is a run array validates, and each run renders
  carrying its own fill and weight.
- A run array rejects nesting, and rejects an axis outside the permitted subset.
- A one-element run array is refused: the string is the only spelling of single-run
  copy.
- A run with no axes of its own renders as bare text, with no span.
- Run axes are bounded by the L1 envelope — an out-of-range scale, lift or weight is
  refused, and the ordinary values a superscript uses are admitted.
- A captured page containing an emphasised word folds to a multi-run text node rather
  than a flattened string, and that node lays out in its flow root's box.
- A captured flow whose runs vary in nothing is left as separate nodes.
- The capture records which runs share an inline flow; a `<br>` and a blockified child
  end one.
- The fidelity oracle counts a rejoined flow exactly once, and counts a flow the fold
  declined to rejoin exactly as many times as the fold emits nodes for it.
- The editor opens a multi-run text node as one field per run, each a plain string;
  editing one run leaves the other runs and every run's axes untouched.
- A copy field naming no run is refused, naming the field.
- A rejoined node takes its own axes from the flow's longest run.
- Text-height estimation over a multi-run node produces a height consistent with the
  same copy as a single run, and a run set at a smaller scale consumes less of the
  line.


---

## BUG-69: Builder chat: pane keeps the previous business's conversation when both sites share a slug

## Symptom

Switching business with the shell's business switcher updates the site pane
correctly, but the chat pane sometimes keeps the conversation from the business
being left behind. Observed switching **Lagrange Foundry → XGD**: the XGD site
rendered on the left, the Lagrange Foundry transcript stayed on the right.

It does not happen on every switch, which is the tell.

## Root cause

A session id is derived from the slug alone — `sessionIdFor(slug)` in
`host-core.ts` returns `site-<slug>`. That is unique *within* a business,
because every request is business-scoped by the `/b/<id>` prefix and the host
resolves it against that tenant's own store. It is **not** unique across
businesses, and slugs are deliberately per-business rather than global.

The chat pane treats the id as globally unique:

    // chat.js, setSession
    const next = session?.sessionId ?? null
    if (next === sessionId) return          // ← no-op

So on a switch between two businesses whose sites share a slug, the origin is
asked for the new session (correctly, under the new prefix), answers with the
right transcript — and the pane discards it, because the id string is the one
it is already showing.

The two businesses in the report both have a site slugged `unnamed`, which is
why this switch reproduced it and others did not.

The same collision affects the composer's draft persistence: `mountChat` is
keyed `builder-chat:<sessionId>`, so a half-typed message under one business's
`unnamed` would surface under another business's `unnamed`.

`REQ-179` already has a case for the shared-slug switch
(`test_UAT_FC_REQ-179_the_frame_reloads_when_only_the_business_changed`) but it
asserts only that the transport was *asked* — its fixture returns an empty
transcript both times, so the pane's refusal to swap was invisible.

## Fix

The conversation's identity, **as the client holds it**, is the pair
`(business, sessionId)` — not the id alone. The origin's id shape is left
untouched; it is correct in the address space it lives in.

- `chat.js` — `setSession(session, key)` takes an identity key alongside the
  session. The pane dedupes on the key and mounts `mountChat` under it, so a
  changed business remounts the pane and gives each business its own composer
  draft. The wire `sessionId` is unchanged and is still what turns are addressed
  to; `getSessionId()` keeps returning it.
- `app.js` — `showSite` derives the key from the business the read was made
  under, scoped exactly the way `api.js` scopes a URL: prefixed when a business
  is selected, bare when there is none. All four `setSession` call sites (the
  open, the unconfigured deployment, the failed open, and the empty pane) use
  the same derivation.

## Test plan

`tests/test_UAT_FC_BUG-69_chat_follows_the_business.test.ts` — the real builder
over the installed webui components, two businesses whose sites share a slug,
driven through `app.scope.setBusiness` the way the switcher drives it:

1. The pane shows the **new** business's transcript after a switch on a shared
   slug — the case that regressed.
2. The pane is remounted under a business-distinct chat id, so a composer draft
   does not travel between businesses.
3. A plain site change within one business still swaps (no regression).

Regression scope: the builder pane suites — REQ-122, REQ-179, BUG-42, BUG-43,
BUG-46, BUG-64, and the assistant-pane reconciliation suite.


---

## BUG-70: Builder chrome: unstyled text across the business selector, the Library filters, and the blank pane

## Symptom

Text on several builder surfaces is unstyled — it does not take the app's
typeface, its size, or both. Three were reported from the screen:

1. **The business selector** in the top bar.
2. **The filter row** at the top of the Library's item list.
3. **The blank pane's** "Pick something on the left, or drop a file here to add one."

An audit of every text-bearing surface the builder renders found the same three
defects in eleven more places. This ticket is the audit and the repair.

## Root cause

Three distinct causes, all of them the same underlying fact: **`.shell` declares
a font FAMILY and no SIZE**, and form controls do not inherit either by default.

### 1. `font: inherit` with nothing to inherit — resolves to 16px

The `font` shorthand resets `font-size` along with everything else. A control
that says `font: inherit` and no more inherits the family from `.shell` and then
walks up looking for a size, finds none declared anywhere, and lands on the
document default of 16px — three points above the 13px the chrome around it
runs at. This is exactly [[BUG-53]], whose fix named six controls; these were
missed by that pass and are the same defect:

| selector | surface |
|---|---|
| `.builder-business__select` | the business switcher — **reported (1)** |
| `.builder-library__search`, `.builder-library__role`, `.builder-library__kind` | the Library filter row — **reported (2)** |
| `.builder-palette__hex-text`, `.builder-palette__rename`, `.builder-palette__new-name` | the palette popup's text inputs |
| `.builder-people__invite-email`, `.builder-people__invite-name`, `.builder-people__add-email`, `.builder-people__add-name`, `.builder-people__fulfil-name` | the Contacts dialogs' inputs |
| `.builder-upload__area`, `.builder-upload__cancel` | the upload sheet's buttons |
| `.builder-signed-out-action` | the "Sign in again" button |

### 2. No font declaration at all — the wrong typeface, not just the wrong size

Worse than the above, because a control with no `font` rule takes the user
agent's own font: a system typeface at the UA's button size. It is not IBM Plex
at the wrong size, it is not IBM Plex at all. `builder.css` contains exactly one
`button` selector (`.shell-actions button`), so nothing reaches these:

- `.builder-toolbar__colors` ("Colors"), `.builder-toolbar__publish` ("Publish"),
  `.builder-toolbar__points` ("Mark Points")
- the mode-toggle buttons inside `.builder-toolbar__modes`, which carry no class
  of their own at all

The toolbar is where this reads worst, because its one non-button — the "Open in
new tab" link — is an `<a>`, which *does* inherit, so it renders at the document
default 16px directly beside system-font buttons at the UA's size. Three
typographies in one bar.

### 3. The blank pane's text is a bare text node

`mountListDetail`'s `emptyDetail` is documented as an `HTMLElement` and is handed
to `replaceChildren`. Both `library.js` and `people.js` pass a **string**, so what
lands in `.list-detail-detail-body` is a raw text node with no element around it:
no padding, no muted colour, no size, and not even the component's own
`.list-detail-empty` fallback, which the string displaces.

### Checked and deliberately not changed

- **Non-text controls** — the row checkbox (`.builder-people__check`), the image
  picker's radio (`.builder-modal__tile-input`), the palette's colour and range
  inputs (`.builder-palette__hex`, `__shade`, `__swatch-input`) and the upload
  file input (`.builder-upload__input`) also carry no font rule, but they render
  no text, so a font declaration on them is inert.
- **`.fc-point__btn`** and the rest of the Marked Points overlay live inside the
  preview iframe and are styled by that overlay's own sheet, deliberately with
  system fonts because the page's `@font-face` rules cannot reach into an
  isolated document.
- **`font: inherit` on container `<div>`s** (`.builder-banner`,
  `.builder-session-notice`, `.builder-signed-out`, `.builder-business`) is a
  no-op — a div inherits its font anyway — and those surfaces are prose, which
  the document default suits. Left alone.

## Fix

Follow the convention [[BUG-53]] established and this stylesheet documents at
length: **declare `font-size` immediately after the `font` shorthand that
clobbers it**, reading the one `--builder-control-font-size` token, so the
result is independent of source order and of any rule added later.

1. Add `font-size: var(--builder-control-font-size)` after the `font: inherit`
   in each of the fourteen rules in cause 1.
2. Give the toolbar a size, so its link takes the chrome's type rather than the
   document default, and give its buttons `font: inherit` plus the token, so
   they take IBM Plex at the chrome's size like every other control.
3. Wrap the empty-pane copy in an element with a class, in both `library.js` and
   `people.js`, and give that class a rule — centred, muted, padded, at the
   chrome's size — so the blank pane reads as a designed state rather than as
   text that fell out of a component.

## Test plan

`tests/test_UAT_FC_BUG-70_builder_text_is_styled.test.ts`, extending the
`winningFontDecl` resolution helper [[BUG-53]] introduced — the assertion is
which declaration WINS by source order, not that one exists, because a rule can
name a control and still lose to a later shorthand.

The audit is what is asserted, so the sweep is exhaustive rather than a named
list: every text-bearing control class the builder's modules actually create is
enumerated from source, and each must resolve to the control token. A control
added later with no size fails here rather than shipping.

- every control named in cause 1 resolves to `var(--builder-control-font-size)`
- the toolbar's buttons and its "Open in new tab" link are one size
- no text-bearing control the builder creates is left with no font declaration
- the Library and Contacts blank panes render an *element* carrying a class that
  the stylesheet has a rule for, not a bare text node


---

## BUG-67: Builder chat: 4096-token cap truncates large set_l1 writes silently; capture_site never retries the apex host

## Symptom

Session `chat-d73a11e1` ("Lagrange Foundry — initial website build", 2026-09-09
22:52–23:30). Two unrelated failures, both operator-visible.

**1. Reference capture "failed" on a site that was up.** The AI tried three
hostnames it had invented and reported all of them dead:

| Attempt | URL | Result |
|---|---|---|
| 23:01:20 | `https://www.gigabytealchemy.com` | `Navigation timeout of 30000 ms exceeded` (~90s: 3×30s) |
| 23:01:34 | `https://www.1stcontact.io` | `net::ERR_NAME_NOT_RESOLVED` |
| 23:18:47 | `https://www.gigabytealchemy.ai` | `net::ERR_NAME_NOT_RESOLVED` |
| 23:20:29 | `https://gigabytealchemy.ai/` | **succeeded** — 7 pages, 5 assets |

It told the operator *"Gigabyte Alchemy isn't reachable — the site may already be
down"* and *"Both reference sites are offline"*. Neither was true. It only tried
the bare apex after the operator pasted the exact URL and said *"are you sure you
can't reach it...if so that's a bug"*.

**2. Twelve consecutive silent failures writing the page.** From 23:21:55 to
23:30:11 the AI issued `set_l1` twelve times, ~45s apart. Every call reached the
tool executor with an empty input object and was refused identically:

```
Input:  {}
Result: Error: set_l1 requires parameter 'page' (A page's id — short, lowercase, …)
```

The turn ended on the 600s tool-loop timeout with the AI saying *"Apologies for
that — something went wrong on my end."* No page was ever built: ~9m42s of the
operator's time, zero output.

Preceding calls in the same turn (`set_page_style`, `update_page`,
`add_palette_color`, `get_l1`) all carried their arguments correctly. Only the
one large call lost them.

## Evidence, and what is *not* evidence

The input really was empty on arrival, on two independent readings:

- The tool transcript's `Input` block renders `meta.input` from the
  `tool_activity` event (`backends/api_tools.js:670–675` →
  `tool_transcript.js:222,283`) — the actual object handed to `ToolSet.run`, not
  a reconstruction. It also caps each side separately, so a large input would
  render truncated with a size marker rather than as `{}`.
- `toolHeading` (`tool_transcript.js:124–135`) appends the first string value in
  the input to the heading. All twelve headings are bare `## set_l1`, exactly
  like `## get_palette` and `## list_assets` (whose inputs are `{}`), and unlike
  `## get_l1 home` or `## set_page_style home`. Had `page` or `path` been
  present with any value, it would appear there.
- Consistent with the error text: `validateParams` rejects unknown keys
  *before* checking required ones (`toolbox/params.js:84–92` vs `:96–102`), so an
  input of `{raw:"<truncated json>"}` would have produced `set_l1 does not accept
  parameter(s) 'raw'`. Getting `requires parameter 'page'` means the input was a
  mapping carrying only declared keys — and the bare heading says it carried
  none.

Two things that look like evidence and are not:

- **`"params":{}` in the audit record is a hardcoded literal.**
  `toolbox/runtime.js:316–323` passes `{}` to `_record` on the schema-refusal
  path; the real `toolInput` is never recorded. Every
  `decision:"refuse", rule:"schema"` record looks like this whether the model
  sent nothing or 60KB. Same at `:312` for capability refusals.
- **`"durationMs":0` is uninformative.** `now()` is `performance.now()`
  (`runtime.js:408–410`), and in workerd the clock does not advance without I/O,
  so every synchronous refusal is exactly `0`.

## Root cause

### Defect A — a 4096-token output cap, and truncation is invisible

`lagrange-framework/components/ai/js/src/backends/claude_api.js:192` hardcodes
`max_tokens: 4096` on every request, with no option to override it. The model is
`claude-sonnet-4-6` (`claude_api.js:39`, never overridden — `host-core.ts:610–629`
passes no `model`), which supports far more output than that.

A whole-page L1 tree for a five-section site does not fit in 4096 tokens, and
~45s of wall time per attempt is about what emitting that many tokens costs.

**This is structural, not an edge case.** The documented path for building a page
is `describe_page → get_l1 → set_l1` (`l1-surface.json` sequences); `set_l1`
replaces a whole subtree and *"anything you leave out is gone"*; there is no
insert or append operation, and no documented size ceiling anywhere in the
surface. So the only documented way to build a page from scratch is a single call
whose argument is guaranteed to exceed 4096 tokens for anything non-trivial.
Every from-scratch build walks into this.

The reason it is not diagnosable, and why the model looped:

- **`stop_reason` is never read anywhere.** `grep -rn stop_reason
  components/ai/js/src` returns zero hits. The `message_delta` handler
  (`api_tools.js:723–726`) reads only `usage` and discards the frame's
  `stop_reason`, so `max_tokens` is indistinguishable from `end_turn` — and
  `runToolLoop` (`:604–698`) has no branch for it.
- **Per-turn usage is never persisted.** It is emitted on the terminal `done`
  event and held in memory (`backend.usage(ref)`); nothing writes it to D1 or R2.
  So `output_tokens === 4096` — the direct confirmation of truncation — cannot be
  checked after the fact. Nothing in the persisted record of this session can
  distinguish truncation from any other cause, which is itself the defect.
- **`AnthropicAccumulator` swallows the shortfall** (`api_tools.js:727–763`):
  `input` is initialised to `{}` at `content_block_start` and only replaced at
  `content_block_stop`, where a `JSON.parse` failure yields `{raw: partialJson}`.
  A `content_block_stop` never processed leaves the initial `{}`; an empty
  `partialJson` at stop also yields `{}`. Both are silent.
- **The refusal misdescribes the failure.** `toolbox/params.js:100` reports
  `requires parameter 'page'` — false about what happened, since the model
  believes it sent `page`. It gives the model nothing to act on, so it retries
  verbatim. `MAX_TOOL_ITERATIONS = 50` (`api_tools.js:35`), so nothing intervenes
  until the 600s turn timeout.

Contributing: `set_l1`'s `node` parameter is declared `object` with **no `keys`**
(`l1-surface.json:357–395`), so its wire `input_schema` is a bare
`{type:"object"}` — the model gets no shape guidance and no
`additionalProperties:false` on the single largest argument in the surface.

### Defect B — capture retries a deterministic DNS failure and never tries the apex

`tools/generate/src/cli/capture/pipeline.ts:237–250` retries `captureOnce`
unconditionally three times — no backoff, no error classification — and does no
hostname normalisation. Confirmed by grep across `capture/` and
`fidelity-core.ts`: no `www.` add/strip, no apex fallback, no candidate list.
`assertPublicUrl` (`egress-guard.ts:199–203`) only classifies and returns the URL
unchanged.

- `ERR_NAME_NOT_RESOLVED` cannot change between identical attempts — three tries
  is pure latency, and the wrong-TLD guess cost ~90s at 30s per navigation
  (`cf-driver.ts:189–191`).
- A guessed `www.` prefix that does not resolve is never retried against the
  apex, or vice versa — the single most common cause of a false "this site is
  down".
- The message passes the raw Chromium code through and offers no hint that the
  hostname, rather than the site, may be at fault. That is why the AI concluded
  the site was down and told the operator so.
- Related: one `capture_site` performs four separate navigation passes
  (`capture/capture.ts:79–139`) and only the first is inside the retry loop, so
  the retry budget does not protect the operation as a whole.

## Fix

**Defect A** — `lagrange-framework`, `components/ai/js/src`:

1. Raise `max_tokens` to match the model's real output ceiling, and make it a
   backend option rather than a literal.
2. Read `stop_reason`. When a turn stops at `max_tokens`, do not present the
   truncated tool call as a schema violation — fail it with an error naming what
   happened ("the arguments were cut off at the output limit; send a smaller
   subtree") so the model can adapt instead of repeating.
3. Treat a `tool_use` block whose accumulated JSON is absent or unparseable as a
   truncation rather than defaulting to `{}` / `{raw:…}`; both current fallbacks
   produce misleading downstream errors.
4. Record the real `toolInput` in the audit on the refusal paths
   (`runtime.js:312,316–323`), instead of a literal `{}`. Triage currently
   reaches for the one field that is always blank.
5. Persist per-turn usage, so an output-cap hit is recoverable after the fact.

**Defect B** — this repo, `tools/generate/src/cli/capture/pipeline.ts`:

6. Classify capture errors: retry transient failures (timeouts, resets), fail
   fast on deterministic ones (`ERR_NAME_NOT_RESOLVED`).
7. On a DNS failure, retry once against the alternate host form — strip a `www.`
   prefix, or add one if absent — and report which form succeeded.
8. Make the failure message say what a caller can do about it rather than
   passing the Chromium code through.

**Craft note (no code):** the AI reported a platform failure ("the site may
already be down") on the evidence of its own guessed hostname. DOC-48 §9 already
says a refusal is evidence about your syntax, not about the platform. This is the
second recorded instance of that failure mode (first: DOC-17 §G, reporting
shipped capabilities as missing) and belongs in the design-lessons log.

## Scope

Defect A is in the shared `@lagrangefoundry/ai` package, whose source lives in
the `lagrange-framework` repo — outside this repo's ticket store, so it needs a
ticket there. Defect B is local to this repo.

## Test plan

Once a fix is authorised:

- `test_UAT_FC_BUG-67_*` in this repo: capture pipeline given a driver that
  throws `ERR_NAME_NOT_RESOLVED` on `www.<host>` and succeeds on `<host>` —
  assert one navigation per host form (not three) and a successful capture;
  assert a transient timeout still retries.
- Framework-side UAT: an accumulator fed a stream that stops at `max_tokens`
  mid-`input_json_delta` must surface a truncation error naming the output limit,
  not an empty-input schema refusal; and a schema refusal must record the input
  the model actually sent.

## Follow-up: does L1 permit partial updates? (operator question, 2026-09-09)

**Yes for editing, no for growing — and that is what puts a floor under the
token cost.**

`set_l1` is bounded by address by design (`edit.ts:866–869`: *"A whole-document
write would be simpler and worse: it costs the caller the entire page on every
change"*). Rewriting one heading costs one heading. That part works.

But `set_l1` is the **only** element write on the surface — 32 operations, and
none of the others touch the element tree. And it cannot create: `editL1Set`
calls `replaceL1Node` and raises `NOT_FOUND` — *"Address '…' resolves to no node"*
(`edit.ts:919–926`) — when the address does not already exist. The surface says
so plainly: *"There is no separate way to insert or delete."*

So every addition is a full rewrite of the parent group, including all siblings
that are already there. Building an N-section page from an empty one costs
`1 + 2 + … + N` sections written — O(N²) in tokens — and, decisively, **the final
call contains the entire page no matter how the work is split**, because the last
section added rewrites root with all N children.

There is therefore no incremental path that stays under a small output cap. The
minimum possible single write for a finished five-section page *is* the whole
page. 4096 tokens is not merely tight; it is below the floor the surface's own
design imposes. Raising the cap buys headroom but does not remove the floor.

Options, in increasing order of scope:

- Raise `max_tokens` and report `stop_reason` (fix items 1–3 above). Small,
  unblocks the immediate failure, leaves the O(N²) growth cost in place.
- Add insert/remove operations to the L1 surface — write a child at a parent
  address and index, delete one — so growth is O(N) and each call is bounded by
  the size of the thing being added rather than the size of its parent. This is
  the structural fix, and it is a deliberate reversal of a documented design
  decision, so it is the operator's call rather than an implementation detail.

## Follow-up: which tool made the failed fetches? (operator question, 2026-09-09)

`capture_site` — ours, in this repo (`fidelity-core.ts:370–419` →
`capture/pipeline.ts`). Not a WebFetch: the fidelity surface has six operations
and `capture_site` is the only one that reaches the network, so there was no
alternative route the AI could have taken. Trying both `www.<host>` and the bare
apex is entirely within our control, and belongs in `fidelity-core.ts:370` where
a candidate list would go.

## Follow-up: what is `max_tokens` for, do we need one, what should it be? (operator question, 2026-09-09)

**Purpose.** `max_tokens` is a hard ceiling on a single response. It bounds
worst-case latency, worst-case spend per call, and runaway generation. The
decisive property for this bug: it is an *enforced* ceiling that **the model is
not aware of**. It does not make the model write something shorter — it cuts the
stream off wherever it happens to be. In prose that yields a truncated sentence;
in a tool call it yields a broken JSON argument, which is exactly what happened
here. It is a guillotine, not a budget.

**Do we need one.** Yes — `max_tokens` is a required parameter on the Messages
API; a request cannot omit it. So the question is only what value, not whether.

But 4096 is not earning its keep as a limit:

- *As a cost control it is the wrong instrument.* Billing is per output token
  actually generated, so a high cap costs nothing until it is used. The cap only
  bounds the worst case. Per-session spend is the right control, and the backend
  already computes it (`backend.usage(ref)`) — it simply never persists it (see
  fix item 5).
- *As a latency control it is crude*, and we already stream, so there is no HTTP
  timeout to protect against.
- *In a tool-calling loop it is actively harmful.* A cut-off tool call is not a
  smaller result, it is an invalid one — and with `stop_reason` unread it is an
  invalid one that reports itself as the model's own mistake.

**What it should be.** `64000`, as a constructor option rather than a literal.

- Anthropic's documented default for **streaming** requests is ~64000; the reason
  to go lower (~16000) is HTTP timeouts on non-streaming requests, and we already
  pass `stream: true` (`claude_api.js:196`), so that reason does not apply to us.
- `claude-sonnet-4-6` supports up to 128K output tokens and a 1M context window,
  so 64000 is well within the model's ceiling and is ~6% of the context window —
  it does not meaningfully compete with input for room.
- The documented reasons to deliberately go lower — classification, hard cost
  caps, intentionally short outputs — none apply to a surface whose smallest
  legitimate page write is the whole page.

**Not a defect, checked while here:** `claude-sonnet-4-6` is a current model, not
a deprecated one, so nothing forces a migration. Worth noting separately that
task budgets — an advisory token ceiling the model *can* see and pace itself
against, which is the thing that would actually make the builder finish
gracefully rather than be cut off — are not available on Sonnet 4.6; they need
Opus 5, Sonnet 5, Fable 5, or Opus 4.7/4.8. That is a model-choice conversation,
not part of this fix.

## Cross-repo status (2026-09-09, 17:26)

The framework half of Defect A split in two while this was being written.

**Already landed — `lagrange-framework` REQ-146**, "default the API backend to
claude-sonnet-5, and give max_tokens room for it", status `free_coded`, commit
`329d894771` on `xgd-working` (17:13 today). It moves `DEFAULT_MODEL` to
`claude-sonnet-5`, replaces the hardcoded `max_tokens: 4096` with a construction
option defaulting to `DEFAULT_MAX_TOKENS = 32000`, keeps the request streaming,
and asserts that no parameter Sonnet 5 rejects is sent. It cites this session's
finding directly. So fix items 1 and the model question above are done, and the
`claude-sonnet-4-6` reading in this ticket is now historical.

**Filed — `lagrange-framework` BUG-49**, "a reply truncated at the output ceiling
dispatches an unfinished tool call, and nothing reports it". REQ-146 deliberately
scoped this out — *"Raising the ceiling makes it rarer; it does not make it
safe"* — so it carries fix items 2, 3, 4 and 5 above: read `stop_reason`, refuse
a `tool_use` block that never received `content_block_stop` instead of
dispatching it, stop `AnthropicWire.parse` turning a non-object input into `{}`
by spreading it, record the real input on the audit refusal paths, and persist
per-turn usage.

**Not yet propagated.** The shared store this repo actually loads —
`/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/backends/claude_api.js`
— still reads `DEFAULT_MODEL = 'claude-sonnet-4-6'` and `max_tokens: 4096`. The
running builder is therefore unchanged, and a session started now would fail the
same way. Nothing in this repo can fix that; the framework change has to reach
the shared store before the operator sees any of it.

Defect B (the capture host-candidate work) remains the only part of this ticket
that is this repo's to code.

## Defect B — behaviour to implement

Written out so each acceptance criterion below names one thing the capture must
do. Everything here is in `tools/generate/src/cli/capture/`.

**B1 — a hostname failure is not a site failure, and is not retried.**
`net::ERR_NAME_NOT_RESOLVED` is deterministic: the same hostname asked again in
the same second gets the same answer. It must fail on the first attempt rather
than consuming the retry budget. Transient failures — navigation timeouts,
connection resets — keep retrying exactly as they do today; nothing about the
existing retry behaviour for a host that genuinely answers is changed.

**B2 — when a hostname does not resolve, try the other form of it.** A host that
starts with `www.` gets its apex tried; a host without it gets `www.` prefixed.
This is one alternate, tried once, and only after a DNS failure. A navigation
timeout does *not* trigger it: a host that timed out resolved, so something
answered and hung, and trying a different hostname is a guess rather than a
correction.

**B3 — no candidate is invented where the pair is meaningless.** An IP literal,
`localhost`, and any single-label host have no apex/`www` relationship, and a
host that is already being tried in both forms has no third. These produce no
alternate and fail as they do today.

**B4 — the alternate is subject to the same egress rules as the typed URL.** The
candidate is a URL this tool chose rather than one the caller typed, so it must
pass `classifyUrl` before it is fetched. The fallback must never become a route
to a host the guard would have refused.

**B5 — the form that worked is what the capture records, and what the rest of the
capture uses.** `capture_site` performs four navigation passes and only the first
runs inside the retry loop; if the resolved host does not carry to the other
three, the ladder, the screenshots and the hints all still navigate to the dead
name. The bundle name, the returned `url`, and every subsequent pass use the
candidate that succeeded.

**B6 — the failure says what a caller can do about it.** Passing
`net::ERR_NAME_NOT_RESOLVED` through is what led the assistant to tell the
operator their site was down. The message must name every form that was tried and
say that the hostname did not resolve — a fact about the address, not about the
site.

### Acceptance criteria

1. A driver that raises `ERR_NAME_NOT_RESOLVED` for `www.<host>` and succeeds for
   `<host>` yields a successful capture, and `www.<host>` is navigated exactly
   once — not three times.
2. The same, mirrored: a bare host that does not resolve reaches `www.<host>`.
3. A navigation timeout still retries the same host to the existing attempt
   budget, and no alternate host is tried.
4. A host with no meaningful alternate — an IP literal, `localhost`, a
   single-label name — is attempted once and produces no second hostname.
5. When every candidate fails to resolve, the error names each form tried and
   attributes the failure to the hostname rather than the site.
6. The successful candidate is what the capture records as its URL, and what the
   ladder, screenshot and hint passes navigate to.
7. An alternate that `classifyUrl` would refuse is not fetched.


## Follow-up 2026-09-10 — is model/ceiling configurable from 1c? Not yet.

Checked all three layers. The seam now exists upstream; 1c does not reach it, and
the installed store does not have it.

**1. lagrange-framework source — yes, and further than BUG-49 was filed for.**
`components/ai/js/src/backend_config.js` + `defaults/backends.json` ship model and
ceiling as *data*, not constants: `claude` = `{ model: "claude-sonnet-5",
max_tokens: 32000 }`. A consumer overrides per key via `configureBackends(mapping)`
(exported from the runtime-agnostic `/core` rung, so a Worker can configure from KV)
or `loadBackends(path)` (Node, `index.js`). Unknown backend or key is rejected at
load. `ClaudeAPIBackend` reads `model`/`maxTokens` from that configuration at
construction (`claude_api.js:165,167` → `:249,250`).

**2. The installed shared store — no.**
`/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/` still has
`DEFAULT_MODEL = 'claude-sonnet-4-6'` and a hardcoded `max_tokens: 4096`
(`backends/claude_api.js:39,192`). No `backend_config.js`; `src/defaults/` holds
only `product.json` and `prose.json`. A builder session started now still runs the
4096 ceiling — i.e. the twelve-`set_l1` failure above is still reproducible.

**3. 1stcontact — no, on both counts.**
`tools/generate/src/cli/ai/host-core.ts:614-623` constructs
`new lib.ClaudeAPIBackend({ client?, apiKey?, tools })` — neither `model` nor
`maxTokens` is passed. Repo-wide grep for `configureBackends`, `loadBackends`,
`backendSettings`, `backends.json`, `max_tokens`, `maxTokens`, `claude-sonnet`
outside `node_modules`/`dist`: zero hits. So even after the store is refreshed, 1c
takes the framework's opinion (sonnet-5 / 32000) rather than making its own choice.

**What would make it 1c's decision** (not done, not ticketed): call
`lib.configureBackends(...)` — or `lib.loadBackends(<path>)` on Node — at host
start-up in `host-core.ts`, sourced from a 1c-side config file or env, before the
first backend is constructed. Small; blocked on nothing except the store refresh
landing first, since the current store exports neither function.


## Scope addition 2026-09-10 — the model and the ceiling are 1c's decision, held in 1c

The follow-up above stopped at "the framework offers a seam; 1c does not reach
it". Reaching it is this ticket's work, because fix item 1 is only half done
while the value 1c actually sends is still the framework's opinion. The operator
asked for these to be **project configurable**, and inheriting a better default
is not the same thing as owning the choice.

**Defect A, this repo** (`tools/generate/src/cli/ai/`):

9. Hold the backend settings as project configuration — a `backends.json` that
   1stcontact owns, beside the `priming.json` REQ-182 already established as the
   shape for "this project's decision, as data". Changing the model or the
   ceiling must be an edit to that file and nothing else: no framework release,
   no TypeScript change, no fork.
10. Install it through the framework's own `configureBackends` during host
    build, BEFORE any backend is constructed, so the settings are in force for
    the first turn and a malformed document — an unknown backend, an unknown
    key, a non-integer ceiling — is a start-up failure naming the offending key
    rather than a 400 on the first request. Same argument the Toolbox
    construction already makes for configuration failures surfacing at build.
11. Import it statically, not through `node:fs`. Both hosts must read the same
    settings, and `host-core.ts` is the half workerd loads (REQ-146); a file
    read would put the Node host's answer out of the Worker's reach and split
    the decision in two.

**The values 1c chooses**, and why they are these:

- `max_tokens: 64000` — the figure this ticket's own sizing analysis reached
  above, re-checked 2026-09-10 against the current API reference: streaming
  requests default to ~64000, the reason to go lower (~16000) is HTTP timeouts
  on non-streaming requests, and `claude_api.js` passes `stream: true`. The
  framework's shipped 32000 is not wrong, it is just not the number this surface
  reasoned its way to — the smallest legitimate `set_l1` write is a whole page.
- `model: claude-sonnet-5` — 1M context, 128K max output, so 64000 is ~half the
  output ceiling and ~6% of the context window. It is also what the framework
  now ships, so this pins a value rather than diverging from one; the point of
  pinning it is that moving to Opus 5 is now a one-line edit in this repo.

**Deliberately not done:** an environment-variable override on top of the file.
It would be a second source of truth for the same setting and only the Node host
could read it, which is exactly the split item 11 exists to prevent. If an
operator needs to change the model without a commit, that is a separate ask.


## Decision 2026-09-10 — the model moves to Opus 5

Operator's call, taken immediately after the seam above landed, and the point of
having built it: this is one line of `backends.json` and nothing else.

**`model: claude-opus-5`**, replacing the `claude-sonnet-5` the previous section
chose. That section pinned Sonnet 5 as "what the framework now ships", which was
a reason to pin *a* value, never a reason to prefer that one.

**Checked before the change, because a model id is not a free swap.** Opus 5
rejects parameters Sonnet 5 tolerates — `budget_tokens`, `temperature`, `top_p`,
`top_k` are all removed on it, and an assistant prefill is a 400. The adapter's
request is `model`, `max_tokens`, `system`, `messages`, `tools`, `stream: true`
and nothing else (`claude_api.js:249-255`), so there is no parameter here for
Opus 5 to refuse. REQ-146 asserted that property for Sonnet 5; it holds for Opus
5 for the same reason.

**The ceiling stays 64000.** Opus 5 is 1M context and 128K max output, the same
envelope the sizing analysis above assumed, so the figure it reached does not
move. Worth recording that on Opus 5 thinking is ON by default — omitting
`thinking` runs adaptive — and `max_tokens` bounds thinking and response text
together, so 64000 is a shared budget rather than 64000 of reply. That is an
argument for the ceiling being roomy, which it is; it is not an argument to
raise it further.

**What it costs.** Opus 5 is $5/$25 per MTok against Sonnet 5's $3/$15, so
roughly 1.7× per token in both directions. The cap does not change that — billing
is per token actually generated, as this ticket already established — but the
per-turn bill goes up and that is the trade the operator is making knowingly.

**Newly available, not taken here.** Opus 5 supports task budgets — an advisory
ceiling the model *can* see and pace itself against, which the sizing analysis
above named as "the thing that would actually make the builder finish gracefully
rather than be cut off" and ruled out because Sonnet 4.6 lacked it. It is
reachable now. It is a separate piece of work, needs a beta flag, and this
ticket does not do it.


---

## BUG-71: 1c assets: framework bridges emit dangling sibling imports, so the builder never boots

## Symptom

`1c builder` starts, the chrome document arrives 200, `GET /api/sites` answers
200 — and the page stays blank until the boot guard writes *"The builder did not
start. What failed: could not load http://127.0.0.1:8788/builder/main.js"*.

Running `1c assets` does not fix it. Running it twice does not fix it. The
builder is unusable and the remediation the boot guard offers is the one thing
that cannot help.

## Root cause

`main.js` is fine. A module script's `error` event fires on the **top-level**
script element even when the failure is a nested import, so the guard names the
entry point rather than the file that 404ed. The file that actually 404s is
reached from it:

`dist-assets/framework/site-schema-edit.js` line 1 reads

    import { l1TextRuns } from './text';

which the browser resolves to `/framework/text`. Nothing is emitted at that
path — `dist-assets/framework/` holds exactly the six files
`FRAMEWORK_SOURCES` names — so the request 404s and the whole module graph
fails to load.

Two separate defects in `tools/generate/src/cli/assets.ts` produce that line:

1. **The framework emit does not follow imports.** `FRAMEWORK_SOURCES`
   (`assets.ts:68`) is a hand-maintained list of six entry points, and
   `transpileForBrowser` (`assets.ts:114`) type-strips one file at a time. A
   module a bridge imports is never emitted, and its specifier is never
   rewritten. The file header asserts this is safe — *"these files' only runtime
   import is each other"* — and that assertion is now false.
2. **A relative specifier is not a browser URL.** TypeScript writes `./text`;
   a browser needs `./text.js`. Even had `text.ts` been emitted, the import
   would still have 404ed.

Introduced by `df9862ce77` *"feat(l1): one string of page copy can vary within
itself"* (2026-09-10), which added `packages/site-schema/src/l1/text.ts` and
imported it from `l1/edit.ts`. It is the first **value** import between these
sources; every earlier sibling import is `import type`, which the transpiler
erases before it can become a fetch. The hole has always been there — nothing
had stepped in it.

The build reported success throughout, and the only place the defect was
visible was a blank page in a browser.

## Fix

**1. Emit the graph, not a list.** The six declared entries keep their stable
public URLs (`/framework/<name>.js`) — the builder imports those by name. From
each one, follow the relative imports that *survive transpilation*, resolve each
to its source file, emit it, and rewrite the specifier to the URL it was emitted
at. Recurse.

Following the **transpiled output** rather than the source is what keeps
type-only modules out of the browser: `transpileModule` erases `import type` and
elides any import whose bindings never reach the emitted JS, so what survives is
exactly what the browser will fetch. Reading the source instead would ship
`./palette` and `./types`, which exist only at compile time.

A dependency is emitted under its **repo-relative source path**, so two packages
that each hold a `text.ts` cannot collide, and the URL in a stack trace names
the file to open. An import that resolves to no file, or to a file outside the
repository, fails the build where it is found rather than being emitted as a
specifier nothing can serve.

**One URL per source file.** Resolution is keyed on the absolute source path and
seeded with the entries, so a module that is both an entry and someone's
dependency is emitted once and imported by its entry URL everywhere. Emitting it
twice would give the page two instances of one module — two copies of whatever
state it holds. The emitted tree is therefore *closed*: every `/framework/` URL
it imports is a file it contains, and no file is served under a second name.

**A comment that quotes an import is prose, not an edge.** Specifiers are found
with the compiler's own scanner rather than by pattern-matching text. This is not
a stylistic preference — a regex first version rewrote a doc comment that quoted
an import as an example, followed the specifier out of it, and emitted a module
nothing imports, which imported `zod`, which cannot be served, which failed the
build over a line of prose.

**2. Refuse to ship a tree that cannot load.** After the tree is assembled and
**before it is swapped into place**, walk the import graph from
`/builder/main.js` and resolve every static specifier — relative and absolute
against the emitted tree, bare against the import map — plus every stylesheet the
import map declares. If anything dangles, `1c assets` fails with an
`ENVIRONMENT` error that names **every** unresolved specifier, not just the
first, each with the file that imports it — the half the boot guard could not
give — and tells the operator their previous build is untouched.

Checking before the swap is what makes strictness safe: a refusal leaves the
previous working `dist-assets` exactly where it was, which is the property the
staging-directory design already exists to provide. Checking after would mean
every refusal also broke the thing it was protecting.

The check is anchored at `/builder/main.js` because that is what the page
actually loads; a file no entry reaches cannot produce this failure and is not
the build's business.

**3. Say so in the report.** `1c assets` prints the size of the graph it
verified — modules and stylesheets — so "the imports were checked" is something
the operator can see rather than something they have to trust.

Not fixed here, and deliberately: `1c builder` still does not build assets
before starting `wrangler dev`, and the CLI usage text still lists the `serve`
command REQ-177 deleted.

## Test plan

`tests/test_UAT_FC_BUG-71_framework_import_graph.test.ts`, driving `1c assets`
itself once and asserting against the tree it wrote — the bug was invisible to
every artifact short of the emitted bytes, so a test that asked the build what it
did rather than reading what it wrote would have passed throughout. The graph
walk in the test resolves specifiers independently of the one in the build, so
the evidence is about the tree rather than about the checker agreeing with
itself.

- the sibling module `l1/text.ts` is emitted, `site-schema-edit.js` imports it at
  that URL, and no emitted framework file still carries a relative or
  extensionless specifier;
- the builder's import graph resolves end to end from `/builder/main.js`, over a
  graph large enough to prove the walk did not stop at the entry — the regression
  this ticket exists for;
- the emitted framework tree is closed and each file appears once;
- the report states the graph size, and it is the size the independent walk
  found;
- a staged tree with dangling specifiers is refused as `ENVIRONMENT` with all of
  them named — a missing absolute import, an unmapped bare specifier and a
  missing stylesheet — each against its importer, with a specifier that appears
  only inside a comment correctly ignored, and the refusal telling the operator
  the previous `dist-assets` is untouched;
- a whole staged tree passes and reports its size.

Regression scope: the same file, `tests/bug23-repro-local-assets.test.ts`, the
framework suites (`tests/framework-*.test.ts`),
`tests/req177-discontinue-raw-server.test.ts` and
`tests/test_UAT_FC_BUG-50_builder_env_files.test.ts`; plus the full `node`
vitest project, whose 11 failing files are unchanged by this work (verified
against the same tree with the fix reverted).


---

## BUG-72: Marked Points: the label is hard to reach, the X is off-centre, and the pill is not atomic

## Symptom

Marked Points ([[REQ-210]], DOC-52 §4) works, but three things about the chrome
are wrong in use:

1. **The fresh label is very hard to catch.** It fades before the pointer can
   reach it, so the `+` and `×` controls on it are effectively unreachable.
2. **The X is not centred on the red circle**, so the mark reads as sloppy.
3. **The pill is not a pill.** `[Point A]` is ordinary text in the composer: it
   can be partly deleted, and content can be typed into the middle of it.
   DOC-52 §4.4 specifies the opposite — atomic, one backspace removes the whole
   chip, cut/copy/paste carries it intact.

## Root cause

**(1)** `onPointerMove` fades a fresh label once the pointer is more than a
single `FADE_AWAY_PX` **radius** (64px) from the *point*. But the label sits to
the **right** of the point and carries its own controls, so the journey from the
mark to the `×` is a horizontal one of roughly a hundred pixels — the label goes
out from under the cursor before the cursor arrives. It cannot then be recovered
by hovering the label, because a hidden label has `pointer-events: none`; the
only way back is to hover the 18px X itself.

**(2)** The cross is the glyph `✕` centred by flexbox. Flexbox centres the
*line box*, not the glyph's ink, and `✕`'s ink is not centred in its own em box —
so the visual result is off-centre by a font-dependent amount, and differs by
platform.

**(3)** The composer is `@lagrangefoundry/webui-chat`'s (TipTap, with a plain
`textarea` fallback), reached only through `getInputMarkdown`/`setInputMarkdown`
— a markdown string. There is no atom-node seam and `extensions: [StarterKit]`
is hard-coded, so nothing on this side of the wire can make a run of text
behave as one object. **This part is not fixable in this repo** and is split
out — see *Scope* below.

## Fix

**(1) The fade region matches where the label actually is.** The reach becomes
asymmetric: generous to the right, where the label and its controls live, and
tight in every other direction. And a pointer that is *over the mark's own
chrome* never counts as having left it, so once the pointer arrives the label
stays for as long as it takes to press a control.

**(2) The cross becomes geometry rather than a glyph.** Two white bars, each
centred on the disc by construction (offset by exactly half its own size) and
rotated ±45°. Nothing about the mark then depends on a font's metrics, so it
looks the same on every platform. The X's hit area grows slightly (18→22px) so
the hover that restores a faded label is easier to land.

**(3) Out of scope here.** The atomic pill needs an atom node in the shared
composer component (`components/webui/webui-chat` in `lagrange-framework`) plus
a seam for the host to register it. Filed there; nothing in this repo changes.

## Test plan

`tests/test_UAT_FC_BUG-72_marked_point_chrome.test.ts`, against the bytes
`1c render --edit` actually writes, driven by real pointer events — the same
harness the REQ-210 suite uses:

- a fresh label survives the pointer travelling the length of its own reach
- a pointer resting on the mark's own chrome never fades the label
- a pointer that genuinely leaves still fades it (the REQ-210 behaviour is kept)
- the cross carries no text and is two bars centred on the disc by construction