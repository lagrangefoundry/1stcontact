---
uid: capability-ccac1b1d
id: CAP-81
type: capability
title: Site Creation & Authoring Start Point
created_by: xgd
created_at: '2026-08-06T03:41:38.234612+00:00'
updated_at: '2026-08-07T15:41:08.218678+00:00'
completed_at: null
last_field_updated: status
status: superseded
fields:
  name: site-creation-authoring-start-point
  superseded_by_uid: capability-b4ac88fc
---

# Capability: Site Creation & Authoring Start Point

What a **newly created site is**, before anyone edits it.

Creating a site is the first command an author runs, and the artifact it leaves is
the whole of the author's starting position. This capability owns the guarantee
that the artifact is a *working page* rather than an empty shell: a complete
layout document — width ladder, document background, a laid-out root and one
visible run — that validates, renders and screenshots immediately, on the same
width ladder a reproduction keyframes at, in the site's own theme colours.

## Scope

- **The scaffolded page contract** — what a freshly created site's page carries,
  and that it satisfies the validated site-definition contract with no editing.
- **Immediate usability** — the render and screenshot commands succeed on a fresh
  site, so the eyes loop is available from the first command.
- **Conventions the author does not have to know** — the width ladder is the
  capture ladder rather than a restated literal, and colour comes from the site's
  own theme tokens rather than invented values.
- **One shape, no mode selection** — every created site carries the layout
  document; there is no opt-in and no second starter form.
- **Non-contamination of an import** — a reproduction import replaces the page
  document wholesale, so a scaffolded skeleton cannot leak into a reproduced site.

Out of scope: the layout language itself (owned by the framework substrate
capability), the reproduction pipeline, and everything an author does *after* the
first render.