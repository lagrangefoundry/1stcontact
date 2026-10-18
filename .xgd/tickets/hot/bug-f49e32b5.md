---
uid: bug-f49e32b5
id: BUG-226
type: bug
title: choose_look copies a look's drifted content onto the real page without checking
  it against the source page
created_by: xgd
created_at: '2026-10-18T19:22:53.080967+00:00'
updated_at: '2026-10-18T19:22:53.080967+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What happened
1. `make_alternatives` was called (by a builder worker) on page `home` to create three looks. The same worker then started restyling the look pages, ran out of context mid-run, and was aborted. Before stopping, it had altered **content** on the look pages, not just styling:
   - image `src` values in a team section were swapped to unrelated images;
   - several text elements were reworded, and one paragraph was truncated.
2. Later delegations restyled each look; their briefs said "do not change any words". Each worker inherited the already-drifted content as its baseline.
3. The client chose one look. `choose_look` copied it onto `home` faithfully, including the drifted content. The real page lost correct portraits and the client's exact wording, which had been verified on `home` before the looks were made.

## Expected
Looks are meant to differ in style, not content. At least one of:
- `choose_look` (or the "Choose this one" button) diffs the look's text and image `src`/`alt` against the page it was made from (or its "before" snapshot), and warns, or refuses without confirmation, when content differs;
- `make_alternatives` records each look's content baseline, and the host flags any later content change on a look page, the way it flags attention items;
- a delegation that leaves a look half-edited (aborted or exhausted) marks that look as incomplete in `list_pages`, so it is not offered for choosing.

## Reproduce
1. On a page with verified content, call `make_alternatives` to make two or more looks.
2. On one look, change an image `src` and a text element (as a worker that is cut off mid-run would).
3. Choose that look with `choose_look`.
4. The real page now carries the changed `src` and text, with no warning. Only the `<page>-before` copy still has the correct content.

## Impact
The client saw their team's portraits replaced by wrong images and their words changed immediately after choosing a look. Recovery needed two more delegations: restore the content from the before-copy, then restore the styling that the content restore had reverted.