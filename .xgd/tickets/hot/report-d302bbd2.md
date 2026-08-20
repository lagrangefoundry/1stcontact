---
uid: report-d302bbd2
id: REPORT-2545
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T21:44:44.498147+00:00'
updated_at: '2026-08-20T21:44:44.498147+00:00'
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

Thirty-fourth uat-level pass (`previous_attempt_count = 33`). Cumulative source/test mutations
applied by attempts 1–33: **0** (re-derived below from `git log`, not inherited).

Every fact below was re-derived from git and the ticket store **this pass**; nothing was carried
over from `report-6fc7ba83` (REPORT-2543). Where this pass reaches the same conclusion as its
predecessor, the command that produced it is listed so it can be re-run. **What is new this pass:**

- **`main` advanced again — 508 → 528 commits ahead**, HEAD now `fe7dca0da` (2026-08-20 14:39:30).
  `git grep -an "AC-1354|AC1354|AC-1353|AC1353" main -- tests tools packages apps` still returns
  **nothing**, so the 20 new commits did not close finding 1 (info-6).
- **This branch applied nothing again.** Attempt 33 (`report-12460155`) recorded
  `fixes_applied: 0`, `progress_made: false`. `git log -3 -- . ':(exclude).xgd'` still ends at
  `fb283f48b` (2026-08-20 07:53:10) — earlier than all 33 attempts.
- **The AC-1353 / AC-1354 divergence is confirmed at the blob level again**:
  `git ls-tree main --name-only .xgd/tickets/hot/acceptance_criterion-{003caa07,56798f01,d4cc3712}.md`
  returns **only `d4cc3712`** (AC-1321). The two ACs whose findings drive this loop exist only here.

## Verification environment (re-derived this pass)

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` |
| HEAD | `git log -5 --format='%h %ci %s'` | `d2a5d3012` … — workflow/ticket/report commits only |
| Worktree cleanliness | `git status --short` | empty |
| merge-base with `main` | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4` |
| `main` HEAD | `git log -1 --format='%H %ci' main` | `fe7dca0da6c91b4446e3e1b96d2407375c7f7605`, `2026-08-20 14:39:30 -0700` |
| Divergence | `git rev-list --count HEAD..main` | **528** commits on `main` absent here (508 last pass) |
| Last non-`.xgd` commit here | `git log -3 --format='%h %ci %s' -- . ':(exclude).xgd'` | `fb283f48b`, **2026-08-20 07:53:10 -0700** — unchanged across all 33 attempts |
| Store modules @ HEAD | `git ls-files tools/generate/src/store` | **8**: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @ `main` | `git ls-tree main --name-only tools/generate/src/store/` | **14** — the 8 above **plus** `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| Port tests @ HEAD | `git ls-files tests` filtered for `site.?store\|site-factory\|workers\.test` | **0** |
| Workers-routed files @ HEAD | `git ls-files \| grep -c "workers.test.ts"` | **0**; `vitest.config.mts` is the single config |
| Port tests @ `main` | `git ls-tree main --name-only -r tests/` | `reconciliation-site-storage-port.test.ts`, `reconciliation-site-storage-port.workers.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-142_site_store_port.test.ts`, `support/site-factory.ts` |
| Capability UATs @ HEAD | `git grep -aoE "test_UAT_AC13(2[0-9]\|5[0-9])_[A-Za-z0-9_]*" HEAD -- tests tools packages apps` | only AC-1350/1351/1352 in `reconciliation-l1-fold-measured-axes.test.ts` — a **different** capability. **Zero** for AC-1321–1329, AC-1353, AC-1354 |
| Capability UATs @ `main` | same grep against `main` | AC-1321–AC-1327 + AC-1329 in `reconciliation-site-storage-port.test.ts`; AC-1328 in `…workers.test.ts`. **9 of 9.** AC-1353/AC-1354: none |
| Any AC-135x reference @ `main` | `git grep -an "AC-1354\|AC1354\|AC-1353\|AC1353" main -- tests tools packages apps` | **no output** |
| AC blobs on `main` | `git ls-tree main --name-only .xgd/tickets/hot/acceptance_criterion-{003caa07,56798f01,d4cc3712}.md` | **only `d4cc3712`** (AC-1321) |

**The controlling fact.** The branch was cut at `0f44ef1ba`. REQ-141's and REQ-142's implementation
and their UATs landed on `main` afterwards. The ticket store is global; the branch is not. This
check is being asked to validate a uat-level matrix against a tree that contains neither the code
the ACs describe nor the tests that prove them.

All greps used `-a`: two of the heaviest consumers of the editing surface carry NUL bytes as
cache-key separators and a plain recursive grep classifies them as binary and skips them silently.

## Cumulative Intent Considered

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-119 | `request-64864801` | `free_and_reconciled` | 2026-07-31 | Request-time draft/edit renders; owns preview *freshness* (CAP-85). Cited by AC-1327 only to scope freshness **out** of this capability. | YES (boundary only) |
| REQ-141 | `request-b18d2056` | `free_and_reconciled` | 2026-08-15 | Workers-runtime test project: two vitest projects routed by filename, real D1/R2 bindings. Source of AC-1328, AC-1329. `bundled_in: bundle-77b28def`. | **YES** |
| REQ-142 | `request-0dd62a5d` | `free_and_reconciled` | 2026-08-15 | The async `SiteStore` port with the filesystem behind it; no behaviour change. Source of AC-1321–AC-1327 and of the two branch-local ACs 1353/1354. `depends_on: [REQ-141]`. | **YES** |
| BUNDLE-19 | `bundle-77b28def` | merged | — | Carrier for REQ-141 + REQ-142. | **YES** |
| REQ-143 | `request-18a48d63` | `ready_to_reconcile` | 2026-08-15 | The Cloudflare `SiteStore` (D1 + R2). REQ-142 scopes it out explicitly. Adds a *third* adapter later; retires nothing here. | imminent — **no AC impact** |

Chronology: REQ-119 → REQ-141 → REQ-142 → REQ-143. Statuses re-read this pass via
`xgd ticket get` on each UID.

**No intent in the ledger retires any behaviour this capability claims.** The capability body's two
named implementations (the git-tracked FS tree, the filesystem-free store) match REQ-142's scope
exactly; the two-runtime clause matches REQ-141's. There is no consistency drift between the ACs
and the intent that produced them — the failure at this level is entirely one of *evidence
location*.

## Alignment Ledger

All 11 ACs are `active`, `kind: behavior`, `regression_only: false|unset`, and all hang off the
single story STORY-118 (`story_kind: feature`) — so all 11 are in scope for uat coverage
(re-read this pass via `xgd ticket list --view --flags frontmatter,fields`). Coverage is assessed
**on `main`**, because this worktree has none (finding 3). Column 3 is the outcome *if the branch
carried the code*; column 4 is the outcome *in the tree actually under check*.

| AC | Covering UAT on `main` | Outcome vs its AC body | Outcome in this worktree |
|---|---|---|---|
| AC-1321 storage answers totally, held and unheld | `reconciliation-site-storage-port.test.ts::test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld` | aligned | **absent** |
| AC-1322 assets as bytes, pages as keys | `…::test_UAT_AC1322_assets_cross_as_bytes_and_pages_as_keys_never_locations` | aligned | **absent** |
| AC-1323 multi-file command = one whole change | `…::test_UAT_AC1323_a_multi_file_command_reaches_storage_as_one_whole_change` | aligned | **absent** |
| AC-1324 whole surface completes with no filesystem | `…::test_UAT_AC1324_the_whole_editing_surface_completes_with_no_filesystem` | aligned | **absent** |
| AC-1325 same seed answers identically over both stores | `…::test_UAT_AC1325_the_same_seed_answers_identically_over_both_stores` | aligned | **absent** |
| AC-1326 arguments/output/refusal envelopes unchanged | `…::test_UAT_AC1326_command_arguments_output_and_refusal_envelopes_are_unchanged` | aligned | **absent** |
| AC-1327 draft preview from whichever store rendered it | `…::test_UAT_AC1327_the_draft_preview_is_served_from_whichever_store_rendered_it` | aligned | **absent** |
| AC-1328 two runtimes, real bindings in the Workers one | `reconciliation-site-storage-port.workers.test.ts::test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings` | aligned | **absent** (0 `*.workers.test.ts` files here; single vitest config) |
| AC-1329 the split cost nothing the single runtime provided | `reconciliation-site-storage-port.test.ts::test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly` | aligned | **absent** |
| AC-1353 surface and port import no filesystem module | `test_UAT_FC_REQ-142_site_store_port.test.ts` — two cases under `// ── AC-2: the seam is real, not described ──` | covered; **untraceable by name** → warning (finding 2) | **absent** |
| AC-1354 each entry point names its store once; tool adapter edits through it | **none** | **gap** → violation (finding 1) | **absent** |

**Derivation for the AC-1353 row** (re-read this pass from `git show main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts`):
- `it('UAT_FC_REQ-142 edit.ts imports no filesystem module')` — asserts the editing-surface module
  matches none of `from 'node:fs'`, `from 'node:path'`, `from '../store'`.
- `it('UAT_FC_REQ-142 the port and its model reach no filesystem')` — loops
  `['site-store.ts', 'assemble.ts', 'journal-model.ts', 'memory-store.ts']` asserting neither
  `from 'node:` nor `from './fsutil'`, passing the module name as the assertion label so an offender
  is named on failure.

That is every module AC-1353 names, both halves of its import claim, and its "identify the
offending module" clause. The substance is proven; only the name defeats `test_UAT_AC{number}_`
traceability.

**Derivation for the AC-1354 row** (re-run this pass, not inherited):
- `git grep -aoE "test_UAT_AC135[0-9]_…" main -- tests tools packages apps` → no match.
- `git grep -an "AC-1354|AC1354" main -- tests tools packages apps` → no match at all.
- `git grep -an "fsSiteStore(" main -- tools packages apps` → exactly **4** hits: the definition at
  `tools/generate/src/store/fs-store.ts:45`, and **one construction per entry point** —
  `tools/generate/src/cli/index.ts:1313` (command line), `tools/generate/src/cli/builder.ts:628`
  (builder origin), `tools/generate/src/cli/ai/toolbox.ts:505` (assistant tool adapter).

So the production shape AC-1354 describes **is real on `main`**; nothing asserts it. Its first half
— single construction per entry point, no runtime selection — is asserted nowhere, and its second
half — the adapter driven end to end through an *injected* store — is asserted nowhere. A genuine
coverage gap on `main`, independent of the branch problem.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1354 (`acceptance_criterion-56798f01`) | `uat-add` | AC-1354 is active and derives from REQ-142 (`free_and_reconciled`), but has **no UAT on `main` and none here**. Neither half of its Verification clause is asserted anywhere: (a) each of the three entry points constructs its store in exactly one place, with every layer beneath taking an injected store and none selecting or falling back at runtime; (b) the tool adapter, driven against an injected store, lands a copy edit that reads back with the change count advanced, adds an asset by reading the operator's source file itself and handing bytes across, and refuses a non-existent source path with the same code/path/hint the CLI produces. | Author `test_UAT_AC1354_*` **on `main`**. Both halves are testable with **no production change**, but **use `l1Operations`, not `createL1Toolbox`** (info-5). `l1Operations(slug, opts: EditOptions)` is exported at `tools/generate/src/cli/ai/toolbox.ts:176`; its own docstring says it is exported separately "because it is the whole of this surface's behaviour and it is worth being able to exercise it without a runtime import of the AI library" — drive it against `makeMemorySite()` from `tests/support/site-factory.ts`. `add_asset` reads the source file itself via `readSourceFile`, raising `CommandError{code:'NOT_FOUND', path:file, hint:'Pass a path to a readable file.'}` — that is the refusal envelope to assert. The single-construction half is structural, exactly as AC-1353's is: assert `fsSiteStore(` occurs exactly once in each of `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts` and nowhere below them. **Do not classify as `code-issue`** — the four `fsSiteStore(` sites on `main` already match the claim; only the assertion is missing. |
| 2 | warning | consistency | AC-1353 (`acceptance_criterion-003caa07`) | `uat-edit` | AC-1353's substance **is** proven on `main` in `tests/test_UAT_FC_REQ-142_site_store_port.test.ts` — every module it names, both the runtime-module imports and the filesystem-helper barrel, with the offender named on failure. But the two cases are named for the *intent* (`UAT_FC_REQ-142 …`) and bound to the AC only by a section comment, so `test_UAT_AC{number}_` resolves AC-1353 to nothing. | Rename to `test_UAT_AC1353_the_editing_surface_and_the_port_import_no_filesystem_module` (suffix `_edit_surface` / `_port_modules` to keep the two distinct), or add AC-named wrappers. Traceability only — the evidence is already correct. Not a violation. |
| 3 | needs_review | coverage | **all 11 ACs** / the capability as a whole | — (not repairable on this branch) | **The capability under check is not present in the tree under check.** `regression-cb0dad9c` was cut at `0f44ef1ba`; REQ-141's and REQ-142's implementation and UATs landed on `main` afterwards, and `main` is now **528** commits ahead. Here: six of the port's modules are absent (8 of 14), all four port test files and `tests/support/site-factory.ts` are absent, `vitest.config.mts` is a single project with zero `*.workers.test.ts` files to route, and a grep for every AC id and every port symbol returns nothing but a name collision. **Zero of 11 ACs are verifiable here.** This is branch topology, not matrix drift. | Escalate to the operator. Either (a) re-cut or refresh the regression branch from current `main` so the uat level is evaluated against the code it describes, or (b) exclude `capability-c4c7a854` from this regression run. **Do not** author UATs for this capability on this branch: it would require porting REQ-141/REQ-142's production code onto a regression branch, which is feature work in the one place it must not happen. |
| 4 | info | — | AC-1353 + AC-1354 | — | Both ACs exist **only on this regression branch** — `git ls-tree main` finds `acceptance_criterion-d4cc3712.md` (AC-1321) but neither `003caa07` nor `56798f01`. They were authored by an earlier **ac-level** fix pass in this same regression run. | Explains why findings 1 and 2 are structurally unclosable here: the ac-level stage added two criteria whose UATs can only be written against code that is not on this branch, so the uat-level stage that follows it is guaranteed to fail. A loop-design observation, not a matrix edit. |
| 5 | info | — | AC-1354 remediation route | — | Re-confirmed this pass. `createL1Toolbox` builds `new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })` at `tools/generate/src/cli/ai/toolbox.ts:505` — `store:` is written **after** the spread, so an injected `opts.store` is silently overridden by the filesystem adapter. An editor routing finding 1 through `createL1Toolbox` writes a test that passes while running on the filesystem — a false green on the one AC whose point is that no filesystem is reached — or wrongly concludes a production change is needed and misfiles finding 1 as `code-issue`. The working seam is the separately exported `l1Operations` at `:176`. | No matrix action; it changes *how* finding 1 must be closed. |
| 6 | info | — | the fix loop | — | `git log -3 -- . ':(exclude).xgd'` shows the last non-`.xgd` commit on this branch is `fb283f48b` at **2026-08-20 07:53:10**, unchanged across all 33 attempts. Attempt 33 (`report-12460155`) recorded `fixes_applied: 0`, `progress_made: false`. Meanwhile `main` gained 20 commits during the last cycle alone (508 → 528 ahead) and still contains no reference to AC-1353 or AC-1354. | The loop is not converging and cannot; nothing about elapsed attempts changes the inputs. |

## Why this is not reported as 11 coverage violations

Mechanically this worktree has 11 active ACs and zero tests, so 11 `uat-add` violations would be a
true sentence. It would also be a false instruction: it directs the fix loop to author UATs for
production code that is absent, on a branch that must not carry feature work. Finding 3 states the
same fact in the shape that admits a correct action. Findings 1 and 2 are the *real* matrix gaps —
derived against `main`, where the code lives — and are recorded so the 33 iterations spent here
leave behind something actionable once the branch question is settled.

## Notes for the Editor

- **Do not attempt findings 1 or 2 on `regression-cb0dad9c`.** Their target files
  (`tests/test_UAT_FC_REQ-142_site_store_port.test.ts`, `tests/support/site-factory.ts`,
  `tools/generate/src/cli/ai/toolbox.ts` in its ported form, and the six absent
  `tools/generate/src/store/*` modules) do not exist here. They are `main` work. Attempts 1–33
  applied zero mutations for exactly this reason; a 35th attempt on this branch reaches the same
  wall.
- **If finding 1 is attempted on `main`, read info-5 first.** The obvious injection route
  (`createL1Toolbox`) does not inject — its `store:` key overrides the spread. Use `l1Operations`.
- **The loop should stop, and the stop is an operator decision, not a fix.** No edit to a ticket, a
  test or a source file *on this branch* clears the blocker. Per the failure/error taxonomy this
  behaves as a **terminal failure** — an expected dead end with no fix-loop path by construction —
  and the repeated `@fail` → `fix_uat_validation` → `@fail` cycle is the symptom of it being routed
  as a recoverable failure instead.
- **Re-cutting is necessary but not sufficient.** Findings 4 + 1 together: even a branch carrying
  all of `main`'s tests would still fail this check on AC-1354, because that UAT exists nowhere.
  Closing this capability's uat level needs both (a) the branch to see the code and (b)
  `test_UAT_AC1354_*` authored on `main`.
- **REQ-143 changes nothing at this level.** `ready_to_reconcile` (imminent), adds a third adapter
  (D1 + R2); REQ-142's body scopes it out explicitly. When it reconciles, expect new ACs and expect
  `SITE_BACKENDS` in `tests/support/site-factory.ts` to grow a third entry — AC-1325 ("the same
  starting site answers identically over both stores") will then need its wording checked against a
  three-adapter world. Not a finding today.
- **Two survey hazards, both re-applied in method this pass.** (a) Heavy consumers of the editing
  surface carry NUL bytes as cache-key separators, so a plain recursive grep classifies them as
  binary and skips them silently — every grep here used `-a`. (b) `SiteStore` is an ambiguous
  symbol: `apps/public-site/src/site-store` is an **unrelated** type from the public-site-serving
  capability and is the only thing a symbol-name survey finds on this branch. Survey the editing
  port **by module path**, never by symbol name.
