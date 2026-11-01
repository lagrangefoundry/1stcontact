---
uid: report-7c2db52c
id: REPORT-7825
type: report
title: 'Report: fix_plan for story-a55c2f35'
created_by: xgd
created_at: '2026-11-01T19:47:30.378129+00:00'
updated_at: '2026-11-01T19:58:14.462008+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-a55c2f35
  fix_iteration: 2
  items:
  - index: 0
    tests:
    - story-a55c2f35 — grants test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400
    - story-a55c2f35 — grants test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access
    - story-a55c2f35 — grants test_UAT_AC2200_grant_and_status_writes_are_refused_403_to_a_non_owner_and_allowed_to_an_owner
    dependency_tests:
    - test_UAT_AC2190_
    - test_UAT_AC2192_
    - test_UAT_AC2193_
    - test_UAT_AC2194_
    - test_UAT_AC2195_
    - test_UAT_AC2196_
    - test_UAT_AC2197_
    - test_UAT_AC2201_
    - test_UAT_AC2178_
    - test_UAT_AC2181_
    - test_UAT_AC2185_
    - test_UAT_FC_REQ-170_
    - test_UAT_FC_REQ-189_
    hypothesis: router.ts never maps InvalidGrantError to 400 (refusals from openGrant/revokeGrant
      fall to the generic 500) and the POST /api/grants, /api/grants/revoke and /api/people/status
      handlers carry no ownsBusiness gate
    instructions: 'The tests and ACs are right; the code in apps/control-app/src/router.ts
      is wrong in two places, and people.ts needs no change (it already throws InvalidGrantError
      with the exact sentences AC-2198/AC-2199 expect). (1) In the central error mapper,
      beside the InvalidPersonRecordError -> 400 mapping, map InvalidGrantError to
      400 carrying the scrubbed message, so an empty business, an empty plan, and
      an unknown grant id on revoke answer 400 instead of 500. (2) Gate POST /api/grants,
      POST /api/grants/revoke and POST /api/people/status on ownsBusiness(deps.admission,
      scope.businessId) via requireScope(), exactly as the invite/record routes in
      this tree do: answer 403 with a sentence, and log a refusal event, before reading
      the body or touching D1, so no grant row or user status changes for a non-owner.
      Owners must still succeed. Keep the rest of each handler as it is. Then confirm
      the dependency suites stay green: if a REQ-170/REQ-189 or contacts-tab test
      drives these routes as a caller with no owner membership, give its fixture an
      owner membership (the REQ-185 model) rather than loosening the gate.'
    test_scope: test_UAT_AC2198_ or test_UAT_AC2199_ or test_UAT_AC2200_ or test_UAT_AC2190_
      or test_UAT_AC2192_ or test_UAT_AC2193_ or test_UAT_AC2194_ or test_UAT_AC2195_
      or test_UAT_AC2196_ or test_UAT_AC2197_ or test_UAT_AC2201_ or test_UAT_AC2178_
      or test_UAT_AC2181_ or test_UAT_AC2185_ or test_UAT_FC_REQ-170_ or test_UAT_FC_REQ-189_
    ladder:
      rung1: 'Decided: REQ-170 (in BUNDLE-36) says the gate that matters is at the
        API with condition 1 ''you are an owner of this business'', and that a grant
        naming no business is refused, which a generic 500 is not.'
      rung2: 'The reference lacks both: router.ts:5414-5450 opens/revokes grants and
        5067-5073 sets status with no owner check, and the mapper at 8079-8093 has
        no InvalidGrantError case; rung 1 outranks it.'
      rung3: The tests stand; router.ts changes.
    override:
      rule: code_frozen
      rung: 1
      justification: REQ-170, an intent in scope, requires grant writes to be gated
        at the API on ownership of the scoped business and a grant without a business
        to be refused; the reference router does neither (ungated handlers, InvalidGrantError
        unmapped -> 500), so the settled tests AC2198/AC2199/AC2200 are right and
        the code is wrong.
      files:
      - apps/control-app/src/router.ts
      tip_evidence:
      - file: apps/control-app/src/router.ts
        lines: 5414-5450
      - file: apps/control-app/src/router.ts
        lines: 5067-5073
      - file: apps/control-app/src/router.ts
        lines: 8079-8093
      trust_boundary: true
  batches_pending: false
---

# Fix Plan — Iteration 2

## Hypothesis
`apps/control-app/src/router.ts` never maps `InvalidGrantError` to a 400 (so the grant refusals thrown by `openGrant`/`revokeGrant` fall through to the generic 500), and the handlers for `POST /api/grants`, `POST /api/grants/revoke` and `POST /api/people/status` carry no owner gate (so a non-owner member gets 200).

## Analysis
Iteration 1 was a mechanical plan with no instructions. The builder (report-839b67f9) made no edits, reported `blocked_by: code_frozen`, and gave a concrete diagnosis. I checked it against the reference `reconcile-src-BUNDLE-36`, and it holds:

- `people.ts:1107-1108` throws `InvalidGrantError('A grant must name the business it is for.' / 'A grant must name a plan.')`, and `people.ts:1175` throws `InvalidGrantError('No such grant.')`. These refusals are correct and need no change.
- The router's error mapper (`router.ts:8083-8093` at the reference) maps `InvalidPersonRecordError` to 400 and `UnknownPersonError` to 404, but never `InvalidGrantError`. So AC-2198 and AC-2199 get 500 where they expect 400.
- The grant handlers (`router.ts:5414-5450`) and the status handler (`router.ts:5067-5073`) call into `people.ts` with no ownership check. The record, invite and delegate routes in the same file do gate. So AC-2200 gets 200 where it expects 403.

The story recorded both of these at reconciliation as code issues ("grant routes are not owner-gated", "a refused grant is a 500") and left them for the code-issue lever. The tests and ACs are right, so this is not a test-shape problem. The failures are deterministic: they fail in isolation in workerd too, which rules out contamination.

The reference does not implement this behaviour, but an intent in scope requires it (REQ-170, rung 1). So the ruling is a `code_frozen` override, not `aligned_to_tip`.

Note for the builder: at the reference, the record route has since moved to `operatesBusiness` (owner or delegate, REQ-369), which is outside this bundle. AC-2200 tests owner against non-owner member, so use the same owner predicate the record and invite routes use in this tree (`ownsBusiness`). Do not invent a new predicate.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- `tests/test_UAT_FC_REQ-170_people.workers.test.ts::test_UAT_FC_REQ-170_a_grant_that_names_no_business_is_refused` — weak-observation — it likely asserts that `openGrant` throws at the function level, so it passed even though the HTTP route answered 500. Consider asserting the route's 400 too, or rely on AC2198 as the HTTP evidence.

## Batches
One batch: all three failures share one production file (`router.ts`) and one cause class (route-level refusal semantics).

## Mode overrides (REQ-892)
- Batch 0, rule `code_frozen`, files `apps/control-app/src/router.ts`, rung 1. REQ-170 (in scope) says "The gate that matters is at the API" with condition 1 "you are an owner of this business", and lists "a grant that names no business is refused". A generic 500 is a crash, not a refusal. The router's own convention for operator errors (the BUG-54 mapping at `router.ts:8079-8085`) is a 400 carrying the sentence. Dependency tests: the other contacts-tab editing ACs (AC2190–AC2201), contacts-tab ACs AC2178/AC2181/AC2185, and the REQ-170 and REQ-189 FC suites, which exercise `openGrant`/`revokeGrant`/`setPersonStatus`.

## Resolution ladder (REQ-938)
Batch 0: decided at rung 1. REQ-170, bundled in BUNDLE-36, requires grant refusals to be refusals and the API gate to require ownership of the scoped business. The reference (`router.ts:5414-5450`, `8083-8093`) lacks both, but rung 1 precedes rung 2. The tests stand, and `router.ts` changes.