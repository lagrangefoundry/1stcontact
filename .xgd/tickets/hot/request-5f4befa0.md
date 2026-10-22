---
uid: request-5f4befa0
id: REQ-429
type: request
title: 'Layout check: a framework of named checks, a tablet width, and checks for
  heading ink spacing, stranded words, cramped menus, table alignment and things too
  close'
created_by: EPIC-19
created_at: '2026-10-22T21:05:38.681370+00:00'
updated_at: '2026-10-22T21:33:22.328993+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-38bf347f
---

## Symptom (Ariel's Arc Welding, 2026-10-21; Bob's salon 2, 2026-10-20)

The operator had to point out obvious layout bugs the layout check (REQ-415,
BUG-238, REQ-422) passed:
- the hero "Beauty and Strength" / "Quality custom metalwork" / paragraph /
  button are all 24px apart as boxes, but the 96px Cinzel heading's empty
  line space makes the gap under it look far bigger: no hierarchy;
- "and" stranded alone on a line in the wrapped display heading;
- at ~900px (the builder's preview pane) the menu labels "BUILDING WORK" and
  "EVERYTHING ELSE" wrap onto two lines, crammed between the logo and "ART";
- on a phone the menu links are 13px and the stacked menu fills about half
  the first screen;
- Bob's colour price list: a table whose alignment was all over the place;
- things too close or on top of each other: a menu right up against the
  call button, a form drawn over text.

> I hope that the checks are a generic framework with specific and growing
> checks. (operator)

## What changes

### The mechanism: a framework of named checks

1. The in-page layout check becomes a **runner plus a registry of named
   checks**. The runner finds the page's sections (as today: the L1 root's
   children, plus the site's shared header and footer), provides shared
   helpers (what is shown, text boxes, ink boxes, quoting, font sizes), and
   runs every registered check. Each check is one entry: an id, the finding
   kinds it reports, and its in-page body. Adding a check is adding an entry.
2. **Each check's thresholds** live in `layout-check.json` under that check's
   own key — configuration, not constants in code.
3. **One check failing doesn't stop the others**: an error in one check is
   recorded against its id in the result, and the remaining checks still run.
4. **Widths are configuration**: desktop (1280), **tablet (900)** and phone
   (375). Every check runs at every width. Findings name the width as
   `tablet (900px)`. Thresholds given per width name apply from that width
   up; a width with no entry uses the nearest smaller one.

Behaviour of the existing checks (sideways, overlap, clipped, collapsed,
empty, edges, misaligned_rows, split_rows, small_logo, small_name,
no_header, name_smaller_than_headings) is unchanged apart from items below
that widen them, and they also run at the tablet width.

### The checks added or widened

5. **Heading spacing measured on the ink** (`loose_heading`). Space above and
   below a heading is measured between the glyphs (the text's own ink, using
   the font's real ascent and descent for the characters drawn), not between
   boxes, so a large display font's empty line space counts.
6. **A heading must sit closer to its text than paragraphs sit to each other**
   (`loose_heading`): also reported when the ink space below a heading is not
   clearly smaller (`belowOverParagraph`) than the ink space between the text
   it introduces and the next text block under it, in the same column.
7. **A stranded word** (`stranded_word`): a line of large text (at least
   `minFontPx`, default 28px) holding a single short word (at most
   `maxLetters`, default 4) while the text runs over two or more lines.
8. **A menu label that wraps** (`nav_wraps`): a navigation link (in a `<nav>`,
   or in the page's header section) of at most four words whose text runs
   over more than one line.
9. **Menu links too small on a phone** (`small_nav`): at widths up to 480px,
   a shown navigation link set below `minFontPx` (default 14px).
10. **A menu taking over the first screen** (`tall_menu`): at widths up to
    480px, shown navigation links spanning more than `maxScreenShare`
    (default a third) of the screen's height.
11. **Table alignment** (`misaligned_rows`, `ragged_column`), for anything
    built as a table: a `<table>`, a CSS grid of short text cells (two or more
    columns, three or more rows), and side-by-side column lists (as today):
    - rows must line up: the cells of one row share a baseline (within 4px);
    - columns must be aligned: the cells of one column share a left edge, a
      right edge or a centre (within 4px).
    The numeric-column rule remains only for reporting a column list that
    happens to line up (`split_rows`).
12. **Things on top of each other or too close** (`overlap`, `crowded`):
    - a control (button, link styled as a button, form field, select) or an
      image drawn over text or over another control — not only text over
      text;
    - two controls, or a control and the header's logo or business name,
      closer than `minGapPx` (default 8px), e.g. a menu link up against the
      call button. Links inside running text are not controls for this.

Every finding stays one plain line naming page, width and section, and, as
today, a page with findings is not done.

## Scope

Host checks only (in-page script + its configuration); same reporting path
as REQ-415. Not the critic (REQ-427). Supersedes BUG-251, which was filed as a
bug by mistake and abandoned unimplemented.

## Test plan

UATs in `tests/test_UAT_FC_<this ticket>_*.test.ts`, real Chromium over served
fixture pages through `checkLayoutAt`:
- a registry check that throws is reported against its id and the other
  findings still arrive; the result carries findings for desktop, tablet and phone;
- the Ariel hero (96px display heading, all boxes 24px apart) gives
  `loose_heading`; the same hero with the heading tight to its subtitle doesn't;
- a wrapped display heading with "and" alone on a line gives `stranded_word`;
- a header whose two-word menu labels wrap at 900px gives `nav_wraps` at
  tablet; 13px phone links give `small_nav`; a stacked phone menu over a
  third of the screen gives `tall_menu`;
- a `<table>` / grid price list with a cell nudged down gives
  `misaligned_rows`, with mixed cell alignment in one column gives
  `ragged_column`; a clean table gives neither;
- a menu link 3px from the call button gives `crowded`; a form field over a
  paragraph gives `overlap`; a well-spaced header gives neither.
Regression: the existing layout-check UATs (REQ-415, BUG-237, BUG-238,
REQ-418, REQ-420, REQ-422, BUG-235, host-looks).


## As implemented

`tools/generate/src/cli/ai/layout-check.ts` is now a runner (`layoutScript`)
plus a registry (`LAYOUT_CHECKS`). Each entry has an `id`, the `kinds` it may
report, and an in-page body `(H, C, add)`: `H` is the runner's shared helpers
and sections, `C` is that check's thresholds at this width. A check that
reports a kind it doesn't declare counts as an error. `LAYOUT_SCRIPT` is
`layoutScript()`, and `checkLayoutAt` takes an optional `checks` list.

- **Check ids = config keys.** `collapsed` (collapsed, empty), `sideways`,
  `overlap`, `clipped`, `business` (no_header, name_smaller_than_headings),
  `brand` (small_logo, small_name), `heading` (loose_heading),
  `stranded_word`, `nav_wraps`, `small_nav`, `tall_menu`, `table`
  (misaligned_rows, split_rows, ragged_column), `crowded`, `edges`. The
  existing `brand`/`heading` keys in `layout-check.json` stay where they were.
- **Widths** come from `layout-check.json` `widths`: desktop 1280×900, tablet
  900×900, phone 375×667. A threshold given per width name becomes
  `{ '@width': {px: v} }` and is resolved in the page: the entry for the
  largest width ≤ the screen, otherwise the smallest. So tablet uses phone's
  `logoMinPx`.
- **A check that throws** is caught by the runner and comes back in
  `errors: [{check, message}]`. `checkLayoutAt` turns each into a
  `check_failed` finding for the page: "could not be checked for <id>, a fault
  in the check rather than the page (<message>)". The host lists it, but it
  does not make the page "not done" (it isn't added to `owed`). The host
  report now says "at any width", and names the widths as a list ("desktop
  (1280px), tablet (900px), and phone (375px)").
- **Ink** is measured per word: Range rect plus canvas `measureText` (actual
  and font bounding-box ascent/descent, with `text-transform` applied).
  Pictures, controls and filled boxes use their box.
- **loose_heading**: both rules use ink gaps. Rule 6 applies only when the
  thing under the heading is text and the next block in the same section is
  non-heading text at least `minParagraphGapPx` (16) away; this keeps list
  lines from counting as paragraphs. `belowOverParagraph` is **0.9**, not
  0.8: REQ-420's rhythm gives a heading 21px of ink below it against 25px
  between paragraphs (0.84), and REQ-420 pins that layout as correct.
- **stranded_word**: counts only lines of the element's own block (`wordBoxes(el, own)`).
- **Menu links**: `a[href]` in a `<nav>` or in the page's header section,
  not inside running text (a link whose inline ancestors hold letters or
  digits outside it).
- **table**: `<table>` (header-only rows dropped; only rows with the most
  common cell count; skipped when its cells are stacked rather than side by
  side, as REQ-418's phone stack does), CSS grids (≥2 px tracks, ≥3 rows,
  short leaf cells, no spans), and column lists (detected as before, numbers
  only). Rows are compared by the first baseline of each cell; columns pass
  if their cells' text shares a left edge, right edge or centre within
  `tolerancePx`. The empty-cell column list still gives `misaligned_rows`.
- **overlap**: an image or a button-like control (button, field, select,
  textarea, a link with a fill or border) over text is reported only if
  `elementFromPoint` (scrolled into view) shows it on top, so text laid over a
  picture is fine. Button-like controls and images that overlap each other
  are reported regardless (image over image is not).
- **crowded**: pairs of controls (button-like ones plus menu links outside
  running text; checkboxes and radios excluded), or a control and the
  header's logo or business name. Plain links are measured by their text, not
  their padding. Pairs that sit side by side are measured on the horizontal
  gap. Pairs stacked one above the other are measured on the vertical gap
  only when they aren't both plain links (a list of links is spaced by its
  line height).

Checked on real rendered pages in `storage/dist` (hearing-zone, joyful,
gigabytealchemy, bluelotus, xgd). Padded menu links, a heading followed by a
map, and a non-numeric "You own / XGD owns" column list came up as noise and
were fixed as above. What remains is true: an absolutely positioned image
(z-index 2) covering the end of a paragraph, stranded words, and headings
spaced like their paragraphs.

### Existing UATs touched (consequences of this ticket)

- BUG-238 small logo and REQ-422 header/no-header expect a `tablet` entry too.
- REQ-420 floating heading: the pinned "24px … 24px" box numbers become
  `\d+px` (spaces are now measured on ink, item 5).
- REQ-418 narrow modes: its no-findings assertion now covers desktop and
  phone. At 900px a `stack` table doesn't stack (`TABLE_STACK_BELOW_PX` =
  600), and the fixture's unbreakable cells really do overflow. That is a
  framework gap for a separate ticket, not something this check hides.
- BUG-235: "No layout faults at any width."

### Test plan (as built)

`tests/test_UAT_FC_REQ-429_layout_check_framework.test.ts`: real Chromium over
HTML fixtures served over HTTP, through `checkLayoutAt`. 14 UATs:
- a throwing check gives `check_failed` at all three widths while `empty`
  still arrives;
- widths and per-check config keys come from configuration;
- the Ariel hero is loose; the tight hero is not;
- stranded "and"; small text is not checked;
- `nav_wraps` at tablet, not at desktop;
- `small_nav` at phone only, and not at 16px;
- `tall_menu` with 6 stacked links;
- `misaligned_rows` for a table and for a grid;
- `ragged_column`; a clean table gives neither;
- `crowded` at 3px; a 32px gap is not crowded at desktop;
- a form field over a paragraph gives `overlap`;
- a well-spaced header and text over a picture give neither.

Regression run: REQ-415, BUG-237, BUG-238, REQ-418, REQ-420, REQ-422 (both),
BUG-235 and host-looks (workers project): all pass.