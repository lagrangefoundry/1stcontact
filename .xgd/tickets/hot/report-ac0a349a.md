---
uid: report-ac0a349a
id: REPORT-2487
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T17:54:58.795080+00:00'
updated_at: '2026-08-20T17:54:58.795080+00:00'
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

Seventh uat-level pass (`previous_attempt_count = 6`). REPORT-2475, 2477, 2479, 2481, 2483 and
2485 each raised the same 5 violations + 3 warnings + 1 needs_review; all six fix loops
(REPORT-2476, 2478, 2480, 2482, 2484, 2486) applied **zero** findings, the last three recording
`progress_made=false`.

**Every finding below was re-derived from source this pass.** Nothing was carried forward on
trust. What was actually read this pass: all 11 AC bodies from the ticket store; STORY-118's full
body; `main`'s `reconciliation-site-storage-port.test.ts` (711 lines) and `…workers.test.ts`
(98 lines), extracted with `git show` and read at the cited lines; `main`'s
`test_UAT_FC_REQ-142_site_store_port.test.ts:103-121`; AC-1033's live ticket record and its parent
story; and each absence claim re-established with `git grep -a` (text mode forced — STORY-118's
documented survey hazard: `builder.ts` and `fidelity.ts` carry NUL bytes as cache-key separators,
so a plain recursive grep classifies them binary and skips them silently).

**All eight actionable findings survive re-verification unchanged.** Nothing moved between passes:
`main` is still `bda6c9939`, merge-base with `main` is still `0f44ef1ba`; this worktree's HEAD
advanced to `d2f9e134a` by ticket/report bookkeeping only.

## Verification environment

**This worktree (`regression-cb0dad9c`) does not contain the code under validation.** Re-confirmed
independently this pass:

| Check | Result |
|---|---|
| `git rev-parse HEAD` | `d2f9e134a` |
| `git rev-parse main` | `bda6c9939` |
| `git merge-base HEAD main` | `0f44ef1ba` |
| branch point `0f44ef1ba` committed | 2026-08-20T00:43:02Z |
| port merged at `b18b859d7` | 2026-08-20T12:49:19Z — **12h06m after the cut** |
| `ls tools/generate/src/store/` (here) | `base diff fsutil history index loadSite paths snapshot` (8) |
| `git ls-tree main tools/generate/src/store/` | 14 — adds `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| storage tests here | `req22-storage.test.ts` only |
| storage tests on `main` | `reconciliation-site-storage-port.test.ts`, `…workers.test.ts`, `test_UAT_FC_REQ-142_site_store_port.test.ts` |
| `tools/generate/src/cli/edit.ts` at HEAD, lines 1, 2, 24 | `import { copyFileSync, writeFileSync } from 'node:fs'` / `import path from 'node:path'` / `import type { Root, StoreContext } from '../store'` — all three of AC-1353's prohibitions genuinely present here |

Every citation below is therefore `main:<path>:<line>`.

**No test was executed.** The modules under test are absent from this tree and this check is
read-only. Every finding is a claim about what a test *asserts* versus what its AC *requires*,
established by reading both. **None is a claim that a test fails.**

## Cumulative Intent Considered

Level cascade honoured: story level passed at REPORT-2463, ac level at REPORT-2474, so **AC bodies
are the working reference throughout**. Intent history was consulted only where an AC's own scoping
is load-bearing (AC-1327's freshness disclaimer, finding 4). STORY-118 (`story-3f4a5f2b`,
`story_kind=feature`, `status=completed`) carries `intent_uid = bundle-77b28def` and 11 ACs, all
`status=active`, all `kind=behavior`, all `regression_only=false`, none carrying `uat_coverage`
(re-confirmed this pass across all 11).

| Intent ID | Status | When (UTC) | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-19 (`bundle-77b28def`) | `free_and_reconciled` | 2026-08-18 | The story's intent; `merged_at_commit = b18b859d7414a049be45e09f48426d73742e5bf2` (re-verified). Nine source tickets, of which only REQ-141 and REQ-142 carry a storage or test-runtime surface | YES |
| REQ-142 (`request-0dd62a5d`) | `free_and_reconciled` | 2026-08-15 | "An async SiteStore port, with the filesystem behind it" — async verbs, `FsSiteStore`, in-memory adapter, `edit.ts` async with `store` injected, one whole change as one `write`, unchanged CLI surface and `code`/`path`/`hint` envelopes | YES |
| REQ-141 (`request-b18d2056`) | `bundled` in BUNDLE-19 | 2026-08-15 | "Workers-runtime test project: UATs that run inside workerd against real D1 and R2 bindings" — vitest split into node + workerd, `DB` / `SITES` bindings, `*.workers.test.ts` routing, compat settings copied from the apps' wrangler.toml | YES |
| REQ-144 (`request-7bef34e0`) | `free_and_reconciled` | 2026-08-15 | Build/deploy/smoke scripts | YES — no store surface |
| REQ-119 (`request-64864801`) | `free_and_reconciled` | 2026-07-31 | Request-time draft/edit renders, incl. the render cache and its stamp-based invalidation. Lives in CAP-85's tree as AC-1033 (`acceptance_criterion-ae33f0ab`, parent STORY-99 `story-e674c60a`, `capability_uid = capability-a994b8f3`, `uat_coverage: pass`) | YES — but **not this capability's**; load-bearing for finding 4 |
| REQ-143 (`request-18a48d63`) | `ready_to_reconcile` | 2026-08-15 | The Cloudflare SiteStore (D1 + R2 adapter) | imminent — explicitly Out of scope per STORY-118; not enforced here |
| REQ-145 / 146 / 147 / 148 | `ready_to_reconcile` / `reconciling` | 2026-08-15 | Builder move, AI host in workerd, Cloudflare Access, behavior modules in workerd | imminent — no uat-level surface here |
| REQ-149 / REQ-150 | `draft` / `free_coding` | 2026-08-17 / 18 | Cloud publish; Vite SSR server | NO |

## Alignment Ledger

Tests located by the `test_UAT_AC<number>_*` convention across all of `main:tests/`. Re-run this
pass: `git grep -a -h -o -E "test_UAT_AC13[0-9][0-9]_…" main -- tests` yields AC1300–AC1342, with
**AC1321–AC1329 present and no AC1353 / AC1354 anywhere**. Where an AC's substance exists only
under a free-coded name (`UAT_FC_REQ-14N …`), that is **recorded but not counted as coverage** —
the matrix links a test to an AC by that convention and by nothing else.

| Element | UAT(s) found | Outcome |
|---|---|---|
| AC-1321 `acceptance_criterion-d4cc3712` | `test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld` — `…test.ts:126` | **gap** — the `asked` array (`:135-143`) carries 7 verbs (`hasDraft`, `readSiteJson`, `readPages`, `listAssets`, `readAsset`, `counter`, `loadDraft`); AC-1321 enumerates 10 non-`write` questions. `appendChange` / `changesSince` / `pendingChanges` are called by **no test in the repository** (finding 3). `loadDraft`'s reported-errors branch unasserted — `:164-172` covers only `ok: true` and the stamp (finding 8) |
| AC-1322 `acceptance_criterion-f713cba6` | `…test.ts:197` | aligned — bytes both directions (`:225-231`), key carries no separator (`:214-217`), load order = sort order (`:218-220`), surface listing names no location (`:241-245`), write+remove as bytes (`:248-251`); driven over both backends via `SITE_BACKENDS` (`:198`) |
| AC-1323 `acceptance_criterion-44c1d962` | `…test.ts:257` | aligned — palette rename (`:264-274`), page removal (`:294-305`) and copy edit each through `recordingStore`, exactly one write, contents matched member by member; empty write asserted legal and inert |
| AC-1324 `acceptance_criterion-31f6a0c5` | `…test.ts:338` | aligned — full editing body over `makeMemorySite`; `cwd` asserted `null` and `opts.cwd` `undefined` (`:345-346`); counter advances (`:356`, `:363`) and does not move on refusal (`:366-369`); draft renders (`:415-417`) |
| AC-1325 `acceptance_criterion-6a7b61e4` | `…test.ts:422` | aligned **with a narrowing** (finding 7) — one shared `applyAndAsk` over both fixtures (`:427-443`) plus assembled-definition equality (`:448-455`), but the shared body applies only `editPaletteRename` / `editPageAdd` / `editCopySet` / `editAssetAdd` and omits four of the eight items the AC enumerates. Re-confirmed by reading: `editL1Set` (`:387`), the refused `editPaletteRm` (`:394`), `editAssetRm` (`:410`) and the `PreviewRenderer` render (`:415`) all sit inside AC-1324's **memory-only** test |
| AC-1326 `acceptance_criterion-d08eae5f` | `…test.ts:460` | aligned — CLI surface driven through `run([...argv,'--json'])`; `copy set/get`, five palette and five asset commands (`:494-521`); missing-source refusal `NOT_FOUND` + path + hint + exit 3 (`:526-533`); the same refusal through `handleBuilderRequest` as a 400 carrying the same three fields (`:547-556`) |
| AC-1327 `acceptance_criterion-16093733` | `…test.ts:561` | **gap** — all three required bullets asserted (`:568-583`), but `:585-590` re-imports the freshness claim the AC explicitly disowns and assigns to CAP-85 / AC-1033 (finding 4) |
| AC-1328 `acceptance_criterion-c8728ae8` | `test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings` — `…workers.test.ts:30` | **partial** (finding 6) — bullet 1 fully proved (UA `:32`, `sqlite_master` read-back `:51-56`, PK enforced by the engine `:68-72`, R2 server-computed size + etag `:81-82`, metadata round trip `:87`); binding names proved `:40-41` against the live runtime, deliberately (the file's own comment at `:35-39` says so). Bullet 3 and the compatibility half of bullet 4 are asserted inside **AC-1329's** test (`…test.ts:647-654`, `:630-636`); bullet 2 only under an FC name (`main:tests/test_UAT_FC_REQ-141_project_routing.test.ts:25`) |
| AC-1329 `acceptance_criterion-ae2c7f77` | `test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly` — `…test.ts:595` | **gap** — Astro container render executed (`:600-608`), node config aliases/timeouts (`:612-619`), workers config Astro-free (`:623-625`), wrangler compat parity (`:630-636`), root declares no suite (`:640-643`), partition (`:647-654`). The bullet added by the ac-level repair — no *behavioural* assertion conditioned on runtime — is asserted nowhere (finding 5) |
| AC-1353 `acceptance_criterion-003caa07` | **none** | **gap** (finding 1) — no `test_UAT_AC1353_*` on `main`. Substance lives at `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:104` (`edit.ts` free of `node:fs` / `node:path` / `../store`) and `:115-121` (over exactly `site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts`, each `expect(source, name)` so the offender is named) — the AC's module set, under an FC name. The AC's third bullet (fs adapter behind a separate entry point) is unasserted in either |
| AC-1354 `acceptance_criterion-56798f01` | **none** | **gap** (finding 2) — no `test_UAT_AC1354_*`, and no test anywhere drives the assistant's tool adapter against an injected store. Re-verified: every toolbox driver in `main:tests` reaches `createL1Toolbox(...)` / `l1Operations(...)` with a `cwd`-shaped options object; none passes a `store`. The three construction sites exist and are singular — `git grep -a -n "fsSiteStore(" main -- tools/generate/src` returns exactly `cli/ai/toolbox.ts:505`, `cli/builder.ts:628`, `cli/index.ts:1313`, plus the factory at `store/fs-store.ts:45` — but nothing asserts that |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1353 `acceptance_criterion-003caa07` | `uat-add` | AC-1353 was added by the ac-level fix loop (created 2026-08-20 15:43:36 UTC) **after** the reconciliation UATs were frozen at `b18b859d7` (12:49 UTC), and has no `test_UAT_AC1353_*` anywhere. Its substance exists at `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:104,115` under a free-coded name the matrix cannot link to an AC | Add `test_UAT_AC1353_the_editing_surface_and_the_port_import_no_filesystem_module` to `tests/reconciliation-site-storage-port.test.ts`, lifting the two FC assertions (`edit.ts` free of `node:fs` / `node:path` / `../store`; `site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts` free of `from 'node:` and `./fsutil`) and **adding the missing third bullet** — that `fs-store.ts` is the only filesystem importer and sits behind its own entry point. Identify the offending module by name on failure, as the AC's Verification requires (the FC version already does this via `expect(source, name)`) |
| 2 | violation | coverage | AC-1354 `acceptance_criterion-56798f01` | `uat-add` | AC-1354 was likewise added post-freeze (created 15:59:43 UTC) and has no `test_UAT_AC1354_*`. Neither half is asserted anywhere: not "constructed in exactly one place, nothing beneath selects", and not the tool-adapter end-to-end claim | Add `test_UAT_AC1354_each_entry_point_names_its_store_once_and_the_tool_adapter_edits_through_it`. Assert the three construction sites are singular (`index.ts:1313`, `builder.ts:628`, `ai/toolbox.ts:505`) and that no layer beneath them selects or falls back. Then drive `l1Operations(slug, { store: memorySiteStore() })` — `main:tools/generate/src/cli/ai/toolbox.ts:176`, which takes `EditOptions` and is reachable without the AI runtime — for: a copy edit that reads back with the change count advanced; `add_asset` from a real source file landing bytes under the given name; and `add_asset` with a non-existent source asserting `NOT_FOUND` + the path + the hint, identical to the CLI's refusal at `…test.ts:526-533` |
| 3 | violation | consistency | AC-1321 `acceptance_criterion-d4cc3712` | `uat-edit` | AC-1321 names "record a change", "read the changes since a given count" and "report what the draft has pending" as three of the ten questions storage must answer totally, held and unheld — and its Verification says so in terms ("including the three journal-facing ones"). Re-verified this pass: `git grep -a -n -E "appendChange\|changesSince\|pendingChanges" main -- tests` returns **zero hits**, while the same grep over `main -- tools/generate/src` returns 20 (declared at `store/site-store.ts:137,143,146`, called by `cli/edit.ts:116,2153,2184`, implemented in both adapters). The `asked` array at `…test.ts:135-143` carries 7 verbs against a totality claim covering 10, and the unheld-slug block at `:176-184` likewise | Extend `…test.ts:135-143` and `:176-184` to ask all three over both backends: `appendChange` answers with the count it produced and leaves `counter` standing there (and for an unheld slug neither raises nor moves the counter); `changesSince` returns the records after the given count, where the counter stands, and whether the window truncated; `pendingChanges` names added/modified/removed files and the base revision — or no revision, which is what the memory adapter must report. Add all three to the `toBeInstanceOf(Promise)` list at `:144` |
| 4 | violation | consistency | AC-1327 `acceptance_criterion-16093733` | `uat-edit` | `…test.ts:585-590` asserts that a copy edit made outside the builder is picked up on the next request with no restart (`expect(refreshed.body).toContain('After')` / `.not.toContain('Before')`). AC-1327's body spends a full paragraph disowning exactly this — "Nothing about the preview's *freshness* is this capability's claim to prove", naming both the operator-visible outcome and the mechanism — and assigns it to CAP-85 / REQ-119 / AC-1033. Re-verified this pass from the live ticket: AC-1033 (`acceptance_criterion-ae33f0ab`) is `active`, carries `uat_coverage: pass`, sits under STORY-99 (`story-e674c60a`, `capability_uid = capability-a994b8f3` = CAP-85), and its **title** is that claim verbatim — "A definition changed outside the workspace is shown on the next request, with no render step and no restart — and unwinds the same way". This is categorical, not inferential: the assertion at `:585-590` is that sentence, executed, under CAP-101's name. An exclusivity breach as well as a consistency one | Delete `…test.ts:585-590` and the scaffolding that exists only for it — the `'Before'` argument at `:563` and the `toContain('Before')` at `:571` become a plain `seedWithPalette()`. The three bullets AC-1327 does own are already fully asserted at `:568-583` and need no change |
| 5 | violation | consistency | AC-1329 `acceptance_criterion-ae2c7f77` | `uat-edit` | The ac-level fix loop widened AC-1329 with a fourth bullet the frozen UAT does not reach: "No *behavioural* assertion is conditioned on which runtime it runs in", with the AC-1328 routing-and-binding probes named as the deliberate exception, and its Verification asking for a scan "over the routed test sources". `test_UAT_AC1329_*` (`…test.ts:595-655`) asserts a live Astro render, four configuration files' contents and the file partition — and nothing whatsoever about what the routed test sources assert | Add to `…test.ts:595` a scan over the routed test sources asserting no *behavioural* assertion branches on the executing runtime (no `navigator.userAgent` / `cloudflare:test` / workerd-only-global condition guarding an expectation), with the AC-1328-owned probes excluded by name: `reconciliation-site-storage-port.workers.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-141_project_routing.test.ts` |
| 6 | warning | coverage | AC-1328 `acceptance_criterion-c8728ae8` | `uat-edit` | AC-1328 has four bullets; `test_UAT_AC1328_*` proves bullet 1 and the binding-names half of bullet 4 (`…workers.test.ts:40-41`). Bullet 3 (the two inclusion rules partition the files, `…test.ts:647-654`) and the compatibility-settings half of bullet 4 (`…test.ts:630-636`) are asserted inside **AC-1329's** test. Bullet 2 (every other file runs where a filesystem is and reports a non-Workers user agent) is asserted only at `main:tests/test_UAT_FC_REQ-141_project_routing.test.ts:25`, under an FC name — re-verified: the only three `userAgent` assertions in `main:tests` are that one plus the two workerd-side ones. The evidence exists; it is filed under the wrong AC or under no AC | Assert `globalThis.navigator?.userAgent).not.toBe('Cloudflare-Workers')` in an AC-1328-named node-side assertion, and either move `…test.ts:630-636` + `:647-654` into that test or have AC-1328's test re-assert them. AC-1329 then keeps only what is genuinely its own — the Astro transform, the node config's aliases and timeouts, and the workers config's absence of Astro |
| 7 | warning | coverage | AC-1325 `acceptance_criterion-6a7b61e4` | `uat-edit` | AC-1325 enumerates eight items the shared body must cover: read, write, copy edit, structured subtree round-trip, palette **rules**, asset add **and remove**, change counting, draft render. `applyAndAsk` (`…test.ts:427-440`) applies `editPaletteRename` / `editPageAdd` / `editCopySet` / `editAssetAdd` and asks six questions. Four are absent from the shared body: the structured subtree round-trip (`editL1Set` is never called there — only `editL1Get` on the seed, at `:435`), the palette *rules* (no refused operation), asset *removal*, and the draft render. All four exist in the file at `:387`, `:394`, `:410`, `:415` — but inside AC-1324's **memory-only** test, so they are proved over one adapter, not both | Extend `applyAndAsk` with an `editL1Set` + `editL1Get` verbatim round-trip, a refused `editPaletteRm` on a referenced entry asserted `CONFLICT` on both fixtures, an `editAssetRm` after the add, and a `new PreviewRenderer(f.store).file(f.slug,'draft','/')` render folded into the compared result. The whole point of the AC is that this body is shared, so every addition lands on both adapters at once |
| 8 | warning | consistency | AC-1321 `acceptance_criterion-d4cc3712` | `uat-edit` | AC-1321 requires that assembling the draft answers with "the errors that stopped it assembling, *reported* rather than thrown". `…test.ts:164-172` asserts only the `ok: true` branch (`:166`) and the stamp's equal-iff-unchanged / moves-on-change behaviour (`:168`, `:172`). A `loadDraft` that threw on an invalid definition would pass this test and violate the criterion | Seed a fixture with a definition that fails validation and assert `loadDraft` **resolves** with `result.ok === false` carrying the errors, rather than rejecting — over both backends |
| 9 | needs_review | coverage | `capability-c4c7a854` (repair of findings 1–8) | — | **Escalation, not intent ambiguity — seventh consecutive pass, zero movement.** All eight findings above are `uat-add` / `uat-edit` against `tests/reconciliation-site-storage-port.test.ts`, which does not exist in this worktree: the port landed on `main` at `b18b859d7` (2026-08-20 12:49:19 UTC), **12h06m after** regression `cb0dad9c`'s branch was cut at `0f44ef1ba` (2026-08-20 00:43:02 UTC — both re-derived from `%cI` this pass). Authoring the tests here would import absent modules, failing at collection and adding a knowingly-red suite to the branch whose sole purpose is to gate a fast-forward of `xgd-stable` — red against *correct* code. Re-verified directly this pass: `HEAD:tools/generate/src/cli/edit.ts:1,2,24` is `import { copyFileSync, writeFileSync } from 'node:fs'`, `import path from 'node:path'`, `import type { Root, StoreContext } from '../store'` — so **all three** of AC-1353's first bullet's prohibitions are genuinely false in this tree, not merely unevidenced. Six fix loops applied 0 of 8 and were right not to | Operator decision, one of: **(c)** run `check_uat_validation` + `fix_uat_validation` for this capability on a branch at or past `b18b859d7`, where all eight findings are both actionable and runnable; **(b)** scope `capability-c4c7a854` out of regression `cb0dad9c` — noting that the *check* is runnable here and its result is sound, so (b) only relocates the *repair*; **(a)** resync `regression-cb0dad9c` past `b18b859d7`, which makes them actionable here but changes what the regression is testing mid-run. **(c) recommended**, then (b); (a) remains least attractive |
| 10 | info | exclusivity | `reconciliation-site-storage-port.test.ts` + `test_UAT_FC_REQ-142_site_store_port.test.ts` | — | The reconciliation UATs and the free-coded REQ-142 UATs overlap substantially in the same shape — both drive `SITE_BACKENDS` through read / write / change-counting / copy / L1 round-trip / palette rules / assets-as-bytes. This is the normal free-coded → reconciliation succession, not drift, and retiring the FC file is reconciliation bookkeeping rather than this check's business. Recorded so a later pass does not mistake it for duplicate coverage | none |

## Notes for the Editor

**One cause behind findings 1–5, and it is not the production code.** The reconciliation UATs were
authored against the AC set as it stood when BUNDLE-19 merged (`b18b859d7`, 12:49 UTC). The
ac-level fix loop then ran repairs between 15:43 and 16:32 that **added AC-1353 and AC-1354,
widened AC-1321, narrowed AC-1327 and widened AC-1329** — all after the tests were frozen. Findings
1–5 map one-to-one onto those five edits. No `code-issue` was raised, deliberately: every suggested
edit is test-side, and every claim the ACs make is reachable from code that already exists on
`main`.

**One near-miss worth recording so it is not re-derived as a code bug.** `createL1Toolbox`
(`main:tools/generate/src/cli/ai/toolbox.ts:505`) constructs
`new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })` — spreading `opts` and *then*
overriding `store`, so a store handed to it is discarded. That looks like an AC-1354 violation until
you read the AC: the toolbox naming the filesystem adapter once, at start-up, on the operator's
machine is precisely what AC-1354 *requires*. The injectable seam its Verification asks for is one
level down — `l1Operations(slug, opts)` at `toolbox.ts:176`. Finding 2 targets that, not
`createL1Toolbox`. This also explains why the `createL1Toolbox` call sites in `main:tests` are not
evidence for AC-1354 even though several pass an options object: whatever they pass, the store is
overridden.

**Ordering, when unblocked.** Finding 4 first — it is a deletion, and leaving it in keeps CAP-85's
evidence duplicated inside CAP-101's. Then 3 and 5 (extensions to existing tests), then 1 and 2
(new tests, the larger authoring jobs). Warnings 6–8 are cheap once their host tests are open, and
6 is cheaper than it first appears — the binding-names half of AC-1328's bullet 4 is already in the
right test.

**Blocked-on, and the loop's convergence.** Finding 9 gates all of it and has now survived seven
passes. Nothing in findings 1–8 is disputed or deferred on its merits; they are deferred on the
branch. This check is deterministic and its inputs have not changed: an eighth iteration against
this tree will reproduce this report verbatim. The loop cannot converge without the operator
decision above — the fix side has no lever it has not already tried and correctly rejected
(authoring red-at-collection tests, or setting `uat_coverage` to manufacture movement, which is
`check`/`fix_uat_coverage`'s field and not this loop's to write).
