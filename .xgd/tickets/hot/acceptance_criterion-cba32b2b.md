---
uid: acceptance_criterion-cba32b2b
id: AC-1477
type: acceptance_criterion
title: The ticket schema stays in agreement with the component that publishes it,
  and an unavailable component reports a named skip rather than a pass
created_by: xgd
created_at: '2026-09-01T23:57:13.709624+00:00'
updated_at: '2026-09-02T00:13:30.696195+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ab1ecd62
  kind: behavior
  regression_only: false
---

## Criterion

The schema step is a transcription of the schema the shared ticket component publishes, and the
agreement between the two is checked rather than trusted.

- Every statement the component publishes as its schema is present in the deployed schema step,
  compared whole rather than by table name — so an added column or a changed index upstream is caught,
  not just a missing table.
- Whitespace and formatting differences do not count as disagreement.
- When the component publishes a statement the schema step does not contain, the check fails and names
  the missing statement, so a deployed database cannot silently sit a version behind the component it
  is meant to be running.
- Exactly one part of the schema step is permitted not to be a transcription: the reconciliation of the
  shared account registry, which exists because the registry predates this store.
- The check is only meaningful when the shared component is available. When it is absent, or present but
  older than the attachment capability this store requires, the check reports a **named skip stating the
  reason and carrying the command that installs it** — never a silent pass and never an obscure failure
  about an undefined value.

## Verification

With the shared component available, compare each published schema statement against the deployed schema
step and observe every one is present; introduce a statement the step lacks and observe a failure naming
it. Remove or downgrade the shared component to a copy lacking the attachment capability and observe the
check reports a skip whose message states the reason and gives the install command, while the checks that
depend only on this repository's own files still run.