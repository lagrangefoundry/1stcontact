---
uid: request-ee7c61dc
id: REQ-457
type: request
title: 'Laws of craft, part 2, and the visitor''s journey: checks for edge distance,
  text that fits its column, any image/text row that should match, repeated section
  shapes — and briefs that order for the visitor and state intent, not columns'
created_by: EPIC-19
created_at: '2026-10-25T00:53:12.538257+00:00'
updated_at: '2026-10-25T16:55:43.759529+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 8
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-51682ec2
  commits:
  - working_sha: a8aa79331400c7bbc21bf0a8af3037d9de7cf96e
    reconcile_sha: null
    main_sha: null
  - working_sha: b27fed29ddd53accc3ff66c4e36845efec79846a
    reconcile_sha: null
    main_sha: null
  - working_sha: 17989e8e1bc57d6de5540f0a5ed7979d759bcd53
    reconcile_sha: null
    main_sha: null
  version: 0.2.633
---

## Why

Follow-up to **REQ-449** and **REQ-446**. On First-Draft-Test Dina's Diner the copy
was much better, but the page still had layout and ordering faults that no check
measured. A **cold read** was run by hand, by an agent given only the screenshots
and the page text, as BUG-271 intends the critic's to be, because the critic never
ran (BUG-275). It found, worst first:

1. **No town or address until the bottom.** "Five minutes off the freeway"
   doesn't say which town. "Davis" first appears in the Dino box, and the address
   in the last section.
2. **Text and buttons touch the screen edge** at 900 and 375 (REQ-456: no gutter).
3. **Prices are buried below the Hal story and the coffee essay**, about 2.5
   screens on a phone, in a cramped three-column table.
4. **"The Dino Dinner at Dina's Diner in Davis"** reads like a second brand. The
   Dino burgers are also missing from the price list.
5. **Uneven type and layout:**
   - the coffee paragraph is larger than every other paragraph;
   - the hero photo ends 134px above its panel at desktop (382px at tablet);
   - the headline runs to five lines at tablet;
   - the Call button splits "(530) / 555-0163".

The operator, independently: the hero's side-by-side "seems odd, particularly with
the next section having the same shape", and leading with Hal's counter isn't
"the first thing a hungry potential customer cares about".

The consultant's brief prescribed "two columns" in five of seven sections, and
put the Hal story second.

## What changes

### 1. New laws-of-craft checks (REQ-429 framework, thresholds in `layout-check.json`)

- **Edge distance:** text, buttons and the logo sit at least the design's gutter
  (and never less than a minimum) from the screen edge at every width, unless they
  are deliberately full-bleed media.
- **Text fits its column:** a heading takes no more than a set number of lines
  for its role at each width, body lines stay within a readable length (roughly
  45–80 characters), and a button's label does not wrap. This catches the
  five-line h1 at tablet and "(530) / 555-0163".
- **Rows that should match**, for any image beside text, not only a boxed panel:
  the image and the text block line up at the top and, unless one is
  deliberately smaller, at the bottom too (within a threshold). REQ-449's row check
  only triggers on a drawn box.
- **Repeated shapes:** two consecutive sections with the same composition (for
  example photo-left/text-right twice) are reported.
- **Off-system text sizes** are reported (REQ-456), so one paragraph can't
  outsize the rest.

All hold the hand-back like the other layout faults.

### 2. The consultant briefs the visitor's journey, not the columns

Priming and `Delegate` description, within the budget:
- **Visitor first:** the first screen answers what the visitor is deciding,
  using the positioning card's "they're deciding…" lines: what it is and what's
  good, **where it is (town, how far)**, when it's open, and how to get there or
  call. Prices and menu come before story. The story is proof and character,
  placed after the visitor has what they came for.
- **Brief the intent, not the layout:** each section's brief says what it must
  achieve and what it holds (and the finished copy, REQ-446). The composition
  (columns, sides, image size) is left to the builder within the design system,
  except where the client asked for something specific. A brief does not
  prescribe the same composition for several sections in a row.
- **Name things clearly:** a playful line (a tongue-twister, a dish name that
  matches a street) is not set like a brand or a heading. Every menu item the page
  promotes appears in the price list.

## Test plan

`tests/test_UAT_FC_REQ-457_craft_and_journey.*`, real Chromium fixtures:

- **Edge distance:** a section flush at 375 is reported, one inside the gutter is
  not, and full-bleed media is exempt.
- **Text fits:** an h1 wrapping to five lines at 900 is reported, as is a button
  label that wraps.
- **Rows that should match:** an unboxed image beside taller text is reported, a
  matched row is not.
- **Repeated shapes:** two consecutive image-left/text-right sections are
  reported.
- Each new finding holds the hand-back.
- The consultant priming and `Delegate` description carry the visitor-first and
  intent-not-layout rules.
- Re-run the REQ-429, REQ-449, REQ-446 and BUG-271 UATs.

-

## Implementation (as landed)

### Checks (`layout-check.ts`, thresholds in `layout-check.json`)

Four new registry entries plus an extension of REQ-449's `rows`. Every finding of
these kinds holds the hand-back through the host's existing rule (any finding that
is not `check_failed` is owed), and all are counted as craft (`CRAFT_KINDS`) by
the builder replay (REQ-454).

- **`edge` → `edge_distance`.** Text or a button nearer the screen's edge than
  `max(edge.minPx = 16, the design's gutter)`. Pictures are not measured, so
  full-bleed media is exempt. The logo's distance from the edge is reported by
  BUG-276's brand check (`flush_logo`), which landed while this was in progress,
  so `edge` leaves the logo to it rather than reporting one logo twice. Text a box scrolls
  sideways, content off-screen (a closed drawer) and content past the edge (the
  `sideways` check's) are not reported. One finding per section per width, naming
  the nearest offender and how many more are too close.
- **`fits` → `heading_lines`, `line_length`, `button_wraps`.** A heading over more
  than `headingLines` lines for its level (h1 3 at desktop / 4 from phone up to
  tablet; h2 and h3 2 / 3; h4+ as h3). Body text (≤ `maxBodyPx` 24, not in a
  heading, nav, table, button, link or label) over ≥ 3 lines whose full lines
  average more than 85 or fewer than 40 characters (28 at phone and tablet), the
  worst long and worst short per section. A button whose label wraps.
- **`rows`, extended.** A picture beside text with **no box round it** is now
  judged too: the text's last line and the picture's bottom end within the same
  allowance as a panel, unless the shorter is under `deliberateShare` (0.6) of the
  taller (an icon by a paragraph, a caption by a photo), which is deliberate.
  Boxed panels are judged as before.
- **`shape` → `repeated_shape`.** Two sections in a row whose first row of a picture
  and text side by side (≤ 3 items, each ≥ 160px wide, spanning ≥ 60% of the
  section) has its parts in the same order (picture left / text right twice). Only
  picture-beside-text compositions count. On a phone the halves fall under the
  item width, so a stacked page is not reported.
- **`type_scale` → `off_scale_text`.** On a design whose type roles set a body
  size: text more than 0.5px from every role's size at that width. The host now
  hands the page each role's size at each width (`typeSizes`, a per-width track
  evaluated as the renderer's interpolated media rules do).

### The consultant briefs the visitor's journey (priming, within the budget)

- **Copy rules (both priming lists):** "Order for the visitor" now says the first
  screen answers what the visitor is deciding (what it is and what's good, where:
  town and how far, when it's open, how to get there or call), and prices and menu
  come before the story. A new "Name things plainly" rule: a playful line is not
  set like a brand or a heading, and every item promoted is in the price list. The
  positioning paragraph's line on the story now reads "the story is proof and
  character, after what they came for".
- **Briefs (`delegation-method`):** "Brief each section's intent, not its layout:
  what it must achieve and what it holds. Its composition is the builder's, within
  the design."
- **`Delegate` description:** the tool's own description is upstream and generic,
  but this host extends the goal parameter's description (as BUG-276 does for the
  logo). It now adds `GOAL_INTENT_NOTE`: "For each section, say what it must
  achieve and what it holds; leave its composition (columns, sides, picture size)
  to the builder within the design unless your client asked for one, and never brief
  the same composition for several sections in a row." Parameter text is outside
  the priming budget, so the full rule lives there and the priming carries the short
  form.
- **Budget:** consultant priming measures 99,961 of the 100,000 cap (BUG-129) beside
  BUG-276's additions. To pay for it, two unpinned clauses were trimmed: "it is not
  the line that has to sell them" and "it is not a reason to keep the work".

### Test plan (as written)

- `tests/test_UAT_FC_REQ-457_craft_and_journey.test.ts`, real Chromium through
  `checkLayoutAt`: registry and config entries, and the craft kinds; a section flush
  at 375 is reported while an inset one and a full-bleed picture are not; a 64px h1
  over 5+ lines at 900 and a wrapping "Call (530) 555-0163" button are reported,
  while a short h1 and a nowrap button are not; an unboxed image ending above taller
  text is reported, while a picture filling its side of the row is not; two
  picture-left sections in a row are reported (not at phone), while alternating
  sides are not; a 22px paragraph on an 18px-body design is reported, and nothing
  is reported without a design.
- `tests/test_UAT_FC_REQ-457_craft_and_journey.workers.test.ts`, the real route in
  workerd: each new kind (and the unboxed `row_heights`) holds the hand-back
  ("THIS BUILD IS NOT DONE", the reply held), and the page is handed the design's
  `typeSizes`; the consultant priming and `delegation-method` carry the
  visitor-first, name-things-plainly and intent-not-layout rules, and the
  `Delegate` tool the consultant is sent carries `GOAL_INTENT_NOTE` in its goal.
- Regression run: REQ-429, REQ-449 (both suites), REQ-446, BUG-271, BUG-129,
  BUG-233, REQ-342, REQ-415 (both), BUG-256 (both), BUG-235, REQ-454, BUG-276
  (both), REQ-448, plus the other
  layout-check suites, all pass. REQ-408's
  `weakest_point_falls_due_after_the_first_draft_and_when_publish_opens` fails
  identically on clean xgd-working, so it predates this change.
- **The browser fixtures could not run in the agent sandbox, where Chromium cannot
  launch, and were skipped.** The in-page script was exercised offline (jsdom with
  faked boxes: every new check ran without throwing). Run the `.test.ts` file
  outside the sandbox to confirm the fixtures.