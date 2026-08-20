---
uid: report-0ebe2a4f
id: REPORT-2512
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 19'
created_by: xgd
created_at: '2026-08-20T19:38:01.892146+00:00'
updated_at: '2026-08-20T19:38:01.892146+00:00'
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

**Attempt**: 19
**Fixes applied this call**: 0
**Violations remaining**: 5 (plus 3 warnings, 1 needs_review)
**Needs more work**: true — but **not here**. See "Terminal failure" below.

## Outcome: terminal failure, not a recoverable failure

This is the nineteenth consecutive uat-level pass on `capability-c4c7a854` and the
nineteenth to apply zero fixes. Per the project's failure/error taxonomy (CLAUDE.md,
"Failure vs Error Taxonomy") this is a **terminal failure** — an expected dead-end
requiring a graceful halt — not a recoverable failure to retry. A twentieth iteration
against this tree will reproduce `report-86cedcf2` verbatim.

I am declaring `progress_made: false` deliberately, to trip the
`needs_more_work=true, progress_made=false` → **exit loop** semantics rather than burn
attempt 20 on a re-derivation.

## Why zero fixes — re-verified independently this call

I did not take `report-86cedcf2` on trust. Re-run from scratch in this worktree:

| Check | Command | Result |
|---|---|---|
| store modules @ HEAD | `git ls-tree --name-only HEAD -- tools/generate/src/store/` | **8**: `base, diff, fsutil, history, index, loadSite, paths, snapshot` |
| store modules @ main | same, `main` | **14** — the same **plus** `assemble, fs-store, journal, journal-model, memory-store, site-store` |
| port tests @ HEAD | `git ls-tree -r --name-only HEAD -- tests` | no `reconciliation-site-storage-port*`; **no `*.workers.test.ts` of any kind**; no `test_UAT_FC_REQ-141_*` / `REQ-142_*` |
| fixture helpers @ HEAD | same | `tests/support/` contains **only** `webui-installed.ts` — `site-factory.ts` and `wrangler-toml.ts` both absent |

All eight actionable findings (1–8) are `uat-add` / `uat-edit` targeting
`tests/reconciliation-site-storage-port.test.ts` and `…workers.test.ts`. **Neither file
exists at HEAD.** Authoring them here would import six absent store modules and two
absent fixture helpers — failing at collection on two counts — and would add a
knowingly-red suite to the branch whose sole purpose is to gate a fast-forward of
`xgd-stable`. Red against *correct* code.

The eighteen prior fix loops applied 0 of 8 and were right not to.

## What I explicitly did NOT do, and why

| Tempting action | Why refused |
|---|---|
| Author the tests anyway | Fails at collection; poisons the regression gate with red-against-correct-code |
| Set `uat_coverage` on the ACs to show movement | That field is owned by `check`/`fix_uat_coverage`, not by this check. Setting it here is manufactured progress, not repair |
| Fall back to `ac-edit` / `ac-deprecate` | Wrong category. The assessor categorized all eight as test-side, and the ac level already **passed** at `report-2927090b`. The ACs are not the defect |
| Write the repair into the `main` worktree myself | That is operator option (c). Relocating the repair to another branch is a workflow-management decision outside this prompt's scope path |

## Code Edits

None this call. No `code-issue` was raised by the assessor, and my own reading agrees:
every claim the ACs make is reachable from code that already exists on `main`.

## needs_review Items Forwarded — UNANSWERED SINCE ATTEMPT 7

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` (repair of findings 1–8) | The port landed on `main` at `2b902ead0` (2026-08-20T12:21:02Z, merged `b18b859d7` 12:49:19Z), **11h38m after** regression `cb0dad9c` was cut at `0f44ef1ba` (2026-08-20T00:43:02Z). The check is sound here; only the **repair** has nowhere to land | Pick one of (a)/(b)/(c) below |

**(c) — RECOMMENDED.** Run `check_uat_validation` + `fix_uat_validation` for this
capability on a branch at or past `b18b859d7`. A worktree already exists at `main`, so
this needs no new branch and no resync. The findings become actionable immediately.

**(b) — acceptable fallback.** Scope `capability-c4c7a854` out of regression `cb0dad9c`.
Note this only *relocates* the repair: the check is runnable here and its result is
sound, so (b) does not make the findings go away.

**(a) — least attractive.** Resync `regression-cb0dad9c` past `b18b859d7`. Makes the
findings actionable here, but changes what the regression is testing mid-run.

## The repair itself, ready to execute wherever it lands

Recorded so whoever picks this up on a branch at/past `b18b859d7` does not re-derive it.
Assessor's ordering, which I concur with:

1. **Finding 4** (`uat-edit`, AC-1327) — *first, it is a deletion.* Remove
   `…port.test.ts:585-590` (the freshness assertion AC-1327's body explicitly disowns and
   assigns to CAP-85 / REQ-119 / AC-1033) plus its only scaffolding: the `'Before'`
   argument at `:563` and the `toContain('Before')` at `:571` collapse to a plain
   `seedWithPalette()`. Leaving it in keeps CAP-85's evidence duplicated inside CAP-101's.
2. **Finding 3** (`uat-edit`, AC-1321) — extend the `asked` arrays at `:135-143` and
   `:177-183` from 7 verbs to all 10, adding `appendChange` / `changesSince` /
   `pendingChanges` over both backends, and add them to the `toBeInstanceOf(Promise)` list
   at `:144`. These three verbs are called by **no test in the repository**.
3. **Finding 5** (`uat-edit`, AC-1329) — add to `:595` a scan over the routed test sources
   asserting no *behavioural* assertion branches on the executing runtime, excluding the
   AC-1328-owned probes by name.
4. **Finding 1** (`uat-add`, AC-1353) — author
   `test_UAT_AC1353_the_editing_surface_and_the_port_import_no_filesystem_module`, lifting
   the assertions from `test_UAT_FC_REQ-142_site_store_port.test.ts:110-112` and `:117-121`
   and **adding the missing third bullet** (`fs-store.ts` is the only filesystem importer,
   behind its own entry point). Name the offending module on failure.
5. **Finding 2** (`uat-add`, AC-1354) — author
   `test_UAT_AC1354_each_entry_point_names_its_store_once_and_the_tool_adapter_edits_through_it`.
   Drive `l1Operations(slug, { store: memorySiteStore() })` at
   `tools/generate/src/cli/ai/toolbox.ts:176` — **not** `createL1Toolbox` (`:505`), which
   overrides an injected store by design and whose behaviour AC-1354 *requires*.
6. **Warnings 6–8** — cheap once their host tests are open.

## Loop declaration

`needs_more_work: true` / `progress_made: false` → **exit loop**. The blocker is
structural, not effort-limited. Hand to the operator for (c).
