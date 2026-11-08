---
uid: acceptance_criterion-fd061b72
id: AC-2392
type: acceptance_criterion
title: Deploying the control app never fails because the image credential is absent,
  and says what it did
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:34.367988+00:00'
updated_at: '2026-11-08T07:13:44.294906+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
For the control app, the image-credential deploy step: pushes the credential as a secret when it is set in the operator's environment; leaves an already-stored secret alone and says so when it is unset there but present in the deployment; and, when it is absent everywhere or the stored secrets cannot be read, reports that the deployment will have no image generation and exits successfully. Under a dry run it reports which of these it would do and changes nothing. For any app other than the control app it does nothing.

## Verification
Run the deploy step with the credential set, unset-but-stored, unset-and-absent, store-unreadable, and with dry-run on. Assert the exit status is success in every case, the reported message for each, and that a secret is written only in the push case.