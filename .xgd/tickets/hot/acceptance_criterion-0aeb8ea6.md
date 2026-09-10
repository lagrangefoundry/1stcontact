---
uid: acceptance_criterion-0aeb8ea6
id: AC-1429
type: acceptance_criterion
title: A declared country alone derives the site's locale, currency and timezone,
  and reaches the rendered language
created_by: xgd
created_at: '2026-08-31T12:28:31.505592+00:00'
updated_at: '2026-09-10T04:00:49.791678+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-17ba490e
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Declaring a country alone is enough. A site that declares `IE` and nothing else
resolves to locale `en-IE`, currency `EUR`, timezone `Europe/Dublin` and
direction `ltr`, and its rendered pages declare `lang="en-IE"`. A site declaring
`GB` alone resolves to `en-GB` / `GBP` / `Europe/London`.

Locale, currency and timezone are separately reported values, not one combined
value: two countries sharing a language differ in currency, and two countries
sharing a currency differ in locale.

## Verification

Resolve the locale identity of a configuration declaring only `country: 'IE'` and
observe all four values plus direction. Render a page of that site and read the
language attribute of the rendered document. Repeat the resolution for
`country: 'GB'` and observe that the currency and timezone differ from Ireland's
while the language does not.