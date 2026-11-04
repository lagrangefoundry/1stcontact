---
uid: acceptance_criterion-ceb41845
id: AC-2246
type: acceptance_criterion
title: A new account's starter site is slug unnamed and named Unnamed, and every account
  can publish it without colliding
created_by: xgd
created_at: '2026-11-04T16:01:53.667068+00:00'
updated_at: '2026-11-04T16:01:53.667068+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
---

## Criterion

Provisioning a business creates one starter site whose slug is **`unnamed`** and whose displayed site name is **`Unnamed`**, the same for every account. The name marks the site as not yet named: it is not reserved, and it is unique only within its business. Two freshly provisioned accounts can both publish their starter sites, which are served at two different keys. Renaming the starter is an ordinary slug change.

## Verification

Provision two businesses and assert each holds exactly one site, slug `unnamed`, whose definition's name is `Unnamed`. Publish both and assert both succeed with distinct published addresses.