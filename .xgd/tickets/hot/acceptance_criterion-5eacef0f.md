---
uid: acceptance_criterion-5eacef0f
id: AC-2124
type: acceptance_criterion
title: The platform-tenant setting is consulted only by scope resolution and identity,
  asserted over the whole control-app source
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:26:15.884604+00:00'
updated_at: '2026-11-01T10:26:15.884604+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
Across every source file of the control application, the deployment's platform-tenant setting (`TENANT_ID`) is read only by the scope resolver and the identity module, where it names the platform's own business. No store opener, router, knowledge-base, or AI-host code reads it. A new reader added anywhere else makes the check fail. The check walks the source tree and does not rely on a hand-maintained list.

## Verification
A source-level UAT scans every file under the control-app source tree for reads of the setting and asserts that the set of files containing one is exactly {scope resolver, identity}.
