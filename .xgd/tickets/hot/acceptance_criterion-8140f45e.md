---
uid: acceptance_criterion-8140f45e
id: AC-912
type: acceptance_criterion
title: 'The server is read-only except POST to a site''s lead endpoint: header-only
  requests are served bodiless and every other writing method or path is refused with
  its allowed set'
created_by: xgd
created_at: '2026-08-06T18:49:44.747210+00:00'
updated_at: '2026-11-09T00:58:45.363445+00:00'
completed_at: null
last_field_updated: title
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
the same not-found as its full-request counterpart.

The server is read-only with exactly one declared exception: a `POST` to a
site's lead endpoint (`/api/lead` on the apex, or `/site/<siteKey>/api/lead`) is
handed to lead capture and does not get method-not-allowed. Any other request is
refused with a method-not-allowed status whose headers name the permitted
methods as the two read methods, and no store read is performed for it. That
covers every method other than GET, HEAD or that one POST on any path, `POST` to
any other path, and an apex `POST /api/lead` on a deployment that names no apex
site.

## Verification

Issue a header-only request for a deployed page and assert status, content type,
freshness headers and declared length match the full request while the body is
empty. Issue a header-only request for a missing path and assert not-found.
Issue `PUT`, `PATCH`, `DELETE` and other methods against a page path, the site
root and `/api/lead`, and `POST` against a page path, the site root and a
near-miss of the lead path (for example `/api/leads` or `/api/lead/x`). Assert
every one gets method-not-allowed advertising `GET, HEAD`. Issue a `POST` to
`/api/lead` and to `/site/<siteKey>/api/lead` and assert neither gets
method-not-allowed. With no apex site configured, assert an apex `POST /api/lead`
gets method-not-allowed.
