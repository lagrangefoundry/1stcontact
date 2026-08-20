---
uid: report-cf7943b7
id: REPORT-2551
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T22:09:37.992212+00:00'
updated_at: '2026-08-20T22:09:37.992212+00:00'
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

Thirty-seventh uat-level pass (`previous_attempt_count = 36`). Every load-bearing fact below was
re-derived from git and the ticket store **this pass**, at source, before consulting attempt 36's
check (`report-b4181503`). I reached the same three findings independently; two numbers moved and
are given as re-measured.

**What changed since attempt 36:**

- `main` advanced again: **549** commits absent from this branch (548 at attempt 36's fix call, 546
  at its check, 536 at 35, 531 at 34). The new commits did not close finding 1 — no
  `test_UAT_AC1354_*` exists on either ref.
- **This branch applied nothing to code or tests, again.** `git ls-files tools/generate/src/store`
  returns the same 8 modules. Attempt 36's fix call (`report-301b3afb`) declared `fixes_applied: 0`,
  `progress_made: false` deliberately, repeating attempt 35's routing decision.
- No AC body changed this pass (AC-1353 and AC-1354 re-read at source; AC-1354's Verification clause
  is still attempt 34's rewrite).

## Verification environment (re-derived this pass)

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` |
| merge-base with `main` | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4`, committed **2026-08-19 17:43:02 -0700** |
| Divergence | `git rev-list --count HEAD..main` | **549** commits on `main` absent here |
| When the UATs landed on `main` | `git log --format='%h %ci %s' main -- tests/reconciliation-site-storage-port.test.ts` | `c36402287` — **2026-08-20 05:21:06 -0700**, ~11.5h *after* this branch was cut |
| Store modules @ HEAD | `git ls-files tools/generate/src/store` | **8**: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @ `main` | `git ls-tree -r --name-only main -- tools/generate/src/store` | **14** — the 8 above **plus** `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| Capability UATs @ HEAD | `git grep -aoE "test_UAT_AC(1321\|…\|1354)_[a-zA-Z0-9_]*" HEAD -- tests tools packages apps` | **no output** — zero of 11 ACs carry a UAT here |
| Capability UATs @ `main` | same grep against `main` | **9 hits**: `tests/reconciliation-site-storage-port.test.ts` (AC-1321–1327, 1329) and `tests/reconciliation-site-storage-port.workers.test.ts` (AC-1328). **AC-1353 and AC-1354: no hit on either ref** |
| Workers-marked files @ HEAD | `git ls-files 'tests/*.workers.test.ts'` | **0** — AC-1328's routing convention has no carrier on this branch |
| Entry points @ `main` | `git grep -ac "fsSiteStore(" main -- tools packages apps` | **4 files, 1 hit each**: `store/fs-store.ts` (definition), `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts` |
| `fsSiteStore` in tests @ `main` | `git grep -an "fsSiteStore" main -- tests` | **6 hits, all fixture construction** (`req11-structured-edit.test.ts:21,39,43`; `support/site-factory.ts:7,118,152`) — nothing asserts the construction *count* |

All greps used `-a`. Two of the heaviest consumers of the editing surface carry NUL bytes as
cache-key separators, so a plain recursive grep classifies them as binary and skips them silently.
On the symbol side, `SiteStore` resolves to two unrelated types (the editing port and the
public-serving `apps/public-site/src/site-store.ts`, CAP-82), so the port must be located by path,
not by name.

**The controlling fact, re-confirmed with dates this pass.** The branch was cut at `0f44ef1ba` on
2026-08-19 17:43; REQ-141's and REQ-142's implementation *and* their UATs landed on `main` on
2026-08-20 05:21. The ticket store is global; the branch is not. This check is being asked to
validate a uat-level matrix against a tree that contains neither the code the ACs describe nor the
tests that prove them.

## Cumulative Intent Considered

At `uat` level the AC bodies are the working reference; the ledger is carried because finding 3
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
uat coverage. AC-1353 and AC-1354 re-read at source this pass: both `Status: active`,
`kind: behavior`, `regression_only: False`. Coverage is assessed **on `main`**, because this
worktree has none (finding 3). Column 3 is the outcome *if the branch carried the code*; column 4 is
the outcome *in the tree actually under check*.

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
| AC-1353 (`003caa07`) surface and port import no filesystem module | `test_UAT_FC_REQ-142_site_store_port.test.ts:105` and `:115`, under `// ── AC-2: the seam is real, not described ──` | substance covered; **untraceable by name** → warning (finding 2) | **absent** |
| AC-1354 (`56798f01`) each entry point names its store once; tool adapter edits through it | **none** | **gap** → violation (finding 1) | **absent** |

**Derivation for the AC-1353 row** (read at source this pass from
`git show main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts`):

- `it('UAT_FC_REQ-142 edit.ts imports no filesystem module')` (line 105) — reads `edit.ts` at test
  time and asserts it matches none of `from 'node:fs'`, `from 'node:path'`, `from '../store'`.
- `it('UAT_FC_REQ-142 the port and its model reach no filesystem')` (line 115) — loops
  `['site-store.ts', 'assemble.ts', 'journal-model.ts', 'memory-store.ts']` asserting neither
  `from 'node:` nor `from './fsutil'`, passing the module name as the assertion label so an offender
  is named on failure.

That is every module AC-1353's Criterion names, both halves of its import claim, and its "identify
the offending module" clause. The substance is proven; only the case *names* defeat
`test_UAT_AC{number}_` traceability. The file's section comments (`AC-2`, `AC-4 / AC-7`, `AC-5`)
are REQ-142's *internal* numbering, not matrix AC identifiers, so they do not restore the link.

**Derivation for the AC-1354 row** (re-run at source this pass):

- No `test_UAT_AC1354_*` on either ref (grep above).
- `git grep -an "fsSiteStore" main -- tests` → 6 hits, **all fixture construction**. No test asserts
  the structural half (one construction per entry point, none beneath).
- The file that covers AC-1353 contains no case driving the assistant tool adapter against an
  injected store; its 23 cases are the port-behaviour suite (read this pass via its `it(`/`describe(`
  outline).
- `git grep -an -C1 "fsSiteStore(" main -- <the three entry points>` → the production shape AC-1354
  describes **is real on `main`**: `cli/index.ts:1313` (`editOptions`), `cli/builder.ts:628` (guarded
  by `if (!store)`, memoised into `STORES`), `cli/ai/toolbox.ts:505`. One each, none beneath.

So the behaviour exists and nothing asserts it — a genuine coverage gap on `main`, independent of the
branch problem. I also re-confirmed the hazard AC-1354's Verification clause warns about, at source:
`toolbox.ts:505` reads `new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })` — the
`store:` key follows the spread, so a store injected via `opts` is silently discarded there and a
naively-routed UAT would false-green on the filesystem.

**Consistency spot-checks** on the nine named UATs (the uat-level property is "does the test exercise
what its AC claims") were carried out at attempt 36 against the same two files at the same `main`
paths; the files are unchanged since (`c36402287` remains the only commit touching
`reconciliation-site-storage-port.test.ts`). Recorded as info-5.

No exclusivity problem: one UAT per covered AC, no scenario duplicated in the same shape.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1354 (`acceptance_criterion-56798f01`) | `uat-add` | AC-1354 is active (`kind: behavior`, re-read at source this pass) and derives from REQ-142 (`free_and_reconciled`), but has **no UAT on `main` and none here**. `git grep -aoE "test_UAT_AC1354_…" main` returns nothing, and `fsSiteStore`'s only six test references on `main` are fixture construction. Neither half of its Verification clause is asserted anywhere. | Author `test_UAT_AC1354_*` **on `main`**, per the Verification clause as rewritten at attempt 34: assert exactly one `fsSiteStore(` construction in each of `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts` and none beneath them; then bind the separately-exported operations against `makeMemorySite()` from `tests/support/site-factory.ts` and assert the copy-edit / asset-add / missing-source-refusal triple. **Do not route through the toolbox construction helper** — `toolbox.ts:505` names the FS adapter *after* the options spread, so an injected store is discarded and the test would false-green on the filesystem. No production change is required. |
| 2 | warning | consistency | AC-1353 (`acceptance_criterion-003caa07`) | `uat-edit` | The two cases proving AC-1353 on `main` are named `UAT_FC_REQ-142 …` (`test_UAT_FC_REQ-142_site_store_port.test.ts:105`, `:115`) and bound to the AC only by a `// ── AC-2 …` section comment carrying REQ-142's internal numbering, so `test_UAT_AC{number}_` resolution finds nothing for AC-1353. Traceability defect only — the evidence itself is correct and complete (derivation above). | Rename the two cases to `test_UAT_AC1353_*`. Target file does not exist on this branch. |
| 3 | needs_review | coverage | all 11 ACs / `capability-c4c7a854` | — | The capability's production code and its entire UAT set are **absent from the tree under check**. `regression-cb0dad9c` was cut at `0f44ef1ba` on 2026-08-19 17:43; the UATs landed on `main` at `c36402287` on 2026-08-20 05:21, and `main` is now **549** commits ahead. 6 of the 14 store modules, all 5 port test files and 9 of 9 covering UATs exist only on `main`; there are 0 `*.workers.test.ts` files here at all. Zero of 11 ACs are verifiable here, and neither remaining finding can be repaired here — the modules the tests read and the symbol they count do not exist on this branch. | Operator decision: (a) re-cut or refresh this regression branch from current `main`, or (b) exclude `capability-c4c7a854` from this regression run. Authoring the UATs here would mean porting REQ-141/REQ-142 feature work onto a regression branch. |
| 4 | info | — | AC-1354 (`56798f01`) | — | Attempt 34's `ac-edit` re-verified this pass by reading the current AC body at source: the Criterion is intact and the Verification clause (a) splits the structural half from the behavioural half, (b) directs the author to the separately-exported operations rather than the toolbox helper, and (c) states the helper's option override is *intended* at that entry point so it is not misfiled as a `code-issue`. Sound, and it narrows finding 1 to pure test-authoring — but it does not close it. | none |
| 5 | info | — | AC-1321–AC-1329 | — | All nine behavioural ACs are covered on `main` — one UAT each, no duplicate scenario in the same shape; consistency verified at attempt 36 against files unchanged since (`c36402287` is still their only commit). Exclusivity is clean at this level. | none |

## Notes for the Editor

**This is the 37th consecutive pass reaching the same wall.** Attempts 1–34 produced a combined one
ticket-body edit and zero source or test mutations; attempts 35 and 36 both set `fixes_applied: 0` /
`progress_made: false` *deliberately*, citing the loop-semantics table, in order to hand control back
rather than burn the remaining attempts. This pass reaches the same verdict on evidence re-derived at
source, so that routing decision stands and should not be re-litigated by a 38th attempt.

Per `CLAUDE.md`'s failure/error taxonomy, the condition in finding 3 has **no defined fix path by
construction**: the branch cannot grow the feature code, and the check cannot pass without it. It is
a terminal failure being routed as a recoverable one. The divergence is still growing —
531 → 536 → 546 → 548 → **549** commits over the last four passes — so waiting makes it worse, not
better.

Two independent things must both happen before this capability's uat level can pass, and neither can
happen inside this loop:

1. **The branch must see the code** — re-cut or refresh `regression-cb0dad9c` from current `main`,
   or drop this capability from the regression run. (Finding 3.)
2. **`test_UAT_AC1354_*` must be authored on `main`** — re-cutting alone is not sufficient, because
   that UAT exists nowhere. (Finding 1.) Finding 2's rename is a cheap same-file follow-on and
   closes the warning in the same edit.

Nothing in findings 1–3 is a production defect. The `fsSiteStore` construction sites on `main`
already match AC-1354's claim exactly — one per entry point, none beneath — and the `toolbox.ts`
option override the AC warns about is that entry point naming its store once, which is the
criterion, not a bug. What is missing is the assertion, not the behaviour.
