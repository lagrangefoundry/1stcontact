---
uid: report-4bf4d99d
id: REPORT-2563
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T22:59:47.399765+00:00'
updated_at: '2026-08-20T22:59:47.399765+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: uat
  violations: 1
  warnings: 4
  needs_review_count: 1
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 4
**Needs review**: 1

**Attempt**: 43. Every load-bearing claim below was re-derived from git in this worktree and
against `main` this pass; nothing was inherited from `report-c2a4b9b5`. The conclusions agree
with the previous pass in full. **No finding is new**, and none of the five repairable findings
moved: `report-8dd1cc47` (attempt 42) applied **0 fixes**, and the only commits since that pass
are ticket/report/workflow bookkeeping (`git diff --stat 322a63dec..HEAD` → four `.xgd/tickets/`
files, 328 insertions, no code and no tests).

## Cumulative Intent Considered

STORY-118 (`story-3f4a5f2b`, `story_kind: feature`, `status: completed`) carries
`intent_uid: bundle-77b28def` = **BUNDLE-19**, `free_and_reconciled`, merged at
`b18b859d7414a049be45e09f48426d73742e5bf2`. Level is `uat`, so per the level cascade the AC
bodies are the working reference; the ledger below is recorded for continuity and was consulted
only to confirm no intent retires an active AC.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-141 | (bundled in BUNDLE-19) | free_and_reconciled (via BUNDLE-19) | 2026-08-15 | Workers-runtime test project: UATs inside workerd against real D1/R2 bindings; filename-routed two-runtime split | YES |
| REQ-142 | `request-0dd62a5d` | free_and_reconciled | 2026-08-15 | Async `SiteStore` port: total async operation set, no location-shaped returns, one whole change per call, two live adapters chosen at start-up | YES |
| BUNDLE-19 | `bundle-77b28def` | free_and_reconciled | 2026-08-18 | Reconciliation vehicle for both; merged at `b18b859d7` | YES |
| REQ-143 | `request-18a48d63` | ready_to_reconcile | 2026-08-15 | The Cloudflare `SiteStore` (D1 + R2) | imminent — **out of scope by STORY-118's own text** ("deliberately separate"); no AC expected |
| REQ-146 | `request-0cdfdc5b` | ready_to_reconcile | 2026-08-15 | AI host moves into workerd; its table lists `toolbox.ts` store `fsSiteStore(ctxOf(opts))` hardcoded → injected `SiteStore` | imminent — **does not retire AC-1354**; see finding 9 |
| REQ-145, REQ-148 | `request-b474390f`, `request-7ae3c2cc` | ready_to_reconcile | 2026-08-15 | control-app becomes the builder; behavior modules render in workerd | imminent — neither touches this capability's ACs |

No retiring intent exists: nothing in the ledger withdraws behaviour any of the eleven ACs
describes. AC-1353 (created `2026-08-20T15:43:36Z`) and AC-1354 (`15:59:43Z`) were authored by
the **ac-level fix cycle earlier today**, after the UAT-generation workflow had already run —
which is why neither was ever in scope for a UAT author.

## Alignment Ledger

**Test evidence lives on `main` (not on the branch under check) — see finding 6.** At HEAD
(`7da322ba0`), `git grep -E "test_UAT_AC(1321|…|1354)_"` returns **zero hits**: 0 of 11 ACs carry
a UAT on this branch.

| Element | Evidence (on `main`) | Outcome |
|---|---|---|
| AC-1321 `acceptance_criterion-d4cc3712` — storage answers every question totally | `tests/reconciliation-site-storage-port.test.ts` `test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld` | aligned — driven over both backends, held and unheld slug |
| AC-1322 `acceptance_criterion-f713cba6` — assets as bytes, pages as keys | `…-port.test.ts` `test_UAT_AC1322_assets_cross_as_bytes_and_pages_as_keys_never_locations` | aligned |
| AC-1323 `acceptance_criterion-44c1d962` — one multi-file command, one whole change | `…-port.test.ts` `test_UAT_AC1323_a_multi_file_command_reaches_storage_as_one_whole_change` | aligned — `recordingStore` observes the ask, which is the criterion's own stated mechanism |
| AC-1324 `acceptance_criterion-31f6a0c5` — whole surface over a filesystem-free store | `…-port.test.ts` `test_UAT_AC1324_the_whole_editing_surface_completes_with_no_filesystem` | aligned |
| AC-1325 `acceptance_criterion-6a7b61e4` — both stores answer identically | `…-port.test.ts` `test_UAT_AC1325_the_same_seed_answers_identically_over_both_stores` | aligned — one assertion body over both fixtures plus assembled-definition equality |
| AC-1326 `acceptance_criterion-d08eae5f` — arguments, output, refusal envelopes unchanged | `…-port.test.ts` `test_UAT_AC1326_command_arguments_output_and_refusal_envelopes_are_unchanged` | aligned — refusal driven through the real builder routing table |
| AC-1327 `acceptance_criterion-16093733` — preview served from whichever store rendered it | `…-port.test.ts` `test_UAT_AC1327_the_draft_preview_is_served_from_whichever_store_rendered_it` | covered (three bullets each asserted); **over-reaches into CAP-85's freshness claim** — finding 3 |
| AC-1328 `acceptance_criterion-c8728ae8` — two runtimes, real bindings | `tests/reconciliation-site-storage-port.workers.test.ts` `test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings` | workers half aligned; **node-side bullet proven only by a non-AC-named file** — finding 5 |
| AC-1329 `acceptance_criterion-ae2c7f77` — the split cost nothing | `…-port.test.ts` `test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly` | two of three Verification clauses covered (read verbatim this pass); **third unasserted** — finding 4 |
| AC-1353 `acceptance_criterion-003caa07` — editing surface and port import no filesystem module | `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` + `:115` | covered in substance; **not resolvable by AC name** — finding 2 |
| AC-1354 `acceptance_criterion-56798f01` — each entry point names its store once; tool adapter edits through it | **none, on any ref** | **gap** — finding 1 |

### Evidence-quality notes (re-verified this pass)

- **No internal mocking in the AC-named set.** `reconciliation-site-storage-port.test.ts` imports
  the real command surface, the real builder origin (`handleBuilderRequest`, `PreviewRenderer`),
  the real Astro component and the shared fixtures in `tests/support/site-factory.ts`. The only
  double is `recordingStore`, which is AC-1323's stated verification mechanism ("only the recorded
  call can show it"), not an internal mock substituting for a component under test.
- **The `SITE_BACKENDS` parameterisation is not duplication.** Running one assertion body over
  both adapters is AC-1325's explicit requirement.
- **AC-1328's own file cannot carry its node-side bullet**, being a `*.workers.test.ts` by
  construction — hence finding 5 is about *where the proof lives*, not whether it exists.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1354 (`acceptance_criterion-56798f01`) | `uat-add` | AC-1354 is `active`, `kind: behavior`, `regression_only: false`, and has **no UAT on any ref**: `git grep -n "test_UAT_AC1354" main` returns zero hits, as does the same search at HEAD. Both halves of its Verification clause are unasserted. **Structural half**: `git grep -n "fsSiteStore(" main` returns, in code, the definition (`tools/generate/src/store/fs-store.ts:45`), exactly one construction per entry point (`tools/generate/src/cli/index.ts:1313`, `cli/builder.ts:628`, `cli/ai/toolbox.ts:505`) and three fixture constructions (`tests/req11-structured-edit.test.ts:43`, `tests/support/site-factory.ts:118` and `:152`). The property holds exactly as the AC describes; **nothing asserts it**. **Behavioural half**: all six `l1Operations(` call sites in `main`'s tests (`reconciliation-assistant-control-surface.test.ts:211`, `reconciliation-page-composition-surface.test.ts:615`, `reconciliation-palette-management.test.ts:680`, `test_UAT_FC_REQ-126_l1_surface.test.ts:169`, `test_UAT_FC_REQ-129_l1_authoring.test.ts:433`, `test_UAT_FC_REQ-130_beyond_l1.test.ts:599`) pass `fsOpts(cwd)` and assert only `Object.keys(...)` — the tool adapter is **never** driven against an injected store. Sourced from REQ-142 via BUNDLE-19 (`free_and_reconciled`, `b18b859d7`) | Author `test_UAT_AC1354_*` **on a ref that has the code**: (a) structural — read `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts` and assert exactly one `fsSiteStore(` each, and zero in every module beneath them; (b) behavioural — bind the exported `l1Operations(slug, opts)` over `makeMemorySite()` (`tests/support/site-factory.ts:129`), apply a copy edit and assert it reads back with the change count advanced, add an asset from a real source file and assert the bytes land under the given name, then re-invoke with a non-existent source path and assert the refusal carries the same code, path and hint the CLI produces for the same input. Do **not** route the behavioural half through `createL1Toolbox`: `main:tools/generate/src/cli/ai/toolbox.ts:505` reads `new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })` — the spread precedes the key, so an injected store is silently overridden and the test would run on the filesystem, the exact false green AC-1354's Verification clause warns against in terms |
| 2 | warning | consistency | AC-1353 (`acceptance_criterion-003caa07`) | `uat-edit` | AC-1353's evidence is **correct and complete on `main`** but carries no AC-traceable name. Read verbatim this pass: `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` (`UAT_FC_REQ-142 edit.ts imports no filesystem module` — asserts `edit.ts` matches neither `from 'node:fs'` nor `from 'node:path'`) and `:115` (`UAT_FC_REQ-142 the port and its model reach no filesystem` — loops `site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts` asserting neither `from 'node:` nor `from './fsutil'`). That is exactly what the AC's Verification clause asks for. But neither carries the `test_UAT_AC1353_` prefix nor even `test_UAT_`, so a UAT-by-name index cannot resolve AC-1353 and the AC reads as uncovered to any automated traceability pass | Rename both cases to `test_UAT_AC1353_*` in place, on the ref that holds them. No assertion change is warranted — traceability only. Do **not** duplicate the assertions into a new file |
| 3 | warning | consistency | AC-1327 (`acceptance_criterion-16093733`) | `uat-edit` | `test_UAT_AC1327_*` in `main:tests/reconciliation-site-storage-port.test.ts` ends with a block (read verbatim this pass) that applies `editCopySet` outside the builder and asserts the next `preview.file(...)` contains `'After'` and not `'Before'` — i.e. freshness with no restart. AC-1327's body disclaims that behaviour in terms: "Nothing about the preview's *freshness* is this capability's claim to prove … All of it is CAP-85's, delivered by REQ-119 … and already carried by AC-1033 (`acceptance_criterion-ae33f0ab`)". The test claims territory its own AC assigns to another capability. Additive, not a gap: AC-1327's three bullets are each independently asserted above it (page renders from the memory store, asset resolves to exact bytes plus `image/svg+xml`, absent asset resolves to `null`) | Delete the trailing freshness block from `test_UAT_AC1327_*`. If the coupling is wanted deliberately, add one sentence to the test's comment saying the assertion is a redundant guard on AC-1033's property and not AC-1327's claim — otherwise a future reader re-derives the scoping AC-1327's body spent a paragraph removing |
| 4 | warning | coverage | AC-1329 (`acceptance_criterion-ae2c7f77`) | `uat-add` | AC-1329's Verification clause has three parts. `test_UAT_AC1329_*` (read in full this pass) covers the first two — a real `AstroContainer` render of `ContactForm`, `vitest.node.config.mts` still on `getViteConfig` with `webuiAliases()` and 60s test/hook timeouts, `vitest.workers.config.mts` carrying no Astro transform, both `wrangler.toml`s and the workers config agreeing on `compatibility_date = "2025-07-01"` / `["nodejs_compat"]`, the composing config declaring no `include:`, and a clean partition of `tests/**`. The **third is unasserted**: "Assert over the routed test sources that no *behavioural* assertion branches on the runtime it is executing in … excluding the routing-and-binding probes AC-1328 owns". The test ends after the partition check; nothing scans the routed sources. The property currently *holds* — `git grep -n "navigator.userAgent" main -- tests` returns only three hits, all inside AC-1328's declared exception (`reconciliation-site-storage-port.workers.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-141_project_routing.test.ts:25`) — so this is an unguarded invariant, not a false claim | Extend `test_UAT_AC1329_*` with a source scan over `tests/**/*.test.ts` asserting that no file outside an explicit routing-probe allowlist branches a behavioural expectation on `navigator.userAgent` or a Workers-only global. Keep the allowlist explicit so AC-1328's probes stay legible as the deliberate exception. Narrowing AC-1329's Verification clause instead is an `ac-edit` and belongs to the ac-level cycle, not here |
| 5 | warning | consistency | AC-1328 (`acceptance_criterion-c8728ae8`) | `uat-edit` | AC-1328's second bullet — "Every other test file runs in the runtime that has a filesystem, and reports a user agent that is not the Workers one" — and the matching Verification sentence ("In an unmarked test, use a filesystem module at load time … and assert the user agent is not the Workers one") are **not asserted by `test_UAT_AC1328_*`**, which is a `*.workers.test.ts` and structurally cannot carry them. The property is proven, but only at `main:tests/test_UAT_FC_REQ-141_project_routing.test.ts:25` (`expect(globalThis.navigator?.userAgent).not.toBe('Cloudflare-Workers')`, in a file importing `node:fs` at line 1 — exactly the shape the AC asks for), whose four cases are named `runs in node, with a filesystem, not in workerd`, `routes this file to node and the .workers files to workerd`, `composes both projects from one root config`, `keeps the .astro transform the single config existed for`. None carries `test_UAT_`, so no AC-name index resolves AC-1328's node-side half. Same shape as finding 2, different AC | Rename the node-side cases in `test_UAT_FC_REQ-141_project_routing.test.ts` to `test_UAT_AC1328_*` (at minimum the `runs in node…` case), on the ref that holds them. Traceability only — the assertions are correct and must not be duplicated into the workers file, where they could not run |
| 6 | needs_review | coverage | `capability-c4c7a854` — all 11 ACs, on branch `regression-cb0dad9c` | — | The tree under check contains neither the production code the ACs describe nor the tests that prove them. Re-verified this pass at HEAD `7da322ba0`: `git status --porcelain` clean; `git rev-list --count HEAD..main` → **554**. `git ls-files tools/generate/src/store` returns **8** modules (`base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot`) against **14** on `main` — the port (`site-store.ts`), both adapters (`fs-store.ts`, `memory-store.ts`), the assembly path (`assemble.ts`) and the journal model (`journal-model.ts`, `journal.ts`) are all absent, as is `tests/support/site-factory.ts`. There are **zero** `*.workers.test.ts` files at HEAD, so AC-1328 and AC-1329 have no possible carrier here. `git grep -E "test_UAT_AC13(2[1-9]\|5[34])_"` at HEAD returns nothing: **0 of 11 ACs carry a UAT on this branch**. **This is not matrix drift** — the matrix is correct and `main` largely satisfies it; the branch simply predates the work. Findings 1–5 are unrepairable from this worktree by construction: a `test_UAT_AC1354_*` authored here would import modules that do not exist and could not collect. This is the **43rd** pass to reach that conclusion with **0 cumulative fixes** (`report-8dd1cc47`, attempt 42: `fixes_applied: 0`, `progress_made: false`) | **Operator decision required.** Under CLAUDE.md's failure/error taxonomy this is a **terminal failure** — an expected dead-end warranting a graceful halt, not a recoverable failure to retry; the loop has no path to close finding 1 from this ref and re-running it cannot produce a different result. Either (a) re-cut or refresh `regression-cb0dad9c` from current `main` so the capability is present in the tree under check, or (b) exclude `capability-c4c7a854` from this regression run. Note (a) alone does **not** close findings 1–5: those are `main`-side test work that exists on no ref yet and needs scheduling as its own development item |
| 7 | info | consistency | AC-1321 … AC-1329 bodies | — | Re-read this pass against REQ-141 / REQ-142 as carried by BUNDLE-19. No AC describes behaviour the intent ledger does not support, and no reconciled intent asks for behaviour no AC expresses. No `ac-edit` warranted at this level | none |
| 8 | info | consistency | AC-1354 vs production code | — | Findings 1–5 are **not** `code-issue`. The `fsSiteStore(` construction sites on `main` already match AC-1354's structural claim exactly — one per entry point, none beneath. The `{ ...opts, store: fsSiteStore(...) }` override at `main:tools/generate/src/cli/ai/toolbox.ts:505` was read directly this pass and is the criterion's *intended* single naming; AC-1354's body says so in terms ("that override is the helper's *intended* behaviour at that entry point … not a defect to be repaired in production code"). What is missing throughout is the assertion, not the behaviour | none |
| 9 | info | consistency | REQ-146 (`request-0cdfdc5b`, `ready_to_reconcile`) vs AC-1354 | — | REQ-146's own table lists `toolbox.ts` store as `fsSiteStore(ctxOf(opts))`, hardcoded → injected `SiteStore` (confirmed at `main:.xgd/tickets/hot/request-0cdfdc5b.md:164`). That is a **future** change to the very line AC-1354 pins. It does not retire AC-1354 (which describes today's single naming, correctly), but whoever reconciles REQ-146 should expect AC-1354's structural half to need an `ac-edit` at that point. Recorded so the next reader does not mistake the change for drift | none |
| 10 | info | exclusivity | all 11 ACs | — | No two ACs claim the same criterion, and no two UATs verify the same scenario in the same shape within this capability. The one duplication found is cross-capability and is recorded as finding 3 (AC-1327's freshness block vs AC-1033's). The overlap between `reconciliation-site-storage-port.test.ts` and `test_UAT_FC_REQ-142_site_store_port.test.ts` is deliberate and differently framed: the FC file is REQ-142's free-coded original (per-REQ), the reconciliation file is the AC-indexed matrix evidence (per-AC) | none |

## Notes for the Editor

**Do not author findings 1–5 into `regression-cb0dad9c`.** All five target files that exist only
on `main`. Applying them here would create test files importing absent modules — strictly worse
than the current state, which is what all 42 prior fix attempts correctly concluded. In
particular, a faithful `test_UAT_AC1353_*` authored here would fail *correctly*: at HEAD `edit.ts`
genuinely still imports the prohibited modules, because the branch predates the seam. That would
put a knowingly-red suite on the branch whose only job is gating a fast-forward of `xgd-stable`.

**Do not manufacture progress by writing `uat_coverage` or any other field** in lieu of the real
repair. None of the eleven ACs carries a `uat_coverage` value today, so there is no miscoded field
to correct honestly — and that field is owned by the uat-coverage check/fix pair, not by this
cycle.

**Nothing material has changed in this worktree since attempt 42.** `git diff --stat
322a63dec..HEAD` is four `.xgd/tickets/hot/*.md` files (two reports, two comments) and nothing
else. The 43 passes are not converging because there is nothing here to converge on — the fix
loop is structurally unable to close finding 1 from this branch. **Finding 6 is the item that
needs an operator, and it is the only one.** Continuing to cycle this loop consumes budget
without any possibility of a different outcome.

**A cross-cutting pattern worth naming.** Three of the five repairable findings (2, 5, and the
*shape* of 1) are the same defect: this capability's proof was written free-coded, per-REQ
(`UAT_FC_REQ-141 …`, `UAT_FC_REQ-142 …`), and the AC-indexed reconciliation file that followed
re-expressed most of it under `test_UAT_AC13xx_` names but not all of it. AC-1353 and AC-1328's
node half were left behind on the REQ-named originals; AC-1354 was never expressed at all. A
single rename pass over `test_UAT_FC_REQ-141_project_routing.test.ts` and
`test_UAT_FC_REQ-142_site_store_port.test.ts`, plus one new test for AC-1354, closes findings 1, 2
and 5 together — **on `main`, not here**.

**The one durable matrix gap is AC-1354, and it postdates the UAT-generation run.** AC-1353
(created 2026-08-20T15:43:36Z) and AC-1354 (15:59:43Z) were both authored by the ac-level fix
cycle *after* the UAT-generation workflow ran, so neither was ever in scope for a UAT author.
AC-1353 was retroactively satisfied by the free-coded REQ-142 file and needs only a rename;
AC-1354 was not, and needs one test — on a ref that has the code.
