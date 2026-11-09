---
uid: acceptance_criterion-69289859
id: AC-2467
type: acceptance_criterion
title: Every model request the assistant host sends carries the model and max_tokens
  declared in the project's backend configuration document, identically on the CLI
  and deployed hosts, and editing that document alone changes the request
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T15:53:29.281211+00:00'
updated_at: '2026-11-09T23:39:41.882474+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

The model and the reply ceiling are this project's decision, held as data, and
not the assistant library's defaults.

- **The request carries the document's values exactly.** Every model request the
  assistant host sends for a turn carries the `model` and `max_tokens` declared
  for the Claude backend in the project's backend configuration document — as
  shipped, `claude-opus-5` and `64000` — and not the library's own defaults.
- **From the first turn.** The values are already in force on the first request
  of a newly opened session, not only after some later reconfiguration.
- **The same on both hosts.** The operator's-machine host and the deployed
  edge-runtime host send the same `model` and `max_tokens` for the same
  document; neither reads a value the other cannot see.
- **The document alone changes it.** Changing the declared `model` or
  `max_tokens` in that document, with no other change, changes the values the
  next request carries accordingly.

## Evidence notes

Observed at the model-client boundary (the request the backend hands to its
client), with the client doubled, on each host. The expected values are read
from the shipped document rather than restated, so the criterion holds across a
future edit of the document.