---
uid: bug-a04e88a4
id: BUG-189
type: bug
title: 'gate coverage: a reference section with a box and no content is not flagged,
  so a capture that lost 2 of 6 sections reads structural-failure instead of capture-incomplete'
created_by: repro-console:repro-www-bluelotusintegralhealing-com#1
created_at: '2026-10-03T19:40:51.297163+00:00'
updated_at: '2026-10-03T19:40:51.297163+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  defect_class:
  - instrument-blind
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-4808793a
---

Filed by `repro-console:repro-www-bluelotusintegralhealing-com#1`.

**Class:** `instrument-blind`. The gate's coverage reconciliation returned `structural-failure` (and a coverage block naming only 2 unreferenced logo images) for a reference whose capture lost **2 of its 6 content sections outright**. The correct verdict was `capture-incomplete`, which would have stopped the round before it was spent on an invalid oracle. The coverage proxies measure image attribution and section density. Neither looks for a section that has a box and no content.

**Stored reference:** `storage/references/www.bluelotusintegralhealing.com/index`. One bundle. The capture-side cause is REQ-371 issue 1 (Zyro scroll-reveal wrappers left at `opacity:0`, 19 of 29).

## Evidence

- `storage/tmp/repro-console/repro-www-bluelotusintegralhealing-com/iteration-1/diff/gate.json` → `verdict: "structural-failure"`, `coverage: {mirroredImages 4, referencedImages 2, sections 6, pageHeightPx 2946, pxPerSection 491, findings: [unreferenced-image]}`.
- `expected-manifest.json` sections S5 `{y 1994, h 560}` and S6 `{y 2554, h 392}` contain **zero** elements (every element's box y is < 1994 or belongs to the bands' own paint records 21/22). Together that is 952px, **32%** of the 2946px page.
- `raw.html` / `rendered.html` place text in both: "Get in Touch", two email addresses, a contact form (3 fields + "Submit Your Message"), a tagline, a mailing-list form ("Add to Mailing List"), "© 2025. All rights reserved.", and the logo. `grep -c` for each in `capture.json` returns **0**.
- The reference screenshot paints **0.00%** ink across those two bands (PIL over `screenshot-1280.png`, 40px rows, pixels >120 L1 from the row's dominant colour), so a pixel proxy could have caught it too.

## Proposed change

Add a coverage finding (and route it into the `capture-incomplete` reconciliation): **a reference section whose box is ≥ N px tall and holds no manifest element, while `raw.html`/`rendered.html` holds visible text nodes inside the elements that section was sliced from.** Section ids/selectors are already in the capture's band slicing. A cheaper first version: a manifest section with 0 elements **and** a `rendered.html` text count > 0 for the same `<section>` id. Also report the inverse proxy: text in `rendered.html` (outside `<script>`/`<style>`/`<template>`/hidden nav duplicates) that appears nowhere in `capture.json`. On this bundle that list is 10+ strings long.

**How to see it / know it is fixed.**
```
CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-www-bluelotusintegralhealing-com --ref storage/references/www.bluelotusintegralhealing.com/index --sandbox
```
**Wrong (now):** verdict `structural-failure`, coverage findings = `unreferenced-image` only. **Right:** a new coverage finding naming sections 5 and 6 (952px, ~19 unrecorded elements) and verdict `capture-incomplete` on this bundle. On a re-capture made after REQ-371 issue 1 lands, that finding should be absent.

**This will change verdicts on other bundles**, and that is intended: an unmeasured section is not a clean one.