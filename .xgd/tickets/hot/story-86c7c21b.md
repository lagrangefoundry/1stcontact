---
uid: story-86c7c21b
id: STORY-93
type: story
title: 'A newly created site is a page that already renders: creation seeds a complete,
  valid layout document'
created_by: xgd
created_at: '2026-08-06T03:42:07.316109+00:00'
updated_at: '2026-08-16T06:14:15.520937+00:00'
completed_at: null
last_field_updated: uat_coverage
status: completed
fields:
  intent_uid: bundle-ee56a66e
  capability_uid: capability-b4ac88fc
  story_kind: feature
  story_points: 1
  uat_coverage: stale
  updated_by: bundle-0385746c
---

## Story
**As an** author starting a new site, **I want** the site to be created as a page
that already renders — a complete layout document on the standard width ladder,
in colours the page's own document declares — **so that** my first command
produces a pixel instead of a blank file I must fill in from memory before
anything can be looked at.

## Description
This story documents **what a newly created site is**. Creating a site used to
leave a page with no layout document at all: a title, some metadata, and nothing
to render. Authoring therefore began by hand-writing the entire document from
nothing — the width ladder, the document background, the root container — before
a single pixel existed, and every author had to know the ladder convention by
heart or copy it out of an unrelated site.

Creation now seeds a **minimal but complete layout document**: the standard width
ladder, a document background, and a root that lays out by flow and centres one
placeholder run carrying the site's own name. The result validates as a site
definition, renders, and screenshots with no editing whatsoever — the point of
seeding at all is that the render-and-look loop is available from the very first
command.

Three properties are load-bearing beyond "something exists":

- **The ladder is the capture ladder.** The widths a scaffolded document is
  authored against are the same widths a reproduction keyframes at. An authored
  site and a reproduced one therefore vary at identical widths by construction,
  and the author never has to learn or transcribe the convention.
- **Colour is stated in the page's own document, as literals.** The document
  background and the inherited page text colour are hex literals on the seeded
  layout document, and the placeholder run takes the document's text colour rather
  than restating a third value — so the page is the single place a fresh site's
  colour is stated and the scaffold invents no colour beyond the two it declares.
  Creation declares **no palette**: a literal is always a valid colour, so a
  starting page needs none, and a palette is the refinement a site adopts later
  from the colours it actually carries.
- **The root is flowed, not pinned.** A per-width geometry track is what a
  *capture* folds to; a page with nothing to pin to gains nothing from one. Six
  absolute boxes would be the author's first chore, where flow centres itself at
  every width for free.

There is **one shape and no opt-in**. Every created site carries the document;
there is no flag selecting between an empty starter and a seeded one, because a
mode selection between an old and a new form is exactly what the project's
standing rule forbids.

In scope: what a created site's page carries, that it validates, renders and
screenshots unedited, the ladder and colour provenance — including where a fresh
site's colour is stated now that the theme has no colour surface — and the
guarantee that a reproduction import replaces the page document wholesale so a
seeded skeleton cannot contaminate a reproduced site.

Out of scope: the layout language itself and every axis in it (owned by the
framework substrate story), the reproduction pipeline, and anything the author
does after the first render.

## Technical Context
- **Colour provenance moved when the colour token group was retired.** The
  scaffold originally sourced both starting colours from the theme's closed
  colour palette, and the story recorded "a theme change is the single place
  colour is stated" as the load-bearing property. That palette no longer exists:
  the colour group was deleted outright rather than kept alongside a replacement,
  and the theme a created site carries is now the non-colour groups only. The
  property did not survive the cut, so it is restated rather than quietly
  reinterpreted — the single place a fresh site's colour is stated is the page's
  own layout document. What is preserved is the *substance* of the original
  criterion (no invented literal floating free of a declaration, one statement per
  colour); what changed is which artifact holds the declaration.
- **A scaffolded page is deliberately literal-only.** It declares no palette, in
  step with the rule that the capture→L1 fold also emits literals: palette
  assignment is a separate, re-runnable pass over a document that already has
  colours, not something seeded ahead of them. Creating a site therefore needs no
  palette to exist and cannot produce a dangling reference.
- **The seeded document must clear the safety envelope.** The envelope now runs on
  every authored page, not only on documents produced by a fold, so the starting
  document is held to the same numeric bounds, URL allowlist, node cap and unique
  DOM ids as any other. The skeleton was found already inside those bounds; no
  bound was relaxed for it.
- **Wholesale replacement on import is a guarantee, not an inference.** The
  reproduction import empties the site directory before writing, so the
  scaffolded ladder, background and placeholder cannot survive into a reproduced
  site. The criterion asserts the *result* (identical output over a seeded slug
  and over a slug that never existed) rather than the mechanism.
- **Consequence for behavior modules.** Because a created page now carries a
  layout document, the rule that a behavior module on such a page must name the
  seam it mounts into applies from day one — adding a module to a freshly created
  site requires declaring that seam first. That rule belongs to the
  behavior-module contract; this capability is what makes it bite immediately.
- **Intent/implementation agreement.** The operator's stated acceptance (a valid
  document, immediate render and screenshot, an uncontaminated import, no flag and
  no mode detection) is matched by the implementation. The derived-rather-than-
  restated ladder and the theme-sourced colours are implementation decisions
  recorded in the intent's dialogue and are documented here as behaviour because
  both are externally observable.
- The pre-implementation question the intent raised — whether a reproduction
  import overwrites or merges — was resolved as *overwrite*, and is pinned by an
  acceptance criterion rather than left as a read of the code.

## Dependencies
None.

## Story Points
1