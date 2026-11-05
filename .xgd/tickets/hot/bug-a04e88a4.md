---
uid: bug-a04e88a4
id: BUG-189
type: bug
title: 'gate coverage: a reference section with a box and no content is not flagged,
  so a capture that lost 2 of 6 sections reads structural-failure instead of capture-incomplete'
created_by: repro-console:repro-www-bluelotusintegralhealing-com#1
created_at: '2026-10-03T19:40:51.297163+00:00'
updated_at: '2026-10-03T23:38:38.009365+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  defect_class:
  - instrument-blind
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-4808793a
  story_points: 3
  commits:
  - working_sha: 3a41e65ee19112431a15870d4e30725688b3277a
    reconcile_sha: null
    main_sha: null
  - working_sha: 4d2144300d4964166bde960de0c066ab69761910
    reconcile_sha: null
    main_sha: null
  version: 0.2.466
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
## What changed (as implemented)

`1c gate` (and every surface that reads `GateReport.coverage` — `gate.json`, the fidelity tool's coverage block) gains two reference-coverage proxies and one finding:

1. **`coverage.unrecordedText`** — visible text in the bundle's `rendered.html` (text nodes outside comments and `<script>`/`<style>`/`<template>`/`<noscript>`/`<svg>`/`<head>`, entities decoded, whitespace collapsed, at least two letters) that appears, case- and whitespace-folded, in no string anywhere in `capture.json`. `null` when the bundle has no `rendered.html` (unmeasured). Printed as a `text` line in the coverage block. Not a finding on its own: skip-links and hidden mobile menus make it noisy on complete captures (hearingzone510 lists 10, joyfulculinary 2).
2. **`coverage.emptySections`** — reference bands in the widest rest projection that are ≥ `EMPTY_SECTION_MIN_PX` (200px) tall, paint no `backgroundImageUrl`, and hold no manifest element whose box centre falls inside them. The band's own full-bleed paint record (`isBandPaint`) does not count as content. Each entry is `{index, y, height}`; printed as an `empty` line in the coverage block.
3. **`empty-section` finding** (reference side) — fires when both proxies are non-empty. Its detail names each section (ordinal, y, height), the total px and % of the page, and the first five unrecorded strings.

**Verdict routing.** An `empty-section` finding routes the gate to **`capture-incomplete` ahead of `structural-failure` and regardless of the perceptual breach** (so it also fails a run the eyes and value gates would pass): every other gate is measured against an oracle missing whole sections. The diagnosis says the capture lost whole sections and, when the structural gate also failed, that the failure is against the same oracle. Other reference-side findings keep their existing rung (perceptual breach + finding → `capture-incomplete`, below `structural-failure`).

**On the stored bundles.** bluelotus: `empty-section` naming section 4 (y 1994, 560px) and section 5 (y 2554, 392px) — 952px, 32% of the 2946px page — with 16 unrecorded strings ("Get in Touch", the email addresses, the form labels, "© 2025. All rights reserved.", …). The ordinals are the multistate projection's, which has no 8px top strip, so they are one lower than the ticket's S5/S6 from `expected-manifest.json`; the y/height identify the same bands. faelan, gigabytealchemy, joyfulculinary, hearingzone510: no empty sections, no new finding.

## Design decisions

- Corroboration is required because each proxy alone is weak: an empty band can be decorative, and unrecorded text can be a hidden menu. The DOM→band mapping the ticket suggested (`<section>` id) is not available — manifest sections carry boxes, not selectors — so the corroboration is page-level.
- A bundle without `rendered.html` cannot corroborate, so it never gets the finding (existing fixtures with contentless bands keep their verdicts).
- Text extraction is a tag scan, not a parser: no new dependency, and `gate-core.ts` must stay Worker-safe.
- `emptySections`/`unrecordedText` are optional on `ReferenceCoverage` so coverage blocks built elsewhere still type-check.

## Test plan

`tests/test_UAT_FC_BUG-189_empty_section_coverage.test.ts` — offline bundles through the real `referenceCoverage` and `cmdGate`:
- empty tall bands (one carrying only its band paint) + unrecorded text → `empty-section` naming both, 952px, quoted text; script text and recorded heading excluded, `&copy;` decoded;
- empty band with all rendered text recorded → `emptySections` listed, no finding;
- a <200px band and an image band are not empty;
- no `rendered.html` → `unrecordedText: null`, no finding;
- structural gate failing + `empty-section` → `capture-incomplete`, report text names the lost sections;
- identical pixels, no deltas + `empty-section` → `capture-incomplete`, not pass;
- structural failure without the finding is unchanged.

Regression scope: every suite driving `referenceCoverage`/`cmdGate`/`reconcileGates`/fidelity (22 files, 227 passed). The ticket's live `1c gate … --sandbox` reproduction was not run: it needs Chromium, which the session sandbox blocks.