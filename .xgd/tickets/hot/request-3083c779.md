---
uid: request-3083c779
id: REQ-415
type: request
title: 'Visual checks: the host looks after every build, and the final stages need
  every changed page looked at on desktop and phone'
created_by: EPIC-19
created_at: '2026-10-20T13:28:28.517314+00:00'
updated_at: '2026-10-20T13:28:28.517314+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## Symptom (Bob's salon 2, 2026-10-20)

The operator opened the Prices page just before publishing: the colour price
table was misaligned (every treatment name had slid up a row beside the wrong
prices) and the sections had ragged, inconsistent edges. The consultant had
signed the page off. Asked why, it gave five causes (transcript, 03:45 UTC):

1. It checked the page's **words** against the menu and called that checking the
   page. The table was right in the data and wrong on screen: it was built as
   columns, and an empty first cell in the name column took no height.
2. Its tools price screenshots as "the most expensive thing I can do", so it
   treated that as permission not to look.
3. It looked only where the client was looking (home); the prices page got no look.
4. It reused a word check from several turns earlier as a sign-off.
5. It took the page map's zero warnings as a visual review.

## The cost model this ticket rests on (operator, 2026-10-19)

> processing is cheap, networking (downloads) are cheap, TOKENS ARE COSTLY.
> So screenshots are super cheap - having the principal look at them is costly
> but clearly necessary … the principal MUST check the work - PARTICULARLY in
> the final stages.

So: spend host processing freely to make the consultant's looking targeted, and
never discourage the consultant from looking at delegated work.

## What changes

1. **Correct the screenshot pricing prose.** REQ-284's wording in
   `fidelity-surface.json` ("Looking is the most expensive thing you do, and you
   pay for it again on every turn…") is untrue since REQ-168 (images age out
   after two turns) and steers the consultant away from checking builds. Replace
   it with: looking costs context and ages out after two turns; looking at what a
   builder made is part of the build, not a luxury. Keep "use `list_changes` for
   *what landed?*" — that ranking is still right. Update the REQ-284 UATs that pin
   the old wording, and the comps section's "take screenshots sparingly" where it
   reads as general advice.
2. **After every builder session that writes a page, the host looks first.** It
   renders each changed page at the client's viewing width (REQ-388; desktop if
   unknown) and attaches the screenshot to the `Delegate` result, plus a short
   text **layout report** (item 3). The consultant receives the picture without
   having to decide to ask for it. Low-detail JPEG per BUG-229.
3. **A mechanical layout check**, run in the same render, at desktop and phone
   widths, reported as plain lines naming the section:
   - content wider than the viewport / the page scrolls sideways;
   - overlapping boxes, or text clipped by its container;
   - an empty or collapsed section;
   - sibling sections on one page with different left/right edges;
   - a table built from columns where an empty cell breaks row alignment (cells in
     the same row index not vertically aligned);
   - row content split across separate columns.
   The same findings appear in the page map's warnings (`describe_page`).
   A builder's result with layout findings on a page it wrote is **not done**:
   the consultant fixes it in the same turn (REQ-409's continuation applies).
4. **The host records what the consultant has looked at.** For each page, the
   draft revision and widths at which the consultant last took a screenshot of
   it. A look is stale once the page changes.
5. **"Finishing touches" and "Ready to publish" can't be marked done** while any
   page has changed since it was last looked at on both desktop and phone. The
   refusal names the pages and widths. The per-turn plan notice lists pages
   "not looked at since they changed" once the build is in those stages.
6. **Price tables are built as rows.** Builder guidance: a list of items with
   prices is one row per item (name and its prices in the same row), never
   parallel columns. Preferably the page format gains a typed row-based table
   element; if that's a larger change, record it on EPIC-24/L1 and do the
   guidance now.

The consultant's priming already carries the matching rule ("Does it look
right?", committed `b174ff6e8e` without a ticket as a prompt change); this ticket
makes it enforced rather than remembered.

## Test plan

- A scripted builder that writes a page: the `Delegate` result carries a
  screenshot of that page and a layout report.
- Layout check fixtures: a page that scrolls sideways at phone width, a
  column-built price table with an empty first cell, and siblings with different
  edges each produce the named finding; a clean page produces none.
- After a screenshot of `prices` at desktop and phone, then a write to `prices`,
  `set_stage` to Ready to publish is refused naming `prices`; after a fresh look
  at both widths it succeeds.
- The fidelity surface prose no longer says looking is the most expensive thing;
  the REQ-284 UATs are updated to the new wording.
