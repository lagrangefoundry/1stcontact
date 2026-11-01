---
uid: acceptance_criterion-9be44881
id: AC-2123
type: acceptance_criterion
title: On the loopback dev-open path, every request operates the configured platform
  business and any named target is ignored
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:26:09.850934+00:00'
updated_at: '2026-11-01T10:36:59.685771+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
When the Worker runs unconfigured for local development (dev-open: Access gate and admission both skipped):
- every request operates the business named by the deployment's platform-tenant setting
- a `/b/<other>/` prefix does not change which business is operated. It is stripped and ignored, never honoured without an identity to authorise it.
- if the platform-tenant setting is unset or blank, the request fails with a configuration error (HTTP 503) whose message says TENANT_ID is not configured and names `wrangler.toml`. No default business is invented.

The deployed Worker never takes this path, because it is gated by the same condition that skips the Access gate.

## Verification
Under dev-open, make unprefixed and `/b/<other>/` requests and assert both return the platform business's data. Clear the platform-tenant setting and assert the 503 with the configuration message.