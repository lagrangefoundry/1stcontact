---
uid: story-e674c60a
id: STORY-99
type: story
title: 'The builder workspace: one browser surface showing my real rendered site,
  with the controls that act on it, served from a single origin'
created_by: xgd
created_at: '2026-08-07T01:42:20.886527+00:00'
updated_at: '2026-08-07T20:09:44.120311+00:00'
completed_at: null
last_field_updated: body
status: completed
fields:
  intent_uid: bundle-15c1f647
  capability_uid: capability-a994b8f3
  story_kind: feature
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
  components it is built from, its own browser code, the shared client code the
  editing gesture runs in the displayed page, and every rendering of every site
  in the store are all reachable from one origin. The client code is *served*
  from the same source the renderer is built from rather than reimplemented as a
  browser copy — it reads a marking the renderer writes, and a second
  hand-written copy would be free to drift from the markup it reads. What that
  code does once it runs belongs to the editing capability; this story owns only
  that it is reachable here, and as one implementation. That is not a
  convenience: it is why the frame showing the site is not a foreign document,
  and why "open this properly in a new tab" lands on the identical URL the frame
  is already displaying rather than a lookalike.
- **Chrome built from shared components, consumed not copied.** The workspace is
  assembled from the shared UI components the wider system already ships. They
  are consumed from an installed copy that lives outside this repository, and
  the workspace references each one through the entry point that component
  itself declares — so an upstream file move is reported here, at the origin,
  rather than becoming a broken reference in the browser. No component source is
  copied in, and none is patched or wrapped: a gap in a component is closed
  where the component lives. Because the install is deliberate and out-of-band,
  a machine that has not run it gets a message naming the missing component and
  the command that installs it, not a blank page.
- **One tab, filling the window.** The workspace opens on a single tab hosting
  the display panel. The displayed site tracks the browser window's height and
  follows a live resize, and the workspace page itself never scrolls — a frame
  that collapses to a few lines tall is the failure this exists to prevent, and
  a page-level scrollbar is the visible sign that the height chain has leaked
  again. A tab is declared once and whole, and every option in that declaration
  reaches the chrome that mounts it intact: adding an option to the declaration
  requires no change at the mounting step, and no declared option is silently
  discarded — a dropped option throws nothing and warns nothing, it simply stops
  being honoured, which is how the window-filling behaviour was lost once
  already. Every name the workspace shows has exactly one definition site, so
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
  shows the editable rendering; the gesture that changes anything is not. This
  story adds only that the write path is *reachable* over this origin, and that
  the client code the gesture runs is *served* from it — never what that path
  validates, writes or refuses, and never what that code does once it runs.
- The assistant pane (a placeholder here) and any chat behaviour.
- Producing the renderings. The workspace displays channels other capabilities
  render, and never renders one itself.
- Any change to a shared UI component.

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
- **The component dependency is implicit — a known, accepted coverage gap.**
  Nothing in this repository's manifest records the shared UI components; they
  arrive from a deliberate out-of-band install into a shared artifact store. A
  fresh clone therefore has none of them, and the suites that mount real
  components skip with a stated, reported reason rather than passing silently. A
  green run on such a machine proves less than it appears to; treat the
  component-mounting evidence as unverifiable until a private registry exists.
  Components are never mocked in that evidence — mocking them would prove
  nothing about the consumption route, which is most of this story's risk.
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