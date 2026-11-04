---
uid: acceptance_criterion-bf747dfb
id: AC-2274
type: acceptance_criterion
title: The History section is read-only and every class it emits is selected by a
  stylesheet rule
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:39.603080+00:00'
updated_at: '2026-11-04T19:42:34.675918+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
The History section is read-only and styled consistently with the app. It offers no control to edit, delete or add an event (no button or form input inside the section). Every class the section emits for its list, rows, kind, time, recorded stamp and origin line is **selected by a rule in the app's stylesheet**: with the shipped stylesheet loaded into the document, a rule naming that class matches the element that carries it.

## Verification
Open the pane for a contact with history. Assert that the section contains no button or form input. Inject the app's shipped stylesheet into the document and read its parsed rules from the document's CSSOM. For each class the History section emits, assert that a rule whose selector names that exact class matches (`Element.matches`) an element in the section that carries it.
