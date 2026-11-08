---
uid: comment-3a8e0dea
id: COMMENT-7932
type: comment
title: Comment on request REQ-661
created_by: xgd
created_at: '2026-11-07T20:45:07.360809+00:00'
updated_at: '2026-11-07T21:00:02.565957+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-a5772ca5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "740d9c3e-c594-4f90-b2f7-c99bb1173e3d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="8335b26c-9c46-4aea-8d91-a1bb66639a7b-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T20:43:44.488171+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="8335b26c-9c46-4aea-8d91-a1bb66639a7b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T21:00:00.373098+00:00" -->
#### Claude
Still surveying: the Settings tab pattern and test harness are clear. Next I'm setting the ticket to free_coding, cutting the branch, and reading the message and legal routes I'll call.

Now how the Shop tab switches between its Inventory and Orders modes, and how it's mounted in app.js.

Writing the server side: the legal overview module.

Wiring the legal route into the router and adding the "changes since" route to the message routes.

Now the client transport in `api.js`.

Writing the pane itself, `paperwork.js`.

Fixing two things: the re-read must pass its note through, and the two list-details and splits each need their own storage namespace.

Now registering the tab in `config.js` and mounting it in `app.js`.

Adding the `messages_changed` event to the chat pane (and its host-side constant for REQ-662 to emit).

Adding styles beside the Shop's rules in `builder.css` (not at the end of the file, which the REQ-408 story-board check owns).

Code is in place. Now the tests — first reading REQ-660's workers suite for its setup so the route UATs reuse it.

Writing the jsdom UAT that mounts the real builder and drives the tab.

Both suites pass (8 jsdom + 6 workers). Now the regression scope: tests that pin the tab strip, the chat event kinds, builder CSS, and REQ-660's routes.

Two of these are mine (tab-count/position pins in REQ-631 and REQ-353). For the business-scope and REQ-115 failures I'm checking a baseline in the main checkout before blaming the diff.

Now the workers suites around the routes I touched (REQ-660 messages, REQ-488 legal, REQ-239 settings session).

All 40 pass. Checking the project's typecheck/lint scripts before committing.

Typecheck is clean for the touched files. Next: version bump and commit. Checking how this project bumps its version.

Following the recorded order: commit the work on the branch, then lock, merge xgd-working in, bump, merge back, promote.

Committed. Now appending an "As implemented" section to the ticket body (existing body kept), so every UAT traces to language in it.

The flag is `--append-body-file`; re-running with the same section.

Ticket body updated with the original kept. Now the merge-back sequence: lock, merge xgd-working into the branch, bump, merge back.

Merged. Now promoting the ticket to free_coded.

REQ-661 is built and merged into xgd-working. The ticket is at `free_coded` (commits `bd246988…` and `dba8edfe…`, version 0.2.811) and is not a duplicate. The new tests pass: 8 that mount the real builder in a simulated browser (jsdom) and 6 against the real routes and database.

**What the client sees**
- A **Paperwork** tab, placed just before Settings, with an **Email | Legal** switch. Each mode has three panes: Items, Detail and an assistant pane. Until REQ-662 wires an assistant, that pane says "The Email assistant is not available yet." (or Legal). REQ-662 drops its conversation into that pane without any layout change.
- **Email:**
  - The list shows messages (name, on/off, audience, subject) and templates (name, default marker, how many messages use each).
  - A message's detail lets you edit its subject, markdown text, SMS text, template and on/off. Required placeholders are marked "must stay", and a refused save shows the server's reason.
  - It also has a mailbox preview with the fake values, **Send to me**, and a history list with **Revert**. A save shows "Saved — the next email uses this."
  - A template's detail shows a preview, the messages that use it, **Set as default**, and its history. It has no raw editor.
- **Legal:** for the 1st Contact business it lists Terms of Service, Privacy Notice and Beta Terms. Each shows every published version and how many people have accepted the current version, only an older one, or none. The counts never name anyone. A client business sees "This business has no required documents yet."

**Pieces REQ-662 will use**
- The pane publishes what is open in Detail (message, template or document).
- A new route, `GET /api/messages/changes?since=`, lists the edits made since a given time, so the assistant can be told what the client changed.
- The chat pane now handles a `messages_changed` event, which makes Paperwork re-read. `host-core.ts` defines it as `MESSAGES_CHANGED` for REQ-662 to send.

**Where it differs from the ticket** (both recorded in the ticket body):
- **Legal doesn't show drafts.** The build deliberately leaves drafts out of what the Worker serves, so there are none to show. Showing them would need a change on EPIC-29's side.
- **The Sender dropdown has one entry:** who the message is sent from today. REQ-660 left the From address unchanged, so the real choice arrives with REQ-663.

**Other test changes:** I updated two existing tests that pinned the old tab layout. REQ-353 now expects seven tabs, and REQ-631 now checks that Shop is before Settings rather than directly before it.

**Failures I left alone:** 7 tests in `reconciliation-builder-business-scope` fail the same way in the main checkout without my changes. The REQ-115 failures in the branch were side effects of running from a separate worktree, and its tab-label check passes there.

<!-- xgd-chat-end -->