---
uid: acceptance_criterion-64eb8985
id: AC-1433
type: acceptance_criterion
title: An unsupported or malformed locale field is a validation error at a machine-readable
  path, never a silent fallback
created_by: xgd
created_at: '2026-08-31T12:28:42.074577+00:00'
updated_at: '2026-08-31T12:28:42.074577+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-17ba490e
  kind: behavior
  regression_only: false
---

## Criterion

A locale field the platform cannot honour is a validation failure carrying a
machine-readable path naming the offending field (`/config/country`,
`/config/locale`, `/config/currency`, `/config/timezone`) — never a silent fall
back to a default country's values.

At minimum these are all refused:

- a country that is well-shaped but that the platform has no derivation row for
  (`XX`) — an unsupported country is invalid, not quietly served the default
  country's values
- a country in the wrong case (`ie`) or in the three-letter standard (`IRL`)
- a locale in POSIX spelling (`en_US`) or a language name rather than a tag
  (`english`)
- a currency in lower case (`eur`) or of the wrong length (`EURO`)
- a timezone shaped like a zone id but absent from the runtime's zone database
  (`Europe/Dubland`), and an offset abbreviation rather than a zone id (`GMT+1`)

## Verification

Validate a site definition for each bad value in turn. Each reports failure, and
the reported errors include one whose path is `/config/<the field that was set>`.
The corresponding valid site — same definition, that field removed or corrected —
validates, so the refusal is attributable to the field and not to the fixture.
