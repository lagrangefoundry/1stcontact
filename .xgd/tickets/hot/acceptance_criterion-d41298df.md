---
uid: acceptance_criterion-d41298df
id: AC-2035
type: acceptance_criterion
title: No looking operation changes the site
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:25.270806+00:00'
updated_at: '2026-10-30T20:12:05.677441+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
Every operation on the looking surface, and its group, is declared with a read effect. Running every operation against a real store succeeds and leaves the site's change counter exactly where it was, with the stored site definition and pages unchanged. The six operations are:
- list_references
- describe_reference
- screenshot
- compare
- check_fidelity
- capture_site, run through its refusal path

## Verification
**Declaration.** Assert that every operation and group in the looking declaration has effect read.

**Run all six.** Read the site's change counter, definition and pages. Then run each of the six operations once through the composed Toolbox:
- The five that can run without network must each succeed: a non-error result, inside the untrusted-content frame.
  - list_references names the seeded bundle.
  - describe_reference names it too.
  - screenshot carries an image.
  - compare reports a size and zero difference.
  - check_fidelity returns one of the five verdicts with a next step.
- capture_site, given a private address, returns its REFUSED result.

**Afterwards.** Assert:
- The counter, definition and pages are unchanged.
- The audit record holds exactly the six operations, each journalled with effect read.
