---
uid: acceptance_criterion-0dc30744
id: AC-2158
type: acceptance_criterion
title: The fulfilment privilege flag is read in exactly two places, scope entry and
  the fulfilment gate, and a third read fails the build
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:31.517390+00:00'
updated_at: '2026-11-01T11:57:31.517390+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
In the builder's server source, two places read the `platform_admin` flag (as a property access or destructure), and both still do:
- Business-scope entry without a membership, which is possible because 1st Contact hosts the other businesses.
- The add-a-business fulfilment gate.
A read in any other source file fails the test gate, and the failure names the file and line. These are not reads and are excused: the column's type declaration, SQL column lists that write it, and comment lines. Generated build output is excluded. The guard is proven against a sample. It must flag a property access and a destructure, and must not flag a declaration, SQL, or a comment.

## Verification
A static guard over the builder's server source asserts: no reads outside the two allowed readers. Each of the two readers contains at least one read. A self-check sample of five lines (declaration, SQL insert, comment, property access, destructure) yields exactly lines 4 and 5 as reads.
