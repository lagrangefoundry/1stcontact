---
uid: acceptance_criterion-7dcc23b9
id: AC-2412
type: acceptance_criterion
title: A material and a reference record rights and provenance in the same form, including
  generated as an origin, inferred from provenance, with what the client said the
  file is for as the one narrowing input
created_by: workflow:fix_reconciliation_review/builder
created_at: '2026-11-08T11:50:12.791640+00:00'
updated_at: '2026-11-08T11:50:12.791640+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

Replaces AC-1492, whose origin vocabulary REQ-208 (request-68718201, reconciled in bundle-c0301347) extended with `generated`. Every other clause carries over unchanged.

A record of kind **material** and a record of kind **reference** each accept, and read back
unchanged, the same rights and provenance statement:

- **who owns it** — one of: owned by the client, licensed, or belonging to a third party
- **whether it may be republished** — a true-or-false answer
- **whether it may be exported** — a true-or-false answer
- **where it came from** — one of: uploaded by the client, captured, fetched, taken from a site, or generated
- **what sort of file it is** — one of: document, image, font, or capture bundle
- **the address it was taken from**, where it has one

The form is the *same* on both kinds — same names, same permitted values, same meanings — so a query
that asks the corpus a question about rights or about the sort of file gets one answer across both
kinds rather than two that only look alike.

**Ownership and the two permission answers are read off where the material came from, and are never
asked of the client.** The one thing the client may state about a file is **what it is for** — for
the site, or for them to read — which the same block carries alongside the six parts above, on both
kinds, with the same permitted values on each. It is optional: where nobody was asked, the record
carries no answer and the reading taken from provenance stands exactly as it did.

What the client said the file is for can only *narrow* what provenance inferred — it never widens
it, and it is not a second rights model: supplying it changes no ownership answer and adds no
ownership question. What it does, what its absence does, and what an answer outside the permitted
two does are stated separately.

## Verification

Through an account-scoped store, create one record of each of the two kinds carrying a complete
rights and provenance statement, then read each back and confirm all six parts are returned with the
values supplied. Confirm the two kinds accept every permitted value of each closed set, including **generated** as where it came from; confirm the two kinds accept the identical statement — the same values are valid on
both. Confirm the same of the "what it is for" answer: it is accepted on both kinds with the same
permitted values, and a record supplying none of it is accepted and reads back with none.