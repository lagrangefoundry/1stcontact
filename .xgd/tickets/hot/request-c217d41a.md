---
uid: request-c217d41a
id: REQ-330
type: request
title: Let an image be opened large — click-to-zoom / lightbox
created_by: xgd
created_at: '2026-09-25T23:35:24.243829+00:00'
updated_at: '2026-09-26T19:49:49.678351+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-073110e5
---


## What I was trying to achieve

A page built around four large, detailed illustrations — dense manuscript-style plates carrying legible text, diagrams and annotations. On the page they render at roughly 520px wide, at which size the detail that makes them worth having is entirely lost: the quotation that *is* the page's argument reads as texture.

I wanted a reader to be able to click a plate and see it at full size.

## What stopped me

There is no way to express it. An image element places an image at a size; it has no interactive state, no open-large behaviour, and there is no component in the catalogue that supplies one. The only workaround is to render every image enormous inline, which destroys the page's composition.

## What would have let me finish

Either would work, and they are quite different in cost:

**The small version** — a flag on the image element: clicking it opens the source at full size in an overlay, dismissible by click, escape, or scroll. No configuration beyond on/off. Alt text carries across. This handles the majority of real cases.

**The fuller version** — a gallery component: several images form a set, the overlay offers next/previous, and the caption travels with the image. Worth it if the same machinery is wanted for portfolios and product shots, which it usually is.

## Worth settling either way

- **The overlay's look should be authorable**, not fixed chrome. A site with a considered ground colour should not get a generic black scrim it cannot change.
- **Keyboard and focus.** Escape closes, focus returns to the image that opened it, focus is trapped while open. This is the part that most lightbox implementations get wrong and that is expensive to add later.
- **Which source is shown.** The placed image may be a resized derivative; the overlay wants the original.

## Why it matters for this kind of site

For a site whose goal is memorability rather than conversion, the images *are* the argument, and the thing a visitor screenshots and sends to someone else is the thing the site is for. Rendering them at a size where they cannot be read turns the strongest asset into decoration.

---

## Where this ticket starts from

**The small version already exists.** REQ-327 landed the `zoom` role on the
`image` element: `zoom: {}` opens the picture large in an overlay, with
`zoom.src` naming a higher-resolution original, `zoom.backdrop` making the scrim
authorable, and `zoom.ariaLabel` naming the overlay. Dismissal on Escape and on a
click away, the focus move into the overlay and back to the trigger, the focus
trap and the scroll lock are all REQ-212's modal machinery, which the zoom role
compiles to rather than re-implementing.

So three of this ticket's four settled points, and the whole of its small
version, are already answered. What this ticket builds is the remainder:

1. **The fuller version — the gallery.** Several pictures form a set; the overlay
   shows one at a time and offers next/previous; the caption travels with the
   image.
2. **Dismissal by scroll**, which the small version does not do.
3. **The overlay's chrome colour**, which follows from (1): a caption and two
   navigation controls are ink painted on the backdrop, and a site that chose a
   pale ground must be able to say what colour they are. `backdrop` alone made
   the ground authorable and left everything drawn on it fixed.

## What was built — the set, as three more fields on the role that exists

No gallery *component*. A gallery is not a new kind of behaviour: it is the
overlay that already exists, holding more than one picture. Authoring it as a
behavior module would mean mounting something, binding slots, and duplicating the
whole of REQ-212's dismissal/focus/lock contract inside a module that is not
allowed to own it. So the set is expressed where the single picture already is —
on the picture — and the renderer synthesizes the shared overlay from it, exactly
as it already synthesizes the solitary one.

`l1ZoomSchema` gains five optional fields, all of them for something the existing
form cannot state:

- **`group`** — a name. Every picture on the page naming the same group forms one
  set, **in document order**, sharing **one** overlay. Absent → the picture opens
  alone, which is what every existing document does.
- **`caption`** — what to say about the *large* picture. It is emitted inside the
  overlay beside the picture it belongs to, so in a set it travels with the image
  as the visitor steps through. Available to a solitary zoom too: a plate worth
  opening is usually a plate worth captioning.
- **`ink`** — the colour the overlay's own chrome is painted in (the caption, the
  two navigation controls). Absent → white, which is what pairs with the
  renderer's near-opaque dark backdrop. This is the same kind of statement
  `backdrop` is — about the page *around* the picture, which no axis on the
  picture can make.
- **`prevLabel` / `nextLabel`** — the accessible names of the two navigation
  controls. Absent → `Previous image` / `Next image`. A control drawn as a
  chevron has no visible text to be named by, and a site published in another
  language cannot be left with two English buttons.

### One overlay per set, emitted once

A set's members are scattered through the tree, so its overlay cannot be emitted
inline at any one of them. The renderer collects each member's large picture as it
walks, and flushes **one shell per group** at the end of the document (beside the
stylesheet and the script, which are document-level for the same reason). Each
member's trigger opens that one shell and names its own index.

The overlay's chrome — `backdrop`, `ink`, `ariaLabel`, `prevLabel`, `nextLabel` —
belongs to the set rather than to any one member, so the validator **refuses a set
whose members name the same chrome field differently**: a document that says two
things about one overlay has a bug, and silently taking the first member's answer
would hide it. Members that name nothing are always fine.

### Stepping through the set

Navigation is the one thing the existing script does not do, so a second
renderer-owned script ships — on the same terms as the first: emitted only when
the page carries a zoom at all, never in the edit channel, carrying no instance
data of any kind. It owns three things and nothing else:

- **Which member is current.** A trigger names its index; the script marks the
  matching figure, in the capture phase, so the mark is set before the overlay
  opens rather than a frame after it.
- **Next / previous**, by click on the two controls and by ArrowLeft/ArrowRight
  while the overlay is open. The set **wraps**: a gallery of four plates cycles
  rather than dead-ending, because a visitor who has reached the last plate and
  wants the first should not have to close and re-open.
- **Dismissal by scroll**, which the ticket asks for and the modal does not
  supply. A wheel gesture closes an open zoom. **Touch is deliberately excluded**:
  a drag on a touch screen is how a visitor pinch-zooms and pans the plate they
  just opened, and dismissing on it would take away the very thing the overlay
  exists to offer. Touch already dismisses by tapping the picture.

The navigation controls stop their own clicks from reaching the panel, because the
panel closes on a click anywhere — the forgiving reading REQ-327 chose for an
overlay holding one picture and nothing interactive. They are the first thing in
it that a click can mean something else.

### What the unenhanced page does

Everything new is gated on the same ready marker the rest of the overlay is, so a
page whose script never runs still fails **visible**: all of a set's pictures lie
in flow with their captions, in document order, and the two navigation controls —
which can do nothing there — are not painted at all. That is the existing rule
about the `zoom-out` cursor applied to the two controls: a page never advertises a
gesture it cannot honour.

### The edit channel

Unchanged in kind: the elements, the classes and the boxes survive, and only the
attributes that would ACT are dropped — now including the trigger's index and the
two controls' step, so a click in the editor means "edit this picture" and nothing
else.

## Three things that follow from the set, rather than being asked for

Each is a consequence of holding more than one picture in one overlay, and each
is proved by the suite below.

- **A captioned overlay leaves its caption room.** A picture already sized to the
  whole viewport, with words under it, is taller than the viewport — and the
  caption is the half that scrolls out of reach. So an overlay that carries a
  caption gives its picture that much less height. Charged only to an overlay that
  actually has one: a set with no captions is sized exactly as REQ-327 sized it.

- **The overlay announces the picture it is actually showing.** REQ-327 named the
  overlay after the picture's alt text when the document named nothing — which was
  right while the overlay held one picture and could hold no other. A set makes
  that name go stale: it would go on announcing the first plate while the third is
  on screen. So a *derived* name is re-derived as the visitor steps, and an
  *authored* `ariaLabel` never moves — a document that named its gallery said
  something about the set, not about whichever member is up.

- **A set declared inside a mounted behavior's slots still gets its one shell.**
  A fragment has no document to put it after, so it rides on the last subtree —
  the nearest thing a fragment has to "after everything", and where the host page
  places it for the same reason the document does.

Two smaller consequences of the same shape: the vetted stepping script is
**exported** beside the modal's, because a consumer hashing scripts under a CSP
needs the text of every one the renderer can emit and not just the first; and the
five overlay-describing fields are **named once**, in the schema, because the
validator that refuses a disagreeing set and the renderer that reads them off
whichever member named them would otherwise each keep their own list of what
counts as the overlay's.

## Test plan

`tests/test_UAT_FC_REQ-330_image_gallery.test.ts`, at the same boundaries REQ-327
is proved at — the envelope validator, the sole emitter, and the published page
driven end to end in jsdom, which is the only place stepping, wrapping and
dismissal are observable at all.

- the vocabulary: the five fields accepted on `zoom` and on nothing else; no way
  to paint and no way to script smuggled in beside them
- the envelope: a set whose members disagree about the overlay's chrome is refused
- the emission: one shell for a four-member set, not four; each trigger opening
  that one shell at its own index; the caption beside the picture it belongs to;
  the chrome painted in `ink`; the controls absent from a set of one
- driven: opening at the clicked plate, stepping with the controls and with the
  arrow keys, wrapping at both ends, the caption changing with the picture, a
  wheel dismissing, a touch drag NOT dismissing, focus still returning to the
  plate that was clicked
- reuse: a page with a gallery ships REQ-212's modal script unchanged and one
  zoom script, and no third overlay implementation
- the unenhanced page: every member visible in flow, the controls unpainted
- the edit channel: no acting attribute anywhere in the set
