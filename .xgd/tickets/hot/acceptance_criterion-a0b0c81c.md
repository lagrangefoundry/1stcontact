---
uid: acceptance_criterion-a0b0c81c
id: AC-2537
type: acceptance_criterion
title: The image converter binding is declared once, under the same name, in both
  the local and the production environment
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T17:46:04.659037+00:00'
updated_at: '2026-11-09T20:22:32.490218+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

The control app's deployment configuration declares the image converter binding under the same
name, `IMAGES`, in both the local environment and the production environment. A named
environment inherits no bindings from the top level, so declaring it in only one place would
leave local development converting iPhone photographs while the deployed Worker refuses every
one of them, with nothing visible locally to show it.

The converter the upload path uses is built from the binding under that declared name: an
environment holding the binding under it yields a converter that hands the bytes to that
binding, and an environment without a binding under that name yields no converter (the state
the upload route answers with its no-binding refusal, AC-2534).

Each environment declares the binding exactly once, so the configuration is still a valid
document that the deployment tool can load.

This criterion says nothing about what the live image service does with real HEIC bytes. That
depends on the Cloudflare account's plan, not on this repository.

## Verification

Parse the control app's deployment configuration with a real TOML parser, so that a table
declared twice fails the test. Assert an `IMAGES` image binding at the top level and under the
production environment. Then build the upload path's converter from an environment holding a
fake image binding under the declared name, convert some bytes, and assert the binding was
called and its output returned; build it from an environment with no binding, and from one with
the binding under a different name, and assert there is no converter.
