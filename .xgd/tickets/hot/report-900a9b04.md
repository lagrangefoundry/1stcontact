---
uid: report-900a9b04
id: REPORT-2366
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-20T04:37:09.410113+00:00'
updated_at: '2026-08-20T04:37:09.410113+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-c4f329d3
---

All 16 UATs pass; no runtime code and no existing test files were touched.

```
UATs generated for story story-c4f329d3 (plan item 6 of 9)

Story: story-c4f329d3
Test file(s) created:
  - tests/reconciliation-system-knowledge-base.test.ts

Tests written: 16
Tests passed: 16
Tests failed: 0

test_files_created:
  - "tests/reconciliation-system-knowledge-base.test.ts"
```

**One test per AC (AC-1291 … AC-1306), all at the exported entry points** — `buildKb`, `exportCorpus`, `bindKb`, `kbStatus`, `resolveDescriber`, and the `1c` command dispatcher (`run`) for the two paths that are safe to drive against the real repo tree (`kb status`, unknown subcommand).

**Boundaries doubled, and only these three:**
- embedding model — via the production `LAGRANGE_KM_EMBEDDER` seam (existing `tests/fixtures/kb-stub-model.mjs`)
- describing model — via `LAGRANGE_KM_DESCRIBER`
- the `xgd` ticketing CLI — a shim placed on `PATH`, so the export's own JSON parse, opt-in filter, render, incremental write and sweep all run for real

Everything else is real: `DocDirStore`, the index and chunk builds, cosine search, ranking, clustering, access-point validation.

**Notes on two judgement calls:**
- `kbRoot()` is repo-anchored with no override, so a CLI-level `1c kb build`/`export` would write into the repository's own `kb/`. Those ACs are therefore driven through the same functions the CLI branch calls, with a temp root — the same compromise the pre-existing FC suite made.
- AC-1303's doorless half needed a corpus where a territory genuinely has no way in. Two documents carrying the same bag of words in different order score identically, so the first-indexed one always takes the single hit a one-document territory is judged in — leaving the other with no phrase that retrieves it. The build reports it by name, which is what the AC requires.

AC-1295's integration half and AC-1297's read-back run against the real ticket store (one shared export, ~40s); the rest are controlled and fast. Whole file: 47s. `tsc --noEmit` reports no errors in the new file.
