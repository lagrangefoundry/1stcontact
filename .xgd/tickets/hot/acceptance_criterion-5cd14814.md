---
uid: acceptance_criterion-5cd14814
id: AC-846
type: acceptance_criterion
title: A definition in which two nodes declare the same identifier is rejected, naming
  the duplicate value and where it was first declared
created_by: xgd
created_at: '2026-08-06T02:48:20.703493+00:00'
updated_at: '2026-08-09T05:41:18.023081+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-2e4e2c45
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Because a declared identifier becomes a real in-page navigation target, it must be
unique within a page. A definition in which two nodes anywhere in the tree declare
the same identifier fails validation, with an error that names the duplicated
value, locates the offending node, and states where that value was first declared.
A definition whose identifiers are all distinct, and one that declares no
identifiers at all, both validate.

## Verification
Validate a definition with two nodes at different depths sharing one identifier and
assert it fails with an error naming the duplicated value and reporting the first
declaration's location. Validate a definition with distinct identifiers and one
with none, asserting both pass. This rule protects both same-page navigation (a
browser resolves only the first match) and the label-to-control association the
behavior-module control contract relies on, so also assert a definition with two
controls sharing an identifier is rejected.