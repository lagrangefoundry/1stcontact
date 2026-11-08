---
uid: acceptance_criterion-268d4f3c
id: AC-2318
type: acceptance_criterion
title: Both simulator token shapes pass the Worker's real verifier; a service token
  carries common_name and no email
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:21.914031+00:00'
updated_at: '2026-11-08T02:04:18.677252+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
  title: Both simulator token shapes pass the Worker real verifier; a service token
    carries common_name and no email
---

## Criterion
With the simulator running and the Worker configured from `--print-env`, both token shapes the simulator mints are accepted by the product's real Access JWT verifier, which fetches keys from the simulator's published JWKS over `http://`. Nothing in the verifier is stubbed.

- **Person token.** A token from `/mint?email=<address>` carries an `email` claim, and the verifier reports that email as the identity. Tokens default to a 30-day lifetime. `/mint` without `email` answers 400.
- **Service token.** The `cf-access-jwt-assertion` the simulator mints when it exchanges its service-token pair carries a `common_name` claim (the client id with a trailing `.access` removed) and **no** `email` claim, the same shape Cloudflare mints. The verifier accepts it and reports it as a service token of that name, not as a person.

## Verification
Start the simulator, mint a person token, and verify it with the product's own verifier, configured with the simulator's team domain and aud. Assert acceptance, the identity email, and an expiry of about 30 days. Assert that `/mint` without `email` returns 400. Then send a request carrying the simulator's pair through it to a stub builder, decode the forwarded assertion, and assert it has `common_name`, has no `email`, and is accepted by the same verifier as a service-token identity.