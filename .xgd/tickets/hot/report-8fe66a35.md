---
uid: report-8fe66a35
id: REPORT-2514
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 20'
created_by: xgd
created_at: '2026-08-20T19:47:13.538848+00:00'
updated_at: '2026-08-20T19:47:13.538848+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: uat
  fixes_applied: 0
  progress_made: false
  needs_more_work: true
  violations_remaining: 5
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (uat)

**Attempt**: 20 of 20 — **the self-loop budget is now exhausted**
**Fixes applied this call**: 0
**Violations remaining**: 5 (plus 3 warnings, 1 needs_review)
**Needs more work**: true — but **not on this branch**. See "Terminal failure".

## Outcome: terminal failure, budget exhausted

Twentieth consecutive uat-level pass on `capability-c4c7a854`; twentieth to apply zero
fixes. Attempt 19 (`report-0ebe2a4f`) already declared
`needs_more_work=true, progress_made=false` — the documented **exit-loop** signal — and
the loop re-entered anyway to spend the final attempt. Per CLAUDE.md's failure/error
taxonomy this is a **terminal failure**: an expected dead-end requiring a graceful halt,
not a recoverable failure to retry.

I am again declaring `progress_made: false` deliberately and honestly. Every mutation
available to me on this branch is either harmful or dishonest — enumerated below.

## Why zero fixes — re-derived from scratch this call, not taken on trust

I re-ran the branch geometry and the symbol inventory rather than inheriting either
`report-134ca7f2` or attempt 19's summary:

| Check | Command | Result |
|---|---|---|
| HEAD | `git rev-parse HEAD` | `4be257eae` |
| merge-base | `git merge-base HEAD main` | `0f44ef1ba` |
| `main` ancestor of HEAD? | `git merge-base --is-ancestor main HEAD` | **NO** |
| commits `main` ahead of fork point | `git rev-list --count 0f44ef1ba..main` | **487** |
| store modules @ HEAD | `git ls-tree --name-only HEAD -- tools/generate/src/store/` | **8**: `base, diff, fsutil, history, index, loadSite, paths, snapshot` |
| store modules @ main | same, `main` | **14** — the same **plus** `assemble, fs-store, journal, journal-model, memory-store, site-store` |
| port tests @ HEAD | `git ls-tree -r --name-only HEAD -- tests` | no `reconciliation-site-storage-port*`; **no `*.workers.test.ts` of any kind**; no `test_UAT_FC_REQ-141_*` / `REQ-142_*` |
| fixture helpers @ HEAD | same | `tests/support/` holds **only** `webui-installed.ts` — `site-factory.ts` and `wrangler-toml.ts` both absent |

Two greps settle it beyond argument. Over `HEAD -- tests tools`, **both return zero
hits**:

- `git grep -a -l -E "appendChange|changesSince|pendingChanges"` → nothing
- `git grep -a -l -E "SITE_BACKENDS|memorySiteStore|fsSiteStore"` → nothing

And the UAT name index at HEAD (`git grep -a -h -oE "test_UAT_AC13[0-9]+_[A-Za-z0-9_]*"
HEAD -- tests`) runs **AC1307–AC1316 then jumps to AC1343–AC1352**. The entire
**AC1321–AC1329 range this capability is made of does not exist on this branch at all.**

All eight actionable findings are `uat-add` / `uat-edit` against
`tests/reconciliation-site-storage-port.test.ts` and `…workers.test.ts`. Neither file
exists here; nor do the six store modules and two fixture helpers they import. Authoring
them would fail at collection on two counts and would add a knowingly-red suite to the
branch whose sole purpose is to gate a fast-forward of `xgd-stable` — red against
*correct* code. Nineteen prior loops applied 0 of 8 and were right not to.

## What I did instead: verified the repair against main's real sources

Since the budget ends here, I spent this call making option (c) mechanical rather than
re-deriving the blocker. **Every assessor citation below I read at line via
`git show main:…` this call, and every one is confirmed verbatim.** No line number in the
repair plan is inherited.

| Finding | Assessor's claim | Confirmed by reading |
|---|---|---|
| 3 | `asked` array carries 7 verbs against a 10-verb totality claim | `…port.test.ts:135-143` — exactly `hasDraft, readSiteJson, readPages, listAssets, readAsset, counter, loadDraft` |
| 8 | only the `ok:true` branch of `loadDraft` is asserted | `:166` `expect(draft!.result.ok, name).toBe(true)`; `:168`/`:172` the stamp. No `ok:false` branch anywhere |
| 4 | AC-1327's test asserts the freshness outcome its own body disowns | final 5 lines of the test: `editCopySet(…'After')` then `toContain('After')` / `.not.toContain('Before')`; `'Before'` enters only at the `makeMemorySite(seedWithPalette('Before'))` seed and the `toContain('Before')` above it |
| 5 | AC-1329's test says nothing about what the routed sources assert | read in full: Astro container render, `vitest.node.config.mts`, `vitest.workers.config.mts`, both `wrangler.toml` compatibility settings, `vitest.config.mts`, then the `listFilesRel` partition. Nothing scans test-source assertions |
| 2 | the injectable seam is `l1Operations`, **not** `createL1Toolbox` | `main:tools/generate/src/cli/ai/toolbox.ts` — `export function l1Operations(slug: string, opts: EditOptions)` returns the operation record directly and **constructs no store**. Its doc comment states every operation is async "because the store behind it may be a database (REQ-142)" |

## What I explicitly did NOT do, and why

| Tempting action | Why refused |
|---|---|
| Author the tests anyway | Fails at collection on six absent modules + two absent fixtures; poisons the regression gate with red-against-correct-code |
| Set `uat_coverage` on the ACs to show movement | That field is owned by `check`/`fix_uat_coverage`. Setting it here is manufactured progress, not repair |
| Fall back to `ac-edit` / `ac-deprecate` | Wrong lever. The assessor categorized all eight as test-side and raised **no** `code-issue`; the ac level already passed. The ACs are not the defect |
| Write the repair into the `main` worktree myself | That is operator option (c) — relocating the repair to another branch is a workflow-management decision outside this prompt's scope path |

## Code Edits

None. No `code-issue` was raised, and my own reading agrees: every claim the ACs make is
reachable from code that already exists on `main`.

## needs_review Forwarded — UNANSWERED SINCE ATTEMPT 7

| Element | Finding | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` (repair of findings 1–8) | The port landed on `main` at `2b902ead0` (2026-08-20T12:21:02Z, merged `b18b859d7` 12:49:19Z), **11h38m after** regression `cb0dad9c` was cut at `0f44ef1ba` (2026-08-20T00:43:02Z). The **check** is sound and runnable here; only the **repair** has nowhere to land | Pick (a), (b) or (c) |

**(c) — RECOMMENDED.** Run `check_uat_validation` + `fix_uat_validation` for this
capability on a branch at or past `b18b859d7`. A worktree already exists at `main`, so
this needs no new branch and no resync. The findings become actionable immediately, and
the plan below is ready to execute.

**(b) — acceptable fallback.** Scope `capability-c4c7a854` out of regression `cb0dad9c`.
This only *relocates* the repair — the check is runnable here and its verdict is sound,
so (b) does not make the findings go away.

**(a) — least attractive.** Resync `regression-cb0dad9c` past `b18b859d7`. Makes the
findings actionable here but changes what the regression is testing mid-run.

## The repair, source-verified and ready to execute

Assessor's ordering, which I concur with. All targets in
`tests/reconciliation-site-storage-port.test.ts` unless stated.

1. **Finding 4** (`uat-edit`, AC-1327) — *first, it is a deletion.* Remove the trailing
   `editCopySet` / `refreshed` block (the last 5 lines of
   `test_UAT_AC1327_the_draft_preview_is_served_from_whichever_store_rendered_it`), which
   asserts the preview-freshness outcome AC-1327's body spends a paragraph assigning to
   CAP-85 / REQ-119 (`request-64864801`) / AC-1033. Then collapse its only scaffolding:
   `makeMemorySite(seedWithPalette('Before'))` → `makeMemorySite(seedWithPalette())`, and
   drop the `toContain('Before')` assertion. The three bullets AC-1327 owns are already
   fully proved by the page/asset/absent-asset assertions above and need no change.
   Doing this first stops CAP-85's evidence being duplicated inside CAP-101's.
2. **Finding 3** (`uat-edit`, AC-1321) — extend the `asked` array from 7 verbs to all 10,
   adding `appendChange` / `changesSince` / `pendingChanges`, over **both** `SITE_BACKENDS`,
   and add them to the `toBeInstanceOf(Promise)` loop. Assert: `appendChange` answers with
   the count it produced and leaves `counter` standing there; `changesSince` returns the
   records after a given count plus where the counter stands and whether the window
   truncated; `pendingChanges` names added/modified/removed files and the base revision —
   or no revision, which is what the memory adapter must report. Mirror all three into the
   unheld-slug (`ghost`) block: neither raising nor moving the counter. These three verbs
   are currently called by **no test in the repository** while five store modules implement
   them.
3. **Finding 5** (`uat-edit`, AC-1329) — add a scan over the routed test sources asserting
   no *behavioural* assertion branches on the executing runtime (no `navigator.userAgent` /
   `cloudflare:test` / workerd-only-global guarding an expectation), excluding the
   AC-1328-owned probes by name: `reconciliation-site-storage-port.workers.test.ts`,
   `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`,
   `test_UAT_FC_REQ-141_project_routing.test.ts`. `listFilesRel` + `readRepo` are already
   imported in this file.
4. **Finding 1** (`uat-add`, AC-1353) — author
   `test_UAT_AC1353_the_editing_surface_and_the_port_import_no_filesystem_module`, lifting
   the assertions from `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts` and
   **adding the missing third bullet**: `fs-store.ts` is the only filesystem importer and
   sits behind its own entry point, so importing the port does not drag a filesystem
   behind it. Name the offending module on failure, as the AC's Verification requires. A
   behavioural test cannot substitute: under `nodejs_compat` workerd *resolves* a
   filesystem import and supplies a per-isolate filesystem, so a command still reaching
   for a file would pass a behavioural run and silently lose the operator's work once
   deployed.
5. **Finding 2** (`uat-add`, AC-1354) — author
   `test_UAT_AC1354_each_entry_point_names_its_store_once_and_the_tool_adapter_edits_through_it`.
   Assert the three construction sites are singular and nothing beneath them selects or
   falls back. Then drive `l1Operations(slug, { store: memorySiteStore() })` — **verified
   this call to take `EditOptions` and construct nothing** — for: a copy edit that reads
   back with the change count advanced; `add_asset` from a real source file landing bytes
   under the given name; and `add_asset` with a non-existent source asserting `NOT_FOUND`
   + the path + the hint, identical to the CLI's refusal in AC-1326's test.
   **Do not target `createL1Toolbox`**: it spreads `opts` then overrides `store` with
   `fsSiteStore(ctxOf(opts))` by design, and that "named here, once, on the operator's
   machine" behaviour is precisely what AC-1354 *requires*. The injectable seam is one
   level down.
6. **Warnings 6–8** — cheap once their host tests are open. 6: assert
   `globalThis.navigator?.userAgent !== 'Cloudflare-Workers'` under an AC-1328 name and
   move (or re-assert) the compatibility-settings and partition blocks currently sitting
   in AC-1329's test. 7: extend `applyAndAsk` with an `editL1Set`/`editL1Get` round-trip,
   a refused `editPaletteRm` asserted `CONFLICT`, an `editAssetRm`, and a
   `new PreviewRenderer(f.store).file(f.slug,'draft','/')` render — the point of AC-1325
   is that the body is shared, so each addition lands on both adapters. 8: seed a
   definition that fails validation and assert `loadDraft` **resolves** with
   `result.ok === false` carrying the errors rather than rejecting, over both backends.

## Loop declaration

`needs_more_work: true` / `progress_made: false` → **exit loop**, and the attempt budget
is exhausted regardless. The blocker is structural, not effort-limited. No twenty-first
iteration against this tree can do better than this report. Hand to the operator for (c).
