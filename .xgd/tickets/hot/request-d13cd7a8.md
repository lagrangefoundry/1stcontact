---
uid: request-d13cd7a8
id: REQ-619
type: request
title: 'Input questions: one list with answered ones ticked in place, several files
  on every upload, long answer box sized properly'
created_by: EPIC-19
created_at: '2026-10-31T19:08:44.603238+00:00'
updated_at: '2026-11-04T19:03:11.745617+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-39bcdf6b
  commits:
  - working_sha: 8ce8a5b262d91a5549f3ac62aa5eebbc3929498c
    reconcile_sha: null
    main_sha: null
  - working_sha: cc5282044a2a00b8c9c162169ac116e48595d0e4
    reconcile_sha: null
    main_sha: null
  version: 0.2.719
  story_points: 5
---

## Why

Operator, doing a full site build on production (2026-10-31), hit three problems with the questions on the builder's Input tab (the plan panel, `apps/control-app/src/builder/plan-panel.js`):

1. An upload question only let them pick one document.
2. "Open questions" and "What you've told us" are confusing: answering a question makes it seem to disappear, because it moves to the second section further down the page.
3. The text box on the last question rendered about a third of a character high.

## What

### 1. Every upload question takes several files

- Every ask that takes uploads (`input: upload`, or `accepts_upload` on a typed ask) lets the client pick several files at once, whatever its `upload_role`. Today `takesSeveral` (`plan-core.ts`) defaults `multiple` to true only for `upload_role: site`, and the consultant rarely sets it, so background documents (business card, price list, licence) took one file.
- The `multiple` property is removed from the ask schema (`plan-surface.json`) and from `plan-core.ts` rather than defaulted differently: one behaviour, no setting for the consultant to judge. A stored ask that still carries `multiple` is read without complaint and ignored.
- Several files remain one answer, as today ([[BUG-196]] / REQ-364 upload path): every file is uploaded, then the ask is answered once. The upload control's label is the several-files wording (`PLAN_UPLOAD_SEVERAL`) on every upload ask.
- Asks already posted get several files too: it is decided when the ask is drawn, not stored per ask.

### 2. One list of questions, answered ones ticked and folded in place

Replaces REQ-401's two sections ("Open questions" / "What you've told us").

- The panel has one section, headed **Questions**, holding every ask that is open, answered or skipped, in the plan's order (the order `panelView` already gives: `needed_by`, then blocking, then the order the asks were posted). Status plays no part in it, so an ask never moves when its status changes.
- When an ask is answered its status box shows the tick (the existing `done` state) and the item folds to its one line, at that moment, once — the existing REQ-401 fold rule. Skipped asks likewise stay in place with the skipped mark.
- Clicking an answered or skipped item's line unfolds it to show the answer and the means to change it, as the done block does today; the client's fold/unfold choice is still kept per item in this browser.
- Beside the heading, a count of progress: "N of M answered" (answered and skipped both count as dealt with; withdrawn asks are not drawn and not counted). The [[BUG-245]] "N new" badge and new-item highlight stay, beside the same heading.
- The empty state ([[REQ-417]]) and the "question coming" ghost ([[REQ-467]]) are unchanged. The redraw rule (never take a field from under the client, [[REQ-431]] `placeChildren`) is unchanged: an ask changing status in place must not lose focus/typed text in another ask.
- Text that names the two sections (the consultant's instructions, the help text, any link that targets "What you've told us") is updated to the one list.

### 3. A long-answer box is never collapsed

- A `long_text` ask's box is always at least its three rows high, and grows as it fills.
- Cause: `grow()` sets the box's inline height from `scrollHeight`, and is first run in a microtask after the block is built. When the block is not laid out at that moment (not yet attached, the Input view hidden, or the item folded), `scrollHeight` is 0, so the box is pinned at `height: 0px` plus padding, with `overflow: hidden`.
- Fix: the box has a three-row minimum height in the stylesheet, and `grow()` never sets a height smaller than that (a 0 `scrollHeight` leaves the height alone). It is grown again when it becomes visible (item unfolded / view shown) if it holds text.
- **The text cursor shows as soon as the box is selected** (operator, 2026-10-31: "the text cursor only shows up after I start typing"). Likely the same cause: a box pinned near 0px clips its caret until typing grows it. With the minimum height the caret is visible on focus, before any key is pressed. Check the same on every Input-tab text box the client types into (question answers, story-note edits, comparison comments; the chat box is the framework's composer, tracked separately in BUG-321); if one still hides its caret on focus for another reason (e.g. `caret-color`, a transparent text colour, an overlay), fix it there too.

## Test plan

UATs named `test_UAT_FC_<this ticket>_*` (vitest, jsdom builder harness as for REQ-401 / BUG-200 plan-panel tests; plan-core via its public tool surface):

- An upload ask with `upload_role` reference (and with none) offers a file picker that accepts several files; picking two uploads both and answers the ask once citing both.
- The ask schema no longer declares `multiple`; an ask stored with `multiple: false` still draws a several-file picker.
- With open, answered and skipped asks, the panel draws one "Questions" section in posting order; answering an open ask leaves it at the same position, ticked and folded; there is no "What you've told us" section.
- The heading's count reads "N of M answered" and updates when an ask is answered.
- A `long_text` ask drawn while its panel is hidden / its item folded has no inline height below its three-row minimum, and is not 0px high once shown.
- A focused, empty `long_text` box (and each other client text box) has a rendered height of at least one line and no style that hides the caret (`caret-color: transparent`, transparent `color`), so the caret is visible before typing.
- Existing plan-panel UATs (REQ-364, REQ-379, REQ-401, BUG-200, BUG-236, BUG-245) updated where they assert the two sections.


## Decision (operator, 2026-10-31)

Skipped asks count toward "N of M answered", confirmed. A skip is an explicit choice, so the panel must never steer the client back to it: a skipped ask counts as dealt with, is not highlighted or badged as outstanding, and is folded like an answered one. The client can still reopen it from its line if they choose.

## Implementation (as landed)

- **Supersedes** [[BUG-196]]'s "several files only for a `site` ask, one otherwise" and [[REQ-401]]'s two sections. The REQ-401 "two sections" UATs are removed; BUG-196, BUG-200, BUG-216, BUG-255, REQ-364, REQ-403 and REQ-417 UATs are updated to the one list / several files.
- `plan-core.ts`: `multiple` and `takesSeveral` are gone from `PlanAsk`, `checkAsks` and `set_ask`; `panelView` drops a stored `multiple` from what it hands the panel, and `checkPlan` accepts a stored ask that still has one. `plan-surface.json`'s `set_ask` no longer declares it.
- `plan-panel.js`: every upload control is `multiple` and labelled "Upload files" (`PLAN_UPLOAD`, the one-file label, is removed). One `.plan-panel__list` under a `.plan-panel__head` row holding the "Questions" heading and a `.plan-panel__count` span reading "N of M answered" (`PLAN_ANSWERED_COUNT`); the count sits beside the heading, not in its words, so the heading reads "Questions" and the BUG-245 "N new" badge stays on it. With no asks the head row and list are hidden and the REQ-417 empty state shows.
- Only open asks can be "new"; a skipped ask is drawn folded with its dash and never badged or highlighted.
- Redraw: a block the client is typing in is kept only while its status is unchanged, so another ask changing status (or the client's own Enter-to-save) redraws in place without taking the focused field.
- Long-answer box: a shared `growing-box.js` (`grow`, `keepGrown`) replaces the copies in `plan-panel.js` and `comparisons.js`. `grow()` leaves the height alone when `scrollHeight` is 0; `keepGrown()` grows once after the box is built and again when a `ResizeObserver` sees it go from zero width to laid out (unfolded, or the Input view shown). `builder.css` gives `.plan-ask__input--long` `min-height: 4.5em` (three rows); the comparison-note box already had it. No builder stylesheet rule hides a caret (`caret-color`/transparent colour), and the story-board boxes are one-row boxes that were never pinned to 0.

## UATs

`tests/test_UAT_FC_REQ-619_one_list_of_questions.test.ts` (jsdom, real `plan-panel.js` with `builder.css` loaded; plan core via `checkPlan`/`panelView`, and the consultant's `plan-surface.json`): several files on reference/no-role uploads and on `accepts_upload`, one answer citing both; stored `multiple: false` read without complaint and still drawn as several; no `multiple` in the schema; one Questions list in the plan's order with no second section; answering/skipping ticks and folds in place and the line reopens to Change; a status change elsewhere keeps the focused field and its text; "N of M answered" counting skips and updating on answer; a skipped ask never new; empty plan hides the list and heading; a long-answer box drawn hidden or inside a folded item has no 0px inline height and a 4.5em minimum; no client text box on the Input tab hides its caret.