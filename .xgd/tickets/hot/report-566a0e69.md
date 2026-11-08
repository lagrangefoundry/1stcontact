---
uid: report-566a0e69
id: REPORT-11296
type: report
title: 'Report: blocked_by_handoff for story-4cabde9a'
created_by: xgd
created_at: '2026-11-08T05:53:02.202874+00:00'
updated_at: '2026-11-08T05:53:02.202874+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-4cabde9a
  rule: code_frozen
  evidence: 'With the storeFor scope fix applied, `npx vitest run tests/reconciliation-material-description-session.workers.test.ts`
    still fails AC2097 (images.seen has length 0) and AC2378 (image.status ''failed'').
    tests/test_UAT_FC_REQ-207_image_describer_session.test.ts shows the cause: BackendError
    "The ''material_image_describer'' backend declares no vision capability", raised
    from @lagrangefoundry/ai src/backend.js:228 via apps/control-app/src/ai.ts:207.
    ai.ts:189 registers the backend with `lib.registerBackend(name, () => backend)`
    and declares no capabilities; the library defaults vision=false (backend.js:166)
    and checks backendCapabilities(name).vision before sending image content (backend.js:220-225).'
  proposed_change: 'apps/control-app/src/ai.ts describerSession(): register the image
    describer''s backend with the vision capability declared, e.g. give describerSession
    a capabilities argument and have sessionImageDescriber pass { vision: true } through
    to lib.registerBackend in the form @lagrangefoundry/ai''s registerBackend accepts;
    ClaudeAPIBackend itself reports vision: true in backends/claude_api.js:202. The
    text describer stays as it is. No test changes needed: once the image backend
    can see, AC2097, AC2378 and the FC_REQ-207 UATs should pass.'
  batch_index: 0
  parent_report_uid: report-e0c6bd0b
  anchor_ticket: bundle-c0301347
---

# Builder blocked by `code_frozen`

**Evidence**: With the storeFor scope fix applied, `npx vitest run tests/reconciliation-material-description-session.workers.test.ts` still fails AC2097 (images.seen has length 0) and AC2378 (image.status 'failed'). tests/test_UAT_FC_REQ-207_image_describer_session.test.ts shows the cause: BackendError "The 'material_image_describer' backend declares no vision capability", raised from @lagrangefoundry/ai src/backend.js:228 via apps/control-app/src/ai.ts:207. ai.ts:189 registers the backend with `lib.registerBackend(name, () => backend)` and declares no capabilities; the library defaults vision=false (backend.js:166) and checks backendCapabilities(name).vision before sending image content (backend.js:220-225).

**Proposed change**: apps/control-app/src/ai.ts describerSession(): register the image describer's backend with the vision capability declared, e.g. give describerSession a capabilities argument and have sessionImageDescriber pass { vision: true } through to lib.registerBackend in the form @lagrangefoundry/ai's registerBackend accepts; ClaudeAPIBackend itself reports vision: true in backends/claude_api.js:202. The text describer stays as it is. No test changes needed: once the image backend can see, AC2097, AC2378 and the FC_REQ-207 UATs should pass.
