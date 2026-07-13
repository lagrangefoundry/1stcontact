---
uid: acceptance_criterion-045456fe
id: AC-609
type: acceptance_criterion
title: Retired width names are removed from the dial and container tokens
created_by: xgd
created_at: '2026-07-13T20:38:31.446514+00:00'
updated_at: '2026-07-13T20:38:31.446514+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d555b990
  kind: behavior
  regression_only: true
---

## Criterion
The idiosyncratic pre-REQ-55 width scale is fully retired with no legacy aliases. The retired names `xnarrow`, `narrow`, `readable`, `default`, and `wide` are no longer valid `contentWidth`/`rowWidth` dial values, and are no longer container width token keys. No shipped site document references any retired name for a content/row width dial or a container token override.

## Verification
Confirm the content-width dial vocabulary contains only the Tailwind scale (`bleed` + `sm..7xl`) and none of the retired names. Scan every shipped site document and confirm none uses a retired name as a `contentWidth`/`rowWidth` value or a container token key.
