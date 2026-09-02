---
uid: acceptance_criterion-535253fa
id: AC-1492
type: acceptance_criterion
title: A material and a reference record rights and provenance in the same six-part
  form, and read it back unchanged
created_by: xgd
created_at: '2026-09-02T00:30:18.854612+00:00'
updated_at: '2026-09-02T00:42:26.091904+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

A record of kind **material** and a record of kind **reference** each accept, and read back
unchanged, the same rights and provenance statement:

- **who owns it** — one of: owned by the client, licensed, or belonging to a third party
- **whether it may be republished** — a true-or-false answer
- **whether it may be exported** — a true-or-false answer
- **where it came from** — one of: uploaded by the client, captured, fetched, or taken from a site
- **what sort of file it is** — one of: document, image, font, or capture bundle
- **the address it was taken from**, where it has one

The form is the *same* on both kinds — same names, same permitted values, same meanings — so a query
that asks the corpus a question about rights or about the sort of file gets one answer across both
kinds rather than two that only look alike.

## Verification

Through an account-scoped store, create one record of each of the two kinds carrying a complete
rights and provenance statement, then read each back and confirm all six parts are returned with the
values supplied. Confirm the two kinds accept the identical statement — the same values are valid on
both.