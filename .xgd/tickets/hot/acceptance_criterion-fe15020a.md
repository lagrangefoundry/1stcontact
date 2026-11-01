---
uid: acceptance_criterion-fe15020a
id: AC-2160
type: acceptance_criterion
title: Nothing outside the two deployment-identity readers names or tests for 'the
  platform's own tenant'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:37.987721+00:00'
updated_at: '2026-11-01T12:03:12.161495+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
Outside the two places allowed to ask which business is the deployment's own (identity resolution and scope resolution), no source in the builder's server names the concept or tests for it. Three shapes are forbidden: an identifier naming it (e.g. `platformTenant`, `PLATFORM_ACCOUNT`, `platform_own_business`), a predicate asking it (e.g. `isPlatform`, `is_platform`), and a comparison of a business id against the deployment's literal slug (e.g. `scope.businessId === '1stcontact'`). A violation fails the test gate, and the failure names the file and line. The guard is shown a sample containing each forbidden shape. It must catch all of them and excuse the allowed forms.

## Verification
A static guard over the builder's server source asserts no matches outside the two allowed readers. A self-check sample including `const platformTenant = requirePlatformTenant(env)`, `if (isPlatform(scope.businessId)) ...` and `if (scope.businessId === '1stcontact') ...` asserts each is flagged at its line.