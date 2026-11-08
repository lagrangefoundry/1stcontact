---
uid: acceptance_criterion-98d492a4
id: AC-2480
type: acceptance_criterion
title: Each step failure (no match listing what is there, ambiguous with count and
  names, not visible, click changed nothing, field did not take the value, page never
  settled) is refused with INTERACTION_FAILED naming what failed, and no picture is
  returned
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:43:37.104405+00:00'
updated_at: '2026-11-08T22:57:53.248948+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A step that cannot be carried out is refused with the declared code `INTERACTION_FAILED`, the refusal quotes the step and says what failed, and **no picture is returned**: no image block, and no picture of the page in the wrong state. The failures are:

| What happened | What the refusal says |
|---|---|
| Nothing visible carries the name | nothing is called that, then lists up to eight distinct names that are on the page |
| Several visible things carry it | how many, which ones, and asks for the exact one |
| Only hidden things carry it | something is called that but is not visible, and whatever holds it has to be opened first |
| A click after which markup, scroll and focus are all unchanged (focus from the click itself does not count) | clicking the named control changed nothing |
| A field that does not read the value after the fill, or a menu with no such option | the field still reads its old value / the menu has no such choice |
| The page still changing 2000ms after the step | it was still changing after 2000ms, so nothing it shows can be trusted |
| The page navigated away or stopped answering during the step | the page stopped answering, and that these steps drive a page's own state, not which page is shown |

The surface declares `INTERACTION_FAILED` with a message saying the failure is a finding about the page, and `screenshot`, `compare` and `check_fidelity` each list it among their refusals.

## Verification
Drive the sign-in page with jsdom as the browser. Cause each failure:
- a name that matches nothing;
- a duplicate visible name;
- `click "Close"` before the dialog is open;
- a button with no handler;
- an input whose setter rejects the value, and a menu option that does not exist;
- a handler that keeps mutating the page;
- a click that navigates away.

For each, assert the refusal code is `INTERACTION_FAILED`, the text quotes the step and contains the stated finding, and the result has no image block.