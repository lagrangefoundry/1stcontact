---
uid: acceptance_criterion-84b87d8a
id: AC-1094
type: acceptance_criterion
title: The operator's click-to-edit form exposes no fields on an assistant-composed
  element of a kind it does not edit
created_by: xgd
created_at: '2026-08-10T09:20:31.954258+00:00'
updated_at: '2026-08-10T09:29:35.196333+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

Asking the operator's editing gesture for the fields of an assistant-composed element
whose kind exposes no editable field returns an empty field list — a legitimate "nothing
to edit here" answer rather than a failure — so no form opens. The gesture's exposure rule
is unchanged by the assistant's wider reach: what the assistant can compose is broader
than what the operator's form exposes, and the form does not widen to follow it.

## Verification

Through the surface, author a container element carrying no editable field. Over the same
transport the browser uses, ask the editing gesture for its fields. Assert the answer
succeeds and its field list is empty.