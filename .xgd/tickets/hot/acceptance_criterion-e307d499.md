---
uid: acceptance_criterion-e307d499
id: AC-2280
type: acceptance_criterion
title: Mail credential is never committed, is redacted in router output, and the deploy
  hook pushes, keeps or warns-and-continues; SPF/DKIM/DMARC runbook exists
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:16.885576+00:00'
updated_at: '2026-11-04T18:00:34.755682+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
The mail-provider credential is handled as a secret: (1) no committed file assigns it a value; (2) any error or message the control app's router shows has the credential's value redacted, exactly as the model-provider key is; (3) the control-app deploy step resolves it three ways — supplied in the deploy environment → pushed to the Worker's secret store; not supplied but already stored → left alone and reported as such; neither (including when the store cannot be read) → a loud warning that the Worker will record but not deliver mail, and the deploy continues (exit 0); (4) the deploy step does nothing for any app other than the control app. An operator runbook beside the control app documents why a third-party provider is used and the SPF, DKIM and DMARC records the sending domain needs.

## Verification
Scan committed files for an assignment of the credential and assert none. Through the router, provoke an error whose text contains the credential value and assert the shown text does not. Run the deploy hook with a stubbed wrangler for each of: supplied, stored-only, neither, store-unreadable, and non-control-app; assert push / no push + "already stored" / warning + exit 0 / warning + exit 0 / no-op respectively. Assert the runbook exists and mentions SPF, DKIM and DMARC.