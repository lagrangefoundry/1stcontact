---
uid: capability-cbc62ad9
id: CAP-79
type: capability
title: Reproduction Import — Capture Bundle to Self-Contained Site
created_by: xgd
created_at: '2026-08-03T03:45:35.830555+00:00'
updated_at: '2026-08-03T03:45:35.830555+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: reproduction-import-self-contained-site
---

# Reproduction Import — Capture Bundle to Self-Contained Site

The operator-facing import that turns a capture bundle into a servable 1c site:
the reference's folded layout becomes the site's home page, every media handle
is bound to the bundle's own mirrored bytes, and each captured behaviour is
configured from facts the capture recorded — never invented.

Owns the two properties that make a reproduction trustworthy rather than merely
renderable:

- **Self-containment.** The imported site serves the reference's bytes from its
  own storage. A handle that still names the captured origin makes the page
  network-dependent and makes every perceptual comparison measure the network
  instead of the pipeline, so an unresolvable handle fails the import outright —
  there is no partial mode and no silent hotlink path.
- **Derivation, not invention.** A mounted behaviour's configuration comes from
  the capture alone; what the capture did not record is reported as a residual
  rather than defaulted into a fact.

Distinct from CAP-71 (the fold, which decides what L1 nodes a capture becomes),
CAP-78 (the page-shape rule and the render-time mount), CAP-73 (the analytic
gate, which re-folds a bundle read-only and is unaffected by this import), and
CAP-66 (the CLI's argument surface and output hygiene). This capability owns
only what the import must *produce* from a bundle.
