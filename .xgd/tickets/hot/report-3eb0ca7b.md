---
uid: report-3eb0ca7b
id: REPORT-405
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-10T00:30:29.205423+00:00'
updated_at: '2026-07-10T00:30:29.205423+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-a6962b23
---

All 7 UATs pass with none skipped — the timings (AC-549: 3.8s, AC-550: 2.5s, AC-551: 3.7s, AC-552: 5.0s) confirm the browser-driven checks genuinely executed against real Chromium, while AC-548/AC-553 (render-only, ~10-59ms) and AC-554 (fake driver, 1.85s) ran as designed.

I made no runtime code or existing-test changes (I only built the `site-schema` package `dist`, a prerequisite build artifact, so vitest could resolve the workspace import — the same dist the existing REQ-39/40 tests depend on).

## Completion Report

```
UATs generated for story story-a6962b23 (plan item 1 of 6)

Story: story-a6962b23 (Module conformance harness: isolated per-module render
       with proven safety + security discrimination)

Test file(s) created:
  - tests/reconciliation-module-conformance.test.ts          (AC-548…AC-553)
  - tests/reconciliation-module-conformance-nobrowser.test.ts (AC-554)

Tests written: 7   (one UAT per acceptance criterion)
Tests passed:  7
Tests failed:  0

test_files_created:
  - "tests/reconciliation-module-conformance.test.ts"
  - "tests/reconciliation-module-conformance-nobrowser.test.ts"
```

**AC → UAT mapping** (all pass, all exercise the real harness via `assertModuleConforms` / `serveOneModulePage`):

| AC | Test | What it proves |
|----|------|----------------|
| **AC-548** | `test_UAT_AC548_isolation_single_module_no_site_pollution` | Loopback URL, exactly one `<section>`, catalog `theme.css` + content marker, backing store root is an isolated `fc-conformance-*` temp dir (not under cwd) that is removed on a clean pass |
| **AC-549** | `test_UAT_AC549_safety_flags_broken_render_by_category` | Overflow/page-error/collapsed fixtures each flagged with `safety.*` category id + fixture identity |
| **AC-550** | `test_UAT_AC550_wellformed_module_passes_both_dimensions` | Clean `text-block` passes safety *and* schema-derived-benign security with no false positive |
| **AC-551** | `test_UAT_AC551_declared_exemption_suppresses_only_its_category` | `except:['safety.overflow']` suppresses that check; an unrelated exemption still fails the run |
| **AC-552** | `test_UAT_AC552_security_flags_injection_from_schema_payloads` | Payloads derived from the module's declared `contentSchema`; unsafe fixtures flagged with `security.url-scheme/script/css-breakout/egress` |
| **AC-553** | `test_UAT_AC553_content_safety_refusal_is_conformant_safe_rejection` | A `ContentSafetyError` at render (real `hero` + injection) counts as conformant (no violation); a non-safety render error still propagates |
| **AC-554** | `test_UAT_AC554_advisory_noop_without_browser_runs_with_explicit_driver` | Default driver + `playwright` mocked absent → advisory no-op (resolves); explicit driver → checks execute and can fail |

Two files were required because AC-554's no-op branch needs `vi.mock('playwright')` to force `chromiumAvailable()` false — a mock that must not affect the real browser-driven UATs, so it lives in its own file. All names conform to `^test_UAT_AC\d+_\w+$`.
