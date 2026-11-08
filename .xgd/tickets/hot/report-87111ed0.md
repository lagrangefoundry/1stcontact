---
uid: report-87111ed0
id: REPORT-11334
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T07:23:05.449688+00:00'
updated_at: '2026-11-08T07:23:05.449688+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-d2bee21c
---

I wrote 16 UATs for story-d2bee21c, one per acceptance criterion, in a new file. In this sandbox 11 pass and 5 are skipped because Chromium can't launch here, so those 5 have not actually been run.

```
UATs generated for story story-d2bee21c (plan item 6 of 6)

Story: story-d2bee21c
Test file(s) created:
  - tests/test_reconciliation_measure_drawing.test.ts

Tests written: 16
Tests passed: 11
Tests failed: 0
Tests skipped: 5 (need a real browser; Chromium cannot launch in this sandbox)

test_files_created:
  - "tests/test_reconciliation_measure_drawing.test.ts"
```

**What runs here (11 pass):** AC2393, AC2396 (the fixture part only), AC2399–AC2408. They go through `l1Operations` over a real in-memory site store, or through the consultant's toolbox (`createL1Toolbox`, then `toolNames` and `run`). The only stand-in is the browser: a measurer that returns the DOC-52 §5.3 wordmark measurement and records every drawing it was given.

**What was skipped (5, written but never executed):**
- AC2394 – measurement shape and transforms
- AC2395 – per-glyph extents and `<tspan>` boxes
- AC2396 – the real-browser part
- AC2397 – requested vs resolved font
- AC2398 – path references, `<defs>`, degenerate nodes

These run the shipped `measureScript` in Chromium, in a page that loads the site's font (IBM Plex) through `@font-face` and has a hostile page stylesheet. Each one first writes its drawing through `write_image`, so here they only prove the drawings are accepted. They print the skip reason instead of passing. They still need running by the gate or by you from a terminal (`npx vitest run tests/test_reconciliation_measure_drawing.test.ts`).

**Possible code-vs-AC gap (AC2393):** the AC says a misspelt anchor is refused with a message listing the valid names. That is only true when calling the schema's `anchorValue` directly. Through `relate`, `solve` or `assert`, the anchor-reference parser rejects first and the message only gives the `<node>.<anchor>` form, without the names. The test checks the name list at the schema level and only the form message through the surface, so it passes. If the AC means the surface refusal should list the names too, `resolveAnchorRef` in `measure-core.ts` would need to change.

**Not checked:**
- Lint: the project doesn't install ESLint, and fetching it from npm is blocked by the sandbox.
- Type-check: there is no tsconfig that covers `tests/`.

No runtime code, existing tests or tickets were changed.