---
uid: acceptance_criterion-c71a03ab
id: AC-843
type: acceptance_criterion
title: 'A linked node keeps its keyboard focus indicator: the authored focus treatment
  applies to the element the reader focuses'
created_by: xgd
created_at: '2026-08-06T02:48:07.873619+00:00'
updated_at: '2026-08-09T05:41:15.103147+00:00'
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
Taking the link role never costs a node its focus indicator. A node that declares
both a link target and a focus treatment presents that focus treatment on the
element that actually receives keyboard focus, so a reader tabbing to the link
sees a visible indicator. This holds for every kind that can take the link role,
and holds whether the focus treatment was authored explicitly or supplied as the
substrate's default.

## Verification
Publish a page with a linked node declaring a focus ring. Assert the published
stylesheet binds a keyboard-focus rule carrying a visible outline to the same
styling identity the published link carries — not to a surrounding element. Drive
the page in a browser, move focus to the link with the keyboard, and assert a
visible indicator is present on the focused element.