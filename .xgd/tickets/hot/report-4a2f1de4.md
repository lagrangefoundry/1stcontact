---
uid: report-4a2f1de4
id: REPORT-7205
type: report
title: 'Report: mode_override for STORY-159'
created_by: xgd
created_at: '2026-11-01T02:05:20.524518+00:00'
updated_at: '2026-11-01T02:10:01.974901+00:00'
completed_at: null
last_field_updated: files_touched
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
  files_touched:
  - apps/control-app/src/router.ts
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
---

# Mode override granted: code_frozen

The reference state wires capture adoption into the Worker's fidelity surface (router.ts:596-647 at reconcile-src-BUNDLE-34) per in-scope REQ-166; AC-2080 is a settled, valid test of that behaviour, the working-tree router omits the wiring, and code_frozen is the only barrier to the fix. This grants the builder's iteration-1 blocked_by request.

Planner instructions for the batch:

The test and AC-2080 are correct; the production wiring is missing (STORY-159 Known gap 8), and code_frozen is lifted for apps/control-app/src/router.ts only. Make sessionFidelity take the request's TicketStore (it is in scope at its one call site, router.ts:150-151, which already passes `tickets` to workerHost). Build an `adopt(bundle)` function that calls `adoptCapture(tickets, references.bundle(bundle), {}, { index: deps.index ? await deps.index(env) : await defaultIndexer(env), describeImage: deps.describeImage ?? defaultDescriber(env) })` and returns `{ uid: adopted.ticket.uid, created: adopted.created }`. Those are the same seams /api/material resolves at router.ts:752-753. Resolve the indexer inside `adopt` (per adoption), not once per host. Pass `adopt` as fidelityDeps's adoptCapture argument after the launch options. Do not pass clientDomain: REQ-474's clientSiteHosts is out of scope and absent from this tree. Do not edit shot.ts, fidelity-core.ts, capture-material.ts, the test or the AC. AC-2080 must pass with reference.adopted === true and the member set equal to the bundle's list, and the dependency tests must stay green.

## Diff

```diff
diff --git a/apps/control-app/src/router.ts b/apps/control-app/src/router.ts
index 0d1855ad3a..fbf7762002 100644
--- a/apps/control-app/src/router.ts
+++ b/apps/control-app/src/router.ts
@@ -25,6 +25,7 @@ import {
 } from '../../../tools/generate/src/cli/ai/host-core'
 import { sessionTextDescriber, workerHost, type WorkerHost } from './ai'
 import { fidelityDeps } from './shot'
+import { adoptCapture } from './capture-material'
 import type { BrowserLauncher } from '../../../tools/generate/src/cli/capture/cf-driver'
 import type { HostDeps } from '../../../tools/generate/src/cli/ai/host-core'
 import { r2ReferenceStore } from '../../../tools/generate/src/store/r2-reference-store'
@@ -147,7 +148,7 @@ function chatHost(env: RouterEnv, deps: RouterDeps, origin: string): Promise<Wor
       // the project corpus is the tenant's real D1 store either way.
       const system = await (deps.knowledge ?? systemKnowledge)(env)
       const knowledge = await sessionKnowledgeFor(env, { system, tickets })
-      const fidelity = await sessionFidelity(env, deps, store, tenantId, origin)
+      const fidelity = await sessionFidelity(env, deps, store, tickets, tenantId, origin)
       return workerHost(env, store, tenantId, tickets, knowledge, fidelity)
     })()
   }
@@ -170,6 +171,7 @@ async function sessionFidelity(
   env: RouterEnv,
   deps: RouterDeps,
   store: TenantSiteStore,
+  tickets: TicketStore,
   tenantId: string,
   origin: string,
 ): Promise<HostDeps['fidelity']> {
@@ -177,6 +179,22 @@ async function sessionFidelity(
   if (!env.BLOBS) return null
   // The client's own private bucket, bound to THIS tenant by `forTenant`.
   const references = await r2ReferenceStore({ DB: env.DB, BLOBS: env.BLOBS }).forTenant(tenantId)
+  // A finished bundle becomes a findable `reference` ticket ([[REQ-166]]),
+  // through the same indexer and describer `/api/material` resolves. The
+  // indexer is resolved PER ADOPTION, not once per host, so a deployment whose
+  // index binding changes is not stuck with the one the session opened with.
+  const adopt = async (bundle: string): Promise<{ uid: string; created: boolean }> => {
+    const adopted = await adoptCapture(
+      tickets,
+      references.bundle(bundle),
+      {},
+      {
+        index: deps.index ? await deps.index(env) : await defaultIndexer(env),
+        describeImage: deps.describeImage ?? defaultDescriber(env),
+      },
+    )
+    return { uid: adopted.ticket.uid, created: adopted.created }
+  }
   return (site: string) =>
     fidelityDeps(
       env,
@@ -188,6 +206,7 @@ async function sessionFidelity(
       // Spread rather than set to `undefined`: an explicit `undefined` would
       // read as a launcher that was supplied and is broken.
       deps.launch ? { launch: deps.launch } : {},
+      adopt,
     )
 }
 

```
