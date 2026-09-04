---
uid: acceptance_criterion-8a7ab451
id: AC-1518
type: acceptance_criterion
title: The client's corpus is their own four kinds of record, client-wide across their
  sites
created_by: xgd
created_at: '2026-09-04T03:19:35.311407+00:00'
updated_at: '2026-09-04T03:32:05.566688+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-bb91191c
  kind: behavior
  regression_only: false
---

## Criterion

The knowledge held for one client is made of that client's own records — the conversations held
with them, the material they gave us, the reference sites captured on their behalf, and the brief
recording what was decided — and nothing else. Specifically:

- All four of those record kinds are corpus members; a record of any other kind belonging to the
  same client is not.
- Membership is the kind of record it is, not an opt-in marker carried on the record.
- The corpus is drawn from the client's own body of records, not from any shipped or read-only
  document set.
- The corpus is **client-wide, not per-site**: a record attached to one of the client's sites, a
  record attached to a different site of the same client, and a record attached to no site at all
  are all equally members, and none of them can be excluded by which site is being worked on.

## Verification

For an account holding at least one record of each of the four kinds, plus at least one record of
a kind outside them, resolve the client's corpus: it contains exactly the four and not the fifth.
Attach one member record to site A of that account, one to site B, and leave one unattached, then
resolve the corpus while working on site A: all three are present. Confirm that no site term
participates in membership, so the result does not change with the site in play.