---
uid: request-da2bf042
id: REQ-326
type: request
title: Allow multiple animations on one element
created_by: xgd
created_at: '2026-09-25T23:28:53.663349+00:00'
updated_at: '2026-09-26T00:00:50.120164+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c2e3d5af
---

## What I was trying to achieve

Give one element more than one motion behaviour at a time — for example an image that has a one-shot entry reveal **and** a scroll-linked property track, or an entry reveal plus a hover response.

## What stopped me

An element's motion is a single value, so naming a second behaviour replaces the first. There is no way to express "this node does A on entry and B thereafter", or "A and B simultaneously with different durations".

## What would let me finish

Let the motion field take a **list** of behaviours rather than one, each with its own trigger, duration, delay and easing. Composition rules worth settling in the spec:

- Two behaviours animating the **same property** — last one wins, or refuse the write. Refusing is probably better: silently dropping one is the failure mode that costs a diagnosis cycle.
- Two behaviours animating **different properties** — compose, which is the common case (fade on entry, translate on scroll).
- Order in the list is paint/priority order, so it is authorable rather than implicit.

Backwards compatible if a single object is still accepted and treated as a one-item list.

## Why it matters

Once scroll-linked motion exists (filed separately), one-behaviour-per-element becomes the binding constraint immediately: entry reveal and scroll tracking are the obvious pairing and an author cannot have both. It is worth landing the two together.


---

## Implementation shape (settled in session, 2026-09-25)

### Which field this is

The motion field is `reveal` (REQ-100) — L1's one entrance primitive, carried at
node level alongside `interaction` / `link` / `transform`. It keeps its name:
`motion` is already taken by `l1MotionSchema`, the interaction-state transform
delta, and renaming across the renderer and every existing document would be
churn with no behavioural payoff.

### What actually composes today, and where

The ticket names three pairings. They resolve in different places, and only one
of them is this ticket's work:

- **entry reveal + hover response** — already composes and always has. `reveal`
  animates the independent `translate` property while a hover's motion animates
  `transform`, and both features' timings are merged into one `transition-*`
  declaration set rather than the second replacing the first. Nothing to build.
- **entry reveal + scroll-linked track** — composes for free once scroll-linked
  motion lands, because that will be its own node-level field (REQ-325 / REQ-328,
  filed separately). Not this ticket.
- **two entrance behaviours at once, with different timings** — the case with no
  home today, and the one this ticket delivers. One `reveal` object carries one
  `durationMs` / `delayMs` / `easing`, so a node that wants to fade quickly and
  rise slowly cannot say so: it must pick one timing for both properties.

### The change

`reveal` accepts **one behaviour object, or a list of two or more**. Each entry
in the list carries its own `yPx` / `fromOpacity` / `durationMs` / `delayMs` /
`easing`, and the renderer emits one transition per property with that
behaviour's own timing.

Composition rules, as the ticket asks them to be settled:

- **Same property in two behaviours → the document is refused**, naming the
  property, the offending behaviour's index, and the behaviour that already
  claimed it. Taking last-one-wins would silently drop half of what the author
  wrote, which is the diagnosis cycle the ticket asks to avoid.
- **Different properties → compose**, which is the common case.
- **List order is preserved** in the emitted declarations and in the
  `transition-property` list, so the composition order is authorable rather than
  an accident of how the renderer happens to walk the object. Because a
  same-property collision is refused rather than resolved, order cannot change
  which behaviour wins — there is never a contest — so what order buys is
  stability, not arbitration.

### Backwards compatibility — and the one deliberate deviation

A single object is still accepted and still renders byte-identically, so every
existing document stays valid and unchanged.

**A one-element list is refused** (the list form starts at two), which is a
deliberate departure from the ticket's "treated as a one-item list". Two legal
spellings of the same thing is the drift this schema refuses everywhere else —
the same call `l1TextContentSchema` already makes for REQ-211's `text`, where a
one-run array is likewise not a legal spelling of a plain string. The fold, the
renderer and the editor would each need a rule about which spelling they emit,
and the first to disagree produces a document that reads differently depending
on who wrote it.

### Three consequences that needed deciding

- **A behaviour claims exactly the properties it will actually move.**
  `fromOpacity` claims `opacity`; a non-zero `yPx` claims `translate`. This is
  what makes the collision rule mean something: it is checked against what gets
  emitted, not against which keys were typed.
- **The default fade belongs to the entrance, not to each behaviour.** `reveal`
  has always meant "fade in, and optionally rise": `fromOpacity` absent implies
  0. Applying that per behaviour would make every list collide on `opacity` and
  be refused, so the rule is stated once for the entrance as a whole — if no
  behaviour names `fromOpacity`, the **first** behaviour fades from 0. For a
  single object that is exactly today's behaviour; for a list it puts the fade
  somewhere nameable rather than nowhere.
- **A behaviour that animates nothing is refused** — timing attached to no
  property is not a behaviour, it is a place in the composition order. (A single
  object naming neither axis still fades, per the rule above, so this can only
  bite in the list form.)

### Bounds

The list is capped. Each behaviour's `durationMs` / `delayMs` / `yPx` are
bounded exactly as a single `reveal`'s always were, and the refusal names the
behaviour's index so an author knows which one is out of range.

### What does not change

The entrance mechanism itself is untouched: the pre-state is still gated on the
`data-l1-motion` marker so a page with no script renders fully settled, the
reduced-motion rule still restores the node's own authored opacity and geometry,
a container's `staggerMs` still adds to every behaviour's delay, and a composed
entrance is still driven by the one renderer-owned observer script. Composition
must not cost any of the properties that make the mechanism safe.

### Where the shared reading lives

The "which properties does this behaviour animate" projection is stated **once**,
in `packages/site-schema/src/l1/motion.ts`, and read by both the validator and
the renderer — the same construction `l1TextRuns` uses for REQ-211. If the two
had their own copies, what the validator refuses and what the renderer emits
would be free to drift, and the collision rule would be enforced against a
property set the renderer no longer uses.
