---
uid: request-fe808622
id: REQ-463
type: request
title: 'Desktop sections use half the screen: the design states a text measure and
  the site''s section compositions (split, overlay, statement, cards, full), the structure
  assigns one per section, and the layout check flags an unused half'
created_by: EPIC-19
created_at: '2026-10-25T22:07:37.672524+00:00'
updated_at: '2026-10-25T23:50:30.899209+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 8
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-5a644557
  commits:
  - working_sha: b1c9caf445fd260f95a9ef175bb72f032b2abd4c
    reconcile_sha: null
    main_sha: null
  - working_sha: d66f6c20ea800b6ed404e89dc3127eefd5b8166c
    reconcile_sha: null
    main_sha: null
  version: 0.2.651
---

## Symptom

First-Draft-Test Dina's Diner 3, desktop (1280px). Every section on the home page
is the same composition: a picture across the full 1120px measure, then a 600px
column of text against the left edge, with the right half of the screen empty
beside it. This holds for the room (Hal's counter), the coffee bell, the Dino
burgers and Who stops here. The page reads as a long phone layout stretched onto
a desktop. The operator: "Text layout is very narrow (half screen) in Desktop
width" (one of their two biggest concerns). The full-width hero is good. The
problem is that every section after it has the same shape.

## Cause

A design system with nothing to say about it:
- `site.design.layout` holds `contentWidth`, `wideWidth`, `gutter` and `grid`. It
  has no **text measure** (how wide running text sets), so the builder invents
  one per block: `room-text` and `coffee-text` are `sizing.width: {fluid,
  maxPx: 600}`.
- It has no **section compositions** (text beside its picture, text over a
  picture, a centred statement, a band of cards). So each builder falls back to
  stacking the picture over the text, the one composition that's always valid.
- Nothing checks for it. The layout check measures grid alignment, spacing and
  outlines, not a desktop section that uses half its width. The critic didn't run
  on this draft.

A 600px text column is right typographically (~65 characters). What's wrong is
the empty space beside it, on every section.

## Fix

1. **The design states the text measure.** `layout.textWidth` is a per-width
   length bounded to a readable line (about 45–75 characters of body). Running
   text takes it by default, so builders stop sizing text blocks themselves (an
   explicit text width becomes off-system on the `layout` axis, as REQ-456 holds
   off-system values).
2. **The design names the site's compositions**, and the structure assigns them.
   `layout.compositions` lists the shapes this site uses. Each is typed, not a
   template:
   - `split`: picture beside text from tablet up, alternating sides, stacked on a
     phone;
   - `overlay`: text on the picture, with the BUG-268 scrim rules;
   - `statement`: centred text at the text measure;
   - `cards`: a row of items on the grid;
   - `full`: picture across, text under, which is today's shape.

   The principal picks the set with the look (REQ-448). The site-structure
   decision (REQ-460) gives each home section its composition, so the rhythm is
   planned, not repeated. Builders build each section to its composition.
3. **The layout check flags an unused half.** At desktop, a section whose content
   leaves 40% or more of the measure empty beside running text, with nothing
   placed there, is a fault `unused_width` ("the text sits in half the width with
   nothing beside it: give the section a composition that uses the width"). Two
   or more `full` sections in a row is a fault too, unless the structure asks for
   it.
4. **The critic's rubric** names a page whose sections all share one composition
   as a layout finding.

## Test plan

`tests/test_UAT_FC_REQ-463_sections_use_the_desktop_width.*`:
- Dina 3's stored home page at 1280: `unused_width` fires for the room, coffee,
  Dino and Who stops here sections, and not for the hero.
- With `layout.textWidth` and no text sizing, running text renders at the text
  measure. A block with its own `maxPx` is reported off-system.
- A `split` section renders picture and text side by side at 1280 and 900
  (alternating sides on consecutive splits), and stacked at 375.
- The structure decision records a composition per home section, and the
  builder's brief carries it.
- Two consecutive `full` sections are a fault unless the structure asks for them.
- Re-run the REQ-447, REQ-448, REQ-456, REQ-460 and BUG-268 UATs.


## Design decisions (implementation, REQ-463 session)

Made during implementation; the shape above is unchanged.

- **The text measure is a width name.** `layout.textWidth` is a design length (one px value or a per-width track). The design system checks that it is no wider than `contentWidth` and sets 45–75 characters of `body` at every width (at 0.55em a character). It joins the measures as the width name `text`: the renderer declares `--l1-text` on `:root`. A box or container with `width: "text"` sits at the text measure, centred. A text run with `width: "text"` caps its line there (`max-width`, never wider than its parent). **By default, on a page (not the shared header or footer), running text takes `width: "text"`**: a run with no role, or role `body`, `lead` or `quote`, that is not drawn as a component, is not a link, and sizes or places itself in no other way. A builder that types its own `sizing.width` px/maxPx is already counted off-system on REQ-449's `width` axis (the "layout axis" above); that census is unchanged. `width: "text"` on a site whose design has no `textWidth` is a dangling reference (a validation error, like an undefined `wide`).
- **Compositions are typed and resolved by the design, like REQ-462's header arrangement.** `layout.compositions` is a non-empty list of distinct names from `split | overlay | statement | cards | full`. A top-level section (box or container) names one as `composition`. Naming one that the design does not list is a dangling reference. The builder decides what the section holds and in what order. The design lays it out at render time:
  - `split`: the section's first child that holds only a picture is the picture, and everything else goes in a text column beside it. Two equal columns from 768px, stacked below. The cells stretch to the row, and the picture covers its cell. Consecutive `split` sections alternate the side the picture is on (the second puts it on the right).
  - `overlay`: the picture becomes the section's background (`cover`), under a scrim at 0.55 black (REQ-440's over-image rule wants ≥0.35). The text is white, padded by the space scale. The section takes no width of its own here.
  - `statement`: the section's children are centred at the text measure, and their text is centred.
  - `cards`: leading text runs (a heading, an intro) stay above. The rest go into a grid: stacked below 640px, then columns by count from 640px (2 or 3 → that many, 4 → 2, 5 or more → 3). The gap is the grid's gap, else the block gap.
  - `full`: the picture across the section, and the rest centred under it at the text measure.
  A section with no `composition` renders exactly as before.
- **The design must state both to be complete** (REQ-456's `l1DesignMissing`): `layout.textWidth`, and `layout.compositions` with at least two shapes so a page can vary. The host's seeded design fills them: a text measure of 65 body characters, rounded to 10px, and all five compositions. The principal narrows the set with the look (REQ-448's `set_design`/`offer_looks`).
- **The structure carries a composition per home section.** `set_decision` on `pages_navigation` takes `home`: the home page's sections in order, each `{ section, composition }`, where `section` is the id the builder gives the section. It is stored on the decision as `home`, and composition names outside the five are refused. The first build is still gated on the structure's `value` (REQ-460); the refusal and the tool's description now ask for `home` too. **The builder's brief carries it.** While the structure has `home` sections, the host appends one line to a `Delegate` goal whose scope is the home page (or that has no scope), naming each section's id and its composition. This is the one host-added line in a brief: BUG-233's "the brief is the consultant's" keeps holding for everything else.
- **The layout check, two new checks:**
  - `width_use` → `unused_width`, at screens from 1024px. Running text (at most 24px, two lines or more, not a heading, menu, table or button) that leaves at least 40% of its section's width empty on one side is a fault, unless something shown is in that strip beside the text (a picture, text, a button, or a background picture). It is reported once per section. A centred statement (empty space split across both sides) is not one-sided, so it is not reported.
  - `composition` → `repeated_full`. Two sections in a row that both name `full` are a fault, unless the structure's `home` plans both of those sections (by id) as `full`. Read from the stored page, so it is reported at the first width only. The host hands the check the structure's `home` when it checks the home page.
  Both kinds count as craft in the builder evaluation (`CRAFT_KINDS`).
- **Critic rubric:** the Style lens names a page whose sections all share one composition (the same picture-then-text shape down the page) as a finding.
- **Builders are told:** the l1 surface's `get_design` description and the builder priming name `composition` beside `role`/`space`/`width`/`component`/`aspect`.
- **"BUG-268 scrim rules"** in the Fix above refers to REQ-440's over-image rule (BUG-268 is an idle-stop bug). The overlay is built to that rule.


### Added while building (also REQ-463)

- **A split's text is centred down its picture, and REQ-449/457's `rows` check treats that as deliberate.** In a `split`, the text column is centred vertically against the picture beside it. A short paragraph beside a 3:2 photo then reads as a composition, not a ragged row. The `rows` check does not report `row_tops` or `row_heights` for a two-item row whose text ink is centred (within `topTolerancePx`) on a picture taller than the text. Top-aligned rows are judged as before.
- **The critic's informed review lists the text measure among the design's measures and names the site's compositions** (`- Compositions: split, overlay, …`), beside the type roles and components it already lists.
- **The seeded text measure follows the body per width.** Where `body` has one size, the measure is one number (Dina's 18px body gives 640px). Where the body changes with the screen, the measure is a per-width track at the starter widths, so it sets 65 characters at every width.
- **Generated wrappers carry no id.** A composition's text column is the section's lone group when there is one; otherwise it is a new container with no id. So a composed page never collides with an id the builder used (the resolved page is validated for unique ids).
- **The Dina 3 fixture** (`tests/fixtures/req463-dina3/`) is the dev store's First-Draft-Test Dina's Diner 3: site, home, header and footer, as stored on 2026-10-25.

## Test plan (as built)

`tests/test_UAT_FC_REQ-463_sections_use_the_desktop_width.test.ts` (node; the browser cases run in a real Chromium through `checkLayoutAt` and the real renderer):
- The new checks are registry entries with thresholds, and their kinds count as craft.
- A complete design needs `textWidth` and two or more compositions. `textWidth` is held to 45–75 body characters and no wider than `contentWidth`.
- The seeded design fills both and passes `l1DesignIssues`/`l1DesignMissing`, including a per-width measure for a growing body.
- A section naming a composition the design does not list, or text naming `width: "text"` on a design with no `textWidth`, is a dangling reference.
- Running text (body, lead, quote) takes `width: "text"` by default; headings, small print, links and the shared footer do not. Dina 3's 600px columns are off-system on the width axis.
- Dina 3 as stored, at 1280: `unused_width` on room, coffee, dino and whostops, not the hero; none at tablet or phone.
- Running text renders at 640px at 1280, and at its column's width on a phone.
- Split: side by side at 1280 and 900, alternating (room picture left, coffee right, dino left again after a statement), the picture stretching to taller text; stacked at 375.
- Statement centred at the measure; cards in rows of three; full picture across with the text centred under it; overlay picture behind the hero's words under a 0.55 scrim, the words white.
- Dina 3 composed: no `unused_width`, `row_heights`, `row_tops`, `repeated_shape`, `text_over_image` or `repeated_full`.
- Two `full` in a row: one `repeated_full` at desktop. None when the structure plans both. One when it plans only one.
- The critic's Style lens names one composition repeated, and the width check is among the faults "checked elsewhere".

`tests/test_UAT_FC_REQ-463_sections_use_the_desktop_width.workers.test.ts` (real routes in workerd):
- `set_decision` records `home` on `pages_navigation`, refuses an unknown composition, and refuses `home` on another decision.
- A `Delegate` scoped to `home.json` reaches its builder with the structure line after the goal; one scoped to `menu.json` does not.
- The home page's layout check is handed each section's planned composition.

Regression re-run: the REQ-447, 448, 449, 456, 457, 460, 462, BUG-268, 276, 281, 282, REQ-440, REQ-126, BUG-129 and BUG-233 suites, and then the whole node and workers suites, each failure baselined against the base code. The failures left are the same on base or flaky in isolation (BUG-276 "logo … is flush is held" fails on base).