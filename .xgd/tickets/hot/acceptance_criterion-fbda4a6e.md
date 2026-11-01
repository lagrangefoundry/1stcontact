---
uid: acceptance_criterion-fbda4a6e
id: AC-1092
type: acceptance_criterion
title: The surface offers exactly one way to change the element tree and one way to
  change the page's document-level style, and every operation it offers is one it
  declares
created_by: xgd
created_at: '2026-08-10T09:20:22.488550+00:00'
updated_at: '2026-11-01T01:10:09.947292+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Changing a page is reached through exactly two operations, one per half of the page:
one that replaces an element of the element tree at an address, and one that changes the
page's document-level style (background, text colour, widths, column, font table). Each
half has exactly one way in — the document-level keys are not reachable by extending the
element address, and the element tree is not writable through the document-level
operation (naming it there is refused with a pointer to the element operation).

The narrower copy-field read/write pair is not offered alongside them — it is subsumed,
so it does not appear among the surface's declared operations, among the operations a
session can invoke, or in the manual a session is given; invoking it by name is answered
as an unknown operation.

The declared operations and the implemented operations correspond exactly, in both
directions: nothing implemented is undeclared, and nothing declared is unimplemented.
Both page-changing operations belong to the authoring capability group, which the surface
declares and which is named in the grant the builder's assistant receives — so a role
that may change the elements on a page may also change how the page itself is painted.

## Verification

Compare the set of declared operation names with the set of implemented ones for exact
equality. Assert the retired pair appears in neither, nor in a session's tool list or
manual, and that calling it by name returns an unknown/not-enabled answer. Assert the
element-replacement and page-style operations are both declared, both in the authoring
group, and that the authoring group is named in the assistant's grant. Assert a
page-style write naming the element tree's key is refused and writes nothing.
