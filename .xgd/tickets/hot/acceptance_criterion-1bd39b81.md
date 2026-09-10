---
uid: acceptance_criterion-1bd39b81
id: AC-1428
type: acceptance_criterion
title: A site declaring no locale renders the region-free language and every stored
  site still validates
created_by: xgd
created_at: '2026-08-31T12:28:30.561636+00:00'
updated_at: '2026-09-10T03:37:57.737820+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-17ba490e
  kind: behavior
  regression_only: false
---

## Criterion

A site that declares no locale fields at all validates and renders exactly as it
did before this capability existed: the rendered page declares the region-free
language `en` and text direction `ltr`, and its resolved locale identity reports
that same region-free language rather than a region nobody stated.

The other three values of that same resolution do not stay unstated, and the
asymmetry is deliberate: there is no region-free currency and no region-free
clock, so the default country answers for them or nothing does. An undeclared
site therefore resolves country `US`, currency `USD` and timezone
`America/New_York` — the default country's row — while its locale remains the
region-free `en`. Only the language attribute is withheld from a region, because
only the language attribute is the thing a screen reader pronounces and a search
index stores.

This holds for every site the platform already stores — each stored site's draft
definition and every one of its published revisions still validates unchanged.
The set of stored sites is discovered at verification time and must be non-empty,
so the criterion cannot pass by finding nothing to check.

## Verification

Render a page of a site whose configuration carries none of country, locale,
currency or timezone, and read the language and direction the rendered document
declares: `lang="en"`, `dir="ltr"`. Separately, resolve the locale identity of an
empty declaration and observe the whole resolution, not just its language: the
locale is the region-free `en`, and country, currency and timezone are the
default country's `US`, `USD` and `America/New_York`. Assert the locale is *not*
the default country's `en-US`, so the two halves are pinned as different
behaviours rather than as one.

Then enumerate the platform's stored sites, assert the enumeration is non-empty,
and validate each site's draft definition and each of its published revisions;
every one reports valid.
