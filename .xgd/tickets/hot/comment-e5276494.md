---
uid: comment-e5276494
id: COMMENT-4324
type: comment
title: Comment on bug BUG-165
created_by: EPIC-20
created_at: '2026-09-29T04:41:57.856363+00:00'
updated_at: '2026-09-29T04:41:57.856363+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-12bb645f
  kind: note
---


---

## Closed — the fix is upstream (2026-09-29)

Not fixed here. The defect is four lines of `reconcile` in the framework's
`delegation_toolbox.js`, which already receives the run's `outcome` and already uses
it for `accepted` — it just does not consult it for the per-check verdict. Nothing in
this repo produces the verdict, so a fix here could only post-process the result
inside REQ-340's `accountingDelegationToolbox` wrapper, which would put a patch for
upstream's contract in our accounting seam.

Filed as **lagrange-framework BUG-72** — *A check verdict reads "passed" on a run
whose outcome says it never finished* — carrying this report's evidence, the
mechanism, and the required behaviour (a distinct verdict such as `unverified` stated
once over "outcome is not `REPORTED`", rather than per outcome).

The "related observation" at the end of this ticket — that a check phrased as an
impression cannot be caught being wrong — is filed separately as
**lagrange-framework REQ-187**, since it changes what the tool accepts rather than
what it reports, and it extends the check-shape validation BUG-68 already built.

Three further defects found in the same session are filed upstream alongside them:
**BUG-73** (a turn that ends by throwing loses its spend; a worker cut off mid-flight
is billed to nobody), **BUG-74** (attributed worker spend counts turns and calls them
requests), and **BUG-75** (the nudge asks again after a worker turn that was cut
off). EPIC-20 carries the local halves.

A session was pointed at this ticket with the free-coding prompt at 04:14 on
2026-09-29 (`comment-438553d0`). There is nothing for it to implement in this repo.
