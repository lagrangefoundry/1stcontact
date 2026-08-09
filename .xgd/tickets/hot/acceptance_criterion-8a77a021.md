---
uid: acceptance_criterion-8a77a021
id: AC-808
type: acceptance_criterion
title: Control bindings are validated in both directions
created_by: xgd
created_at: '2026-08-06T01:32:55.445559+00:00'
updated_at: '2026-08-09T05:40:47.854166+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A behavior declares the leaf elements it owns — the tag, whether a binding is
required, and whether there is one element per item of a named config list
(a form's fields) or one per subtree of a named repeated slot (a carousel's
dots). Validating an instance checks that declaration against the L1 subtrees it
supplies, **in both directions**:

- a `control` node naming an element the behavior does not declare is a
  violation, reported against the slot it was found in and naming the declared
  elements it could have used — without this check the node would silently render
  nothing and the author would lose a field they believed they had placed;
- a **required** declared element with no control node bound to it anywhere in the
  instance's subtrees is a violation naming that element.

The roster of bindable names is resolved per instance from the declaration: a
per-item element yields one name per configured item (a field's own submission
name), a per-subtree element yields one name per mounted subtree
(`<name>-<index>`), and a plain declaration yields its own name. **Invariant
elements are never bindable** — their presentation is fixed by an obligation, so
there is nothing for an L1 node to paint and naming one is an undeclared binding.

## Verification
Validate instances of both survivor behaviors whose slot subtrees carry (a) a
control node per declared element — expect zero control violations; (b) a control
node naming an element the behavior never declared — expect an undeclared-binding
violation; (c) a subtree that omits a required element (a configured field with
no control node) — expect a required-unbound violation; (d) a control node naming
one of the module's invariant elements — expect an undeclared-binding violation.
Confirm the per-item roster follows the configured field names and the per-subtree
roster follows the mounted slide count.