---
uid: report-cfd653dd
id: REPORT-2475
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T16:46:51.390016+00:00'
updated_at: '2026-08-20T16:46:51.390016+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: uat
  violations: 5
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: uat

**Result**: FAIL
**Violations**: 5
**Warnings**: 3
**Needs review**: 0

First uat-level pass for this capability. The story level passed at REPORT-2463 and the ac
level at REPORT-2474 (sixth ac pass, after five fix attempts), so **AC bodies are the working
reference throughout** and intent history was consulted only where an AC's own scoping was
load-bearing for a finding (AC-1327's freshness disclaimer).

**The dominant pattern, and the reason this fails.** The reconciliation UATs were written
against the AC set as it stood when BUNDLE-19 merged (`b18b859d7`, 2026-08-20T12:49). The
ac-level fix loop then ran five repairs between 15:43 and 16:32 that **added two ACs
(AC-1353, AC-1354), widened one (AC-1321), narrowed one (AC-1327) and widened another
(AC-1329)** — all after the tests were frozen. Every violation below is a direct consequence:
the tests are aligned to the pre-repair AC set, not the current one. Nothing here suggests the
production code is wrong; four of five findings are `uat-add`/`uat-edit` against tests that
simply predate the criteria they are supposed to prove.

## Verification environment

**This worktree's HEAD (`364572cba`, branch `regression-cb0dad9c`) predates BUNDLE-19's merge
and does not contain the port at all.** `tools/generate/src/store/` here holds
`base/diff/fsutil/history/index/loadSite/paths/snapshot` and lacks `site-store.ts`,
`fs-store.ts`, `memory-store.ts`, `assemble.ts`, `journal-model.ts`; `tests/` here holds
neither `reconciliation-site-storage-port*.test.ts` nor
`test_UAT_FC_REQ-14{1,2}_*.test.ts`. Every test and source citation below was read from
`main` via `git show` / `git grep` (text mode forced, per STORY-118's survey hazard —
`builder.ts` and `fidelity.ts` carry NUL bytes and a plain recursive grep skips them
silently). `main` contains `b18b859d7`; this worktree does not.

**No test was executed.** The suite cannot run in this worktree because the code under test is
absent from it, and this check is read-only. Every finding below is therefore a claim about
what a test *asserts* versus what its AC *requires* — established by reading both — and none
is a claim that a test fails. The two findings that turn on total absence (AC-1353, AC-1354)
were established by exhaustive `git grep` over `main:tests/`, not by sampling.

## Cumulative Intent Considered

Carried forward from REPORT-2474's ledger, re-confirmed against the ticket store this pass.
STORY-118 (`story-3f4a5f2b`, `story_kind=feature`, `status=completed`) carries
`intent_uid = bundle-77b28def`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-19 (`bundle-77b28def`) | `free_and_reconciled` | 2026-08-18 | The story's intent; merged at `b18b859d7`. Nine source tickets, of which only REQ-141 and REQ-142 carry a storage or test-runtime surface | YES |
| REQ-142 (`request-0dd62a5d`) | `free_and_reconciled` | 2026-08-15 | The async `SiteStore` port: 11 async verbs, `FsSiteStore`, in-memory adapter, `edit.ts` async with `store` injected, one whole change as one `write`, unchanged CLI surface and `code`/`path`/`hint` envelopes | YES |
| REQ-141 (`request-b18d2056`) | `bundled` in BUNDLE-19 | 2026-08-15 | Workers-runtime test project: vitest split into node + workerd, real D1 (`DB`) / R2 (`SITES`) bindings, `*.workers.test.ts` routing, compat settings copied from the apps' wrangler.toml | YES |
| REQ-144 (`request-7bef34e0`) | `free_and_reconciled` | 2026-08-15 | Build/deploy/smoke scripts | YES — no store surface |
| REQ-119 (`request-64864801`) | `free_and_reconciled` | 2026-07-31 | Request-time draft/edit renders, including the render cache, its stamp-based invalidation and the per-request re-ask. Lives in CAP-85's tree as AC-1033 | YES — but **not this capability's**; load-bearing for finding 4 |
| REQ-143 (`request-18a48d63`) | `ready_to_reconcile` | 2026-08-15 | The Cloudflare SiteStore (D1 + R2 adapter) | imminent — explicitly Out of scope per STORY-118; not enforced here |
| REQ-145 / 146 / 147 / 148 | `ready_to_reconcile` / `reconciling` | 2026-08-15 | Builder move, AI host in workerd, Cloudflare Access, behavior modules in workerd | imminent — no uat-level surface here |
| REQ-149 / REQ-150 | `draft` / `free_coding` | 2026-08-17 / 18 | Cloud publish; Vite SSR server | NO |

## Alignment Ledger

Eleven ACs, all `status=active`, `kind=behavior`, `regression_only=false`. Tests located by
the `test_UAT_AC<number>_*` convention across all of `main:tests/`; where an AC's substance
exists only under a free-coded name, that is recorded rather than counted as coverage.

| Element | UAT(s) found | Outcome |
|---|---|---|
| AC-1321 `acceptance_criterion-d4cc3712` | `test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld` — `reconciliation-site-storage-port.test.ts:126` | **gap** — 7 of the 10 non-`write` questions asked; `appendChange`, `changesSince`, `pendingChanges` asked nowhere in the tree (finding 3). `loadDraft`'s reported-errors branch unasserted (finding 8) |
| AC-1322 `acceptance_criterion-f713cba6` | `…test.ts:197` | aligned — bytes both directions, key has no separator, load order = sort order, driven over both backends via `SITE_BACKENDS` |
| AC-1323 `acceptance_criterion-44c1d962` | `…test.ts:257` | aligned — all three commands asserted through `recordingStore`, exactly one write each, contents matched member by member, empty write asserted legal and inert |
| AC-1324 `acceptance_criterion-31f6a0c5` | `…test.ts:338` | aligned — full editing body over `makeMemorySite`, `cwd` asserted `null` and `opts.cwd` `undefined`, counter advance/no-advance-on-refusal, draft render |
| AC-1325 `acceptance_criterion-6a7b61e4` | `…test.ts:422` | aligned with a narrowing (finding 7) — one shared `applyAndAsk` over both fixtures plus assembled-definition equality, but the shared body omits four of the eight items the AC enumerates |
| AC-1326 `acceptance_criterion-d08eae5f` | `…test.ts:460` | aligned — real `run([...argv,'--json'])` through `1c`, all three command families, the three-field refusal envelope, the missing-source `NOT_FOUND` with exit code 3, and the same refusal through `handleBuilderRequest` as a 400 |
| AC-1327 `acceptance_criterion-16093733` | `…test.ts:561` | **drift** — bullets 1–3 asserted correctly; the test then asserts the freshness outcome the AC explicitly disclaims (finding 4) |
| AC-1328 `acceptance_criterion-c8728ae8` | `test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings` — `reconciliation-site-storage-port.workers.test.ts:30` | aligned on bullet 1 (UA, `sqlite_master` read-back, engine-enforced PK, R2 server-computed size/etag, metadata round trip); bullets 2–4 land outside an AC-1328-named test (finding 6) |
| AC-1329 `acceptance_criterion-ae2c7f77` | `test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly` — `…test.ts:595` | **gap** — bullets 1–3 asserted (Astro container executed, node config aliases/timeouts, workers config Astro-free); bullet 4 asserted nowhere (finding 5) |
| AC-1353 `acceptance_criterion-003caa07` | **none** | **violation** — no `test_UAT_AC1353_*` anywhere; substance partially present under free-coded names only (finding 1) |
| AC-1354 `acceptance_criterion-56798f01` | **none** | **violation** — no `test_UAT_AC1354_*`, and the AC's substance is asserted nowhere in the tree under any name (finding 2) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1353 `acceptance_criterion-003caa07` | uat-add | AC-1353 was created 2026-08-20T15:43 by the ac-level fix loop, after the reconciliation UATs were frozen at `b18b859d7` (12:49). No `test_UAT_AC1353_*` exists in `main:tests/`. The nearest evidence is free-coded and non-discoverable by the AC convention: `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` (`edit.ts` names no `node:fs`, `node:path`, `../store`) and `:115` (`site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts` name no `node:` module and no `./fsutil`). Those two cover the AC's first two bullets; its **third bullet is asserted nowhere** — that the filesystem-backed adapter lives behind a separate entry point, so importing the port does not drag a filesystem behind it | Add `test_UAT_AC1353_*` to `reconciliation-site-storage-port.test.ts`, reusing the two FC assertions and adding the third bullet: assert `main:tools/generate/src/store/index.ts` (the port's entry point) does not re-export or import `fs-store.ts`, and that `fs-store.ts` is reached by its own specifier |
| 2 | violation | coverage | AC-1354 `acceptance_criterion-56798f01` | uat-add | AC-1354 was created 2026-08-20T15:59, likewise after the tests were frozen. No `test_UAT_AC1354_*` exists, and unlike AC-1353 **none of its substance is asserted anywhere under any name.** `git grep` over `main:tests/` finds: no test importing `tools/generate/src/cli/ai/toolbox` that injects a store and drives an edit for this capability's purpose; no occurrence of `assetAdd`/`asset_add` in any test, so the adapter's read-the-source-file-itself behaviour and its `NOT_FOUND` envelope parity with the CLI are untested; and no assertion that the three named entry points (`cli/index.ts:1313`, `cli/builder.ts:628`, `cli/ai/toolbox.ts:505` — the three sites REPORT-2474 verified) each construct their store exactly once with no runtime selection below them | Add `test_UAT_AC1354_*`: (a) structural — assert `fsSiteStore(`/`memorySiteStore(` appear exactly once each across the three entry points and nowhere below them, so no layer detects or falls back; (b) behavioural — construct the toolbox over an injected `makeMemorySite` store, apply a copy edit, assert it reads back with the change count advanced, add an asset from a real source file and assert its bytes land under the given name, then invoke the same add with a non-existent source and assert `code`/`path`/`hint` are identical to the CLI's refusal for the same input |
| 3 | violation | consistency | AC-1321 `acceptance_criterion-d4cc3712` | uat-edit | AC-1321 (updated 2026-08-20T15:59, after the tests were frozen) enumerates eleven questions and names three of them in its Verification in terms: "including the three journal-facing ones". `test_UAT_AC1321_*` asks seven — `hasDraft`, `readSiteJson`, `readPages`, `listAssets`, `readAsset`, `counter`, `loadDraft` (`…test.ts:135-143`) — and never asks `appendChange`, `changesSince` or `pendingChanges`. Those three method names appear in **no test file in `main:tests/`**. Consequently: the "recording a change answers with the count it produced and leaves the counter standing there" claim, the "records after that count / where the counter stands / whether the window truncated" claim, the "files added, modified, removed against the revision the draft descends from" claim, the ghost-slug answers for all three ("a recorded change that neither raises nor moves a counter", "an empty set of changes standing at zero", "nothing pending against no base revision"), and the AC's own asynchrony assertion for those three are all unproven | Extend `test_UAT_AC1321_*`: add the three methods to the `asked` promise array at `…test.ts:135`; assert `appendChange` returns the produced count with `counter(slug)` standing there afterwards and never throws; assert `changesSince` returns records-after, current position and truncation flag; assert `pendingChanges` names files and the base revision (and "every file added against no base revision" on the memory adapter, per the AC's no-history clause); repeat all three against the `ghost` slug at `…test.ts:176-183` |
| 4 | violation | consistency | AC-1327 `acceptance_criterion-16093733` | uat-edit | `test_UAT_AC1327_*` asserts, at `reconciliation-site-storage-port.test.ts:585-590`, that a copy edit made outside the builder shows on the next request from the same renderer — under the comment "A change made to the draft outside the builder is picked up on the next request, with no restart". AC-1327's body (updated 16:32, the resolution of REPORT-2472's violation and the subject of five ac-level fix attempts) disclaims exactly that sentence: "Nothing about the preview's *freshness* is this capability's claim to prove — neither the operator-visible outcome (a definition changed outside the builder is what the next request shows, with no restart) nor the mechanism beneath it… All of it is CAP-85's, delivered by REQ-119 and already carried by AC-1033". AC-1033 does carry it, in the same shape: `test_UAT_AC1033_a_definition_changed_outside_the_workspace_shows_on_the_next_request` (`main:tests/reconciliation-builder-request-time-render.test.ts:271`) changes the copy outside the workspace, re-requests, asserts the new marker present and the old absent, and unwinds. The test therefore re-imports into this capability the precise claim the AC was repaired five times to expel, and duplicates another capability's UAT | Delete `…test.ts:585-590` (the `editCopySet` / `refreshed` block and its comment) from `test_UAT_AC1327_*`. The three bullets the AC does own — page renders from the given store, asset resolves to bytes plus name-derived content type, absent asset resolves to nothing — are already fully asserted at `…test.ts:568-583` and need no change. The stamp behaviour the port *does* contribute belongs to AC-1321 and is already asserted at `…test.ts:167-172` |
| 5 | violation | consistency | AC-1329 `acceptance_criterion-ae2c7f77` | uat-edit | AC-1329 (updated 2026-08-20T16:15, after the tests were frozen) carries four bullets; its fourth — "No *behavioural* assertion is conditioned on which runtime it runs in: routing decides where a test runs, never what a behavioural test claims", with the deliberate AC-1328-owned exception — has an explicit Verification sentence: "Assert over the routed test sources that no *behavioural* assertion branches on the runtime it is executing in". `test_UAT_AC1329_*` (`…test.ts:595-655`) asserts bullets 1–3 and never reads a routed test source for runtime branching. This is the bullet that keeps the split honest, and it is the one unproven | Extend `test_UAT_AC1329_*` with a source scan over `listFilesRel(tests/)`: for each `.test.ts`, assert no expectation branches on `navigator.userAgent` / a workerd-only global / `import.meta.env`-style runtime detection, excluding the AC-1328-owned probes (`reconciliation-site-storage-port.workers.test.ts`, `test_UAT_FC_REQ-141_*`). The existing partition scan at `…test.ts:647-654` already produces the file list to iterate |
| 6 | warning | coverage | AC-1328 `acceptance_criterion-c8728ae8` | uat-edit | Only bullet 1 is asserted inside `test_UAT_AC1328_*`. Bullet 2 (an unmarked file reports a non-Workers user agent) is asserted only at `main:tests/test_UAT_FC_REQ-141_project_routing.test.ts:25`, under a free-coded name. Bullets 3 (the two inclusion rules partition the files; the composing config declares no suite) and 4 (compatibility date/flags and binding names match the deployed Workers) are asserted inside `test_UAT_AC1329_*` at `…test.ts:628-654` — a test named for a different AC. The claims are all proven somewhere; the mapping from AC to named UAT is not clean, so a future coverage sweep keyed on the naming convention will under-report AC-1328 | Move the compat-settings and partition assertions from `test_UAT_AC1329_*` into `test_UAT_AC1328_*`, or add an AC-1328-named companion in the node file (the workers-marked file cannot read the repo). Add the non-Workers user-agent assertion to the node-side AC-1328 companion, which already imports `node:fs` at module scope |
| 7 | warning | coverage | AC-1325 `acceptance_criterion-6a7b61e4` | uat-edit | AC-1325 enumerates the shared body as "read, write, copy edit, structured subtree round-trip, palette rules, asset add and remove, change counting, draft render". `applyAndAsk` (`…test.ts:427-440`) applies palette rename, page add, copy set and asset add, then reads back six answers. Four enumerated items are absent from the shared body: the palette *rules* (the `CONFLICT` refusal of a referenced entry), asset **removal**, the structured-subtree **round-trip** (`editL1Set` — only `editL1Get` is asked), and the **draft render**. Those four are exercised only over the memory adapter, in `test_UAT_AC1324_*`. The AC's core — one shared body, no assertion adjusted per adapter, plus assembled-definition equality — does hold | Add `editL1Set`, an `editPaletteRm` refusal, an `editAssetRm`, and a `PreviewRenderer(f.store).file(...)` to `applyAndAsk`, so the shared body matches the list the AC enumerates. Alternatively hand `SITE_BACKENDS` to `describe.each` for the AC-1324 body, which is the shape `site-factory.ts:155` documents it for |
| 8 | warning | consistency | AC-1321 `acceptance_criterion-d4cc3712` | uat-edit | AC-1321 requires `loadDraft` to answer "the assembled-and-validated definition, **or the errors that stopped it assembling, *reported* rather than thrown**". `test_UAT_AC1321_*` asserts only the success branch (`draft!.result.ok === true`, `…test.ts:166`) and the stamp behaviour. The reported-not-thrown branch — the half of the contract that distinguishes this from a throwing assembler — is unasserted here | Seed a fixture whose page fails validation and assert `loadDraft` resolves with `result.ok === false` carrying errors, rather than rejecting |
| 9 | info | exclusivity | `test_UAT_FC_REQ-142_site_store_port.test.ts` + `reconciliation-site-storage-port.test.ts` | — | The two files overlap substantially (both drive the editing body over `SITE_BACKENDS`, both assert one-write shapes, both assert preview bytes), as do `test_UAT_FC_REQ-141_project_routing.test.ts` and `test_UAT_AC1329_*` on the vitest config strings. This is the repo-wide free-coded → reconciliation pattern (28 `test_UAT_FC_*` files coexist with their `reconciliation-*` counterparts), not drift specific to this capability, so it is recorded rather than raised. Note for finding 1: it is also why AC-1353's substance existing *only* in the FC file is a real coverage gap and not a mere naming quibble — the FC file is intent-scoped evidence, and the AC-numbered file is what the matrix reads | none |
| 10 | info | consistency | `test_UAT_AC1324_*` / `recordingStore` | — | The evidence-validity rules hold. `makeMemorySite` (`tests/support/site-factory.ts:129`) constructs the production `memorySiteStore()` and seeds it; `recordingStore` (`:182`) is a pass-through spy that delegates every write to the real inner store. No internal component is mocked anywhere in these UATs; the only doubles are absent | none |

## Notes for the Editor

**One cause, five findings.** Findings 1–5 all trace to the same event: the ac-level fix loop
mutated the AC set between 15:43 and 16:32 on 2026-08-20, after the UATs were frozen at
`b18b859d7` (12:49). Two ACs were born with no test (1, 2); one gained three questions its
test does not ask (3); one gained a bullet its test does not assert (5); one had a claim
*removed* that its test still asserts (4). An editor working these should read them as one
resynchronisation of the reconciliation UATs against the current AC set, not five unrelated
repairs.

**Finding 4 is the one to get right.** AC-1327 took five ac-level fix attempts to stop
claiming CAP-85's freshness property. If the test keeps asserting it, the capability still
*proves* the thing the AC was repaired to disown, and the next reader will reasonably
re-derive the claim from the test and re-widen the AC — the exact loop REPORT-2466 through
REPORT-2472 fought. Deleting `…test.ts:585-590` costs nothing: every bullet AC-1327 owns is
asserted above it.

**Findings 1 and 2 are not the same size.** AC-1353's substance mostly exists and needs
relabelling plus one new assertion. AC-1354's substance does not exist at all — no test in the
tree drives the assistant's tool adapter through an injected store, and `assetAdd` appears in
no test under any name. Finding 2 is genuinely new test authorship, and it is the one place in
this capability where the matrix currently claims behaviour nothing checks.

**No `code-issue` was raised, deliberately.** Every gap here is between an AC and a test.
Where a claim could be checked against `main` by reading (the eleven `SiteStore` verbs at
`tools/generate/src/store/site-store.ts:111-149`, the three entry points at `cli/index.ts:1313`
/ `cli/builder.ts:628` / `cli/ai/toolbox.ts:505`, `preview.ts`'s per-request `loadDraft`), the
production code matched what the ACs describe. Nothing observed suggests a code bug; the
suggested edits are all test-side.

**Environment caveat, repeated because it bounds every finding.** This worktree does not
contain the code or the tests under assessment; all citations are from `main`. No test was run.
If the fix loop lands edits, it must land them where `main` has the files —
`tests/reconciliation-site-storage-port.test.ts` and its `.workers` sibling do not exist on
`regression-cb0dad9c`.
