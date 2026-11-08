---
uid: report-c481c536
id: REPORT-11464
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T13:56:43.067095+00:00'
updated_at: '2026-11-08T13:56:43.067095+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-0d00566a
  plan_item_index: '4'
---

```
Upgrade mutations applied for plan item 4 of 8

Target Stories: STORY-144
Primary Story UID: story-1500b111
Stories Modified: 1
ACs Modified: 2
ACs Added: 4
ACs Removed: 0

tickets_modified:
  stories:
    - "story-1500b111"
  acceptance_criteria:
    modified: ["acceptance_criterion-c3e5522d", "acceptance_criterion-bf0d2b7c"]
    added: ["acceptance_criterion-920b6789", "acceptance_criterion-77a6b131", "acceptance_criterion-c57b85c7", "acceptance_criterion-89e46f3c"]
    removed: []

Progress: 4 of 8 plan items complete
```

**What changed, against REQ-213 and its chat thread, and checked in `router.ts`, `material.ts` and `builder/library.js`:**

- **STORY-144:** the story now says an uploaded file's *What it is for* can be corrected. It says only uploads can be corrected, and the server works out whether a file may appear on the site from its role, never from the request. Changing a file to a site asset places it on the site, and a failed placement doesn't undo the change. Changing it back to background information is refused 409 once the file is on a site. After a change the whole rights block repaints. Scope, Technical Context and Dependencies (STORY-145) are updated to match.
- **AC-1717 and AC-1718:** the rights record is read-only except an upload's role. On an upload the editable fields are the description and the role. Rights and *may appear on the site* stay read-only everywhere.
- **New ACs:**
  - **AC-2458:** correcting the role. It covers the select's labels, picking a label without a save button, a 400 for a missing or misspelled role, and the full repaint.
  - **AC-2459:** fetched and captured material are refused 403 and offered no control. This includes a capture the client owns that could otherwise be published.
  - **AC-2460:** changing a file to a site asset places it on the site, which the server picks from the business's own sites. Zero sites, several, or a store that won't open mean "not placed", not a failure. A failed placement still returns 200 and keeps the role change.
  - **AC-2461:** changing a placed file back to background information is refused 409 and nothing changes.

**Two decisions recorded under Reconciliation Decisions,** for places where REQ-213 says nothing:
- Material with no recorded origin is treated as uploaded, by both the screen and the server.
- A missing uid on the role route gets a 400.

The code matches the intent everywhere I checked, so nothing is flagged as a code issue. The upload path's own behaviour (it still places, and still refuses a background-information upload) belongs to the upload story and is left out of STORY-144.

Each ticket create also triggered a sandbox block on `github.com:22`, probably a git push. The tickets were written locally and all four new ACs show as children of STORY-144. Any sync to the remote didn't happen from here.