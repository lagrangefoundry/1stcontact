---
uid: acceptance_criterion-02172406
id: AC-2257
type: acceptance_criterion
title: No permission check reads role beyond the single ownership question, and owner
  is the only role value
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:10:59.352925+00:00'
updated_at: '2026-11-04T21:38:44.478987+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Access restrictions between people are not built (REQ-194, decided 2026-09-05).
The membership role is a foothold, not a permission system. `owner` is the only
role value the product writes or checks for. The only predicate over the role in
the product is the single ownership question REQ-185 defines ("is this person an
owner of this business"). That question gates the owner-only routes: invite,
correcting a contact's record, changing who can sign in, and (asked of the 1st
Contact business) add-a-business. No other check, in any app, package or tool,
reads the role, and no other role value (`support`, `staff`, `admin`) appears in
product source. So a member holding any other role is admitted, may select the
business, and is served its business-scoped routes exactly as an owner is; they
are refused only at the ownership-gated routes. People who share an account are
not told apart by role: all of them hold `owner` on the account's businesses.

## Verification

Runtime (primary): give a person an active membership with a non-owner role
(`staff`) on a customer business and on the 1st Contact business, both written
directly because the product never writes such a role. Assert they are admitted
with the customer business selectable and carrying `staff`. Assert that
`GET /api/people` in that business answers 200 with the same people as for the
owner, and that `canInvite` is false for them and true for the owner. Assert they
are refused with 403 at invite (writing nobody), contact record edit and sign-in
status, while the owner passes the invite gate. Assert add-a-business answers 404
for them, while a 1st Contact owner gets past the gate (400 for an empty body).
Provision a business for an account holding two people and assert that both
memberships are `owner`.

Supplementary guard: scan the product source (apps, packages, tools), with
comments stripped, for the role vocabulary as string literals. Assert that the
only file containing any of `owner`, `support`, `staff` or `admin` is the identity
module, that it contains `owner` exactly three times (two writes and one read),
and that it holds exactly one `role === 'owner'` comparison.

## Reconciliation Decisions
- (review report-0cfddba5 gap 5) Runtime evidence with a non-owner membership is
  the primary proof that only the ownership question reads the role. The source
  scan is kept as a supplementary drift guard, not as the proof.
