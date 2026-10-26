---
uid: acceptance_criterion-dc45179f
id: AC-2018
type: acceptance_criterion
title: The On this site badge, the Used on row and the used-on-this-site filter read
  one placement list and agree on every row, across a site switch
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-26T01:26:42.562489+00:00'
updated_at: '2026-10-26T02:01:00.804191+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

The "On this site" badge, the "Used on" row of the read-only record and the "Used on this site"
filter read the same fact — the material's recorded placement list — and agree on every row:

- a row is badged on the open site exactly when the filter, set, keeps it;
- the "Used on" row names every site the material is placed on, joined in one line, and is empty
  for a material placed nowhere;
- a material placed on two of the client's sites is badged, and kept by the filter, on each of
  them; switching the open site between them re-decides badge and filter from the material
  already listed, with no further request for the account's material.

## Verification

Mount the Library over material that includes one placed on the open site, one placed on two sites,
one handed over as background while the open site was selected, and one whose promotion failed.
Observe the badged rows are exactly the placed ones; set the filter and observe it keeps exactly
the badged rows; select each row and observe its "Used on" row lists exactly its placed sites
(both sites for the two-site material, nothing for the background and failed ones). Switch the
open site to the two-site material's other site and observe it is still badged and kept, without
the list being re-requested.