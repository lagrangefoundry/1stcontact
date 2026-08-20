---
uid: report-292b522e
id: REPORT-2547
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T21:53:03.936661+00:00'
updated_at: '2026-08-20T21:53:03.936661+00:00'
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

Thirty-fifth uat-level pass (`previous_attempt_count = 34`). Every fact below was re-derived
from git and the ticket store **this pass** — nothing inherited from `report-d302bbd2`
(REPORT-2545) or from attempt 34's fix summary (`report-f07da2ac`). Where this pass reaches the
same conclusion as its predecessor, the command that produced it is named so it can be re-run.

**What changed since the last pass:**

- `main` advanced again: **536** commits absent from this branch (528 two passes ago, 531 at
  attempt 34). `git grep -an "AC-1354|AC1354|AC-1353|AC1353" main -- tests tools packages apps`
  still returns **nothing**, so the new commits did not close finding 1.
- Attempt 34 applied its one lever: AC-1354's **Verification** clause was rewritten (criterion
  text preserved). I read the current AC body this pass — the rewrite is sound and is recorded
  as info-4 below. It does not close finding 1: the clause now specifies *how* to write the
  missing test; the test still does not exist.
- **This branch applied nothing to code or tests, again.** `git ls-files tools/generate/src/store`
  returns the same 8 modules; none of the 6 the ACs describe are present.

## Verification environment (re-derived this pass)

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` |
| merge-base with `main` | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4` |
| Divergence | `git rev-list --count HEAD..main` | **536** commits on `main` absent here |
| Store modules @ HEAD | `git ls-files tools/generate/src/store` | **8**: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @ `main` | `git ls-tree main --name-only tools/generate/src/store/` | **14** — the 8 above **plus** `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| Capability UATs @ HEAD | `git grep -aoE "test_UAT_AC13(2[0-9]\|5[0-9])_[A-Za-z0-9_]*" HEAD -- tests tools packages apps` | only AC-1350/1351/1352 in `reconciliation-l1-fold-measured-axes.test.ts` — a **different** capability. **Zero** for AC-1321–1329, AC-1353, AC-1354 |
| Capability UATs @ `main` | same grep against `main` | AC-1321–AC-1327 + AC-1329 in `reconciliation-site-storage-port.test.ts`; AC-1328 in `…workers.test.ts`. **9 of 9** behavioural ACs. AC-1353/AC-1354: **none** |
| Any AC-135x reference @ `main` | `git grep -an "AC-1354\|AC1354\|AC-1353\|AC1353" main -- tests tools packages apps` | **no output** |
| Port tests @ `main` | `git ls-tree main --name-only -r tests/` | `reconciliation-site-storage-port.test.ts`, `reconciliation-site-storage-port.workers.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-142_site_store_port.test.ts`, `support/site-factory.ts` — **none of these exist at HEAD** |
| AC blobs on `main` | `git ls-tree main --name-only .xgd/tickets/hot/acceptance_criterion-{003caa07,56798f01,d4cc3712}.md` | **only `d4cc3712`** (AC-1321). AC-1353 and AC-1354 exist only on this branch |
| Entry points @ `main` | `git grep -acn "fsSiteStore(" main -- tools packages apps` | **4 files, 1 hit each**: `store/fs-store.ts` (definition), `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts` |

All greps used `-a`: two of the heaviest consumers of the editing surface carry NUL bytes as
cache-key separators, and a plain recursive grep classifies them as binary and skips them
silently (the survey hazard STORY-118's Technical Context names).

**The controlling fact, re-confirmed.** The branch was cut at `0f44ef1ba`. REQ-141's and REQ-142's
implementation *and* their UATs landed on `main` afterwards. The ticket store is global; the branch
is not. This check is being asked to validate a uat-level matrix against a tree that contains
neither the code the ACs describe nor the tests that prove them.

## Cumulative Intent Considered

Statuses re-read this pass via `xgd ticket get` on each UID.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-119 | `request-64864801` | `free_and_reconciled` | 2026-07-31 | Request-time draft/edit renders; owns preview *freshness* (CAP-85). Cited by AC-1327 only to scope freshness **out** of this capability. | YES (boundary only) |
| REQ-141 | `request-b18d2056` | `free_and_reconciled` | 2026-08-15 | Workers-runtime test project: two vitest projects routed by filename, real D1/R2 bindings. Source of AC-1328, AC-1329. | **YES** |
| REQ-142 | `request-0dd62a5d` | `free_and_reconciled` | 2026-08-15 | The async `SiteStore` port with the filesystem behind it; no behaviour change. `depends_on: [REQ-141]`. Source of AC-1321–AC-1327 and of the branch-local AC-1353/AC-1354. | **YES** |
| BUNDLE-19 | `bundle-77b28def` | merged | — | Carrier for REQ-141 + REQ-142; STORY-118's `intent_uid`. | **YES** |
| REQ-143 | `request-18a48d63` | `ready_to_reconcile` | 2026-08-15 | The Cloudflare `SiteStore` (D1 + R2). REQ-142 scopes it out explicitly. Adds a *third* adapter later; retires nothing here. | imminent — **no AC impact** |

Chronology: REQ-119 → REQ-141 → REQ-142 → REQ-143.

**No intent in the ledger retires any behaviour this capability claims.** The capability body's
two named implementations (git-tracked FS tree, filesystem-free store) match REQ-142's scope
exactly; its two-runtime clause matches REQ-141's. There is no consistency drift between the ACs
and the intent that produced them — at this level the failure is entirely one of *evidence
location*, and one genuine coverage gap on `main`.

## Alignment Ledger

All 11 ACs are `active`, `kind: behavior`, `regression_only: false`, and hang off the single
story STORY-118 (`story_kind: feature`) — so all 11 are in scope for uat coverage (re-read this
pass via `xgd ticket list --type acceptance_criterion --filter fields.story_uid=story-3f4a5f2b`).
Coverage is assessed **on `main`**, because this worktree has none (finding 3). Column 3 is the
outcome *if the branch carried the code*; column 4 is the outcome *in the tree actually under check*.

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
| AC-1353 (`003caa07`) surface and port import no filesystem module | `test_UAT_FC_REQ-142_site_store_port.test.ts` — two cases under `// ── AC-2: the seam is real, not described ──` | substance covered; **untraceable by name** → warning (finding 2) | **absent** |
| AC-1354 (`56798f01`) each entry point names its store once; tool adapter edits through it | **none** | **gap** → violation (finding 1) | **absent** |

**Derivation for the AC-1353 row** (read this pass from
`git show main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts`):

- `it('UAT_FC_REQ-142 edit.ts imports no filesystem module')` — reads `tools/generate/src/cli/edit.ts`
  at test time and asserts it matches none of `from 'node:fs'`, `from 'node:path'`, `from '../store'`.
  Its comment states the claim explicitly: "The claim is about IMPORTS, because a transitive one is
  just as fatal."
- `it('UAT_FC_REQ-142 the port and its model reach no filesystem')` — loops
  `['site-store.ts', 'assemble.ts', 'journal-model.ts', 'memory-store.ts']` asserting neither
  `from 'node:` nor `from './fsutil'`, passing the module name as the assertion label so an
  offender is named on failure.

That is every module AC-1353 names, both halves of its import claim, and its "identify the
offending module" clause. The substance is proven; only the case *names* defeat
`test_UAT_AC{number}_` traceability.

**Derivation for the AC-1354 row** (re-run this pass, not inherited):

- `git grep -aoE "test_UAT_AC135[0-9]_…" main -- tests tools packages apps` → no match.
- `git grep -an "AC-1354|AC1354" main -- tests tools packages apps` → no match at all.
- `git grep -acn "fsSiteStore(" main -- tools packages apps` → exactly **4 files, one hit each**:
  the definition at `tools/generate/src/store/fs-store.ts`, and **one construction per entry
  point** — `tools/generate/src/cli/index.ts` (command line), `tools/generate/src/cli/builder.ts`
  (builder origin), `tools/generate/src/cli/ai/toolbox.ts` (assistant tool adapter).

So the production shape AC-1354 describes **is real on `main`**; nothing asserts it. Neither half —
single construction per entry point with no runtime selection, nor the adapter driven end to end
through an *injected* store — is asserted anywhere. A genuine coverage gap on `main`, independent
of the branch problem.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1354 (`acceptance_criterion-56798f01`) | `uat-add` | AC-1354 is active and derives from REQ-142 (`free_and_reconciled`), but has **no UAT on `main` and none here** — `git grep -an "AC-1354\|AC1354" main -- tests tools packages apps` returns nothing. Neither half of its Verification clause is asserted anywhere. | Author `test_UAT_AC1354_*` **on `main`**, following the Verification clause as rewritten by attempt 34: assert one `fsSiteStore(` construction in each of `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts` and none beneath them; then bind the separately-exported operations (`l1Operations`, `tools/generate/src/cli/ai/toolbox.ts`) against `makeMemorySite()` from `tests/support/site-factory.ts` and assert the copy edit / asset add / missing-source refusal triple. **Do not route through the toolbox construction helper** — it names the FS adapter after the options spread, so an injected store is discarded and the test would false-green on the filesystem. No production change is required. |
| 2 | warning | consistency | AC-1353 (`acceptance_criterion-003caa07`) | `uat-edit` | The two cases proving AC-1353 on `main` are named `UAT_FC_REQ-142 …` and bound to the AC only by a `// ── AC-2 …` section comment, so `test_UAT_AC{number}_` resolution finds nothing for AC-1353. Traceability defect only — the evidence itself is correct and complete (derivation above). | Rename the two cases in `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts` to `test_UAT_AC1353_*`. Target file does not exist on this branch. |
| 3 | needs_review | coverage | all 11 ACs / `capability-c4c7a854` | — | The capability's production code and its entire UAT set are **absent from the tree under check**. `regression-cb0dad9c` was cut at `0f44ef1ba`; REQ-141/REQ-142 landed on `main` afterwards and `main` is now **536** commits ahead. 6 of the 14 store modules, all 5 port test files, and 9 of 9 covering UATs exist only on `main`. Zero of 11 ACs are verifiable here, and neither remaining finding can be repaired here — the modules the tests read and the symbol they count do not exist on this branch. | Operator decision: (a) re-cut or refresh this regression branch from current `main`, or (b) exclude `capability-c4c7a854` from this regression run. Authoring the UATs here would mean porting REQ-141/REQ-142 feature work onto a regression branch. |
| 4 | info | — | AC-1354 (`56798f01`) | — | Attempt 34's `ac-edit` verified this pass by reading the current AC body: the Criterion is intact and the Verification clause now (a) splits the structural half from the behavioural half, (b) directs the author to the separately-exported operations rather than the toolbox helper, and (c) states the helper's option override is *intended* at that entry point so it is not misfiled as a `code-issue`. Sound, and it narrows finding 1 to pure test-authoring — but it does not close it. | none |
| 5 | info | — | AC-1321–AC-1329 | — | All nine behavioural ACs are correctly and non-redundantly covered on `main` — one UAT each, exercising real entry points against both `SITE_BACKENDS`, with no duplicate scenario in the same shape. Exclusivity is clean at this level. | none |

## Notes for the Editor

**This is the 35th consecutive pass reaching the same wall, and attempts 1–34 applied a combined
total of one ticket-body edit and zero source or test mutations.** That is not a fix loop making
slow progress; it is a terminal failure being routed as a recoverable one. Per `CLAUDE.md`'s
failure/error taxonomy, the condition in finding 3 has **no defined fix path by construction**:
the branch cannot grow the feature code, and the check cannot pass without it.

Two independent things must both happen before this capability's uat level can pass, and neither
can happen inside this loop:

1. **The branch must see the code** — re-cut or refresh `regression-cb0dad9c` from current `main`,
   or drop this capability from the regression run. (Finding 3.)
2. **`test_UAT_AC1354_*` must be authored on `main`** — re-cutting alone is not sufficient, because
   that UAT exists nowhere. (Finding 1.) Finding 2's rename is a cheap same-file follow-on.

Nothing in findings 1–3 is a production defect. The `fsSiteStore` construction sites on `main`
already match AC-1354's claim exactly; what is missing is the assertion, not the behaviour.
