---
uid: comment-08144f06
id: COMMENT-998
type: comment
title: Comment on acceptance_criterion AC-1138
created_by: xgd
created_at: '2026-08-13T02:00:39.250690+00:00'
updated_at: '2026-08-13T02:00:39.250690+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-2d587432
  kind: note
---

## AC-1138 text is now stale — capitalisation DOES reach the words

Raised from the `fix_review_free_coded` loop for `request-1ff09fab`. That loop
is forbidden from mutating stories/capabilities/ACs, so this is recorded here
rather than applied; it needs the reconciliation review fix loop (or the
operator) to carry it into the criterion body.

**What changed in the code.** `apps/control-app/src/builder/builder.css` now
re-declares the inheritance the UA reset broke:

```css
.builder-modal__box .fields-control {
  text-transform: inherit;
  letter-spacing: inherit;
}
```

Verified in Chromium by this criterion's own UAT
(`tests/reconciliation-copy-edit-live-preview.test.ts`): choosing `uppercase`
now draws the WORDS uppercase, and choosing `none` clears them back. Removing
the rule fails the assertion (`expected 'none' to be 'uppercase'`), so the
evidence is load-bearing rather than incidental.

**What the body must become.**

1. "The parameters that reach the words are **how big, how heavy, and italic or
   not**" → all four, including **capitalisation**, each by its own gesture.
2. Delete the whole "**Capitalisation is written but does not arrive, and that
   is a recorded divergence…**" paragraph. The mechanism it describes (the
   form control takes the box's typography by inheriting the font shorthand,
   which does not carry capitalisation, and the UA resets it) is still *why*
   the CSS rule has to exist and is worth keeping as one sentence — the
   "recorded divergence from what was asked for" framing is what goes.
3. Verification section: the "assert the divergence as a pair" paragraph
   becomes "choose a capitalisation, assert the property is set on the box AND
   that the words are drawn that way; choose no capitalisation and assert the
   words come back" — the same two-sided treatment italic already gets.

The final clause of the Criterion ("it is only the *preview* of it that does
not arrive") also goes.
