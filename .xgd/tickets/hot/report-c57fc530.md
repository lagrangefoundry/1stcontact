---
uid: report-c57fc530
id: REPORT-2557
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T22:36:47.386037+00:00'
updated_at: '2026-08-20T22:36:47.386037+00:00'
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

Fortieth uat-level pass (`previous_attempt_count = 39`). Cumulative fixes applied across
attempts 1–39: **0**. The most recent fix call (`report-2d9d5b23`, attempt 39) records
`fixes_applied: 0`, `progress_made: false`.

This pass **re-derived every claim from source** — git refs, the ticket store, and the
production and test files read directly. It did not inherit `report-ea39ab18`'s verification
table. It reaches the same verdict by independent derivation: 1 violation, 3 warnings,
1 needs_review.

## Verification environment (re-derived this pass)

| Check | Command | Result |
|---|---|---|
| Branch / HEAD | `git log --oneline -12` | `regression-cb0dad9c` @ `10be39e8e` — top 12 commits are ticket / report / workflow only; no source change |
| merge-base with `main` | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4` |
| BUNDLE-19 merge commit reachable? | `git merge-base --is-ancestor b18b859d7 HEAD` | **NOT_ANCESTOR** |
| `main` head | `git log --oneline -6 main` | `1a897c5eb` — top 6 commits are all `xgd(ticket): update comment …`; no code movement since the prior pass |
| Store modules @HEAD | `git ls-files tools/generate/src/store` | **8**: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` — **no `site-store.ts`, `fs-store.ts`, `memory-store.ts`, `assemble.ts`, `journal-model.ts`** |
| Port tests @HEAD | `git ls-files tests \| grep -E 'site-storage\|workers\.test\|REQ-14'` | **empty** |
| Port tests @`main` | `git ls-tree -r --name-only main -- tests \| grep …` | `reconciliation-site-storage-port.test.ts`, `…-port.workers.test.ts`, `support/site-factory.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-142_site_store_port.test.ts` |
| AC-named UATs | `git grep -n -E "test_UAT_AC13(2[1-9]\|5[34])" main -- tests` | **9** — AC-1321…AC-1329; **zero for AC-1353 / AC-1354** |
| AC-1353/1354 by name, either ref | `git grep -n "test_UAT_AC1354\|test_UAT_AC1353" main regression-cb0dad9c` | hits only inside `.xgd/tickets/hot/comment-*.md` — **no test source on either ref** |

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-19 (`bundle-77b28def`) | `free_and_reconciled` | `merged_at_commit: b18b859d7414a049be45e09f48426d73742e5bf2` | Sole intent of STORY-118 (`fields.intent_uid`). Bundles REQ-133, BUG-35, REQ-131, REQ-140, REQ-139, REQ-123, REQ-141, REQ-144, REQ-142 | YES |
| └ REQ-142 | via BUNDLE-19 | — | The async `SiteStore` port, both adapters, the no-location rule, one-whole-change writes, the import-level seam | YES |
| └ REQ-141 | via BUNDLE-19 | — | Two test runtimes routed by filename; workerd project with real D1/R2 bindings and production compatibility settings | YES |

STORY-118 (`story-3f4a5f2b`, `story_kind: feature`, `status: completed`) carries no `updated_by`
chain; BUNDLE-19 is its sole intent. No retired, abandoned or deprecated intent touches this
capability, so nothing in the matrix should be absent-by-retirement.

**Level cascade honoured.** This is a `uat`-level pass: the eleven AC bodies are the working
reference. All eleven are `status: active`, `kind: behavior`, `regression_only: false`. Intent
was consulted only to confirm no AC is orphaned; none is. No AC body required an edit
(findings 6–7 below).

## Alignment Ledger

Test evidence located on `main` and read this pass (the capability matrix is global —
tickets are branch-independent — so evidence on `main` is evidence regardless of which
worktree the check executes in; see finding 5 for why that distinction matters here).

| Element | Test evidence | Outcome |
|---|---|---|
| AC-1321 Storage answers every question totally | `main:tests/reconciliation-site-storage-port.test.ts:126` `test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld` | aligned |
| AC-1322 Assets as bytes, pages as keys | `…-port.test.ts:197` `test_UAT_AC1322_assets_cross_as_bytes_and_pages_as_keys_never_locations` | aligned |
| AC-1323 One multi-file command = one whole change | `…-port.test.ts:257` `test_UAT_AC1323_a_multi_file_command_reaches_storage_as_one_whole_change` | aligned |
| AC-1324 Whole editing surface over a filesystem-free store | `…-port.test.ts:338` `test_UAT_AC1324_the_whole_editing_surface_completes_with_no_filesystem` | aligned |
| AC-1325 Both stores answer identically | `…-port.test.ts:422` `test_UAT_AC1325_the_same_seed_answers_identically_over_both_stores` | aligned |
| AC-1326 Arguments, output, refusal envelopes unchanged | `…-port.test.ts:460` `test_UAT_AC1326_command_arguments_output_and_refusal_envelopes_are_unchanged` | aligned |
| AC-1327 Draft preview served from whichever store rendered it | `…-port.test.ts:561` `test_UAT_AC1327_the_draft_preview_is_served_from_whichever_store_rendered_it` | covered; **over-reaches into CAP-85's freshness claim** (finding 3) |
| AC-1328 Two runtimes, real bindings | `main:tests/reconciliation-site-storage-port.workers.test.ts:30` `test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings` | aligned |
| AC-1329 The split cost nothing the single runtime provided | `…-port.test.ts:595` `test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly` | two of three Verification clauses covered; **third unasserted** (finding 4) |
| AC-1353 Editing surface and port import no filesystem module | `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` + `:115` | covered in substance; **not resolvable by AC name** (finding 2) |
| AC-1354 Entry points name the store once; tool adapter edits through it | **none, on either ref** | **gap** (finding 1) |

### Evidence-quality notes (read this pass, not inherited)

- **No internal mocking anywhere in the AC-named set.** `…-port.test.ts:1–42` imports the real
  command surface (`editCopySet`, `editPageAdd`, `editAssetWrite`, `editPaletteRename`, … from
  `tools/generate/src/cli/edit`), the real builder origin (`ctxOf`, `handleBuilderRequest`,
  `PreviewRenderer`, `run` from `tools/generate/src/cli`), the real Astro component
  (`packages/framework/src/modules/contact-form/index.astro`) and the shared fixtures
  (`tests/support/site-factory`), driving each criterion across `SITE_BACKENDS` — both adapters,
  one body of assertions. That parameterisation is AC-1325's explicit requirement, not
  duplication.
- **AC-1327** (`:561–590`, read in full): the AC's own three bullets are each asserted —
  a draft page renders from a `makeMemorySite` store with `cwd === null` (`:566–572`), a draft
  asset returns exact bytes plus `image/svg+xml` (`:574–581`), an absent asset resolves to
  `null` rather than an error or an empty file (`:583`). Lines `585–590` then assert freshness,
  which is the subject of finding 3.
- **AC-1329** (`:595–655`, read in full): executes a real Astro container render of `ContactForm`
  (`:600–608`) before asserting `vitest.node.config.mts` still routes through `getViteConfig`
  with the same aliases and timeouts (`:611–619`), that `vitest.workers.config.mts` carries no
  Astro transform (`:624–625`), that both `wrangler.toml`s and the workers config agree on
  `compatibility_date = "2025-07-01"` / `["nodejs_compat"]` (`:630–636`), that the composing
  config declares no `include:` of its own (`:640–643`), and that the two globs partition
  `tests/**` with none claimed by both and none by neither (`:647–654`). Structural where the AC
  says the structure is the deliverable; behavioural where behaviour is available.
- **AC-1353's substance** (`req142.test.ts:105–122`, read in full): `:110–112` assert `edit.ts`
  matches none of `from 'node:fs'`, `from 'node:path'`, `from '../store'`; `:117–121` assert
  `site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts` match neither
  `from 'node:` nor `from './fsutil'`, labelling the offending module via `expect(source, name)`
  exactly as the AC's Verification clause requires. The third bullet (the fs adapter behind a
  separate entry point) is carried in substance by the pair — `edit.ts` does not import the
  barrel, and `main:tools/generate/src/store/index.ts:1–9` documents the barrel as the Node-only
  one — so this is a naming defect, not a proof defect.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1354 (`acceptance_criterion-56798f01`) | `uat-add` | AC-1354 is `active`, `kind: behavior`, `regression_only: false`, and has **no UAT on either ref** — `git grep "test_UAT_AC1354" main regression-cb0dad9c` hits only ticket comments, never a test source. **Structural half unasserted**: no test counts `fsSiteStore(` constructions per entry point. `git grep -n "fsSiteStore(" main -- tools tests` returns exactly 7 hits — the definition at `store/fs-store.ts:45`, one construction per entry point (`cli/index.ts:1313`, `cli/builder.ts:628`, `cli/ai/toolbox.ts:505`), and three fixture constructions (`tests/req11-structured-edit.test.ts:43`, `tests/support/site-factory.ts:118,152`). The property holds; nothing asserts it. **Behavioural half unasserted**: all six `l1Operations(` call sites in `main:tests` (`reconciliation-assistant-control-surface.test.ts:211`, `reconciliation-page-composition-surface.test.ts:615`, `reconciliation-palette-management.test.ts:680`, `test_UAT_FC_REQ-126_l1_surface.test.ts:169`, `REQ-129:433`, `REQ-130:599`) pass `fsOpts(cwd)` and assert only `Object.keys(...)` — the tool adapter is never driven against an injected store, and no test constructs `L1Toolbox` directly. Sourced from REQ-142 (via BUNDLE-19, `free_and_reconciled`). | Author `test_UAT_AC1354_*` **on `main`**: (a) structural — read `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts` and assert exactly one `fsSiteStore(` each, and zero in every module beneath them; (b) behavioural — bind the exported `l1Operations(slug, opts)` (`toolbox.ts:176`) to a site over `makeMemorySite()`, apply a copy edit and assert it reads back with the change count advanced, add an asset from a real source file and assert the bytes land under the given name, then re-invoke with a non-existent source path and assert the refusal carries the same code, path and hint the CLI produces for the same input (`…-port.test.ts:526–533` is the CLI-side reference). Do **not** route the behavioural half through `createL1Toolbox` — `toolbox.ts:505` is `new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })`, the spread precedes the key, so an injected store is silently overridden and the test would run on the filesystem: the exact false green AC-1354's Verification clause warns against |
| 2 | warning | consistency | AC-1353 (`acceptance_criterion-003caa07`) | `uat-edit` | AC-1353's evidence is **correct and complete on `main`** but carries no AC-traceable name: the two cases live at `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` and `:115` as `UAT_FC_REQ-142 …` — they do not carry the `test_UAT_` prefix at all, let alone `test_UAT_AC1353_`. Read in full this pass, they assert exactly what the AC's Verification clause asks. A UAT-by-name index cannot resolve AC-1353 to them, so the AC reads as uncovered to any automated traceability pass | Rename both cases to `test_UAT_AC1353_*` **on `main`**, in place. No assertion change is warranted — this is traceability only. Do not duplicate the existing assertions |
| 3 | warning | consistency | AC-1327 (`acceptance_criterion-16093733`) | `uat-edit` | `test_UAT_AC1327_*` (`main:tests/reconciliation-site-storage-port.test.ts:585–590`) asserts that a copy edit applied outside the builder shows on the next `preview.file(...)` call with no restart. AC-1327's body disclaims that behaviour in terms: "Nothing about the preview's *freshness* is this capability's claim to prove — neither the operator-visible outcome (a definition changed outside the builder is what the next request shows, with no restart) … All of it is CAP-85's, delivered by REQ-119 … and already carried by AC-1033 (`acceptance_criterion-ae33f0ab`)". The test therefore claims territory its own AC assigns to another capability. Additive, not a gap — AC-1327's own three bullets are all covered at `:566–583` | On `main`, delete `:585–590` from `test_UAT_AC1327_*`. If the coupling is wanted deliberately, add one sentence to the test's comment saying the assertion is a redundant guard on AC-1033's property and not AC-1327's claim — otherwise a future reader re-derives the scoping the AC body spent a paragraph removing |
| 4 | warning | coverage | AC-1329 (`acceptance_criterion-ae2c7f77`) | `uat-add` | AC-1329's Verification clause has three parts. `test_UAT_AC1329_*` (`main:…-port.test.ts:595–655`, read in full) covers the first two. The **third is unasserted**: "Assert over the routed test sources that no *behavioural* assertion branches on the runtime it is executing in … excluding the routing-and-binding probes AC-1328 owns". The test ends at the clean-partition assertion (`:654`); nothing scans the routed sources. The property currently *holds* — the only runtime-conditioned assertions on `main` are inside AC-1328's declared exception — so this is an unguarded invariant, not a false claim | On `main`, extend `test_UAT_AC1329_*` with a source scan over `tests/**/*.test.ts` asserting that no file outside an explicit routing-probe allowlist branches a behavioural expectation on `navigator.userAgent` or a Workers-only global. Keep the allowlist explicit so AC-1328's probes stay legible as the deliberate exception. Narrowing AC-1329's Verification clause instead is an `ac-edit` and belongs to the ac-level cycle, not here |
| 5 | needs_review | coverage | `capability-c4c7a854` — all 11 ACs, on `regression-cb0dad9c` | — | The tree under check contains neither the production code the ACs describe nor the tests that prove them. `tools/generate/src/store` has **8** modules at HEAD against **14** on `main`; the port (`site-store.ts`), both adapters (`fs-store.ts`, `memory-store.ts`), the assembly path (`assemble.ts`) and the journal model (`journal-model.ts`) are all absent, as is `tests/support/site-factory.ts`. Zero of 11 ACs carry a UAT here; there are zero `*.workers.test.ts` files, so AC-1328 and AC-1329 have no carrier of any kind. The branch was cut at `0f44ef1ba`; BUNDLE-19's merge commit `b18b859d7` is **not an ancestor of HEAD** (verified by `git merge-base --is-ancestor`). **This is not drift** — the matrix is correct and `main` largely satisfies it; the branch simply predates the work. Findings 1–4 are unrepairable from this worktree by construction: a `test_UAT_AC1354_*` authored here would import modules that do not exist and could not collect, let alone pass. This is the 40th pass to reach that conclusion with 0 cumulative fixes | **Operator decision required.** Under CLAUDE.md's failure/error taxonomy this is a **terminal failure** — an expected dead-end warranting a graceful halt, not a recoverable failure to retry. Either (a) re-cut or refresh `regression-cb0dad9c` from current `main` so the capability is present, or (b) exclude `capability-c4c7a854` from this regression run. Note (a) alone does **not** close findings 1, 3 or 4 — those are `main`-side test work that exists nowhere yet |
| 6 | info | consistency | AC-1321 … AC-1329 bodies | — | All nine bodies re-read this pass against REQ-141 / REQ-142 and are sound. No AC describes behaviour the intent ledger does not support, and no intent asks for behaviour no AC expresses. The story's three recorded non-behaviours (fs store not atomic, memory store not a revision store, preview buffers rather than streams) are each honoured by the AC set rather than contradicted by it. No `ac-edit` warranted | none |
| 7 | info | consistency | AC-1353, AC-1354 bodies | — | Both re-read at source. AC-1354's Verification clause correctly splits the structural half from the behavioural half and steers the author away from `createL1Toolbox`; that steer was verified accurate this pass by reading `main:tools/generate/src/cli/ai/toolbox.ts:505` directly. Neither body needs editing | none |
| 8 | info | consistency | AC-1354 vs production code | — | Findings 1–4 are **not** `code-issue`. The `fsSiteStore(` construction sites on `main` already match AC-1354's structural claim exactly — one per entry point, none beneath. The `{ ...opts, store: fsSiteStore(...) }` override at `toolbox.ts:505` is the criterion's *intended* single naming, and AC-1354's body says so in terms ("that override is the helper's *intended* behaviour at that entry point … not a defect to be repaired in production code"). What is missing throughout is the assertion, not the behaviour | none |
| 9 | info | exclusivity | all 11 ACs | — | No two ACs claim the same criterion, and no two UATs verify the same scenario in the same shape within this capability. The one duplication found is cross-capability and is recorded as finding 3 (AC-1327's freshness block vs AC-1033's). The overlap between `reconciliation-site-storage-port.test.ts` and `test_UAT_FC_REQ-142_site_store_port.test.ts` is deliberate: the FC file is REQ-142's free-coded original, the reconciliation file is the AC-indexed matrix evidence, differing in framing (per-REQ vs per-AC) rather than duplicating a scenario in one shape | none |

## Notes for the Editor

**Do not author findings 1–4 into `regression-cb0dad9c`.** All four target files that exist only
on `main`. Applying them here would create test files importing absent modules — strictly worse
than the current state, which is what every prior fix attempt correctly concluded. In particular,
a faithful `test_UAT_AC1353_*` authored here would fail *correctly*, because at HEAD `edit.ts`
genuinely does import the prohibited modules: the branch predates the seam. That would put a
knowingly-red suite on the branch whose only job is gating a fast-forward of `xgd-stable`.

**Do not manufacture progress by writing `uat_coverage` or any other field** in lieu of the real
repair. That field is owned by the uat-coverage check/fix pair, not by this cycle.

**Nothing material has changed in this worktree, or on `main`, since the previous pass.** HEAD
carries only ticket, report and workflow commits (`10be39e8e` back through `9b351c644`); `main`'s
last six commits are all `xgd(ticket): update comment`. The 40 passes are not converging because
there is nothing here to converge on — the fix loop is structurally unable to close finding 1
from this branch. Finding 5 is the item that needs an operator, and it is the only one.

**The one durable matrix gap is AC-1354, and it postdates the UAT-generation run.** AC-1353
(created 2026-08-20T15:43:36Z) and AC-1354 (created 15:59:43Z) were both authored by the ac-level
fix cycle *after* the UAT-generation workflow ran, so neither was ever in scope for a UAT author.
AC-1353 was retroactively satisfied by the free-coded REQ-142 file and needs only a rename;
AC-1354 was not, and needs one test — on a branch that has the code.
