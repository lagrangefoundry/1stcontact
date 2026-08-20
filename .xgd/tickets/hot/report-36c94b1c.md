---
uid: report-36c94b1c
id: REPORT-2517
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T20:03:27.242952+00:00'
updated_at: '2026-08-20T20:03:27.242952+00:00'
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

Twenty-second uat-level pass (`previous_attempt_count = 21`). The preceding twenty-one checks
each raised the same 5 violations + 3 warnings + 1 needs_review; all twenty-one fix loops
applied **zero** findings. Verified this pass by reading every `fix_structural_validation`
report's declaration fields for this subject: the uat-level fix series runs REPORT-2476 through
REPORT-2516, and the latest (`report-4a6467f6`, attempt 21) declares `fixes_applied: 0`,
`progress_made: false`, `violations_remaining: 5` — and states it is **past the declared budget
of 20**. That is the material change since the previous pass: the fix loop has not merely
exhausted its budget, it has now overrun it, so re-entering it cannot alter this result.

**Every finding below was re-derived from source in this call**, not carried on trust from
`report-9ca1c6ee`. Independently re-run this pass: `git rev-parse` / `git merge-base` /
`git rev-list --count` / `git merge-base --is-ancestor` for the branch geometry; `git ls-tree`
for the store modules and test inventory at both HEAD and `main`; `git grep -a` (text mode
forced — `builder.ts` / `fidelity.ts` carry NUL bytes as cache-key separators and are silently
skipped as binary otherwise) for the `test_UAT_AC13*` name index, the three journal verbs, the
`Cloudflare-Workers` user-agent assertions and the tool-adapter entry points; `git show` of
`main:tests/reconciliation-site-storage-port.test.ts` and `…workers.test.ts` read at every line
cited; all eleven AC bodies and their `created_at`/`updated_at` pulled directly; `git log` for
the three commit timestamps; and the ac-level verdict re-checked (`report-2927090b` —
`result: pass`, 0/0/0), which is what makes the AC bodies the authoritative working reference at
this level.

**All eight actionable findings survive re-verification unchanged, and finding 9 is still
unanswered — now with the fix budget not merely spent but overrun.**

## Verification environment

**This worktree (`regression-cb0dad9c`) does not contain the code under validation.**
Re-confirmed independently this pass:

| Check | Command | Result |
|---|---|---|
| HEAD | `git rev-parse --short HEAD` | `e08fce248` — advanced from `301309885`; ticket/report/workflow commits only |
| merge-base | `git merge-base HEAD main` | `0f44ef1ba` |
| `main` ahead of fork point | `git rev-list --count 0f44ef1ba..main` | **487** |
| is `main` an ancestor of HEAD | `git merge-base --is-ancestor main HEAD` | **NO** |
| store modules @ HEAD | `git ls-tree --name-only HEAD -- tools/generate/src/store/` | **8**: `base, diff, fsutil, history, index, loadSite, paths, snapshot` |
| store modules @ main | same, `main` | **14** — the same **plus** `assemble, fs-store, journal, journal-model, memory-store, site-store` |
| port tests @ HEAD | `git ls-tree -r --name-only HEAD -- tests` | **only** `tests/req22-storage.test.ts` — no `reconciliation-site-storage-port*`, no `*.workers.test.ts` of any kind, no `test_UAT_FC_REQ-14[12]_*` |
| port tests @ main | same, `main` | `reconciliation-site-storage-port.test.ts`, `…workers.test.ts`, `test_UAT_FC_REQ-141_project_routing.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-142_site_store_port.test.ts` |
| fixture helpers @ HEAD | `git ls-tree -r --name-only HEAD -- tests/support` | **only** `webui-installed.ts` |
| fixture helpers @ main | same, `main` | `builder-origin.ts`, `site-factory.ts`, `webui-installed.ts`, `wrangler-toml.ts` |

The **check** is nonetheless sound and runnable here: the matrix is global and the evidence is
readable from `main` via `git show` / `git grep <rev>`, which is how every line citation below
was obtained. It is the **repair** that has nowhere to land. See finding 9.

## Cumulative Intent Considered

Level is `uat`, so the AC bodies are the working reference — and the ac-level cycle closed clean
(`report-2927090b`, 2026-08-20T16:38:14Z, `result: pass`, 0/0/0), so no AC is treated as suspect
here. Intent was consulted only to confirm the one cross-capability ownership boundary the AC
bodies turn on (AC-1327 ↔ CAP-85) and the reconciled status of the intents behind the frozen
tests. Story `story-3f4a5f2b` (STORY-118, `story_kind: feature`, `completed`) carries
`intent_uid: bundle-77b28def`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-119 `request-64864801` | free_and_reconciled | 2026-07-31 | Request-time draft/edit renders in control-app; **owns preview freshness** under CAP-85 / AC-1033 | YES (bounds AC-1327) |
| REQ-142 `request-0dd62a5d` | free_and_reconciled | 2026-08-15 | An async `SiteStore` port with the filesystem behind it | YES |
| REQ-141 `request-b18d2056` | bundled | 2026-08-15 | Workers-runtime test project; UATs in workerd against real D1/R2 bindings | imminent — YES |
| REQ-144 `request-7bef34e0` | free_and_reconciled | 2026-08-15 | Build/deploy/smoke scripts; `[vars]` inheritance | YES (adjacent; wrangler compatibility settings) |
| BUNDLE-19 `bundle-77b28def` | free_and_reconciled | merged `b18b859d7` | Bundle carrying the above into `main`; **the moment the reconciliation UATs froze** | YES |

**The AC-edit timeline is the single cause of findings 1–5.** Commit timestamps re-read this
pass with `git log -1 --format=%cI`:

- regression `cb0dad9c` cut at `0f44ef1ba` — **2026-08-20T00:43:02Z**
- the port landed at `2b902ead0` (`feat(store): an async SiteStore port… [FREE-CODED]`) — **2026-08-20T12:21:02Z**
- BUNDLE-19 merged at `b18b859d7` (`xgd(test_fix): done`) — **2026-08-20T12:49:19Z**, when the reconciliation UATs froze

AC timestamps pulled directly from the tickets this pass:

| AC | created (UTC) | updated (UTC) | Relative to the UAT freeze |
|---|---|---|---|
| AC-1321 | 2026-08-20T05:10:13 | **2026-08-20T15:59:38** | widened after |
| AC-1327 | 2026-08-20T05:10:41 | **2026-08-20T16:32:22** | narrowed after |
| AC-1329 | 2026-08-20T05:10:51 | **2026-08-20T16:15:05** | widened after |
| AC-1353 | **2026-08-20T15:43:36** | 2026-08-20T15:43:52 | created after |
| AC-1354 | **2026-08-20T15:59:43** | 2026-08-20T16:00:06 | created after |
| AC-1322/23/24/25/26/28 | 2026-08-20T05:10:18–05:10:46 | 2026-08-20T05:24:45–05:24:47 | untouched since — all six aligned or warning-only |

The correlation is exact: the five ACs touched after the freeze are precisely the five carrying
violations; the six untouched ACs carry none.

## Alignment Ledger

Tests located by the `test_UAT_AC<number>_*` convention across all of `main:tests`
(`git grep -a -h -oE "test_UAT_AC13[0-9]+" main -- tests | sort -u`, re-run this pass): the
index runs **AC1300–AC1306, AC1317–AC1342** — **AC1321–AC1329 all present, and nothing in the
135x range anywhere.** Where an AC's substance exists only under a free-coded name
(`test_UAT_FC_REQ-14N_…`), that is **recorded but not counted as coverage** — the matrix links a
test to an AC by that convention and by nothing else.

| Element | UAT(s) found | Outcome |
|---|---|---|
| AC-1321 `acceptance_criterion-d4cc3712` | `test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld` — `…port.test.ts:126` | **gap** — read at line this pass: the `asked` array (`:135-143`) carries exactly 7 verbs (`hasDraft`, `readSiteJson`, `readPages`, `listAssets`, `readAsset`, `counter`, `loadDraft`); AC-1321 enumerates **10** non-`write` questions. `appendChange` / `changesSince` / `pendingChanges` are called by **no test in the repository** (finding 3). The unheld-slug block (`:174-183`) asks the same 7. `loadDraft`'s reported-errors branch unasserted — `:164-172` covers only `result.ok === true` (`:166`) and the stamp (`:168`, `:172`) (finding 8) |
| AC-1322 `acceptance_criterion-f713cba6` | `…port.test.ts:197` | aligned — read in full this pass (`:197-253`): page keys carry neither `/` nor `path.sep` (`:214-217`), load order = sort order (`:218-220`), asset bytes cross both directions (`:225-230`), listings are bare keys never absolute (`:232-245`), write-then-remove round-trips (`:247-251`); driven over both backends via `SITE_BACKENDS` |
| AC-1323 `acceptance_criterion-44c1d962` | `…port.test.ts:257` | aligned — read in full this pass (`:257-334`): palette rename (`:268-274`), page removal (`:300-305`) and copy edit (`:314-323`) each through `recordingStore`, exactly one write, contents matched member by member; the empty change asserted legal and inert (`:325-333`) |
| AC-1324 `acceptance_criterion-31f6a0c5` | `…port.test.ts:338` | aligned — full editing body over `makeMemorySite`; `cwd` asserted `null`; L1 round-trip, palette rules, asset add/remove, status and draft render all present (`:380-418`) |
| AC-1325 `acceptance_criterion-6a7b61e4` | `…port.test.ts:422` | aligned **with a narrowing** (warning 7) — one shared `applyAndAsk` (`:427-440`) over both fixtures, plus an assembled-definition equality check (`:445-455`), but the shared body omits four of the eight items the AC enumerates; those four sit inside AC-1324's **memory-only** test at `:387`, `:394`, `:410`, `:415` |
| AC-1326 `acceptance_criterion-d08eae5f` | `…port.test.ts:460` | aligned — CLI surface driven through `run([...argv,'--json'])`; missing-source refusal carries code + path + hint (`:550-556`); the same refusal through `handleBuilderRequest` as a 400 carrying the same three fields |
| AC-1327 `acceptance_criterion-16093733` | `…port.test.ts:561` | **drift** — the three bullets the AC owns are proved at `:567-583`; `:585-590` additionally asserts the freshness outcome the AC body spends a paragraph disowning (finding 4) |
| AC-1328 `acceptance_criterion-c8728ae8` | `…port.workers.test.ts:30` | aligned on bullet 1 (`:32`, `expect(navigator.userAgent).toBe('Cloudflare-Workers')`) and the binding half of bullet 4 (`:40-41`); bullets 2 and 3 filed elsewhere (warning 6) |
| AC-1329 `acceptance_criterion-ae2c7f77` | `…port.test.ts:595` | **gap** — read in full this pass (`:595-655`): asserts the Astro container render (`:600-608`), four configuration files (`:612-643`) and the file partition (`:645-654`); **nothing** about what the routed test sources assert (finding 5) |
| AC-1353 `acceptance_criterion-003caa07` | **none** | **gap** — no `test_UAT_AC1353_*` exists; substance present only at `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105-120` under the free-coded name `UAT_FC_REQ-142 edit.ts imports no filesystem module` (finding 1) |
| AC-1354 `acceptance_criterion-56798f01` | **none** | **gap** — no `test_UAT_AC1354_*` exists; neither half asserted anywhere (finding 2) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1353 `acceptance_criterion-003caa07` | `uat-add` | AC-1353 was created 2026-08-20T15:43:36Z, **after** the UATs froze at `b18b859d7` (12:49:19Z), and has no `test_UAT_AC1353_*` anywhere — re-confirmed against the full `test_UAT_AC13*` index this pass, which runs AC1300–AC1306 / AC1317–AC1342 and contains nothing in the 135x range. Its substance exists at `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` (`not.toMatch(/from 'node:fs'/)` at `:110`, `not.toMatch(/from '\./fsutil'/)` at `:120`) under a free-coded name the matrix cannot link to an AC. The AC's own body states why a behavioural test cannot substitute: under `nodejs_compat` the Workers runtime *resolves* a filesystem import and supplies a per-isolate filesystem, so a command still reaching for a file would pass a behavioural run and silently lose the operator's work once deployed | Add `test_UAT_AC1353_the_editing_surface_and_the_port_import_no_filesystem_module` to `tests/reconciliation-site-storage-port.test.ts`, lifting those assertions and **adding the missing third bullet** — that `fs-store.ts` is the only filesystem importer and sits behind its own entry point, so importing the port does not drag a filesystem behind it. Identify the offending module by name on failure, as the AC's Verification requires |
| 2 | violation | coverage | AC-1354 `acceptance_criterion-56798f01` | `uat-add` | AC-1354 was created 2026-08-20T15:59:43Z, likewise post-freeze, and has no `test_UAT_AC1354_*`. Neither half is asserted anywhere: not "constructed in exactly one place, nothing beneath selects", and not the tool-adapter end-to-end claim. Re-confirmed this pass — `git grep -a -n -E "l1Operations\(\|createL1Toolbox\(" main -- tests` returns **37 call sites across 13 test files**, and `git grep -a -n -E "(l1Operations\|createL1Toolbox)\([^)]*store" main -- tests` returns **zero**: every call passes `{ cwd }` or `fsOpts(cwd)`, not one passes a `store`. No test drives the tool adapter through an **injected** store | Add `test_UAT_AC1354_each_entry_point_names_its_store_once_and_the_tool_adapter_edits_through_it`. Assert the three construction sites are singular and that no layer beneath them selects or falls back. Then drive `l1Operations(slug, { store: memorySiteStore() })` — `main:tools/generate/src/cli/ai/toolbox.ts:176`, which takes `EditOptions` and constructs nothing — for: a copy edit that reads back with the change count advanced; `add_asset` from a real source file landing bytes under the given name; and `add_asset` with a non-existent source asserting `NOT_FOUND` + the path + the hint, identical to the CLI's refusal in AC-1326's test |
| 3 | violation | consistency | AC-1321 `acceptance_criterion-d4cc3712` | `uat-edit` | AC-1321 names "record a change", "read the changes since a given count" and "report what the draft has pending" as three of the ten questions storage must answer totally, held and unheld — read verbatim from the AC body this pass, and its Verification names all three explicitly. `git grep -a -l -E "appendChange\|changesSince\|pendingChanges" main -- tests` returns **nothing**, while the same command over `main -- tools/generate/src/store/` returns **five** modules (`fs-store.ts`, `index.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts`). The `asked` array at `…port.test.ts:135-143` carries 7 verbs against a totality claim covering 10, and the unheld-slug block at `:174-183` likewise | Extend `…port.test.ts:135-143` and `:174-183` to ask all three over both backends: `appendChange` answers with the count it produced and leaves `counter` standing there (and for an unheld slug neither raises nor moves the counter); `changesSince` returns the records after the given count, where the counter stands, and whether the window truncated; `pendingChanges` names added/modified/removed files and the base revision — or no revision, which is what the memory adapter must report. Add all three to the `toBeInstanceOf(Promise)` list at `:144` |
| 4 | violation | consistency | AC-1327 `acceptance_criterion-16093733` | `uat-edit` | `…port.test.ts:585-590` asserts that a copy edit made outside the builder is picked up on the next request with no restart (`expect(refreshed.body).toContain('After')` / `.not.toContain('Before')`) — read at line this pass. AC-1327's body spends a full paragraph disowning exactly this — "Nothing about the preview's *freshness* is this capability's claim to prove", naming both the operator-visible outcome and the mechanism — and assigns it to CAP-85 / REQ-119 (`request-64864801`, free_and_reconciled) / AC-1033 (`acceptance_criterion-ae33f0ab`). The ac-level cycle closed on exactly this narrowing (`report-2927090b`), so the AC body is authoritative and the test is the drifted party. An exclusivity breach across capabilities as well as a consistency one | Delete `…port.test.ts:585-590` and the scaffolding that exists only for it — the `'Before'` argument at `:563` and the `toContain('Before')` at `:571` become a plain `seedWithPalette()`. The three bullets AC-1327 does own are already fully asserted at `:567-583` and need no change |
| 5 | violation | consistency | AC-1329 `acceptance_criterion-ae2c7f77` | `uat-edit` | The ac-level fix loop widened AC-1329 at 2026-08-20T16:15:05Z with a fourth bullet the frozen UAT does not reach: "No *behavioural* assertion is conditioned on which runtime it runs in", with the AC-1328 routing-and-binding probes named as the deliberate exception; its Verification asks to assert over the routed test sources that no behavioural assertion branches on the runtime it is executing in. `test_UAT_AC1329_*` (`…port.test.ts:595-655`, read in full this pass) asserts a live Astro container render, `vitest.node.config.mts`, `vitest.workers.config.mts`, both apps' `wrangler.toml` compatibility settings, the composing `vitest.config.mts`, and the file partition — and nothing whatsoever about what the routed test sources assert | Add to `…port.test.ts:595` a scan over the routed test sources asserting no *behavioural* assertion branches on the executing runtime (no `navigator.userAgent` / `cloudflare:test` / workerd-only-global condition guarding an expectation), with the AC-1328-owned probes excluded by name: `reconciliation-site-storage-port.workers.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-141_project_routing.test.ts` |
| 6 | warning | coverage | AC-1328 `acceptance_criterion-c8728ae8` | `uat-edit` | AC-1328 has four bullets; `test_UAT_AC1328_*` (`…port.workers.test.ts:30`) proves bullet 1 (`:32`) and the binding-names half of bullet 4 (`:40-41`, asserted against the runtime rather than a config file). Bullet 3 (the two inclusion rules partition the files) and the compatibility-settings half of bullet 4 are asserted inside **AC-1329's** test (`…port.test.ts:627-654`, read this pass). Bullet 2 (every other file runs where a filesystem is and reports a non-Workers user agent) is asserted only at `main:tests/test_UAT_FC_REQ-141_project_routing.test.ts:25`, under an FC name — re-confirmed this pass by `git grep -a -n "Cloudflare-Workers" main -- tests`, which returns exactly three hits and only that one is a `not.toBe`. The evidence exists; it is filed under the wrong AC or under no AC | Assert `globalThis.navigator?.userAgent).not.toBe('Cloudflare-Workers')` in an AC-1328-named node-side assertion, and either move the compatibility-settings and partition blocks into that test or have AC-1328's test re-assert them. AC-1329 then keeps only what is genuinely its own |
| 7 | warning | coverage | AC-1325 `acceptance_criterion-6a7b61e4` | `uat-edit` | AC-1325 enumerates eight items the shared body must cover: read, write, copy edit, structured subtree round-trip, palette **rules**, asset add **and remove**, change counting, draft render. `applyAndAsk` (`…port.test.ts:427-440`, read at line this pass) applies `editPaletteRename` / `editPageAdd` / `editCopySet` / `editAssetAdd` and asks six questions (`editPageList`, `editPaletteGet`, `editL1Get`, `editConfigGet`, `editAssetList`, `counter`). Four are absent from the shared body: the structured subtree *round-trip* (`editL1Get` reads, but nothing sets and reads back verbatim), the palette *rules* (no refused operation), asset *removal*, and the draft render. All four exist in the file at `:387-388`, `:394-396`, `:410-411`, `:415-417` but inside AC-1324's **memory-only** test, so they are proved over one adapter, not both | Extend `applyAndAsk` with an `editL1Set` + `editL1Get` verbatim round-trip, a refused `editPaletteRm` on a referenced entry asserted `CONFLICT` on both fixtures, an `editAssetRm` after the add, and a `new PreviewRenderer(f.store).file(f.slug,'draft','/')` render folded into the compared result. The whole point of the AC is that this body is shared, so every addition lands on both adapters at once |
| 8 | warning | consistency | AC-1321 `acceptance_criterion-d4cc3712` | `uat-edit` | AC-1321 requires that assembling the draft answers with "the errors that stopped it assembling, *reported* rather than thrown". `…port.test.ts:164-172` asserts only the `ok: true` branch (`expect(draft!.result.ok, name).toBe(true)`, `:166`) and the stamp's equal-iff-unchanged / moves-on-change behaviour (`:168`, `:172`) — read at line this pass. A `loadDraft` that threw on an invalid definition would pass this test and violate the criterion | Seed a fixture with a definition that fails validation and assert `loadDraft` **resolves** with `result.ok === false` carrying the errors, rather than rejecting — over both backends |
| 9 | needs_review | coverage | `capability-c4c7a854` (repair of findings 1–8) | — | **Escalation, not intent ambiguity — twenty-second consecutive check, zero movement, unanswered since attempt 7, and the fix budget is now overrun.** All eight findings above are `uat-add` / `uat-edit` against `tests/reconciliation-site-storage-port.test.ts` / `…workers.test.ts`, **neither of which exists in this worktree**: the port landed on `main` at `2b902ead0` (2026-08-20T12:21:02Z, merged `b18b859d7` 12:49:19Z), **11h38m after** regression `cb0dad9c` was cut at `0f44ef1ba` (2026-08-20T00:43:02Z). `main` is 487 commits ahead of the fork point and `git merge-base --is-ancestor main HEAD` returns false — both re-run this pass. Authoring the tests here would import six store modules absent at HEAD (`site-store.ts`, `memory-store.ts`, `fs-store.ts`, `assemble.ts`, `journal.ts`, `journal-model.ts`) **and two absent fixture helpers** (`tests/support/site-factory.ts`, `tests/support/wrangler-toml.ts`), failing at collection on two counts and adding a knowingly-red suite to the branch whose sole purpose is to gate a fast-forward of `xgd-stable` — red against *correct* code. Twenty-one fix loops applied 0 of 8 and were right not to; `report-4a6467f6` records the twenty-first as running **past the declared budget of 20** | Operator decision, one of: **(c)** run `check_uat_validation` + `fix_uat_validation` for this capability on a branch at or past `b18b859d7` — a worktree already exists at `main`, so this needs no new branch and no resync; **(b)** scope `capability-c4c7a854` out of regression `cb0dad9c` — noting that the *check* is runnable here and its result is sound, so (b) only relocates the *repair*; **(a)** resync `regression-cb0dad9c` past `b18b859d7`, which makes them actionable here but changes what the regression is testing mid-run. **(c) recommended**, then (b); (a) remains least attractive |
| 10 | info | exclusivity | `reconciliation-site-storage-port.test.ts` + `test_UAT_FC_REQ-142_site_store_port.test.ts` | — | The reconciliation UATs and the free-coded REQ-142 UATs overlap substantially in the same shape — both drive `SITE_BACKENDS` through read / write / change-counting / copy / L1 round-trip / palette rules / assets-as-bytes. This is the normal free-coded → reconciliation succession, not drift, and retiring the FC file is reconciliation bookkeeping rather than this check's business. Recorded so a later pass does not mistake it for duplicate coverage | none |
| 11 | info | — | the `fix_uat_validation` self-loop for this subject | — | Recorded, not actioned: the uat-level fix series REPORT-2476 … REPORT-2516 declares `needs_more_work: true` with `progress_made: false` on **every one of its twenty-one entries**, the combination the fix prompt's own loop-semantics table defines as "exit loop", and the twenty-first ran past a stated ceiling of 20. Total fixes applied across the series: 0. Per CLAUDE.md's taxonomy a documented transition that exists but never fires is an `@error` (system bug), not a workflow failure to retry. Managing the outer workflow is outside this prompt's scope path, so this is surfaced rather than filed | Operator: consider a bug ticket for the loop-exit transition, independently of (a)/(b)/(c) above |

## Notes for the Editor

**One cause behind findings 1–5.** The reconciliation UATs were authored against the AC set as it
stood when BUNDLE-19 merged (`b18b859d7`, 12:49:19Z). The ac-level fix loop then ran repairs
between 15:43Z and 16:32Z that **created AC-1353 and AC-1354, widened AC-1321, widened AC-1329 and
narrowed AC-1327** — every one of them after the tests were frozen. Findings 1–5 map one-to-one
onto those five edits, and the six ACs untouched since 05:24Z carry no violations at all. No
`code-issue` was raised, deliberately: every suggested edit is test-side, and every claim the ACs
make is reachable from code that already exists on `main`.

**One near-miss worth recording so it is not re-derived as a code bug.** `createL1Toolbox`
(`main:tools/generate/src/cli/ai/toolbox.ts:505`) constructs
`new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })` — spreading `opts` and *then*
overriding `store`, so a store handed to it is discarded. Verified again at that line this pass.
That looks like an AC-1354 violation until you read the AC: the toolbox naming the filesystem
adapter once, at start-up, on the operator's machine is precisely what AC-1354 *requires*. The
injectable seam its Verification asks for is one level down — `l1Operations(slug, opts)` at
`toolbox.ts:176`, which takes `EditOptions` and constructs nothing. Finding 2 targets that, not
`createL1Toolbox`.

**Survey hazard, carried forward.** `builder.ts` and `fidelity.ts` embed NUL bytes as cache-key
separators, so a plain recursive grep classifies them as binary and skips them silently. Every
grep cited above forced text mode with `-a`. Any repair pass surveying consumers of the editing
surface must do the same or it will report a consumer that does not exist.

**Ordering, when unblocked.** Finding 4 first — it is a deletion, and leaving it in keeps CAP-85's
evidence duplicated inside CAP-101's. Then 3 and 5 (extensions to existing tests), then 1 and 2
(new tests, the larger authoring jobs). Warnings 6–8 are cheap once their host tests are open, and
6 is cheaper than it first appears — the binding-names half of AC-1328's bullet 4 is already in the
right test.

**The loop is provably non-convergent and has now run past its own ceiling.** Finding 9 gates all
of it, has survived twenty-two checks and twenty-one fix attempts with no operator reply on the
report chain. Per the project's failure/error taxonomy this is a **terminal failure** — an
expected dead-end requiring a graceful halt — not a recoverable failure to retry. A twenty-third
iteration against this tree will reproduce this report verbatim. The check itself is healthy and
its verdict is sound; only the repair is misrouted.
