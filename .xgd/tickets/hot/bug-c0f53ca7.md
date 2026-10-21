---
uid: bug-c0f53ca7
id: BUG-238
type: bug
title: 'Layout check: flag a too-small logo or business name, and headings not attached
  to their text'
created_by: EPIC-19
created_at: '2026-10-20T23:26:22.125248+00:00'
updated_at: '2026-10-21T00:37:01.103229+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: high
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-19b40c10
  commits:
  - working_sha: 1b860b38101cbc15ee156136e30d813d08c1b424
    reconcile_sha: null
    main_sha: null
  - working_sha: 6a2f0877b8a9896491f9384ed6b685d1278a5634
    reconcile_sha: null
    main_sha: null
  version: 0.2.561
---

## Symptom (operator, 2026-10-20)

1. "The consultant is CONSTANTLY making the site name and logo too small" —
   raised on every test site; the priming's novice checklist names it, and it
   still happens.
2. Headings sit equally spaced between the text above and below them, so they
   float instead of attaching to their paragraph.

Both are craft defaults builders get wrong, and a priming reminder hasn't held.
Per REQ-415's pattern, the host measures them.

## Fix

Extend REQ-415's layout check (desktop and phone; reported in the `Delegate`
result and `describe_page` warnings; a finding means the build isn't done):
- **Brand too small:** the header's logo image renders shorter than ~48px on
  desktop or ~36px on phone, or the business name in the header is not clearly
  its largest text (less than ~1.25× the navigation link size). Thresholds are
  configuration, not constants in code.
- **Heading not attached:** a heading whose space to the following text is not
  clearly smaller than its space to the preceding content (below ≥ ~0.75 ×
  above). Deliberate exceptions are rare; the consultant can explain one away.
- **Builder defaults:** builder guidance gives starting sizes for the header
  logo and name, and says to group a heading with its text more tightly than
  the gap before it. (The structural fix for spacing is the L1 rhythm REQ;
  this catches existing pages and anything built before it.)

## What landed

`tools/generate/src/cli/ai/layout-check.ts` — three new finding kinds in the
in-page `LAYOUT_SCRIPT`, so they reach the `Delegate` result's host look and
`describe_page` warnings through the existing REQ-415 wiring unchanged:

- **`small_logo`** — the header is the page's first section when it holds a
  link. Its tallest `<img>` renders shorter than the minimum for the width being
  checked → "has its logo only 28px tall … make it at least 48px tall at this
  width". A header with no `<img>` gets no logo finding.
- **`small_name`** — the header's text splits into navigation links and name
  candidates. A link to the home page (`/`, `index`, `home`, with or without
  `.html`) counts as the name unless its text is just "Home"; text that isn't a
  link counts as a name candidate too. With at least two nav links, the largest
  candidate must be at least `nameOverNav` × the median nav link font size; the
  finding quotes the name and says what size to make it. A header of links only,
  with no name text: if it has a logo (`<img>` or inline `<svg>`), it's skipped,
  because the name may be in the logo; if it has no logo, it's reported as "no
  text clearly larger than its navigation links".
- **`loose_heading`** — for each `<h1>`…`<h6>`, the nearest visible content above
  and below that overlaps it horizontally, anywhere on the page. It's reported in
  the heading's section when space below ≥ `belowOverAbove` × space above. Not
  judged: a heading with nothing above or below it, a heading directly above
  another heading (the lower one is judged instead), and space above under
  `minAbovePx`.

`tools/generate/src/cli/ai/layout-check.json` — the thresholds (new config file,
read at import and written into the script): `brand.logoMinPx` {desktop 48,
phone 36}, keyed by the names in `LAYOUT_WIDTHS`; `brand.nameOverNav` 1.25;
`heading.belowOverAbove` 0.75; `heading.minAbovePx` 16.

`tools/generate/src/cli/ai/priming.json` — the builder-role text (both
`builder_priming` and `builder_priming_with_corpus`) gains a paragraph:
start the logo at about 56px tall on desktop and 40px on a phone, make the
business name the header's largest text (at least a third larger than the nav
links), and put clearly less space below a heading than above it.

## Design decisions

- **No business-name lookup.** `site.json` `config.businessName` exists, but the
  checker only sees the rendered page. Threading the name through every caller
  (host look, `describe_page`, BUG-235's paths) wasn't worth it when the
  header's structure (nav links vs. home link/plain text) identifies the name
  well enough. Revisit if real sites mis-identify it.
- **`minAbovePx` raised from 8 to 16 after probing 10 stored sandbox pages.**
  At 8, tightly and evenly spaced headings (8px above and 8px below, 12px above)
  were flagged, which is tight spacing, not floating. At 16, the real cases stay
  flagged (84px above / 86px below; 20px above / 19px below). The same probe
  found one header made of nav links with no business name at all, correctly
  reported as `small_name`.
- The thresholds are starting values to tune; they live in the JSON, not in code.

## Test plan

`tests/test_UAT_FC_BUG-238_brand_and_heading_layout.test.ts` (real Chromium,
framework renderer, served like `captureL1`; run with
`CHROMIUM_LAUNCH_ARGS=--single-process` under the sandbox):
- a 28px header logo → `small_logo` at both widths, quoting the configured desktop minimum;
- a logo height between the configured phone and desktop minimums → flagged on desktop only (the thresholds are read per width from configuration);
- a 14px name beside 16px nav links → `small_name` quoting the name and the configured multiple;
- a home-linked name the same size as the links → `small_name`;
- an evenly spaced heading/paragraph/heading stack (32px gaps) → `loose_heading` for each heading;
- a correctly sized header and tightly attached headings → no brand or heading findings;
- builder priming (both variants) carries the starting sizes and the heading-spacing rule, and those sizes clear the configured thresholds.

Regression: REQ-415 layout check, BUG-237 hidden text, REQ-418 table, REQ-415
host-looks and BUG-235 workers suites all pass. `REQ-295_delegation_config`'s
REQ-341 grant-list case fails, but it already failed before this change
(unrelated `ManageTextStyles` grant).