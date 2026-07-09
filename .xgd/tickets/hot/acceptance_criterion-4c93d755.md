---
uid: acceptance_criterion-4c93d755
id: AC-497
type: acceptance_criterion
title: Widened content values preserve strict raw-prop rejection
created_by: xgd
created_at: '2026-07-09T21:01:42.402455+00:00'
updated_at: '2026-07-09T21:01:42.402455+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6fc151b1
  kind: behavior
  regression_only: false
---

## Criterion
Permitting object and scalar content values does not open a raw-CSS/HTML escape hatch. Content values remain a closed set of shapes (scalar, asset reference, nested record, or list), and a module instance that carries a disallowed raw property (for example a `style`, `css`, or `html` key on the instance) is still rejected. The verdict reports failure and carries an error whose JSON-pointer-style path locates the offending property.

## Verification
Submit a site whose module instance carries a raw `style`/`css`/`html` property. Assert the result reports failure and that at least one error's path points at the offending instance property.
