---
uid: story-86c7c21b
id: STORY-93
type: story
title: 'A newly created site is a page that already renders: creation seeds a complete,
  valid layout document'
created_by: xgd
created_at: '2026-08-06T03:42:07.316109+00:00'
updated_at: '2026-08-06T03:42:07.316109+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-ee56a66e
  capability_uid: capability-ccac1b1d
  story_kind: feature
  story_points: 1
---

## Story
**As an** author starting a new site, **I want** the site to be created as a page
that already renders — a complete layout document on the standard width ladder,
in the site's own theme colours — **so that** my first command produces a pixel
instead of a blank file I must fill in from memory before anything can be looked
at.

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
- **Colour comes from the site's own theme.** The document background and the
  placeholder's colour are the theme's own values, so a theme change remains the
  single place colour is stated and the starting page carries no invented literal.
- **The root is flowed, not pinned.** A per-width geometry track is what a
  *capture* folds to; a page with nothing to pin to gains nothing from one. Six
  absolute boxes would be the author's first chore, where flow centres itself at
  every width for free.

There is **one shape and no opt-in**. Every created site carries the document;
there is no flag selecting between an empty starter and a seeded one, because a
mode selection between an old and a new form is exactly what the project's
standing rule forbids.

In scope: what a created site's page carries, that it validates, renders and
screenshots unedited, the ladder and colour provenance, and the guarantee that a
reproduction import replaces the page document wholesale so a seeded skeleton
cannot contaminate a reproduced site.

Out of scope: the layout language itself and every axis in it (owned by the
framework substrate story), the reproduction pipeline, and anything the author
does after the first render.

## Technical Context
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
