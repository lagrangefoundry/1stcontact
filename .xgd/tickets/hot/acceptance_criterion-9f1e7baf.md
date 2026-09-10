---
uid: acceptance_criterion-9f1e7baf
id: AC-932
type: acceptance_criterion
title: A site with no colour literals retrofits to an empty palette and remains valid
created_by: xgd
created_at: '2026-08-06T20:37:54.856029+00:00'
updated_at: '2026-09-10T20:45:54.189591+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-5e7eb0c5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A site whose L1 pages declare no colour axes has nothing to convert, and the
retrofit says so by succeeding with an empty result rather than by refusing.
Running it against such a site:

- writes a site definition carrying a **palette with no entries** — the palette
  is present and empty, not populated with entries no page references;
- leaves every page without a palette reference, because no page held a colour
  literal to rewrite;
- produces a definition that still satisfies the site-definition contract.

This is the retrofit's floor case and is deliberately *not* one of the refusals
AC-945 enumerates: nothing is wrong and no proof fails, there is simply no colour
to move. The claim is about a document that declares no colour axes, not about
any particular site: the stored sites that were in this state (`1stcontact`,
`harbor-cafe`) were deleted as dead examples by REQ-140 §7, so the case is
stated directly against a page built with an empty colour list.

## Verification

Census a site whose pages declare no colour axes — synthesised directly, since no
stored site is in this state — and confirm it reports zero distinct colour
literals. Run the retrofit against that site and assert: the
command succeeds; the written definition carries a palette holding zero entries;
no page in the written definition carries a palette reference; and the definition
validates against the site-definition contract.