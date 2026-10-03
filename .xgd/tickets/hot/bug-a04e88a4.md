---
uid: bug-a04e88a4
id: BUG-189
type: bug
title: 'gate coverage: a reference section with a box and no content is not flagged,
  so a capture that lost 2 of 6 sections reads structural-failure instead of capture-incomplete'
created_by: repro-console:repro-www-bluelotusintegralhealing-com#1
created_at: '2026-10-03T19:40:51.297163+00:00'
updated_at: '2026-10-03T23:31:30.121117+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  defect_class:
  - instrument-blind
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-4808793a
---


## Implementation scope (agreed at free-coding start)

**User-visible change.** `1c gate` (and every surface that reads `GateReport.coverage`) gains two reference-coverage proxies:

1. **`coverage.unrecordedText`** — visible text in the bundle's `rendered.html` (text nodes outside `<script>`/`<style>`/`<template>`/`<noscript>`/`<svg>`/`<head>`, entities decoded, whitespace collapsed, at least two letters) that appears in no string anywhere in `capture.json`. Reported always, as data and as one coverage line; it is **not** a finding on its own (skip-links and hidden mobile menus make it noisy on complete captures, e.g. hearingzone510 lists 10).
2. **`coverage.emptySections`** + a new reference-side coverage finding **`empty-section`** — a reference band in the widest rest projection that is ≥ `EMPTY_SECTION_MIN_PX` (200px) tall, paints no `backgroundImageUrl`, and holds no manifest element whose box centre falls inside it (the band's own full-bleed paint record — `isBandPaint` — does not count as content), **corroborated by** a non-empty `unrecordedText`. The finding names each section (ordinal, y, height), the total px and % of the page, and the first few unrecorded strings. A bundle with no `rendered.html` cannot corroborate, so no finding fires.

**Verdict routing.** An `empty-section` finding means the oracle itself is invalid, so it routes to `capture-incomplete` **ahead of `structural-failure` and regardless of the perceptual breach** — the L1 and value gates are both measured against an oracle missing whole sections. Other reference-side findings keep their existing rung (perceptual breach + finding → `capture-incomplete`, below `structural-failure`).

**Why free-coded.** One proxy plus one verdict rung inside `gate-core.ts`; no design document needed.

**Test plan.** `tests/test_UAT_FC_BUG-189_empty_section_coverage.test.ts`, offline fixtures through the real `referenceCoverage` and `cmdGate`: (a) an empty tall band + unrecorded text → `empty-section` finding and `unrecordedText` listed; (b) the same bundle where the run would otherwise be `structural-failure`/`pass` reads `capture-incomplete`; (c) an empty band with no unrecorded text (rendered text all recorded) → no finding; (d) a band whose only element is its own band paint still counts as empty; (e) a short (<200px) empty band and an image band are not flagged. Regression scope: the existing gate/coverage suites (BUG-100, BUG-106, BUG-110, BUG-161, REQ-94, REQ-157).
