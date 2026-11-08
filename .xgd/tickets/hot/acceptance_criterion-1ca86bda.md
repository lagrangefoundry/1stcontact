---
uid: acceptance_criterion-1ca86bda
id: AC-2361
type: acceptance_criterion
title: A matching service-token pair sent to the simulator is exchanged for an assertion
  and reaches the builder as the mapped person
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T02:03:49.962689+00:00'
updated_at: '2026-11-08T02:03:49.962689+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
A request to any path other than the simulator's own (`/cdn-cgi/access/certs`, `/login`, `/mint`, `/cdn-cgi/access/logout`) that carries the simulator's `CF-Access-Client-Id` and `CF-Access-Client-Secret` pair is forwarded to the `--builder` origin as the real Access edge forwards it:

- it gains a freshly minted `cf-access-jwt-assertion` (service-token shape) and loses both `CF-Access-Client-*` headers, so the pair is spent at the simulator and never reaches the builder;
- its method, path, query string and body arrive unchanged; the builder's status, body and `Set-Cookie` headers come back to the caller, and the builder's redirects are returned to the caller rather than followed;
- with the Worker configured from `--print-env`, the builder admits the request as the person `SERVICE_TOKEN_IDENTITIES` maps the token to, so `bin/publish --origin <simulator>` with the pair from `--print-token` writes a site into the local store.

`--print-token` prints the pair as `export CF_ACCESS_CLIENT_ID='…'` and `export CF_ACCESS_CLIENT_SECRET='…'` for `eval`, and exits without starting a server. The pair defaults to `local-dev.access` / `local-dev-secret`; `--client-id` / `--client-secret` override it.

If the pair is right but the simulator has no address to act as (no `--service-email` and no `PLATFORM_ADMINS` entry), it answers 403 with a message naming both ways to supply one, and forwards nothing. If the builder does not answer, the simulator answers 502 naming the builder origin.

## Verification
Drive a real `bin/access-sim` in front of a stub builder. Send a POST with a body and the matching pair; assert the stub receives the same method, path, query and body, a `cf-access-jwt-assertion` the product's verifier accepts, and no `CF-Access-Client-*` headers. Assert `--print-token` prints both halves. With no address configured, assert 403, the guidance text, and that the stub saw nothing. The Worker-side admission of the mapped person is evidenced by the Access-gate story's service-token UATs.
