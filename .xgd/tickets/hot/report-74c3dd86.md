---
uid: report-74c3dd86
id: REPORT-2525
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T20:43:37.874982+00:00'
updated_at: '2026-08-20T20:43:37.874982+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: uat
  violations: 1
  warnings: 1
  needs_review_count: 1
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 1

Twenty-sixth uat-level pass (`previous_attempt_count = 25`). Cumulative fixes applied across
attempts 1–25: **0** (every fix report records `fixes_applied: 0`, and attempts 24–25 record
`progress_made: false`).

**This pass reaches a materially different verdict from attempts 1–25 and supersedes them.**
The prior reports counted 5 violations by treating *absence of the test files from this
worktree* as the coverage gap. That framing is wrong at this level: the capability matrix is
global (tickets are branch-independent), so UAT evidence that exists on `main` **is** evidence,
regardless of which worktree the check happens to execute in. Re-derived from source against
`main` this pass, 10 of 11 ACs are covered — 9 substantively and correctly named, 1 covered in
substance under a non-AC test name. Exactly **one** AC has no test anywhere.

## Verification environment

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` |
| HEAD | `git log --oneline -1` | `5fd80fbe5` — `Workflow fix_uat_validation completed: done` (ticket/report commits only) |
| merge-base with `main` | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4` |
| Regression cut point | `git log -1 --format='%cI %s' 0f44ef1ba` | `2026-08-19T17:43:02-07:00` (= **2026-08-20T00:43:02Z**), `xgd: sync from xgd-working 097e8bc90814 (post-watermark)` |
| Commit that added the port UATs | `git log -1 main -- tests/reconciliation-site-storage-port.test.ts` | `c36402287c3cee4f1fe8f14dd69160a45ddf82bd`, `2026-08-20T05:21:06-07:00` (= **2026-08-20T12:21:06Z**) |
| Reachability | `git branch -a --contains c36402287` | `main`, `reconcile-REQ-147`, `resync-db1949d9`, `xgd-working`, `origin/main` — **`regression-cb0dad9c` absent** |
| Port UATs @ HEAD | `git ls-files tests \| grep -E 'site-storage-port\|workers\.test'` | **empty** |
| Port UATs @ `main` | `git ls-tree -r --name-only main tests \| grep …` | `reconciliation-site-storage-port.test.ts`, `reconciliation-site-storage-port.workers.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts` |
| Store modules @ HEAD | `git ls-files tools/generate/src` | no `store/` directory |
| Store modules @ `main` | `git ls-tree -r --name-only main` | `tools/generate/src/store/{site-store,fs-store,memory-store}.ts`, `cli/shared-store.ts` |

The regression branch was cut **~11.5 hours before** the capability's implementation and UATs
landed on `main`. Nothing in the capability — neither production modules nor tests — is
reachable from HEAD. This is an environment fact, not an alignment finding; it is recorded as
finding 3 (`needs_review`) because it determines *where* finding 1 can be repaired, not
*whether* it is real.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-19 (`bundle-77b28def`) | `free_and_reconciled` | merged at `b18b859d7414a049be45e09f48426d73742e5bf2` | Umbrella intent for STORY-118 (`fields.intent_uid`). Bundles REQ-133, BUG-35, REQ-131, REQ-140, REQ-139, REQ-123, REQ-141, REQ-144, REQ-142 | YES |
| └ REQ-142 | via BUNDLE-19 | — | "An async SiteStore port, with the filesystem behind it" — the port itself, both adapters, the no-location rule, one-whole-change writes | YES |
| └ REQ-141 | via BUNDLE-19 | — | "Workers-runtime test project: UATs that run inside workerd against real bindings" — the two-runtime split routed by filename | YES |

STORY-118 (`story-3f4a5f2b`, `story_kind: feature`, `status: completed`) carries no
`updated_by` chain; BUNDLE-19 is its sole intent. No retired or abandoned intent touches this
capability, so nothing in the matrix should be absent-by-retirement.

**Level cascade honoured.** The ac-level cycle passed clean — `report-2927090b` / REPORT-2474
(`report_kind: capability_validation`, `level: ac`, `result: pass`, 0 violations / 0 warnings /
0 needs_review), created 2026-08-20T16:38:14Z, i.e. **after** the last AC edit (AC-1354 created
15:59:43Z). The eleven AC bodies are therefore the authoritative working reference at this
level, and intent was consulted only to confirm no AC is orphaned.

## Alignment Ledger

Evidence located on `main` (where the implementation lives). Line numbers verified this pass.

| Element | Test evidence | Outcome |
|---|---|---|
| AC-1321 Storage answers every question totally | `tests/reconciliation-site-storage-port.test.ts:126` `test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld` | aligned |
| AC-1322 Assets as bytes, pages as keys | `…port.test.ts:197` `test_UAT_AC1322_assets_cross_as_bytes_and_pages_as_keys_never_locations` | aligned |
| AC-1323 One multi-file command = one whole change | `…port.test.ts:257` `test_UAT_AC1323_a_multi_file_command_reaches_storage_as_one_whole_change` | aligned |
| AC-1324 Whole editing surface over a filesystem-free store | `…port.test.ts:338` `test_UAT_AC1324_the_whole_editing_surface_completes_with_no_filesystem` | aligned |
| AC-1325 Both stores answer identically | `…port.test.ts:422` `test_UAT_AC1325_the_same_seed_answers_identically_over_both_stores` | aligned |
| AC-1326 Arguments, output, refusal envelopes unchanged | `…port.test.ts:460` `test_UAT_AC1326_command_arguments_output_and_refusal_envelopes_are_unchanged` | aligned |
| AC-1327 Draft preview served from whichever store rendered it | `…port.test.ts:561` `test_UAT_AC1327_the_draft_preview_is_served_from_whichever_store_rendered_it` | aligned |
| AC-1328 Two runtimes, routed by filename, real bindings | `tests/reconciliation-site-storage-port.workers.test.ts:30` `test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings` | aligned |
| AC-1329 The split cost nothing the single runtime provided | `…port.test.ts:595` `test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly` | aligned |
| AC-1353 Editing surface and port import no filesystem module | `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` + `:115` | covered in substance; **not named to the AC index** (finding 2) |
| AC-1354 Entry points name the store once; tool adapter edits through it | **none** | **gap** (finding 1) |

### Evidence-quality notes

The nine AC-named UATs are substantive, not structural stand-ins. `…port.test.ts` imports the
real command surface (`editPageAdd`, `editCopySet`, `editAssetWrite`, `editPaletteRename`, … from
`tools/generate/src/cli/edit`), the real builder origin (`handleBuilderRequest`, `PreviewRenderer`,
`ctxOf`) and the real fixtures (`tests/support/site-factory`), and drives each criterion across
`SITE_BACKENDS` — both adapters, one body of assertions. `builderFetch` (`:666`) exercises the
origin's real routing table over an in-memory `IncomingMessage`/`ServerResponse` pair rather than
re-deriving statuses. The workers UAT is self-evidencing by construction: it imports
`cloudflare:test` (resolvable only inside the Workers pool), asserts
`navigator.userAgent === 'Cloudflare-Workers'`, and reaches for artifacts a fake could not
produce — SQLite's own `sqlite_master` catalogue, an engine-enforced primary-key rejection, and
R2's server-computed `size`/`etag`. No internal mocking is present in any of them.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1354 (`acceptance_criterion-56798f01`) | `uat-add` | AC-1354 is `active` and has **no test anywhere in the tree**. Neither of its two claims is exercised: (a) that each of the three entry points constructs its store in exactly one place with every layer beneath taking an injected store, and (b) that the assistant's tool adapter drives a real edit through the store it was given — copy edit reads back with the change count advanced, asset-add reads the operator's source file itself and hands bytes across, and a non-existent source path is refused with the same code/path/hint the CLI produces. `git grep -l -i "tool adapter\|toolbox"` over `main:tests` returns 14 files; none injects a store. The nearest candidate, `main:tests/reconciliation-assistant-control-surface.test.ts:124`, builds the adapter with `createL1Toolbox(SLUG, { cwd }, …)` — cwd-based, so it exercises the filesystem path exclusively and cannot witness the injection claim | Author `test_UAT_AC1354_*`. The seam is available without production change: `createL1Toolbox` hardcodes its adapter at `main:tools/generate/src/cli/ai/toolbox.ts:505` (`new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })`), but `L1Toolbox` itself accepts `store` on its options — so the UAT can construct `L1Toolbox` directly against `makeMemorySite`'s store and assert the copy-edit/counter, asset-bytes, and not-found-envelope trio, plus assert the single construction site per entry point |
| 2 | warning | consistency | AC-1353 (`acceptance_criterion-003caa07`) | `uat-edit` | AC-1353's substance **is** proved — `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` asserts `edit.ts` matches neither `from 'node:fs'`, `from 'node:path'` nor `from '../store'`, and `:115` asserts `site-store.ts`, `assemble.ts`, `journal-model.ts` and `memory-store.ts` match neither `from 'node:` nor `from './fsutil'`, identifying the offending module by name via the `expect(source, name)` label exactly as the AC's Verification section requires. But both are named `UAT_FC_REQ-142 …`, so the `test_UAT_AC<number>_*` convention this level indexes by does not resolve AC-1353 to them, and the AC reads as uncovered to any automated traceability pass | Rename the two tests to `test_UAT_AC1353_*` (or add a thin AC-named test that delegates), so the coverage is discoverable. No new assertion is needed — do not duplicate the existing ones |
| 3 | needs_review | — | capability-c4c7a854 on `regression-cb0dad9c` | — | Finding 1 is real but **cannot be repaired on this branch**. `regression-cb0dad9c` was cut from `main` at `0f44ef1ba` (2026-08-20T00:43:02Z); the capability's implementation and UATs landed at `c36402287` (2026-08-20T12:21:06Z), which `git branch --contains` confirms is unreachable from HEAD. At HEAD there is no `tools/generate/src/store/`, no `tests/support/site-factory.ts` and no port test file, so an AC-1354 UAT authored here would import six modules that do not exist and could not run. This is why attempts 1–25 applied zero fixes: the fix agent's refusal was correct each time, and a twenty-sixth iteration will produce the same result | Operator decision required — this is a **terminal failure** (expected dead-end, graceful halt) under CLAUDE.md's failure/error taxonomy, not a recoverable failure to retry. Either re-cut the regression branch from current `main` so the capability is present, or route findings 1–2 to `main`/`xgd-working` where the code lives and let this branch's uat level pass on the evidence as it stands on `main` |

## Notes for the Editor

**Do not author findings 1 or 2 into `regression-cb0dad9c`.** Both target files that exist only
on `main`. Applying them here would create test files importing absent modules — strictly worse
than the current state, which is what every prior fix attempt correctly concluded.

**The violation count dropped from 5 to 1 for a reason, not because the tree changed.** Nothing
material has changed in this worktree since attempt 1 (HEAD carries only ticket, report and
workflow commits). The difference is scope: the prior passes assessed UAT coverage against
*this worktree's checkout*, which makes every AC look uncovered. This pass assessed it against
the matrix's actual evidence, wherever that evidence lives. The latter is the deterministic
reading — it returns the same verdict from any worktree, which is what a matrix-level alignment
check has to do. Eight of the previously-reported violations were branch-visibility artifacts,
not drift.

**The one durable gap is AC-1354, and it postdates the UAT-generation run.** AC-1353 (created
2026-08-20T15:43:36Z) and AC-1354 (created 15:59:43Z) were both authored by the ac-level fix
cycle *after* the UAT-generation workflow ran at 12:21:06Z, so neither was ever in scope for a
UAT author. AC-1353 was retroactively satisfied by the free-coded REQ-142 file; AC-1354 was not.
That is the whole of the real drift here, and it is a one-test repair on a branch that has the
code.

**Exclusivity is clean.** No two ACs claim the same criterion and no two tests verify the same
scenario in the same shape. The overlap between `reconciliation-site-storage-port.test.ts` and
`test_UAT_FC_REQ-142_site_store_port.test.ts` is deliberate and acceptable — the FC file is the
free-coded original from REQ-142's own development, the reconciliation file is the AC-indexed
matrix evidence, and they differ in framing (per-REQ vs per-AC) rather than duplicating a
scenario in one shape.
