---
uid: report-70c444f8
id: REPORT-3478
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-04T03:31:48.326626+00:00'
updated_at: '2026-09-04T03:31:48.326626+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-bb91191c
---

Two new files, no runtime or existing-test changes.

```
UATs generated for story story-bb91191c (plan item 5 of 15)

Story: story-bb91191c
Test file(s) created:
  - tests/reconciliation-project-knowledge-base.workers.test.ts
  - tests/reconciliation-project-knowledge-declaration.test.ts

Tests written: 9
Tests passed: 5
Tests failed: 4
```

**Coverage** — one UAT per AC, all nine ACs:

| AC | Test | Result |
|---|---|---|
| AC-1518 corpus = four kinds, client-wide | `test_UAT_AC1518_…` (workers) | pass |
| AC-1519 search reaches own account only | `test_UAT_AC1519_…` (workers) | **fail** |
| AC-1520 index private, per-account, unservable | `test_UAT_AC1520_…` (workers) | pass |
| AC-1521 incremental cost + searchable off that pass | `test_UAT_AC1521_…` (workers) | **fail** |
| AC-1522 host offers only what it resolves | `test_UAT_AC1522_…` (node) | pass |
| AC-1523 one declaration, in force, scaffolded whole | `test_UAT_AC1523_…` (node) | pass |
| AC-1524 landscape publishable, one record recycled | `test_UAT_AC1524_…` (workers) | pass |
| AC-1525 never-indexed account is ordinary | `test_UAT_AC1525_…` (workers) | **fail** |
| AC-1526 missing binding is a named refusal | `test_UAT_AC1526_…` (workers) | **fail** |

⚠️ **TESTS FAILING — downstream fix-it loop required**

All four failures have one root cause, and it is in runtime code, not the tests:

```
KnowledgeConfigError: knowledge base 'project' reads from source 'project',
which this host has no index for (available: none)
  ❯ ProjectKnowledge.search apps/control-app/src/knowledge.ts:336
```

`apps/control-app/src/knowledge.ts:337` calls the knowledge component's `search` with `source: this.index`. The installed `@lagrangefoundry/knowledge` now takes `indexes` — a source-name → index map (`search.js:226`, `indexFor` at `index_store.js:113`). Passing `source` leaves the map empty, so every search throws before ranking anything. In each of the four tests, every assertion up to the first `kb.search(...)` passes — the tenancy setup, the incremental counts (`embedded: 1`, `kept: 2`, delta below the first pass), the absent-index reads, the empty-corpus pass, and both named refusals in AC-1526.

This is pre-existing and repo-wide, not introduced here or specific to this story:

- the already-landed `tests/test_UAT_FC_REQ-159_project_kb.workers.test.ts` fails the same way (4 of 12);
- `tools/generate/src/cli/kb.ts:826` passes `source:` too, breaking the system-KB map build (`reconciliation-system-knowledge-base.test.ts`, 4 failures);
- `tests/reconciliation-projected-reference.test.ts:357` already calls the library directly with the new `indexes:` shape and passes — so the component is the new API and the runtime call sites are stale.

I did not weaken the ACs to accommodate it: AC-1519's isolation, AC-1521's "searchable off that incremental pass alone", AC-1525's "searchable afterwards" and AC-1526's "searches to an empty result rather than an error" are all asserted as written.

One separate pre-existing drift I ran into but did **not** encode: `@lagrangefoundry/ticketing` now keys attachment blobs by attachment uid, not content address (`t/<tenant>/blob/attachment-<hex>`), which fails the existing `test_UAT_AC1487`/`AC1488`. AC-1520 needs only key-space disjointness, so its assertion is written scheme-agnostically and passes either way.
