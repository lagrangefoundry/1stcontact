---
uid: acceptance_criterion-21f724fc
id: AC-2245
type: acceptance_criterion
title: Two businesses can each publish a site called home; publishing records and
  consults no claim
created_by: xgd
created_at: '2026-11-04T16:01:52.266030+00:00'
updated_at: '2026-11-04T16:01:52.266030+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
---

## Criterion

Two different businesses each holding a site with the slug `home` can **both publish it**. Neither publish is refused, both mint their own revision, and each site's live revision is served at its own key. There is no published-address claim: publishing records none and consults none, so no response tells one business that another holds a slug, and the schema contains no table whose purpose is to make a slug globally unique.

## Verification

Provision two businesses, create and publish `home` in each, and assert both publishes succeed and each key serves its own content. Inspect the baseline schema and assert no claim table exists, and scan the platform source (skipping dot-directories and build output) for any reader of one.