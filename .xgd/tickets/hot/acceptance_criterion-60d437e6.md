---
uid: acceptance_criterion-60d437e6
id: AC-1337
type: acceptance_criterion
title: Each distinct silent breakage fails the smoke check non-zero, naming the check
  and what it expected
created_by: xgd
created_at: '2026-08-20T05:31:25.328242+00:00'
updated_at: '2026-08-20T05:31:25.328242+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

Each distinct way a deploy is silently broken fails the smoke check: the run exits non-zero, the
report names the specific check that failed and carries a non-empty explanation of what was
expected versus what was seen, and the remaining checks still report their own outcomes rather than
the run stopping at the first failure. At minimum these six breakages are each caught by the check
that owns them:

- a referenced asset that is not found;
- an asset served with the wrong content type for its extension (a font served as generic bytes);
- a preview page that lost its non-indexable marking;
- a lost trailing-slash redirect;
- a not-found response that reveals a site exists when another does not;
- an apex that stopped responding successfully.

## Verification

Drive the check against an origin that is correct except for one deliberate breakage, once per
breakage above. Each run exits non-zero, the failure list contains exactly the check that owns that
breakage, and that failure's detail is non-empty and describes the expectation. Confirm the other
checks in the same run still report pass or skip.
