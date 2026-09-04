---
uid: acceptance_criterion-96aa6ded
id: AC-1578
type: acceptance_criterion
title: Several files given to one answer at once each become their own record, reported
  separately and in order
created_by: xgd
created_at: '2026-09-04T04:51:59.604504+00:00'
updated_at: '2026-09-04T05:01:59.638324+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

Several files given to one answer at once — dropped together or chosen together — each become their
own record under that answer. Three files produce three records, each described and each findable in
its own right; none is dropped, merged into another, or given a different role from the answer they
were handed to. On the conversation route each file is reported separately, in the order the client
gave them.

## Verification

Give three files to one answer in a single gesture. Confirm three distinct records exist with that
answer's role, and — on the conversation route — three separate reports in the transcript in the
order the files were given.