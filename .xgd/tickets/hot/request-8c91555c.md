---
uid: request-8c91555c
id: REQ-328
type: request
title: 'Scroll-position-driven state: sticky pinning and scroll-linked animation'
created_by: xgd
created_at: '2026-09-25T23:35:15.273385+00:00'
updated_at: '2026-09-26T19:53:49.195255+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-f9122815
  commits:
  - working_sha: aa812b8ac99ab97db9d396d637583d24e56a9256
    reconcile_sha: null
    main_sha: null
  - working_sha: db846206af45af3a626d0486cd45a09b121f6748
    reconcile_sha: null
    main_sha: null
  - working_sha: e398766615fbd3532c8017fe3e9830b25f7e82fb
    reconcile_sha: null
    main_sha: null
  version: 0.2.377
---

## What I was trying to achieve

An editorial hero sequence: a full-bleed illustration pins to the viewport while the masthead and sub-line scroll *up behind it*, and once the following section's rule approaches the bottom of the illustration, the illustration releases and scrolls away (or fades, or shrinks) with it.

This is the single most requested class of effect for long-form editorial pages, and none of it is expressible today.

## What stopped me

`reveal` is the only motion primitive: it fires **once, on entry into the viewport**, with a fixed duration. It has no relationship to scroll position after that moment. There is no sticky positioning, no scroll-linked value, and no way to hold an element in place while the page moves past it.

So the page can say *"animate when you arrive"* and cannot say *"your state is a function of where the reader is"*.

## What would have let me finish

Two related capabilities, and I think they are worth separating because the first is much smaller.

### 1. Sticky positioning

A boolean-plus-offset on an element: it scrolls normally until its top reaches a given distance from the viewport top, then holds there until its parent container's bottom passes. Standard CSS `position: sticky` semantics.

That alone builds the hero case: pin the illustration, let its containing section be as tall as the content that should pass behind it, and the release is automatic when the section ends. No new animation machinery at all.

**Needs settling:** which ancestor bounds the sticky range (the immediate container is the obvious answer, matching CSS); and paint order against siblings that pass beneath it.

### 2. Scroll-linked value ranges

A more general form: an axis value that interpolates between two values across a scroll range, rather than firing once. Shape roughly parallel to the existing responsive keyframes, but keyed on scroll progress rather than viewport width — which is a pleasing symmetry, since the keyframe machinery already exists and is already understood by authors.

This is what gives "shrinks as you scroll past", "fades out as the next section arrives", and parallax at differing rates.

**Needs settling:** what the progress is measured against — element entry-to-exit is the useful default; and whether it composes with `reveal` or supersedes it.

## Constraints worth building in

- **Respect reduced-motion.** Scroll-linked motion is the category most likely to cause discomfort. A reader who has asked their machine for less motion should get the static end-state, not a slower version.
- **Sticky should degrade to static**, not to broken layout, wherever it cannot apply.

## Priority note

(1) is worth shipping on its own and probably unblocks most real cases. (2) is the general answer and is considerably more spec.


---

## What was already delivered — and by what (2026-09-26)

**This request is a near-duplicate of [[REQ-325]]**, filed seven minutes earlier
in the same wishlist pass and titled *"Scroll-position-driven state: pinning, and
properties that track scroll progress"*. REQ-325 is `ready_to_reconcile` with its
code on `xgd-working`, and it delivers everything this ticket asks for **except
one named item**. Held against this ticket's own asks, read from the code rather
than from the ticket:

| This request's ask | Where it landed |
|---|---|
| §1 Sticky: boolean-plus-offset on an element | `sticky: { topPx?, fromPx? }` in `l1NodeAxisGroupsSchema`; `position: sticky; top: Npx` from `stickyDecls` |
| §1 *Needs settling:* which ancestor bounds the range | Settled as CSS's own — the node's containing block, i.e. the immediate parent's box. No field; stated in the axis's documentation |
| §1 *Needs settling:* **paint order against siblings that pass beneath it** | **Not settled. This is what REQ-328 builds.** |
| §2 Scroll-linked value ranges, parallel to responsive keyframes | `scrollTrack: { range?, stops: [{ at: 0..1, opacity?, translateYPct?, scale? }] }`, compiled to a renderer-named `@keyframes` block + `animation-timeline: view()` |
| §2 *Needs settling:* what progress is measured against | Settled: the four CSS named view-progress ranges as a closed enum, `cover` (entry-to-exit) the default |
| §2 *Needs settling:* composes with `reveal`, or supersedes it | Settled as **mutually exclusive** — structural rule `oneMotionDriver`. A CSS animation beats a transition, so a node carrying both would lose its entrance silently; the shape refuses the pair rather than shipping the trap |
| Respect reduced-motion | Track declarations sit inside `@media not (prefers-reduced-motion: reduce)` as well as `@supports (animation-timeline: view())`; a reader who asked for less motion gets the settled design |
| Sticky degrades to static, never to broken layout | `position: sticky` degrades natively; `fromPx` confines the pin to a width band; `sticky` + an absolute `geometry` track is refused by name (`stickyIsInFlow`) rather than silently resolved |

So the remaining scope of this request is the one sub-question REQ-325 left open.

## The gap this ticket closes: a pinned node cannot say what passes behind it

L1 emits no `z-index`, and the schema states that paint order is therefore
document order. **Against a pinned node that claim is not what the renderer
does**, and the outcome is decided by something the author never chose.

Rendering the composition in this ticket's opening paragraph — a pinned
illustration with the content that should pass behind it following in flow —
shows the actual rule:

```
.l1-1 { display: block; position: sticky; top: 0px }   /* the pinned illustration */
.l1-2 { position: relative }                            /* a box sibling     — COVERS it */
.l1-4 { display: flex; ...; position: relative }        /* a container sibling — COVERS it */
.l1-6 { display: block }                                /* an image sibling  — passes behind */
.l1-7 { margin: 0; transform: translate(0px, 4px) }     /* a translated text — COVERS it */
```

Every in-flow `box` and `container` takes `position: relative` (it is what makes
it the containing block for anything placed inside it), and a `transform`
promotes a node into the positioned paint layer. `text` and `image` leaves take
neither. So among siblings that follow a pin, **whether the reader sees them
travel behind the pinned node or over the top of it is a function of the sibling's
element kind** — not of any decision in the document. The masthead that is a bare
`text` leaf passes behind; wrap it in a box to give it a background and it starts
painting over the illustration instead, with nothing in the document changed that
says so.

This is exactly the item the request left open, and it is load-bearing for the
composition the request opens with: *"the masthead and sub-line scroll up behind
it"*.

## What is being built

One field on the existing pin, and one declaration.

```
sticky: { topPx?: number, fromPx?: number, lift?: true }
```

`lift` says the pinned node paints **above every sibling in its container** —
content passes behind it rather than in front of it. It compiles to `z-index: 1`
in the same declaration list as `position: sticky`, so a width-gated pin lifts
inside its own `min-width` block and not below it: where the node is not pinned,
nothing about its paint changes.

`true` is the only legal value, for the reason `stacked` gives: `false` would be a
second spelling of absent, and absent has to keep meaning *"the document has not
chosen"* — which for a pin is document-order paint among positioned siblings,
unchanged from today. Absence is not made to mean "passes in front", because a
following section that slides **over** a held hero is a real editorial composition
and is what document-order paint already gives; taking it away to make a default
tidy would cost more expression than it buys.

The value is `1` and not a larger number: the pin needs to clear its own siblings
and nothing else. It is named as a renderer constant next to `DIALOG_Z_INDEX`,
which is vastly larger, so a dialog still covers a lifted pin.

### Envelope and reference

No new structural rule and no new envelope bound. `lift` composes with everything
`sticky` already composes with, and is refused alongside it wherever `sticky` is
refused — an absolute `geometry` track (`stickyIsInFlow`) and an email page, where
the whole axis is already on the refused list and named in the refusal. The field
is documented on the schema, so the `REF-l1` vocabulary projection carries it
without a second copy being written anywhere.

Not recoverable from a capture, on the same terms as the rest of the pin: a single
frame at scroll 0 shows neither the pin nor what would have passed behind it. A
folded document never carries one.

## Test plan

`tests/test_UAT_FC_REQ-328_sticky_paint_order.test.ts` — the emitter as the
observation point, the same shape REQ-325's suite uses (what a browser does with
`z-index` is the browser's contract, and no headless run adds evidence about it):

1. the gap is real and kind-dependent: rendering the request's own composition,
   a pinned node's `box` / `container` / transformed siblings are positioned and
   follow it in document order while its `text` / `image` siblings are not — so
   without `lift` the answer to "does this pass behind" is the sibling's kind;
2. `sticky.lift` lifts the pinned node above its siblings, in the same
   declaration list as the pin, so it wins over the `position: relative` an
   in-flow node otherwise takes;
3. a width-gated pin lifts **only** inside its own `min-width` block — below the
   gate the node is in normal flow and its paint is untouched;
4. absent `lift` emits no `z-index` anywhere, so no existing document's paint
   changes and the pin without it is byte-identical to what REQ-325 shipped;
5. the envelope: `lift: false` and any other value are refused (it is
   `true`-or-absent), an unknown key on the pin is refused, and a lifted pin is
   still refused on an absolute `geometry` track and on an email page;
6. every node kind admits a lifted pin — carried by extending the two standing
   axis-group sweeps' `sticky` sample rather than by a sixth case here.