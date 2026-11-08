---
uid: comment-936fb0af
id: COMMENT-8038
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T21:49:14.080538+00:00'
updated_at: '2026-11-08T21:49:14.080538+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4f50681d
  kind: note
---

I wrote six UATs for story-58b2cec4 (one per REQ-216 AC, AC2477–AC2482). Five pass. AC2479 fails because the code doesn't do what the AC requires. I did not change any production code or existing tests.

The other 15 ACs in this story already had UATs in the existing looking-surface test files, so I didn't write new ones for them.

The tests go through the real consultant Toolbox with the looking surface composed. The only double is the browser, which is jsdom here. The sign-in page comes from the shipped renderer and its modal script, and the interaction script is the shipped one.

**Why AC2479 fails.** The test reports both problems at once (`expect.soft`):
1. **A field can be reached by its `id` or `name` attribute.** `fill "email_input" with "a@b.c"` should be refused as no-match. Instead it fills the field and returns a picture. The cause is that `fillNames` in `tools/generate/src/cli/capture/interact.ts` adds the `name` attribute and the element `id`. The story already flagged this; the fix is to drop both from `fillNames`.
2. **A menu option's value can beat another option's words.** The AC says a menu is set by an option's words first, and by its value only when no option's words match. The code checks words *or* value one option at a time and stops at the first hit. On a menu where an earlier option's value is "United Kingdom" and a later option's words are "United Kingdom", `fill "Region" with "United Kingdom"` selects the earlier option. This is a second problem that wasn't flagged before.

**Two departures from the AC wording:**
- **"Refused as invalid parameters"** (AC2477, AC2481): the Toolbox renders these refusals as `Error: screenshot failed. …` with no `(INTERACTION_FAILED)` code. The tests assert that form, which keeps them separate from step failures.
- **AC2482** says to assert that a draft picture's text doesn't contain the word "draft". It always does, because its label is `driven draft/ at desktop`. The test instead checks that the caption's own phrases ("ships no behaviour", "`draft` picture") are absent.

**Not covered:** I did not test AC2481's "on the Worker the budget is unchanged". The tests show no browser is ever leased for those refusals, and the budget is only spent when a browser is leased.

**Lint:** I couldn't run ESLint, because it isn't installed in this worktree and the sandbox blocked downloading it.

```
UATs generated for story story-58b2cec4 (plan item 3 of 8)

Story: story-58b2cec4
Test file(s) created:
  - tests/reconciliation-assistant-drives-the-draft.test.ts

Tests written: 6
Tests passed: 5
Tests failed: 1

⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - test_UAT_AC2479_controls_matched_by_accessible_name_and_no_selector_id_or_attribute_names_one:
    code diverges from AC — (1) interact.ts fillNames matches a field by its name attribute / id,
    so `fill "email_input" with …` succeeds instead of being refused as no-match;
    (2) menu matching checks option words OR value per option in order, so an earlier option's
    value beats a later option's words.

test_files_created:
  - "tests/reconciliation-assistant-drives-the-draft.test.ts"
```