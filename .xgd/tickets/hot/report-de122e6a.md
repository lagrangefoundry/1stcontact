---
uid: report-de122e6a
id: REPORT-6781
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-10-27T19:42:47.686421+00:00'
updated_at: '2026-10-27T19:42:47.686421+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-5607a08d
  plan_item_index: '4'
---

```
Story #4 created for reconciliation bundle-5607a08d

Story UID: story-58b2cec4 (STORY-157)
Title: The Assistant Can See: A Read-Only Looking Surface With One Picture Vocabulary
Type: feature
Acceptance Criteria: 14 created (AC-2022 … AC-2035)

Progress: 4 of 9 plan items complete
```

The story is filed under CAP-92 (Site Control Surface). Its criteria cover:
- **Surface and grant:** the separate read-only surface with its six operations, the consultant's grant and manual, and the assistant still starting when the deployment has no browser.
- **Pictures:** the one picture shape and its schema, all five kinds resolving with their defaults, refusals for missing fields or unknown bundles and revisions, revisions shown with their own assets, and no operation able to name another site.
- **Screenshots:** an image reaching the model in the same tool loop, shrinking to a 1024px longest edge by averaging, the 3 MiB limit, and image bytes left out of the live activity stream.
- **No writes:** no operation moves the site's change counter.

`compare`/`check_fidelity` and capture with its safety checks are left to plan items 5 and 6.

**One conflict between intent and code:** the Worker never gives the assistant the surface. `shot.ts` exports `fidelityDeps`, but `workerHost` in `apps/control-app/src/ai.ts` only passes the knowledge surface. So a cloud assistant with a browser binding still can't see anything, which is the exact problem REQ-157 was written to fix. AC-2025 states what the intent asks for and is expected to fail until that's wired. The conflict is recorded in the story for the fix-coverage step.

**Criteria with no existing test yet:** the live activity stream leaving out image bytes, the no-browser case, revisions shown with their own assets, and the Worker wiring.

The tickets are committed locally. Each create tried to push to `github.com:22` and the sandbox blocked it, so nothing has been pushed.
