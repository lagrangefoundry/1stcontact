---
uid: acceptance_criterion-145872b3
id: AC-697
type: acceptance_criterion
title: Behavioural config is validated against the capability's typed contract
created_by: xgd
created_at: '2026-07-22T19:54:00.901253+00:00'
updated_at: '2026-07-22T19:54:00.901253+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
When a capability instance's `config` is validated against its capability
contract, each field is checked against its typed spec and every violation is
reported as a distinct entry naming the offending field (`config.<name>`) and the
reason. Specifically:
- a missing **required** field is a violation; a missing optional field is not;
- a value of the wrong kind for its declared type (boolean / integer / enum /
  string / url / list) is a violation;
- an integer outside its inclusive `min`/`max`, an enum value outside its closed
  value set, and a list outside its inclusive `minItems`/`maxItems` are each
  violations;
- a list-of-objects field recurses into each item's per-field `itemSchema` to
  any depth, reporting item-indexed violations (`config.<name>[i].<field>`).
A fully valid config produces an empty violation list.

## Verification
Validate representative instances of the two survivor capabilities: one with a
correct config (expect zero violations) and ones each seeding a single defect
(missing required, wrong type, out-of-range integer, off-enum value,
out-of-bounds list, malformed list item). Assert exactly the expected
field-scoped violation is reported in each case.
