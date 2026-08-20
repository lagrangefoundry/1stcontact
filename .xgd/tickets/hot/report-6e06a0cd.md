---
uid: report-6e06a0cd
id: REPORT-2553
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T22:15:55.537463+00:00'
updated_at: '2026-08-20T22:15:55.537463+00:00'
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

Thirty-eighth uat-level pass (`previous_attempt_count = 37`). Every load-bearing fact below was
re-derived from git and the ticket store **this pass**, at source, before consulting attempt 37's
check (`report-cf7943b7`) or its fix call (`report-3421c03a`). I reached the same three findings
independently.

**What changed since attempt 37: nothing material.**

- Divergence from `main` re-measured: **549** commits absent from this branch — unchanged from
  attempt 37 (549), after 548 → 546 → 536 → 531 across earlier passes.
- `git ls-files tools/generate/src/store` still returns the same **8** modules. The branch applied
  nothing to code or tests again; attempt 37's fix call (`report-3421c03a`) declared
  `fixes_applied: 0` / `progress_made: false` deliberately, the third consecutive such call.
- No AC body changed. AC-1353 and AC-1354 re-read at source: both `Status: active`,
  `kind: behavior`, `regression_only: False`. AC-1354's Verification clause is still attempt 34's
  rewrite and is still sound.

## Verification environment (re-derived this pass)

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` @ `a169107729688f106c36d327980864d96e85c1be` |
| merge-base with `main` | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4`, committed **2026-08-19 17:43:02 -0700** |
| Divergence | `git rev-list --count HEAD..main` | **549** commits on `main` absent here (`main..HEAD` = 864) |
| Store modules @HEAD | `git ls-files tools/generate/src/store` | **8**: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @`main` | `git ls-tree -r --name-only main -- …` | **14** — the 8 above **plus** `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| Capability UATs @HEAD | `git grep -aoE "test_UAT_AC(1321\|…\|1354)_[A-Za-z0-9_]*" HEAD -- tests tools packages apps` | **no output** — zero of 11 ACs carry a UAT on this branch |
| Capability UATs @`main` | same grep against `main` | **9 hits** — `tests/reconciliation-site-storage-port.test.ts` (AC-1321–1327, 1329) and `tests/reconciliation-site-storage-port.workers.test.ts` (AC-1328) |
| AC-1353 / AC-1354 UATs | same grep, both refs | **no hit on either ref** |
| Workers-routed files @HEAD | `git ls-files 'tests/*.workers.test.ts'` | **0** — AC-1328's routing convention has no carrier here |
| Port test files @HEAD | `git ls-files tests/reconciliation-site-storage-port.test.ts tests/test_UAT_FC_REQ-142_site_store_port.test.ts` | **0** — both absent |
| `fsSiteStore(` construction @`main` | `git grep -an "fsSiteStore" main -- tools packages apps` | definition `store/fs-store.ts:45`, re-export `store/index.ts:52`, and **exactly one construction per entry point**: `cli/index.ts:1313`, `cli/builder.ts:628`, `cli/ai/toolbox.ts:505` |
| `fsSiteStore` in tests @`main` | `git grep -an "fsSiteStore" main -- tests` | **6 hits, all fixture construction** (`req11-structured-edit.test.ts:21,39,43`; `support/site-factory.ts:7,118,152`) — nothing asserts the construction *count* |
| Toolbox asset coverage @`main` | `git grep -an "asset" main -- tests/test_UAT_FC_REQ-122_tool_surface.test.ts` | one incidental `assets/hero.jpg` literal — **no asset-add-from-source case anywhere** |

All greps used `-a`. Two of the heaviest consumers of the editing surface carry NUL bytes as
cache-key separators, so a plain recursive grep classifies them as binary and skips them silently.
On the symbol side, `SiteStore` resolves to two unrelated types (this editing port and the
public-serving `apps/public-site/src/site-store.ts`, CAP-82), so the port must be located by path,
not by name.

**The controlling fact, re-confirmed with dates this pass.** The branch was cut at `0f44ef1ba` on
2026-08-19 17:43; REQ-141's and REQ-142's implementation *and* their UATs landed on `main` at
`c36402287` on 2026-08-20 05:21 — roughly 11.5 hours later. The ticket store is global; the branch
is not. This check is being asked to validate a uat-level matrix against a tree that contains
neither the code the ACs describe nor the tests that prove them.

## Cumulative Intent Considered

At `uat` level the AC bodies are the working reference. The ledger is carried because finding 3
turns on *which intent landed where*, and because AC-1327 scopes a neighbouring capability's
behaviour out by name.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-119 | `request-64864801` | `free_and_reconciled` | 2026-07-31 | Request-time draft/edit renders; owns preview *freshness* (CAP-85). Cited by AC-1327 only to scope freshness **out** of this capability. | YES (boundary only) |
| REQ-141 | `request-b18d2056` | `free_and_reconciled` | 2026-08-15 | Workers-runtime test project: two vitest projects routed by filename, real D1/R2 bindings. Source of AC-1328, AC-1329. | **YES** |
| REQ-142 | `request-0dd62a5d` | `free_and_reconciled` | 2026-08-15 | The async `SiteStore` port with the filesystem behind it; no behaviour change. `depends_on: [REQ-141]`. Source of AC-1321–AC-1327 and of the branch-local AC-1353/AC-1354. | **YES** |
| BUNDLE-19 | `bundle-77b28def` | merged | — | Carrier for REQ-141 + REQ-142; STORY-118's `intent_uid`. | **YES** |
| REQ-143 | `request-18a48d63` | `ready_to_reconcile` | 2026-08-15 | The Cloudflare `SiteStore` (D1 + R2). REQ-142 scopes it out explicitly. Adds a *third* adapter later; retires nothing here. | imminent — **no AC impact** |

Chronology: REQ-119 → REQ-141 → REQ-142 → REQ-143.

**No intent in the ledger retires any behaviour this capability claims.** The capability body's two
named implementations (git-tracked FS tree, filesystem-free store) match REQ-142's scope exactly;
its two-runtime clause matches REQ-141's. There is no consistency drift between the ACs and the
intent that produced them — at this level the failure is entirely one of *evidence location*, plus
one genuine coverage gap that exists on `main` too.

## Alignment Ledger

All 11 ACs hang off the single story STORY-118 (`story_kind: feature`), so all 11 are in scope for
uat coverage. Coverage is assessed **on `main`**, because this worktree has none (finding 3).
Column 3 is the outcome *if the branch carried the code*; column 4 is the outcome *in the tree
actually under check*.

| AC | Covering UAT on `main` | Outcome vs its AC body | Outcome in this worktree |
|---|---|---|---|
| AC-1321 (`d4cc3712`) storage answers totally, held and unheld | `reconciliation-site-storage-port.test.ts::test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld` | aligned | **absent** |
| AC-1322 (`f713cba6`) assets as bytes, pages as keys | `…::test_UAT_AC1322_assets_cross_as_bytes_and_pages_as_keys_never_locations` | aligned | **absent** |
| AC-1323 (`44c1d962`) multi-file command = one whole change | `…::test_UAT_AC1323_a_multi_file_command_reaches_storage_as_one_whole_change` | aligned | **absent** |
| AC-1324 (`31f6a0c5`) whole surface completes with no filesystem | `…::test_UAT_AC1324_the_whole_editing_surface_completes_with_no_filesystem` | aligned | **absent** |
| AC-1325 (`6a7b61e4`) same seed answers identically over both stores | `…::test_UAT_AC1325_the_same_seed_answers_identically_over_both_stores` | aligned | **absent** |
| AC-1326 (`d08eae5f`) arguments/output/refusal envelopes unchanged | `…::test_UAT_AC1326_command_arguments_output_and_refusal_envelopes_are_unchanged` | aligned | **absent** |
| AC-1327 (`16093733`) draft preview from whichever store rendered it | `…::test_UAT_AC1327_the_draft_preview_is_served_from_whichever_store_rendered_it` | aligned | **absent** |
| AC-1328 (`c8728ae8`) two runtimes, real bindings in the Workers one | `reconciliation-site-storage-port.workers.test.ts::test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings` | aligned | **absent** (0 `*.workers.test.ts` files here) |
| AC-1329 (`ae2c7f77`) the split cost nothing the single runtime provided | `reconciliation-site-storage-port.test.ts::test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly` | aligned | **absent** |
| AC-1353 (`003caa07`) editing surface + port import no filesystem module | **none by AC name.** Substantive evidence exists, mis-named: `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` (`edit.ts` imports no `node:fs` / `node:path` / `../store`) and `:115` (`site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts` import no `node:` and no `./fsutil`) | **evidence complete, traceability broken** → finding 2 | **absent** |
| AC-1354 (`56798f01`) each entry point names its store once; tool adapter edits through it | **none, on either ref.** The code satisfies the structural claim on `main` — one `fsSiteStore(` per entry point at `cli/index.ts:1313`, `cli/builder.ts:628`, `cli/ai/toolbox.ts:505`, none beneath — but **nothing asserts it**, and no test drives the tool adapter's asset-add-from-source or its missing-source refusal | **genuine coverage gap** → finding 1 | **absent** |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1354 (`acceptance_criterion-56798f01`) | `uat-add` | AC-1354 is `Status: active`, `kind: behavior`, `regression_only: False`, and has **no UAT on either ref** — `git grep -aoE "test_UAT_AC1354_…"` returns nothing against `HEAD` or `main`. Neither half of its Verification clause is asserted anywhere: no test counts `fsSiteStore(` constructions per entry point (all 6 test-side hits on `main` are fixture construction — `req11-structured-edit.test.ts:21,39,43`, `support/site-factory.ts:7,118,152`), and no test drives the assistant's tool adapter through an injected store for a copy edit + asset-add-from-source + missing-source refusal. Sourced from REQ-142 (`free_and_reconciled`). | Author `test_UAT_AC1354_*` **on `main`**: (a) structural — read `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts` and assert exactly one `fsSiteStore(` each, and zero in every module beneath; (b) behavioural — construct the tool adapter over `makeMemorySite()`, apply a copy edit and assert it reads back with the change count advanced, add an asset from a real source file and assert the bytes land under the given name, then re-invoke with a non-existent source path and assert the refusal carries the same not-found code, path and hint the CLI produces for the same input. Do **not** route the behavioural half through the toolbox construction helper — it builds its own `fsSiteStore` at `toolbox.ts:505` and would defeat the injected-store claim. |
| 2 | warning | consistency | AC-1353 (`acceptance_criterion-003caa07`) | `uat-edit` | AC-1353's evidence is **correct and complete on `main`** but carries no AC-traceable name: the two cases live at `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` and `:115` as `UAT_FC_REQ-142 …`. They assert exactly what the AC's Verification clause asks — absence of `node:fs`/`node:path`/`../store` from the editing surface, and absence of `node:` and `./fsutil` from `site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts`, each identifying the offending module by name via the `expect(source, name)` label. A UAT-by-name index cannot see them, which is why coverage reads as zero. | Rename both cases to `test_UAT_AC1353_*` **on `main`**, in place. No assertion change is warranted — this is traceability only. Cheap same-file follow-on to finding 1 if both are done in one pass. |
| 3 | needs_review | coverage | `capability-c4c7a854` — all 11 ACs | — | The tree under check contains neither the production code the ACs describe nor the tests that prove them. `tools/generate/src/store` has 8 modules here against 14 on `main`; the port itself (`site-store.ts`), both adapters (`fs-store.ts`, `memory-store.ts`), the assembly path (`assemble.ts`) and the journal (`journal.ts`, `journal-model.ts`) are all absent. Zero of 11 ACs carry a UAT here; there are zero `*.workers.test.ts` files, so AC-1328's routing convention has no carrier at all. Branch cut `0f44ef1ba` 2026-08-19 17:43; the feature and its UATs landed on `main` at `c36402287` 2026-08-20 05:21, ~11.5h later. **This is not drift** — the matrix is correct and `main` largely satisfies it; the branch simply predates the work. No fix exists in this worktree by construction. | **Operator decision**: (a) re-cut or refresh `regression-cb0dad9c` from current `main`, or (b) exclude `capability-c4c7a854` from this regression run. Note that (a) alone does **not** close finding 1 — that UAT exists nowhere. |
| 4 | info | consistency | AC-1353, AC-1354 | — | Both AC bodies were re-read at source this pass and are sound against REQ-142. AC-1354's Verification clause (attempt 34's rewrite) correctly splits the structural half from the behavioural half and steers the author away from the toolbox construction helper. No `ac-edit` is warranted on either. | none |
| 5 | info | consistency | AC-1354 vs production code | — | Findings 1 and 2 are **not** `code-issue`. The `fsSiteStore(` construction sites on `main` already match AC-1354's structural claim exactly — one per entry point, none beneath. What is missing is the assertion, not the behaviour. | none |

## Notes for the Editor

**Findings 1 and 2 are not independent of finding 3 — they collapse into it.** Both are
"author or rename a test against module M", and every M named lives only on `main`. That is why
the last three fix calls each returned `fixes_applied: 0` honestly rather than evasively: the only
mutations available in this worktree are fabrications — authoring a test that asserts against
modules which do not exist, or setting `uat_coverage` on AC-1353/AC-1354 to manufacture a passing
signal for evidence that is not there. The latter is precisely the failure mode this check exists
to catch, and `uat_coverage` is owned by the uat-coverage check/fix pair regardless.

**This is a terminal failure being routed as a recoverable one.** Per the failure/error taxonomy
in `CLAUDE.md`, the fix loop's contract is that a failure has a defined path. Here it does not:
the branch cannot grow REQ-141/REQ-142's feature code without that being feature work on a
regression branch, and the check cannot pass without it. Thirty-eight passes have now re-derived
the same three facts and reached the same verdict. A thirty-ninth will do the same.

**The divergence is not shrinking.** 531 → 536 → 546 → 548 → 549 → 549 over six passes. Deferring
the re-cut makes it larger, not smaller. Only the last interval was flat, and only because `main`
happened not to advance.

**Two survey hazards for whoever picks this up on `main`.** Force text mode (`grep -a`): two of the
heaviest consumers of the editing surface carry NUL bytes as cache-key separators and are silently
skipped as binary otherwise. And locate the port by path, not by symbol — `SiteStore` resolves to
two unrelated types, this editing port and the public-serving `apps/public-site/src/site-store.ts`
under CAP-82.
