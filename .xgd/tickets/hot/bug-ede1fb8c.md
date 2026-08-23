---
uid: bug-ede1fb8c
id: BUG-33
type: bug
title: 'Builder chrome tests: six red suites, one a stale DOM handle in the REQ-115
  open-in-new-tab assertion'
created_by: xgd
created_at: '2026-08-08T00:30:55.222532+00:00'
updated_at: '2026-08-10T11:41:56.858186+00:00'
completed_at: '2026-08-10T11:41:56.858186+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  severity: medium
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: null
    reconcile_sha: null
    main_sha: f1664c557c5dcbac01839bac6543dc1b85c68b2f
  version: 0.1.35
  story_points: 2
  merged_at_commit: f1664c557c5dcbac01839bac6543dc1b85c68b2f
  chat_comment: comment-7bd15cc0
---

## Symptom

Six tests were red on `main` and stayed red on `branch-BUG-32`. They are outside
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

## What was actually found and fixed

The set had shifted by the time work started. The **five
`reconciliation-copy-edit-gesture-modal` failures were already green** — fixed by
intervening work, not by this ticket. In their place, four *other* red assertions
in the same feature area turned out to be the **same defect class**, and all four
are fixed here:

| Test | Defect |
|---|---|
| `req115-builder-composition` → `..._open_in_new_tab_matches_the_iframe_exactly` | stale anchor handle (as diagnosed above) |
| `reconciliation-copy-edit-gesture` → `test_UAT_AC997_one_confirmed_form_is_one_change_however_many_fields_it_held` | stale `.fields-value` gesture |
| `reconciliation-copy-edit-gesture` → `test_UAT_AC998_after_a_save_the_page_shows_the_new_words_and_is_still_editable` | stale `.fields-value` gesture |
| `reconciliation-copy-edit-gesture` → `test_UAT_AC999_a_refused_edit_shows_its_own_reason_and_leaves_page_and_draft_unchanged` | stale `.fields-value` gesture |
| `req117-edit-loop-browser` → `test_UAT_FC_REQ-117_save_writes_the_edit_and_the_page_shows_it` | stale `.fields-value` gesture |
| `req117-edit-loop-browser` → `test_UAT_FC_REQ-117_clicking_a_segment_opens_a_modal_over_its_fields` | reads the value off `textContent`, which cannot see an input's value |

**The unifying root cause: the test holds something the product has since
replaced, and asserts against the detached survivor rather than what an operator
touches.**

Two mechanisms:

1. **Rebuilt anchor** (REQ-115). As diagnosed above. One extra detail worth
   recording: the `setMode('edit')` step passed only *by luck* — `panel.setMode`
   emits `src` **before** it emits `mode`, so the doomed anchor receives one last
   sync before `render()` replaces it. `setSite` then rebuilds it again, and the
   captured handle is left frozen at the previous mode's href.

2. **Auto-opened control** (the other five). `openLoneControl`
   (`apps/control-app/src/builder/editor.js:350`) opens a one-field form
   *straight into its control*, so the `.fields-value` VIEW the tests clicked no
   longer exists — `locator.click` timed out at 30s. Landed in `86dce8ffe`
   ("make the copy-edit modal elegant", 2026-08-07), one day *after* these UATs
   were generated in `3516bca3e` (2026-08-06). Same commit is why the value is no
   longer in the modal's `textContent`: it is an input's `value`.

## Fix

Test-side only — **no product code changed**. In every case the live control was
already correct, which is the same conclusion the original REQ-115 diagnosis
reached.

- `req115-builder-composition.test.ts` — re-look-up `open-new-tab` at each
  assertion instead of reusing the captured handle.
- `reconciliation-copy-edit-gesture.test.ts` (×3) and
  `req117-edit-loop-browser.test.ts` (×1) — drop the obsolete click on
  `.fields-value`; type into the control that `openLoneControl` already opened.
- `req117-edit-loop-browser.test.ts` — read the field value off the control
  (`inputValue()`) rather than the modal's `textContent`.

No assertion was weakened: each now exercises the live control an operator
actually touches, which is strictly closer to the behaviour under test.

## Test plan

Both originally-named suites green, plus the four newly-found ones and the
surrounding builder area:

```
npx vitest run \
  tests/req115-builder-composition.test.ts \
  tests/reconciliation-copy-edit-gesture-modal.test.ts \
  tests/reconciliation-copy-edit-gesture.test.ts \
  tests/req117-edit-loop-browser.test.ts \
  tests/req117-copy-editing.test.ts \
  tests/reconciliation-copy-edit-write-path.test.ts \
  tests/reconciliation-copy-edit-image-selection.test.ts
→ 7 passed | 59 tests passed
```

Wider builder regression (workspace chrome/mounted/origin, REQ-115 shell,
viewport fill, gradient panel, chat panel, session panel):
`8 passed | 51 passed | 2 skipped`.

Note: `req115-builder-shell.test.ts` timed out once under a 13-file parallel run
and passed in isolation and in the 8-file run — a load-induced flake, not a
defect, and not addressed here.