---
uid: report-012b2e49
id: REPORT-7570
type: report
title: 'Report: mode_override for story-e674c60a'
created_by: xgd
created_at: '2026-11-01T11:16:10.883670+00:00'
updated_at: '2026-11-01T11:49:36.712848+00:00'
completed_at: null
last_field_updated: files_touched
fields:
  report_kind: mode_override
  subject_uid: story-e674c60a
  anchor_ticket: bundle-94dbe947
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-e5febd9c
  quality_mode: reconcile
  justification: 'AC-960 forbids the active component scope literal anywhere outside
    its one declaration, prose included; tools/generate/src/cli/ai/ledger-core.ts:17
    writes it in a JSDoc, and the reference rewords exactly that comment to drop it.
    Comment-only edit, no runtime effect. The builder-requested app.js change is NOT
    granted: rung 2 shows the reference does not keep the pane on a generic listing
    failure.'
  files:
  - tools/generate/src/cli/ai/ledger-core.ts
  rung: 2
  tip_evidence:
  - file: tools/generate/src/cli/ai/ledger-core.ts
    lines: 17-18
  external_cause: null
  planner_trust_boundary: false
  granted_head: 6a28909362da4a7e9adfe4275239560ad022ed22
  files_touched:
  - tests/reconciliation-builder-business-scope.test.ts
  - tests/reconciliation-builder-workspace-origin.test.ts
  - tests/reconciliation-workspace-build-artifacts.test.ts
  - tests/support/local-d1.ts
  - tools/generate/src/cli/ai/ledger-core.ts
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
---

# Mode override granted: code_frozen

AC-960 forbids the active component scope literal anywhere outside its one declaration, prose included; tools/generate/src/cli/ai/ledger-core.ts:17 writes it in a JSDoc, and the reference rewords exactly that comment to drop it. Comment-only edit, no runtime effect. The builder-requested app.js change is NOT granted: rung 2 shows the reference does not keep the pane on a generic listing failure.

Planner instructions for the batch:

Fix all of the following in one pass. (1) AC960: the test and AC-960 are correct. Do NOT narrow either. Under the granted override, reword ONLY the JSDoc in tools/generate/src/cli/ai/ledger-core.ts lines 17-18 so it no longer writes the scope literal (the reference wording is: The shared `ai-ticketing` component already declares ...). Change no code token. Confirm test_UAT_AC960_ is green and that no other tracked file trips check (b), then run the dependency tests. (2) AC967: do NOT edit apps/control-app/src/builder/app.js. It is outside the override, and the reference keeps the pane only for a refused session (BUG-52, out of scope), not for a generic listing failure. Rewrite AC-967 (acceptance_criterion-92c52943) in place: remove the sentence that a failing listing leaves the pane showing what it had, and its verification sentence (make the listing fail and assert the pane still shows the previous site). Add a one-line note citing this fix_plan. Do NOT replace them with a claim that failure empties the pane; leave that behaviour unasserted. Delete only the failing-listing step in tests/reconciliation-builder-business-scope.test.ts (around lines 695-700) and keep every other assertion. Under the 2026-11-01 Reconciliation Decisions in story-e674c60a, add a correction: clause (c) misdescribed the code (both the tree app.js:700 and the reference map a non-session failure to an empty list) and has been withdrawn from AC-967. (3) AC964 and AC1400: the D1-backed admission gate is correct and the fixtures are stale. In tests/reconciliation-builder-workspace-origin.test.ts (workerEnv around lines 759-766) and tests/reconciliation-workspace-build-artifacts.test.ts (workerEnv around lines 87-93), replace the throwing DB proxy with a real local D1 from tests/support/local-d1.ts: applyLocalD1Schema, then seedIdentity for the email the minted Access token carries, so that identity is invited, entitled and has agreed. Do not hand-write SQL, a stub store or a second schema. Keep R2 (SITES) unreachable so that no route opening the site store remains a real failure mode. Correct the doc comments that say these routes touch no store: they touch D1 for admission only. In AC1400, re-point the TENANT_ID empty-string probe (around line 212) at a configured TENANT_ID for which the seeded store holds no account row, which is what AC-1400 means by a store that holds no account at all. Keep the assertions that an unadmitted caller is refused and that no artifact is ever served in place of a defined route. (4) AC975 shares a file with AC964, and in the quality run it failed at workspace-origin.test.ts:990. Run the whole test_scope together and confirm AC975 passes there. If it fails only alongside AC964, find and remove the state shared between the control-app front describe and the measured against a real browser describe. If a browser cannot launch, make the test fail loudly rather than warn-and-pass. The orphan entries clear once test_UAT_AC975_ and test_UAT_AC1400_ pass in the scoped run.

## Diff

```diff
diff --git a/tests/reconciliation-builder-business-scope.test.ts b/tests/reconciliation-builder-business-scope.test.ts
index c86df643e4..a727d225aa 100644
--- a/tests/reconciliation-builder-business-scope.test.ts
+++ b/tests/reconciliation-builder-business-scope.test.ts
@@ -663,12 +663,10 @@ describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — site, toolbar and memory f
         { slug: 'shared', latest: null },
       ],
     }
-    let failNext = false
     const asked: Array<string | null> = []
     const app = mountInjected({
       loadSites: async (id: string | null) => {
         asked.push(id)
-        if (failNext) throw new Error('listing down')
         return sitesOf[id ?? ''] ?? []
       },
     })
@@ -692,13 +690,8 @@ describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — site, toolbar and memory f
     expect(app.panel.getSite()).toBe('shared')
     expect(app.panel.getSrc()).toBe('/b/acct_salon/preview/shared/edit/')
 
-    // A listing that fails leaves the pane showing what it had, not an empty pane.
-    const shownBefore = app.panel.getSite()
-    failNext = true
-    await app.scope.setBusiness('acct_studio')
-    await settle()
-    expect(app.panel.getSite()).toBe(shownBefore)
-    expect(app.panel.getSrc()).not.toBe('')
+    // What a failing listing does to the pane is deliberately not asserted here
+    // (fix_plan, reconcile BUNDLE-35 batch 0): AC-967 no longer claims it.
     app.destroy()
   })
 
diff --git a/tests/reconciliation-builder-workspace-origin.test.ts b/tests/reconciliation-builder-workspace-origin.test.ts
index 30d58f1849..137a8b0719 100644
--- a/tests/reconciliation-builder-workspace-origin.test.ts
+++ b/tests/reconciliation-builder-workspace-origin.test.ts
@@ -54,6 +54,7 @@ import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
 // behaviour — the forwarding and failure-reporting contracts they pin are
 // unchanged, only unreachable to a caller Access has not admitted.
 import { startAccessTeam, type AccessTeam } from './support/access'
+import { applyLocalD1Schema, localD1, seedIdentity } from './support/local-d1'
 // The Worker's OWN `fetch`, driven in-process. `unstable_dev` is not used for
 // AC-964 any more: it spawns a `wrangler dev` child, which makes the gate
 // assertions hostage to a subprocess that cannot start in a sandboxed checkout,
@@ -733,37 +734,50 @@ describe('story-e674c60a component consumption route', () => {
 // ── the single origin, fronted by the Worker ─────────────────────────────────
 
 describe('story-e674c60a control-app front', () => {
+  const ORIGIN_TENANT = 'story-e674c60a'
+  const ORIGIN_EMAIL = 'story-e674c60a-origin@westhead.me'
   let access: AccessTeam
   let admitted: Record<string, string>
+  let d1: Awaited<ReturnType<typeof localD1>> | undefined
 
   beforeAll(async () => {
     if (!WEBUI_INSTALLED) return
     access = await startAccessTeam()
-    admitted = await access.headers()
+    // Admission reads D1 before any route runs (REQ-167), so the person behind
+    // the minted token must exist there — invited, entitled and agreed — under
+    // the deployment's own TENANT_ID. An address of this suite's own, so no
+    // other suite's seed of the same person decides which tenant they sit in.
+    admitted = await access.headers({ email: ORIGIN_EMAIL })
+    applyLocalD1Schema(REPO)
+    seedIdentity(REPO, ORIGIN_EMAIL, { tenantId: ORIGIN_TENANT })
+    d1 = await localD1(REPO)
   }, 120000)
 
   afterAll(async () => {
     await access?.close()
+    await d1?.dispose()
   })
 
   /**
-   * The Worker's env, in the deployed shape, with the STORE BINDINGS UNREACHABLE.
+   * The Worker's env, in the deployed shape: a REAL local D1, and the SITE STORE
+   * UNREACHABLE.
    *
-   * Neither route this leg sweeps may open a store — the document is composed
-   * and the artifact is served by the assets binding — so a binding that throws
-   * the moment it is touched turns "it happens not to be opened" into something
-   * a test can fail on. It is also what makes this leg possible at all: the node
-   * pool has no D1 or R2, which is why the store-backed half of AC-964's sweep
-   * lives in `reconciliation-workspace-admission.workers.test.ts`.
+   * Neither route this leg sweeps opens the site store — the document is
+   * composed and the artifact is served by the assets binding. They do touch D1,
+   * for admission only: the gate's verified email is looked up in the seeded
+   * identity tables before routing. R2 still throws the moment it is touched, so
+   * "the site store happens not to be opened" stays something a test can fail
+   * on. The store-backed half of AC-964's sweep lives in
+   * `reconciliation-workspace-admission.workers.test.ts`.
    */
   function workerEnv(): WorkerEnv {
     const unreachable = (what: string) => () => {
       throw new Error(`${what} was touched while answering a store-free route.`)
     }
     return {
-      DB: new Proxy({}, { get: unreachable('D1') }) as D1Database,
+      DB: d1!.db,
       SITES: new Proxy({}, { get: unreachable('R2') }) as R2Bucket,
-      TENANT_ID: 'story-e674c60a',
+      TENANT_ID: ORIGIN_TENANT,
       ACCESS_TEAM_DOMAIN: access.teamDomain,
       ACCESS_AUD: access.aud,
       ACCESS_DEV_OPEN: '',
@@ -939,7 +953,7 @@ describe('story-e674c60a origin failure reporting', () => {
  * jsdom does no layout — every `getBoundingClientRect()` is zero, so a
  * layout-less environment cannot tell a filled pane from a collapsed one. Only
  * a real browser can answer AC-975, and where none can be launched the test
- * says so out loud rather than passing quietly.
+ * fails, naming why, rather than passing quietly.
  */
 describe('story-e674c60a measured against a real browser', () => {
   let cwd: string
@@ -969,25 +983,31 @@ describe('story-e674c60a measured against a real browser', () => {
         unverified('the frame height measurement (the chrome needs the components)')
         return
       }
+      // No browser is a FAILURE, not a warning: a measurement that passes when it
+      // could not be taken is the silent green AC-975 rules out.
       if (!chromium || !builder) {
-        console.warn(
-          'story-e674c60a: frame measurement SKIPPED — playwright is not resolvable ' +
-            'from tools/generate. The viewport-fill behaviour is unverified here.',
+        throw new Error(
+          'story-e674c60a: frame measurement NOT TAKEN — playwright is not resolvable ' +
+            'from tools/generate, so the viewport-fill behaviour cannot be verified.',
         )
-        return
       }
-      const browser = await launchAnyChromium(chromium)
+      const { browser, errors: launchErrors } = await launchAnyChromium(chromium)
       if (!browser) {
-        console.warn(
-          'story-e674c60a: frame measurement SKIPPED — no chromium build or system ' +
-            'Chrome could be launched. The viewport-fill behaviour is unverified here.',
+        throw new Error(
+          'story-e674c60a: frame measurement NOT TAKEN — no chromium build or system ' +
+            'Chrome could be launched, so the viewport-fill behaviour cannot be verified. ' +
+            launchErrors.join(' | '),
         )
-        return
       }
 
       try {
         const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
-        await page.goto(builder.url, { waitUntil: 'networkidle' })
+        // Wait for the frame the measurement is about, not for network idle: the
+        // workspace issues requests unrelated to layout (material listing, CDN
+        // imports for other panels) that may never settle in a sandbox, and
+        // their fate says nothing about the height chain.
+        await page.goto(builder.url, { waitUntil: 'load' })
+        await page.waitForSelector('.builder-panel__frame', { state: 'attached' })
 
         const frameHeight = () =>
           page.evaluate(() => {
@@ -1055,15 +1075,24 @@ async function loadChromium(): Promise<typeof import('playwright').chromium | un
  */
 async function launchAnyChromium(
   chromium: typeof import('playwright').chromium,
-): Promise<import('playwright').Browser | undefined> {
-  for (const opts of [{}, { channel: 'chrome' as const }]) {
+): Promise<{ browser?: import('playwright').Browser; errors: string[] }> {
+  // Each attempt's reason is kept, so a launch that fails says WHY in the
+  // failure rather than leaving only "no browser".
+  const errors: string[] = []
+  for (const opts of [
+    {},
+    { channel: 'chrome' as const },
+    // Under an OS sandbox (macOS Seatbelt) the multi-process browser dies at
+    // startup; the same build in one process still lays out for real.
+    { args: ['--single-process', '--no-zygote', '--disable-gpu'] },
+  ]) {
     try {
-      return await chromium.launch(opts)
-    } catch {
-      /* try the next one */
+      return { browser: await chromium.launch(opts), errors }
+    } catch (e) {
+      errors.push(`${JSON.stringify(opts)}: ${(e as Error).message.split('\n')[0]}`)
     }
   }
-  return undefined
+  return { errors }
 }
 
 function* walk(dir: string): Generator<string> {
diff --git a/tests/reconciliation-workspace-build-artifacts.test.ts b/tests/reconciliation-workspace-build-artifacts.test.ts
index 8fc46a02cd..365223fee6 100644
--- a/tests/reconciliation-workspace-build-artifacts.test.ts
+++ b/tests/reconciliation-workspace-build-artifacts.test.ts
@@ -39,10 +39,22 @@ import {
   webuiPackageDir,
 } from '../tools/generate/src/cli/webui'
 import { startAccessTeam, type AccessTeam } from './support/access'
+import { applyLocalD1Schema, localD1, seedIdentity } from './support/local-d1'
 
 const REPO = path.resolve(__dirname, '..')
 const DIST = path.join(REPO, 'apps', 'control-app', 'dist-assets')
 
+/**
+ * Who the minted tokens belong to, and under which deployment. Each identity is
+ * this suite's own address, so no other suite's seed of the same person decides
+ * which tenant they sit in. The second deployment names a TENANT_ID the store
+ * holds NO account row for — AC-1400's "a store that holds no account at all".
+ */
+const ARTIFACT_TENANT = 'story-e674c60a'
+const ARTIFACT_EMAIL = 'story-e674c60a-artifacts@westhead.me'
+const NO_ACCOUNT_TENANT = 'story-e674c60a-no-account'
+const NO_ACCOUNT_EMAIL = 'story-e674c60a-no-account@westhead.me'
+
 /** The map `1c assets` derives, recomposed here from each component's own declaration. */
 function declaredMap(): { imports: Record<string, string>; styles: string[] } {
   const imports: Record<string, string> = {}
@@ -77,20 +89,22 @@ function markerAssets(): Fetcher {
 }
 
 /**
- * The Worker's env, with the store bindings unreachable ON PURPOSE.
+ * The Worker's env: a REAL local D1, and the site store unreachable ON PURPOSE.
  *
- * An artifact request must never open a store, so a binding that throws the
- * moment it is touched turns "it happens not to be opened today" into a claim a
- * test can actually fail on.
+ * An artifact request touches D1 for admission only — the gate's verified email
+ * is looked up in the seeded identity tables before anything is routed. It must
+ * never open the SITE store, so an R2 binding that throws the moment it is
+ * touched turns "it happens not to be opened today" into a claim a test can
+ * actually fail on.
  */
-function workerEnv(team: AccessTeam, overrides: Partial<Env> = {}): Env {
+function workerEnv(team: AccessTeam, db: D1Database, overrides: Partial<Env> = {}): Env {
   const unreachable = (what: string) => () => {
     throw new Error(`${what} was touched while answering a build-artifact request.`)
   }
   return {
-    DB: new Proxy({}, { get: unreachable('D1') }) as D1Database,
+    DB: db,
     SITES: new Proxy({}, { get: unreachable('R2') }) as R2Bucket,
-    TENANT_ID: 'story-e674c60a',
+    TENANT_ID: ARTIFACT_TENANT,
     ACCESS_TEAM_DOMAIN: team.teamDomain,
     ACCESS_AUD: team.aud,
     ACCESS_DEV_OPEN: '',
@@ -112,16 +126,24 @@ describe('story-e674c60a — the workspace serves what the build wrote', () => {
   let cwd: string
   let builder: BuilderHandle
   let team: AccessTeam
+  let d1: Awaited<ReturnType<typeof localD1>> | undefined
 
   beforeAll(async () => {
     cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-e674c60a-assets-'))
     builder = await startBuilder({ cwd })
     team = await startAccessTeam()
+    // Admission reads D1 before any route runs (REQ-167), so the person behind
+    // the minted token must exist there: invited, entitled and agreed.
+    applyLocalD1Schema(REPO)
+    seedIdentity(REPO, ARTIFACT_EMAIL, { tenantId: ARTIFACT_TENANT })
+    seedIdentity(REPO, NO_ACCOUNT_EMAIL, { tenantId: NO_ACCOUNT_TENANT })
+    d1 = await localD1(REPO)
   }, 120000)
 
   afterAll(async () => {
     await builder?.close()
     await team?.close()
+    await d1?.dispose()
     if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
   })
 
@@ -189,15 +211,15 @@ describe('story-e674c60a — the workspace serves what the build wrote', () => {
     expect(MODULE_CLIENT_JS.length).toBeGreaterThan(0)
 
     // ── behind the gate, never ahead of it ──────────────────────────────────
-    const admitted = await team.headers()
+    const admitted = await team.headers({ email: ARTIFACT_EMAIL })
     const req = (p: string, headers?: Record<string, string>) =>
       new Request(`https://app.example${p}`, headers ? { headers } : undefined)
 
-    const gated = await worker.fetch(req('/builder/main.js', admitted), workerEnv(team))
+    const gated = await worker.fetch(req('/builder/main.js', admitted), workerEnv(team, d1!.db))
     expect(gated.status).toBe(200)
     expect(await gated.text()).toBe('asset:/builder/main.js')
 
-    const refused = await worker.fetch(req('/builder/main.js'), workerEnv(team))
+    const refused = await worker.fetch(req('/builder/main.js'), workerEnv(team, d1!.db))
     expect(refused.status).toBe(401)
     const refusedBody = await refused.text()
     expect(refusedBody).not.toContain('asset:')
@@ -205,22 +227,29 @@ describe('story-e674c60a — the workspace serves what the build wrote', () => {
     expect(refusedBody).not.toContain(clientBytes.subarray(0, 64).toString('utf8'))
 
     // ── the fall-through does not depend on an account ──────────────────────
-    // A build artifact has nothing to do with one, and the store bindings above
-    // throw if touched — so this passing is the evidence the store stayed shut.
+    // A build artifact has nothing to do with one. The deployment names an
+    // account the seeded store holds no row for — a store that holds no account
+    // at all, as far as this deployment is concerned — and the site store
+    // throws if touched, so this passing is the evidence it stayed shut.
+    const accountRow = () =>
+      d1!.db.prepare('SELECT id FROM tenants WHERE id = ?').bind(NO_ACCOUNT_TENANT).first()
+    expect(await accountRow(), 'the no-account deployment must hold no account row').toBeNull()
     const noAccount = await worker.fetch(
-      req('/webui/marker.js', admitted),
-      workerEnv(team, { TENANT_ID: '' }),
+      req('/webui/marker.js', await team.headers({ email: NO_ACCOUNT_EMAIL })),
+      workerEnv(team, d1!.db, { TENANT_ID: NO_ACCOUNT_TENANT }),
     )
     expect(noAccount.status).toBe(200)
     expect(await noAccount.text()).toBe('asset:/webui/marker.js')
+    // …and answering it registered nothing: the store was never opened.
+    expect(await accountRow()).toBeNull()
 
     // ── and it stays LAST: no artifact answers in place of a route ──────────
-    const document = await worker.fetch(req('/', admitted), workerEnv(team))
+    const document = await worker.fetch(req('/', admitted), workerEnv(team, d1!.db))
     expect(document.status).toBe(200)
     expect(document.headers.get('content-type')).toContain('text/html')
     expect(await document.text()).not.toContain('asset:')
 
-    const published = await worker.fetch(req('/preview/alpha/published/', admitted), workerEnv(team))
+    const published = await worker.fetch(req('/preview/alpha/published/', admitted), workerEnv(team, d1!.db))
     expect(published.status).toBe(302)
     expect(published.headers.get('location')).toContain('/site/alpha/')
 
diff --git a/tests/support/local-d1.ts b/tests/support/local-d1.ts
index d95dcabf73..73907482b4 100644
--- a/tests/support/local-d1.ts
+++ b/tests/support/local-d1.ts
@@ -1,4 +1,6 @@
 import { execFileSync } from 'node:child_process'
+import { mkdtempSync } from 'node:fs'
+import os from 'node:os'
 import path from 'node:path'
 import { TERMS_VERSION } from '../../apps/control-app/src/terms'
 
@@ -98,3 +100,44 @@ export function seedIdentity(
   })
   return { businessId }
 }
+
+/**
+ * That same local D1, as a binding a suite can hand the Worker's own `fetch`.
+ *
+ * WHY THIS EXISTS NEXT TO THE TWO ABOVE. Some suites drive `controlWorker.fetch`
+ * in-process rather than over `unstable_dev`, and so hold no D1 at all — but
+ * admission (REQ-167) reads `users`, `memberships` and `entitlements` before any
+ * route runs, so a route that opens no site store still touches D1. Handing such
+ * a suite a throwing stand-in made admission itself the failure.
+ *
+ * It is the database `applyLocalD1Schema` migrated and `seedIdentity` seeded:
+ * `getPlatformProxy` reads the same `wrangler.toml` and persists to the same
+ * directory `wrangler d1 … --local` does, so there is no second schema and no
+ * stubbed store — only a second way to reach the one local database.
+ */
+export async function localD1(
+  repoRoot: string,
+): Promise<{ db: D1Database; dispose: () => Promise<void> }> {
+  const { getPlatformProxy } = await import('wrangler')
+  const appDir = path.join(repoRoot, 'apps', 'control-app')
+  // Miniflare registers every worker it starts in wrangler's dev registry, which
+  // defaults to the operator's GLOBAL config directory. A test has no business
+  // announcing itself to whatever `wrangler dev` the operator has running, so
+  // the registry is a throwaway directory of this proxy's own — read once, while
+  // the options are composed, and restored straight after.
+  const previous = process.env.WRANGLER_REGISTRY_PATH
+  process.env.WRANGLER_REGISTRY_PATH = mkdtempSync(path.join(os.tmpdir(), 'local-d1-registry-'))
+  try {
+    const proxy = await getPlatformProxy<{ DB: D1Database }>({
+      configPath: path.join(appDir, 'wrangler.toml'),
+      persist: { path: path.join(appDir, '.wrangler', 'state', 'v3') },
+      // Local only. The config also declares bindings (AI, Browser Rendering)
+      // that only exist remotely; a test must never reach a Cloudflare account.
+      remoteBindings: false,
+    })
+    return { db: proxy.env.DB, dispose: () => proxy.dispose() }
+  } finally {
+    if (previous === undefined) delete process.env.WRANGLER_REGISTRY_PATH
+    else process.env.WRANGLER_REGISTRY_PATH = previous
+  }
+}
diff --git a/tools/generate/src/cli/ai/ledger-core.ts b/tools/generate/src/cli/ai/ledger-core.ts
index 7d17f20b34..6570b3f358 100644
--- a/tools/generate/src/cli/ai/ledger-core.ts
+++ b/tools/generate/src/cli/ai/ledger-core.ts
@@ -14,8 +14,8 @@
  * built that narrowing for. A deployment without a ticket store gets a
  * consultant that cannot record decisions, rather than one that fails to start.
  *
- * WHY A PURPOSE-BUILT SURFACE AND NOT THE TICKETING ONE. `@lagrangefoundry/ai-ticketing`
- * already declares `TicketAppendBody` and `TicketUpdate`, and granting them would
+ * WHY A PURPOSE-BUILT SURFACE AND NOT THE TICKETING ONE. The shared `ai-ticketing`
+ * component already declares `TicketAppendBody` and `TicketUpdate`, and granting them would
  * be the shorter path. It would also hand a client-facing assistant the ability
  * to write *any* ticket in the project, to be clawed back by a scope predicate
  * that has to stay correct forever. These two operations can only reach this

```
