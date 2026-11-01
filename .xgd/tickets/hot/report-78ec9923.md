---
uid: report-78ec9923
id: REPORT-7203
type: report
title: 'Report: blocked_by_handoff for STORY-159'
created_by: xgd
created_at: '2026-11-01T02:02:08.415462+00:00'
updated_at: '2026-11-01T02:02:08.415462+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: blocked_by_handoff
  subject_uid: STORY-159
  rule: code_frozen
  evidence: 'Ran `npx vitest run tests/test_reconciliation_capture_site_reference_material.workers.test.ts
    -t test_UAT_AC2080` → AssertionError at line 415: ''this deployment keeps no corpus,
    so the bundle was stored but not indexed: expected false to be true''. Read apps/control-app/src/router.ts:169-192:
    sessionFidelity calls fidelityDeps(env, previewRenderer(store), references, origin,
    site, launchOpts) without the optional adoptCapture argument that shot.ts:165-188
    accepts, so fidelity-core.ts:352 takes the ''no corpus'' branch. AC-2080 body
    states ''expected to FAIL against current code. The Worker router does not supply
    the adoption dependency (STORY-159 Known gap 8)'' — the AC and the story describe
    the intended behaviour; only production code is wrong.'
  proposed_change: 'apps/control-app/src/router.ts: give sessionFidelity the request''s
    ticket store (the `tickets` already built in the chat-host closure next to line
    150) and pass a seventh argument to fidelityDeps: `async (bundle) => { const a
    = await adoptCapture(tickets, references.bundle(bundle)); return { uid: a.ticket.uid,
    created: a.created } }`, importing adoptCapture from ''./capture-material''. Leave
    the test and AC-2080 unchanged; once this lands, remove the ''expected to FAIL''
    note from AC-2080 and close Known gap 8 on STORY-159.'
  batch_index: 0
  parent_report_uid: report-1b0fd3cd
  anchor_ticket: bundle-fd009b93
---

# Builder blocked by `code_frozen`

**Evidence**: Ran `npx vitest run tests/test_reconciliation_capture_site_reference_material.workers.test.ts -t test_UAT_AC2080` → AssertionError at line 415: 'this deployment keeps no corpus, so the bundle was stored but not indexed: expected false to be true'. Read apps/control-app/src/router.ts:169-192: sessionFidelity calls fidelityDeps(env, previewRenderer(store), references, origin, site, launchOpts) without the optional adoptCapture argument that shot.ts:165-188 accepts, so fidelity-core.ts:352 takes the 'no corpus' branch. AC-2080 body states 'expected to FAIL against current code. The Worker router does not supply the adoption dependency (STORY-159 Known gap 8)' — the AC and the story describe the intended behaviour; only production code is wrong.

**Proposed change**: apps/control-app/src/router.ts: give sessionFidelity the request's ticket store (the `tickets` already built in the chat-host closure next to line 150) and pass a seventh argument to fidelityDeps: `async (bundle) => { const a = await adoptCapture(tickets, references.bundle(bundle)); return { uid: a.ticket.uid, created: a.created } }`, importing adoptCapture from './capture-material'. Leave the test and AC-2080 unchanged; once this lands, remove the 'expected to FAIL' note from AC-2080 and close Known gap 8 on STORY-159.
