---
uid: acceptance_criterion-6b7a0f6a
id: AC-1229
type: acceptance_criterion
title: Reading the palette answers with every entry and how many places reference
  it, counting the definition and every page at any position in the family
created_by: xgd
created_at: '2026-08-20T01:19:33.772362+00:00'
updated_at: '2026-08-20T01:19:33.772362+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ee073693
  kind: behavior
  regression_only: false
---

## Criterion

Reading a site's palette answers with every entry the site declares — its name, its colour, and
the number of places that reference it — counted across the site definition **and every page**,
and counting a reference regardless of the position it names within the entry's light↔dark
family or the transparency it carries.

Specifically:
- Every declared entry appears, including one nothing references, which reports a count of `0`
  rather than being omitted.
- The count is the total number of references to that entry across the whole site, not per page
  and not per position within the family.
- A site whose definition declares no palette answers with an empty set of entries and a message
  saying so — not an error, not a failure.

## Verification

Seed a site whose pages reference one entry three times at three different positions in its
family, another entry once, and which declares a further entry nothing uses. Read the palette
and assert the returned entries carry exactly those names, their colours, and the counts
`3`, `1` and `0`. Read the palette of a freshly created site that declares none and assert the
result reports an empty palette and succeeds.
