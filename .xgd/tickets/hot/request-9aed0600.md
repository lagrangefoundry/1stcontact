---
uid: request-9aed0600
id: REQ-210
type: request
title: 'The user can point: Marked Points on the edit preview'
created_by: CHAT-49
created_at: '2026-09-09T21:24:58.462451+00:00'
updated_at: '2026-09-10T00:17:16.067861+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 8
  depends_on:
  - REQ-209
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-583f91f4
  commits:
  - working_sha: b248d265cae55abea37d22f18bc328de0ca9bc97
    reconcile_sha: null
    main_sha: null
  version: 0.2.142
---

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