---
uid: acceptance_criterion-9463f606
id: AC-2468
type: acceptance_criterion
title: With both REST credentials set, every knowledge base embeds over REST and never
  touches the AI binding; a blank value counts as unset
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:05:59.209487+00:00'
updated_at: '2026-11-08T21:05:59.209487+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

When both `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are set, every
knowledge base embeds over Workers AI's REST API with that account and token. The
`AI` binding is never called, even when it is also declared, and it always is
under local development.

An empty or whitespace-only value counts as not set. Surrounding whitespace is
trimmed from both values before they are used.

Every gate that asks whether this deployment can embed reaches the same answer:
opening the project knowledge base, opening the system knowledge base, opening the
project half of a session, and indexing an upload. A REST-configured deployment
with no binding is never told it cannot embed.

## Verification

With both variables set and a binding stub that records calls, open the project
knowledge base and the system knowledge base, and run an embed. Assert the REST
endpoint for the configured account received the request with the token, and the
binding stub received no call. Assert that a session opens its project half and
that an upload is indexed with the binding absent. Repeat with one variable set
to `""` or whitespace: it behaves as unset, not as configured.
