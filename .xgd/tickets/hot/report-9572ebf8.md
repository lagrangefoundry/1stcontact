---
uid: report-9572ebf8
id: REPORT-3880
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-11T02:51:17.728993+00:00'
updated_at: '2026-09-11T02:51:17.728993+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-5836022a
---

## Completion Report

```
UATs generated for story story-5836022a (plan item 2 of 17)

Story: story-5836022a
Test file(s) created:
  - tests/reconciliation-projected-reference.test.ts

Tests written: 13
Tests passed: 13
Tests failed: 0

test_files_created:
  - "tests/reconciliation-projected-reference.test.ts"
```

One test per AC (AC-1634 … AC-1646), all passing in 1.4s. `tsc` reports no errors in the new file.

**Free-coded file removed:** `tests/test_UAT_FC_REQ-165_projected_reference.test.ts` — every assertion it carried is superseded at AC granularity by the new file, so leaving it would have left an FC orphan plus a duplicated suite containing one test that fails on upstream API drift (below).

**How the tests are grounded:** expectations are read from the sources, not transcribed — the live `CATALOG`, the `l1NodeSchema` union and `L1_ENVELOPE`, and `l1-surface.json` itself. Three ACs additionally mutate a real source and regenerate (AC-1638 stamp advance, AC-1639 new permitted values, AC-1640 component removal), which also proves the test and the projector share the same module instance. Stubbed at three seams only: the embedding model, the describing model, and the `xgd` ticket-store subprocess (a `PATH` shim). The corpus, export, store, index build and search are real.

## Two things worth surfacing

**1. `buildKb`'s map step is broken by shared-library drift (not this story).** `buildMap` calls `lib.search(query, { source: indexSource, … })`, but `@lagrangefoundry/knowledge` now takes an `indexes` map keyed by source name — so every `buildKb` call throws `KnowledgeConfigError: knowledge base 'system' reads from source 'shipped', which this host has no index for (available: none)` at `tools/generate/src/cli/kb.ts:752`. `buildIndex` and `buildChunkIndex` complete first; only the awareness-map step dies. AC-1634's index half is therefore driven through the two index builds `buildKb` itself calls, with a comment saying why — routing around it through `buildKb` would have tested the drift rather than this story. `searchChunks` has the same drift, which is why the deleted FC file's search test was failing before I touched anything.

**2. Plan item 1's suite is already red on this branch.** `tests/reconciliation-system-knowledge-base.test.ts` asserts REQ-164 behaviour (`doc_kind: system_kb` membership, `--no-limit` + truncation refusal, `kbStatus.tickets`, unrestricted `corpus: {}`), but `tools/generate/src/cli/kb.ts` here is still the pre-REQ-164 version — `INCLUDE_FIELD = 'system_kb'`, `optedIn` requires the boolean, no `tickets` field. `test_UAT_AC1291` fails with *"No doc ticket has opted into the system KB… (6 did not)"*. REQ-164's code commit does not appear to have landed on the reconcile branch. That is plan item 1's scope, not mine, but it will keep failing until the code arrives. My fixture tickets carry both markers, so this story's tests hold either way.

**Lint not runnable here:** `eslint` is not an installed devDependency and the sandbox blocks the npm registry (`403 GET registry.npmjs.org/eslint`).
