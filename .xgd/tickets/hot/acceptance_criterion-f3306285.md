---
uid: acceptance_criterion-f3306285
id: AC-1438
type: acceptance_criterion
title: Locale decides placement and separators; currency decides symbol and decimal
  count
created_by: xgd
created_at: '2026-08-31T12:39:10.642696+00:00'
updated_at: '2026-08-31T12:47:21.135320+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0598c150
  kind: behavior
  regression_only: false
---

## Criterion

The same minor-unit amount in the same currency, formatted for two different
locales, produces two different strings that differ only in the locale's own
conventions — where the symbol sits relative to the digits, and which characters
separate groups and the decimal — while naming the same currency and the same
value.

The same locale formatting two different currencies produces two strings that
differ in the currency's symbol, proving the symbol is taken from the currency
argument rather than from a locale-keyed table of the platform's own.

Neither argument can answer for the other: locale alone does not determine the
symbol, and currency alone does not determine placement or separators.

## Verification

Format one fixed minor-unit amount in one currency for two locales whose
conventions are known to differ (symbol-first with a dot decimal vs symbol-last
with a comma decimal) and assert the two exact strings. Then format two
different currencies in a single locale and assert the two symbols differ.
Assertions are against the standard library's real output for real locales, not
against a snapshot of platform-authored formatting.