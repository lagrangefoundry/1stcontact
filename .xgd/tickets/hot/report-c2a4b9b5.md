---
uid: report-c2a4b9b5
id: REPORT-2561
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T22:53:03.641811+00:00'
updated_at: '2026-08-20T22:53:03.641811+00:00'
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

**Attempt**: 42. Every claim below was re-derived from source in this worktree and against
`main` this pass; nothing is inherited from `report-72c6b020`. The conclusions largely agree
with the previous pass, with one finding that is **new** (finding 5, AC-1328's node-side half).

## Cumulative Intent Considered

STORY-118 (`story-3f4a5f2b`) carries `intent_uid: bundle-77b28def` = **BUNDLE-19**, status
`free_and_reconciled`, `merged_at_commit: b18b859d7414a049be45e09f48426d73742e5bf2`. Of the nine
tickets it bundles, two are this capability's:

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-141 | (in BUNDLE-19) | free_and_reconciled (via BUNDLE-19) | 2026-08-15 | Workers-runtime test project: UATs running inside workerd against real D1 and R2 bindings; filename-routed two-runtime split | YES |
| REQ-142 | `request-0dd62a5d` | free_and_reconciled | 2026-08-15 | An async `SiteStore` port with the filesystem behind it: total async operation set, no location-shaped returns, one whole change per call, two live adapters chosen at start-up | YES |
| BUNDLE-19 | `bundle-77b28def` | free_and_reconciled | 2026-08-18 | Reconciliation vehicle for both, merged at `b18b859d7` | YES |
| REQ-143 | `request-18a48d63` | ready_to_reconcile | 2026-08-15 | The Cloudflare `SiteStore` (D1 + R2). STORY-118 puts it **out of scope** in terms ("deliberately separate") | imminent — **out of scope here by the story's own text**; no AC expected |
| REQ-146 | `request-0cdfdc5b` | ready_to_reconcile | 2026-08-15 | The AI host moves into workerd. Its own table lists `toolbox.ts` store: `fsSiteStore(ctxOf(opts))`, hardcoded → injected `SiteStore` | imminent — **does not retire AC-1354**; AC-1354 describes today's single-naming, which REQ-146 will later change. Flagged, not actioned |
| REQ-145, REQ-148 | `request-b474390f`, `request-7ae3c2cc` | ready_to_reconcile | 2026-08-15 | control-app becomes the builder; behavior modules render in workerd | imminent — neither touches this capability's ACs |

No retiring intent was found: nothing in the ledger withdraws behaviour any of the eleven ACs
describes. AC-1353 (`created 2026-08-20T15:43:36Z`) and AC-1354 (`created 15:59:43Z`) were
authored by the **ac-level fix cycle earlier today**, after the UAT-generation workflow had
already run — which is why neither was ever in scope for a UAT author. Both inherit STORY-118's
BUNDLE-19 lineage; neither carries its own `intent_uid` field.

## Alignment Ledger

Test evidence is on `main` (`8ae177d9a`), not on the branch under check — see finding 6.

| Element | Evidence | Outcome |
|---|---|---|
| AC-1321 `acceptance_criterion-d4cc3712` — storage answers every question totally | `main:tests/reconciliation-site-storage-port.test.ts:126` `test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld` | aligned — driven over both backends (`SITE_BACKENDS`), held slug and unheld slug |
| AC-1322 `acceptance_criterion-f713cba6` — assets as bytes, pages as keys | `…-port.test.ts:197` `test_UAT_AC1322_assets_cross_as_bytes_and_pages_as_keys_never_locations` | aligned |
| AC-1323 `acceptance_criterion-44c1d962` — one multi-file command, one whole change | `…-port.test.ts:257` `test_UAT_AC1323_a_multi_file_command_reaches_storage_as_one_whole_change` | aligned — `recordingStore` observes the ask; empty change asserted legal and inert at `:332` |
| AC-1324 `acceptance_criterion-31f6a0c5` — whole surface over a filesystem-free store | `…-port.test.ts:338` `test_UAT_AC1324_the_whole_editing_surface_completes_with_no_filesystem` | aligned — read in full this pass (`:338–418`): `cwd === null` and `opts.cwd === undefined` asserted, then read, write, counter advance, counter *not* advancing on refusal, copy edit, verbatim L1 subtree round-trip, palette CONFLICT refusal, rename carrying references, asset add/remove as bytes, draft render |
| AC-1325 `acceptance_criterion-6a7b61e4` — both stores answer identically | `…-port.test.ts:422` `test_UAT_AC1325_the_same_seed_answers_identically_over_both_stores` | aligned — read in full (`:422–456`): one `applyAndAsk` body over both fixtures, plus assembled-definition equality |
| AC-1326 `acceptance_criterion-d08eae5f` — arguments, output, refusal envelopes unchanged | `…-port.test.ts:460` `test_UAT_AC1326_command_arguments_output_and_refusal_envelopes_are_unchanged` | aligned — refusal driven through the real builder routing table (`handleBuilderRequest`, `builderFetch` at `:666`), not a re-derivation |
| AC-1327 `acceptance_criterion-16093733` — preview served from whichever store rendered it | `…-port.test.ts:561` `test_UAT_AC1327_the_draft_preview_is_served_from_whichever_store_rendered_it` | covered (`:566–583`); **over-reaches into CAP-85's freshness claim at `:585–590`** — finding 3 |
| AC-1328 `acceptance_criterion-c8728ae8` — two runtimes, real bindings | `main:tests/reconciliation-site-storage-port.workers.test.ts:30` `test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings` | workers half aligned (read in full: user agent, `caches`, `DB`/`SITES` named, DDL + `sqlite_master` read-back + PK violation rejected, R2 server-computed `size`/`etag`, `httpMetadata` round trip, list, delete); **node-side bullet proven only by a non-AC-named file** — finding 5 |
| AC-1329 `acceptance_criterion-ae2c7f77` — the split cost nothing | `…-port.test.ts:595` `test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly` | two of three Verification clauses covered (read in full, `:595–655`); **third unasserted** — finding 4 |
| AC-1353 `acceptance_criterion-003caa07` — editing surface and port import no filesystem module | `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` + `:115` | covered in substance; **not resolvable by AC name** — finding 2 |
| AC-1354 `acceptance_criterion-56798f01` — each entry point names its store once; tool adapter edits through it | **none, on any ref** | **gap** — finding 1 |

### Evidence-quality notes (verified this pass)

- **No internal mocking in the AC-named set.** `reconciliation-site-storage-port.test.ts` imports
  the real command surface (20 `edit*` functions from `tools/generate/src/cli/edit`), the real
  builder origin (`ctxOf`, `handleBuilderRequest`, `PreviewRenderer`, `run` from
  `tools/generate/src/cli`), the real Astro component
  (`packages/framework/src/modules/contact-form/index.astro`) and the shared fixtures in
  `tests/support/site-factory.ts`. The only double is `recordingStore`, which observes the ask
  AC-1323 is about and is the criterion's stated mechanism ("only the recorded call can show it").
- **The `SITE_BACKENDS` parameterisation is not duplication.** Running one assertion body over
  both adapters is AC-1325's explicit requirement — the mechanism by which "no command depends on
  the filesystem" is re-checked every run rather than read off a diff.
- **AC-1328's own file cannot carry its node-side bullet**, being a `*.workers.test.ts` by
  construction. That is why finding 5 is a warning about *where the proof lives*, not a claim that
  the property is unproven.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1354 (`acceptance_criterion-56798f01`) | `uat-add` | AC-1354 is `active`, `kind: behavior`, `regression_only: false`, and has **no UAT on any ref**: `git grep -n "test_UAT_AC1354" main` returns zero hits, as does the same search at HEAD. Both halves of its Verification clause are unasserted. **Structural half**: `git grep -n "fsSiteStore(" main` returns 7 code hits — the definition (`tools/generate/src/store/fs-store.ts:45`), exactly one construction per entry point (`tools/generate/src/cli/index.ts:1313`, `cli/builder.ts:628`, `cli/ai/toolbox.ts:505`) and three fixture constructions (`tests/req11-structured-edit.test.ts:43`, `tests/support/site-factory.ts:118` and `:152`). The property holds exactly as the AC describes; **nothing asserts it**. **Behavioural half**: all six `l1Operations(` call sites in `main`'s tests (`reconciliation-assistant-control-surface.test.ts:211`, `reconciliation-page-composition-surface.test.ts:615`, `reconciliation-palette-management.test.ts:680`, `test_UAT_FC_REQ-126_l1_surface.test.ts:169`, `test_UAT_FC_REQ-129_l1_authoring.test.ts:433`, `test_UAT_FC_REQ-130_beyond_l1.test.ts:599`) pass `fsOpts(cwd)` and assert only `Object.keys(...)` — the tool adapter is **never** driven against an injected store. Sourced from REQ-142 via BUNDLE-19 (`free_and_reconciled`, `b18b859d7`) | Author `test_UAT_AC1354_*` **on a ref that has the code**: (a) structural — read `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts` and assert exactly one `fsSiteStore(` each, and zero in every module beneath them; (b) behavioural — bind the exported `l1Operations(slug, opts)` over `makeMemorySite()`, apply a copy edit and assert it reads back with the change count advanced, add an asset from a real source file and assert the bytes land under the given name, then re-invoke with a non-existent source path and assert the refusal carries the same code, path and hint the CLI produces for the same input. Do **not** route the behavioural half through `createL1Toolbox`: `toolbox.ts:505` is `new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })` — the spread precedes the key, so an injected store is silently overridden and the test would run on the filesystem, the exact false green the AC warns against |
| 2 | warning | consistency | AC-1353 (`acceptance_criterion-003caa07`) | `uat-edit` | AC-1353's evidence is **correct and complete on `main`** but carries no AC-traceable name. The two cases sit at `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` (`UAT_FC_REQ-142 edit.ts imports no filesystem module` — asserts `edit.ts` matches none of `from 'node:fs'`, `from 'node:path'`, `from '../store'`) and `:115` (`UAT_FC_REQ-142 the port and its model reach no filesystem` — asserts `site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts` match neither `from 'node:` nor `from './fsutil'`). Read in full this pass; that is exactly what the AC's Verification clause asks for. But they carry neither the `test_UAT_AC1353_` prefix nor even `test_UAT_`, so a UAT-by-name index cannot resolve AC-1353 and the AC reads as uncovered to any automated traceability pass | Rename both cases to `test_UAT_AC1353_*` in place, on the ref that holds them. No assertion change is warranted — traceability only. Do **not** duplicate the assertions into a new file |
| 3 | warning | consistency | AC-1327 (`acceptance_criterion-16093733`) | `uat-edit` | `test_UAT_AC1327_*` at `main:tests/reconciliation-site-storage-port.test.ts:585–590` (read verbatim this pass) applies `editCopySet` outside the builder and asserts the next `preview.file(...)` shows `'After'` and not `'Before'` — i.e. freshness with no restart. AC-1327's body disclaims that behaviour in terms: "Nothing about the preview's *freshness* is this capability's claim to prove … All of it is CAP-85's, delivered by REQ-119 … and already carried by AC-1033 (`acceptance_criterion-ae33f0ab`)". The test claims territory its own AC assigns to another capability. Additive, not a gap: AC-1327's three bullets are each covered at `:566–583` | Delete `:585–590` from `test_UAT_AC1327_*`. If the coupling is wanted deliberately, add one sentence to the test's comment saying the assertion is a redundant guard on AC-1033's property and not AC-1327's claim — otherwise a future reader re-derives the scoping AC-1327's body spent a paragraph removing |
| 4 | warning | coverage | AC-1329 (`acceptance_criterion-ae2c7f77`) | `uat-add` | AC-1329's Verification clause has three parts. `test_UAT_AC1329_*` (`main:…-port.test.ts:595–655`, read in full) covers the first two — a real `AstroContainer` render of `ContactForm` (`:600–608`), `vitest.node.config.mts` still on `getViteConfig` with the same aliases and 60s timeouts (`:612–619`), `vitest.workers.config.mts` carrying no Astro transform (`:623–625`), both `wrangler.toml`s and the workers config agreeing on `compatibility_date = "2025-07-01"` / `["nodejs_compat"]` (`:630–636`), the composing config declaring no `include:` (`:640–643`), and a clean partition of `tests/**` (`:647–654`). The **third is unasserted**: "Assert over the routed test sources that no *behavioural* assertion branches on the runtime it is executing in … excluding the routing-and-binding probes AC-1328 owns". The test ends at `:654`; nothing scans the routed sources. The property currently *holds* — `git grep -n "navigator.userAgent" main -- tests` returns only three hits, all inside AC-1328's declared exception (`reconciliation-site-storage-port.workers.test.ts:32`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts:19`, `test_UAT_FC_REQ-141_project_routing.test.ts:25`) — so this is an unguarded invariant, not a false claim | Extend `test_UAT_AC1329_*` with a source scan over `tests/**/*.test.ts` asserting that no file outside an explicit routing-probe allowlist branches a behavioural expectation on `navigator.userAgent` or a Workers-only global. Keep the allowlist explicit so AC-1328's probes stay legible as the deliberate exception. Narrowing AC-1329's Verification clause instead is an `ac-edit` and belongs to the ac-level cycle, not here |
| 5 | warning | consistency | AC-1328 (`acceptance_criterion-c8728ae8`) | `uat-edit` | **New this pass.** AC-1328's second bullet — "Every other test file runs in the runtime that has a filesystem, and reports a user agent that is not the Workers one" — and the matching Verification sentence ("In an unmarked test, use a filesystem module at load time … and assert the user agent is not the Workers one") are **not asserted by `test_UAT_AC1328_*`**, which is a `*.workers.test.ts` and structurally cannot carry them. The property is proven, but only at `main:tests/test_UAT_FC_REQ-141_project_routing.test.ts:25` (`expect(globalThis.navigator?.userAgent).not.toBe('Cloudflare-Workers')`, in a file importing `node:fs` at line 1 — exactly the shape the AC asks for), whose four cases are named `runs in node, with a filesystem, not in workerd`, `routes this file to node and the .workers files to workerd`, `composes both projects from one root config`, `keeps the .astro transform the single config existed for`. None carries `test_UAT_`, so no AC-name index resolves AC-1328's node-side half. Same shape as finding 2, different AC | Rename the node-side cases in `test_UAT_FC_REQ-141_project_routing.test.ts` to `test_UAT_AC1328_*` (at minimum the `runs in node…` case), on the ref that holds them. Traceability only — the assertions are correct and should not be duplicated into the workers file, where they could not run |
| 6 | needs_review | coverage | `capability-c4c7a854` — all 11 ACs, on branch `regression-cb0dad9c` | — | The tree under check contains neither the production code the ACs describe nor the tests that prove them. Verified this pass: `git merge-base HEAD main` = `0f44ef1ba06d0e071fbe726db099d5908cc425e4`; `git merge-base --is-ancestor HEAD main` → **NO**; `git rev-list --count HEAD..main` → **554**. `git ls-files tools/generate/src/store` returns **8** modules at HEAD (`base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot`) against **14** on `main` — the port (`site-store.ts`), both adapters (`fs-store.ts`, `memory-store.ts`), the assembly path (`assemble.ts`) and the journal model (`journal-model.ts`) are all absent, as is `tests/support/site-factory.ts`. `git grep "MemorySiteStore"` at HEAD returns nothing; there are **zero** `*.workers.test.ts` files and no `vitest.node.config.mts` / `vitest.workers.config.mts` at HEAD, so AC-1328 and AC-1329 have no possible carrier here. Zero of 11 ACs carry a UAT on this branch. **This is not drift** — the matrix is correct and `main` largely satisfies it; the branch simply predates the work. Findings 1–5 are unrepairable from this worktree by construction: a `test_UAT_AC1354_*` authored here would import modules that do not exist and could not collect. This is the **42nd** pass to reach that conclusion with 0 cumulative fixes | **Operator decision required.** Under CLAUDE.md's failure/error taxonomy this is a **terminal failure** — an expected dead-end warranting a graceful halt, not a recoverable failure to retry. Either (a) re-cut or refresh `regression-cb0dad9c` from current `main` so the capability is present in the tree under check, or (b) exclude `capability-c4c7a854` from this regression run. Note (a) alone does **not** close findings 1–5: those are `main`-side test work that exists on no ref yet and needs scheduling as its own development item |
| 7 | info | consistency | AC-1321 … AC-1329 bodies | — | Re-read this pass against REQ-141 / REQ-142 as carried by BUNDLE-19. No AC describes behaviour the intent ledger does not support, and no reconciled intent asks for behaviour no AC expresses. No `ac-edit` warranted at this level | none |
| 8 | info | consistency | AC-1354 vs production code | — | Findings 1–5 are **not** `code-issue`. The `fsSiteStore(` construction sites on `main` already match AC-1354's structural claim exactly — one per entry point, none beneath. The `{ ...opts, store: fsSiteStore(...) }` override at `main:tools/generate/src/cli/ai/toolbox.ts:505` was read directly this pass and is the criterion's *intended* single naming; AC-1354's body says so in terms ("that override is the helper's *intended* behaviour at that entry point … not a defect to be repaired in production code"). What is missing throughout is the assertion, not the behaviour | none |
| 9 | info | consistency | REQ-146 (`request-0cdfdc5b`, `ready_to_reconcile`) vs AC-1354 | — | REQ-146's own table lists `toolbox.ts` store as `fsSiteStore(ctxOf(opts))`, hardcoded → injected `SiteStore`. That is a **future** change to the very line AC-1354 pins. It does not retire AC-1354 (which describes today's single naming, correctly), but whoever reconciles REQ-146 should expect AC-1354's structural half to need an `ac-edit` at that point. Recorded here so the next reader does not mistake the change for drift | none |
| 10 | info | exclusivity | all 11 ACs | — | No two ACs claim the same criterion, and no two UATs verify the same scenario in the same shape within this capability. The one duplication found is cross-capability and is recorded as finding 3 (AC-1327's freshness block vs AC-1033's). The overlap between `reconciliation-site-storage-port.test.ts` and `test_UAT_FC_REQ-142_site_store_port.test.ts` is deliberate and differently framed: the FC file is REQ-142's free-coded original (per-REQ), the reconciliation file is the AC-indexed matrix evidence (per-AC) | none |

## Notes for the Editor

**Do not author findings 1–5 into `regression-cb0dad9c`.** All five target files that exist only
on `main`. Applying them here would create test files importing absent modules — strictly worse
than the current state, which is what every prior fix attempt correctly concluded. In particular,
a faithful `test_UAT_AC1353_*` authored here would fail *correctly*: at HEAD `edit.ts` genuinely
still imports the prohibited modules (`node:fs`, `node:path`, and `'../store'` twice), because
the branch predates the seam. That would put a knowingly-red suite on the branch whose only job
is gating a fast-forward of `xgd-stable`.

**Do not manufacture progress by writing `uat_coverage` or any other field** in lieu of the real
repair. None of the eleven ACs carries a `uat_coverage` value today, so there is no miscoded field
to correct honestly — and that field is owned by the uat-coverage check/fix pair, not by this
cycle.

**Nothing material has changed in this worktree since the previous pass.** `git status` is clean;
HEAD (`322a63dec`) carries only workflow, ticket and report commits. The 42 passes are not
converging because there is nothing here to converge on — the fix loop is structurally unable to
close finding 1 from this branch. **Finding 6 is the item that needs an operator, and it is the
only one.**

**A cross-cutting pattern worth naming.** Three of the five findings (2, 5, and the *shape* of 1)
are the same defect: this capability's proof was written free-coded, per-REQ (`UAT_FC_REQ-141 …`,
`UAT_FC_REQ-142 …`), and the AC-indexed reconciliation file that followed re-expressed most of it
under `test_UAT_AC13xx_` names but not all of it. AC-1353 and AC-1328's node half were left behind
on the REQ-named originals; AC-1354 was never expressed at all. A single rename pass over
`test_UAT_FC_REQ-141_project_routing.test.ts` and `test_UAT_FC_REQ-142_site_store_port.test.ts`,
plus one new test for AC-1354, closes findings 1, 2 and 5 together — on `main`, not here.

**The one durable matrix gap is AC-1354, and it postdates the UAT-generation run.** AC-1353
(created 2026-08-20T15:43:36Z) and AC-1354 (created 15:59:43Z) were both authored by the ac-level
fix cycle *after* the UAT-generation workflow ran, so neither was ever in scope for a UAT author.
AC-1353 was retroactively satisfied by the free-coded REQ-142 file and needs only a rename;
AC-1354 was not, and needs one test — on a ref that has the code.
