---
uid: capability-a994b8f3
id: CAP-85
type: capability
title: 'Builder Workspace: Chrome, Origin & Display Panel'
created_by: xgd
created_at: '2026-08-07T01:41:35.258770+00:00'
updated_at: '2026-08-07T21:28:48.746352+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  name: builder_workspace
  uat_coverage: pass
---

# Capability: Builder Workspace — Chrome, Origin & Display Panel

**The operator-facing surface a site is worked on: one workspace in a browser
that shows the operator's own rendered site beside the controls that act on it,
served from a single origin so the page on screen and the page in a new tab are
the same document.**

Everything the platform has built so far is reachable only from a command line:
a site is rendered, listed, previewed and published by typing. This capability
owns the surface where an operator sees the site instead — the chrome that hosts
it, the origin that serves it, and the pane that displays a chosen rendering of
a chosen site.

The workspace is composed from shared, vetted UI components that are consumed
from an installed artifact store rather than copied in, so the chrome this
product presents stays in step with the components' own upstream without this
repository holding a private fork of them.

## Scope

- **Component consumption** — how the shared UI components enter this product:
  resolved from an installed copy through each component's own declared entry
  points, never vendored, with a single point of failure that names how to
  install a missing one.
- **The workspace origin** — one host serving the workspace document, its
  components, its browser source, the shared client code the editing gesture
  runs in the displayed page (served from the same source the renderer is built
  from, so the two cannot drift), and any rendered channel of any site in the
  store, plus the operations the workspace performs (listing the store,
  publishing, and carrying the write path's read/apply operations as a thin
  transport that adds no semantics of its own, so that a refused edit arrives as
  an expected refusal in the write path's own terms). An unconfigured origin and
  an unreachable one are distinct, self-explanatory failures rather than a blank
  page. Every tree it serves is confined, and every response it returns
  is treated as stale-on-arrival because it rewrites its own bytes underneath
  the browser.
- **The chrome** — a single-tab workspace whose displayed area fills the browser
  window, with one definition site for every name it shows.
- **The display panel** — a pane that can show any of several registered modes
  of the current site, where adding a mode is an added entry rather than a new
  branch, and switching modes swaps what is displayed without rebuilding the
  pane.
- **The toolbar** — the controls the active mode declares, over the real site
  store and the existing publish path.
- **Workspace layout state** — the split between the display panel and the
  secondary pane, and which site and mode are shown, persisted per workspace.

## Out of scope

- **The editing gesture** — clicking a segment, the field modal, and the write
  path behind it. Those are separate capabilities; this one owns only the
  surface they are hosted on.
- **Edit semantics** — what the write path validates, writes and refuses, and
  what a refusal carries, belong to the write-path capability. This one owns
  only that those operations are reachable over the workspace origin, as a
  transport that changes none of it. Likewise what the editing gesture's client
  code *does* once the browser runs it belongs to the editing capability; this
  one owns only that those bytes are served from this origin.
- **The renderings themselves** — the draft, published and edit channels are
  produced elsewhere; the workspace displays them and never produces them.
- **Publish semantics** — the workspace invokes the existing publish behaviour
  and adds none of its own.
- **Where the render runs.** This capability fixes what an operator sees and
  where it is addressed from, not whether the bytes were produced ahead of time
  or at request time.