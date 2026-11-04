---
uid: acceptance_criterion-268d4f3c
id: AC-2318
type: acceptance_criterion
title: A token minted by bin/access-sim passes the Worker's real Access verifier
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:21.914031+00:00'
updated_at: '2026-11-04T18:28:56.611955+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
With the simulator running and the Worker configured from `--print-env`, a token from `/mint?email=<address>` is accepted by the product's real Access JWT verifier, fetching keys from the simulator's published JWKS over `http://`. The verifier reports the minted email as the identity. Nothing in the verifier is stubbed. Tokens default to a 30-day lifetime. `/mint` without `email` answers 400.

## Verification
Start the simulator, mint a token, and verify it with the product's own verifier, configured with the simulator's team domain and aud. Assert acceptance, the identity email, and an expiry of about 30 days. Assert that `/mint` without `email` returns 400.