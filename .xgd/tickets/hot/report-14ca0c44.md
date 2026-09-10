---
uid: report-14ca0c44
id: REPORT-3683
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-09-10T06:43:23.436097+00:00'
updated_at: '2026-09-10T06:43:23.436097+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: uat
  violations: 1
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 3
**Needs review**: 0

Anchor report: report-e37a6b4a. Previous attempts: 1 (report-06854a25 → fix report-11434d37).

**Method note.** Read-only alignment check; no test was executed. Every judgement below is
from reading AC bodies against test bodies and, where an AC's claim was contradicted, against
the source it claims about (`vitest.node.config.mts`, `vitest.workers.config.mts`,
`tools/generate/src/cli/preview.ts`, `apps/control-app/src/router.ts`).

**State of the previous attempt.** All three actionable findings of report-06854a25 were
verified as landed, by reading the current tree rather than by trusting report-11434d37:

| Prior finding | Verified now |
|---|---|
| 1 (violation, AC-1329 ac-edit) | AC-1329's bullet 1 and Verification no longer claim an Astro container-render path; they now match `test_UAT_AC1329_…` (tests/reconciliation-site-storage-port.test.ts:648-714). Resolved. |
| 2 (warning, AC-1619 uat-edit) | Both contract cases carry the mandated name (tests/support/site-store-contract.ts:354, :368) and the module is registered against the filesystem and memory adapters (tests/test_UAT_FC_REQ-142_site_store_port.test.ts:97-102) and the D1/R2 adapter (tests/test_UAT_FC_REQ-143_d1r2_store.workers.test.ts:51-54). Resolved over all three adapters. |
| 3 (warning, AC-1329 ac-edit) | The failing-set bullet now sits under `## Recorded at reconciliation, not asserted`, and the Verification sentence is gone. Resolved. |

The finding below is **new**: it is the same retired fact as prior finding 1, surviving in a
second AC (AC-1385) that report-06854a25's ledger recorded as `aligned`, plus a second,
stronger contradiction — the exception AC-1385 declares is disproved by two sibling UATs in
its own story.

## Cumulative Intent Considered

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUNDLE-19 | bundle-77b28def | free_and_reconciled | merged b18b859 | STORY-118's originating intent (REQ-141 workerd project, REQ-142 the async port) | YES |
| BUNDLE-20 | bundle-b3b7c399 | free_and_reconciled | merged eef7a8b | STORY-121's originating intent and STORY-118's `updated_by` (REQ-143, REQ-145, REQ-146, REQ-148, REQ-150) | YES |
| BUNDLE-21 | bundle-78f4e2fe | free_and_reconciled | merged 96a7693 | BUG-36/37/38; touches STORY-121 | YES |
| REQ-142 | request-0dd62a5d | free_and_reconciled | 2026-08-15 | "An async SiteStore port, with the filesystem behind it" — one contract over every adapter | YES |
| REQ-143 | request-18a48d63 | free_and_reconciled | 2026-08-15 | "The Cloudflare SiteStore: definitions in D1, bytes in R2" — the third adapter, real bindings | YES |
| REQ-145 | request-b474390f | free_and_reconciled | completed 2026-08-31 | "control-app becomes the builder: … routes and L1 render in workerd, proxy deleted" | YES |
| REQ-148 | request-7ae3c2cc | free_and_reconciled | completed 2026-08-31 | "Behavior modules render in workerd" — **deletes Astro from the render path**; modules become plain TS functions | YES |
| REQ-149 | request-554ac441 | free_and_reconciled | 2026-08-17 | The five revision verbs on the same port, answered by every adapter | YES |
| REQ-150 | request-34dd9049 | free_and_reconciled | 2026-08-18 | Plain Vite/Vitest config, `astro` dropped as a dependency | YES |
| REQ-162 | request-13a5e206 | free_and_reconciled | merged 4b43dd9 | The second R2 binding (`BLOBS`) AC-1398's pairing survives | YES |
| REQ-155 | request-01ea4eec | draft | 2026-08-20 | Capture in workerd behind a ReferenceStore port | NO (draft) |

**Cumulative picture relevant to this level.** REQ-142/143 put one question set over three
adapters. REQ-148 + REQ-150 then removed Astro and its build transform from the repository
entirely, and REQ-145 moved the builder's routes and render into workerd. After those three,
**no build transform separates the two test runtimes**, and the render path is worker-safe:
`tools/generate/src/cli/preview.ts:89-95` states it in production code — "behavior components
are plain functions now, so both hosts render every page — L1 or behavior — through the same
`renderSiteFiles`".

## Alignment Ledger

STORY-118 (story-3f4a5f2b, feature) — AC-1321…1329, 1619, 1620.
STORY-121 (story-fde7370b, upgrade) — AC-1385…1398, 1447, 1448.
All 27 ACs carry a test under the mandated `test_UAT_AC<n>_*` name (verified by scanning
`tests/**` for the convention); no AC is nameless.

| Element | Test | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1321 | reconciliation-site-storage-port.test.ts:127 | REQ-142 | aligned (carried forward from report-06854a25) |
| AC-1322 | …:198 | REQ-142 | aligned (carried forward) |
| AC-1323 | …:258 | REQ-142 | aligned (carried forward) |
| AC-1324 | …:339 | REQ-142 | aligned — **re-verified this pass**: criterion clause-for-clause against the test (read, write+read-back, counter advance and non-advance on refusal, copy segment, verbatim L1 subtree, palette refusal/rename-with-references, asset bytes add+remove, render), plus `site.cwd === null` and `opts.cwd === undefined` |
| AC-1325 | …:475 | REQ-142 | aligned (carried forward) |
| AC-1326 | …:513 | REQ-142 | aligned (carried forward) |
| AC-1327 | …:614 | REQ-142, REQ-145 | aligned (carried forward) |
| AC-1328 | reconciliation-site-storage-port.workers.test.ts:30 | REQ-141, REQ-143 | aligned (carried forward; bullets 3–4 asserted in the AC-1329 test — see info #5) |
| AC-1329 | reconciliation-site-storage-port.test.ts:648 | REQ-142, REQ-148, REQ-150 | aligned — **re-verified this pass**: the AC as repaired in attempt 1 now matches the test's `not.toMatch(/from 'astro/)`, `not.toContain('astro')`, alias/timeout and partition assertions |
| AC-1619 (pending) | tests/support/site-store-contract.ts:354, :368 | REQ-149 | aligned — **re-verified this pass**: mandated name, registered against all three adapters |
| AC-1620 (pending) | reconciliation-site-storage-port.test.ts:423 | REQ-142, REQ-146 | aligned (carried forward) |
| AC-1385 | reconciliation-cloudflare-site-store.test.ts:215 | REQ-142, REQ-143 | **drift** — the three-store comparison and the question-set membership assertions are sound, but the AC's "Named exception" paragraph states a reason REQ-148/REQ-150 retired **and** a restriction two of this story's own workerd UATs disprove (finding 1) |
| AC-1386 | …workers…:126 | REQ-143 | aligned (carried forward) |
| AC-1387 | …workers…:209 | REQ-143 | aligned (carried forward) |
| AC-1388 | …workers…:299 | REQ-143 | aligned (carried forward) |
| AC-1389 | …workers…:335 | REQ-143 | aligned (carried forward) |
| AC-1390 | …workers…:399 | REQ-143 | aligned (carried forward) |
| AC-1391 | reconciliation-cloudflare-site-store.test.ts:290 | REQ-143 | aligned (carried forward) |
| AC-1392 | …workers…:450 | REQ-143 | aligned (carried forward) |
| AC-1393 | …workers…:497 | REQ-143 | aligned (carried forward) |
| AC-1394 | …workers…:553 | REQ-143 | aligned (carried forward) |
| AC-1395 | …workers…:658 | REQ-143 | aligned — **re-verified this pass**: real `storage/sites/*` inlined by Vite, `bySlug.size > 0` guard, byte-for-byte file comparison, **and `renderSiteFiles` executed inside workerd on the cloud-loaded draft (:710-711)** — which is the evidence against AC-1385's exception |
| AC-1396 | …workers…:742 | REQ-143 | aligned — its "no build transform" clause is a true statement about the workerd project (vitest.workers.config.mts declares only `cloudflareTest`), unlike AC-1385's |
| AC-1397 | reconciliation-cloudflare-site-store.test.ts:352 | REQ-143 | aligned (carried forward) |
| AC-1398 | …:403 | REQ-143, REQ-162 | aligned (carried forward) |
| AC-1447 | reconciliation-cloudflare-store-draft-reuse.workers.test.ts:135 | REQ-143, REQ-145 | aligned — **re-verified this pass**: identity-not-equality on `loadDraft`, own/asset/second-handle writes, **and three real `worker.fetch('/preview/<slug>/edit/')` requests served from the D1/R2 store inside workerd (:178-192)** — the second piece of evidence against AC-1385's exception |
| AC-1448 | …:197 | REQ-143 | aligned (carried forward) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1385 (acceptance_criterion-0d6bc58c) | ac-edit | AC-1385's `## Criterion` closes with: "**Named exception, deliberately stated rather than silently absent**: the two questions that *render* the draft are answered by the filesystem-hosted stores only, because at this point the render still runs through a build transform the Workers runtime has none of." Both halves are false in the tree. **(a) The reason.** REQ-148 (request-7ae3c2cc, free_and_reconciled, completed 2026-08-31) deleted Astro from the render path and made behavior modules plain TS functions; REQ-150 (request-34dd9049, free_and_reconciled, 2026-08-18) replaced `getViteConfig()` with plain `defineConfig` and dropped the dependency. `vitest.node.config.mts:67-76` declares no transform of any kind, and `test_UAT_AC1329_…` asserts its absence on both projects (tests/reconciliation-site-storage-port.test.ts:671, :683). AC-1385 was authored 2026-08-31, after both landed, so this is stale text, not a regression. **(b) The restriction.** The Workers runtime *does* answer the render questions from the cloud store today, and two UATs of this same story prove it: `test_UAT_AC1395_…` calls `renderSiteFiles(fromCloud)` inside workerd (tests/reconciliation-cloudflare-site-store.workers.test.ts:710-711, comparing every emitted file byte-for-byte), and `test_UAT_AC1447_…` drives three real `worker.fetch('/preview/<slug>/edit/')` requests against the D1/R2 store inside workerd, each returning 200 with rendered HTML (tests/reconciliation-cloudflare-store-draft-reuse.workers.test.ts:178-192) — a route `apps/control-app/src/router.ts:126-129, :576` serves through `PreviewRenderer` over the tenant store. Production code says the same: `tools/generate/src/cli/preview.ts:89-95` — "behavior components are plain functions now, so both hosts render every page — L1 or behavior — through the same `renderSiteFiles`". `test_UAT_AC1385_…` (tests/reconciliation-cloudflare-site-store.test.ts:269-285) asserts only the *membership* of `RENDER_QUESTIONS` and that both host-runtime stores answer them; it asserts nothing about a transform, so no assertion has to change. | Rewrite the "Named exception" paragraph so it states what is true: the two render questions are excluded from the **shared question set** because the two preview cases are placed in the node suite, **not** because the Workers runtime cannot answer them — since REQ-148/REQ-150/REQ-145 it can, and the cloud store's render is proved by AC-1395 (`renderSiteFiles` in workerd) and AC-1447 (the real `/preview/` route in workerd). Do NOT change `test_UAT_AC1385_…`. |
| 2 | warning | consistency | tests/support/storage-questions.ts:49-58 | uat-edit | The doc comment on `RENDER_QUESTIONS` carries the retired reason verbatim — "because the render at this point still runs through a build transform the Workers runtime has none of" — and this is the module AC-1385 points at ("they are named in the shared module"), and the module `test_UAT_AC1385_…` asserts against by name (…:265-267). Attempt 1 reworded the two sibling comments (report-11434d37 fix #6) and missed this third carrier, which is the one an editor repairing AC-1385 will read first. | Reword to the true reason (test placement; the Workers runtime renders — see AC-1395/AC-1447), keeping the Astro history as a parenthetical. Comment only; no assertion changes. |
| 3 | warning | consistency | tests/support/site-store-contract.ts:49-56 and tests/test_UAT_FC_REQ-142_site_store_port.test.ts:104-108 | uat-edit | Attempt 1 replaced the Astro reason in both comments with "rendering reaches the filesystem, which workerd does not have". The tree contradicts that too: `PreviewRenderer.file` reads only the store and `MIME` (tools/generate/src/cli/preview.ts:107-129) and `renderSiteFiles` runs in workerd (AC-1395's test, and the `/preview/` route in AC-1447's). Both comments also defer the relocation to "REQ-145's scope", but REQ-145 (request-b474390f) is free_and_reconciled and completed 2026-08-31 — the work being deferred to has already landed. One wrong reason was swapped for another; the third rewrite should be checked against the tree rather than authored from the same paragraph. | State the placement as a placement (the two preview cases have not been moved into the shared body yet), drop the "REQ-145's scope" deferral or re-point it at whatever ticket now owns the move, and stop asserting a technical barrier that no longer exists. Comments only. |
| 4 | warning | coverage | AC-1385 (acceptance_criterion-0d6bc58c) | uat-add | Consequence of finding 1: with the premise gone, nothing prevents the two preview cases from joining `describeSiteStoreContract`, which would make the render questions answered by **all three** adapters — the property CAP-101's own body claims ("One body of storage assertions is run against all three, which is what keeps them from drifting apart"). Today the cloud store's render is proved only obliquely, by AC-1395 (`renderSiteFiles`, not the port's render questions) and AC-1447 (the HTTP route). Fixing finding 1 alone clears the violation; this is the opportunistic follow-up. | Move the two preview cases from tests/test_UAT_FC_REQ-142_site_store_port.test.ts:109-135 into tests/support/site-store-contract.ts so every adapter answers them, and drop the exception from AC-1385 rather than restating it. **Run the workers suite before committing**: if the cloud adapter turns out not to answer them, keep the placement and record the reason that actually blocks it — do not restore a reason from the AC's history. |
| 5 | info | consistency | AC-1328 (acceptance_criterion-c8728ae8) | — | AC-1328's bullets 3–4 (the inclusion rules partition the test files; the composing config declares no suite; the workerd compatibility date/flags match the deployed Workers) are asserted in `test_UAT_AC1329_…` (tests/reconciliation-site-storage-port.test.ts:686-713) rather than in `test_UAT_AC1328_…`. Deliberate and correct — a file asserting the partition must read the repository, which the workerd file cannot. Re-recorded so the split is not later mistaken for a gap. | none |
| 6 | info | exclusivity | AC-1325 + AC-1385 | — | Not duplicates: AC-1325 compares the two host-runtime stores through the **editing commands** (`applyAndAsk`) plus assembled-definition equality; AC-1385 compares through the **port's own question set** (`askStorageQuestions`, including `appendChange`/`changesSince`/`version`, which no editing command exposes). Different surface, different shape. | none |
| 7 | info | exclusivity | AC-1619's two cases × three adapters | — | The same two `test_UAT_AC1619_*` cases run once per adapter (fs, memory, D1/R2) because they live in the shared contract module. That is the criterion — one body, every adapter — not redundancy. | none |
| 8 | info | — | AC-1447, AC-1448 | — | Both criteria turn on whether `assembleSite` ran, and both tests assert **object identity** rather than timing or equality — the only non-flaky way to observe it. Re-recorded so a later editor does not "fix" them into equality assertions and silently delete the claim. | none |

## Notes for the Editor

**The pattern to fix once, not four times.** Findings 1–3 are one retired fact with four
carriers: AC-1385's body, `tests/support/storage-questions.ts`, `tests/support/site-store-contract.ts`
and `tests/test_UAT_FC_REQ-142_site_store_port.test.ts`. Attempt 1 repaired the two comment
carriers it was pointed at but authored the replacement text from the AC's own paragraph rather
than from the tree, so a second false reason took the first one's place. **Check the replacement
sentence against `tools/generate/src/cli/preview.ts:89-95` and against
`tests/reconciliation-cloudflare-store-draft-reuse.workers.test.ts:178-192` before writing it.**
The true state of affairs is short: since REQ-148/REQ-150/REQ-145 the render is worker-safe and
runs in both runtimes; the two preview cases sit in the node suite by placement, and nothing
technical keeps them there.

**Why the story level does not also need a pass.** STORY-118's body was repaired in attempt 1
(`.xgd/tickets/hot/story-3f4a5f2b.md:91-92` now names REQ-148/REQ-150 and says the filesystem,
not a build transform, separates the runtimes). STORY-121's body carries no transform claim at
all. Only AC-1385 and the three test-support comments still carry it.

**Corroboration from outside this capability.** `test_UAT_AC1416_astro_absent_from_manifests_lockfile_configs_and_disk`
(tests/reconciliation-1c-launcher-bootstrap.test.ts:164-236, story-e15a19ef) asserts Astro is
absent from every manifest, the lockfile, every config and the disk. Any AC in any capability
still explaining behaviour by an Astro transform is stale by construction. Two comments outside
this capability still do — `tests/framework-content-modules.test.ts:14` ("rendered through
Astro's container API") and `tests/reconciliation-colour-census-and-retrofit.test.ts:31` — but
they belong to other capabilities and are out of this check's scope.

**Evidence quality worth preserving** (unchanged from report-06854a25, re-confirmed): AC-1393
plants real content outside the assets namespace before asserting confinement; AC-1395 guards on
`bySlug.size > 0` so an empty `storage/sites/` cannot make the comparison vacuous; AC-1398
mutates the TOML and re-runs its own pairing to prove the check can fail; AC-1385 asserts the
question set's membership against the criterion's own list so a store cannot pass by being asked
less than the surface asks it. A future editor trimming these should know they are the substance,
not ceremony.

**Still deliberately not a finding.** The pool-version pin comment in
`vitest.workers.config.mts:28-34` carries a diagnosis STORY-118 records as retracted after
promotion. AC-1328 and AC-1329 encode neither the pin nor its rationale, so the matrix is correct
and the divergence is confined to a code comment awaiting an operator decision. Nothing at this
level should touch it.
