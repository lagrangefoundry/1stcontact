---
uid: report-4f1b02e8
id: REPORT-7826
type: report
title: 'Report: mode_override for story-a55c2f35'
created_by: xgd
created_at: '2026-11-01T19:50:07.093769+00:00'
updated_at: '2026-11-01T19:59:25.263986+00:00'
completed_at: null
last_field_updated: conformance_verdict
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
  files_touched:
  - apps/control-app/src/router.ts
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
  conformance_verdict: pass
  conformance_findings: []
---

# Mode override granted: code_frozen

REQ-170, an intent in scope, requires grant writes to be gated at the API on ownership of the scoped business and a grant without a business to be refused; the reference router does neither (ungated handlers, InvalidGrantError unmapped -> 500), so the settled tests AC2198/AC2199/AC2200 are right and the code is wrong.

Planner instructions for the batch:

The tests and ACs are right; the code in apps/control-app/src/router.ts is wrong in two places, and people.ts needs no change (it already throws InvalidGrantError with the exact sentences AC-2198/AC-2199 expect). (1) In the central error mapper, beside the InvalidPersonRecordError -> 400 mapping, map InvalidGrantError to 400 carrying the scrubbed message, so an empty business, an empty plan, and an unknown grant id on revoke answer 400 instead of 500. (2) Gate POST /api/grants, POST /api/grants/revoke and POST /api/people/status on ownsBusiness(deps.admission, scope.businessId) via requireScope(), exactly as the invite/record routes in this tree do: answer 403 with a sentence, and log a refusal event, before reading the body or touching D1, so no grant row or user status changes for a non-owner. Owners must still succeed. Keep the rest of each handler as it is. Then confirm the dependency suites stay green: if a REQ-170/REQ-189 or contacts-tab test drives these routes as a caller with no owner membership, give its fixture an owner membership (the REQ-185 model) rather than loosening the gate.

## Diff

```diff
diff --git a/apps/control-app/src/router.ts b/apps/control-app/src/router.ts
index 45402b1279..15c6cd39e5 100644
--- a/apps/control-app/src/router.ts
+++ b/apps/control-app/src/router.ts
@@ -37,6 +37,7 @@ import type { BrowserLauncher } from '../../../tools/generate/src/cli/capture/cf
 import type { HostDeps } from '../../../tools/generate/src/cli/ai/host-core'
 import { r2ReferenceStore } from '../../../tools/generate/src/store/r2-reference-store'
 import {
+  InvalidGrantError,
   InvalidInviteError,
   InvalidPersonRecordError,
   invitePerson,
@@ -925,6 +926,24 @@ async function routeUncached(
    */
   const identityEnv = env as unknown as IdentityEnv
 
+  /**
+   * The 403 for an owner write refused to a non-owner ([[REQ-170]], [[DOC-42]] §7).
+   *
+   * "THE GATE THAT MATTERS IS AT THE API." Opening or withdrawing a grant and
+   * suspending a login are owner acts on the scoped business; a refusal is
+   * logged and answered before the body is read, so nothing is written.
+   */
+  const refuseNonOwner = (event: string, refused: Scope, error: string): Response => {
+    console.warn(
+      JSON.stringify({
+        event,
+        businessId: refused.businessId,
+        email: deps.admission?.ok ? deps.admission.user.email : null,
+      }),
+    )
+    return json(403, { error })
+  }
+
   if (p === '/' || p === '/index.html') {
     return new Response(chromeHtml(), {
       status: 200,
@@ -1315,11 +1334,15 @@ async function routeUncached(
      * this route exists to keep.
      */
     if (p === PERSON_STATUS_PATH && method === 'POST') {
+      const scope = requireScope()
+      if (!ownsBusiness(deps.admission, scope.businessId)) {
+        return refuseNonOwner('person_status_refused', scope, 'Only an owner of this business may change who can sign in.')
+      }
       const body = await readJsonBody(request)
       const id = typeof body.id === 'string' ? body.id : ''
       const status = typeof body.status === 'string' ? body.status.trim() : ''
       if (status === '') return json(400, { error: 'A status is required.' })
-      return json(200, await setPersonStatus(identityEnv, requireScope(), id, status))
+      return json(200, await setPersonStatus(identityEnv, scope, id, status))
     }
 
     /**
@@ -1434,6 +1457,10 @@ async function routeUncached(
      * grant, which is what every row written so far is ([[REQ-184]]).
      */
     if (p === GRANTS_PATH && method === 'POST') {
+      const scope = requireScope()
+      if (!ownsBusiness(deps.admission, scope.businessId)) {
+        return refuseNonOwner('grant_refused', scope, 'Only an owner of this business may open a grant.')
+      }
       const body = await readJsonBody(request)
       return json(
         200,
@@ -1458,6 +1485,10 @@ async function routeUncached(
      * asking about a refusal is actually asking.
      */
     if (p === GRANT_REVOKE_PATH && method === 'POST') {
+      const scope = requireScope()
+      if (!ownsBusiness(deps.admission, scope.businessId)) {
+        return refuseNonOwner('grant_revoke_refused', scope, 'Only an owner of this business may withdraw a grant.')
+      }
       const body = await readJsonBody(request)
       await revokeGrant(identityEnv, typeof body.id === 'string' ? body.id : '')
       return json(200, { ok: true })
@@ -2019,6 +2050,13 @@ async function routeUncached(
       return json(400, { error: scrub(err.message) })
     }
 
+    // A GRANT THAT NAMES NO BUSINESS OR NO PLAN, OR A WITHDRAWAL OF AN ID THAT
+    // NAMES NO GRANT, IS THE OPERATOR'S ERROR ([[REQ-170]]) — 400 carrying the
+    // sentence that says what is missing, not the generic 500.
+    if (err instanceof InvalidGrantError) {
+      return json(400, { error: scrub(err.message) })
+    }
+
     // AN ID THAT NAMES NOBODY IN THIS BUSINESS IS 404 — the same non-oracle
     // answer `/api/people/detail` gives, and for the same reason: not found and
     // not yours must be indistinguishable, or the route becomes the existence

```