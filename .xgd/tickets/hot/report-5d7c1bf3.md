---
uid: report-5d7c1bf3
id: REPORT-7824
type: report
title: 'Report: blocked_by_handoff for story-a55c2f35'
created_by: xgd
created_at: '2026-11-01T19:44:00.155604+00:00'
updated_at: '2026-11-01T19:44:00.155604+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-a55c2f35
  rule: code_frozen
  evidence: 'Ran `npx vitest run --config vitest.workers.config.mts tests/test_reconciliation_contacts_tab_editing.workers.test.ts
    -t ''AC2198|AC2199|AC2200''`: AC2198 expected 400 got 500 (line 504), AC2199 expected
    400 got 500 (line 550), AC2200 expected 403 got 200 (line 565). Read apps/control-app/src/people.ts:
    openGrant throws InvalidGrantError(''A grant must name the business it is for.''
    / ''A grant must name a plan.''), revokeGrant throws InvalidGrantError(''No such
    grant.'') at :724. Read apps/control-app/src/router.ts: the error mapper (~line
    2005-2027) maps InvalidInviteError/InvalidPersonRecordError/UnknownPersonError
    but never InvalidGrantError (grep finds no reference in router.ts); the GRANTS_PATH
    (:1436), GRANT_REVOKE_PATH (:1460) and PERSON_STATUS_PATH (:1317) handlers apply
    no ownsBusiness check, unlike PERSON_RECORD_PATH (:1353) and the invite route
    (:1407). Story story-a55c2f35 already flags both as CODE-ISSUEs for the code-issue
    lever; the ACs follow intent (REQ-170, REQ-180).'
  proposed_change: 'apps/control-app/src/router.ts only: (1) import InvalidGrantError
    from ''./people'' and add `if (err instanceof InvalidGrantError) return json(400,
    { error: scrub(err.message) })` to the error mapper next to the InvalidPersonRecordError
    branch; (2) at the top of the PERSON_STATUS_PATH, GRANTS_PATH and GRANT_REVOKE_PATH
    handlers, resolve `const scope = requireScope()` and `if (!ownsBusiness(deps.admission,
    scope.businessId)) return json(403, { error: ''Only an owner of this business
    may change its grants and logins.'' })` before any read or write, mirroring the
    record-route gate. No test or ticket changes are needed; the three UATs pass as
    written once these land.'
  batch_index: 0
  parent_report_uid: report-4a527199
  anchor_ticket: bundle-39edf66d
---

# Builder blocked by `code_frozen`

**Evidence**: Ran `npx vitest run --config vitest.workers.config.mts tests/test_reconciliation_contacts_tab_editing.workers.test.ts -t 'AC2198|AC2199|AC2200'`: AC2198 expected 400 got 500 (line 504), AC2199 expected 400 got 500 (line 550), AC2200 expected 403 got 200 (line 565). Read apps/control-app/src/people.ts: openGrant throws InvalidGrantError('A grant must name the business it is for.' / 'A grant must name a plan.'), revokeGrant throws InvalidGrantError('No such grant.') at :724. Read apps/control-app/src/router.ts: the error mapper (~line 2005-2027) maps InvalidInviteError/InvalidPersonRecordError/UnknownPersonError but never InvalidGrantError (grep finds no reference in router.ts); the GRANTS_PATH (:1436), GRANT_REVOKE_PATH (:1460) and PERSON_STATUS_PATH (:1317) handlers apply no ownsBusiness check, unlike PERSON_RECORD_PATH (:1353) and the invite route (:1407). Story story-a55c2f35 already flags both as CODE-ISSUEs for the code-issue lever; the ACs follow intent (REQ-170, REQ-180).

**Proposed change**: apps/control-app/src/router.ts only: (1) import InvalidGrantError from './people' and add `if (err instanceof InvalidGrantError) return json(400, { error: scrub(err.message) })` to the error mapper next to the InvalidPersonRecordError branch; (2) at the top of the PERSON_STATUS_PATH, GRANTS_PATH and GRANT_REVOKE_PATH handlers, resolve `const scope = requireScope()` and `if (!ownsBusiness(deps.admission, scope.businessId)) return json(403, { error: 'Only an owner of this business may change its grants and logins.' })` before any read or write, mirroring the record-route gate. No test or ticket changes are needed; the three UATs pass as written once these land.
