---
uid: report-ac91bed3
id: REPORT-1772
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-10T09:01:09.947136+00:00'
updated_at: '2026-08-10T09:01:09.947136+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-7f437d57
---

All nine names match `^test_UAT_AC\d+_\w+$`, one per AC, and the only tree change is the single new file.

```
UATs generated for story story-7f437d57 (plan item 5 of 8)

Story: story-7f437d57
Test file(s) created:
  - tests/reconciliation-builder-assistant-pane.test.ts

Tests written: 9
Tests passed: 9
Tests failed: 0

test_files_created:
  - "tests/reconciliation-builder-assistant-pane.test.ts"
```

**AC → test mapping** (AC IDs resolved from the injected UIDs via `xgd ticket get`):

| AC | Test | Observable asserted |
|---|---|---|
| AC-1062 | `..._the_secondary_pane_is_a_working_conversation_for_the_displayed_site` | `.chat-widget-messages` + `.chat-widget-input-bar` present; send button inert→live on typing; `data-chat-id` = the panel's site session |
| AC-1063 | `..._the_pane_replays_what_the_conversation_holds_on_open_and_after_reload` | `getMessages()` equals the session's turns in order with speakers; same after a fresh mount on persisted storage; empty site shows unhidden empty-state with its invitation |
| AC-1064 | `..._changing_site_changes_the_conversation_and_only_the_toolbar_chooses` | Both halves move together; unmixed both directions; exactly one `select` in the workspace and it is the toolbar's; no `setSite`/`getSite` on the pane |
| AC-1065 | `..._a_message_addresses_the_shown_conversation_and_the_reply_streams_in` | `streamPrompt` called with exactly `['site-beta', text]`; mid-turn snapshot shows partial reply; ends as exactly one assistant message |
| AC-1066 | `..._what_the_assistant_did_is_shown_in_the_panes_activity_area` | `.chat-tool-event-name` rendered in `.chat-tool-pane-body`; reply still shown and free of the tool name; a quiet turn leaves the area with zero events |
| AC-1067 | `..._an_unsent_draft_belongs_to_one_conversation_and_survives_a_round_trip` | Draft absent from the other site's composer, restored verbatim on return, nothing sent |
| AC-1068 | `..._an_assistant_that_cannot_run_is_explained_with_the_history_intact` | Pane mounts; all earlier turns intact; one appended note naming `ANTHROPIC_API_KEY` |
| AC-1069 | `..._an_unreachable_origin_is_reported_in_the_pane_not_left_blank` | Surface present; single assistant note containing "could not be reached" + underlying reason; not streaming; empty-state stood down |
| AC-1070 | `..._switching_faster_than_the_answers_arrive_leaves_the_last_chosen_site` | Held alpha open released after beta: pane on beta, none of alpha's turns, subsequent send addressed to beta |

**Notes worth carrying forward:**

- **No runtime code touched** — `git status` shows only the one untracked test file.
- **Boundary**: eight of nine drive through `mountBuilder` (the workspace entry point) against the real installed `webui-chat`/`webui-shell`/`webui-split`. Only the HTTP transport is injected, matching the established pattern in the REQ-122/REQ-127 suites. The shared `webui-*` store resolves correctly from this worktree (anchored to the main checkout at `/Users/martin/lagrangefoundry`), so `WEBUI_INSTALLED` is true and these suites genuinely ran rather than skipping green.
- **AC-1066 was written from the intent, per the story's evidence note** — prior FC evidence proved tool activity at the host's stream, not in the pane. It verifies in the pane (`.chat-tool-pane-body` DOM plus `getToolEvents()`) and passes, so the intent's claim holds where the criterion places it.
- **Adjacent regression scope is clean**: the 5 builder/chat suites (39 tests) all pass.
- **8 failures exist elsewhere in the full suite and are pre-existing** — `reconciliation-copy-edit-gesture`, `req11-structured-edit`, `req115-builder-composition`, `req117-builder-viewport-fill`, `req117-edit-loop-browser`. I verified these by re-running with my file removed from the tree entirely; they fail identically. Some are flaky browser tests (the failing file count varied 4↔5 between runs); `req11-structured-edit`'s two look deterministic and sit in `tools/generate/src/cli/edit.ts` validation. They are outside this story's scope, but `reconciliation-copy-edit-gesture` is story-3bf94bd4 from cycle 1 of this same reconcile run, so it may need attention downstream.
- One unrelated environment note: the claude.ai Gmail/Calendar/Drive MCP connectors are unauthenticated in this session and can't be authorized non-interactively. Nothing in this task needed them.
