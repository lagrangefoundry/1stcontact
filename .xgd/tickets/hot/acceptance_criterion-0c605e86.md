---
uid: acceptance_criterion-0c605e86
id: AC-2059
type: acceptance_criterion
title: A token seeing several accounts is refused listing each account's name and
  id; one seeing none is told its scope is the problem; a refused or failed discovery
  is diagnosed as a narrowly scoped token with Cloudflare's reason and the instruction
  to set the account id
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-28T20:54:46.684202+00:00'
updated_at: '2026-10-28T20:54:46.684202+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

When the account cannot be settled from the token, indexing is refused with a diagnosis specific to *why*, and each diagnosis names `CLOUDFLARE_ACCOUNT_ID` as the way past it. The three cases are never confused with one another:

- **Several accounts are named, never guessed.** A token whose listing returns more than one account is refused with a message stating how many accounts it sees, listing each account's name and id, and asking for `CLOUDFLARE_ACCOUNT_ID` to say which one the index belongs in. No account is picked.
- **No accounts is a scope problem, and says so.** A token whose listing succeeds but returns no accounts is told the token's scope is the problem (not that the build is broken), and that `CLOUDFLARE_ACCOUNT_ID` names the account explicitly.
- **An undiscoverable account is diagnosed as narrow scope.** If the account listing is refused — an HTTP error status such as 403, **or** Cloudflare's `success: false` envelope under a 200 — or the request cannot complete at all, the build is refused with a message that says Cloudflare could not be asked which account the token belongs to, carries the reason Cloudflare gave (or the HTTP status / transport error when it gave none), explains that listing accounts is a separate permission a Workers-AI-scoped token may lack so the credential is not necessarily wrong, and tells the operator to set `CLOUDFLARE_ACCOUNT_ID`. A `success: false` response is **never** read as an empty list and so never produces the no-accounts diagnosis.

## Verification

With a stubbed Cloudflare API and only the token set: return two named accounts and assert the error lists both names and both ids and names `CLOUDFLARE_ACCOUNT_ID`; return `success: true` with an empty list and assert the error names the token's scope; return 403 with an error message, and separately 200 with `success: false` and an error message, and assert each error carries that message, describes the narrow-scope case, names `CLOUDFLARE_ACCOUNT_ID`, and does not contain the no-accounts wording; make the request fail at the transport and assert the same narrow-scope diagnosis.
