---
uid: acceptance_criterion-78436279
id: AC-963
type: acceptance_criterion
title: The workspace document references each component through the entry point that
  component itself declares
created_by: xgd
created_at: '2026-08-07T01:44:05.435524+00:00'
updated_at: '2026-08-07T23:16:15.669907+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

The module and stylesheet references in the workspace document are derived from
each component package's own declared entry points, not from hardcoded file
paths. A component that declares a different entry point is referenced at the
new location without any change to the workspace, and every reference the
document contains resolves to a real served file.

The names those references are made under are equally derived. Every component
reference the document declares is under the single scope in use, every component
the workspace consumes has a reference in the document, the set of references is
not empty, and no reference names a scope the components were previously
published under.

## Verification

Fetch the workspace document and, for every component reference it declares,
assert the referenced path corresponds to that component's declared entry point
and that requesting it over the origin returns the component's bytes with a
success status. Assert the document contains no path that is absent from the
component's declaration. On the same freshly produced document, assert every
component reference is under the scope in use, that each consumed component is
present among them, that there is at least one, and that none names a superseded
scope. The document under assertion is the one produced now, never a copy of it
committed to the repository — a committed copy compared against itself proves
nothing about what an operator would be served.
