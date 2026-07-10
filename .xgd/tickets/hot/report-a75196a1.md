---
uid: report-a75196a1
id: REPORT-428
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-07-10T02:08:29.141057+00:00'
updated_at: '2026-07-10T02:08:29.141057+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-f8091c08
  parent_report_uid: report-1b5dff4f
  batch_index: '0'
---

The quality gate passed: **Overall Status: SUCCESS** — results match `quality.yaml` expectations, all 6 batch tests green. The 2 remaining failures (AC424/AC425) are pre-existing, outside this batch, and already accounted for by the quality expectations.

## Assessment — Batch 0 of 1 (stabilize/reconcile)

All six failures diagnosed and resolved. Diagnosis and action per failure:

**1. AC568 — transform rotation projection (`extract.ts`) → PRODUCTION BUG FIX**
The test comment already pinned this as a real regression. `EXTRACT_SCRIPT` is a template literal; sibling regexes correctly use `\\(` to emit a literal `\(`, but `transformOf`'s matrix regex used single `\(`, which collapses to an unescaped `(` — turning `/matrix\(([^)]+)\)/` into `/matrix(([^)]+))/`. The capture group then kept the leading `(`, so `parseFloat("(0.994522")` → NaN and rotation always decoded as 0. Fixed the one character (`\(`→`\\(`, `\)`→`\\)`). This is accidental (the three sibling regexes prove the intended pattern), not a design change.

**2. AC458 — content-module contracts (test) → STALE TEST**
The shipped modules gained intentional REQ-45/REQ-20 dials and content fields that the hardcoded contract snapshot predated: text-block `+contentWidth`; services-grid `+contentWidth`; contact-form `+submitForeground/subheadSize/captionSize` dials and `+caption` content. Each has an explicit REQ-tagged comment and shared dial constant in the meta. Updated the expected contract to match shipped intent.

**3 & 4. AC433/AC434 — theme token surface (test) → STALE TEST**
Generator emits 64 declarations (verified group-by-group); the `tracking` group (3 tokens, REQ-45) was added after the 61-count was written. Bumped both counts 61→64.

**5 & 6. AC525/AC535 — values-diff severity ordering (test) → STALE TEST**
Both encoded an obsolete weight model ("color 90 > fontSize 70"). The shipped REQ-47/REQ-48 taxonomy puts `fontSize` in the HIGH tier and `color` in LOW, so font-size deltas now outrank color. Updated the structured ordering to `['fontSizePx','color']` and the human-output assertions to the kind label `[fontSize]` with fontSize-first ordering.

**Files touched:** `tools/generate/src/cli/capture/extract.ts` (production, 1 char), and the three test files. No assertions weakened, no skips added, no shared infra changed (no blast radius — 95 tests across all transform-touching files pass). Left the working tree for the outer reconcile orchestration to handle.
