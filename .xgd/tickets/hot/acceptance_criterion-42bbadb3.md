---
uid: acceptance_criterion-42bbadb3
id: AC-2470
type: acceptance_criterion
title: Half the REST credential pair is a named error naming the missing variable,
  with no fallback to the binding
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:06:03.644493+00:00'
updated_at: '2026-11-08T21:30:49.852955+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

When exactly one of `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` is set, the
deployment refuses with a named partial-credential error. The error names the
variable that is missing and the one that is present, says both are needed
together, and says to set both, or neither to use the binding.

There is no fallback to the `AI` binding, even when one is declared. The refusal
reaches the caller from every place that asks whether the deployment can embed:
the project knowledge base, the session's project-half gate, the upload indexer,
and the system knowledge base, whose "nothing can embed" path otherwise answers
quietly.

Falling back would leave an operator who set the token and forgot the account id
on the expiring remote preview session they meant to switch off, while they
believed they had switched it off.

## Verification

For each half (only the account id; only the token), with a binding stub
declared: open the project knowledge base and the system knowledge base, and ask
the session and upload gates. Assert each raises the partial-credential error
naming the missing variable, and that the binding stub received no call.