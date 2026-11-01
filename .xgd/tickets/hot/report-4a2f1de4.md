---
uid: report-4a2f1de4
id: REPORT-7205
type: report
title: 'Report: mode_override for STORY-159'
created_by: xgd
created_at: '2026-11-01T02:05:20.524518+00:00'
updated_at: '2026-11-01T02:05:20.524518+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: STORY-159
  anchor_ticket: bundle-fd009b93
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-2db26efc
  quality_mode: reconcile
  justification: The reference state wires capture adoption into the Worker's fidelity
    surface (router.ts:596-647 at reconcile-src-BUNDLE-34) per in-scope REQ-166; AC-2080
    is a settled, valid test of that behaviour, the working-tree router omits the
    wiring, and code_frozen is the only barrier to the fix. This grants the builder's
    iteration-1 blocked_by request.
  files:
  - apps/control-app/src/router.ts
  rung: 2
  tip_evidence:
  - file: apps/control-app/src/router.ts
    lines: 596-647
  external_cause: null
  planner_trust_boundary: false
  granted_head: 06095b4cfbf56f993653955d3676227ee09393e4
---

# Mode override granted: code_frozen

The reference state wires capture adoption into the Worker's fidelity surface (router.ts:596-647 at reconcile-src-BUNDLE-34) per in-scope REQ-166; AC-2080 is a settled, valid test of that behaviour, the working-tree router omits the wiring, and code_frozen is the only barrier to the fix. This grants the builder's iteration-1 blocked_by request.

Planner instructions for the batch:

The test and AC-2080 are correct; the production wiring is missing (STORY-159 Known gap 8), and code_frozen is lifted for apps/control-app/src/router.ts only. Make sessionFidelity take the request's TicketStore (it is in scope at its one call site, router.ts:150-151, which already passes `tickets` to workerHost). Build an `adopt(bundle)` function that calls `adoptCapture(tickets, references.bundle(bundle), {}, { index: deps.index ? await deps.index(env) : await defaultIndexer(env), describeImage: deps.describeImage ?? defaultDescriber(env) })` and returns `{ uid: adopted.ticket.uid, created: adopted.created }`. Those are the same seams /api/material resolves at router.ts:752-753. Resolve the indexer inside `adopt` (per adoption), not once per host. Pass `adopt` as fidelityDeps's adoptCapture argument after the launch options. Do not pass clientDomain: REQ-474's clientSiteHosts is out of scope and absent from this tree. Do not edit shot.ts, fidelity-core.ts, capture-material.ts, the test or the AC. AC-2080 must pass with reference.adopted === true and the member set equal to the bundle's list, and the dependency tests must stay green.
