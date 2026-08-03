---
uid: capability-68df54bd
id: CAP-78
type: capability
title: Page Composition — Behaviors Mounted into L1 Seams
created_by: xgd
created_at: '2026-08-03T03:19:23.048704+00:00'
updated_at: '2026-08-03T03:19:23.048704+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: page-composition-l1-mounted-behaviors
---

# Page Composition — Behaviors Mounted into L1 Seams

How a page combines its two halves: one L1 document that IS the page body, and
the behavior modules mounted into it at declared seams. Owns the page-shape
rule (a module accompanies an L1 body only when it is bound by name to a seam
present in that body), the exhaustive resolution of every binding, the fold's
recovery of behaviour seams from captured controls, the render-time mount of a
bound module's fragment into its seam, and the conformance of a behaviour in
its mounted position.

Distinct from CAP-70 (the L1 substrate, which owns the typed axes and the seam
node itself), from CAP-72 (a behavior module's own contract and its named
presentation slots), and from CAP-71 (the fold, which owns how painted pixels
become L1 nodes). This capability owns only the seam between them: who may
mount where, and what happens when a binding does not resolve.
