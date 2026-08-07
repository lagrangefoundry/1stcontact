---
uid: story-e674c60a
id: STORY-99
type: story
title: 'The builder workspace: one browser surface showing my real rendered site,
  with the controls that act on it, served from a single origin'
created_by: xgd
created_at: '2026-08-07T01:42:20.886527+00:00'
updated_at: '2026-08-07T23:16:43.442610+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-15c1f647
  capability_uid: capability-a994b8f3
  story_kind: upgrade
  story_points: 3
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
- **A toolbar the active mode declares.** The strip renders exactly the controls
  the active mode names, so a mode showing something other than a document
  simply does not offer "open in a new tab" and the strip never assumes a
  document beneath it. The controls act on real things: the site selector lists
  the sites the store actually holds, and publish goes through the platform's
  existing publish behaviour and adds no semantics of its own.
- **A split, and it remembers.** The display panel sits beside a secondary pane
  (a placeholder for the assistant that arrives later) with a draggable divider
  that collapses to a rail and reopens to its previous width. The divider
  position, the collapsed side, and which site and mode were being shown all
  survive closing and reopening the workspace, and every stored value is
  namespaced to this workspace.
- **Freshness over caching.** The origin rewrites the bytes it serves underneath
  the browser — a rendered channel is re-produced while the frame is displaying
  it — so every response it returns, the workspace document included, is served
  as non-cacheable. One exempt response is enough to leave an operator looking at
  a stale page that appears to be working.
- **Confinement.** Several distinct file trees are served — rendered channels,
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
- The assistant pane (a placeholder here) and any chat behaviour.
- Producing the renderings. The workspace displays channels other capabilities
  render, and never renders one itself.
- Any change to a shared UI component. Consuming the components under a renamed
  scope is not such a change: the components themselves stay untouched, and the
  name they are published under is owned upstream, not decided here.

## Technical Context

- **Displays, never produces.** The workspace shows the draft, published and
  editable channels produced by CAP-82 (Site Delivery) and CAP-84 (Edit Render
  Channel), lists the store, and invokes the existing publish path. It adds no
  rendering and no publish semantics.
- **The editable mode is registered, not implemented, here.** Registering it is
  what proves the mode contract with two real modes; the editable render belongs
  to CAP-84 and the editing gesture to its own story.
- **The origin runs outside the edge Worker, and that is deliberate and
  temporary.** Everything the workspace needs beyond its own chrome is
  filesystem-bound (rendered output, the store listing, publish), which the edge
  runtime cannot do; the two bundler routes that could have inlined the bytes
  were both spiked and both made the Worker untestable. So the origin is a local
  Node process and the Worker is a single verbatim front over it. A later phase
  moves rendering into the Worker at request time and deletes the front. The
  acceptance criteria here are written about *one origin* and *what an operator
  observes*, not about a proxy, so they survive that change unaltered.
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
  mocked, aliased or vendored in either kind of evidence: doing so would prove
  nothing about the consumption route, which is most of this story's risk. It
  follows that the artifact store must be resolvable from wherever the evidence
  runs — including a detached working tree of this repository, which does not
  inherit the main checkout's neighbours. That is an environment precondition,
  not a code defect, and a failure to resolve should be read as one.
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

## Dependencies

None within this bundle. Consumes existing platform capabilities: site rendering
and channels, the site store listing, and the publish path.

## Story Points

3