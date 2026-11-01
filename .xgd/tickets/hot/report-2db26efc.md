---
uid: report-2db26efc
id: REPORT-7204
type: report
title: 'Report: fix_plan for STORY-159'
created_by: xgd
created_at: '2026-11-01T02:03:31.897816+00:00'
updated_at: '2026-11-01T02:03:31.897816+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: STORY-159
  fix_iteration: 2
  items:
  - index: 0
    tests:
    - tests/test_reconciliation_capture_site_reference_material.workers.test.ts::test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member
    dependency_tests:
    - test_UAT_AC2044_
    - test_UAT_AC2081_
    - test_UAT_AC2082_
    - test_UAT_AC2083_
    - test_UAT_AC2084_
    - test_UAT_AC2024_
    - test_UAT_AC2025_
    - test_UAT_FC_REQ-166_
    - test_UAT_FC_REQ-157_
    hypothesis: sessionFidelity in apps/control-app/src/router.ts:169-192 never passes
      an adoptCapture function to fidelityDeps (shot.ts:165-188 accepts one), so fidelity-core.ts:352
      takes the 'no corpus' branch and the deployed Worker writes no reference ticket.
    instructions: 'The test and AC-2080 are correct; the production wiring is missing
      (STORY-159 Known gap 8), and code_frozen is lifted for apps/control-app/src/router.ts
      only. Make sessionFidelity take the request''s TicketStore (it is in scope at
      its one call site, router.ts:150-151, which already passes `tickets` to workerHost).
      Build an `adopt(bundle)` function that calls `adoptCapture(tickets, references.bundle(bundle),
      {}, { index: deps.index ? await deps.index(env) : await defaultIndexer(env),
      describeImage: deps.describeImage ?? defaultDescriber(env) })` and returns `{
      uid: adopted.ticket.uid, created: adopted.created }`. Those are the same seams
      /api/material resolves at router.ts:752-753. Resolve the indexer inside `adopt`
      (per adoption), not once per host. Pass `adopt` as fidelityDeps''s adoptCapture
      argument after the launch options. Do not pass clientDomain: REQ-474''s clientSiteHosts
      is out of scope and absent from this tree. Do not edit shot.ts, fidelity-core.ts,
      capture-material.ts, the test or the AC. AC-2080 must pass with reference.adopted
      === true and the member set equal to the bundle''s list, and the dependency
      tests must stay green.'
    test_scope: test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member
      or test_UAT_AC2044_ or test_UAT_AC2081_ or test_UAT_AC2082_ or test_UAT_AC2083_
      or test_UAT_AC2084_ or test_UAT_AC2024_ or test_UAT_AC2025_ or test_UAT_FC_REQ-166_
      or test_UAT_FC_REQ-157_
    ladder:
      rung1: REQ-166 (in scope) requires a finished capture to be adopted as reference
        material on the deployed host; no later in-scope intent contradicts it.
      rung2: 'Decided here: at reconcile-src-BUNDLE-34, apps/control-app/src/router.ts:596-647
        builds adopt -> adoptCapture and passes it to fidelityDeps from sessionFidelity;
        the working tree omits it.'
      rung3: AC-2080's test stands; router.ts changes to satisfy it.
    override:
      rule: code_frozen
      rung: 2
      justification: The reference state wires capture adoption into the Worker's
        fidelity surface (router.ts:596-647 at reconcile-src-BUNDLE-34) per in-scope
        REQ-166; AC-2080 is a settled, valid test of that behaviour, the working-tree
        router omits the wiring, and code_frozen is the only barrier to the fix. This
        grants the builder's iteration-1 blocked_by request.
      files:
      - apps/control-app/src/router.ts
      tip_evidence:
      - file: apps/control-app/src/router.ts
        lines: 596-647
      trust_boundary: false
---

# Fix Plan — Iteration 2

## Hypothesis
`sessionFidelity` in `apps/control-app/src/router.ts:169-192` calls `fidelityDeps(...)` without the `adoptCapture` argument that `shot.ts:150-188` already accepts, so `fidelity-core.ts:352` takes the "no corpus" branch and the deployed Worker never writes the reference ticket.

## Analysis
- One failing test: `test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member` (tests/test_reconciliation_capture_site_reference_material.workers.test.ts:373). It fails at line 415 with `reference.adopted === false` and the reason "this deployment keeps no corpus, so the bundle was stored but not indexed".
- In iteration 1 (report-7b5ac912) the builder confirmed the test and AC are correct. It reported `blocked_by: code_frozen` because the gap is in production wiring, and it made no edits. I confirmed that diagnosis independently.
  - Working tree: router.ts:169-192 `sessionFidelity(env, deps, store, tenantId, origin)` has no ticket store and passes no adopt function to `fidelityDeps`.
  - Every piece the fix needs already exists in the working tree: `adoptCapture` (capture-material.ts:181), the optional `adoptCapture` parameter of `fidelityDeps` (shot.ts:165-188), and the indexer/describer seams `defaultIndexer` / `defaultDescriber` (router.ts:378, 391), which `/api/material` already resolves at router.ts:752-753. `tickets` is in scope at the only call site (router.ts:150-151).
- Reference state `reconcile-src-BUNDLE-34`, apps/control-app/src/router.ts:566-647: `sessionFidelity` takes `tickets`, builds an `adopt(bundle)` closure over `adoptCapture(tickets, references.bundle(bundle), …, { index, describeImage })` using the same `/api/material` seams, and passes `adopt` as `fidelityDeps`'s adoption argument. The comment there cites [[REQ-166]] (in scope for this bundle) and says adoption is "PART OF THIS TICKET RATHER THAN A FOLLOW-ON".
- AC-2080 itself states it is expected to fail until the router supplies adoption (STORY-159 Known gap 8). The test, the AC, REQ-166 and the reference state all agree. The code is the only thing that disagrees.
- This is not cross-suite contamination: the test also fails in isolated runs, for a deterministic reason.
- The reference's `clientDomain: await clientSiteHosts(tickets)` comes from REQ-474, which is not in this bundle and has no helper in the working tree. It is not needed for AC-2080. Pass no `clientDomain`; captures then default to the conservative third-party marking.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
none

## Batches
Batch 0 (single batch): AC-2080, with the other ACs in the same file (AC-2044, AC-2081..AC-2084), the REQ-166 adoption FC tests and the looking-surface worker tests (AC-2024, AC-2025, REQ-157 FC) as dependency tests. All of them consume the router's fidelity composition, so they share the one file being edited.

## Mode overrides (REQ-892)
- Batch 0 — rule `code_frozen` — files: `apps/control-app/src/router.ts` — rung 2: at reconcile-src-BUNDLE-34, router.ts:596-647 composes `adoptCapture` into `fidelityDeps` from `sessionFidelity`. That is the user's intent for REQ-166 (in scope). AC-2080 is a settled, valid test of it. The working-tree router omits the wiring, and only `code_frozen` stops the fix. This grants the builder's iteration-1 `blocked_by` request.

## Resolution ladder (REQ-938)
- Batch 0 — decided at **rung 2** (rung 1 agrees). Rung 1: REQ-166 (in scope) requires capture adoption into reference material on the deployed host, and no later in-scope intent contradicts it. Rung 2: reconcile-src-BUNDLE-34 router.ts:596-647 wires `adopt` → `adoptCapture` into `fidelityDeps`. Rung 3: AC-2080's test stands, and router.ts changes.
