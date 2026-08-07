---
uid: acceptance_criterion-8140f45e
id: AC-912
type: acceptance_criterion
title: 'The server is read-only: header-only requests are served bodiless and any
  writing method is refused with its allowed set'
created_by: xgd
created_at: '2026-08-06T18:49:44.747210+00:00'
updated_at: '2026-08-07T22:31:24.052787+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A header-only request for a servable URL returns the same success status,
content type and freshness headers as a full request, plus the object's length,
and carries no body. A header-only request for a URL that names nothing returns
the same not-found as its full-request counterpart. Any other request method is
refused with a method-not-allowed status whose headers name the permitted
methods as the two read methods, and no store read is performed for it.

## Verification

Issue a header-only request for a deployed page and assert status, content type,
freshness headers and declared length match the full request while the body is
empty. Issue a header-only request for a missing path and assert not-found.
Issue writing and other methods and assert the method-not-allowed status and the
advertised permitted set.