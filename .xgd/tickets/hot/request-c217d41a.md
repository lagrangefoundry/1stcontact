---
uid: request-c217d41a
id: REQ-330
type: request
title: Let an image be opened large — click-to-zoom / lightbox
created_by: xgd
created_at: '2026-09-25T23:35:24.243829+00:00'
updated_at: '2026-09-25T23:35:24.243829+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
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
