---
uid: acceptance_criterion-02172406
id: AC-2257
type: acceptance_criterion
title: No permission check reads role beyond the single ownership question, and owner
  is the only role value
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:10:59.352925+00:00'
updated_at: '2026-11-04T17:18:32.450959+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Access restrictions between people are not built (REQ-194, decided 2026-09-05).
The membership role is a foothold, not a permission system. `owner` is the only
role value the product writes or tests for. The only predicate over the role in
the product's source is the single ownership question REQ-185 defines ("is this
person an owner of this business"), which gates the invite and add-a-business. No
other check, in any app, package or tool, reads the role, and no other role value
(`support`, `staff`, `admin`) appears. People who share an account are not told
apart by role: all of them hold `owner` on the account's businesses.

## Verification

Scan the product source (apps, packages, tools), with comments stripped, for the
role vocabulary as string literals. Assert that the only file containing any of
`owner`, `support`, `staff` or `admin` is the identity module, that it contains
`owner` exactly three times (two writes and one read), and that it holds exactly
one `role === 'owner'` comparison. Provision a business for an account holding
two people and assert that both memberships are `owner`.