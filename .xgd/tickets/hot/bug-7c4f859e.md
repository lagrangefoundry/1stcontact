---
uid: bug-7c4f859e
id: BUG-251
type: bug
title: 'Layout check: a framework of named checks, a tablet width, and checks for
  heading ink spacing, stranded words, cramped menus, table alignment and things too
  close'
created_by: EPIC-19
created_at: '2026-10-22T21:02:02.410612+00:00'
updated_at: '2026-10-22T21:02:09.722230+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  severity: high
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
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

## Why free-coded

Host checks only (in-page script + its configuration); same reporting path
as REQ-415. Not the critic (REQ-427).

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