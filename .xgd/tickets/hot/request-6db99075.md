---
uid: request-6db99075
id: REQ-325
type: request
title: 'Scroll-position-driven state: pinning, and properties that track scroll progress'
created_by: xgd
created_at: '2026-09-25T23:28:50.293953+00:00'
updated_at: '2026-09-25T23:28:50.293953+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What I was trying to achieve

An editorial page where a full-bleed image **pins** while the content above it scrolls up behind it, then releases once a following element reaches the image's bottom edge. The specific composition: hero image locks at the top of the viewport; the masthead and sub-line scroll up and disappear behind it; when the next section's rule approaches the image's lower edge, the image releases (or fades, or shrinks) and normal scrolling resumes.

More generally: **any element property driven by scroll position rather than by a one-shot entry trigger.**

## What stopped me

`reveal` is the only motion primitive available, and it is a one-shot entry animation — it fires once when the node enters the viewport and is then done. There is nothing that:

- pins an element to the viewport for a scroll range (CSS `position: sticky` semantics), or
- maps scroll progress within a range onto a property value (opacity, scale, translate, blur).

I checked the element vocabulary rather than assuming. There is no sticky positioning mode in `sizing`/`position`, and `motion` has no scroll-linked variant.

## What would let me finish

Two capabilities, usefully separable:

**1. Sticky positioning.** A positioning mode meaning "behave normally until your top edge reaches offset X from the viewport top, then hold there until your containing block scrolls past." Needs: the offset, and a defined release boundary (natural choice: the parent container's box, as CSS sticky does it). This alone covers most editorial pinning.

**2. Scroll-linked property tracks.** A motion variant where the driver is scroll progress rather than time. Something like a `scrollRange` naming the start and end conditions (e.g. element top enters viewport bottom → element bottom leaves viewport top) and a set of property keyframes across 0..1. Properties worth supporting first: `opacity`, `translateYPct`, `scale`.

Both should be no-ops — or degrade to their end state — when the visitor has asked their platform for reduced motion.

## Priority note

For editorial/portfolio pages this is the single largest expressive gap I have hit. The page can currently do "appear once" and nothing else, which means every scroll-driven composition — pinned imagery, layered reveals, an image that resolves as you descend — is unavailable. Sticky positioning (1) is the cheaper half and delivers most of the value.