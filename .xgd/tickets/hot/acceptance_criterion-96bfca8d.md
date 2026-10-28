---
uid: acceptance_criterion-96bfca8d
id: AC-2058
type: acceptance_criterion
title: With only the API token set and a token that sees exactly one account, indexing
  resolves an embedder bound to that account; an explicit account id is used verbatim
  with no discovery request
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-28T20:54:45.321181+00:00'
updated_at: '2026-10-28T20:54:45.321181+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

Indexing resolves the Cloudflare account to embed in without the operator having to look it up:

- **The token alone is enough.** With `CLOUDFLARE_API_TOKEN` set, `CLOUDFLARE_ACCOUNT_ID` unset (or blank), and a token whose account listing returns exactly one account, the build resolves an embedder bound to that account's id and proceeds — no prompt, no error.
- **An explicit account id wins and costs no call.** With `CLOUDFLARE_ACCOUNT_ID` set to a non-blank value, that value (trimmed) is used verbatim as the embedding account, and **no** account-listing request is made to Cloudflare.
- **The named-embedder seam comes first.** With `LAGRANGE_KM_EMBEDDER` set, that embedder is used and neither Cloudflare variable is read — no token is required and no discovery request is made.

## Verification

With a stubbed Cloudflare API: set only the token, have `GET /accounts` return `success: true` with one account, and assert the resolved embedder is bound to that account's id and the token was sent as a bearer credential. Set both the token and an explicit account id, and assert the embedder is bound to the explicit id and that no request to the accounts endpoint was made. Set `LAGRANGE_KM_EMBEDDER` with no Cloudflare variables at all, and assert the named embedder is returned and no request is made.
