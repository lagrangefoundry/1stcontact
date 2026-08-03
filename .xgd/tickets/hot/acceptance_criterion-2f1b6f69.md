---
uid: acceptance_criterion-2f1b6f69
id: AC-783
type: acceptance_criterion
title: Every binding that cannot resolve to exactly one existing seam is rejected
  with a machine-readable location
created_by: xgd
created_at: '2026-08-03T03:20:22.433117+00:00'
updated_at: '2026-08-03T03:33:08.242469+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-02f21b8a
  kind: behavior
  regression_only: false
---

## Criterion

Validation of a composed page fails, with a human-readable message and a
machine-readable path identifying the offending instance or the document, in each
of these cases:

1. an instance accompanies an L1 body without naming any seam (the exclusivity
   rule's original intent — an unbound behaviour still fails), the message naming
   the seams that were available;
2. an instance names a seam that is not present in the L1 document, the message
   naming the seams that were available;
3. two instances name the same seam;
4. an instance names a seam on a page that carries no L1 body at all;
5. the L1 document contains two seams sharing one name, making the mount point
   ambiguous — reported against the document rather than an instance.

Each failure is an error, never a silent no-op or a dropped instance.

## Verification

Validate one site per case and assert the validation fails, that at least one
reported error carries the case's message, and that the same error's reported
path points at the offending instance's seam binding (cases 1-4) or at the page's
L1 document (case 5).