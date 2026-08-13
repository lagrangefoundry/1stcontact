---
uid: comment-9679cc1a
id: COMMENT-999
type: comment
title: Comment on story STORY-101
created_by: xgd
created_at: '2026-08-13T02:01:10.364686+00:00'
updated_at: '2026-08-13T02:01:10.364686+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: story-3bf94bd4
  kind: note
---

## Story text is now stale — capitalisation DOES reach the words

Raised from the `fix_review_free_coded` loop for `request-1ff09fab`. That loop
is forbidden from mutating stories/capabilities/ACs, so this is recorded rather
than applied; it needs the reconciliation review fix loop (or the operator) to
carry it into the story body. See the sibling note on AC-1138
(`acceptance_criterion-2d587432`) for the criterion's half of the same edit.

**What changed in the code.** `apps/control-app/src/builder/builder.css` now
re-declares the inheritance the UA reset broke, on the editing box only:

```css
.builder-modal__box .fields-control {
  text-transform: inherit;
  letter-spacing: inherit;
}
```

`letter-spacing` is the same root cause one line apart — the box has
mis-mirrored a headline set tight since it was first dressed — and it is fixed
in the same rule.

Verified in Chromium by AC-1138's own UAT: choosing `uppercase` now draws the
words uppercase and choosing `none` clears them back. Removing the rule fails
that assertion, so the evidence is load-bearing.

**What the body must become.**

1. **Narrative, ~lines 95-102.** "How big, how heavy and italic-or-not reach the
   box" → all four including capitalisation, and they reach **the words**, not
   the box. Delete "**Capitalisation is written like the others and does not
   arrive**…It is recorded as a divergence from what this was asked for rather
   than claimed as delivered — see Technical Context."

2. **Technical Context, ~lines 236-252** ("Capitalisation is written and does
   not arrive, and the mechanism is the font shorthand"). Keep the mechanism —
   it is precisely why the CSS rule exists — and reverse the conclusion. Roughly:
   the box is a wrapper and the words are drawn by the shared form component's
   control, which takes the box's typography by inheriting the font shorthand;
   that shorthand carries family, weight, style and size and carries neither
   capitalisation nor tracking, both of which the UA stylesheet resets on form
   controls besides. So the property landed on the box and the operator saw
   nothing. The control is told explicitly, in the one place the chrome dresses
   a control in the PAGE's typography rather than its own. The hole predates the
   live preview — the property has been written on the box since the box was
   first dressed from the page — which is why fixing it also silently corrects
   the tracking the box has been mis-mirroring all along.

   The "recorded rather than absorbed / the covering criterion claims three
   parameters rather than four / the covering test asserts that the words do not
   change" sentences all go: the criterion claims four and the test asserts the
   words DO change.

3. **~line 257, "Intent/code divergence, deliberate and recorded."** Unrelated —
   that bullet is about the *nothing to edit here* message, not capitalisation.
   Leave it alone.

Note that this bullet's own escape clause has now fired as designed: "the day
the words are drawn in something that carries it the evidence fails and says
so." It did, in this review.
