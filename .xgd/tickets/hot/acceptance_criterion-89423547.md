---
uid: acceptance_criterion-89423547
id: AC-847
type: acceptance_criterion
title: 'The link role is refused where it would be malformed: a behavior-bound control
  or a module mount seam declaring a link is rejected at validation'
created_by: xgd
created_at: '2026-08-06T02:48:24.923154+00:00'
updated_at: '2026-08-08T00:43:34.528250+00:00'
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
Two node kinds cannot take the link role, and a definition that gives them one
fails validation with an error locating the offending node:

- a **behavior-bound control** (a submit button, an input, a text area) — a link
  around an interactive control is malformed interactive nesting, and the module
  that declared the control owns that element's semantics;
- a **module mount seam** — a mount point for a module's own markup is not an
  authored navigable subtree.

The refusal is a property of the vocabulary rather than a rule applied after the
fact: the definition shape for these kinds admits no link at all.

## Verification
Validate a definition placing a link on a behavior-bound control and assert it
fails with an error locating that node; repeat for a module mount seam. Assert the
same link declaration validates on a text run, a box, a container and an image, so
the failure is the kind restriction and not the link declaration itself.