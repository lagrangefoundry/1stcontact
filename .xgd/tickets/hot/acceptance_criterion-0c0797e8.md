---
uid: acceptance_criterion-0c0797e8
id: AC-842
type: acceptance_criterion
title: 'A link target outside the URL allowlist never becomes a live link: the page
  presents the plain un-linked element and validation reports the offending target
  field'
created_by: xgd
created_at: '2026-08-06T02:48:03.621549+00:00'
updated_at: '2026-08-08T00:43:29.340477+00:00'
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
A link target passes the same URL allowlist as every other URL the substrate
emits: http(s), site-relative and same-page targets are permitted; every other
scheme (script, data, vbscript, file) and any target containing characters that
could break out of the surrounding markup or style context is not.

A definition declaring a disallowed target is rejected at validation, with an
error identifying the node and its link target field. Independently of that, a
page rendered from such a definition presents the node as the plain, un-linked
element: no link, no target of any kind, and no trace of the disallowed value in
the published output.

## Verification
For each of a script-scheme target, a data-scheme target and a target containing
markup-breaking characters: assert validation of the definition fails with an error
naming that node's link target field; and, rendering the same definition directly,
assert the published markup contains no link and no target attribute for that
node, and does not contain the disallowed value. Assert permitted forms (absolute
http(s), site-relative, same-page) all validate and publish as live links.