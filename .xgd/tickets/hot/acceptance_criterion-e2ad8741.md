---
uid: acceptance_criterion-e2ad8741
id: AC-2012
type: acceptance_criterion
title: The control surface offers no alt on assets and never presents registration
  as a precondition for use
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-26T01:11:10.447920+00:00'
updated_at: '2026-10-26T01:21:24.882886+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c46abfa6
  kind: behavior
  regression_only: false
---

## Criterion

The assistant's control surface declares asset operations that tell the truth
about using a stored file:

- adding a file and drawing an image offer no alt-text parameter, and reading an
  asset reports no alt text — its description says what a picture shows is
  written on the picture element that places it;
- no operation description, parameter description or absence presents
  registration, or any step other than writing an asset's handle into a picture
  element, as a precondition for using a stored file;
- the absence covering files is titled "Fetching a picture, or any file,
  yourself": it says the assistant cannot go and get a file, directs it to ask
  the client to drop the file on the conversation's site-asset area, says not to
  send anyone to a separate asset manager or builder screen, and says a dropped
  file's description is held on the material it came from, to be read there and
  written onto the image element.

These are asserted on the declaration, not on a model's obedience to it.

## Verification

Load the declared control surface. Assert the add and draw operations declare no
`alt` parameter and the read operation's description disclaims alt text. Assert
no description or absence text claims registration is needed. Assert the file
absence carries the stated title, the instruction to ask for the file to be
dropped on the site-asset area, the warning against redirecting to an asset
manager, and the pointer to the material's description.