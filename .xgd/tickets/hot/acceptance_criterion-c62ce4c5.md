---
uid: acceptance_criterion-c62ce4c5
id: AC-2309
type: acceptance_criterion
title: Seeded Alice signs in to the builder at the current terms, with no membership
  on the platform business
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:14.188231+00:00'
updated_at: '2026-11-04T18:29:00.749134+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
After seeding, admitting `alice@plumbing.example` against the deployment configured in `wrangler.toml` succeeds: her person record is in the tenant the deployment names. She is not stopped by the terms gate, because every seeded person who signed up has accepted the terms version currently in force. Alice holds no membership on the deployment's own (platform) business.

## Verification
Seed, then admit Alice using the configured tenant. Assert that admission succeeds and that no terms re-acceptance is required: the stored terms version equals the current terms version. Assert that no membership links Alice to the platform business.