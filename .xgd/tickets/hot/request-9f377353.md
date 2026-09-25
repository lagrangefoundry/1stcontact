---
uid: request-9f377353
id: REQ-329
type: request
title: Multiple animations per element, composed rather than replaced
created_by: xgd
created_at: '2026-09-25T23:35:20.106096+00:00'
updated_at: '2026-09-25T23:35:20.106096+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What I was trying to achieve

An element that both rises-and-fades on entry **and** does something else — shifts at a different rate as the reader scrolls, or has a hover state, or carries a second entrance on a different delay for a child.

## What stopped me

`reveal` is a single object on an element. One element, one animation. There is no way to express "this element has two behaviours" — a second one has to replace the first.

Today this is a soft constraint because `reveal` is the only motion there is. It becomes a hard blocker the moment scroll-linked motion or hover states exist, because the natural authoring request is immediately *"fade in on entry, and then drift as I scroll"* — two animations on one node, with different triggers.

## What would have let me finish

Let the motion field take **a list** rather than a single object. Each entry names its own trigger (entry, scroll range, hover, focus), its own target properties, and its own timing.

Composition rules need deciding, and they are the substance of this request rather than a detail:

- **Two entries targeting the same property.** Later-wins is the simplest rule and probably right. Additive composition is more powerful and much harder to reason about.
- **Transform in particular.** An entrance that translates Y and a scroll-link that also translates Y must compose rather than clobber, or the common case is broken on day one. This is where CSS itself is awkward and where a considered answer would be genuinely better than the web platform's.
- **Ordering.** Whether the list order is meaningful or whether triggers are independent.

## Migration

A single object should keep working — accept either an object or a list, so nothing already authored breaks.

## Why it matters beyond this site

The one-animation-per-element limit will not be visible as a constraint until the *second* motion primitive ships, and at that point it becomes visible everywhere at once. Deciding the composition semantics before then is cheaper than retrofitting them after authors have built against single-slot behaviour.
