---
uid: acceptance_criterion-dc45179f
id: AC-2018
type: acceptance_criterion
title: The not-on-the-site warning and the Placed on row of the record read one placement
  list and agree on every row
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-26T01:26:42.562489+00:00'
updated_at: '2026-11-01T13:27:03.062827+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
  title: The not-on-the-site warning and the Placed on row of the record read one
    placement list and agree on every row
---

## Criterion

The two places the Library speaks about placement — the "Not on the site" warning on a row and the
**Placed on** row of the read-only record — read the same fact, the material's recorded placement
list, and agree on every row:

- the record row is labelled *Placed on* (not *Used on*): it says where the bytes went, and a
  material added to the draft is not in use by anyone until the client publishes;
- *Placed on* names every site the material is placed on, joined in one line, and is empty for a
  material placed nowhere — it stays a list, because the store allows more than one site;
- a site-role material whose *Placed on* is empty carries the warning, and one whose *Placed on*
  names a site does not;
- background material, whose placement is always empty, shows an empty *Placed on* and carries no
  warning — it claims neither to be on the site nor to have failed to get there.

## Verification

Mount the Library over material that includes a site asset whose promotion landed, a site asset
whose promotion failed, and background material. Select each row: observe the record row labelled
*Placed on* and no row labelled *Used on*; observe the landed asset's *Placed on* names its site
and its row carries no warning; observe the failed asset's *Placed on* is empty and its row carries
the warning; observe the background material's *Placed on* is empty and its row carries no
warning.