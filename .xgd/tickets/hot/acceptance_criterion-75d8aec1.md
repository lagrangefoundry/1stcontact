---
uid: acceptance_criterion-75d8aec1
id: AC-845
type: acceptance_criterion
title: A node's declared identifier becomes an in-page navigation target, so a same-page
  link scrolls the reader to that node
created_by: xgd
created_at: '2026-08-06T02:48:16.267860+00:00'
updated_at: '2026-08-08T00:43:32.497884+00:00'
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
A node that declares an identifier is published carrying that identifier as a real
in-page navigation target, on every kind that can declare one. A link whose target
is a same-page reference to that identifier therefore has something to land on:
activating it moves the reader to that node. A node that declares no identifier is
published without one.

## Verification
Publish a page containing a node declaring an identifier and, elsewhere on the
page, a link whose target is a same-page reference to it. Assert the published
markup carries the identifier on the target node and the same-page reference on the
link. Drive the page in a browser, activate the link, and assert the browser's
location carries the same-page reference and the identified node is scrolled into
view. Assert nodes declaring no identifier publish none.