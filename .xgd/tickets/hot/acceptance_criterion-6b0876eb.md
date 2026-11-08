---
uid: acceptance_criterion-6b0876eb
id: AC-2469
type: acceptance_criterion
title: With neither REST credential set, embedding uses the AI binding exactly as
  before, so production is unchanged
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:06:00.795704+00:00'
updated_at: '2026-11-08T21:06:00.795704+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

When neither `CLOUDFLARE_ACCOUNT_ID` nor `CLOUDFLARE_API_TOKEN` is set, embedding
goes through the `AI` binding exactly as a deployed Worker always has. No
credential is needed and no REST request is made. Production sets neither
variable, so nothing about a deployment changes.

## Verification

With neither variable set and a binding stub that returns vectors, open the
project knowledge base and run an embed. Assert the binding stub received the
call for the shipped model and that no outbound REST request was made.
