---
uid: report-6992a9ae
id: REPORT-1765
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-10T08:48:15.414756+00:00'
updated_at: '2026-08-10T08:48:15.414756+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-e59210c5
  plan_item_index: '5'
---

Story and criteria are in place, verified as 9 children of the story.

**Grounding notes** (intent read first, then code):
- The intent in force for this pane is **REQ-127**, not REQ-122 as originally written. REQ-122 gave the pane a site identity (held a slug, opened its own session, addressed turns by site, carried a generation guard); REQ-127 withdrew that clause explicitly. The criteria follow REQ-127 — the pane holds a conversation, the workspace turns a chosen site into one — but are phrased as observable outcomes, so they'd hold under either implementation. `apps/control-app/src/builder/chat.js:76` and `app.js:180` confirm the code matches.
- The draft-key migration REQ-127 declares (`builder-chat:<slug>` → `builder-chat:<sessionId>`, so pre-upgrade drafts are not found) is a one-time effect, recorded in Technical Context rather than as a criterion.
- **One AC is thinner on existing evidence than the rest**: AC-1066 (tool activity shown in the pane). The intent states it, and the pane is mounted with its tool area enabled, but current FC evidence asserts tool activity at the host's stream (`test_UAT_FC_REQ-122_chat_host.test.ts:200`), not in the browser pane. Flagged in Technical Context so regression surfaces it rather than absorbing it silently.
- Rail-collapse/drag-to-resize and the divider are left to CAP-85 / story-e674c60a (plan item 1 re-points AC-973), so nothing is duplicated here.
- CAP-90's own body names "the operator-facing pane" as *out of scope, a separate independently observable capability*, so this story went under a new **CAP-91 (capability-44a04848)** rather than into CAP-90 or the workspace capability.

```
Story #5 created for reconciliation bundle-e59210c5

Story UID: story-7f437d57
Title: See the conversation about the site I am looking at, right beside it, with its history and my unsent words intact
Type: feature
Acceptance Criteria: 9 created

Progress: 5 of 8 plan items complete
```
