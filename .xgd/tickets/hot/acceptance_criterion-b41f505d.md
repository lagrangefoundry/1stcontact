---
uid: acceptance_criterion-b41f505d
id: AC-2322
type: acceptance_criterion
title: ACCESS.md points to bin/seed and bin/access-sim beside the real Access settings
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:25.103819+00:00'
updated_at: '2026-11-04T18:28:54.544067+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
`apps/control-app/ACCESS.md` has a section on signing in locally as a seeded person. The section gives the commands to run `bin/seed`, generate the env with `bin/access-sim --print-env`, start the simulator and start the builder against it. It also states that the seed creates no operator and that `PLATFORM_ADMINS` is how a privileged person comes to exist.

## Verification
Read ACCESS.md and assert that it references both commands, the `--print-env` step, and the PLATFORM_ADMINS statement in the local sign-in section.