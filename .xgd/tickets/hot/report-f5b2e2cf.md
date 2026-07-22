---
uid: report-f5b2e2cf
id: REPORT-742
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-22T20:31:18.282469+00:00'
updated_at: '2026-07-22T20:31:18.282469+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: STORY-80
---

The test passes. The test name `test_UAT_AC716_absolute_literals_carried_verbatim_and_malformed_rejected` matches the enforced regex `^test_UAT_AC\d+_\w+$`.

```
UATs generated for story STORY-80 (plan item 6 of 9)

Story: STORY-80 — Absolute-or-overlay values: every colour, length, and radius
       dial accepts a literal or a named overlay
Test file(s) created:
  - tests/reconciliation-absolute-value-literals.test.ts

Tests written: 1
Tests passed: 1
Tests failed: 0

test_files_created:
  - "tests/reconciliation-absolute-value-literals.test.ts"
```

**AC coverage (1:1):**
- **AC-716** → `test_UAT_AC716_absolute_literals_carried_verbatim_and_malformed_rejected`

The single UAT proves both halves of the acceptance criterion at the L1 boundary (`validateL1` + `renderL1Document`, no runtime code touched):

1. **Absolute literals carried verbatim** — authors a document with distinct absolute colour literals (short `#f0a`, 6-digit `#0a0b0c`, 8-digit alpha `#11223344`) and length/radius px literals (font-size 42, line-height 50, letter-spacing 3, border-radius 12); confirms validation accepts it and every literal reappears unchanged in the emitted CSS.
2. **Malformed literals rejected** — parameterizes seven single-violation variants (non-hex `rgb()` / keyword / `url()`, non-finite number, out-of-range font-size, negative radius, out-of-range geometry coordinate) and confirms the envelope validator rejects each.

All assertions pass against the existing code, matching the pattern of the sibling `reconciliation-l1-substrate.test.ts` file.
