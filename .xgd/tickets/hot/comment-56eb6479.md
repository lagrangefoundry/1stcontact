---
uid: comment-56eb6479
id: COMMENT-3613
type: comment
title: Comment on request REQ-292
created_by: xgd
created_at: '2026-09-21T21:41:16.588494+00:00'
updated_at: '2026-09-21T21:41:16.588494+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-24efb2e6
  kind: note
---


## This cannot be backfilled, and the table must not pretend otherwise

The historical data will not fill this table. Across all 1,100 audit records in
the R2 ledger — 2026-09-08 to 09-21, every session of all three tenants —
**zero carry any token counter.** The junction log held them and died with its
isolate; the archive never carried them into the chat ticket. Past spend can be
modelled and has been (EPIC-20), but it cannot be recovered.

So `turn_spend` **must reject a row without counters** rather than accept a
modelled one. A table that holds measured and estimated rows side by side is a
table nobody can bill from, and the estimate always outlives the memory of its
being one. The turns before this ticket ships are simply not in it, and a period
that predates it reports no measurement rather than a reconstruction.

This is also why acceptance 3 matters so much: there is no second chance at a
turn's counters, and a defect in this write is silent and permanent.
