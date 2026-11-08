---
uid: report-c5c397f9
id: REPORT-11472
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T14:17:35.317163+00:00'
updated_at: '2026-11-08T14:17:35.317163+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-0d00566a
  plan_item_index: '5'
---

Upgrade mutations applied for plan item 5 of 8

Target Stories: STORY-104
Primary Story UID: story-7f437d57
Stories Modified: 1
ACs Modified: 0
ACs Added: 1
ACs Removed: 0

tickets_modified:
  stories:
    - "story-7f437d57"
  acceptance_criteria:
    modified: []
    added: ["acceptance_criterion-1b6c71ad"]
    removed: []

Progress: 5 of 8 plan items complete

What changed:
- **The code matches the BUG-69 intent.** `apps/control-app/src/builder/chat.js:184` takes an identity key with the session and uses it both to decide whether this is the conversation already on screen and to key the composer's saved draft. `apps/control-app/src/builder/app.js:762` builds that key as `<businessId>/<sessionId>`, or the bare session id when no business is selected. All three `setSession` calls that pass a session use it; the fourth clears the pane with `setSession(null)`. The id that turns are sent to is unchanged. Nothing in the code contradicts the intent, so no code issue is flagged.
- **STORY-104 body:**
  - "Following the displayed site" now says a business switch swaps the conversation even when both sites share a slug.
  - "Composing state per conversation" now says a draft never crosses businesses.
  - Technical Context explains why the pane is identified by business plus conversation.
  - A new dated entry under Reconciliation Decisions (2026-11-08, BUNDLE-41 item 5) explains:
    - why this is a new AC rather than a change to AC-1064 or AC-1067;
    - why the unchanged wire id is recorded but not claimed as a criterion;
    - that a workspace with no business selected uses the bare id.
- **New AC-2462:** covers the shared-slug business switch (transcript shown and draft kept with its business) plus a check that switching sites within one business still works.

When the new AC was created, the sandbox blocked a connection to `github.com:22`. The ticket itself was created and is linked to STORY-104, but nothing was pushed to GitHub from this step.