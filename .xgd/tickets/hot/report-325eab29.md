---
uid: report-325eab29
id: REPORT-3494
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-04T04:45:20.662580+00:00'
updated_at: '2026-09-04T04:45:20.662580+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-f775289b
---

Both files are final; the runtime tree is untouched. Here is the outcome.

## UATs generated for story story-f775289b (plan item 9 of 15)

**Test files created**
- `tests/reconciliation-library-material-surface.test.ts` — 6 UATs (AC-1558…AC-1562, AC-1567), jsdom project
- `tests/reconciliation-library-material-origin.workers.test.ts` — 7 UATs (AC-1563…AC-1566, AC-1568…AC-1570), workerd project

The split is forced by runtime, not preference: six criteria need a DOM (which workerd lacks), seven need real D1/R2 bindings (which jsdom lacks). One test per AC, 13 ACs, 13 tests. The only doubles are the network (`globalThis.fetch`) and the embedder; `api.js`, `library.js` and the installed `webui` components are all real.

**Tests written: 13 · passed: 10 · failed: 3**

## ⚠️ 3 tests failing — code diverges from intent, not test error

I verified this by temporarily applying minimal fixes for both root causes: **all 13 passed**. I then reverted them — `git diff` over `apps/`, `packages/`, `tools/`, `db/`, `bin/` is empty, and `git status` shows only the two new files.

**1. `apps/control-app/src/knowledge.ts:336` — every project-KB search throws.** `ProjectKnowledge.search` passes `source: this.index` to the knowledge component's `search`, which now takes `indexes:` (a `Map` keyed by the KB's source name). Every call raises `KnowledgeConfigError: knowledge base 'project' reads from source 'project', which this host has no index for (available: none)`. Blocks `test_UAT_AC1564` (a correction reaches retrieval) and `test_UAT_AC1566` (the surviving description is still findable).

This one is **pre-existing and wider than this story** — on the branch as it stands, independent of my files, it already fails 4 tests in `tests/reconciliation-project-knowledge-base.workers.test.ts` (AC-1526 among them) and 1 in `tests/test_UAT_FC_REQ-161_material_surface.workers.test.ts`.

**2. `apps/control-app/src/router.ts` catch block — the surface *is* an existence oracle.** A uid naming a record of another kind correctly answers 404 via `NotMaterialError`. A uid naming **nothing at all** raises the ticketing component's `TicketError('not_found')`, which no handler matches, so it falls through to the generic **500**. AC-1570 requires the two to be indistinguishable; today the status code tells a caller which identifiers exist in the account. Blocks `test_UAT_AC1570` on all three identifier-taking routes.

Two assertions of my own were wrong and I fixed them rather than the code: AC-1568 planted its distinctive phrase in the first line, which legitimately becomes the row's `title`; and AC-1562 matched `\bNo\b` against a row whose `textContent` concatenates to `…siteNo`.

```
test_files_created:
  - "tests/reconciliation-library-material-surface.test.ts"
  - "tests/reconciliation-library-material-origin.workers.test.ts"
```
