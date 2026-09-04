---
uid: report-28d5773b
id: REPORT-3523
type: report
title: 'Code Review: bundle-203b1dc2'
created_by: xgd
created_at: '2026-09-04T07:31:07.394630+00:00'
updated_at: '2026-09-04T07:31:07.394630+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-203b1dc2
  anchor_uid: bundle-203b1dc2
---

# Code Review

**Result**: PASS

## Summary

This is the re-review after `fix_review_free_coded`. Both criticals raised by the previous review (`report-2e9e415e`) are genuinely closed, not papered over: the IPv4-mapped IPv6 hole in the SSRF guard is decoded and refused at the form the WHATWG parser actually emits, and the REQ-165 UAT now calls `searchChunks` with `indexes` and asserts. I re-verified each executably rather than reading the fix report — `tests/test_UAT_FC_REQ-165_projected_reference.test.ts` and `tests/test_UAT_FC_REQ-163_material_pipeline.test.ts` run **30 passed, 0 skipped**.

The fixer also made four changes beyond the fix-it prompt (redirect-refusal address, empty-document error class, `ProjectKnowledge.search` `indexes:`, `not_found` → 404). I reviewed all four as unreviewed new code: each is correct, each is consistent with the surrounding idiom, and none breaks an existing assertion I could find. `ProjectKnowledge.search` in particular was a real defect — `indexFor` resolves by `kb.source`, which for the `project` KB defaults to the library's `DEFAULT_SOURCE = 'project'`, so the old `source:` spelling supplied no index at all and every project-KB search threw.

The two gaps in this review are the same two the previous review had, and neither is attributable to the bundle: the recorded quality gate is vacuous, and the workerd project cannot boot in this sandbox. I compensated for the first by running the node suite and `tsc` myself; the second I state as an uncovered gap rather than as a pass.

## Quality Gates

| Gate | Recorded (`report-915355d1`) | Verified here |
|------|------|------|
| Lint | success, 0 errors, 0 warnings, **0.0001s** | not re-run — no `lint` script exists in `package.json`; the recorded duration says nothing ran |
| Build | success, `"No tsconfig.json — type-check skipped (JS-only project)"` | **the recorded gate is vacuous.** Re-run by hand: `tsc -p apps/control-app/tsconfig.json --noEmit` → clean; `tsc -p tools/generate/tsconfig.json --noEmit` → clean. The bundle's ~2,100 new lines of TypeScript type-check. |
| Tests | pass | **the recorded report ran 0 tests** (`"suites": {}`) — not evidence. Re-run by hand, see below |
| Coverage | not reported | not reported |

`report-915355d1` (07:07, commit `5d6d76b228`) is `Scoped quality: pass (0 tests, 0 failed)` with an empty `suites` map, naming the same `report-3d9ba0b3` regression anchor. As in the previous cycle, **no recorded quality report in this reconcile has executed the bundle's tests.** The passing gate is a harness artefact, not a signal, and the fix loop has no way to repair it — so it is stated here rather than failed on.

### What I ran

**Node project — 22 of the 24 changed non-workers files:** `178 passed | 4 failed | 12 skipped (194)`.

All 4 failures are in 2 files and all 4 share one stack:

```
KnowledgeConfigError: knowledge base 'system' reads from source 'shipped',
which this host has no index for (available: none)
  at indexFor  @lagrangefoundry/knowledge/src/index_store.js:118
  at scopedIndexes                          .../search.js:127
  at find      tools/generate/src/cli/kb.ts:825
  at buildMap  tools/generate/src/cli/kb.ts:842
  at buildKb   tools/generate/src/cli/kb.ts:942
```

**Pre-existing on `main`, established three ways** — I did not take the previous review's word for it:

1. `main:tools/generate/src/cli/kb.ts:583-591` is byte-identical to `HEAD:…:824-832`, `source: indexSource` included.
2. `main:tests/test_UAT_FC_REQ-123_system_kb.test.ts:284` carries the same stale `source: indexSource`, at the same line number.
3. The triggering declaration is unchanged: `kb/knowledge_bases.json` already carried `"source": "shipped"` for the `system` KB on `main` — the bundle's diff to that file adds the `project` KB and rewrites the `system` corpus predicate, but does not touch `source`. And `main`'s copy of `reconciliation-system-knowledge-base.test.ts` calls `buildKb` from the identical `beforeAll` at the identical lines.

So this is upstream drift in the shared `@lagrangefoundry/knowledge` package (`search` now takes `indexes`, not `source`), which `main` never caught up with. It is a real product problem — it means `1c kb build` cannot complete — but it is not this bundle's regression, and the previous review explicitly ruled it out of the fix loop. See Warnings.

**Two changed node files could not be run:** `tests/req115-builder-shell.test.ts` and `tests/reconciliation-builder-workspace-origin.test.ts` hang at wrangler startup (the sandbox denies `listen` on 127.0.0.1, so the boot never fails, it stalls). Both are pre-existing files (`M`, not `A`). Environmental.

**Workers project — 15 changed `*.workers.test.ts` files: not executed.** The pool dies at startup with `Error: listen EPERM: operation not permitted 127.0.0.1` before any test runs. This is identical to the previous review's finding and is a property of this sandbox, not of the code — the fix session reports these tests boot and pass in its own environment. **Stated as an uncovered gap, not as a pass**: REQ-158's Worker half, REQ-159's project KB, REQ-161's material surface, REQ-162's ticket store and REQ-163's ingestion carry no execution evidence from this review. For the three ACs the fixer claims beyond-prompt fixes for (AC1537, AC1545, AC1570) I verified the change statically instead — see Code Quality.

## External Interface Accessibility

New entry points wired in: **yes**, no gaps.

The previous review's accessibility table (7 material routes in `router.ts`, `AI` binding in both `wrangler.toml` halves, the separate `1stcontact-material` bucket, `admit` in `index.ts`, `0004_identity.sql` registered, `writeProjections` called from both `kb export` and `kb build`, `CATALOG`/`getModuleMeta` exported, Library panel + upload overlay mounted in `app.js`, `cmdAssets` awaited at both call sites) still holds — the fix commit touched none of those files' wiring. Re-checked for the fix's own surfaces:

| Surface | Evidence |
|---|---|
| `MaterialRejectedError.tooLarge` | set at the one size-refusal site (`material.ts:277`) and read at `router.ts:1067`; no other `tooBig()` call constructs a `MaterialRejectedError` |
| `FetchRefusedError` from `ingestFetch` | already imported and mapped at `router.ts:1069` → 400 with `url` |
| `NotMaterialError` from a `not_found` lookup | mapped at `router.ts:1079` → 404 with `uid`, the same response as a wrong-kind uid |
| `indexes: { [PROJECT_KB]: … }` | `PROJECT_KB = 'project'` (`knowledge.ts:92`) matches `DEFAULT_SOURCE = 'project'`, which is what `indexFor` resolves by |

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `apps/control-app/src/fetch-guard.ts:131-139` | **Fixed and correct.** `::ffff:a9fe:a9fe` → `hi=0xa9fe, lo=0xa9fe` → `169.254.169.254` → refused; `::ffff:7f00:1` → `127.0.0.1` → refused. The dotted branch is retained for a caller that passes the predicate directly. The comment states the reason the dotted-only check never fired. | Resolved |
| `tests/test_UAT_FC_REQ-163_material_pipeline.test.ts:274-289` | **Evidence is now valid.** The added loop asserts through `assertFetchable('https://[::ffff:169.254.169.254]/')` — the production entry point, at the level the predicate-only assertions were blind. Adding the normalised spellings to the predicate list alone would not have been enough; the fix did both. | Resolved |
| `tests/test_UAT_FC_REQ-165_projected_reference.test.ts:22,237` | **Fixed.** `indexes: { [SHIPPED_SOURCE]: source }`, mirroring `reconciliation-projected-reference.test.ts:357`. The test reaches its assertions; file is green. | Resolved |
| `ac1489.json` | **Deleted.** Not present at `HEAD`, working tree clean. | Resolved |
| `apps/control-app/src/router.ts:1066-1067` | **Fixed.** `err.tooLarge ? 413 : 400` replaces the `includes('the limit is')` prose sniff. The flag is set by the thrower and the comment records why the substring form was fragile. | Resolved |
| `apps/control-app/src/knowledge.ts:337-343` (beyond prompt) | Correct, and a real defect the review had not spotted — `indexFor` (`index_store.js:113-124`) resolves by `kb.source`, so the old `source:` key supplied nothing and every project-KB search threw `KnowledgeConfigError`. Minor: the comment says the source name "defaults to the KB's own", which is a coincidence — it defaults to the library's `DEFAULT_SOURCE`, which happens to equal `'project'`. The key is right; only the stated reason is. | Minor |
| `apps/control-app/src/material.ts:313-324` (beyond prompt) | Empty-fetched-document refusal changed from `MaterialRejectedError` to `FetchRefusedError` so the address reaches the client. Compatible with the assertion that covers it — `reconciliation-material-ingestion.workers.test.ts:602-603` asserts `status === 400` and `/nothing to store/i`, and the new class maps to 400 with the same message. | OK |
| `apps/control-app/src/material.ts:651-668` (beyond prompt) | `not_found` → `NotMaterialError` → 404, closing the enumeration oracle; every other store error still reaches 500. `code === 'not_found'` is the real shape — `TicketError` is constructed with it at `@lagrangefoundry/ticketing/src/errors.js:45`. | OK |
| `apps/control-app/src/fetch-guard.ts:191-201` (beyond prompt) | A refused redirect hop is re-thrown carrying the caller's original address rather than the hop's. Correct, and the comment states that the hop is still named in the message so nothing diagnosable is lost. | OK |
| `apps/control-app/src/fetch-guard.ts:215,248` | An over-size **fetched** document raises `FetchRefusedError` → 400, while an over-size **uploaded** one now raises 413. Defensible (the fetched bytes are not the caller's payload) and pre-dates the fix, but the asymmetry now sits directly under a comment reasoning about 413-vs-400 and is worth an explicit line either way. | Minor |
| `tools/generate/src/cli/kb.ts:825-826` | `lib.search(query, { source: indexSource, … })` — the shared library takes `indexes`, so `buildKb → buildMap → find` throws and **`1c kb build` cannot complete**. **Pre-existing and identical on `main`** (see Quality Gates); out of scope for this loop, but it disables the command REQ-158/164/165 are built around. | Warning (pre-existing) |

Structure and consistency are unchanged from the previous review's assessment and remain good: errors as named classes carrying the field the router needs, seams injected through a `deps` object, no debug residue, no commented-out blocks, no TODO stubs, no `_v2` files, constants named rather than inlined. The fix commit did not introduce a new pattern anywhere — each change extends the shape already in the file.

## Checklist Compliance

No `architecture_checklist`, `security_checklist` or `design_checklist` report exists — all three queries returned `"items": []`. Sections omitted per the review contract.

## Smoke Test

| Entry point | Result |
|---|---|
| `1c --help` | **Pass.** Full usage block, no stack trace. |
| `1c kb status` | **Pass.** `corpus: 4 exported + 3 projected (of 4 ticket(s) carrying doc_kind: system_kb)`, then `index: built`, `chunks: built`, `map: built`. The two-producer line and the `doc_kind` vocabulary REQ-164 introduced are both live. |
| `1c kb build` / `1c kb export` | Not invoked — both write to `kb/` and this is a read-only review. `build`'s failure is established from the stack trace above and is pre-existing on `main`. |
| Worker routes | Not invocable — workerd cannot start in this sandbox. |

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix)**:

- **Pre-existing, own ticket, do not fix here**: `tools/generate/src/cli/kb.ts:826`, `tests/test_UAT_FC_REQ-123_system_kb.test.ts:284` and `tests/reconciliation-system-knowledge-base.test.ts` all pass `source:` where `@lagrangefoundry/knowledge` now takes `indexes:`. This breaks `1c kb build` and 4 tests. Byte-identical on `main`; it is shared-dependency drift, not a regression from this bundle. It deserves a ticket of its own, because `1c kb build` is the command REQ-158/164/165 exist to serve.
- The recorded quality gate ran 0 tests and skipped type-checking. It should not be read as evidence for this bundle by anything downstream. (I ran both by hand; results above.)
- 15 `*.workers.test.ts` files in this bundle are unverified by this review — the workerd pool cannot bind a socket in this sandbox.
- `knowledge.ts:340` — the comment's justification for keying on `PROJECT_KB` is a coincidence with the library's `DEFAULT_SOURCE`. Worth one line acknowledging the coupling, so a future change to either constant is caught.
- `fetch-guard.ts:215,248` — an over-size fetched document answers 400 while an over-size upload answers 413. Whichever is intended, say so where the 413-vs-400 comment already is.

None of these blocks the bundle: the first four are gaps in the harness or in `main`, and the last two are notes on comments and an intentional-looking asymmetry.

## Fix-It Prompt

N/A — PASS.
