---
uid: acceptance_criterion-b11f487b
id: AC-1430
type: acceptance_criterion
title: Locale, currency and timezone each override independently; the rest still derive
  from the country
created_by: xgd
created_at: '2026-08-31T12:28:32.588926+00:00'
updated_at: '2026-08-31T12:33:35.271502+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-17ba490e
  kind: behavior
  regression_only: false
---

## Criterion

An explicitly declared locale, currency or timezone overrides the value that
would have been derived from the country, and overriding one leaves the other two
still derived from the country.

A site declaring `IE` with currency `USD` resolves to locale `en-IE`, currency
`USD`, timezone `Europe/Dublin`. A site declaring `US` with timezone
`America/Los_Angeles` resolves to locale `en-US`, currency `USD`, that stated
timezone. A site declaring `IE` with locale `ga-IE` renders `lang="ga-IE"` while
still resolving currency `EUR` and timezone `Europe/Dublin`.

## Verification

Resolve each of the three configurations above and observe that exactly the
declared field takes the declared value while the remaining fields hold the
country's derived values. For the locale override, additionally render a page and
read the language attribute of the rendered document, so the override is observed
in the artifact and not only in the resolution.