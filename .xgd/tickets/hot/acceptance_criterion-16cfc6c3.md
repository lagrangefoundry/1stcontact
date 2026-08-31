---
uid: acceptance_criterion-16cfc6c3
id: AC-1431
type: acceptance_criterion
title: Both render paths declare the same language and direction for the same site
created_by: xgd
created_at: '2026-08-31T12:28:33.614708+00:00'
updated_at: '2026-08-31T12:28:33.614708+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-17ba490e
  kind: behavior
  regression_only: false
---

## Criterion

Both of the platform's render paths declare the same language and the same text
direction for the same site. For a site declaring nothing, a site declaring a
country, a site declaring an RTL country, and a site declaring a country with an
overriding locale, the two rendered documents agree on both attributes, and the
declared language is never empty.

## Verification

For each of those four site configurations, render the page through each of the
two render paths, read the language and direction each rendered document
declares, and compare them. Agreement is observed in the two rendered artifacts,
not inferred from the two paths sharing an implementation.
