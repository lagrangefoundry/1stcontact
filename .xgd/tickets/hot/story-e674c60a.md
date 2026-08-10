---
uid: story-e674c60a
id: STORY-99
type: story
title: 'The builder workspace: one browser surface showing my real rendered site,
  with the controls that act on it, served from a single origin'
created_by: xgd
created_at: '2026-08-07T01:42:20.886527+00:00'
updated_at: '2026-08-10T11:21:20.886493+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-15c1f647
  capability_uid: capability-a994b8f3
  story_kind: upgrade
  story_points: 3
  updated_by:
  - bundle-e59210c5
  - bug-ede1fb8c
  sprint_uid: sprint-a864c33e
---

## Story

**As a** person who owns a site on this platform, **I want** to open one page in
my browser and see my actual site rendered there, filling the window, with the
controls that act on it — which site, which way of looking at it, open it
properly, publish it — arranged around it, **so that** working on my site is
something I look at and point at, rather than a sequence of commands I have to
know the names of.

## Description

Everything the platform builds is, until now, reachable only by typing: a site
is rendered, listed, previewed and published from a command line. This story is
the surface where an operator *sees* the site instead.

**In scope**

- **A single workspace, at one address.** The workspace document, the UI
  components it is built from, its own browser code, and every rendering of
  every site in the store are all reachable from one origin. That is not a
  convenience: it is why the frame showing the site is not a foreign document,
  and why "open this properly in a new tab" lands on the identical URL the frame
  is already displaying rather than a lookalike.
- **Chrome built from shared components, consumed not copied.** The workspace is
  assembled from the shared UI components the wider system already ships. They
  are consumed from an installed copy that lives outside this repository,
  published under a single package scope, and the workspace references each one
  through the entry point that component itself declares — so an upstream file
  move is reported here, at the origin, rather than becoming a broken reference
  in the browser. No component source is copied in, and none is patched or
  wrapped: a gap in a component is closed where the component lives. Because the
  install is deliberate and out-of-band, a machine that has not run it gets a
  message naming the missing component and the command that installs it, not a
  blank page.
- **The scope those components are published under is one name, written once.**
  The scope is part of every reference the workspace makes to a component, so it
  is subject to the same one-definition rule as every other name here: it is
  declared in a single place, everything that generates a reference composes it
  from that declaration, and it appears as a literal nowhere else in the
  repository — not in a generated artifact checked in beside the generator, not
  in a comment. One surface cannot compose it: the workspace's own browser
  source is served to the browser verbatim and can read no build-time value, so
  it names components directly. That is a declared, bounded exception, and it is
  held in step by the requirement that every component the browser source names
  is one the generated workspace document also declares — otherwise the mismatch
  would appear only in a browser and nowhere a test can see it. When the wider
  system renames the scope, this repository moves with it in one step and the
  previous name is removed outright: there is no second scope to fall back to and
  nothing detects which one is present.
- **One tab, filling the window.** The workspace opens on a single tab hosting
  the display panel. The displayed site tracks the browser window's height and
  follows a live resize, and the workspace page itself never scrolls — a frame
  that collapses to a few lines tall is the failure this exists to prevent, and
  a page-level scrollbar is the visible sign that the height chain has leaked
  again. Every name the workspace shows has exactly one definition site, so
  renaming it is a one-line change and no second copy can drift.
- **A display panel with modes, not a preview.** The pane is not "the preview";
  it is a pane that can show any of several registered ways of looking at the
  current site, of which the normal view is one and the editable render is
  another. Registering a mode is adding an entry — there is no branch anywhere
  that a new mode must be threaded through — and switching modes changes what is
  displayed without rebuilding the pane around it.
- **A toolbar the active mode declares, re-derived from what is displayed.** The
  strip renders exactly the controls the active mode names, so a mode showing
  something other than a document simply does not offer "open in a new tab" and
  the strip never assumes a document beneath it. The strip is derived state, not
  something anyone keeps in step by hand: *every* change to what the pane is
  showing — the mode or the site — re-derives the whole strip, and each control
  is built against the mode and site current at that moment. So a control whose
  content depends on the site, the selector's own shown value included, follows
  the site on screen whatever changed it: the selector, the workspace restoring
  what it remembered, or a change made programmatically. The strip itself stays
  where it is through this; only its contents are replaced, so it never drops out
  of the layout. A control the strip replaces is released with it and stops
  reacting, so a workspace held open does not accumulate updaters writing to
  controls that have left the document. The controls act on real things: the site
  selector lists the sites the store actually holds, and publish goes through the
  platform's existing publish behaviour and adds no semantics of its own.
- **The draft-side channels are produced on request, not fetched off a shelf.**
  The two ways of looking at a site that track today's draft — the ordinary
  rendering and the editable one — are produced from the site's definition when
  they are asked for. There is no rendered artifact for the workspace to serve,
  nothing anyone has to remember to refresh, and no step between changing a site
  and seeing it changed: a definition edited anywhere at all shows on the next
  request. The bytes are the same bytes the platform's own render writes when it
  is asked to write them — one production of a page, with a writer and a reader
  over it, so the two cannot drift. A draft that no longer describes a valid site
  says so where the operator is looking, instead of the last good rendering
  quietly going on being shown. The **published** way of looking at a site is
  deliberately not like this: it stays the immutable rendering that publishing
  produced, because deriving it from today's draft would put unpublished work on
  the published address.
- **A split, and it remembers.** The display panel sits beside a secondary pane
  (the assistant panel) with a draggable divider that collapses to a rail and
  reopens to its previous width. The divider
  position, the collapsed side, and which site and mode were being shown all
  survive closing and reopening the workspace, and every stored value is
  namespaced to this workspace.
- **Freshness over caching.** The origin rewrites the bytes it serves underneath
  the browser — a rendered channel is re-produced while the frame is displaying
  it — so every response it returns, the workspace document included, is served
  as non-cacheable. One exempt response is enough to leave an operator looking at
  a stale page that appears to be working.
- **Confinement.** Several distinct file trees are served — everything a channel
  address can still reach on disk (a site's own assets, the published rendering),
  the installed components, the workspace's own browser source — and a request
  that tries to escape any of them is never satisfied: none of the targeted
  file's contents come back, and every tree behaves identically, so the
  confinement cannot be present on one tree and missing on another. It works by
  clamping an escaping path back inside the tree, so such a request is answered
  as *not found* rather than singled out as forbidden.

**Out of scope**

- Editing of any kind: clicking a segment, the field modal, and the write path
  behind it are separate stories. The editable *mode* is registered here and
  shows the editable rendering; the gesture that changes anything is not.
- What the assistant pane *does*. This story owns the split's geometry and what
  it remembers; the conversation the secondary pane hosts, and everything behind
  it, belongs to its own capability.
- Deciding what a rendering contains. The workspace produces the draft-side
  channels on request, but it decides no byte of them: the page a channel
  contains is the platform's own render, and this story adds nothing to it. The
  published rendering it does not produce at all.
- Any change to a shared UI component. Consuming the components under a renamed
  scope is not such a change: the components themselves stay untouched, and the
  name they are published under is owned upstream, not decided here.

## Technical Context

- **One production of a page, called two ways.** The workspace no longer serves
  the draft-side channels off something CAP-82 (Site Delivery) and CAP-84 (Edit
  Render Channel) had already written; it asks for them when a request arrives.
  What it asks is the *same* production those capabilities own — the build-time
  command that writes a channel to disk and this origin are a writer and a reader
  over one implementation, so a new typed axis or a new head tag reaches both at
  once. Two productions would reintroduce exactly the drift server-side-only
  rendering exists to prevent. The workspace still decides no byte, adds no
  publish semantics, and produces the published channel not at all: that one is
  the artifact publishing wrote, served as `public-site` will serve it.
- **The staleness rule went with the artifact.** Serving a stored rendering meant
  a save had to re-materialise both channels before it could reply, or whichever
  it skipped would go on showing the page as it used to be. That step is gone.
  It also meant a change made anywhere but the workspace's own save path — a
  command-line edit, a hand-edited page — was invisible until someone re-rendered,
  and a definition that had stopped validating left the last good rendering in
  place indefinitely with nothing to signal it. Both are closed by producing the
  page from the definition that exists when the request arrives. Producing a
  whole channel per file a page pulls would be wasteful, so a production is
  reused until the definition moves — reuse keyed on the definition itself, never
  on elapsed time, because a rendering held past a change is the staleness this
  removed.
- **Deviation, declared: the render still runs at the origin, not in the edge
  Worker.** The intent's first criterion asked for the draft-side channels to be
  served *by the edge Worker* at request time. That was not attempted, and this
  matrix does not claim it. A Worker has no filesystem and cannot run the
  transform the render path resolves behaviour modules through, so executing the
  render there requires the canonical store to be reachable from the edge — which
  is the storage migration the same intent's non-goals forbid. The part that was
  both reachable and load-bearing landed: request-time production, one
  implementation, no artifact, byte-identical. What remains is the runtime
  relocation alone.
- **The editable mode is registered, not implemented, here.** Registering it is
  what proves the mode contract with two real modes; the editable render belongs
  to CAP-84 and the editing gesture to its own story.
- **The origin runs outside the edge Worker, and that is deliberate and
  temporary.** Everything the workspace needs beyond its own chrome is
  filesystem-bound (rendered output, the store listing, publish), which the edge
  runtime cannot do; the two bundler routes that could have inlined the bytes
  were both spiked and both made the Worker untestable. So the origin is a local
  Node process and the Worker is a single verbatim front over it. A later phase
  moves the render's *runtime* into the Worker — the render already happens at
  request time — and deletes the front; it waits on the store being reachable
  from the edge. The acceptance criteria here are written about *one origin* and
  *what an operator observes*, not about a proxy, so they survive that change
  unaltered.
- **The scope moves in lockstep with upstream, and only forward.** The scope the
  shared components are published under belongs to the wider system, not to this
  repository. When it changes there, it changes here in a single step: the store
  is repopulated under the new name first, then every reference here moves at
  once, and the old name is deleted rather than deprecated. No fallback
  resolution and no dual-scope detection — a half-completed rename is meant to be
  loud, and the evidence below is what makes it so.
- **The component dependency is implicit — an accepted gap, but no longer a
  silent one.** Nothing in this repository's manifest records the shared UI
  components; they arrive from a deliberate out-of-band install into a shared
  artifact store, so a fresh clone has none of them. Two kinds of evidence sit on
  top of that, and they behave differently on purpose. Evidence about
  *consumption* — that each component resolves, that the copy resolved declares
  itself under the scope this repository uses, and that the generated document
  and the served browser source agree with that scope — is unconditional: on a
  machine without the install it fails and says which component it could not
  account for. Evidence about *mounting* real components in a browser-like
  environment still skips with a stated, reported reason, and stays unverifiable
  on such a machine until a private registry exists; its subject is mount
  behaviour, not which copy was consumed. The split matters because a presence
  check used as a skip gate reports "renamed upstream and not renamed here" and
  "never installed" identically — the two must be distinguishable, or a rename
  that has broken the browser reads as a clean green run. Components are never
  mocked, faked or vendored in either kind of evidence: a stand-in would prove
  nothing about the consumption route, which is most of this story's risk. It
  follows that the artifact store must be resolvable from wherever the evidence
  runs — including a detached working tree of this repository, which does not
  inherit the main checkout's neighbours.
- **Resolving the store from a detached working tree is a route correction, and
  it is made at the one resolution point.** The precondition above was not
  self-satisfying: a linked working tree is the same repository parked outside
  the directory the store sits beside, so the ordinary upward walk reached
  nothing and every component looked absent — which is indistinguishable from
  "the out-of-band install was never run", and that is a skip by design. Nine of
  this story's criteria therefore lost their evidence in every working tree
  *while reporting green*. So resolution is anchored at the main checkout, and
  the test runner is pointed at the identical packages by aliases **derived from
  that same single resolution point** rather than from a second guess at where
  the store lives. This is not the substitution the paragraph above forbids and
  cannot decay into one: every alias target comes from the resolver production
  uses, every alias key is composed from the one scope declaration — so a
  one-sided rename still fails loudly in both directions — and with no install
  there is nothing to alias and the mount evidence skips exactly as before. The
  alternative, an undocumented install into a directory outside every checkout,
  was rejected because its failure mode is the silent green rather than a loud
  one. Beyond that correction, a failure to resolve remains an environment
  precondition to be read as such, not a code defect.

  What "anchored at the main checkout" means is now stated as a criterion of its
  own rather than left as an implementation note. Resolution walks up from where
  it is asked until it meets the repository's own data, and the shape it finds
  decides the anchor: a main checkout owning that data anchors to itself; a
  linked working tree, whose data is a pointer to a shared repository directory,
  anchors to the main checkout that shared directory belongs to and never to the
  working tree; a pointer naming no shared directory anchors to the directory
  holding it; and a location under no checkout at all — an extracted archive —
  anchors to where the walk began rather than failing or climbing to the
  filesystem root. The equality those four cases exist to guarantee is the
  criterion's real subject: a component's directory is the same directory whether
  it is resolved from a working tree or from the main checkout, so the two can
  never be reading different installed copies. The anchor is settled once, when
  resolution is first needed in a run, so nothing a run does afterwards moves it.

  This was the gap: nine of this story's criteria depend on that anchoring for
  their evidence to exist at all, and it carried none of its own — its four
  branches were provable only by whichever checkout the suite happened to run in,
  which is one branch out of four. Establishing it against fixture trees is what
  makes it evidence rather than a coincidence of layout.
- **Divergence flagged, not absorbed: the local preview server's freshness
  changed too.** The non-cacheable directive was added to the shared file-sending
  path, which the standalone local preview server (STORY-95 / STORY-96) also
  uses. That server's own intent says nothing about caching, and no criterion
  here claims it. The effect is benign for a development server over
  live-rebuilt artifacts, but the behaviour now exists outside this story's
  declared scope and the matrix for those stories follows their own intent.
- **Superseded:** the control app's placeholder response at its root is removed —
  the workspace occupies that route now. No story owned the placeholder, so this
  carries no matrix debt.
- **Confinement clamps rather than detects, and that is why the refusal reads
  as "not found".** Every path the origin serves arrives root-relative, and
  normalising a root-relative path drops its leading traversal segments — so an
  escaping request resolves to a path that does not exist *inside* the tree and
  is answered as not found. The shared resolver's explicit forbidden branch is
  consequently unreachable for URL-derived paths. Security is intact: the
  targeted file is never served, on any tree. Only the shape of the refusal
  differs from the more obvious detect-and-reject, and the criterion is written
  about non-delivery rather than about a status code so that it documents what
  ships. Making the escape detected explicitly would be a new ticket against
  this story, not a reconciliation change.
- **Same-origin is load-bearing for what comes next.** The editing gesture reads
  and binds inside the frame's document; that is only possible because the frame
  is same-origin, which this story establishes.
- **The strip is derived state, and a control's lifetime is its element's
  lifetime.** The toolbar re-derives on every change to what is displayed, not
  only on a mode change, because a control can depend on the site as much as on
  the mode — and re-deriving the *whole* strip is what keeps "built against
  current state" true of every control rather than of whichever one happened to
  be wired for it. The consequence that is easy to miss, and that cost four
  assertions in the suites before it was written down (BUG-33): a control the
  strip has already replaced is a detached survivor. It is inert by design — what
  kept it current died with it — so anything still holding it is reading a copy
  frozen at the moment of replacement, not the control an operator can touch. The
  behaviour under test is always the control presently in the strip. The
  criterion for this was absent from the matrix while the property was
  load-bearing in the code, which is why the divergence surfaced as red tests
  rather than as a documented gap.
- **Divergence noted, in commentary only.** The inline comment at the point where
  the strip subscribes still reads "on every mode change" while the code
  subscribes to both mode and site; the narrative docstring above it is correct
  and says "on every mode and site change". No behaviour differs, and
  reconciliation changes no runtime code — recorded so the stale comment is on
  the record rather than mistaken for a second opinion about the trigger.

## Dependencies

None within this bundle. Consumes existing platform capabilities: site rendering
and channels, the site store listing, and the publish path.

## Story Points

3