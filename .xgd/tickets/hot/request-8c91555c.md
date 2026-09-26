---
uid: request-8c91555c
id: REQ-328
type: request
title: 'Scroll-position-driven state: sticky pinning and scroll-linked animation'
created_by: xgd
created_at: '2026-09-25T23:35:15.273385+00:00'
updated_at: '2026-09-25T23:35:15.273385+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
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
