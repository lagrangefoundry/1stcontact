---
uid: acceptance_criterion-020369c0
id: AC-1664
type: acceptance_criterion
title: Every environment has the same embedding model available, and its absence refuses
  by name, naming both the binding and the REST-credential remedy
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:30:46.026510+00:00'
updated_at: '2026-11-08T21:05:57.944095+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

Every environment the product runs in, local development and each deployed
environment, has an embedding model available to the client's knowledge base.
It is the same model the shipped corpus is indexed with, so index-time and
query-time vectors are comparable by construction. That holds whichever transport
reaches the model.

Where no model is reachable (no binding declared and neither REST credential
set), opening the client's knowledge base refuses with a message that names both
remedies:

- declare the model binding in the deployment declaration, under `[ai]` for local
  development and again under `[env.production.ai]`, which does not inherit it; or
- set both `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` to reach the same
  model over REST.

It does not go on to report a knowledge base that is searchable and returns
nothing.

Two vector spaces do not announce themselves: the symptom is not an error but
plausible-looking nonsense in the ranking. A knowledge base that quietly stops
knowing anything is indistinguishable, to the client, from never having been
told.

## Verification

Assert the deployment declaration names the model binding for local development
and restates it for each deployed environment, rather than relying on
inheritance. Open the client's knowledge base with no binding and no credential.
Assert that it refuses with the named not-configured error, that the message
names the binding remedy (`[ai]` and `[env.production.ai]`) and both REST
credential variables, and that no empty-but-valid knowledge base is returned.
