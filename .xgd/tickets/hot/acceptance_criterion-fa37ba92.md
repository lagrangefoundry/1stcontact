---
uid: acceptance_criterion-fa37ba92
id: AC-1757
type: acceptance_criterion
title: Admission is decided before any route is served, on every path
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:28.339449+00:00'
updated_at: '2026-09-11T06:37:27.835700+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Admission is decided before anything is served. A caller who proves a valid
identity but has no person record or no eligible grant is refused without any
route running: no builder page, no site asset, no static file and no data
response reaches them, on any path they ask for.

## Verification

Present a fully valid, correctly signed identity for an address that was never
invited, and assert the response is the refusal rather than any served content.
Repeat for several paths — the builder page, a static asset path and an unknown
path — and assert all three produce the same refusal, so nothing falls through to
a route or an asset handler.