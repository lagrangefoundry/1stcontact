---
uid: story-2e4e2c45
id: STORY-91
type: story
title: 'L1 navigation: a typed link role any subtree can take, with real DOM ids for
  in-page anchors'
created_by: xgd
created_at: '2026-08-06T02:46:53.703289+00:00'
updated_at: '2026-08-09T05:42:09.320874+00:00'
completed_at: null
last_field_updated: uat_coverage
status: completed
fields:
  intent_uid: bundle-ee56a66e
  capability_uid: capability-ae9d65d6
  story_kind: feature
  story_points: 2
  uat_coverage: pass
---

## Story
**As a** visitor to a published site, **I want** the site's navigation, calls to
action, in-page jump links and footer links to actually take me where they say
they go, **so that** the page is something I can move through rather than a
picture of a website — and so that a link can never carry me somewhere unsafe or
hand the page I came from to the page I arrive at.

## Description
This story documents L1's **navigation role** and its **in-page anchor targets**.
Before this work the substrate could not express a link at all: there was no
target field on any node, no link-shaped node kind, and the published page
contained no anchors of any kind. Every call to action, nav item and footer link
on an L1 page was inert. Unlike a missing paint axis, this is a functional floor
rather than an aesthetic ceiling: no amount of design work compensates for a page
that cannot be navigated. It belongs to the substrate rather than to a behavior
module because a link is presentation plus a URL, not a behaviour with a core of
its own.

**A link is a role, not a kind of thing.** Any subtree can take it — a text run,
a painted box, a whole card, an image — so it is declared on the node the author
already authored rather than by wrapping that node in a new one. The published
page reflects this: the element the author styled *becomes* the link and keeps
its identity, so every paint axis, every measure and every interaction state
declared on it still applies to the thing the reader actually clicks. An image is
the single exception: a media leaf cannot itself be a link, so it is enclosed by
one that takes up no layout box of its own.

Retagging rather than wrapping is a safety decision, not an implementation
preference: a wrapper would move keyboard focus onto an outer element while the
authored focus treatment targets the styled one, so a linked node would silently
lose its focus indicator — the one axis the framework holds above taste.

**In scope.** A link declares its target, whether it opens in a new browsing
context, and an optional explicit accessible name. A node's declared identifier
becomes a real in-page navigation target, so a same-page link has something to
land on, and two nodes may not share one. A link paints from L1 rather than from
user-agent link chrome (no default underline, inherited text colour), while an
authored colour or underline still wins.

**The obligations the substrate keeps for itself.** A link target passes exactly
the same URL allowlist as every other URL the substrate emits, so an unsafe
target can never become a live link — the page presents the plain un-linked
element instead, and the author is told at validation rather than shipping a
silently dead control. A new-browsing-context link *always* carries opener and
referrer isolation; the vocabulary has no way to ask for the new tab without it.

**Out of scope.** A behavior-bound control cannot take the link role: a link
around a submit button is malformed interactive nesting, and the module owns that
element's semantics. Client-side routing, prefetching, link-hover previews, and
scroll-behaviour on anchor jumps are not part of this capability.

## Technical Context
- The link role is a node-level field carried by the same kinds that carry the
  other node-level groups; its *uniformity* across kinds is documented by
  STORY-83's shared axis-group criteria, while what a link **means and does** is
  documented here.
- The link target passes the same URL allowlist as an image source and a
  background image — one sink, one rule, no new security surface (DOC-2 §2).
  Enforcement is doubled deliberately: the envelope rejects an unsafe target at
  validation *and* the renderer independently degrades to the un-linked element,
  so neither layer is load-bearing alone.
- **Where the intent and the implementation differ, both in the safe direction:**
  1. The intent's criterion for an unsafe target described only the renderer
     degrading to the un-linked element. As built, the safety envelope *also*
     rejects the document, so an author is told rather than shipping a dead
     button. The story documents both.
  2. The intent named only the behavior-bound `control` as excluded from the link
     role. As built, a module **mount seam** is excluded as well — a seam is a
     mount point for a module's own markup, not a navigable authored subtree.
- A retagged text run keeps the block behaviour its original element had, and the
  enclosure around a linked image takes up no layout box, so adopting the link
  role never moves the page.
- Both new envelope rules (unique identifiers, target allowlist) run on authored
  pages via the authored-envelope work in plan item 8; before that they fired
  only on reproduced documents.
- The intent's final criterion is stated against a specific site's content
  (xgd.dev's nav, hero CTAs and footer navigating). Site definition data is not
  capability surface, so no criterion here is written against that site — the
  equivalent guarantees are asserted generically above.
- The duplicate-identifier rule also protects the label-to-control association
  the behavior-module control contract depends on (STORY-85), which is why it is
  an envelope rule rather than a lint.

## Dependencies
None. Plan item 8 (the authored-page envelope) depends on this story's two new
envelope rules, not the reverse.

## Story Points
2