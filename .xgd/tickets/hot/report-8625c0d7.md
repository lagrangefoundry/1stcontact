---
uid: report-8625c0d7
id: REPORT-640
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-19T03:06:17.739800+00:00'
updated_at: '2026-07-19T03:06:17.739800+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-e15a19ef
---

All four test names pass the enforced `test_UAT_AC{N}_*` regex. All tests pass.

```
UATs generated for story story-e15a19ef (plan item 5 of 8)

Story: story-e15a19ef
Test file(s) created:
  - tests/reconciliation-1c-cli-output-hygiene.test.ts

Tests written: 4
Tests passed: 4
Tests failed: 0

test_files_created:
  - "tests/reconciliation-1c-cli-output-hygiene.test.ts"
```

**One UAT per AC, verified against existing code:**

| AC | Test | Boundary | What it asserts |
|----|------|----------|-----------------|
| AC-656 | `test_UAT_AC656_multi_viewport_keeps_slug_positional` | `parseArgs` | `--multi-viewport` (a `BOOLEAN_FLAGS` member) keeps the slug as a positional in both flag orders; `--ref` retains its value |
| AC-657 | `test_UAT_AC657_json_is_exactly_one_parseable_document` | `withCleanStdout` + stdout stream | Reproduces `run()`'s `--json` path — render chatter diverted, then one JSON doc on stdout that `JSON.parse` accepts with no diagnostics interleaved |
| AC-658 | `test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr` | `withCleanStdout` | All three diagnostic classes (dep re-optimization, deprecation, "Missing pages directory") land on stderr, absent from stdout |
| AC-659 | `test_UAT_AC659_stdout_restored_after_success_and_failure` | `withCleanStdout` | stdout restored after a succeeding phase **and** after a throwing phase (error propagates, stdout never left aliased to stderr) |

**Notes on approach:**
- No runtime code changed; no existing tests modified. New file only.
- Tests target the two exported public seams the commits (`4f681c73`, `a4323720`) chose as the correctness surface: `parseArgs` and `withCleanStdout`. Full end-to-end `1c values-diff --json` invocation was not used because it boots an in-process Astro/Vite container + headless Chromium against bundle fixtures — heavy and browser-gated, unsuitable for a must-pass reconciliation UAT. The commits themselves test at these seams.
- AC-657 emits the document via `process.stdout.write` rather than `console.log` because vitest reroutes `console.*` away from the real stdout stream; the AC's guarantee is about the stdout byte channel that `withCleanStdout` protects, which `process.stdout.write` exercises directly.

All ACs' intended behavior is implemented by the existing code — no regressions surfaced.
