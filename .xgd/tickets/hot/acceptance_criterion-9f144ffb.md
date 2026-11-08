---
uid: acceptance_criterion-9f144ffb
id: AC-2391
type: acceptance_criterion
title: The image credential is scrubbed from anything shown to a person
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:33.632940+00:00'
updated_at: '2026-11-08T10:09:07.404273+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
The value of the image credential never appears in any error message, tool result, log line or response the control app shows to a person, nor in the tool result the model is handed. Wherever it would have appeared, it is redacted, just as the conversation model's credential is.

## Verification
`test_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown` in `tests/reconciliation-consultant-image-generation.workers.test.ts`, through `route()` in workerd, with a known credential value configured.

- A failure before any turn whose error echoes the credential: the error envelope does not contain the value and does contain the redaction marker.
- An image provider whose failure echoes the credential, followed by a model call failure that also echoes it: the streamed turn does not contain the value, does contain the redaction marker and the failure text, and the tool results the model was handed do not contain the value.
- The image-provider echo **on its own**, with a model that answers normally: the image tool was called and its one tool result reports the generator could not be reached; neither that tool result nor the streamed turn contains the value; the turn ends `done` and no material is created.
