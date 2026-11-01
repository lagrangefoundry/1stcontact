---
uid: acceptance_criterion-5da4fc8b
id: AC-2210
type: acceptance_criterion
title: Two independent facets — pipeline stage and access — narrow the list and combine,
  so 'invited and never came' and 'signed up and never asked' are askable
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:05:18.011603+00:00'
updated_at: '2026-11-01T20:12:51.482463+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0ea74f39
  kind: behavior
  regression_only: false
---

## Criterion
The Contacts tab offers two separate facet controls over a single list:
- a **stage** facet with options "Any stage", "Lead", "Invited", built from the declared stage set;
- an **access** facet with options "Anyone", "Member", "Not a member".

Each facet narrows the list to contacts matching its selected value. When both facets are set, the list shows only contacts matching both (AND). Every contact appears at most once. Choosing "Any stage" / "Anyone" removes that facet's narrowing.

## Verification
Render the tab over the four-combination fixture. Set stage=Invited with access=Not a member, and assert that only the invited non-member is listed ("invited and never came"). Set stage=Lead with access=Member, and assert that only the never-invited member is listed ("signed up and never asked"). Set each facet alone and assert that the matching subsets appear, with no duplicates. Reset both facets and assert that all four contacts are listed.