---
uid: acceptance_criterion-64972132
id: AC-2475
type: acceptance_criterion
title: Neither REST credential variable is named in the committed wrangler.toml, in
  any environment
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:06:11.029912+00:00'
updated_at: '2026-11-08T21:30:47.913928+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

Neither `CLOUDFLARE_ACCOUNT_ID` nor `CLOUDFLARE_API_TOKEN` is named anywhere in the
control application's committed deployment declaration (`wrangler.toml`), in any
environment: not in `[vars]`, not in `[env.production.vars]`, not elsewhere.

The token is a bearer credential and the declaration is committed. `[vars]` would
publish it, and the production vars would push it to the deployed Worker, which
would also switch production off the in-datacentre binding. Both values are
dev-only secrets that live in `.dev.vars`. This is the same rule the declaration
already applies to `RESEND_API_KEY`.

## Verification

Read the control application's `wrangler.toml` and assert neither variable name
appears in it.