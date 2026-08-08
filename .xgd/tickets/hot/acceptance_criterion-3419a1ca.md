---
uid: acceptance_criterion-3419a1ca
id: AC-841
type: acceptance_criterion
title: A link that opens in a new browsing context always carries opener and referrer
  isolation, and no site definition can request the new context without it
created_by: xgd
created_at: '2026-08-06T02:47:59.200571+00:00'
updated_at: '2026-08-08T00:43:28.351601+00:00'
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
A link declared to open in a new browsing context is published targeting a new
context **and** carrying both opener isolation and referrer suppression. The two
are inseparable: the site-definition vocabulary offers no field, value or
combination that yields the new browsing context without the isolation, because an
opener reference to the originating page is a security hole rather than an
authoring preference.

## Verification
Publish a page with a link declaring the new-context option and assert the
published link requests a new browsing context and carries both opener isolation
and referrer suppression. Assert a link that does not declare the option requests
no new context. Assert the site definition rejects any attempt to declare the new
context together with a weakened or absent isolation value (no such field is
accepted).