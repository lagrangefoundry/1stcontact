---
uid: request-fe808622
id: REQ-463
type: request
title: 'Desktop sections use half the screen: the design states a text measure and
  the site''s section compositions (split, overlay, statement, cards, full), the structure
  assigns one per section, and the layout check flags an unused half'
created_by: EPIC-19
created_at: '2026-10-25T22:07:37.672524+00:00'
updated_at: '2026-10-25T22:08:30.893641+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  parent_uid: epic-95bc3b15
  story_points: 5
  auto_merge_back: true
  needs_review: false
  priority: medium
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
