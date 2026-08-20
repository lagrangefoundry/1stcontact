---
uid: report-b272e3b2
id: REPORT-2529
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T20:56:38.319108+00:00'
updated_at: '2026-08-20T20:56:38.319108+00:00'
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

Twenty-eighth uat-level pass (`previous_attempt_count = 27`). Cumulative fixes applied across
attempts 1–27: **0**. Attempts 24–27 record `progress_made: false`.

Every claim below was **re-derived from git and the ticket store this pass**. Nothing was
inherited from `report-9504d165` (REPORT-2527) or its predecessors; where this pass reaches the
same conclusion it did so by independent derivation, and the commands run are listed so the
derivation is reproducible.

## Verification environment (re-derived this pass)

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` |
| HEAD | `git log --oneline -3` | `63d2c4147`, `ee1e3bce6`, `6f5411d29` — workflow/ticket/report commits only; no source change |
| merge-base with `main` | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4` |
| Regression cut point | `git log -1 --format='%cI %s' 0f44ef1ba` | `2026-08-19T17:43:02-07:00`, `xgd: sync from xgd-working 097e8bc90814 (post-watermark)` |
| `main` HEAD | `git log -1 --format='%h %cI' main` | `bda6c9939`, `2026-08-20T05:57:11-07:00` |
| Store modules @ HEAD | `git ls-files tools/generate/src/store` | 8 pre-port modules: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @ `main` | `git ls-tree -r --name-only main -- tools/generate/src/store` | those 8 **plus** `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| Port tests @ HEAD | `git ls-files tests \| grep -E 'site-storage\|workers\.test\|REQ-14\|site-factory'` | **no output** |
| Port tests @ `main` | `git ls-tree -r --name-only main -- tests \| grep …` | `reconciliation-site-storage-port.test.ts` (711 lines), `…​.workers.test.ts` (98), `support/site-factory.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-142_site_store_port.test.ts` (403) |

**Framing.** The capability matrix is global — tickets are branch-independent — so UAT evidence
that exists on `main` **is** evidence regardless of which worktree the check executes in.
Assessing coverage against this worktree's checkout (what attempts 1–25 did) yields a
branch-visibility artifact rather than drift, and is not deterministic across worktrees. This
pass therefore assesses coverage against `main`, and reports the branch gap separately as
finding 3.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-19 (`bundle-77b28def`) | `free_and_reconciled` | created `2026-08-18T17:25:57Z`; `merged_at_commit: b18b859d7414a049be45e09f48426d73742e5bf2` | Sole `intent_uid` of STORY-118. Bundles REQ-133, BUG-35, REQ-131, REQ-140, REQ-139, REQ-123, REQ-141, REQ-144, REQ-142 | YES |
| └ REQ-142 | via BUNDLE-19 | — | The async `SiteStore` port, both adapters, the no-location rule, one-whole-change writes | YES |
| └ REQ-141 | via BUNDLE-19 | — | Workers-runtime test project: UATs inside workerd against real bindings, two runtimes routed by filename | YES |

STORY-118 (`story-3f4a5f2b`, `story_kind: feature`, `status: completed`) carries no `updated_by`
chain; BUNDLE-19 is its sole intent, and it is fully reconciled. No abandoned, deprecated or
retired intent touches this capability, so nothing in the matrix should be absent-by-retirement
and no matrix element is orphaned.

**Level cascade honoured.** The ac-level cycle passed clean — `report-2927090b` / REPORT-2474
(`report_kind: capability_validation`, `level: ac`, `result: pass`, 0/0/0), created
`2026-08-20T16:38:14Z`, i.e. **after** the last AC edit (AC-1354 at `15:59:43Z`). The eleven AC
bodies are therefore the authoritative working reference at this level; intent was consulted only
to confirm no AC is unsupported. AC-1354's substance — "nothing chooses a store at runtime; each
entry point names it once at start-up" — is directly restated in the capability body ("neither a
legacy mode and neither detected at runtime — the one chosen at start-up is the one the whole
process uses"), so it is a well-grounded AC, not a spurious one.

## Alignment Ledger

All eleven ACs of STORY-118 carry `status: active` (verified this pass via
`xgd ticket list --type acceptance_criterion --filter fields.story_uid=story-3f4a5f2b --json`).
Test evidence located on `main`; names and line numbers verified this pass via
`git grep -n -oE "test_UAT_AC13[0-9]{2}[a-zA-Z0-9_]*" main -- tests`.

| Element | Test evidence | Outcome |
|---|---|---|
| AC-1321 Storage answers every question totally | `tests/reconciliation-site-storage-port.test.ts:126` `test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld` | aligned |
| AC-1322 Assets as bytes, pages as keys | `…port.test.ts:197` `test_UAT_AC1322_assets_cross_as_bytes_and_pages_as_keys_never_locations` | aligned |
| AC-1323 One multi-file command = one whole change | `…port.test.ts:257` `test_UAT_AC1323_a_multi_file_command_reaches_storage_as_one_whole_change` | aligned |
| AC-1324 Whole editing surface over a filesystem-free store | `…port.test.ts:338` `test_UAT_AC1324_the_whole_editing_surface_completes_with_no_filesystem` | aligned |
| AC-1325 Both stores answer identically | `…port.test.ts:422` `test_UAT_AC1325_the_same_seed_answers_identically_over_both_stores` | aligned |
| AC-1326 Arguments, output, refusal envelopes unchanged | `…port.test.ts:460` `test_UAT_AC1326_command_arguments_output_and_refusal_envelopes_are_unchanged` | aligned |
| AC-1327 Draft preview served from whichever store rendered it | `…port.test.ts:561` `test_UAT_AC1327_the_draft_preview_is_served_from_whichever_store_rendered_it` | aligned |
| AC-1328 Two runtimes, real bindings | `tests/reconciliation-site-storage-port.workers.test.ts:30` `test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings` | aligned |
| AC-1329 The split cost nothing the single runtime provided | `…port.test.ts:595` `test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly` | aligned |
| AC-1353 Editing surface and port import no filesystem module | `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` + `:115` | covered in substance; **not resolvable by AC name** (finding 2) |
| AC-1354 Entry points name the store once; tool adapter edits through it | **none, on any branch** | **gap** (finding 1) |

### Evidence-quality notes (derived this pass)

- **`test_UAT_AC13xx` enumeration is exhaustive.** The grep over `main -- tests` returns
  AC-1300…AC-1342 across four reconciliation files; for STORY-118 it yields exactly AC-1321
  through AC-1329. **No `test_UAT_AC1353` and no `test_UAT_AC1354` exists anywhere on `main`.**
- **AC-1353's substance verified by reading the source, not the name.**
  `test_UAT_FC_REQ-142_site_store_port.test.ts:105–113` asserts `edit.ts` matches none of
  `from 'node:fs'`, `from 'node:path'`, `from '../store'`; `:115–122` loops
  `site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts` asserting neither
  `from 'node:` nor `from './fsutil'`, labelling the offender via `expect(source, name)` —
  exactly what AC-1353's Verification section prescribes. Both are named `UAT_FC_REQ-142 …`.
- **AC-1354 is uncovered in both halves, verified two independent ways.**
  (a) `git grep -n "createL1Toolbox\|new L1Toolbox" main -- tests` returns 20 call sites across
  11 files; **every one** passes `{ cwd }` or `{}` — none injects a store, so none can witness
  "the tool adapter edits through the one it was given".
  (b) `git grep -n "store:" main -- tests` shows store injection only in
  `reconciliation-site-storage-port.test.ts` (`:266`, `:297`, `:312`),
  `reconciliation-system-knowledge-base.test.ts`, `req11-structured-edit.test.ts:43` and
  `support/site-factory.ts` — never into a toolbox. Nor does any test assert the
  single-construction-per-entry-point claim; the only structural source-reads in the corpus are
  the two AC-1353 ones above.
- **The production code does satisfy AC-1354 — only the test is missing.**
  `git grep -n "fsSiteStore" main -- tools/generate/src/cli` returns exactly three construction
  sites, one per entry point: `cli/index.ts:1313` (command line), `cli/builder.ts:628` (builder
  origin), `cli/ai/toolbox.ts:505` (assistant tool adapter). This is why finding 1 is `uat-add`
  and **not** `code-issue`.
- **The nine AC-named UATs are substantive, not structural stand-ins.** They import the real
  command surface from `tools/generate/src/cli/edit`, the real builder origin, and the real
  fixtures in `tests/support/site-factory`, and drive each criterion across `SITE_BACKENDS` —
  both adapters against one body of assertions. AC-1328's file imports `cloudflare:test`
  (resolvable only inside the Workers pool) and reaches for artifacts a fake could not produce:
  SQLite's own `sqlite_master` catalogue, an engine-enforced primary-key rejection, and R2's
  server-computed `size`/`etag`. No internal mocking is present in any of them.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1354 (`acceptance_criterion-56798f01`) | `uat-add` | AC-1354 is `active` and has **no test anywhere** — not on this branch and not on `main`. `git grep -oE "test_UAT_AC13[0-9]{2}…" main -- tests` yields AC-1321…AC-1329 only. Neither of its two claims is exercised: (a) *each of the three entry points constructs its store in exactly one place, with every layer beneath taking an injected store* — no test asserts this, and the only structural source-reads in the corpus are AC-1353's two; (b) *the assistant's tool adapter drives a real edit through the store it was given* — all 20 `createL1Toolbox` call sites on `main` build it as `{ cwd }`, exercising the filesystem path exclusively, and `git grep "store:" main -- tests` confirms a store is never injected into a toolbox | Author `test_UAT_AC1354_*`. **No production change is needed** — the seam already exists: `createL1Toolbox` hardcodes its adapter at `main:tools/generate/src/cli/ai/toolbox.ts:505` (`new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })`) but `L1Toolbox` accepts `store` on its options, so the UAT can construct `L1Toolbox` directly against `makeMemorySite()`'s store and assert the copy-edit-plus-change-count, asset-bytes, and not-found-envelope trio. Pair it with a structural assertion that `fsSiteStore` is constructed exactly once in each of `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts` |
| 2 | warning | consistency | AC-1353 (`acceptance_criterion-003caa07`) | `uat-edit` | AC-1353's substance **is** proved, at `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` and `:115` (both read in full this pass; assertions match the AC's Verification section clause for clause). But both are named `UAT_FC_REQ-142 …` — they do not carry the `test_UAT_` prefix at all, let alone `test_UAT_AC1353_`, so the naming convention this level indexes by cannot resolve AC-1353 to them and the AC reads as uncovered to any automated traceability pass | Rename the two `it(...)` titles to `test_UAT_AC1353_*`, or add a thin AC-named test that delegates. **No new assertion is needed — do not duplicate the existing ones** |
| 3 | needs_review | — | capability-c4c7a854 on `regression-cb0dad9c` | — | Finding 1 is real, but **cannot be repaired on this branch**, and this is the 28th consecutive pass to say so with 0 cumulative fixes applied. `regression-cb0dad9c` was cut from `main` at `0f44ef1ba` (`2026-08-19T17:43:02-07:00`); the port and its UATs landed afterwards and are unreachable from HEAD. Verified directly: `git ls-files tools/generate/src/store` at HEAD returns the 8 pre-port modules with **no** `site-store.ts`, `memory-store.ts`, `assemble.ts` or `journal-model.ts`, and `git ls-files tests \| grep …` returns nothing — there is no `tests/support/site-factory.ts` and no port test file. A `test_UAT_AC1354_*` authored here would import modules that do not exist and could not run. Note this is **not** intent ambiguity: the intent ledger is unambiguous. It is escalated because the loop has no recoverable path — every prior fix attempt's refusal was correct, and a 29th iteration will produce this same report | **Operator decision required.** Under CLAUDE.md's failure/error taxonomy this is a **terminal failure** — an expected dead-end warranting a graceful halt, not a recoverable failure to retry. Either re-cut the regression branch from current `main` so the capability's code is present, or route findings 1–2 to `main`/`xgd-working` where the code lives and let this branch's uat level settle on the evidence as it stands on `main` |

**Exclusivity is clean.** No two ACs claim the same criterion, and no two tests verify the same
scenario in the same shape. The overlap between `reconciliation-site-storage-port.test.ts` and
`test_UAT_FC_REQ-142_site_store_port.test.ts` is deliberate and acceptable: the FC file is the
free-coded original from REQ-142's own development (19 `it(...)` blocks, per-REQ framing), the
reconciliation file is the AC-indexed matrix evidence (per-AC framing, driven across
`SITE_BACKENDS`). They differ in framing rather than duplicating a scenario in one shape.

## Notes for the Editor

**Do not author findings 1 or 2 into `regression-cb0dad9c`.** Both target files that exist only
on `main`. Applying them here would create test files importing absent modules — strictly worse
than the current state, which is what all 27 prior fix attempts correctly concluded. Do not
manufacture progress by touching `uat_coverage` or any other field in lieu of the real repair;
that field is owned by the uat-coverage cycle, not by this one.

**Nothing material has changed in this worktree since attempt 1.** HEAD carries only ticket,
report and workflow commits (`63d2c4147`, `ee1e3bce6`, `6f5411d29`). The 28 passes are not
converging because there is nothing here to converge on — the fix loop is structurally unable to
close finding 1 from this branch.

**The one durable gap is AC-1354, and it postdates the UAT-generation run.** AC-1353 (created
`2026-08-20T15:43:36Z`) and AC-1354 (`15:59:43Z`) were both authored by the ac-level fix cycle
*after* the port's UATs landed on `main` (commit `c36402287`, `2026-08-20T05:21:06-07:00` =
`12:21:06Z`), so neither was ever in scope for a UAT author. AC-1353 was retroactively satisfied
by the free-coded REQ-142 file; AC-1354 was not. That is the whole of the real drift here, and it
is a one-test repair requiring no production change — on a branch that has the code.
