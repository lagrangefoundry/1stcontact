---
uid: report-73f81f03
id: REPORT-2536
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T21:15:22.850759+00:00'
updated_at: '2026-08-20T21:15:22.850759+00:00'
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

Thirtieth uat-level pass (`previous_attempt_count = 29`). Cumulative fixes applied across
attempts 1–29: **0**. Attempts 24–29 all record `progress_made: false`.

Every claim below was re-derived from git and the ticket store **this pass**, independently of
`report-9e65f0b8` (REPORT-2533) and its 28 predecessors. Where this pass reaches the same
conclusion, it did so by its own derivation; the commands are listed so the derivation is
reproducible. The two substantive matrix findings were derived by reading `main`'s blobs
directly (`git show origin/main:<path>`), not by trusting a prior report's summary.

## Verification environment (re-derived this pass)

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` |
| HEAD | `git log --oneline -3` | `5ae875d25`, `78d67e68d`, `a15a0139c` — workflow/ticket/report commits only; no source change |
| merge-base with `main` | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4` |
| Regression cut point | `git log -1 --format='%ci' 0f44ef1ba` | **2026-08-19 17:43:02 -0700** |
| `main` HEAD | `git log -1 --format='%h %ci' main` | `e983724df`, 2026-08-20 14:08:39 -0700 |
| Port implementation commit | `git log -1 2b902ead0` | **`2b902ead0`, 2026-08-20 05:21:02 -0700** — "feat(store): an async SiteStore port, with the filesystem behind it [FREE-CODED]" |
| Store modules @ HEAD | `ls tools/generate/src/store` | 8 pre-port modules: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @ `main` | `git ls-tree origin/main --name-only .../store/` | those 8 **plus** `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| `store/index.ts` @ HEAD | `head -40 tools/generate/src/store/index.ts` | exports `siteDir`, `draftDir`, `pathExists`, `readJson`, `writeJson`, `copyDir` — a **location-returning** file store, i.e. the shape AC-1322 forbids |
| Port UATs @ HEAD | `grep -rIoE 'test_UAT_AC1(32[1-9]\|35[34])' tests tools packages apps` | **no match** |
| Port UATs @ `main` | same over `git grep origin/main -- tests` | `test_UAT_AC1321…AC1329` in `tests/reconciliation-site-storage-port.test.ts` + `…workers.test.ts` |
| AC numbers present @ HEAD | `grep -rIoE 'test_UAT_AC1[123][0-9][0-9]' … \| sort -u` | …AC1316, then jumps to AC1343…AC1352. **AC-1321…1329 absent** |
| Runtime routing @ HEAD | `Read vitest.config.mts` | one `getViteConfig` project, `include: ['tests/**/*.test.ts']` — no `.workers.test.ts` routing, no workers pool |

**Cut point precedes the implementation by ~11.5 hours.** The capability under check is not
present in the tree under check.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-19 (`bundle-77b28def`) | free_and_reconciled | merged @ `b18b859d7` | STORY-118's `intent_uid`; bundles REQ-133, BUG-35, REQ-131, REQ-140, REQ-139 + 4 more | YES |
| REQ-142 (`request-0dd62a5d`) | free_and_reconciled | 2026-08-15 | "An async SiteStore port, with the filesystem behind it" — the port, its totality, byte/key crossing, one-whole-change, the filesystem-free store, both-stores equivalence, unchanged envelopes, preview through the store, the import-graph seam, single-construction entry points | YES |
| REQ-141 (`request-b18d2056`) | ready_to_implement | 2026-08-15 | "Workers-runtime test project: UATs that run inside workerd against real bindings" — AC-1328, AC-1329 | YES (see info-4 — status anomalous, merged evidence outranks it) |
| REQ-143 (`request-18a48d63`) | ready_to_reconcile | 2026-08-15 | "The Cloudflare SiteStore: definitions in D1, bytes in R2" — a third adapter | imminent; **explicitly out of STORY-118's scope**, adds no AC here yet |
| REQ-148 (`request-7ae3c2cc`) | ready_to_reconcile | 2026-08-15 | Behavior modules render in workerd | imminent; different capability |

Cumulative picture: REQ-142 + REQ-141 together are exactly STORY-118's eleven active ACs. No
intent in the ledger retires any of them. REQ-143 is scoped out by REQ-142's own body ("The
Cloudflare store itself — deliberately separate").

## Alignment Ledger

Every AC is `active`, `kind: behavior`, `regression_only: False`. Column 3 records where the
evidence lives, because it does not live here.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1321 (`acceptance_criterion-d4cc3712`) | REQ-142 | covered on `main` — `test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld`; **absent on this branch** |
| AC-1322 (`acceptance_criterion-f713cba6`) | REQ-142 | covered on `main` — `test_UAT_AC1322_assets_cross_as_bytes_and_pages_as_keys_never_locations`; absent here |
| AC-1323 (`acceptance_criterion-44c1d962`) | REQ-142 | covered on `main` — `test_UAT_AC1323_a_multi_file_command_reaches_storage_as_one_whole_change`; absent here |
| AC-1324 (`acceptance_criterion-31f6a0c5`) | REQ-142 | covered on `main` — `test_UAT_AC1324_the_whole_editing_surface_completes_with_no_filesystem`; absent here |
| AC-1325 (`acceptance_criterion-6a7b61e4`) | REQ-142 | covered on `main` — `test_UAT_AC1325_the_same_seed_answers_identically_over_both_stores`, parameterized over `SITE_BACKENDS` as the AC's Verification requires; absent here |
| AC-1326 (`acceptance_criterion-d08eae5f`) | REQ-142 | covered on `main` — `test_UAT_AC1326_command_arguments_output_and_refusal_envelopes_are_unchanged`; absent here |
| AC-1327 (`acceptance_criterion-16093733`) | REQ-142 | covered on `main` — `test_UAT_AC1327_the_draft_preview_is_served_from_whichever_store_rendered_it`; absent here |
| AC-1328 (`acceptance_criterion-c8728ae8`) | REQ-141 | covered on `main` — `test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings`, correctly self-evidencing (carries the `.workers` marker, imports `cloudflare:test`, asserts `navigator.userAgent === 'Cloudflare-Workers'`, SQLite `sqlite_master` read-back, engine-enforced PK, R2 server-computed `size`/`etag`); absent here |
| AC-1329 (`acceptance_criterion-ae2c7f77`) | REQ-141 | covered on `main` — `test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly`; absent here |
| AC-1353 (`acceptance_criterion-003caa07`) | REQ-142 | **gap (traceability)** — substance proven on `main`, but under an intent-named test; no `test_UAT_AC1353_*` resolves. See finding 2 |
| AC-1354 (`acceptance_criterion-56798f01`) | REQ-142 | **gap (coverage)** — no UAT on this branch, on `main`, or on `xgd-working`. See finding 1 |

Exclusivity: clean. AC-1328 is isolated in the `.workers` sibling because a file asserting it
must *be* one; the other eight share `reconciliation-site-storage-port.test.ts`. No two UATs
verify the same scenario in the same shape.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1354 (`acceptance_criterion-56798f01`) | `uat-add` | AC-1354 (active; REQ-142, `free_and_reconciled`) has **no UAT anywhere in the repository**. Verified this pass on three refs: `git grep -l test_UAT_AC1354 origin/main` → no match; `git grep -l test_UAT_AC1354 xgd-working` → no match; `grep -rI test_UAT_AC1354 tests tools packages apps` → no match. Neither half of its Verification clause is asserted: (a) that each of the three entry points constructs its store in exactly one place and every layer beneath takes an injected store; (b) that the assistant's tool adapter, driven against an injected store, lands a copy edit with the change count advanced, adds an asset from a real source file as bytes, and refuses a non-existent source path with the same code/path/hint the command line produces. AC-1354 was created 2026-08-20T15:59:43Z — after the port's UAT file was authored — and no UAT followed it. | Author `test_UAT_AC1354_*` **on `main`**. Both halves are testable with no production change: `git grep -c 'fsSiteStore(' origin/main -- tools/generate/src/cli/ai/toolbox.ts` → exactly 1, and `l1Operations` is exported and accepts `opts.store`, so the adapter drives against `makeMemorySite()`. The single-construction half is structural, like AC-1353's. Do **not** classify as `code-issue`: the code supports the claim; only the assertion is missing. |
| 2 | warning | consistency | AC-1353 (`acceptance_criterion-003caa07`) | `uat-edit` | AC-1353's substance **is** proven on `main`, verified this pass by reading the blob: `origin/main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts` asserts `edit.ts` matches neither `from 'node:fs'`, `from 'node:path'`, nor `from '../store'`, and loops `site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts` asserting no `from 'node:` and no `from './fsutil'` — every module AC-1353 names. But the tests are named for the intent (`UAT_FC_REQ-142 …`) and bound to the AC only by a source comment (`// ── AC-2: the seam is real, not described`), so the `test_UAT_AC{number}_` convention resolves AC-1353 to nothing. | Rename to `test_UAT_AC1353_the_editing_surface_and_port_import_no_filesystem_module`, or add an AC-named wrapper. Traceability only — no behavioural change. Not a violation: the evidence exists and is correct. |
| 3 | needs_review | coverage | **all 11 ACs** / the capability as a whole | — (not repairable on this branch) | **The capability under check is not present in the tree under check.** `regression-cb0dad9c` was cut at `0f44ef1ba` (2026-08-19 17:43:02); the port landed at `2b902ead0` (2026-08-20 05:21:02), ~11.5 h later. In this worktree: none of the six port modules exist (`site-store.ts`, `memory-store.ts`, `fs-store.ts`, `assemble.ts`, `journal-model.ts`, `journal.ts`), no port test file exists, `tests/support/site-factory.ts` does not exist, and `vitest.config.mts` is a single Astro project with no `.workers.test.ts` routing — so AC-1328 and AC-1329 have no configuration to assert over either. **Zero of 11 ACs are verifiable here.** This is an environment / branch-topology error, not matrix drift: the matrix is global, the branch is not. | Escalate to the operator. Either (a) re-cut or rebase the regression branch onto a `main` containing `2b902ead0` so the uat level is evaluated against the code it describes, or (b) exclude `capability-c4c7a854` from this regression run. **Do not** author UATs here: that would require porting REQ-141/REQ-142's production code onto a regression branch — feature work in the one place it must not happen. |
| 4 | info | — | REQ-141 (`request-b18d2056`) | — | REQ-141 reads `ready_to_implement`, which per the status table does **not** count toward cumulative intent — yet its deliverable is demonstrably on `main` (`tests/reconciliation-site-storage-port.workers.test.ts` exists and runs in workerd), and AC-1328/AC-1329 are `active` and covered. This pass treats REQ-141 as counting, because merged evidence outranks the status field; read literally it would strand two covered ACs. Recorded so a later pass does not silently reach the opposite conclusion. | Operator glance: was REQ-141 re-queued for a second iteration? |

## Why this is not reported as 11 coverage violations

Mechanically this worktree has 11 ACs and zero tests. Reporting that as eleven `uat-add`
violations would be a true sentence and a false instruction: it would direct the fix loop to
author UATs for production code that is absent, on a branch that must not carry feature work.
Finding 3 states the same fact in the shape that admits a correct action. Findings 1 and 2 are
the *real* matrix gaps — derived against `main`, where the code lives — and are recorded here so
the thirty iterations spent on this capability leave something actionable behind once the branch
question is settled.

## Notes for the Editor

- **Do not attempt findings 1 or 2 on `regression-cb0dad9c`.** Their target files
  (`tests/test_UAT_FC_REQ-142_site_store_port.test.ts`, `tests/support/site-factory.ts`,
  `tools/generate/src/cli/ai/toolbox.ts` in its ported form) do not exist here. They are `main`
  work. Attempts 1–29 applied zero mutations for exactly this reason; a thirty-first attempt on
  this branch will reach the same wall.
- **The loop should stop.** Per the failure/error taxonomy in `CLAUDE.md`, a branch that
  predates the code it is asked to validate is an **error** (broken precondition), not a
  recoverable **failure**. It has no fix-loop path by construction: no edit to a ticket, a test,
  or a source file on this branch clears it. Attempt 28 set `progress_made: false` deliberately
  to exit to the operator; this pass confirms the blocker is unchanged.
- **Survey hazard, carried forward from STORY-118's Technical Context.** Two heavy consumers of
  the editing surface embed NUL bytes as cache-key separators, so a plain recursive `grep`
  classifies them as binary and skips them silently. Every grep in this report forced text mode
  (`grep -I --text` / `git grep --text`); a survey that does not will under-report consumers.
- **REQ-143 changes nothing at this level.** It is `ready_to_reconcile` (imminent) and adds a
  third adapter (D1 + R2). REQ-142's body scopes it out explicitly. When it reconciles, expect
  new ACs on a new story rather than edits to these eleven.
