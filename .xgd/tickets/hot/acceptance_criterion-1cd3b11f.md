---
uid: acceptance_criterion-1cd3b11f
id: AC-2208
type: acceptance_criterion
title: Existing contacts are placed on the pipeline by their invite stamp once, and
  the seeded platform operator starts at Invited
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:05:15.241331+00:00'
updated_at: '2026-11-01T20:12:51.962750+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0ea74f39
  kind: behavior
  regression_only: false
---

## Criterion
When the pipeline-stage migration is applied to a database holding contacts, every contact with an invite timestamp gets stored stage `invited`, and every contact without one gets `lead`. No contact's terms-accepted value changes. After migration, the platform operator account seeded at bootstrap is stored at stage `invited`, consistent with its seeded invite timestamp, so no seeded row's stage disagrees with its stamp.

## Verification
Apply migrations up to the one before the stage migration. Insert contacts with and without invite timestamps, then apply the stage migration. Assert each contact's stage is `invited` where an invite timestamp was set and `lead` elsewhere. Separately, run bootstrap seeding of a platform operator on a fresh database. Assert that the seeded row has a set invite timestamp and stage `invited`, and that it reads as Invited in the people API.