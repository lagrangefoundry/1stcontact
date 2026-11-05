---
uid: request-7c539f69
id: REQ-655
type: request
title: 'Buttons: one-line labels, and button groups aligned in the direction they
  stack'
created_by: EPIC-19
created_at: '2026-11-05T15:44:43.744664+00:00'
updated_at: '2026-11-05T16:09:48.827123+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b3b54360
---

## Why

Small alignment faults are what make a generated site look unprofessional. Seen on dev, 2026-11-05: a shop home page has three collection buttons in a row on desktop. Two labels sit on one line and the first wraps to two, so the buttons are different heights and the row looks broken, though the rest of the page is good. Nothing in the design system or the host's checks prevents or catches this.

## The rule (operator decision, 2026-11-05)

**What matters is alignment across the direction the buttons stack:**
- **Buttons in a horizontal row have equal heights.** The row lines up top and bottom.
- **Buttons stacked vertically have equal widths.** The stack lines up left and right.
- **A button's label is always one line.** A label never wraps inside a button. When a group can't fit side by side at a width, it stacks (and then takes equal widths) rather than wrapping text.
- **Equal widths in a row:** preferred for a set of the same kind (e.g. three collection buttons, all `button.secondary`), so the set reads as one unit. Not required between different kinds: a primary "Shop" beside a secondary "Learn more" may differ in width, as long as the heights match.

## What

1. **The design system makes this the default.**
   - The button components (`button.primary`, `button.secondary` and any later ones) render their label on one line.
   - A group of sibling buttons laid out together aligns as above: equal heights in a row, equal widths in a stack, and equal widths for a same-kind set in a row, sized to the widest label.
   - A group that doesn't fit side by side stacks.

   The consultant and builder get this without asking. It's done with typed layout primitives, not freeform CSS (security policy).
2. **A host floor check,** run with the existing layout checks at phone, tablet and desktop widths, on every page:
   - every button's label renders on one line;
   - sibling buttons in a horizontal row have equal rendered heights (within 2 px);
   - sibling buttons in a vertical stack have equal rendered widths (within 2 px).

   A failure is reported like the other floor tests, with a line the builder can act on, e.g. "home › collections: 'Handmade Originals' wraps to 2 lines at 1280 px; give the set equal widths or stack it".
3. **Guidance:** one line in the builder's notes stating the rule, for custom layouts the defaults don't cover.

## Test plan

`test_UAT_FC_<ID>_*` (render plus the floor check in Chromium):
- Three same-kind buttons with labels of very different lengths in a row at 1280 px: one line each, equal heights, equal widths. The check passes.
- The same group at a phone width where it can't fit side by side: it stacks, labels stay one line, widths are equal. The check passes.
- A primary and a secondary button side by side with different label lengths: equal heights, widths may differ. The check passes.
- A hand-built row where one label wraps: the check fails with the wrap reason.
- A hand-built vertical stack with unequal widths: the check fails with the width reason.


## Deliberate overrides (operator, 2026-11-05)

These rules are **defaults and a check, not a ban.** The consultant can override them where breaking them is a deliberate design choice, e.g. a two-line button label set as a typographic statement, or a staggered row of buttons.

- **An override is explicit and specific:** it names the button group (or the single button) it applies to and gives a short reason, recorded in the site definition as a typed exemption on that node (structured data, no freeform CSS). It's also recorded as a decision, so the reason is visible later.
- **The check honours it:** an exempted group isn't reported for the rule it is exempted from, and is still checked for the others. For example, an exemption from equal heights still requires one-line labels unless that is exempted too.
- **Never silent:** the defaults still apply everywhere else, and a wrap or misalignment with no exemption is still reported. The builder can't add an exemption to make a failure go away. An exemption comes from the consultant's decision, not as a fix for a reported failure.
- **The same mechanism should serve the other layout floor checks** that judge taste rather than function (e.g. REQ-648's catalog-grid rules), so there is one way to say "this is on purpose". If those checks already have an exemption mechanism, use it rather than adding a second.

**Test plan addition:** a row whose first label is deliberately two lines, with an exemption and reason recorded on that group, passes the check for wrapping but is still checked for equal heights. The same row without the exemption fails.


## Answers to the session's questions (operator, via EPIC-19, 2026-11-05)

**Scope correction accepted:** the floor check already has `button_wraps` (REQ-457) and `ragged_buttons` (REQ-622). Part 2 is therefore:
- add the **equal heights in a row** rule;
- word failures like the example above;
- keep the existing rules.

**Overrides: extend `layout_kept` (BUG-313); don't replace it, and don't add a node field.** This supersedes "a typed exemption on that node" in "Deliberate overrides" above. That wording was the EPIC session's; the operator's requirement is only that a deliberate choice can override the rules.
- `layout_kept` can now be recorded **in advance**, as a design choice, not only after a check has reported a finding. It is keyed to **the element (node/group) and the named rule**, not to one finding's line at one width, and covers **every width**.
- It stays the one mechanism for every layout taste check, including REQ-648's grid rules. Only the consultant writes it, in the decision ledger with a reason, so "never silent" and "the builder can't add one" hold as today.
- The existing finding-keyed `layout_kept` records keep working unchanged. No migration.
- The check skips only the named rule for that element and still applies the others.
- Test plan: the "Deliberate overrides" test uses a `layout_kept` recorded before any check has run, naming the group and the wrap rule.

**Tolerance: 2 px, not 1 px,** for both equal heights in a row and equal widths in a stack, matching `ragged_buttons`. 1 px would report sub-pixel rounding no one can see.

**Assumptions agreed:**
1. **Row or stack is chosen per group** from an estimate of each label's width (character count in the button's own font, allowing for case and letter spacing). The whole group switches between one row and a full stack, never splitting two-and-one. No breakpoints and no script. The estimate errs wide, and the check is the safety net. Validate the estimate against every font the design system offers, in the test suite.
2. **"Same kind" means painted identically** (fill, border, text colour, type role, padding), since the renderer drops the component name.
3. **The REQ-622 test** that expects two identically styled hero buttons to differ in width is updated to this ticket's equal-width rule, noted here as superseding it.
