---
uid: acceptance_criterion-277dfb8a
id: AC-1087
type: acceptance_criterion
title: Replacing an element replaces its whole subtree at that address and leaves
  its siblings and the rest of the page untouched
created_by: xgd
created_at: '2026-08-10T09:19:58.095297+00:00'
updated_at: '2026-08-10T09:29:37.182902+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

Sending a replacement element for one address puts that element, and everything inside it,
where the addressed element was. Everything else on the page — the addressed element's
siblings, its ancestors' other branches, every other page — is left exactly as it was. The
reply names the address that changed.

The replacement is whole, not a patch: anything the caller omits from the replacement is
gone from the page.

## Verification

On a page whose addressed element has at least two siblings, replace one element with a
differently-shaped element. Assert the stored definition at that address equals the
replacement exactly, that each sibling is byte-identical to before, that the page's
element count changed only by the difference the replacement implies, and that the reply
names the address written.