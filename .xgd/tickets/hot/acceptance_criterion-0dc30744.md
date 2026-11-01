---
uid: acceptance_criterion-0dc30744
id: AC-2158
type: acceptance_criterion
title: The platform_operator column is read in exactly one place, scope entry, and
  a second read fails the build
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:31.517390+00:00'
updated_at: '2026-11-01T17:58:30.506388+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
In the builder's server source, exactly one place reads the `platform_operator` column (as a property access or destructure): business-scope entry without a membership. That entry is possible because 1st Contact hosts the other businesses. It still reads the column. The add-a-business fulfilment gate does not read it, and neither does any other route, control or page.

A read in any other source file fails the test gate, and the failure names the file and line. These are not reads and are excused: the column's type declaration, SQL column lists that write it, and comment lines. Generated build output is excluded. The guard is proven against a sample. It must flag a property access and a destructure, and must not flag a declaration, SQL, or a comment.

## Verification
A static guard over the builder's server source asserts that there are no reads outside the scope-entry reader, and that the scope-entry reader contains at least one read. A self-check sample of five lines (declaration, SQL insert, comment, property access, destructure) yields exactly lines 4 and 5 as reads.
