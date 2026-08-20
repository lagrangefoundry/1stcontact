---
uid: report-c95afb23
id: REPORT-2481
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T17:22:05.328438+00:00'
updated_at: '2026-08-20T17:22:05.328438+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: uat
  violations: 5
  warnings: 3
  needs_review_count: 1
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: uat

**Result**: FAIL
**Violations**: 5
**Warnings**: 3
**Needs review**: 1

Fourth uat-level pass (`previous_attempt_count = 3`). REPORT-2475 (`report-cfd653dd`),
REPORT-2477 (`report-79169a27`) and REPORT-2479 (`report-7b857d56`) each raised the same 5
violations + 3 warnings + 1 needs_review; all three fix loops (REPORT-2476, REPORT-2478,
REPORT-2480) applied **zero** findings and declared `progress_made=false`, blocked on the same
branch-point problem.

**Every finding below was re-derived from source this pass**, not carried forward on trust: AC
bodies re-read from the ticket store, tests re-read from `main` via `git show` into a scratch
copy, and each absence claim re-established by `git grep -a` (text mode forced — STORY-118's
survey hazard: `builder.ts` and `fidelity.ts` carry NUL bytes and a plain recursive grep skips
them silently). All eight actionable findings survive re-verification unchanged. Nothing moved
in the tree between passes: `main`'s tip is still `bda6c9939`, this branch's only new commits
are ticket/report bookkeeping (`d54a8db24`, `ae170b4cd`, `7091ba738`, `2bcce4a67`), and no
`test_UAT_AC1353_*` / `test_UAT_AC1354_*` exists anywhere.

**New this pass — the blocker has a cleaner explanation than "the branch is behind."** The
regression run itself predates the capability:

| Event | When | Ref |
|---|---|---|
| Regression `cb0dad9c` started | 2026-08-20 **00:43:12** | REPORT-2277 (`report-2485c83c`, the anchor of this very check) |
| Branch cut (merge-base with `main`) | 2026-08-19 17:43 | `0f44ef1ba` |
| STORY-118 created | 2026-08-20 **05:08:58** | `story-3f4a5f2b` |
| The port's commit landed | 2026-08-20 | `2b902ead0` |
| BUNDLE-19 merged to `main` | 2026-08-20 **05:49** | `b18b859d7` |
| AC-1353 / AC-1354 created (in *this* worktree) | 2026-08-20 **15:43 / 15:59** | ac-level fix loop |

The capability did not exist when this regression was anchored. It is not that the branch fell
behind a capability under test — it is that a capability created **4h25m after the run started**
was walked into the run's matrix. That is why three fix loops found nothing to fix and were
right not to.

## Verification environment

**This worktree (`regression-cb0dad9c`, HEAD `2bcce4a67`) does not contain the code under
validation.** Re-confirmed independently this pass:

- `tools/generate/src/store/` here holds `base / diff / fsutil / history / index / loadSite /
  paths / snapshot` — no `site-store.ts`, `fs-store.ts`, `memory-store.ts`, `assemble.ts`,
  `journal-model.ts`.
- `tests/` here matches exactly one storage file, `req22-storage.test.ts`; neither
  `reconciliation-site-storage-port*.test.ts` nor `test_UAT_FC_REQ-14{1,2}_*` is present.
- `HEAD:tools/generate/src/cli/edit.ts:1` is `import { copyFileSync, writeFileSync } from
  'node:fs'` — the editing surface here is synchronous and filesystem-bound, i.e. AC-1353's
  first bullet is *false* in this tree, not merely unevidenced.
- `git merge-base --is-ancestor 2b902ead0 HEAD` → **false**; merge-base with `main` is
  `0f44ef1ba`.

Every citation below is therefore `main:<path>:<line>`.

**No test was executed.** The suite cannot run here — the modules under test are absent — and
this check is read-only. Every finding is a claim about what a test *asserts* versus what its AC
*requires*, established by reading both. **None is a claim that a test fails.**

## Cumulative Intent Considered

Level cascade honoured: story level passed at REPORT-2463, ac level at REPORT-2474, so **AC
bodies are the working reference throughout**. Intent history was consulted only where an AC's
own scoping is load-bearing (AC-1327's freshness disclaimer, finding 4). STORY-118
(`story-3f4a5f2b`, `story_kind=feature`, `status=completed`, 11 ACs all `status=active`,
`kind=behavior`) carries `intent_uid = bundle-77b28def`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-19 (`bundle-77b28def`) | `free_and_reconciled` | 2026-08-18 | The story's intent; merged at `b18b859d7`. Nine source tickets, of which only REQ-141 and REQ-142 carry a storage or test-runtime surface | YES |
| REQ-142 (`request-0dd62a5d`) | `free_and_reconciled` | 2026-08-15 | The async `SiteStore` port: async verbs, `FsSiteStore`, in-memory adapter, `edit.ts` async with `store` injected, one whole change as one `write`, unchanged CLI surface and `code`/`path`/`hint` envelopes | YES |
| REQ-141 (`request-b18d2056`) | `bundled` in BUNDLE-19 | 2026-08-15 | Workers-runtime test project: vitest split into node + workerd, real D1 (`DB`) / R2 (`SITES`) bindings, `*.workers.test.ts` routing, compat settings copied from the apps' wrangler.toml | YES |
| REQ-144 (`request-7bef34e0`) | `free_and_reconciled` | 2026-08-15 | Build/deploy/smoke scripts | YES — no store surface |
| REQ-119 (`request-64864801`) | `free_and_reconciled` | 2026-07-31 | Request-time draft/edit renders, incl. the render cache and its stamp-based invalidation. Lives in CAP-85's tree as AC-1033 (`acceptance_criterion-ae33f0ab`, `uat_coverage: pass`) | YES — but **not this capability's**; load-bearing for finding 4 |
| REQ-143 (`request-18a48d63`) | `ready_to_reconcile` | 2026-08-15 | The Cloudflare SiteStore (D1 + R2 adapter) | imminent — explicitly Out of scope per STORY-118; not enforced here |
| REQ-145 / 146 / 147 / 148 | `ready_to_reconcile` / `reconciling` | 2026-08-15 | Builder move, AI host in workerd, Cloudflare Access, behavior modules in workerd | imminent — no uat-level surface here |
| REQ-149 / REQ-150 | `draft` / `free_coding` | 2026-08-17 / 18 | Cloud publish; Vite SSR server | NO |

## Alignment Ledger

Tests located by the `test_UAT_AC<number>_*` convention across all of `main:tests/`
(`git grep -a -h -o -E "test_UAT_AC1[0-9]{3}_[a-z_0-9]*" main -- tests`: AC1321–AC1329 present,
AC1353 and AC1354 absent). Where an AC's substance exists only under a free-coded name
(`UAT_FC_REQ-14N …`), that is **recorded but not counted as coverage** — the matrix links a test
to an AC by that convention and by nothing else.

| Element | UAT(s) found | Outcome |
|---|---|---|
| AC-1321 `acceptance_criterion-d4cc3712` | `test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld` — `main:tests/reconciliation-site-storage-port.test.ts:126` | **gap** — 7 of 10 non-`write` questions asked (`:135-143`); `appendChange`, `changesSince`, `pendingChanges` asked **nowhere in the tree** (finding 3). `loadDraft`'s reported-errors branch unasserted — `:164-172` covers only `ok: true` and the stamp (finding 8) |
| AC-1322 `acceptance_criterion-f713cba6` | `…test.ts:197` | aligned — bytes both directions, key carries no separator, load order = sort order, driven over both backends via `SITE_BACKENDS` (`:198`) |
| AC-1323 `acceptance_criterion-44c1d962` | `…test.ts:257` | aligned — three commands through `recordingStore`, exactly one write each, contents matched member by member, empty write asserted legal and inert |
| AC-1324 `acceptance_criterion-31f6a0c5` | `…test.ts:338` | aligned — full editing body over `makeMemorySite`; `cwd` asserted `null`; counter advances and does not move on refusal; draft renders (`:415`) |
| AC-1325 `acceptance_criterion-6a7b61e4` | `…test.ts:422` | aligned **with a narrowing** (finding 7) — one shared `applyAndAsk` over both fixtures (`:427-443`) plus assembled-definition equality (`:448-455`), but the shared body omits four of the eight items the AC enumerates. Confirmed by grep: `editL1Set` (`:387`), `editPaletteRm` (`:394`), `editAssetRm` (`:410`) and the `PreviewRenderer` render (`:415`) all sit inside AC-1324's **memory-only** test, and the two `SITE_BACKENDS` loops (`:127`, `:198`) belong to AC-1321/AC-1322 |
| AC-1326 `acceptance_criterion-d08eae5f` | `…test.ts:460` | aligned — CLI surface driven through `run([...argv,'--json'])`; refusal envelope `code`/`path`/`hint` asserted, and the same refusal through `handleBuilderRequest` as a 400 carrying the same three fields |
| AC-1327 `acceptance_criterion-16093733` | `…test.ts:561` | **gap** — all three required bullets asserted (`:568-583`), but `:585-590` re-imports the freshness claim the AC explicitly disowns and assigns to CAP-85 / AC-1033 (finding 4) |
| AC-1328 `acceptance_criterion-c8728ae8` | `test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings` — `main:tests/reconciliation-site-storage-port.workers.test.ts:30` | **partial** (finding 6) — bullet 1 fully proved (UA `:32`, `sqlite_master` read-back `:51-56`, PK enforced by the engine `:68-72`, R2 server-computed size + etag `:81-82`, metadata round trip `:87`). Bullets 3 and 4 are asserted inside **AC-1329's** test (`…test.ts:630-654`); bullet 2 (a non-Workers user agent) only under an FC name (`test_UAT_FC_REQ-141_project_routing.test.ts:25`) |
| AC-1329 `acceptance_criterion-ae2c7f77` | `test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly` — `…test.ts:595` | **gap** — Astro container render executed (`:600-608`), node config aliases/timeouts (`:612-619`), workers config Astro-free (`:623-625`), wrangler compat parity (`:630-636`), root declares no suite (`:640-643`), partition (`:647-654`). The bullet added by the ac-level repair — no *behavioural* assertion conditioned on runtime — is asserted nowhere (finding 5) |
| AC-1353 `acceptance_criterion-003caa07` | **none** | **gap** (finding 1) — no `test_UAT_AC1353_*` on `main`. Substance lives at `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` ("edit.ts imports no filesystem module") and `:115` ("the port and its model reach no filesystem") — exactly the AC's named module set, but under an FC name; the AC's third bullet (fs adapter behind a separate entry point) is unasserted in either |
| AC-1354 `acceptance_criterion-56798f01` | **none** | **gap** (finding 2) — no `test_UAT_AC1354_*`, and no test anywhere drives the assistant's tool adapter against an injected store: every toolbox driver in `main:tests` goes through `createL1Toolbox(SLUG, { cwd })` or `l1Operations(SLUG, fsOpts(cwd))`, i.e. the filesystem adapter (25+ hits, all `cwd`-based). The three construction sites exist and are singular — `git grep -a -n "fsSiteStore(" main -- tools/generate/src` returns exactly `cli/ai/toolbox.ts:505`, `cli/builder.ts:628`, `cli/index.ts:1313`, plus the factory at `store/fs-store.ts:45` — but nothing asserts that |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1353 `acceptance_criterion-003caa07` | `uat-add` | AC-1353 was **added by the ac-level fix loop (created 2026-08-20 15:43) after the reconciliation UATs were frozen** (`b18b859d7`, 05:49), and has no `test_UAT_AC1353_*` anywhere. Its substance exists at `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105,115` under a free-coded name the matrix cannot link to an AC | Add `test_UAT_AC1353_the_editing_surface_and_the_port_import_no_filesystem_module` to `tests/reconciliation-site-storage-port.test.ts`, lifting the two FC assertions (`edit.ts` free of `node:fs` / `node:path` / `../store`; `site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts` free of `from 'node:` and `./fsutil`) and **adding the missing third bullet** — that `fs-store.ts` is the only filesystem importer and sits behind its own entry point. Identify the offending module by name on failure, as the AC's Verification requires |
| 2 | violation | coverage | AC-1354 `acceptance_criterion-56798f01` | `uat-add` | AC-1354 was likewise added post-freeze (created 15:59) and has no `test_UAT_AC1354_*`. Neither the "constructed in exactly one place, nothing beneath selects" claim nor the tool-adapter end-to-end claim is asserted anywhere | Add `test_UAT_AC1354_each_entry_point_names_its_store_once_and_the_tool_adapter_edits_through_it`. Assert the three construction sites are singular (`index.ts:1313`, `builder.ts:628`, `ai/toolbox.ts:505`) and that no layer beneath them selects or falls back. Then drive `l1Operations(slug, { store: memorySiteStore() })` — `main:tools/generate/src/cli/ai/toolbox.ts:176`, which takes `EditOptions` and is reachable without the AI runtime — for: a copy edit that reads back with the change count advanced; `add_asset` from a real source file landing bytes under the given name; and `add_asset` with a non-existent source asserting `NOT_FOUND` + the path + the hint, identical to the CLI's refusal at `…test.ts:528-532` |
| 3 | violation | consistency | AC-1321 `acceptance_criterion-d4cc3712` | `uat-edit` | AC-1321's criterion names "record a change", "read the changes since a given count" and "report what the draft has pending" as three of the ten questions storage must answer totally, held and unheld. `store.appendChange`, `store.changesSince` and `store.pendingChanges` are called by **no test in the repository** — `git grep -a -n -E "appendChange\|changesSince\|pendingChanges" main -- tests` returns nothing. The `asked` array at `…test.ts:135-143` carries 7 verbs; the totality claim covers 10 | Extend `…test.ts:135-143` and the unheld-slug block at `:176-184` to ask all three over both backends: `appendChange` answers with the count it produced and leaves `counter` standing there (and for an unheld slug neither raises nor moves the counter); `changesSince` returns the records after the given count, where the counter stands, and whether the window truncated; `pendingChanges` names added/modified/removed files and the base revision — or no revision, which is what the memory adapter must report. Add all three to the `toBeInstanceOf(Promise)` list |
| 4 | violation | consistency | AC-1327 `acceptance_criterion-16093733` | `uat-edit` | `…test.ts:585-590` asserts that a copy edit made outside the builder is picked up on the next request with no restart (`expect(refreshed.body).toContain('After')` / `.not.toContain('Before')`). AC-1327's body spends a full paragraph disowning exactly this — "Nothing about the preview's *freshness* is this capability's claim to prove" — and assigns it to CAP-85 / REQ-119 / AC-1033 (`acceptance_criterion-ae33f0ab`, already `uat_coverage: pass`). The AC was narrowed across the ac-level fix loop to expel this claim; the UAT re-imports it, duplicating CAP-85's evidence inside CAP-101's evidence set | Delete `…test.ts:585-590` and the scaffolding that exists only for it — the `'Before'` argument at `:563` and the `toContain('Before')` at `:571` become a plain `seedWithPalette()`. The three bullets AC-1327 does own are already fully asserted at `:568-583` and need no change |
| 5 | violation | consistency | AC-1329 `acceptance_criterion-ae2c7f77` | `uat-edit` | The ac-level fix loop widened AC-1329 with a bullet the frozen UAT does not reach: "No *behavioural* assertion is conditioned on which runtime it runs in", with the AC-1328 routing-and-binding probes named as the deliberate exception. `test_UAT_AC1329_*` (`…test.ts:595-655`) asserts configuration contents and the file partition, and nothing about what the routed test sources assert | Add to `…test.ts:595` a scan over the routed test sources asserting no *behavioural* assertion branches on the executing runtime (no `navigator.userAgent` / `cloudflare:test` / workerd-only-global condition guarding an expectation), with the AC-1328-owned probes excluded by name: `reconciliation-site-storage-port.workers.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-141_project_routing.test.ts` |
| 6 | warning | coverage | AC-1328 `acceptance_criterion-c8728ae8` | `uat-edit` | AC-1328 has four bullets; `test_UAT_AC1328_*` proves the first (and binding *presence* at `:40-41`). Bullet 3 (the two inclusion rules partition the files) and bullet 4 (compatibility settings matching the deployed Workers) are asserted at `…test.ts:630-654` — inside **AC-1329's** test. Bullet 2 (every other file runs where a filesystem is and reports a non-Workers user agent) is asserted only at `main:tests/test_UAT_FC_REQ-141_project_routing.test.ts:25`, under an FC name. The evidence exists; it is filed under the wrong AC or under no AC | Assert `globalThis.navigator?.userAgent).not.toBe('Cloudflare-Workers')` in an AC-1328-named node-side assertion, and either move the partition/compat assertions from `…test.ts:630-654` into that test or have AC-1328's test re-assert them. AC-1329 keeps only what is genuinely its own — the Astro transform and the node config's aliases and timeouts |
| 7 | warning | coverage | AC-1325 `acceptance_criterion-6a7b61e4` | `uat-edit` | AC-1325 enumerates eight items the shared body must cover: read, write, copy edit, structured subtree round-trip, palette **rules**, asset add **and remove**, change counting, draft render. `applyAndAsk` (`…test.ts:427-440`) applies `editPaletteRename` / `editPageAdd` / `editCopySet` / `editAssetAdd` and asks six questions. Four are absent from the shared body: the structured subtree round-trip (`editL1Set` is never called there — only `editL1Get` on the seed), the palette *rules* (no refused operation), asset *removal*, and the draft render. All four exist in the file at `:387`, `:394`, `:410`, `:415` — but inside AC-1324's **memory-only** test, so they are proved over one adapter, not both | Extend `applyAndAsk` with an `editL1Set` + `editL1Get` verbatim round-trip, a refused `editPaletteRm` on a referenced entry asserted `CONFLICT` on both fixtures, an `editAssetRm` after the add, and a `new PreviewRenderer(f.store).file(f.slug,'draft','/')` render folded into the compared result. The whole point of the AC is that this body is shared, so every addition lands on both adapters at once |
| 8 | warning | consistency | AC-1321 `acceptance_criterion-d4cc3712` | `uat-edit` | AC-1321 requires that assembling the draft answers with "the errors that stopped it assembling, *reported* rather than thrown". `…test.ts:164-172` asserts only the `ok: true` branch and the stamp's equal-iff-unchanged / moves-on-change behaviour. A `loadDraft` that threw on an invalid definition would pass this test and violate the criterion | Seed a fixture with a definition that fails validation and assert `loadDraft` **resolves** with `result.ok === false` carrying the errors, rather than rejecting — over both backends |
| 9 | needs_review | coverage | `capability-c4c7a854` (whole level) | — | **Escalation, not intent ambiguity — fourth consecutive pass, zero movement.** This regression run was anchored at 2026-08-20 00:43:12 (REPORT-2277, `report-2485c83c`); the branch was cut at `0f44ef1ba` (2026-08-19 17:43); STORY-118 was created at 05:08:58 and BUNDLE-19 landed the port on `main` at `b18b859d7` (05:49) — **after the run began**. AC-1353 and AC-1354 were created *in this worktree* at 15:43 / 15:59, against modules that do not exist here. The regression therefore received this capability's **ticket store** without its **code and tests**, and the capability is not part of what this run set out to validate. Consequently all three fix loops applied 0 of 8 findings (REPORT-2476, REPORT-2478, REPORT-2480) and were right not to: authoring the tests here would go red against correct code (`HEAD:tools/generate/src/cli/edit.ts:1` imports `node:fs`) and would add a knowingly-failing suite to a branch whose purpose is to gate a fast-forward of `xgd-stable` | Operator decision, one of: **(b)** scope `capability-c4c7a854` out of regression `cb0dad9c` — it postdates the run's anchor and cannot pass at `level=uat` against a tree that predates it; **(c)** run `check_uat_validation` + `fix_uat_validation` for this capability on a branch containing the port, where all eight findings are both actionable and runnable; **(a)** resync `regression-cb0dad9c` past `b18b859d7`, which makes them actionable here but changes what the regression is testing mid-run. **(b) or (c) recommended**; (a) is the least attractive of the three on this pass, given the anchor-time evidence |
| 10 | info | exclusivity | `reconciliation-site-storage-port.test.ts` + `test_UAT_FC_REQ-142_site_store_port.test.ts` | — | The reconciliation UATs and the free-coded REQ-142 UATs overlap substantially in the same shape — both drive `SITE_BACKENDS` through read / write / copy / L1 round-trip / palette rules / assets-as-bytes, and both assert one-write-per-multi-file-command. This is the normal free-coded → reconciliation succession, not drift, and retiring the FC file is reconciliation bookkeeping rather than this check's business. Recorded so a later pass does not mistake it for duplicate coverage | none |

## Notes for the Editor

**One cause behind findings 1–5, and it is not the production code.** The reconciliation UATs
were authored against the AC set as it stood when BUNDLE-19 merged (`b18b859d7`, 05:49). The
ac-level fix loop then ran repairs between 15:43 and 16:32 that **added AC-1353 and AC-1354,
widened AC-1321, narrowed AC-1327 and widened AC-1329** — all after the tests were frozen.
Findings 1–5 map one-to-one onto those five edits. No `code-issue` was raised, deliberately:
every suggested edit is test-side, and every claim the ACs make is reachable from code that
already exists on `main`.

**One near-miss worth recording so it is not re-derived as a code bug.** `createL1Toolbox`
(`main:tools/generate/src/cli/ai/toolbox.ts:505`) spreads `opts` and *then* overrides
`store: fsSiteStore(ctxOf(opts))`, so a store handed to it is discarded. That looks like an
AC-1354 violation until you read the AC: the toolbox naming the filesystem adapter once, at
start-up, on the operator's machine is precisely what AC-1354 *requires*. The injectable seam
its Verification asks for is one level down — `l1Operations(slug, opts)` at `toolbox.ts:176`.
Finding 2 targets that, not `createL1Toolbox`.

**Ordering, when unblocked.** Finding 4 first — it is a deletion, and leaving it in keeps
CAP-85's evidence duplicated inside CAP-101's. Then 3 and 5 (extensions to existing tests), then
1 and 2 (new tests, the larger authoring jobs). Warnings 6–8 are cheap once their host tests are
open. Findings 1 and 2 are smaller than they read: AC-1353's substance already exists verbatim
under an FC name and needs lifting plus one new bullet, and every seam AC-1354 needs
(`l1Operations` at `toolbox.ts:176`, `memorySiteStore` in `store/memory-store.ts`) is exported
and reachable.

**Blocked-on.** Finding 9 gates all of it and has now survived four passes. Nothing in findings
1–8 is disputed or deferred on its merits; they are deferred on the branch. A fifth iteration
against this tree will produce this report again — the loop cannot converge without the operator
decision, and this pass adds the fact that makes the decision easier: **the capability postdates
the regression's own anchor report by four and a half hours.**
