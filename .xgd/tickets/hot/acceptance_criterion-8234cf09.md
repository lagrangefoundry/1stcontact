---
uid: acceptance_criterion-8234cf09
id: AC-420
type: acceptance_criterion
title: Deploy pipeline ships both Workers on promotion to the production branch
created_by: xgd
created_at: '2026-07-08T19:04:39.094899+00:00'
updated_at: '2026-07-08T19:04:39.094899+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0ceaf24d
  kind: behavior
  regression_only: false
---

## Criterion
The deploy pipeline is triggered by a push to the `xgd-stable` branch, runs at most one deploy at a time (serialized so concurrent promotions cannot overlap), makes both Cloudflare credentials (API token and account ID) available to the deploy job, and deploys both the public-site and control-app Workers to the production environment.

## Verification
Inspect the deploy pipeline definition and assert: (1) it triggers on push to `xgd-stable`; (2) it declares a concurrency group that serializes runs; (3) both Cloudflare secrets are exposed to the deploy job environment; (4) it performs a production deploy of both the public-site and control-app Workers.
