---
uid: acceptance_criterion-7d8eb748
id: AC-2478
type: acceptance_criterion
title: Steps run in order, the first failure stops the run, and the shutter opens
  only on the state the steps produced; a driven page is laid out at its own viewport
  width and check_fidelity's value gates read the same driven state
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:43:34.238551+00:00'
updated_at: '2026-11-08T22:57:53.749254+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
The steps in `after` are carried out in the order written, one at a time, on the live draft page, and the run stops at the first step that fails. Later steps are not attempted, so there is only one refusal and it is about the first failure. The shutter opens only after every step has succeeded and the page has settled, so the picture shows the state the steps produced, not the page as it arrived. For example, after `click "Sign in"` the sign-in dialog is open at the moment the picture is taken.

A driven picture is loaded and laid out at the viewport it was asked at, so a control that only exists at `mobile` can be clicked at `mobile`. An undriven picture keeps its existing load-then-resize behaviour. The picture's text line names the steps it was taken after.

When `check_fidelity`'s `actual` is a driven `draft`, its value gates read the page in the same driven state as the picture beside them, not the undriven page.

## Verification
The sign-in page goes through the shipped renderer and modal script, with jsdom as the browser. Assert which panels were open at the moment the shutter was called: after `click "Sign in"` the dialog is open, and with no steps it is closed. With `[click "Missing", click "Sign in"]`, assert the refusal names `Missing` and the second step never ran. Assert a driven `mobile` shot navigates at the mobile width, and the text line contains `after \`click "Sign in"\``. Through `check_fidelity` with a driven `draft` actual, assert the manifest is read after the steps ran.