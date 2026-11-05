---
uid: report-e3f280e1
id: REPORT-11058
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-05T21:08:23.898645+00:00'
updated_at: '2026-11-05T21:08:23.898645+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-7988e925
  plan_item_index: '1'
---

I updated STORY-144 and its acceptance criteria to match the live Library (REQ-201). I changed no runtime code and created no new stories; nothing was run beyond reading the commit and the tickets.

- **Intent and code agree.** REQ-201's scope, sections 7–14 and their acceptance criteria all match commit 9fdf31c8, so nothing needed flagging as a code issue. The bundle ticket has no comments.
- **Five new ACs**, all under STORY-144:
  - **AC-2324:** a write made elsewhere (create, archive, an AI description landing) reaches the open tab and replaces just that row. Selection, the collapsed rail and the detail's scroll are untouched, and events for filtered-out material change nothing. A reset falls back to a full re-read and reopens the feed. A browser with no feed still gets the old redraw-after-own-writes Library.
  - **AC-2325:** `/api/material` returns `{material, seq}`, with the cursor read before the list. `/api/material/changes` is SSE: each frame's `id:` is its seq, a `ready` frame comes first, there are heartbeats, `Last-Event-ID` wins over `?since`, and a non-integer cursor gets a 400.
  - **AC-2326:** an event's row is the same as the list's row for that material. The description text is re-read once, only for the open detail, and not at all while its editor is open.
  - **AC-2327:** the feed carries only the scoped business's material, checked with a second business writing.
  - **AC-2328:** the baseline migration includes `ticket_changes` and `ticket_change_floor`.
- **AC-1715 changed:** a business switch now closes the feed before the re-read and opens a new one under the new business, even if the re-read fails. Destroying the panel also closes it.
- **Story body:** it now describes the live list and the feed and names REQ-136 as a dependency. Three behaviours the intent doesn't mention are recorded as Reconciliation Decisions: the opening `ready` frame, new rows appearing at the top of the list, and a feed with no cursor starting from now.

I left AC-1722 ("listing returns rows newest first…") alone even though the list response now includes `seq`, because AC-2325 covers that. Every ticket write printed a blocked SSH connection to `github.com:22` from the sandbox, but each one reported success locally, so the changes may not be pushed to the remote yet.

```
Upgrade mutations applied for plan item 1 of 7

Target Stories: story-1500b111
Primary Story UID: story-1500b111
Stories Modified: 1
ACs Modified: 1
ACs Added: 5
ACs Removed: 0

tickets_modified:
  stories:
    - "story-1500b111"
  acceptance_criteria:
    modified: ["acceptance_criterion-946ff3b5"]
    added: ["acceptance_criterion-c250440c", "acceptance_criterion-c7f66ec4", "acceptance_criterion-22912e9f", "acceptance_criterion-4388aced", "acceptance_criterion-cabfdebc"]
    removed: []

Progress: 1 of 7 plan items complete
```