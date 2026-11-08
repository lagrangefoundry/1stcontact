---
uid: acceptance_criterion-920b6789
id: AC-2458
type: acceptance_criterion
title: An uploaded material's role can be corrected between Site asset and Background
  information, and republishable is derived from the role server-side, never taken
  from the request
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:55:11.224545+00:00'
updated_at: '2026-11-08T13:55:11.224545+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

On material the client uploaded, *What it is for* in the detail's rights record is a select, and
picking an option corrects the material's role:

- **The select offers the words the record displays**: *Site asset* and *Background information*,
  the same labels the upload overlay's drop areas carry. Those drop areas are the one place the
  two labels are defined. The value sent is the role the picked label names (`site` or
  `reference`), never the label itself.
- **Picking an option commits it**, with no separate save, through `POST /api/material/role` with
  `{uid, role}`.
- **The route validates the role and does not coerce it.** A role other than `site` or
  `reference` is refused 400, and so is an absent one: unlike the upload, absent is not allowed.
  A missing or empty `uid` is refused 400. A uid that names no material this surface reaches is
  answered not-found and changes nothing (AC-1724).
- **`republishable` is derived from the role on the server, never taken from the request**:
  `true` for `site` and `false` for `reference`, the same rule ingestion uses when it first files
  an upload. A `republishable` value in the request body has no effect.
- **The rights record shows the change, all of it.** After a successful change the response
  carries the material's row as stored. The whole rights block repaints from that row, not just
  the role: *may appear on the site* and *Placed on* update alongside the role. The list row is
  redrawn too, so its role pill and its not-on-the-site warning match what changed.
- If the origin refuses, the select goes back to the stored role and the refusal is shown against
  the field.

## Verification

POST `{uid, role: 'site'}` for an uploaded `reference` material and observe a 200 whose row
carries `role: 'site'` and `republishable: true`. Then POST `role: 'reference'` for an unplaced
uploaded site asset and observe `role: 'reference'` and `republishable: false`. POST with
`republishable: true` alongside `role: 'reference'` and observe the stored value is `false`.
POST with the role absent, then misspelled, and observe a 400 each time with the material
unchanged. In the panel, open an uploaded material and observe the select offering exactly the
two drop-area labels. Pick the other label and observe that the request carries the role id, and
that *may appear on the site*, *Placed on* and the list row's pill repaint to the returned row.
