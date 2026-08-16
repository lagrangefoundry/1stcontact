---
uid: acceptance_criterion-5a097866
id: AC-896
type: acceptance_criterion
title: Deploying the published channel ships the site's current latest revision and
  moves the live pointer
created_by: xgd
created_at: '2026-08-06T18:39:35.857429+00:00'
updated_at: '2026-08-16T07:23:15.933063+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

With the published channel selected, the deploy ships the site's current latest
published revision — both its rendered output and its definition — to a location
named by that revision, and updates the deploy index so that: the revision is
listed with its own identifier, its publish timestamp, its publish message and
the content id of the bytes shipped; and the index's live pointer names that
revision. The returned result carries the revision number, and — for a site in
the servable store tree — the returned URL is the site's plain published URL (no
snapshot id segment). The non-servable tree behaves as AC-925 states, on this
channel as on the draft one.

## Verification

Create a site in the servable tree, publish a revision with a message, then
deploy with the published channel. Assert that both artifact halves are readable
under the revision's location, that the deploy index's live pointer names that
revision, that the index's revision entry carries the original publish timestamp
and message plus the shipped content id, that the result reports the revision
number, and that the returned URL is the site URL with no snapshot segment.