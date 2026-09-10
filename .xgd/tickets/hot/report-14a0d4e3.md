---
uid: report-14a0d4e3
id: REPORT-3687
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-09-10T07:09:26.482679+00:00'
updated_at: '2026-09-10T07:09:26.482679+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
  anchor_report_uid: report-e37a6b4a
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a. Previous attempts: 3
(report-06854a25 → fix report-11434d37; report-14ca0c44 → fix report-4ac04d1b;
report-f3cb7d00 → fix report-64492e7e).

**Method note.** Level `uat`, so AC bodies are the working reference. The intent ledger was
rebuilt from the tickets (not copied from the prior report) and consulted only to confirm no
entry retires a behaviour an AC still claims — none does; all four are `free_and_reconciled`.
Every one of the capability's 27 ACs was read in full against the body of the test named
`test_UAT_AC<n>_*`, located by scanning `tests/`, `src/`, `packages/`, `apps/` and `scripts/`
for that pattern. The three node-runtime suites were executed to ground the verdict rather
than argue it:

```
npm test -- tests/reconciliation-site-storage-port.test.ts \
            tests/reconciliation-cloudflare-site-store.test.ts \
            tests/test_UAT_FC_REQ-142_site_store_port.test.ts
Test Files  1 failed | 2 passed (3)
     Tests  1 failed | 53 passed (54)
```

The single failure is `test_UAT_AC1397_…`, which fails at
`tools/generate/src/cli/serve.ts:41` with `listen EPERM: operation not permitted 0.0.0.0`.
That is this session's sandbox refusing to bind a socket, not a defect in the test or the
code — the test's own logic (`SERVE_MIME === STORE_MIME` by identity, `contentTypeOf` pinned
per extension) is asserted before and after the server call and is correct as written. For the
same reason the two workerd suites could not be executed at all: the `@cloudflare/vitest-pool-workers`
pool dies at start-up with `listen EPERM ... 127.0.0.1`. The ten cloud-store criteria and
AC-1328/AC-1447/AC-1448 are therefore assessed by reading their bodies, which is what this
prompt asks for at `uat` level; no claim below rests on having run them.

**State of the previous attempt.** report-f3cb7d00's two violations and one warning were
verified as repaired by reading the tree, not by trusting report-64492e7e:

| Prior finding | Verified now |
|---|---|
| 1 (violation, AC-1620 uat-edit — palette rules never reached) | `test_UAT_AC1620_…` now drives the four dedicated palette tools through the same `box`: `add_palette_color` applies (tests/reconciliation-site-storage-port.test.ts:495-500), `remove_palette_color` on the unreferenced entry applies (:503-504), `remove_palette_color` on the page-referenced `brand-teal` is refused with `CONFLICT` and the entry is asserted still present (:509-511), and `rename_palette_color` is accepted with the reference asserted to have followed in the page the store hands back (:516-521). Resolved. |
| 2 (violation, AC-1620 uat-edit — no segment edit) | `get_l1` at `'0.0'` then `set_l1` with a whole replacement element, read back through `store.readPages(slug)` rather than through the tool's answer (:476-488). Resolved. |
| 3 (warning, AC-1385 exclusivity — duplicated render loop) | The `for (const site of [fs, memory])` render loop is gone from tests/reconciliation-cloudflare-site-store.test.ts; only the `RENDER_QUESTIONS` naming assertions this test uniquely owns remain (:271-274), with a comment pointing at where the questions are actually asked. The `PreviewRenderer` / `editAssetWrite` imports and the `SVG` constant that loop was the last user of are also gone. Resolved. |

The count claim that makes the new AC-1620 legs non-vacuous holds too: `counter === 6` at
:530, one per accepted write, with a local before/after around the palette refusal at :509,512.
The suite is green (`npm test -- tests/reconciliation-site-storage-port.test.ts` → 9 passed), so
a tool answering "not enabled" would fail here.

## Cumulative Intent Considered

| Intent ID | UID | Status | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-19 (REQ-133, BUG-35, REQ-131, REQ-140, REQ-139, REQ-142, REQ-144, …) | bundle-77b28def | free_and_reconciled (merged_at_commit b18b859d74) | Storage becomes a port: one small, total, async operation set; the filesystem-free store; two Vitest runtimes routed by filename. Origin of STORY-118. | YES |
| BUNDLE-20 (REQ-147, REQ-143, REQ-145, REQ-146, REQ-148, REQ-149, REQ-150, …) | bundle-b3b7c399 | free_and_reconciled (merged_at_commit eef7a8b48b) | The D1/R2 store scoped per account; the editing surface loadable in workerd; the five revision verbs onto the same declared set (REQ-149); Astro's container removed from the render path (REQ-148/REQ-150). Origin of STORY-121, updater of STORY-118. | YES |
| BUNDLE-21 (BUG-36, BUG-37, BUG-38) | bundle-78f4e2fe | free_and_reconciled (merged_at_commit 96a76934e0) | Deployment repairs behind the cloud store — bindings declared in both halves, schema applied before upload; the assembled-draft reuse (BUG-37). Updater of STORY-121. | YES |
| REQ-162 | request-13a5e206 | free_and_reconciled | The product ticket store (D1 schema, TypePack). Touches STORY-121 through the shared D1 schema/migrations path only. | YES |

No ledger entry is `abandoned`, `deprecated`, `wont_fix`, `draft` or `ready_to_implement`, and
none retires a behaviour any AC in this capability still claims. Nothing is "imminent" — all
four are fully reconciled.

## Alignment Ledger

STORY-118 (story-3f4a5f2b, feature) — 9 active ACs, 2 pending:

| Element | Test | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1321 | reconciliation-site-storage-port.test.ts:127 | BUNDLE-19 | aligned on both cases its Verification names (held site, never-given slug), each answer asserted to be a `Promise`; **finding 1** — the criterion's "or the errors that stopped it assembling, *reported* rather than thrown" branch is driven by no test |
| AC-1322 | …:198 | BUNDLE-19 | aligned — bytes in both directions over both node adapters, keys carrying no separator, sort order asserted, `editAssetWrite`/`editAssetRm` round trip |
| AC-1323 | …:258 | BUNDLE-19 | aligned — three commands over `recordingStore`, exactly one write each with its exact contents, empty change legal and inert |
| AC-1324 | …:339 | BUNDLE-19 | aligned — the whole editing surface over the memory store with `cwd === null` and `opts.cwd === undefined`, ending in a real `PreviewRenderer` render |
| AC-1325 | …:538 | BUNDLE-19 | aligned — one `applyAndAsk` applied to both fixtures and compared, plus the two assembled definitions compared with `sourceDir` excluded by construction |
| AC-1326 | …:576 | BUNDLE-19 | aligned — the real `run()` argv/`--json` envelope for copy, palette and asset commands, the missing-source `NOT_FOUND` with exit code 3, and the same refusal through `handleBuilderRequest` as a 400 carrying the three fields |
| AC-1327 | …:677 | BUNDLE-19 | aligned — page HTML, asset bytes with `image/svg+xml`, absent asset → `null`, and the no-restart refresh through the same renderer instance |
| AC-1328 | reconciliation-site-storage-port.workers.test.ts:30 | BUNDLE-19, BUNDLE-20 | aligned — the file IS its evidence (`cloudflare:test` import + `.workers` marker); SQLite's own catalogue read back, PK enforced by the engine, R2-computed `size`/`etag`, metadata surviving the round trip |
| AC-1329 | reconciliation-site-storage-port.test.ts:711 | BUNDLE-19, BUNDLE-20 (REQ-148/150) | aligned — a real behaviour-module render executed here, plus the aliases/timeouts/no-Astro/partition/compatibility assertions the criterion asks for |
| AC-1619 (pending) | support/site-store-contract.ts:386,400 | BUNDLE-20 (REQ-149) | aligned — both cases (never published / published, immutable, re-parented) in the shared body, so all three adapters answer them |
| AC-1620 (pending) | reconciliation-site-storage-port.test.ts:423 | BUNDLE-19, BUNDLE-20 | aligned — the two gaps report-f3cb7d00 found are closed and the case is green; `createL1Toolbox`'s `store ?? fsSiteStore(ctxOf(opts))` (tools/generate/src/cli/ai/toolbox.ts:186) short-circuits, so the fallback genuinely is not constructed when a store is given |

STORY-121 (story-fde7370b, upgrade) — 16 active ACs:

| Element | Test | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1385 | reconciliation-cloudflare-site-store.test.ts:211 + support/site-store-contract.ts:355,363 | BUNDLE-20 | aligned — `askStorageQuestions` applied to two fixtures and compared, the 11-question set asserted complete and non-vacuous, and the two render questions asked once per adapter in the contract body (registered for filesystem/memory at test_UAT_FC_REQ-142_site_store_port.test.ts:91-94 and for D1/R2 at test_UAT_FC_REQ-143_d1r2_store.workers.test.ts:51-52). The duplicate loop is gone |
| AC-1386 | …workers.test.ts:126 | BUNDLE-20 | aligned — two handles, colliding slug, cross-account non-interference including `version`, arity asserted for every verb including the administrative ones, `forget` scoped |
| AC-1387 | …workers.test.ts:209 | BUNDLE-20 | aligned — both refusals, the `reason` discriminant compared as a value, and the branch driven the way `apps/control-app/src/store.ts` drives it (register on `unknown`, rethrow on `inactive`) |
| AC-1388 | …workers.test.ts:299 | BUNDLE-20 | aligned — version and change count moved independently in both directions; absent site → `null`, not zero |
| AC-1389 | …workers.test.ts:335 | BUNDLE-20 | aligned — both versions on the conflict, `actual > expected`, no trace of the loser, plus a real `Promise.allSettled` race with the winner's content identified |
| AC-1390 | …workers.test.ts:399 | BUNDLE-20 | aligned — a four-page refused write, definition/pages/version all unchanged and re-compared as one vector |
| AC-1391 | reconciliation-cloudflare-site-store.test.ts:279 | BUNDLE-20 | aligned — a stale expectation and a fabricated one both land, nothing raises `StoreConflictError`, with the contrasting side pointed at AC-1389 |
| AC-1392 | …workers.test.ts:450 | BUNDLE-20 | aligned — a byte run proved non-decodable, both assets in one change, R2 `httpMetadata.contentType` per extension, absence vs empty bytes, removal leaving the other intact |
| AC-1393 | …workers.test.ts:497 | BUNDLE-20 | aligned — real content planted outside the namespace first so confinement is not vacuous; both separator kinds and the parent step, read and write, with the rest of the change landing |
| AC-1394 | …workers.test.ts:553 | BUNDLE-20 | aligned — memory→memory, memory→cloud, cloud→memory, the one-whole-change assertion via `recording`, and all four refusals including the part-way case |
| AC-1395 | …workers.test.ts:658 | BUNDLE-20 | aligned — the operator's real `storage/sites/*` definitions inlined by Vite, guarded against an empty glob, every emitted file compared byte-for-byte with a `.css` presence check |
| AC-1396 | …workers.test.ts:742 | BUNDLE-20 | aligned — `navigator.userAgent === 'Cloudflare-Workers'`, `cwd === null`, both edits, load order, change count, envelope preserved |
| AC-1397 | reconciliation-cloudflare-site-store.test.ts:341 | BUNDLE-20 | aligned as written — one MIME object identity-checked (`SERVE_MIME === STORE_MIME`), every known extension served and compared, invented and extension-less names pinned to `application/octet-stream`. Cannot execute in this sandbox (see method note) |
| AC-1398 | reconciliation-cloudflare-site-store.test.ts:392 | BUNDLE-21 | aligned — paired by binding name with nothing counted, mutation-proved via `repointBinding`, the executable bit checked, and the real `bin/deploy.d/migrate/10-d1-site-store` run with only `npx` stubbed (apply, rehearsal, unreachable rehearsal, non-owner app) |
| AC-1447 | reconciliation-cloudflare-store-draft-reuse.workers.test.ts:135 | BUNDLE-20/21 (BUG-37) | aligned — identity not equality, own write, asset write, second independently obtained handle, and the real `/preview/<slug>/edit/` route twice then after a save |
| AC-1448 | …draft-reuse.workers.test.ts:197 | BUNDLE-20/21 (BUG-37) | aligned — drop-and-recreate with the stamp collision made explicit, vanish-by-row-delete, and the two-account slug collision asserted by identity |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | AC-1321 (acceptance_criterion-d4cc3712) | uat-edit | AC-1321's enumeration of what "assemble the current draft" answers has three parts: the assembled-and-validated definition, **"or the errors that stopped it assembling, *reported* rather than thrown"**, and the stamp. `test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld` (tests/reconciliation-site-storage-port.test.ts:165-173) asserts the first (`draft!.result.ok === true`) and the third (stamp equal on a repeat read, different after a write), but never drives a site whose definition does not assemble, so the error branch is exercised by nothing. Confirmed repo-wide: no test calls `loadDraft` and asserts `result.ok === false`; the only code that even handles it is the pass-through at tests/support/storage-questions.ts:86, which is never reached. If `loadDraft` threw on an unassemblable definition instead of reporting, the capability's headline claim — "answers every question it is asked … without ever failing the ask" — would be false and the suite would stay green. Not a violation: AC-1321's own Verification section scopes the drive to exactly two cases (a store holding a seeded site, and a slug never given), neither of which can produce the error branch — the same reasoning by which report-f3cb7d00 finding 5 recorded AC-1448's unasserted closing paragraph as correct-as-it-stands | Add a third leg to the existing loop: seed one page whose L1 fails validation (e.g. a `text` node with a non-hex `axes.color` literal, which `validateL1` rejects), then assert `await store.loadDraft(slug)` resolves rather than rejects, that its `result.ok` is `false`, and that `result.errors` is a non-empty list — i.e. reported, not thrown. Both node adapters already run in that loop, so one edit covers them; the shared contract body would cover all three if the editor prefers it there |
| 2 | info | consistency | AC-1619 (acceptance_criterion-e045b3e3) | — | The freeze verb's clause names four things held under the revision — definition, pages, asset bytes **and rendered output** — and `test_UAT_AC1619_a_frozen_revision_lists_reads_back_and_reparents_the_draft` passes `out` to `writeRevision` (tests/support/site-store-contract.ts:422) but never reads it back. This is correct as it stands: the port's read verb returns `StoredSnapshot` (tools/generate/src/store/revision-model.ts:59-63), which carries `siteJson`/`pages`/`assets` and no `out`, so asserting the frozen render at the port level would require reaching past the port — which is the very thing the criterion's "with no caller ever naming where those bytes live" forbids | none |
| 3 | info | consistency | AC-1385, AC-1391 | — | Both tests include an assertion that reads a sibling test file as a string (reconciliation-cloudflare-site-store.test.ts:258-263 and :336). These are supporting claims about *which* module the third adapter's suite imports, not the tests' substance — each also drives real stores (`askStorageQuestions` over two fixtures; a real filesystem store through three conditional writes). Not the structural-check anti-pattern | none |
| 4 | info | exclusivity | AC-1447 vs `tests/test_UAT_FC_BUG-37_preview_assemble_memo.workers.test.ts` | — | The BUG-37 feature-completion suite asserts the same reuse-by-identity behaviour in the same runtime. This is the repo-wide pattern of an FC suite alongside a reconciliation UAT (as with REQ-142/REQ-143 and the `reconciliation-*` files), not a redundant matrix element: only the `test_UAT_AC1447_*` case is the matrix element, and it additionally drives the real `/preview/<slug>/edit/` route, which the FC suite does not | none |

## Notes for the Editor

**This level passes.** The one warning is optional; it does not gate the level, and an editor may
leave it. If it is taken, it is a strictly additive edit to an existing loop in a green suite —
`npm test -- tests/reconciliation-site-storage-port.test.ts` (currently 9 passed) is the check.

**Do not re-run the ac-level warning about AC-1321's journal verbs.** report-bd2fed08 finding 1
(warning, `ac-edit`) observed that AC-1321's enumeration stops before "record a change" and
"read the changes since a given count". It was a warning and was not applied; AC-1321's body
still enumerates seven verbs. At `uat` level the AC body is the working reference, so the test
matching that body is aligned. Finding 1 above is a different clause of the same AC (the error
branch, which *is* in the current body) and is not a restatement of it.

**Two runtimes could not be executed here, and that is an environment fact, not a finding.**
`@cloudflare/vitest-pool-workers` needs to bind `127.0.0.1` and this session's sandbox refuses
`listen` with `EPERM`; the same refusal fails `test_UAT_AC1397_…`'s `startServe` on the node
side. Thirteen of the capability's 27 criteria live in workerd suites. They were assessed by
reading, and every one of them reaches for something a double could not produce — SQLite's
`sqlite_master`, an engine-enforced primary key, D1's `batch()` rollback, R2's server-computed
`size`/`etag`, and the operator's real `storage/sites/*` definitions inlined by Vite. An
operator who wants these executed should run them outside the sandbox before treating this
PASS as a full-suite result.

**The capability's central claim is checkable and currently true.** "One body of storage
assertions is run against all three" resolves to `tests/support/site-store-contract.ts`,
registered for the filesystem and memory adapters at
tests/test_UAT_FC_REQ-142_site_store_port.test.ts:91-94 and for the D1/R2 adapter at
tests/test_UAT_FC_REQ-143_d1r2_store.workers.test.ts:51-52, plus
`tests/support/storage-questions.ts`, whose `askStorageQuestions` is called from both the host
suite (reconciliation-cloudflare-site-store.test.ts:221-222) and the workerd one
(reconciliation-cloudflare-site-store.workers.test.ts:730-732). Nothing in this capability is a
structural-only proof.
