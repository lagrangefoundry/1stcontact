---
uid: acceptance_criterion-d75d0764
id: AC-1088
type: acceptance_criterion
title: Adding and removing are expressed as replacing a group with one holding a child
  more or fewer, and the result renders
created_by: xgd
created_at: '2026-08-10T09:20:02.805626+00:00'
updated_at: '2026-08-16T02:37:32.075405+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A caller adds something to a page by reading the group that should hold it, sending that
group back with the new element among its children, and removes something by sending the
group back without it. There is no separate insert or delete operation, and the surface's
own worked sequences describe adding and removing this way.

Structure composed this way is real page content: a row of text elements carrying link
roles, composed through map → read → replace, renders in the published page as ordinary
anchors pointing where the roles say — an internal page target and an in-page anchor
target alike.

## Verification

Through the surface as a session uses it: map the page, read its outermost group, send the
group back with a new row of link-carrying text elements prepended. Assert the stored
group now has one more child and that the new child equals what was sent. Render the site
and assert the output document contains anchor elements for each entry with the expected
targets. Then send the group back without that row and assert the child count returns to
its original value.