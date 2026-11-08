---
uid: acceptance_criterion-8cf0265b
id: AC-2476
type: acceptance_criterion
title: Two behaviors may declare the same top-level name and the composed bundle still
  parses and every behavior runs
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:32:28.945392+00:00'
updated_at: '2026-11-08T21:40:04.883125+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
Two behaviors may declare the same top-level name in their client code (a
`const`, `let`, `function` or `class`), and the composed client-behaviour asset
(`capabilities.js`) still parses as an ES module, and every behavior in it still
runs. One behavior's private names never collide with another's, and a clash
between two behaviors never stops a third from running. Today's real case:
`contact-form`, `account-portal` and `account-chrome` each declare
`ERROR_SELECTOR` with a different value, and each behavior sees its own value.

The guarantee comes from how the client code is composed, not from a naming
convention. A behavior author does not need to know what names other behaviors
use.

## Verification
Compose the shipped asset from the real catalog, which today contains the
three-way `ERROR_SELECTOR` collision, and load it as an ES module: it must parse.
Then compose two behaviors that declare the same top-level `const` with
different values. Load the result and assert that it parses, and that each
behavior's initialisation runs against its own value (for example, each one
marks its own mount in a DOM fixture). Assert that a third behavior with no
colliding names also runs in the same asset.