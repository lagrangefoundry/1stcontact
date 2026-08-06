---
uid: story-af36c2cb
id: STORY-98
type: story
title: 'The edit render: a third channel that deliberately does not work, showing
  all content at once with every editable region outlined and addressable'
created_by: xgd
created_at: '2026-08-06T21:25:04.945391+00:00'
updated_at: '2026-08-06T22:03:49.927568+00:00'
completed_at: null
last_field_updated: body
status: completed
fields:
  intent_uid: bundle-0385746c
  capability_uid: capability-25f7e486
  story_kind: feature
  story_points: 3
---

## Story

**As a** site owner about to change my own page, **I want** a render of my site
that deliberately does not work — nothing navigates, nothing submits, nothing is
hidden waiting to be scrolled into view — with every region I can change marked
and individually identifiable, **so that** editing my page is a matter of
pointing at what I can see, rather than fighting a live page that navigates away
or hides half its copy behind an animation.

## Description

A site is rendered today for two audiences: the visitor (published) and the
operator reviewing a draft (preview). Both render a page that *works*. Editing
needs a third: the page the editor is built on.

**In scope**

- **A third channel** — the same site definition rendered a third way, into its
  own output location, always from the draft. A revision is immutable, so
  selecting one and asking for the edit render settles on the draft rather than
  combining the two. It is a render mode, not a new artifact: never published,
  never content-addressed, never entered into a site's revision history.
- **Deliberately non-functional** — a link keeps its element but carries no
  navigable target, so clicking it can mean "edit this copy" rather than "leave
  this page". A form carries no destination and no submit verb. No behaviour or
  motion code is referenced by the page, and none is written beside it: a bundle
  left in the directory is one stray reference away from the page working again.
- **The settled state, not the initial state** — content renders as it would
  look after every interaction that would reveal it. This is the load-bearing
  part: copy that fades in on scroll would otherwise render fully transparent,
  and a region nobody can see is a region nobody can click. A carousel's slides,
  which live off-screen in a scroll track until swiped, are all on screen at
  once. Each behavior module declares its own behaviour-off state, so the
  channel needs no knowledge of what a carousel is and a future module declares
  its settled state the same way.
- **Derived segmentation** — which regions are editable is derived from the
  definition's own structure, never declared on it: no schema change, no author
  burden, and no page silently uneditable because an annotation was forgotten.
  Text is copy, an image is an image, a container that paints something is a
  container, a seam with a behavior mounted in it is a module. A container that
  paints nothing, an empty seam and a control belonging to a mounted behavior
  are deliberately *not* segments — so the outlines themselves are the user's
  map of what can be changed.
- **Addresses** — every segment carries an address that resolves to exactly one
  node of the definition it was rendered from. The address is scoped to the
  render, not persisted: it need only stay valid for the page currently on
  screen, because every edit re-renders and regenerates it. Content inside a
  behavior module's seam is addressed relative to its instance, so one
  resolution rule serves whole pages and mounted fragments alike.
- **Outlines drawn by the renderer** — the renderer knows which boxes are
  segments, so it draws the faint per-segment outline itself rather than leaving
  a client to hit-test and compute it. The outline is painted outside the page's
  layout, so a region cannot move merely by becoming editable.
- **No leakage** — the published and preview renders of the same page are
  byte-identical to what they were before this channel existed.

**Out of scope**

- **The editor UI** — click handling, modals, hover treatment, structural
  editing affordances (drag handles, insert points). Explicitly deferred by the
  intent to the following ticket; this story is renderer-side only and every
  criterion below is observable on rendered output.
- **Preserved animation.** Explicitly rejected by the intent for this phase:
  untriggered reveals hide segments, motion competes with the outline signal,
  and a segment mid-transition has no stable box to outline.
- **Serving the edit render over the public web.** It is a local render channel;
  the published and preview channels remain the only shipped ones.

## Technical Context

- **A render mode threaded through the one existing emitter**, not a second
  renderer and not a client-side overlay hit-testing a working page. The
  emitter is already walking the definition's tree as it emits, so it knows
  which node produced which element and can stamp the address as it goes; an
  overlay would have to rebuild that mapping from the rendered output and keep
  it valid. Making the channel a render also makes "the page does not work"
  honest — the targets and scripts are simply not emitted — rather than a
  working page smothered in suppression code.
- **The address is deliberately not the definition's own element identifier.**
  That identifier has a different job (the real DOM id, so in-page anchors
  resolve and a label wires to its field); it is optional, sparse, and visible
  to visitors in URLs. This story neither writes it nor depends on it, and
  leaves its meaning and emission unchanged.
- **A render-scoped address is safe here despite the usual objection.** A
  structural path normally breaks when siblings are reordered; here reordering
  produces a new render, and the client only ever resolves against the render in
  front of it.
- **"Carries paint" is answered by asking the paint emitter**, not by keeping a
  second list of paint axis names in step with it by hand — so a paint axis
  added in future is covered without revisiting segmentation. This is an
  implementation choice recorded here, not an AC; the AC asserts the outcome.
- **Provenance note — this story's code spans two commits.** The renderer,
  pipeline, store and CLI half was swept into the palette work's commit by a
  concurrent `git add -A` while it was in flight; the behavior-module half and
  the tests landed separately. Both are inside this bundle, so no third intent's
  territory is involved, but attribution by commit will be misleading.
- **Placement note — the behavior-module obligation is asserted here, and the
  contract now states it too (resolved).** "A behavior module declares what its
  own behaviour-off state looks like" extends the behavior-module contract, which
  another story owns. It was flagged for a reviewer, and the ruling was that
  flagging alone was not enough: the contract story asserted that a module ships
  no CSS beyond its declared invariant elements, so with the carousel shipping an
  edit-scoped rule the matrix held a proposition and its negation at once. The
  contract story now carries the **settled state as a second declared carve-out**,
  bounded to the edit channel and to release-not-paint properties.

  The criteria stay split along ownership rather than being duplicated: this story
  owns what the *channel* requires (the page is inert, and content — a carousel's
  slides included — is visible in its settled state), and the contract story owns
  what a *module* is permitted to ship in service of it. Neither restates the
  other, and the obligation is no longer asserted in only one direction.

## Dependencies

None. The channel renders the existing definition through the existing renderer;
no plan item in this bundle precedes it.

## Story Points

3