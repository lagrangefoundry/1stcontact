---
uid: report-4d8dff89
id: REPORT-2523
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T20:34:16.676759+00:00'
updated_at: '2026-08-20T20:34:16.676759+00:00'
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

Twenty-fifth uat-level pass (`previous_attempt_count = 24`). **Nothing material changed in the
tree this pass.** Attempt 24 (`report-81f46661`, REPORT-2522) reported `fixes_applied: 0`,
`progress_made: false`, `needs_more_work: true`, `violations_remaining: 5`. **Cumulative fixes
applied across all 24 attempts: 0.**

**Every finding below was re-derived from source in this call**, not carried from
`report-d67a1e8a`. Re-run independently this pass: `git worktree list`;
`git merge-base HEAD main`; `git ls-files` over the store modules, `tests/support/`,
`tests/` and the vitest/wrangler configs at HEAD; `git log -1 --format=%cI` on the three
geometry commits; `git grep -l` for the AC-named UATs on `main`, `xgd-working` and HEAD;
recursive `grep -a` (text mode forced — `builder.ts` / `fidelity.ts` embed NUL bytes as
cache-key separators and are silently skipped as binary otherwise) for the `test_UAT_AC13*`
name index, the `test_UAT_AC135*` range, the three journal verbs, the `Cloudflare-Workers`
assertions and `l1Operations` / `fsSiteStore`; a full `Read` of **both**
`main:tests/reconciliation-site-storage-port.test.ts` (711 lines) and
`…workers.test.ts` (98 lines); all eleven AC bodies pulled in full; and the ac-level verdict
re-checked (`report-2927090b` / REPORT-2474 — `report_kind: capability_validation`,
`level: ac`, `result: pass`, 0/0/0, created 2026-08-20T16:38:14Z, i.e. **after** every AC
edit), which is what makes the AC bodies the authoritative working reference at this level.

**Every line citation below was verified at its stated line this pass**; `main` has not moved
this file since attempt 24 (line numbers are unchanged). **All eight actionable findings
survive re-verification unchanged; finding 9 remains unanswered.**

## Verification environment

**This worktree (`regression-cb0dad9c`) does not contain the code under validation.**
Re-confirmed independently this pass:

| Check | Command | Result |
|---|---|---|
| HEAD | `git log --oneline -1` | `2254af364` — `Workflow fix_uat_validation completed: done`; ticket/report/workflow commits only |
| merge-base | `git merge-base HEAD main` | `0f44ef1ba` |
| HEAD vs main | `git merge-base --is-ancestor HEAD main` | HEAD is **not** an ancestor of `main` |
| port tests @ HEAD | `git ls-files -- tests \| grep -iE 'storage\|store\|workers'` | `tests/req22-storage.test.ts` only; **no** `reconciliation-site-storage-port*`, **no** `*.workers.test.ts` of any kind |
| port tests @ `main` | `git grep -l test_UAT_AC1321 main -- tests` | `tests/reconciliation-site-storage-port.test.ts` (also present on `xgd-working`) |
| fixture helpers @ HEAD | `git ls-files -- tests/support` | **only** `webui-installed.ts` |
| store modules @ HEAD | `git ls-files \| grep -iE 'site-store\|memory-store\|fs-store\|store/assemble\|journal'` | **one** hit, unrelated: `apps/public-site/src/site-store.ts`. None of `tools/generate/src/store/{site-store,memory-store,fs-store,assemble,journal,journal-model}.ts` exists |
| runtime split @ HEAD | `git ls-files \| grep -iE 'vitest\|wrangler'` | a **single** `vitest.config.mts` (plus the two apps' `wrangler.toml`). `vitest.node.config.mts` / `vitest.workers.config.mts` do not exist |
| AC-named tests @ HEAD | `grep -ral -E 'test_UAT_AC13(2[1-9]\|5[34])' .` | hits in `.xgd/tickets/**` only — **no source file on this branch names any of them** |
| test commit reachability | `git merge-base --is-ancestor c36402287 HEAD` | **false** — the commit that added the port UATs to `main` is not in this branch |
| `main` worktree | `git worktree list` | **present** at `/Users/martin/.xgd/worktrees/…/main` → `bda6c9939` |

So on **this** branch every one of the eleven ACs has zero UATs. The **check** is nonetheless
sound and runnable here — the matrix is global and the evidence is readable from `main`, where a
worktree is already checked out, which is how every line citation below was obtained. Counting
eleven coverage violations against this branch instead of five against the evidence would be a
less accurate description of the matrix's true state and no more repairable. It is the **repair**
that has nowhere to land. See finding 9.

## Cumulative Intent Considered

Level is `uat`, so the AC bodies are the working reference — and the ac-level cycle closed clean
(`report-2927090b`, `result: pass`, 0/0/0, created after every AC edit), so no AC is treated as
suspect here. Intent was consulted only to confirm the one cross-capability ownership boundary
the AC bodies turn on (AC-1327 ↔ CAP-85) and the reconciled status of the intents behind the
frozen tests. Story `story-3f4a5f2b` (STORY-118, `story_kind: feature`, `completed`) carries
`intent_uid: bundle-77b28def`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-119 `request-64864801` | free_and_reconciled | 2026-07-31 | Request-time draft/edit renders in control-app; **owns preview freshness** under CAP-85 / AC-1033 | YES (bounds AC-1327) |
| REQ-142 `request-0dd62a5d` | free_and_reconciled | 2026-08-15 | An async `SiteStore` port, with the filesystem behind it | YES |
| REQ-141 `request-b18d2056` | bundled | 2026-08-15 | Workers-runtime test project; UATs in workerd against real D1/R2 bindings | imminent — YES |
| REQ-144 `request-7bef34e0` | free_and_reconciled | 2026-08-15 | Build/deploy/smoke scripts; `[vars]` inheritance | YES (adjacent; wrangler compatibility settings) |
| BUNDLE-19 `bundle-77b28def` | free_and_reconciled | created 2026-08-18, merged `b18b859d7` | Bundle carrying the above into `main`; **the moment the reconciliation UATs froze** | YES |

**The AC-edit timeline is the single cause of findings 1–5.** Branch geometry, re-derived this
pass from `git log -1 --format=%cI` (times normalised to UTC):

- regression `cb0dad9c` cut at `0f44ef1ba` — **2026-08-20T00:43:02Z**
- the port landed at `2b902ead0` (`feat(store): an async SiteStore port…[FREE-CODED]`) — **2026-08-20T12:21:02Z**
- BUNDLE-19 merged at `b18b859d7` — **2026-08-20T12:49:19Z**, when the reconciliation UATs froze

The five ACs edited or created after that freeze (AC-1321 widened 15:59Z, AC-1327 narrowed
16:32Z, AC-1329 widened 16:15Z, AC-1353 created 15:43Z, AC-1354 created 15:59Z) are **exactly**
the five carrying violations. The six ACs untouched since 05:24Z carry none.

## Alignment Ledger

Tests located by the `test_UAT_AC<number>_*` convention across all of `main:tests`
(`grep -raoh -E "test_UAT_AC13[0-9][0-9]" tests | sort -u`, re-run this pass): the index runs
AC1300–AC1306, AC1317–AC1342 — AC1321–AC1329 all present, and
`grep -rah -oE "test_UAT_AC135[0-9]" tests` returns **nothing**, on `main` or anywhere else.
Where an AC's substance exists only under a free-coded name (`test_UAT_FC_REQ-14N_…`), that is
**recorded but not counted as coverage** — the matrix links a test to an AC by that convention
and by nothing else.

| Element | UAT(s) found | Outcome |
|---|---|---|
| AC-1321 `acceptance_criterion-d4cc3712` | `…port.test.ts:126` | **gap** — read at line this pass: the `asked` array (`:135-143`) carries exactly 7 verbs (`hasDraft`, `readSiteJson`, `readPages`, `listAssets`, `readAsset`, `counter`, `loadDraft`); AC-1321 enumerates **10** non-`write` questions. The unheld-slug block (`:177-183`) asks the same 7. `loadDraft`'s reported-errors branch unasserted — `:164-172` covers only `result.ok === true` (`:166`) and the stamp (`:168`, `:172`) (finding 8) |
| AC-1322 `acceptance_criterion-f713cba6` | `…port.test.ts:197` | aligned — keys carry no separator (`:215-217`), load order is sort order (`:219-220`), bytes round-trip both ways (`:225-251`), over both backends |
| AC-1323 `acceptance_criterion-44c1d962` | `…port.test.ts:257` | aligned — `recordingStore` proves one write per command with exact contents (`:268-323`); empty change legal (`:332`) |
| AC-1324 `acceptance_criterion-31f6a0c5` | `…port.test.ts:338` | aligned — full editing body over `makeMemorySite`; `cwd` asserted `null` (`:345-346`) |
| AC-1325 `acceptance_criterion-6a7b61e4` | `…port.test.ts:422` | aligned **with a narrowing** (warning 7) — one shared `applyAndAsk` (`:427-440`) over both fixtures plus an assembled-definition equality check (`:445-455`), but the shared body applies 4 edits and asks 6 questions against the AC's eight enumerated items |
| AC-1326 `acceptance_criterion-d08eae5f` | `…port.test.ts:460` | aligned — CLI surface driven through `run([...argv,'--json'])`; missing-source refusal carries code + path + hint (`:528-532`) and the builder route returns the same three in a 400 (`:551-556`) |
| AC-1327 `acceptance_criterion-16093733` | `…port.test.ts:561` | **drift** — the three bullets the AC owns are proved at `:567-583`; `:585-590` additionally asserts the freshness outcome the AC body spends a paragraph disowning (finding 4) |
| AC-1328 `acceptance_criterion-c8728ae8` | `…port.workers.test.ts:30` | aligned on bullet 1 (`:32-33`) and the binding-names half of bullet 4 (`:40-41`), with real D1/R2 round trips (`:45-93`); bullets 2 and 3 filed elsewhere (warning 6) |
| AC-1329 `acceptance_criterion-ae2c7f77` | `…port.test.ts:595` | **gap** — read in full this pass (`:595-655`): asserts the Astro container render (`:600-608`), four configuration files (`:612-643`) and the file partition (`:645-654`); **nothing** about what the routed test sources assert (finding 5) |
| AC-1353 `acceptance_criterion-003caa07` | **none** | **gap** — no `test_UAT_AC1353_*` exists on any branch; substance present only at `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105,115` under a free-coded name (finding 1) |
| AC-1354 `acceptance_criterion-56798f01` | **none** | **gap** — no `test_UAT_AC1354_*` exists; neither half asserted anywhere (finding 2) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1353 `acceptance_criterion-003caa07` | `uat-add` | AC-1353 was created 2026-08-20T15:43:36Z, **after** the UATs froze at `b18b859d7` (12:49:19Z), and has no `test_UAT_AC1353_*` anywhere — re-confirmed this pass by `grep -ral -E 'test_UAT_AC135[0-9]\|AC-135[34]'` over `main`'s `tests packages tools apps bin db storage`, which returns **no hits**. Its substance exists at `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` ("edit.ts imports no filesystem module") and `:115` ("the port and its model reach no filesystem"), under a free-coded name the matrix cannot link to an AC. The AC's own body states why a behavioural test cannot substitute: under `nodejs_compat` the Workers runtime *resolves* a filesystem import and supplies a per-isolate filesystem, so a command still reaching for a file would pass a behavioural run and silently lose the operator's work once deployed — "A successful import is not evidence; only an assertion over what the modules import is" | Add `test_UAT_AC1353_the_editing_surface_and_the_port_import_no_filesystem_module` to `tests/reconciliation-site-storage-port.test.ts`, lifting those assertions and **adding the missing third bullet** — that `fs-store.ts` is the only filesystem importer and sits behind its own entry point, so importing the port does not drag a filesystem behind it. Identify the offending module by name on failure, as the AC's Verification requires |
| 2 | violation | coverage | AC-1354 `acceptance_criterion-56798f01` | `uat-add` | AC-1354 was created 2026-08-20T15:59:43Z, likewise post-freeze, and has no `test_UAT_AC1354_*`. Neither half is asserted anywhere: not "each entry point names the store once, nothing beneath selects or falls back", and not the tool-adapter end-to-end claim (copy edit reads back with the count advanced; asset add lands bytes from a real source file; a non-existent source refused with the same code + path + hint the CLI produces). Re-checked this pass: `l1Operations` appears in 6 test files on `main`, all asserting the *operation set*, none the store-naming or tool-adapter claim | Add `test_UAT_AC1354_each_entry_point_names_its_store_once_and_the_tool_adapter_edits_through_it`. Assert the three construction sites are singular and that no layer beneath them selects or falls back, then drive `l1Operations(slug, { store: memorySiteStore() })` — `main:tools/generate/src/cli/ai/toolbox.ts:176`, which takes `EditOptions` and constructs nothing — through all three cases |
| 3 | violation | consistency | AC-1321 `acceptance_criterion-d4cc3712` | `uat-edit` | AC-1321 names "record a change", "read the changes since a given count" and "report what the draft has pending" as three of the ten questions storage must answer totally, held and unheld — read verbatim from the AC body this pass, and its Verification names all three explicitly ("including the three journal-facing ones"). Re-confirmed this pass: `grep -ral -E 'appendChange\|changesSince\|pendingChanges'` over `main:tests` returns **nothing**, while the same verbs are declared on the port itself at `main:tools/generate/src/store/site-store.ts:137,143,146`. The `asked` array at `…port.test.ts:135-143` carries 7 verbs against a totality claim covering 10, and the unheld-slug block at `:177-183` likewise | Extend `…port.test.ts:135-143` and `:177-183` to ask all three over both backends: `appendChange` answers with the count it produced and leaves `counter` standing there (and for an unheld slug neither raises nor moves the counter); `changesSince` returns the records after the given count, where the counter stands, and whether the window truncated; `pendingChanges` names added/modified/removed files and the base revision — or no revision, which is what the memory adapter must report. Add all three to the `toBeInstanceOf(Promise)` list at `:144` |
| 4 | violation | consistency | AC-1327 `acceptance_criterion-16093733` | `uat-edit` | `…port.test.ts:585-590` asserts that a copy edit made outside the builder is picked up on the next request with no restart (`expect(refreshed.body).toContain('After')` / `.not.toContain('Before')`) — read at line this pass. AC-1327's body (updated 16:32:22Z, post-freeze) spends a full paragraph disowning exactly this — "Nothing about the preview's *freshness* is this capability's claim to prove", naming both the operator-visible outcome and the mechanism — and assigns it to CAP-85 / REQ-119 (`request-64864801`, `free_and_reconciled`) / AC-1033 (`acceptance_criterion-ae33f0ab`). The ac-level cycle closed on exactly this narrowing (`report-2927090b` records the removal of the former bullet 4), so the AC body is authoritative and the test is the drifted party. An exclusivity breach across capabilities as well as a consistency one | Delete `…port.test.ts:585-590` and the scaffolding that exists only for it — the `'Before'` argument at `:563` and the `toContain('Before')` at `:571` become a plain `seedWithPalette()`. The three bullets AC-1327 does own are already fully asserted at `:567-583` and need no change |
| 5 | violation | consistency | AC-1329 `acceptance_criterion-ae2c7f77` | `uat-edit` | The ac-level fix loop widened AC-1329 at 2026-08-20T16:15:05Z with a fourth bullet the frozen UAT does not reach: "No *behavioural* assertion is conditioned on which runtime it runs in", with the AC-1328 routing-and-binding probes named as the deliberate exception; its Verification asks to assert over the routed test sources that no behavioural assertion branches on the runtime it is executing in. `test_UAT_AC1329_*` (`…port.test.ts:595-655`, read in full this pass) asserts a live Astro container render (`:600-608`), `vitest.node.config.mts` (`:612-619`), `vitest.workers.config.mts` (`:623-625`, `:635-636`), both apps' `wrangler.toml` compatibility settings (`:630-634`), the composing `vitest.config.mts` (`:640-643`) and the file partition (`:645-654`) — and nothing whatsoever about what the routed test sources assert | Add to `…port.test.ts:595` a scan over the routed test sources asserting no *behavioural* assertion branches on the executing runtime (no `navigator.userAgent` / `cloudflare:test` / workerd-only-global condition guarding an expectation), with the AC-1328-owned probes excluded by name: `reconciliation-site-storage-port.workers.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-141_project_routing.test.ts` |
| 6 | warning | coverage | AC-1328 `acceptance_criterion-c8728ae8` | `uat-edit` | AC-1328 has four bullets; `test_UAT_AC1328_*` (`…port.workers.test.ts:30`, read in full this pass) proves bullet 1 (`:32-33`) and the binding-names half of bullet 4 (`:40-41`), plus the D1/R2 round trips. Bullet 3 (the two inclusion rules partition the files) and the compatibility-settings half of bullet 4 are asserted inside **AC-1329's** test (`…port.test.ts:630-636`, `:645-654`). Bullet 2 (every other file runs where a filesystem is and reports a non-Workers user agent) is asserted only at `main:tests/test_UAT_FC_REQ-141_project_routing.test.ts:25`, under an FC name — re-confirmed this pass by `grep -rn -a 'Cloudflare-Workers' main:tests`, which returns exactly three hits (`…workers_runtime.workers.test.ts:19`, `…port.workers.test.ts:32`, `…project_routing.test.ts:25`) and only the last is a `not.toBe`. The evidence exists; it is filed under the wrong AC or under no AC | Assert `globalThis.navigator?.userAgent).not.toBe('Cloudflare-Workers')` in an AC-1328-named node-side assertion, and either move the compatibility-settings and partition blocks into that test or have AC-1328's test re-assert them. AC-1329 then keeps only what is genuinely its own |
| 7 | warning | coverage | AC-1325 `acceptance_criterion-6a7b61e4` | `uat-edit` | AC-1325 enumerates eight items the shared body must cover: read, write, copy edit, structured subtree round-trip, palette **rules**, asset add **and remove**, change counting, draft render. `applyAndAsk` (`…port.test.ts:427-440`, read at line this pass) applies `editPaletteRename` / `editPageAdd` / `editCopySet` / `editAssetAdd` and asks six questions (`editPageList`, `editPaletteGet`, `editL1Get`, `editConfigGet`, `editAssetList`, `counter`). Four are absent from the shared body: the structured subtree *round-trip* (`editL1Get` reads, but nothing sets and reads back verbatim), the palette *rules* (no refused operation), asset *removal*, and the draft render. All four exist in the file but inside AC-1324's **memory-only** test (`:387-388`, `:394-396`, `:410-411`, `:415-417`), so they are proved over one adapter, not both | Extend `applyAndAsk` with an `editL1Set` + `editL1Get` verbatim round-trip, a refused `editPaletteRm` on a referenced entry asserted `CONFLICT` on both fixtures, an `editAssetRm` after the add, and a `new PreviewRenderer(f.store).file(f.slug,'draft','/')` render folded into the compared result. The whole point of the AC is that this body is shared, so every addition lands on both adapters at once |
| 8 | warning | consistency | AC-1321 `acceptance_criterion-d4cc3712` | `uat-edit` | AC-1321 requires that assembling the draft answers with "the errors that stopped it assembling, *reported* rather than thrown". `…port.test.ts:164-172` asserts only the `ok: true` branch (`expect(draft!.result.ok, name).toBe(true)`, `:166`) and the stamp's equal-iff-unchanged / moves-on-change behaviour (`:168`, `:172`) — read at line this pass. A `loadDraft` that threw on an invalid definition would pass this test and violate the criterion | Seed a fixture with a definition that fails validation and assert `loadDraft` **resolves** with `result.ok === false` carrying the errors, rather than rejecting — over both backends |
| 9 | needs_review | coverage | `capability-c4c7a854` (repair of findings 1–8) | — | **Escalation, not intent ambiguity — twenty-fifth consecutive check, zero movement, unanswered since attempt 7.** All eight findings above are `uat-add` / `uat-edit` against `tests/reconciliation-site-storage-port.test.ts` / `…workers.test.ts`, **neither of which exists in this worktree**: the port landed on `main` at `2b902ead0` (2026-08-20T12:21:02Z, merged `b18b859d7` 12:49:19Z), **11h38m after** regression `cb0dad9c` was cut at `0f44ef1ba` (2026-08-20T00:43:02Z). Re-run this pass: `git merge-base HEAD main` → `0f44ef1ba`; `git merge-base --is-ancestor c36402287 HEAD` → false (the commit adding the port UATs to `main` is unreachable here); `git ls-files` finds none of the six store modules and only a single `vitest.config.mts`; `tests/support/` holds only `webui-installed.ts`. Authoring the tests here would import six absent store modules (`site-store`, `memory-store`, `fs-store`, `assemble`, `journal`, `journal-model`) **and two absent fixture helpers** (`tests/support/site-factory.ts`, `tests/support/wrangler-toml.ts`), failing at collection on two counts and adding a knowingly-red suite to the branch whose sole purpose is to gate a fast-forward of `xgd-stable` — red against *correct* code. Twenty-four fix loops applied 0 of 8 and were right not to | Operator decision, one of: **(c)** run `check_uat_validation` + `fix_uat_validation` for this capability on a branch at or past `b18b859d7` — a worktree already exists at `main` (`bda6c9939`, `git worktree list` confirms), so this needs no new branch and no resync; **(b)** scope `capability-c4c7a854` out of regression `cb0dad9c` — noting the *check* is runnable here and its result is sound, so (b) only relocates the *repair*; **(a)** resync `regression-cb0dad9c` past `b18b859d7`, which makes them actionable here but changes what the regression is testing mid-run. **(c) recommended**, then (b); (a) remains least attractive |
| 10 | info | exclusivity | `reconciliation-site-storage-port.test.ts` + `test_UAT_FC_REQ-142_site_store_port.test.ts` | — | The reconciliation UATs and the free-coded REQ-142 UATs overlap substantially in the same shape — the FC file's 20 `it(...)` blocks (read this pass) drive read / write / change-counting / copy / L1 round-trip / palette rules / assets-as-bytes / both-adapters-identical, the same ground as AC-1321…AC-1325. This is the normal free-coded → reconciliation succession, not drift, and retiring the FC file is reconciliation bookkeeping rather than this check's business. Recorded so a later pass does not mistake it for duplicate coverage | none |
| 11 | info | — | the `fix_uat_validation` self-loop for this subject | — | **Recorded, not actioned.** Attempt 22 (`report-02b651e2`) declared `needs_more_work: false` — the loop-exit signal — and the loop did not exit; attempts 23 (`report-301ecfbf`) and 24 (`report-81f46661`) declared `needs_more_work: true` + `progress_made: false`, the documented *"exit loop — stuck"* signal, and the loop did not exit either. Total fixes applied across the series: **0** in 24 attempts, against a self-loop budget of 20. Per CLAUDE.md's taxonomy a documented transition that exists but never fires is an `@error` (system bug), not a workflow failure to retry. Managing the outer workflow is outside this prompt's scope path, so this is surfaced rather than filed | Operator: consider a bug ticket for the loop-exit transition, independently of (a)/(b)/(c) above |

## Notes for the Editor

**Why FAIL, and why it is not a request for a twenty-sixth attempt.** The five violations are
real and unrepaired. A PASS here would convert a correct refusal-to-act into a false claim of
coverage in a **global** matrix — AC-1353 and AC-1354 would be recorded as covered when no test
bearing their names exists on any branch. The FAIL is the accurate state; finding 9 is where it
gets resolved, and it needs an operator, not another loop iteration.

**On counting against this branch versus against `main`.** On `regression-cb0dad9c` all eleven
ACs have zero UATs — there is no port, no runtime split and no `tests/support` fixture set here.
Reporting eleven coverage violations would be a *less* accurate description of the matrix's real
state (the tests do exist, on `main`) and no more repairable, so the ledger above is built from
`main`'s evidence, as the previous twenty-four passes were. This is stated explicitly so a later
reader does not mistake the choice for an oversight. Either way the verdict is FAIL and the
blocker is identical.

**One cause behind findings 1–5.** The reconciliation UATs were authored against the AC set as it
stood when BUNDLE-19 merged (`b18b859d7`, 12:49:19Z). The ac-level fix loop then ran repairs
between 15:43Z and 16:32Z that **created AC-1353 and AC-1354, widened AC-1321, widened AC-1329 and
narrowed AC-1327** — every one of them after the tests were frozen. Findings 1–5 map one-to-one
onto those five edits, and the six ACs untouched since 05:24Z carry no violations at all. No
`code-issue` was raised, deliberately: every suggested edit is test-side, and every claim the ACs
make is reachable from code that already exists on `main`.

**One near-miss worth recording so it is not re-derived as a code bug.** `createL1Toolbox`
(`main:tools/generate/src/cli/ai/toolbox.ts:505`, re-read this pass) constructs
`new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })` — spreading `opts` and *then*
overriding `store`, so a store handed to it is discarded. That looks like an AC-1354 violation
until you read the AC: the toolbox naming the filesystem adapter once, at start-up, on the
operator's machine is precisely what AC-1354 *requires*. The injectable seam its Verification asks
for is one level down — `l1Operations(slug, opts)` at `toolbox.ts:176`, which takes `EditOptions`
and constructs nothing. Finding 2 targets that, not `createL1Toolbox`.

**Survey hazard, carried forward.** `builder.ts` and `fidelity.ts` embed NUL bytes as cache-key
separators, so a plain recursive grep classifies them as binary and skips them silently. Every
grep cited above forced text mode with `-a`. Any repair pass surveying consumers of the editing
surface must do the same or it will report a consumer that does not exist.

**Ordering, when unblocked.** Finding 4 first — it is a deletion, and leaving it in keeps CAP-85's
freshness evidence duplicated inside CAP-101's. Then 3 and 5 (extensions to existing tests), then
1 and 2 (new tests, the larger authoring jobs). Warnings 6–8 are cheap once their host tests are
open, and 6 is cheaper than it first appears — the binding-names half of AC-1328's bullet 4 is
already in the right test.

**The loop is provably non-convergent.** Finding 9 gates all of it, has survived twenty-five
checks and twenty-four fix attempts with no operator reply on the report chain. Per the project's
failure/error taxonomy this is a **terminal failure** — an expected dead-end requiring a graceful
halt — not a recoverable failure to retry. A twenty-sixth iteration against this tree will
reproduce this report verbatim. The check itself is healthy and its verdict is sound; only the
repair is misrouted.
