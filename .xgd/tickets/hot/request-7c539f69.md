---
uid: request-7c539f69
id: REQ-655
type: request
title: 'Buttons: one-line labels, and button groups aligned in the direction they
  stack'
created_by: EPIC-19
created_at: '2026-11-05T15:44:43.744664+00:00'
updated_at: '2026-11-05T20:43:37.053129+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b3b54360
  commits:
  - working_sha: 12c7f7eecdf1b6d5c850f69c8624e5f14353ed76
    reconcile_sha: null
    main_sha: null
  - working_sha: a2040baaeb56e8a9463a0c45d53821a4d8b311ff
    reconcile_sha: null
    main_sha: null
  version: 0.2.785
  story_points: 13
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


## What changed (implementation as it stands, 2026-11-05)

- **One-line labels.** Every button run (a linked text run drawn as a box) renders `white-space: nowrap`, with its label centred in its box's height (`align-content: center`). A button stretched to its row's height keeps its words in the middle.
- **Button groups** (`packages/framework/src/l1/render.ts`, `buttonGroupDecls`). A container whose children are all button runs (2 or more) is a group when it is laid out as one mode at every width, is not sized or placed by the document, and is not spread `between`/`around`. This **replaces REQ-622's wrapping-row rule.**
  - **A row** switches whole between one row and a full stack, in CSS, with no breakpoint and no script. Each button's flex-basis is `(T - 100%) × 999`, where `T` is the row's estimated width. When the group has `T` or more, every button sits on the one line, stretched to the row's height. With less, every button takes a line of its own. No button is wider than the estimated widest button needs (`max-width`), which keeps BUG-293's "a button sizes to its label". So a stack shares both edges at the widest button's width. A **same-kind** set (painted identically: fill, border, text colour, type, padding) grows each button to that same width. A **mixed** set keeps each button's own width and shares only the height.
  - `T` is re-estimated wherever a button's font size or letter spacing changes across the ladder: the type's own widths and no others. Between two widths, the larger size of the two ends is used.
  - **A stack** of buttons is `fit-content` wide, and every button stretches to it.
  - A group whose layout mixes row and stack across widths is left as the document says. The check still applies.
- **The estimate** (`packages/framework/src/l1/button-group.ts`). Each character counts at the widest advance in its class (space; narrow, ordinary and wide lower case; narrow, ordinary and wide capitals; digits; narrow signs; wide signs), times the font size × 1.03, plus letter spacing, padding and border. `text-transform` is applied first.
  - The advances are a generated table (`packages/framework/src/l1/font-advance.ts`, written by the new `1c fonts advances`) covering all 1,931 families in `fonts/platform.json`, measured in Chromium at their regular and bold faces with the wider kept.
  - A family not in the table (a system font or a generic) uses the table's 90th percentile per class.
  - The first version (one average advance for lower case and one for capitals) failed the every-font test, so it was replaced by the class maxima.
- **Floor check** (`tools/generate/src/cli/ai/layout-check.ts`):
  - A new rule `button_rows` / kind **`button_heights`** reports buttons of one box, side by side in one row, whose heights differ by more than 2 px (`layout-check.json`).
  - **`button_wraps` is reworded** to say the width and the fix: `has the button "Handmade Originals" wrapping to 2 lines at 1280px: keep a button on one line; give its set equal widths or stack it, or shorten the label`.
  - `ragged_buttons` is unchanged (2 px).
  - Findings now carry `nodes`: the ids of the nodes they sit inside, nearest first. They come from the button rules and REQ-648's grid rules.
- **Advance `layout_kept`** (`tools/generate/src/cli/ai/layout-keep.ts`, `plan-core.ts`, `plan-surface.json`):
  - `set_decision` on `layout_kept` takes `rules` as well as `findings`. Each one is `<page> #<node id>: <rule>`, e.g. `home #collections: button_wraps`, recorded in the same decision with the client's words. Existing finding-keyed keeps work unchanged, with no migration.
  - A rule keep matches a finding on that page, of that kind, inside that node, at every width, and nothing else.
  - The rules a keep may name are the taste rules: `button_wraps`, `button_heights`, `ragged_buttons`, `grid_columns`, `grid_uneven`, `grid_giant_photo`, `product_uneven`, `product_wide_photo`. Anything else is refused with `PLAN_INVALID`.
  - Only the consultant's plan surface records it.
- **Guidance:** both builder primings now say "Buttons side by side are one height, a set of one kind one width, and a label is never two lines: a container of only buttons does this itself, stacking whole where they cannot fit; a layout of your own must do the same."

## Superseded and updated tests

- `test_UAT_FC_REQ-622_stacked_buttons_share_both_edges`: on one line the two identically painted hero buttons now have **equal widths** (superseding "each keeps its own width").
- `test_UAT_FC_REQ-457_craft_and_journey` asserts the new `button_wraps` wording.

## Test plan (as built)

`tests/test_UAT_FC_REQ-655_button_groups.test.ts` (Chromium, `renderL1Page` + `checkLayoutAt`):
- `same_kind_row_is_one_line_one_height_one_width`: three same-kind buttons, labels of very different lengths, at 1280 px: one line each, equal tops, heights and widths. No button finding at any width.
- `row_that_cannot_fit_stacks_whole_at_equal_widths`: the same group at 375 px stacks whole, one line each, both edges shared. No button finding.
- `mixed_kinds_share_a_height_not_a_width`: a primary and a secondary button with different padding and type: equal heights, widths differ. No button finding.
- `hand_built_wrapped_label_fails_the_check`: `button_wraps` with the new wording, plus `button_heights`.
- `hand_built_ragged_stack_fails_the_check`: `ragged_buttons`.
- `kept_rule_skips_only_that_rule_for_that_group`: through the consultant's real toolbox, a non-keepable rule is refused, and `home #collections: button_wraps` is recorded before any check has run. The wrap is skipped at every width, `button_heights` is still reported, and a keep for another page or node keeps nothing.
- `builder_priming_states_the_button_rule`.
- `estimate_is_never_narrower_than_the_drawn_label`: runs when `fonts/mirror` is staged. For every offered family, 12 real labels as set and in capitals, regular and bold, are never estimated narrower than Chromium draws them.

Regression: suites that render L1, run the layout check or touch the plan or priming (about 340 files) were compared against the base. The failures that remain also fail on the base (e.g. REQ-418, REQ-452, REQ-472, REQ-219 workers, AC1084).