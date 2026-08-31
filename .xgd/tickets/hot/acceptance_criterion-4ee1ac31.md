---
uid: acceptance_criterion-4ee1ac31
id: AC-1434
type: acceptance_criterion
title: A behavior module is handed the site's resolved locale identity at render time
created_by: xgd
created_at: '2026-08-31T12:28:43.025020+00:00'
updated_at: '2026-08-31T12:33:34.750034+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-17ba490e
  kind: behavior
  regression_only: false
---

## Criterion

A behavior module mounted on a page is handed the site's fully resolved locale
identity — country, locale, currency, timezone and direction — at render time,
and what the module does with it reaches the rendered page.

For a site declaring `IE`, a mounted module receives exactly
`{ country: 'IE', locale: 'en-IE', currency: 'EUR', timezone: 'Europe/Dublin',
dir: 'ltr' }`, and a module that emits its received currency produces a page
whose markup carries `EUR`.

Modules read this one resolved answer rather than each deriving its own, so two
modules on one page cannot disagree about the same business.

## Verification

Validate and render a site declaring `country: 'IE'` with one behavior module
mounted on its page. Observe the locale identity the module was handed, and read
the rendered page's markup for the value the module emitted from it.