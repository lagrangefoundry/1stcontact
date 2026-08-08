---
uid: bug-ede1fb8c
id: BUG-33
type: bug
title: 'Builder chrome tests: six red suites, one a stale DOM handle in the REQ-115
  open-in-new-tab assertion'
created_by: xgd
created_at: '2026-08-08T00:30:55.222532+00:00'
updated_at: '2026-08-08T00:30:55.222532+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: medium
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Symptom

Six tests are red on `main` and stay red on `branch-BUG-32`. They are outside
STORY-99's evidence set (they belong to REQ-115 and `story-3bf94bd4`), so they do
not fail that story's review — but a permanently red suite is the normalised-red
counterpart of the silent green BUG-32 exists to close, and it should not sit.

```
tests/req115-builder-composition.test.ts
  × test_UAT_FC_REQ-115_open_in_new_tab_matches_the_iframe_exactly
tests/reconciliation-copy-edit-gesture-modal.test.ts
  × test_UAT_AC994_clicking_a_copy_region_opens_one_form_over_that_regions_fields
  × test_UAT_AC1000_closing_a_form_in_which_nothing_changed_writes_nothing
  × test_UAT_AC1001_a_region_with_nothing_editable_says_so_and_names_its_kind
  × test_UAT_AC1002_the_nothing_to_edit_message_is_dismissible_by_button_escape_and_backdrop
  × test_UAT_AC1003_a_rendering_without_the_page_coordinate_is_refused_before_anything_is_sent
```

Pre-existing, not caused by BUG-32: `git diff main...HEAD` touches only two
import specifiers in `app.js`/`editor.js` and one docstring line in each of the
two failing test files. `toolbar.js` and `panel.js` are untouched.

## Root cause (REQ-115 one — already traced, do not re-derive)

`test_UAT_FC_REQ-115_open_in_new_tab_matches_the_iframe_exactly` is a
**stale-DOM-handle defect in the test**, not a product defect. It captures the
anchor once (`const link = app.toolbar.get('open-new-tab')`) and re-reads that
same handle after `setSite`.

`apps/control-app/src/builder/toolbar.js:101` subscribes `render` to both `mode`
and `site`; `render()` calls `disposeActions()` → `element.replaceChildren()` and
builds a **new** anchor. `panel.js:113-119` (`setSite`) calls `refresh()` — which
updates `currentSrc` and emits `src` — *before* emitting `site`, so the
replacement anchor is constructed with the correct href already in hand. The
captured handle is a detached survivor whose subscription was disposed; the live
control in the DOM is correct.

STORY-99's `test_UAT_AC971_open_in_a_new_tab_always_targets_the_displayed_document`
asserts the same behaviour, re-looks-up the control each time (which is what an
operator actually clicks), and passes. So the fix is to re-read the control after
each state change in the REQ-115 assertion — **not** to weaken it and not to
change `toolbar.js`.

The five `reconciliation-copy-edit-gesture-modal` failures are not yet diagnosed.

## Fix

- REQ-115: re-look-up `open-new-tab` after each `setSite`/`setMode` rather than
  reusing the captured handle.
- Copy/edit modal: diagnose the five failures and fix whichever side is wrong,
  without weakening assertions.

## Test plan

Both suites green:
`npx vitest run tests/req115-builder-composition.test.ts tests/reconciliation-copy-edit-gesture-modal.test.ts`
(currently `6 failed | 8 passed`).
