---
uid: acceptance_criterion-9b6c72f3
id: AC-2575
type: acceptance_criterion
title: A schema error inside a behavior slot reports the same path and key as in the
  page tree; an unknown kind lists valid kinds; every error is reported
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T22:52:24.167709+00:00'
updated_at: '2026-11-09T23:16:15.364676+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
**A schema error inside a behavior slot is reported as precisely as in the page
tree, and a refused write reports all its errors.**

- Writing an L1 subtree into a behavior slot with a bad key (for example an
  unrecognised axis such as `lineHeight` on a node's `axes`) is refused with an
  error whose path reaches the offending node and whose message names the
  offending key. The path tail and the message are the same as the identical
  node reports when placed in the page's own `l1` tree. It does not report
  "Invalid input" at the slot root.
- A node with an unknown `kind` (for example `picture`) is refused with a
  message that names the tag and its valid values (`kind is not one of: …`),
  not "Invalid input".
- A refused write reports **every** error found, not only the first: a payload
  with two invalid field names reports both in one refusal. The report is capped
  (10 errors) and, when cut, states how many more there were. The refusal's
  primary path still points at the first error.

## Observable at
The refusal returned by an edit command (for example `set_l1`) writing an
invalid subtree into a behavior slot or into the page's own `l1` tree.