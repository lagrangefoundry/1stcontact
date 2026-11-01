---
uid: report-4f1b02e8
id: REPORT-7826
type: report
title: 'Report: mode_override for story-a55c2f35'
created_by: xgd
created_at: '2026-11-01T19:50:07.093769+00:00'
updated_at: '2026-11-01T19:50:07.093769+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: story-a55c2f35
  anchor_ticket: bundle-39edf66d
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-7c2db52c
  quality_mode: reconcile
  justification: REQ-170, an intent in scope, requires grant writes to be gated at
    the API on ownership of the scoped business and a grant without a business to
    be refused; the reference router does neither (ungated handlers, InvalidGrantError
    unmapped -> 500), so the settled tests AC2198/AC2199/AC2200 are right and the
    code is wrong.
  files:
  - apps/control-app/src/router.ts
  rung: 1
  tip_evidence:
  - file: apps/control-app/src/router.ts
    lines: 5414-5450
  - file: apps/control-app/src/router.ts
    lines: 5067-5073
  - file: apps/control-app/src/router.ts
    lines: 8079-8093
  external_cause: null
  planner_trust_boundary: true
  granted_head: 888d9b9e272de2a54f7b084244f2c784dadc72fd
---

# Mode override granted: code_frozen

REQ-170, an intent in scope, requires grant writes to be gated at the API on ownership of the scoped business and a grant without a business to be refused; the reference router does neither (ungated handlers, InvalidGrantError unmapped -> 500), so the settled tests AC2198/AC2199/AC2200 are right and the code is wrong.

Planner instructions for the batch:

The tests and ACs are right; the code in apps/control-app/src/router.ts is wrong in two places, and people.ts needs no change (it already throws InvalidGrantError with the exact sentences AC-2198/AC-2199 expect). (1) In the central error mapper, beside the InvalidPersonRecordError -> 400 mapping, map InvalidGrantError to 400 carrying the scrubbed message, so an empty business, an empty plan, and an unknown grant id on revoke answer 400 instead of 500. (2) Gate POST /api/grants, POST /api/grants/revoke and POST /api/people/status on ownsBusiness(deps.admission, scope.businessId) via requireScope(), exactly as the invite/record routes in this tree do: answer 403 with a sentence, and log a refusal event, before reading the body or touching D1, so no grant row or user status changes for a non-owner. Owners must still succeed. Keep the rest of each handler as it is. Then confirm the dependency suites stay green: if a REQ-170/REQ-189 or contacts-tab test drives these routes as a caller with no owner membership, give its fixture an owner membership (the REQ-185 model) rather than loosening the gate.
