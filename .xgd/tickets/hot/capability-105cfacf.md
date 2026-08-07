---
uid: capability-105cfacf
id: CAP-88
type: capability
title: 'Site Asset Store: What This Site Can Reference'
created_by: xgd
created_at: '2026-08-07T04:28:35.542064+00:00'
updated_at: '2026-08-07T18:53:49.472960+00:00'
completed_at: null
last_field_updated: status
status: superseded
fields:
  name: site-asset-store
  superseded_by_uid: capability-b4ac88fc
---

# Capability: Site Asset Store

Everything that answers **"what assets does this site have, and what can each of
them be used for?"** — the site's own store of referenceable files, as a listable
surface in its own right.

This is deliberately held apart from two neighbours it is easy to confuse with:

- **CAP-80 (Asset Provenance & Licence Compliance)** answers *"where did this byte
  come from and what does its licence permit"*, at project level, over governed
  files. That is an obligation index, not a per-site listing; a site can reference
  a file whose licence question is settled elsewhere, and the two answers travel on
  the same file with entirely different shapes.
- **CAP-70 (Framework Substrate)** binds an asset *handle* to its served substance
  — that is about pixels reaching a page. This capability is about enumerating the
  store *before* anything references it.

## Scope

- **One listing, many consumers.** A single answer to "what can this site
  reference", shared by every caller that needs it: the operator at the command
  line, the builder origin, and any editing surface that must offer a closed
  choice of assets. Three consumers, one listing — never three ideas of what a
  site's assets are.
- **The union of the sources that disagree.** A site names its assets in two
  places that do not agree in practice: a declared registry inside the site
  definition (which carries descriptive metadata) and the site's draft asset
  directory (which carries the bytes). The listing reports both, with provenance,
  so an undeclared file is visible rather than invisible.
- **One handle vocabulary.** Every listed asset is identified by the same
  site-local reference form a page already holds, whatever form its source named
  it in — so a handle read from the listing can be written straight into a page.
- **Usage kind.** Each asset reports what it can be used for, so a caller that
  needs one kind (an image chooser) can narrow, while a browser of the whole store
  still sees everything.
- **Reachability independent of any editing gesture.** The store is answerable
  without opening, hovering or clicking anything on a page.

## Out of scope

- **Uploading, importing, converting or processing assets.** The store lists what
  exists.
- **Licence and provenance obligations** — CAP-80.
- **Serving an asset's bytes to a rendered page** — CAP-70.