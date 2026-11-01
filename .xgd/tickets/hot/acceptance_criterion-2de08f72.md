---
uid: acceptance_criterion-2de08f72
id: AC-2071
type: acceptance_criterion
title: A write that introduces a font-family stack naming no served face and no generic
  fallback is refused naming the family; a stack naming a generic family is accepted
created_by: xgd
created_at: '2026-11-01T01:10:52.516432+00:00'
updated_at: '2026-11-01T01:10:52.516432+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

A change that paints a font-family stack is accepted when the stack's first family is a
face the page serves (matched case-insensitively and ignoring quotes), or when the stack
names a generic family anywhere in it (for example `serif`, `sans-serif`, `system-ui`,
`ui-sans-serif`) — such a stack has a fallback every browser has and cannot fail
silently. A change that introduces a stack meeting neither condition is refused: the
refusal names the family, lists the faces the page does serve (or says it serves none),
and suggests serving the face or naming a generic fallback. On refusal the draft is left
unchanged.

The rule applies to every page-changing write — an element replacement and a page-style
write alike — so removing the face a painted family depends on from the font table is
also refused.

## Verification

On a page serving one face, replace an element with one painted in a family the page does
not serve and no generic: assert a schema-invalid refusal naming that family and listing
the served face, and the draft unchanged. Repeat with the same family followed by
`sans-serif`: assert accepted. Paint a stack whose first family is the served face:
assert accepted. Remove the served face from the font table through the page-style write
while an element paints it with no generic: assert refused.