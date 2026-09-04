---
uid: acceptance_criterion-7fc68b95
id: AC-1559
type: acceptance_criterion
title: The list is the whole account's material, newest first, with the open site
  as a mark rather than a boundary
created_by: xgd
created_at: '2026-09-04T04:26:30.889793+00:00'
updated_at: '2026-09-04T04:45:39.104244+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f775289b
  kind: behavior
  regression_only: false
---

## Criterion

The Library lists every piece of material the account holds, ordered most recently changed first.
This includes material bound to the client's other sites and material bound to no site at all —
none of it is withheld on the strength of which site is currently open.

Material bound to the site currently open is additionally marked as being used on it. Material bound
to another site or to none carries no such mark, and carries no "not used here" mark either.

Changing which site is open re-marks the same list: rows that gain the binding acquire the mark and
rows that lose it drop it, and no row leaves the list.

## Verification

With an account holding material bound to site A, material bound to site B, and material bound to no
site, open the Library with site A selected. Assert every one of the three appears; assert the
ordering is by last-changed descending; assert only the site-A material carries the used-here mark.
Switch the open site to B and assert the same three rows are present with the mark now on the site-B
material alone.