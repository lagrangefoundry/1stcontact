---
uid: report-ea39ab18
id: REPORT-2555
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T22:27:58.570081+00:00'
updated_at: '2026-08-20T22:27:58.570081+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: uat
  violations: 1
  warnings: 3
  needs_review_count: 1
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 3
**Needs review**: 1

Thirty-ninth uat-level pass (`previous_attempt_count = 38`). Every load-bearing fact below was
re-derived at source **this pass** — from git, from the ticket store, and by reading the test and
production sources directly — before consulting attempt 38's check (`report-6e06a0cd`) or its fix
call (`report-ff9ab1c4`). I reached findings 1, 2 and 5 independently and confirmed them against
the prior pass. **Findings 3 and 4 are new this pass**: they were surfaced by reading the nine
existing UATs against their AC bodies line by line, which earlier passes recorded as "aligned"
without that read.

**What changed since attempt 38: nothing material on the branch; `main` advanced.**

- Branch state identical: still 8 store modules, still zero capability UATs, still zero
  `*.workers.test.ts` files, still the pre-split single-runtime `vitest.config.mts`.
- `main` moved to `15d6b9ee7` (2026-08-20 15:05 -0700). Re-checked: AC-1353 and AC-1354 still
  carry no AC-named UAT there either. Finding 1 is unchanged by main's advance.

## Verification environment (re-derived this pass)

| Check | How | Result |
|---|---|---|
| Branch | `git branch --show-current` | `regression-cb0dad9c` @ `fd6d9f2d4` |
| merge-base with `main` | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4` |
| merge-base date | `git log -1 --format=%cI 0f44ef1ba` | **2026-08-19T17:43:02-07:00** ("sync from xgd-working, post-watermark") |
| Divergence | `git rev-list --count HEAD..main` | **549** commits on `main` absent here |
| Intent carrier reachable? | `git rev-list HEAD \| grep b18b859d7…` | **0** — BUNDLE-19's merge commit is **not** an ancestor of HEAD |
| Store modules @HEAD | `ls tools/generate/src/store/` | **8**: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @`main` | `ls …/main/tools/generate/src/store/` | **14** — the 8 above **plus** `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| Capability UATs @HEAD | `grep -r -E "test_UAT_AC13(2[1-9]\|5[34])" tests tools packages apps db storage bin` | **no output** — 0 of 11 ACs carry a UAT on this branch |
| Capability UATs @`main` | same grep over the `main` worktree | **9 hits** (table below) |
| AC-1353 / AC-1354 UATs | same grep, both refs | **no hit on either ref** |
| Workers-routed files @HEAD | `ls tests/*.workers.test.ts` | **no matches** — AC-1328's routing convention has no carrier here |
| Runtime config @HEAD | `Read vitest.config.mts` | single project, `getViteConfig`, `include: ['tests/**/*.test.ts']` — the **pre-split** configuration AC-1328/AC-1329 describe replacing |
| `fsSiteStore(` constructions @`main` | `grep -rn fsSiteStore …/main/{tools,packages,apps}` | definition `store/fs-store.ts:45`, re-export `store/index.ts:52`, and **exactly one construction per entry point**: `cli/index.ts:1313`, `cli/builder.ts:628`, `cli/ai/toolbox.ts:505` |
| `fsSiteStore` in tests @`main` | `grep -rn fsSiteStore …/main/tests` | **6 hits, all fixture construction** (`req11-structured-edit.test.ts:21,39,43`; `support/site-factory.ts:7,118,152`) — nothing asserts the construction *count* |
| Runtime-conditioned assertions @`main` | `grep -rn "navigator.userAgent\|Cloudflare-Workers" …/main/tests` | **3, all AC-1328/REQ-141 routing probes** — the property AC-1329 claims holds, but see finding 4 |

All greps ran with `--binary-files=text`. Two of the heaviest consumers of the editing surface
carry NUL bytes as cache-key separators and are silently skipped as binary otherwise. On the
symbol side, `SiteStore` resolves to **two unrelated types** — this editing port and the
public-serving `apps/public-site/src/site-store.ts` (CAP-82, the only `SiteStore` present at HEAD)
— so the port must be located by path, never by name.

**The controlling fact, re-confirmed with dates this pass.** The branch was cut at `0f44ef1ba` on
2026-08-19 17:43. REQ-142 completed 2026-08-20 12:49 and REQ-141 completed 2026-08-20 21:02, both
carried by BUNDLE-19 (`bundle-77b28def`), whose merge commit `b18b859d7` is **not reachable from
HEAD**. The ticket store is global; the branch is not. This check is being asked to validate a
uat-level matrix against a tree that contains neither the code the ACs describe nor the tests that
prove them.

## Cumulative Intent Considered

At `uat` level the AC bodies are the working reference. The ledger is carried because finding 5
turns on *which intent landed where*, and because AC-1327 scopes a neighbouring capability's
behaviour out by name (finding 3).

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-119 | `request-64864801` | `free_and_reconciled` | 2026-07-31 | Request-time draft/edit renders; owns preview *freshness* under CAP-85. Cited by AC-1327 only to scope freshness **out** of this capability. | YES (boundary only) |
| REQ-141 | `request-b18d2056` | `free_and_reconciled` | created 2026-08-15, completed 2026-08-20 21:02 | Workers-runtime test project: two vitest projects routed by filename, real D1/R2 bindings. Source of AC-1328, AC-1329. | **YES** |
| REQ-142 | `request-0dd62a5d` | `free_and_reconciled` | created 2026-08-15, completed 2026-08-20 12:49 | The async `SiteStore` port with the filesystem behind it; no behaviour change. `depends_on: [REQ-141]`. Source of AC-1321–AC-1327 and of AC-1353/AC-1354. | **YES** |
| BUNDLE-19 | `bundle-77b28def` | `free_and_reconciled` | `merged_at_commit b18b859d7` | Carrier for REQ-141 + REQ-142; STORY-118's `intent_uid`. | **YES** |
| REQ-143 | `request-18a48d63` | `ready_to_reconcile` | 2026-08-15 | The Cloudflare `SiteStore` (D1 + R2). REQ-142 and STORY-118's "Out of scope" both exclude it explicitly. Adds a *third* adapter later; retires nothing here. | imminent — **no AC impact** |

Chronology: REQ-119 → REQ-141 → REQ-142 → REQ-143.

**No intent in the ledger retires any behaviour this capability claims.** The capability body's two
named implementations (the git-tracked FS tree, the filesystem-free store) match REQ-142's scope
exactly; its two-runtime clause matches REQ-141's. There is no consistency drift between the ACs
and the intent that produced them. At this level the failure is one of *evidence location*
(finding 5) plus genuine test-side gaps that exist on `main` too (findings 1, 3, 4).

## Alignment Ledger

All 11 ACs hang off the single story STORY-118 (`story_kind: feature`), so all 11 are in scope for
uat coverage. Coverage is assessed **on `main`**, because this worktree carries none of it
(finding 5). Column 3 is the outcome against the AC body; column 4 is the outcome in the tree
actually under check.

| AC | Covering UAT on `main` | Outcome vs its AC body | In this worktree |
|---|---|---|---|
| AC-1321 (`d4cc3712`) storage answers totally, held and unheld | `reconciliation-site-storage-port.test.ts:126` | **aligned** — read this pass: all seven asks asserted `toBeInstanceOf(Promise)` before await; held-site shapes; ghost-slug empties; stamp equal-iff-unchanged and moving on write; the directory-without-definition case guarded to the adapter that has directories | **absent** |
| AC-1322 (`f713cba6`) assets as bytes, pages as keys | `…:197` | **aligned** — keys carry no separator, load order = sort order, bytes round-trip, both adapters | **absent** |
| AC-1323 (`44c1d962`) multi-file command = one whole change | `…:257` | **aligned** — `recordingStore` asserts exactly one write per command with its exact contents, all three commands, plus the empty change | **absent** |
| AC-1324 (`31f6a0c5`) whole surface completes with no filesystem | `…:338` | **aligned** — fixture asserts `cwd === null` / `opts.cwd === undefined`, then the full editing body incl. counter-does-not-move-on-refusal and a draft render | **absent** |
| AC-1325 (`6a7b61e4`) same seed answers identically over both stores | `…:422` | **aligned** — one `applyAndAsk` body over both, plus assembled-definition equality | **absent** |
| AC-1326 (`d08eae5f`) arguments/output/refusal envelopes unchanged | `…:460` | **aligned** — real `run([...argv, '--json'])`, all three command families, missing-source `NOT_FOUND` with path+hint and exit 3, and the same refusal through `handleBuilderRequest` as a 400 with the three fields | **absent** |
| AC-1327 (`16093733`) draft preview from whichever store rendered it | `…:561` | **aligned on all three bullets**, but **over-reaches**: lines 585–590 assert the freshness behaviour the AC body explicitly disclaims → **finding 3** | **absent** |
| AC-1328 (`c8728ae8`) two runtimes, real bindings in the Workers one | `reconciliation-site-storage-port.workers.test.ts:30` | **aligned** — Workers user agent, D1 schema read back from `sqlite_master`, engine-enforced primary key, R2 server-computed size + 32-hex etag, metadata round trip. Compatibility settings asserted cross-file at `…-port.test.ts:630–636` | **absent** (0 `*.workers.test.ts` files here) |
| AC-1329 (`ae2c7f77`) the split cost nothing the single runtime provided | `reconciliation-site-storage-port.test.ts:595` | **partially aligned** — Astro container render, both configs' contents, compatibility settings and the clean partition are all asserted; the **third Verification clause is not** → **finding 4** | **absent** |
| AC-1353 (`003caa07`) editing surface + port import no filesystem module | **none by AC name.** Substantive evidence exists, mis-named: `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` (`edit.ts` imports no `node:fs` / `node:path` / `../store`) and `:115` (`site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts` import no `node:` and no `./fsutil`, each labelled by name via `expect(source, name)`) | **evidence complete, traceability broken** → **finding 2** | **absent** |
| AC-1354 (`56798f01`) each entry point names its store once; tool adapter edits through it | **none, on either ref** | **genuine coverage gap** → **finding 1** | **absent** |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1354 (`acceptance_criterion-56798f01`) | `uat-add` | AC-1354 is `Status: active`, `kind: behavior`, `regression_only: False`, and has **no UAT on either ref** — the AC-named grep returns nothing against this branch or against `main`. Neither half of its Verification clause is asserted anywhere. **Structural half**: no test counts `fsSiteStore(` constructions per entry point; all 6 test-side hits on `main` are fixture construction (`req11-structured-edit.test.ts:21,39,43`, `support/site-factory.ts:7,118,152`). **Behavioural half**: every toolbox test on `main` (`test_UAT_FC_REQ-122_tool_surface.test.ts:144`, `REQ-126:124`, `REQ-129:139`, `REQ-131:260,279,296,318`, `reconciliation-page-composition-surface.test.ts:153`) enters through `createL1Toolbox`, which at `tools/generate/src/cli/ai/toolbox.ts:505` evaluates `new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })` — the spread comes first, so an injected store is silently overridden. That is precisely the false-green route AC-1354's Verification warns against, and no test takes the direct-binding route it prescribes. Sourced from REQ-142 (`free_and_reconciled`). | Author `test_UAT_AC1354_*` **on `main`**: (a) structural — read `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts` and assert exactly one `fsSiteStore(` each, and zero in every module beneath them; (b) behavioural — bind the exported edit operations to a site over `makeMemorySite()`, apply a copy edit and assert it reads back with the change count advanced, add an asset from a real source file and assert the bytes land under the given name, then re-invoke with a non-existent source path and assert the refusal carries the same `NOT_FOUND` code, the same path and the same hint the CLI produces for the same input (`…-port.test.ts:526–533` is the CLI-side reference). Do **not** route the behavioural half through `createL1Toolbox`. |
| 2 | warning | consistency | AC-1353 (`acceptance_criterion-003caa07`) | `uat-edit` | AC-1353's evidence is **correct and complete on `main`** but carries no AC-traceable name: the two cases live at `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` and `:115` as `UAT_FC_REQ-142 …`. Read this pass, they assert exactly what the AC's Verification clause asks — absence of `node:fs`/`node:path`/`../store` from the editing surface, and absence of `node:` and `./fsutil` from the port's four supporting modules, each identifying the offending module by name. A UAT-by-name index cannot see them, which is why AC-1353's coverage reads as zero. | Rename both cases to `test_UAT_AC1353_*` **on `main`**, in place. No assertion change is warranted — this is traceability only. Cheap same-repo follow-on to finding 1. |
| 3 | warning | consistency | AC-1327 (`acceptance_criterion-16093733`) | `uat-edit` | **New this pass.** `test_UAT_AC1327_the_draft_preview_is_served_from_whichever_store_rendered_it` (`main:tests/reconciliation-site-storage-port.test.ts:585–590`) asserts that a copy edit applied outside the builder shows on the next `preview.file(...)` call with no restart. AC-1327's body disclaims that behaviour in terms: "Nothing about the preview's *freshness* is this capability's claim to prove — neither the operator-visible outcome (a definition changed outside the builder is what the next request shows, with no restart) … All of it is CAP-85's, delivered by REQ-119 … and already carried by AC-1033 (`acceptance_criterion-ae33f0ab`)". AC-1033's UAT asserts the same scenario at `main:tests/reconciliation-builder-request-time-render.test.ts:271`. The test therefore claims territory its own AC assigns elsewhere, and duplicates an AC in another capability. Additive, not a gap — AC-1327's own three bullets (page renders, asset bytes + content type, absent asset resolves to nothing) are all covered at `:568–583`. | On `main`, delete lines 585–590 from `test_UAT_AC1327_*`. If the coupling is wanted deliberately, add one sentence to the test's comment saying the assertion is a redundant guard on AC-1033's property and not AC-1327's claim — otherwise a future reader will re-derive the scoping the AC body spent a paragraph removing. |
| 4 | warning | coverage | AC-1329 (`acceptance_criterion-ae2c7f77`) | `uat-add` | **New this pass.** AC-1329's Verification has three clauses. `test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly` (`main:…-port.test.ts:595–655`) covers the first two — a real Astro container render of `ContactForm`, `vitest.node.config.mts` still routing through `getViteConfig` with the same aliases and timeouts, `vitest.workers.config.mts` carrying no Astro transform, the compatibility settings matching both `wrangler.toml`s, and the clean partition of `tests/**`. The **third clause is unasserted**: "Assert over the routed test sources that no *behavioural* assertion branches on the runtime it is executing in … excluding the routing-and-binding probes AC-1328 owns". Nothing scans the routed sources for that. `test_UAT_FC_REQ-141_project_routing.test.ts` does not either. The property currently *holds* — the only three runtime-conditioned assertions on `main` (`…-port.workers.test.ts:32`, `REQ-141_workers_runtime.workers.test.ts:19`, `REQ-141_project_routing.test.ts:25`) are all inside AC-1328's declared exception — so this is an unguarded invariant, not a false claim. | On `main`, extend `test_UAT_AC1329_*` with a source scan over `tests/**/*.test.ts` asserting that no file outside the declared routing-probe allowlist branches a behavioural expectation on `navigator.userAgent` / a Workers-only global. Keep the allowlist explicit so AC-1328's probes stay legible as the deliberate exception. Alternatively, narrow AC-1329's Verification clause if the invariant is judged not worth a guard — but that is an `ac-edit` and belongs to the ac-level cycle, not here. |
| 5 | needs_review | coverage | `capability-c4c7a854` — all 11 ACs | — | The tree under check contains neither the production code the ACs describe nor the tests that prove them. `tools/generate/src/store` has 8 modules here against 14 on `main`; the port itself (`site-store.ts`), both adapters (`fs-store.ts`, `memory-store.ts`), the assembly path (`assemble.ts`) and the journal (`journal.ts`, `journal-model.ts`) are all absent. Zero of 11 ACs carry a UAT here. There are zero `*.workers.test.ts` files and `vitest.config.mts` is still the single-runtime pre-split configuration, so AC-1328 and AC-1329 have no carrier of any kind. Branch cut `0f44ef1ba` 2026-08-19 17:43; REQ-142 completed 2026-08-20 12:49 and REQ-141 2026-08-20 21:02, carried by BUNDLE-19 whose merge commit `b18b859d7` is not an ancestor of HEAD. **This is not drift** — the matrix is correct and `main` largely satisfies it; the branch simply predates the work. No fix exists in this worktree by construction. | **Operator decision**: (a) re-cut or refresh `regression-cb0dad9c` from current `main`, or (b) exclude `capability-c4c7a854` from this regression run. Note that (a) alone does **not** close findings 1, 3 or 4 — those are `main`-side test work that exists nowhere yet. |
| 6 | info | consistency | AC-1321 … AC-1329 bodies | — | All nine AC bodies were re-read against REQ-141/REQ-142 this pass and are sound. No AC describes behaviour the intent ledger does not support, and no intent asks for behaviour no AC expresses. The story's three recorded non-behaviours (FS store not atomic, memory store not a revision store, preview buffers rather than streams) are each honoured by the AC set rather than contradicted by it. No `ac-edit` is warranted on any of them. | none |
| 7 | info | consistency | AC-1353, AC-1354 bodies | — | Both re-read at source: `Status: active`, `kind: behavior`, `regression_only: False`. AC-1354's Verification clause correctly splits the structural half from the behavioural half and steers the author away from `createL1Toolbox` — I verified that steer is accurate by reading `toolbox.ts:505` directly. Neither body needs editing. | none |
| 8 | info | consistency | AC-1354 vs production code | — | Findings 1–4 are **not** `code-issue`. The `fsSiteStore(` construction sites on `main` already match AC-1354's structural claim exactly — one per entry point, none beneath. The `{ ...opts, store: fsSiteStore(...) }` override at `toolbox.ts:505` is the criterion's *intended* single naming, not a defect. What is missing throughout is the assertion, not the behaviour. | none |
| 9 | info | exclusivity | all 11 ACs | — | No two UATs verify the same scenario in the same shape within this capability. The one duplication found is cross-capability and is recorded as finding 3 (AC-1327's freshness block vs AC-1033's). `SITE_BACKENDS`-parameterised cases that run the same body over both adapters are AC-1325's explicit requirement, not duplication. | none |

## Notes for the Editor

**Findings 1, 2, 3 and 4 all live on `main`, and finding 5 is why none of them is actionable
here.** Every module and every test file named above exists only on `main`. That is why the last
four fix calls each returned `fixes_applied: 0` honestly rather than evasively: the only mutations
available in this worktree are fabrications — authoring a test that asserts against modules which
do not exist, or setting `uat_coverage` on AC-1353/AC-1354 to manufacture a passing signal for
evidence that is not present. The latter is precisely the failure mode this check exists to catch,
and `uat_coverage` is owned by the uat-coverage check/fix pair regardless.

**This is a terminal failure being routed as a recoverable one.** Per the failure/error taxonomy in
`CLAUDE.md`, a failure has a defined path and a terminal failure does not. Here there is none: the
branch cannot grow REQ-141/REQ-142's feature code without that being feature work on a regression
branch, and the check cannot pass without it. Thirty-nine passes have now re-derived the same
facts. A fortieth will do the same. **Recommend the workflow route this to the operator via the
terminal-failure path rather than a fortieth fix iteration.**

**What is genuinely new this pass, and worth carrying forward regardless of the branch decision.**
Earlier passes recorded all nine existing UATs as "aligned" without reading them against their AC
bodies. Reading them produced two real test-side findings that survive a re-cut: AC-1327's UAT
asserts a freshness property its own body spends a paragraph assigning to CAP-85/AC-1033
(finding 3), and AC-1329's third Verification clause — the "no behavioural assertion branches on
the runtime" guard, which is the whole point of the routing axis — has no assertion behind it
(finding 4). Neither is caused by the branch. Both should be queued as `main`-side work alongside
findings 1 and 2, ideally in one pass over `tests/reconciliation-site-storage-port.test.ts` and
`tests/test_UAT_FC_REQ-142_site_store_port.test.ts`.

**The divergence is not shrinking.** 531 → 536 → 546 → 548 → 549 → 549 → 549 over seven passes.
Deferring the re-cut makes it larger, not smaller.

**Two survey hazards for whoever picks this up on `main`.** Force text mode (`grep -a` /
`--binary-files=text`): two of the heaviest consumers of the editing surface carry NUL bytes as
cache-key separators and are silently skipped as binary otherwise. And locate the port by path,
not by symbol — `SiteStore` resolves to two unrelated types, this editing port
(`tools/generate/src/store/site-store.ts`, absent at HEAD) and the public-serving
`apps/public-site/src/site-store.ts` under CAP-82, which is the only one this branch has.
