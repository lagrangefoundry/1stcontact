---
uid: report-3e40c4e9
id: REPORT-7558
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-01T10:40:23.158615+00:00'
updated_at: '2026-11-01T10:40:23.158615+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-94dbe947
  plan_item_index: '6'
---

```
Story #6 created for reconciliation bundle-94dbe947

Story UID: story-0cd18650 (STORY-161)
Title: Terms of Service Gate: An Admitted Person Accepts The Current Terms Before Anything Behind Them Is Served
Type: feature
Acceptance Criteria: 11 created (AC-2132 – AC-2142)

Progress: 6 of 10 plan items complete
```

The story is filed under CAP-103 (Operator Access Gate) and depends on plan item 4 (admission). The code in `apps/control-app/src/terms.ts` matches REQ-169 and its comment, so there are no code-issue flags.

The 11 ACs cover:
- the terms page served at the requested URL, with never-accepted and out-of-date people treated the same
- a 403 for everything that isn't a page navigation, with the navigation test spelled out
- no-cache and no-index headers on the terms page and refusals
- acceptance as a JSON POST recording both the version and the time
- 415 for non-JSON and 405 for non-POST, leaving the record unchanged
- the same URLs answering normally after acceptance
- a version change prompting everyone again
- the full terms text on a page that loads nothing external
- `/terms` staying readable after acceptance, with the acceptance date
- an agree control only, with no recorded "decline"
- no terms check in loopback dev-open mode

Four behaviours REQ-169 didn't specify are written up under `## Reconciliation Decisions`:
- how a page navigation is told apart from other requests
- the 405 for non-POST requests to the accept endpoint
- the 204 response on a successful accept
- dev-open having its own AC

The sandbox blocked every ticket write's push to `github.com:22`. The story and ACs are committed locally only and haven't reached the remote.
