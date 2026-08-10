---
uid: acceptance_criterion-0e249010
id: AC-862
type: acceptance_criterion
title: A site definition may declare its distribution as internal or product, an absent
  declaration means internal, and any other value is rejected
created_by: xgd
created_at: '2026-08-06T03:30:09.566673+00:00'
updated_at: '2026-08-10T08:15:52.232513+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8685be2d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The marker that arms the strict gate is part of the validated site contract, not
an ad-hoc field read out of raw configuration. A site definition validates when it
declares its distribution as either internal or product, and the declared value
survives validation unchanged. A definition that declares no distribution
validates and is treated as internal by the gate. A definition declaring any other
value is rejected by validation.

## Verification
Validate a site definition declaring internal and one declaring product; assert
both are accepted and the value read back matches what was declared. Validate one
declaring nothing; assert acceptance and that the gate holds it to the looser bar.
Validate one declaring an unrecognised value; assert rejection.