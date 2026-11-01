---
uid: report-839b67f9
id: REPORT-7823
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T19:43:56.267755+00:00'
updated_at: '2026-11-01T19:43:56.267755+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-a55c2f35
  parent_report_uid: report-4a527199
  batch_index: '0'
---

I made no edits. All three failures need a change to production code, which this mode freezes (`code_frozen`). The tests and the ACs match what the intent asks for; the code doesn't.

I ran the three tests in workerd (`vitest.workers.config.mts`) and all three fail:

- **AC2198 (refused grant, 504:31):** opening a grant with an empty business returns 500, not 400. `openGrant` (`people.ts`) does throw `InvalidGrantError('A grant must name the business it is for.')`, and also `'A grant must name a plan.'`. But the error mapper in `router.ts` (around line 2005) maps `InvalidInviteError`, `InvalidPersonRecordError` and `UnknownPersonError`, and never `InvalidGrantError`. So the refusal falls through to the generic 500. `grep InvalidGrantError router.ts` finds nothing.
- **AC2199 (unknown id, 550:28):** revoking an id that names no grant returns 500, not 400. Same cause: `revokeGrant` (`people.ts:724`) throws `InvalidGrantError('No such grant.')`, which isn't mapped.
- **AC2200 (owner gate, 565:55):** a member who is not an owner opens a grant and gets 200, not 403. The handlers for `POST /api/grants` (`router.ts:1436`), `/api/grants/revoke` (`:1460`) and `/api/people/status` (`:1317`) never call `ownsBusiness`. The record route (`:1353`) and the invite route (`:1407`) do.

These are exactly the two code issues the story recorded at reconciliation ("grant routes are not owner-gated" and "a refused grant is a 500"), left for the code-issue lever. Weakening the tests or rewriting the ACs to bless a 500 and ungated grant writes would go against REQ-170 and REQ-180. So the fix belongs in production code and needs a planner exception to `code_frozen`.

```yaml
## Assessment
blocked_by:
  rule: code_frozen
  evidence: "Ran `npx vitest run --config vitest.workers.config.mts tests/test_reconciliation_contacts_tab_editing.workers.test.ts -t 'AC2198|AC2199|AC2200'`: AC2198 expected 400 got 500 (line 504), AC2199 expected 400 got 500 (line 550), AC2200 expected 403 got 200 (line 565). Read apps/control-app/src/people.ts: openGrant throws InvalidGrantError('A grant must name the business it is for.' / 'A grant must name a plan.'), revokeGrant throws InvalidGrantError('No such grant.') at :724. Read apps/control-app/src/router.ts: the error mapper (~line 2005-2027) maps InvalidInviteError/InvalidPersonRecordError/UnknownPersonError but never InvalidGrantError (grep finds no reference in router.ts); the GRANTS_PATH (:1436), GRANT_REVOKE_PATH (:1460) and PERSON_STATUS_PATH (:1317) handlers apply no ownsBusiness check, unlike PERSON_RECORD_PATH (:1353) and the invite route (:1407). Story story-a55c2f35 already flags both as CODE-ISSUEs for the code-issue lever; the ACs follow intent (REQ-170, REQ-180)."
  proposed_change: "apps/control-app/src/router.ts only: (1) import InvalidGrantError from './people' and add `if (err instanceof InvalidGrantError) return json(400, { error: scrub(err.message) })` to the error mapper next to the InvalidPersonRecordError branch; (2) at the top of the PERSON_STATUS_PATH, GRANTS_PATH and GRANT_REVOKE_PATH handlers, resolve `const scope = requireScope()` and `if (!ownsBusiness(deps.admission, scope.businessId)) return json(403, { error: 'Only an owner of this business may change its grants and logins.' })` before any read or write, mirroring the record-route gate. No test or ticket changes are needed; the three UATs pass as written once these land."
```
