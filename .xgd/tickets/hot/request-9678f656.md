---
uid: request-9678f656
id: REQ-335
type: request
title: No way to author an animated or interactive illustration — drawings are static-only
  and raster art cannot be driven at all
created_by: xgd
created_at: '2026-09-27T00:30:19.279491+00:00'
updated_at: '2026-09-27T00:30:19.279491+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-dc48909f
---

## What I was trying to achieve

A site's hero illustrations are detailed line drawings. The intended effect is that each one **comes to life under the cursor**: mechanical arms that begin to draw each other, a lever that actually lifts its load, a block diagram that assembles itself element by element, field lines that drift, a portrait whose eyes move.

This is the single strongest idea available to that page. The illustrations are its most memorable asset and they are currently inert decoration.

## What stopped me

**Two independent walls, and between them the whole class of effect is unreachable.**

**1. Generated drawings are static-only.** Writing an SVG containing a declarative animation is refused whole:

```
byte 116: <animate> is not an element a generated image may use.
byte 125: 'attributeName' is not an attribute a generated image may carry.
byte 144: 'values' is not an attribute a generated image may carry.
byte 162: 'dur' is not an attribute a generated image may carry.
byte 171: 'repeatCount' is not an attribute a generated image may carry.
```

The refusal is correct under the stated rules — the drawing surface permits shapes, paths, gradients, text and grouping, and nothing else. But `<animate>` and `<animateTransform>` are **declarative and non-executable**. They are not script. The security argument that excludes `<script>`, event handlers, stylesheets and external references does not obviously reach them, and excluding them costs the entire category of motion graphics.

**2. Element-level motion is entrance-only and single-shot.** What exists is a scroll-entrance reveal (opacity + Y translate, once) and hover state changes (colour, filter, shadow, border, opacity). Neither can express a sequence, neither loops, and neither can address *part* of an image — which is the whole point: the arms must move while the parchment does not.

**3. Raster art cannot be decomposed.** Most illustrations arrive as PNGs. Even with animation available on the drawing surface, there is no path from "a generated raster illustration" to "the same illustration with independently addressable parts". That gap deserves saying out loud because it determines the migration story for any site already built on generated imagery.

## What would have let me finish

In rough order of cost and of how much each unlocks:

**A — Permit declarative SMIL in generated drawings.** `<animate>`, `<animateTransform>`, `<animateMotion>`, `<set>`, with `attributeName`, `values`, `from`/`to`, `dur`, `begin`, `repeatCount`, `keyTimes`, `calcMode`, `fill`. No scripting, no external references, no event handlers — the existing prohibitions stand untouched. This is the cheapest change and on its own it delivers looping ambient motion (drifting field lines, a breathing spiral).

Worth deciding deliberately: `begin="mouseover"` is a *declarative* trigger, not an event handler in the scripting sense. Allowing it would give hover-driven illustration with no executable surface at all. That single attribute is most of what I actually wanted.

**B — CSS-style animation on L1 elements: keyframes, duration, easing, iteration, direction, and a trigger (`load`, `hover`, `in-view`).** This composes with REQ-329 (multiple animations per element) and would let a whole plate pulse or drift without touching the drawing surface. It does not solve moving *part* of an image.

**C — Addressable parts within a drawing.** The largest and most valuable: let a page target an `id` inside a generated SVG and animate it — `#left-arm`, `#lever-beam`, `#eye-l`. That is what "the arms draw each other on hover" actually requires, and it is the difference between ambient motion and illustration that performs.

## Why this is worth more than it looks

An illustration that responds is the most quotable thing a page can have — it is what a visitor screenshots, records and sends to someone else. For a site whose distribution is word of mouth rather than search, that is not decoration, it is the distribution mechanism.

There is also a consistency argument. The platform will generate rich imagery for a site and will pin, reveal and zoom it — but the imagery itself is frozen. Every other layer has gained expressiveness; the drawing layer has not moved.

## Related

Overlaps REQ-329 (multiple animations per element) and REQ-328 (scroll-driven state). If B is built, all three want one coherent model of *what animates, when it is triggered, and how several animations on one node compose* — cheaper to design once than to reconcile three times.

## Reproduction

Write a drawing containing `<circle><animate attributeName="cx" values="20;80;20" dur="3s" repeatCount="indefinite"/></circle>`. Refused, with the five messages quoted above. No stored drawing is modified.