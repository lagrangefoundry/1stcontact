---
uid: acceptance_criterion-020369c0
id: AC-1664
type: acceptance_criterion
title: Every environment has the same embedding model available, and its absence refuses
  by name rather than reporting an empty knowledge base
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:30:46.026510+00:00'
updated_at: '2026-09-11T03:43:39.362486+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

Every environment the product runs in — local development and each deployed
environment — has an embedding model available to the client's knowledge base,
and it is the same model the shipped corpus is indexed with, so index-time and
query-time vectors are comparable by construction.

Where no model is available, opening the client's knowledge base refuses with a
message naming the missing configuration and every place it must be declared. It
does not proceed to report a knowledge base that is searchable and returns
nothing.

Two vector spaces do not announce themselves — the symptom is not an error but
plausible-looking nonsense in the ranking — and a knowledge base that quietly
stops knowing anything is indistinguishable, to the client, from never having
been told.

## Verification

Assert the deployment declaration names the model binding for local development
and restates it for each deployed environment, rather than relying on
inheritance. Open the client's knowledge base in an environment with no model
available and assert it refuses, that the refusal names the missing binding and
the places it must be declared, and that no empty-but-valid knowledge base is
returned.