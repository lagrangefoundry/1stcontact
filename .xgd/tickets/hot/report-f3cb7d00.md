---
uid: report-f3cb7d00
id: REPORT-3685
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-09-10T06:56:16.759480+00:00'
updated_at: '2026-09-10T06:56:16.759480+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: uat
  violations: 2
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: uat

**Result**: FAIL
**Violations**: 2
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a. Previous attempts: 2
(report-06854a25 → fix report-11434d37; report-14ca0c44 → fix report-4ac04d1b).

**Method note.** Level `uat`, so AC bodies are the working reference and the intent ledger was
consulted only to confirm no ledger entry retires a behaviour an AC still claims (none does).
Every AC in the capability's two stories was read in full against the body of the test named
`test_UAT_AC<n>_*`. One suite was executed to ground a finding rather than argue it:

```
npm test -- tests/reconciliation-site-storage-port.test.ts
Test Files  1 passed (1)
     Tests  9 passed (9)
```

That is the point of finding 1 and 2: `test_UAT_AC1620_…` passes today while asserting neither
of two behaviours its criterion enumerates.

**State of the previous attempt.** report-14ca0c44's single violation (AC-1385 claiming a
runtime/transform barrier to rendering) was verified as repaired by reading the tree, not by
trusting report-4ac04d1b:

| Prior finding | Verified now |
|---|---|
| 1 (violation, AC-1385 ac-edit) | AC-1385's body no longer claims a build transform or a Workers-runtime restriction; it states the port-shape reason ("rendering is not a verb the port has") and says both render questions are asked of all three adapters. Title is now "…the render included". Resolved. |
| 2–3 (warnings, doc comments in `storage-questions.ts` / `site-store-contract.ts`) | Both rewritten; the retired Astro fact survives only as explicit parenthetical history. Resolved. |
| 4 (opportunistic move) | The two render cases now live in `tests/support/site-store-contract.ts:355,363` and are registered against the filesystem and memory adapters (`tests/test_UAT_FC_REQ-142_site_store_port.test.ts:90-95`) and the D1/R2 adapter (`tests/test_UAT_FC_REQ-143_d1r2_store.workers.test.ts:51-54`). Landed over all three. |

The findings below are **new**, and neither is a re-statement of a prior one. Both concern
AC-1620 and AC-1385's UATs as they stand after that fix.

## Cumulative Intent Considered

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUNDLE-19 (REQ-142 + REQ-133, REQ-131, REQ-144, BUG-35, …) | bundle-77b28def | free_and_reconciled | 2026-08-18 | Storage becomes a port: one small, total, async operation set; the filesystem-free store; two Vitest runtimes routed by filename. Origin of STORY-118. | YES |
| BUNDLE-20 (REQ-143, REQ-145, REQ-146, REQ-148, REQ-149, REQ-150, …) | bundle-b3b7c399 | free_and_reconciled | 2026-08-24 | The D1/R2 store scoped per account; the surface loadable in workerd; the five revision verbs onto the same declared set (REQ-149); Astro's container removed from the render path (REQ-148/REQ-150). Origin of STORY-121, updater of STORY-118. | YES |
| BUNDLE-21 (BUG-36, BUG-37, BUG-38) | bundle-78f4e2fe | free_and_reconciled | 2026-08-26 | Deployment repairs behind the cloud store — bindings in both halves, schema before upload. Updater of STORY-121. | YES |
| REQ-162 | request-13a5e206 | free_and_reconciled | 2026-08-31 | The product ticket store (D1 schema, TypePack). Touches STORY-121 through the shared D1 schema/migrations path only. | YES |

No ledger entry is `abandoned`, `deprecated`, `wont_fix`, `draft` or `ready_to_implement`, and
none retires a behaviour any AC in this capability still claims. Nothing in the ledger is
"imminent" — all four are fully reconciled.

## Alignment Ledger

STORY-118 (story-3f4a5f2b, feature) — 9 active ACs, 2 pending:

| Element | Test | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1321 | `reconciliation-site-storage-port.test.ts:127` | BUNDLE-19 | aligned — every verb asked over both node adapters, held and unheld, with each answer asserted to be a Promise |
| AC-1322 | …:198 | BUNDLE-19 | aligned — bytes in both directions, keys with no separator, sort order asserted |
| AC-1323 | …:258 | BUNDLE-19 | aligned — three commands over a recording store, exactly one write each, empty change legal |
| AC-1324 | …:339 | BUNDLE-19 | aligned — full editing surface over the memory store, `cwd === null` asserted |
| AC-1325 | …:475 | BUNDLE-19 | aligned — one `applyAndAsk` applied twice; assembled definitions compared |
| AC-1326 | …:513 | BUNDLE-19 | aligned — real `run()` argv envelope, plus the same refusal through `handleBuilderRequest` as a 400 |
| AC-1327 | …:614 | BUNDLE-19 | aligned — page, asset bytes + content type, absent → null, and the no-restart refresh |
| AC-1328 | `reconciliation-site-storage-port.workers.test.ts:30` | BUNDLE-19, BUNDLE-20 | aligned — the file IS its evidence; SQLite catalogue, PK enforcement, R2-computed size/etag |
| AC-1329 | `reconciliation-site-storage-port.test.ts:648` | BUNDLE-19, BUNDLE-20 (REQ-148/150) | aligned — a real behaviour-module render plus the config/partition assertions the criterion asks for |
| AC-1619 (pending) | `support/site-store-contract.ts:386,400` | BUNDLE-20 (REQ-149) | aligned — both cases (never published / published) in the shared body, so all three adapters answer them |
| AC-1620 (pending) | `reconciliation-site-storage-port.test.ts:423` | BUNDLE-19, BUNDLE-20 | **gap: findings 1 and 2** — the test proves the injected store is the one used, but omits two of the five behaviours the criterion enumerates |

STORY-121 (story-fde7370b, upgrade) — 16 active ACs:

| Element | Test | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1385 | `reconciliation-cloudflare-site-store.test.ts:215` + `support/site-store-contract.ts:355,363` | BUNDLE-20 | aligned on substance; **finding 3** — the render assertions are made twice over the same two adapters in the same shape |
| AC-1386 | `…workers.test.ts:126` | BUNDLE-20 | aligned — two handles, colliding slug, cross-account non-interference, arity asserted for every verb |
| AC-1387 | `…workers.test.ts:209` | BUNDLE-20 | aligned — both refusals, the `reason` discriminant, and the branch driven the way `control-app/src/store.ts` drives it |
| AC-1388 | `…workers.test.ts:299` | BUNDLE-20 | aligned — version vs change count moved independently in both directions; absent site → null |
| AC-1389 | `…workers.test.ts:335` | BUNDLE-20 | aligned — both versions on the conflict, plus a real `Promise.allSettled` race |
| AC-1390 | `…workers.test.ts:399` | BUNDLE-20 | aligned — four-page refused write, definition/pages/version all unchanged |
| AC-1391 | `reconciliation-cloudflare-site-store.test.ts:292` | BUNDLE-20 | aligned — stale and fabricated expectations both land, no conflict type raised |
| AC-1392 | `…workers.test.ts:450` | BUNDLE-20 | aligned — a genuinely non-UTF-8 run, R2 `httpMetadata.contentType`, removal |
| AC-1393 | `…workers.test.ts:497` | BUNDLE-20 | aligned — real content planted outside the namespace first, so confinement is not vacuous |
| AC-1394 | `…workers.test.ts:553` | BUNDLE-20 | aligned — memory→memory, memory→cloud, cloud→memory, and all four refusals |
| AC-1395 | `…workers.test.ts:658` | BUNDLE-20 | aligned — the operator's real `storage/sites/*` definitions, every emitted file compared byte-for-byte |
| AC-1396 | `…workers.test.ts:742` | BUNDLE-20 | aligned — `navigator.userAgent`, `cwd === null`, envelope preserved |
| AC-1397 | `reconciliation-cloudflare-site-store.test.ts:354` | BUNDLE-20 | aligned — one MIME object identity-checked, every known extension served and compared |
| AC-1398 | `reconciliation-cloudflare-site-store.test.ts:405` | BUNDLE-21 | aligned — paired by binding name, mutation-proved, and the real hook executed with `npx` stubbed |
| AC-1447 | `reconciliation-cloudflare-store-draft-reuse.workers.test.ts:135` | BUNDLE-20 | aligned — identity not equality, second handle, and the real `/preview/<slug>/edit/` route |
| AC-1448 | `…draft-reuse.workers.test.ts:197` | BUNDLE-20 | aligned — drop, vanish-by-row-delete, and the two-account slug collision |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1620 (acceptance_criterion-ce202d6a) | uat-edit | AC-1620 requires "a palette operation applies and **its rules are enforced**". `test_UAT_AC1620_the_toolbox_edits_through_the_store_it_was_given` (tests/reconciliation-site-storage-port.test.ts:446) reaches the palette only through `set_config` with a `palette` key — a config *merge*. The rules live in the four dedicated tools (`set_palette_color`, `add_palette_color`, `remove_palette_color`, `rename_palette_color`, tools/generate/src/cli/ai/toolbox-core.ts:331-350), whose own comment states that `set_config` "could express the first two by merge and neither of the last two at all — merge cannot remove a key or move one, and it has nothing to say about the references both of those are defined in terms of." No palette rule is exercised and no palette refusal is asserted; the only refusal in the test is a `write_image` CONFLICT. | Invoke the palette tools through the same `box`: `add_palette_color` then `remove_palette_color` on the unreferenced entry (applies), `remove_palette_color` on the seeded, referenced `brand-teal` (asserts CONFLICT), and `rename_palette_color` asserting the reference followed — mirroring the CLI-side assertions at tests/reconciliation-site-storage-port.test.ts:393-406 |
| 2 | violation | consistency | AC-1620 (acceptance_criterion-ce202d6a) | uat-edit | AC-1620 requires "a copy edit reads and writes one segment". The test makes no segment edit at all: its writes are `set_config`, `write_image`, and reads are `describe_page` / `list_changes`. The adapter's segment verbs are `get_l1` / `set_l1` (tools/generate/src/cli/ai/l1-surface.json, operations[3] and operations[11]); neither is invoked. The behaviour that "each result reads back through the store that was injected" is therefore proved for a config write and an asset write, but not for the segment write the criterion names first. | Add a `set_l1` at `'0.0'` followed by `get_l1`, and assert the node read back through `store.readPages(slug)` — i.e. through the injected store, not through the tool's own answer. See "Notes for the Editor" for the `ac-edit` alternative if the editor judges `set_l1` not to be "a copy edit" |
| 3 | warning | exclusivity | AC-1385 (acceptance_criterion-0d6bc58c) | uat-edit | The two render assertions are now made twice over the same two adapters, in the same runtime and the same shape. `test_UAT_AC1385_the_draft_renders_from_whatever_store_served_it` and `test_UAT_AC1385_a_preview_asset_comes_back_as_bytes` (tests/support/site-store-contract.ts:355,363) already run once per adapter, and `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:90-95` registers that body against the filesystem and memory backends. The loop at tests/reconciliation-cloudflare-site-store.test.ts:278-287, inside `test_UAT_AC1385_every_storage_question_answers_identically_over_all_three_stores`, repeats exactly those two assertions over `fs` and `memory`. This is a leftover of fix report-4ac04d1b action 3, which moved the cases into the contract but left the copy in place. | Drop the `for (const site of [fs, memory])` render loop at :278-287, keeping the `RENDER_QUESTIONS` naming assertions at :274-277 — those are the part this test uniquely owns (that the two render questions are *named* apart from the compared vector) |
| 4 | info | coverage | AC-1619 (acceptance_criterion-e045b3e3) | — | The revision verbs are asserted in the shared contract body with both cases the criterion demands (never published at tests/support/site-store-contract.ts:386; published, immutable and re-parented at :400), so all three adapters answer them — including the filesystem-free store, which the criterion says was asserted nowhere before | none |
| 5 | info | consistency | AC-1448 (acceptance_criterion-89fefdc5) | — | The criterion's closing paragraph ("at most one value per account-and-site … cannot grow with the number of edits") is not asserted by `test_UAT_AC1448_…`. This is correct: the AC states it as bounded *by construction* and its own Verification section does not ask for it | none |
| 6 | info | consistency | AC-1329, AC-1398 | — | Both UATs read repository files as strings (`vitest.*.config.mts`, `wrangler.toml`, `bin/deploy`). This is not the structural-check anti-pattern: each criterion is *about* those declarations, and each test also executes something real — AC-1329 renders a behaviour module, AC-1398 runs `bin/deploy.d/migrate/10-d1-site-store` end to end with only `npx` stubbed | none |

## Notes for the Editor

**Both violations are in one test function.** `test_UAT_AC1620_the_toolbox_edits_through_the_store_it_was_given`
(tests/reconciliation-site-storage-port.test.ts:423-471) is otherwise correct and should not be
rewritten — its fixture (`makeMemorySite`, `cwd === null`, `opts.cwd === undefined`) and its
central claim (every result read back out of the injected store, `counter === 2`, the refusal
moving nothing) are exactly what AC-1620 asks for. What is missing is two more tool invocations
inside the same case. The suite runs green today, so the fix is additive and can be verified with
`npm test -- tests/reconciliation-site-storage-port.test.ts` (currently 9 passed).

**On finding 2, the alternative resolution.** AC-1620's phrase "a copy edit reads and writes one
segment" is inherited from AC-1324, which describes the *command line*, where `editCopyGet` /
`editCopySet` exist. The tool adapter exposes no copy verb — the declared surface
(tools/generate/src/cli/ai/l1-surface.json) has `get_l1` / `set_l1` and no `get_copy` / `set_copy`.
If the editor takes `set_l1` to be the adapter's segment write, finding 2 is a `uat-edit` as
tabled. If not, the correct repair is an `ac-edit` naming what the adapter actually exposes. Either
way the behaviour — one segment written through a tool, read back through the injected store —
must end up asserted; what must not happen is the phrase being left to imply a tool that does not
exist. Note this is the only place in either story where an AC's wording outruns the surface it
describes; AC-1324's identical phrase is correct, because the CLI does have the verb.

**AC-1619 and AC-1620 are both `status: pending`**, created 2026-09-10 by the `ac`-level fix
(commit 1efdd4abcb) together with their tests. They are counted here because their tests are live
matrix elements running in the suite, not because the coverage rule demands it — the coverage rule
is about `active` ACs, and every one of the capability's 25 active ACs has a substantive UAT.

**Nothing in this capability is a structural-only proof.** Every AC's test drives a real store —
filesystem, memory, or D1/R2 inside workerd against real bindings — and the three adapters really
do share one assertion body (`tests/support/site-store-contract.ts`, registered at
tests/test_UAT_FC_REQ-142_site_store_port.test.ts:90-95 and
tests/test_UAT_FC_REQ-143_d1r2_store.workers.test.ts:51-54). The capability's central claim —
"one body of storage assertions is run against all three" — is verifiable by reading those three
files and is currently true.
