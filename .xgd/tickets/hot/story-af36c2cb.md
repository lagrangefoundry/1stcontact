---
uid: story-af36c2cb
id: STORY-98
type: story
title: 'The edit render: a third channel that deliberately does not work, showing
  all content at once with every editable region outlined and addressable'
created_by: xgd
created_at: '2026-08-06T21:25:04.945391+00:00'
updated_at: '2026-08-12T22:02:05.492645+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-0385746c
  capability_uid: capability-12fee326
  story_kind: upgrade
  story_points: 3
  updated_by:
  - bundle-15c1f647
  - request-8a132869
  uat_coverage: pass
---

## Story

**As a** site owner about to change my own page, **I want** a render of my site
that deliberately does not work — nothing navigates, nothing submits, nothing is
hidden waiting to be scrolled into view — with every region I can change marked,
individually identifiable, and naming the page it belongs to, **so that** editing
my page is a matter of pointing at what I can see, rather than fighting a live
page that navigates away or hides half its copy behind an animation.

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
- **The page the render came from, stamped on the document** — an address
  locates a node *within* a page, which is only half a coordinate. The edit
  render therefore names its own page: the document carries the page's
  definition **id**, beside the edit-mode marker. It is the id and never the
  slug or the file name, because the home page is emitted under an alias file
  name — so the file on screen does not name the page, and a client that tried
  to derive it would be re-deriving the renderer's own home-page rule and free
  to drift from it. The shipped channels carry no such stamp.
- **A module marks its own seam, and every module that has one marks it** —
  which of a module's elements is a presentation seam is knowledge only the
  module has, for the same reason it and not the channel declares its
  behaviour-off state. A module that leaves its seam unmarked leaves the copy
  inside it carrying an address indistinguishable from a page-rooted one, and
  therefore unresolvable. This is an obligation on the catalog, not on the first
  module that happened to need it: the contact form's form seam is marked the
  way the carousel's slide already was.
- **Outlines drawn by the renderer, hover treatment included** — the renderer
  knows which boxes are segments, so it draws the faint per-segment outline
  itself rather than leaving a client to hit-test and compute it, and it says
  what the segment under the pointer looks like too: the same outline,
  strengthened. A client only names which segment is hot. Both treatments are
  painted outside the page's layout, so neither becoming editable nor being
  hovered can move a box — the "movement" in the hover treatment is the outline
  lifting off the box, not the box moving.
- **One published vocabulary for the stamp** — the marker, the page stamp, a
  region's kind and address, the names of a behavior instance and its seam, the
  address's dotted form and the hot-segment class name are published as a single
  contract by the site-definition schema. The render writes them and any client
  reads them from that one contract, so a rename lands on both sides at once and
  markup a client can no longer read is not a state the two can reach
  independently.
- **No leakage** — rendering the edit channel changes nothing a visitor or a
  reviewer receives: the shipped channels carry no address, no region stamp, no
  page stamp, no edit marker and no outline treatment, and they still work.

- **One emitter, so an adjustment paints here exactly as it will on the page** —
  what an operator sees while changing how a picture is framed, shaped or
  colour-adjusted is what a visitor will be shown, because the edit channel and
  the shipped channels are the same renderer reading the same definition rather
  than two renderings kept in step. This is a *consequence* of the channel being
  a render mode rather than a second renderer, not a feature maintained beside
  it. It is asserted anyway: the day a second emitter appears — the anticipated
  one being drag-time feedback, where a pointer-move cannot afford a server
  round-trip and the adjustment is applied as inline style by the editing surface
  — is the day it can stop being true, and the assertion is what would catch
  that. Deliberately scoped to **paint** and not to the whole rule set: this
  channel's purpose is that it does not *work*, so its behaviour differs by
  design and only how it paints must not.

**Out of scope**

- **The editor UI** — click handling, modals, deciding which segment is under
  the pointer, structural editing affordances (drag handles, insert points).
  Explicitly deferred by the intent to the following ticket; this story is
  renderer-side only and every criterion below is observable on rendered output.
  The *treatment* a hot segment receives is in scope (the render owns what it
  looks like); *choosing* the hot segment is not.
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
- **The page stamp is the definition id, not the slug.** The slug names the
  file; the id is what a page is looked up by. The two are free to differ, and
  for the home page the emitted file name (`index.html`) is an alias belonging
  to neither.
- **A render-scoped address is safe here despite the usual objection.** A
  structural path normally breaks when siblings are reordered; here reordering
  produces a new render, and the client only ever resolves against the render in
  front of it.
- **"Carries paint" is answered by asking the paint emitter**, not by keeping a
  second list of paint axis names in step with it by hand — so a paint axis
  added in future is covered without revisiting segmentation. This is an
  implementation choice recorded here, not an AC; the AC asserts the outcome.
- **The stamp vocabulary sits with the schema, not with the renderer**, because
  it is the *contract* rather than the rendering of it. The renderer's own
  surface re-exports those values rather than declaring its own, so the two are
  the same values and not merely equal-looking ones. This is the reason the
  hot-segment class is vocabulary at all: the render styles it, a client sets
  it, and neither owns the name.
- **The hover treatment moves the outline, not the element.** Moving the element
  would reflow the page under the pointer and, worse, make the edit render's
  geometry differ from the draft's the moment a user hovers — which is the same
  property the resting outline is drawn with `outline` to preserve.
- **A seam marker is emitted in every channel, not only the edit one.** It is
  structural markup a module declares about itself and carries no behaviour and
  no styling, so it is inert where nothing reads it; the criterion on leakage is
  about *edit-channel artefacts* and says so explicitly rather than resting on a
  byte-identity claim the marker would falsify.
- **Provenance note — this story's code spans several commits and two intents.**
  The renderer, pipeline, store and CLI half was swept into the palette work's
  commit by a concurrent `git add -A` while it was in flight; the
  behavior-module half and the tests landed separately. The page stamp, the
  hover rule, the vocabulary's move to the schema package and the contact form's
  seam marker arrived later still, committed under the *editor* ticket that
  consumed them rather than under the channel's own — the behaviour is
  renderer-side and belongs here, but attribution by commit will be misleading.
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
  other, and the obligation is no longer asserted in only one direction. The seam
  marker sits on the same seam of ownership: the channel requires that a seam be
  identifiable, and the module is what identifies it.

- **Paint parity is structural rather than maintained.** One emitter reading one
  document cannot paint a definition two ways, so this is not a property kept in
  step by effort — it is a property that holds until someone builds the thing
  that would break it. Asserting something true by construction earns its place
  precisely because the construction is what is load-bearing: the assertion is a
  tripwire on the architecture, not a check on arithmetic. The declared
  exceptions are the interaction-driven decorations this channel already drops —
  a pointer-driven accent overlay whose script the edit channel does not emit,
  and an untriggered reveal whose pre-state would otherwise render copy invisible
  (the settled-state rule above). Both are absences of *motion*, not differences
  in how a node's own typed axes paint, which is why the parity criterion is
  stated of a node's own paint rather than of the two channels' whole output.

## Dependencies

None. The channel renders the existing definition through the existing renderer;
no plan item in this bundle precedes it.

## Story Points

3