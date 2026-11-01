---
uid: acceptance_criterion-aa4a1700
id: AC-2183
type: acceptance_criterion
title: The Businesses section is one headed table keyed by business, with No grant
  / Not an operator for the mismatches
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:00:43.329248+00:00'
updated_at: '2026-11-01T19:00:43.329248+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0034d937
  kind: behavior
  regression_only: false
---

## Criterion
The Businesses section shows one table keyed by business, with column headings **Business, Role, Plan, Access, Status** in that order. It has one business entry for each business the person runs (operator relation) or holds a grant on (entitled relation). The two relations are not split into separate tables.
- A business the person runs with no grant shows its role, and the grant columns read exactly **No grant**.
- A business the person holds a grant on but does not run shows exactly **Not an operator** in the Role cell, with the grant's plan, access window and status.
- Businesses the person runs come first, in the order their memberships were granted. Grant-only businesses follow them.
- A person who runs no business and holds no grant gets no table. Instead the section reads **None — they run no business, and hold no grant.**

## Verification
Seed a person who runs business X with no grant and holds a grant on business Y without running it. Open their detail. Assert there is a single table with the five headings. Assert X's row shows the role and "No grant". Assert Y's row shows "Not an operator" and the plan, and that Y comes after X. Seed a second person with neither relation and assert the sentence is shown and no table is.
