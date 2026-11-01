---
uid: acceptance_criterion-b0cf474c
id: AC-2198
type: acceptance_criterion
title: An operator can open a dated grant that names the business it is about; a grant
  without a business or plan is refused 400
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:13.804840+00:00'
updated_at: '2026-11-01T19:33:13.804840+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
Opening a grant with a business and a plan creates one active grant and returns it. The returned grant shows the business it is about (id and name), the subject account (or none), the plan, source `admin_grant` whatever the caller sends, status `active`, a start that defaults to now, an optional end (none means open-ended), and an optional note. It records the opening operator as the grantor. The new grant then appears in the person's detail, in the business table, under the business it names. If the request names no business, or no plan, it is refused with **400** and a message saying what is missing ("A grant must name the business it is for." / "A grant must name a plan."), and no grant row is written.

## Verification
Against real D1: open a grant with a business, a plan and an end date, assert the returned shape (source `admin_grant`, status `active`), and assert it appears in the subject's detail under that business. Open a grant with an empty business, then with an empty plan, and assert 400 with the message and that the grant count is unchanged.
