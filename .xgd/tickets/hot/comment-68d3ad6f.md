---
uid: comment-68d3ad6f
id: COMMENT-4644
type: comment
title: Comment on request REQ-357
created_by: xgd
created_at: '2026-10-01T23:11:16.482174+00:00'
updated_at: '2026-10-02T00:27:49.203024+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ace901e5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2ecfa1e3-ec84-4f34-9332-989377d63e01",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4071ecc6-9480-4050-98dd-3ebf0453c21d-user" -->

<!-- xgd-chat role="user" ts="2026-10-01T23:08:50.620075+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4071ecc6-9480-4050-98dd-3ebf0453c21d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T00:27:46.191667+00:00" -->
#### Claude
Mapping the builder chat host and the framework's group-chat API (two background agents running); meanwhile reading the design-context tickets.

Checking that the installed framework copy actually ships the group-chat API (webui-room is present).

Found the framework's reference host (`ai_host.mjs`) that runs a room end to end; reading its wiring.

Reading the host core (3.3k lines) and the control-app AI glue to understand the consultant turn path.

Reading the installed framework's `group.js` (room API) directly — I'll need it in hand for implementation.

Reading the control-app's AI routes (`/api/ai/session`, `/prompt`, `/reattach`) to see how a turn is driven and stopped.

Reading `webui-chat`'s speaker-attribution and follow-mode API: our chat panel could likely render the room itself, without vendoring the heavier `webui-room`.

Now looking at how the delegation switch is stored and migrated (D1 table, `manifest.json`) so the group-chat switch can follow the same pattern.

Checking the Library and L1 declarations' read groups, and how the consultant's backend picks up its `backends.json` entry.

Checking whether the framework accepts a new `claude_assistant` backend name in `backends.json`.

I have the design. Moving the ticket to `free_coding` and cutting the branch.

Provisioned the worktree. Starting with storage: migration, harness marker, then the settings module.

Writing migration `0023` (a nullable `group_chat` column, NULL = off) and registering it with the harness.

Now the settings module: read/write of the group-chat column and a resolver the host can ask per request.

Now wiring the switch and the ticket store through `chatHost` → `workerHost` into the host deps.

Config next: the `claude_assistant` backend entry, the assistant's L1 grant, and the names config.

Writing the assistant's priming entries and the consultant's room framing into `priming.json`.

Adding the assistant role, its providers, and the consultant's room provider to `roles.ts`.

Now the core: host-core. First confirming the ticket store's `get`/`update` shapes and whether the product type pack accepts the room's chat fields.

Host-core is already ~3,300 lines, so the room helpers go in a new `group-core.ts`: names config, guard-field codec, contribution→turn mapping, and a small event channel.

Now host-core: making the site manager's composition follow the switch (rebuilt when it changes, since the backend registry is global per name).

Now the composition in `build()`: group tools on the consultant, plus the assistant's read-only box, backend, and role.

Now refactoring the consultant branch of `streamPrompt` into a reusable `siteTurn`, so each member round goes through the same turn path.

Now the room functions themselves: open the room (prepare and attach both members), replay it, run an exchange under a CAS guard, stop it, and read the private sessions.

Hooking `openSession` to answer with the room when the switch is on, then type-checking.

Both type-check clean. Adding the stop and private-session routes.

Server side type-checks. Before the UI, a first workers UAT to exercise it; reading the scripted model client first.

Writing the workers UAT. It uses a room-aware model double: it reads the brief to find the room, answers with `GroupSay`, and tells the members apart by the model their backend runs.

All 7 workers UATs pass on the first run. Now the UI: reading the chat panel's transport and `createChatPanel` options.

Writing the chat panel's room mode: the room is painted with speakers, the composer submits into the room, and Stop calls the durable stop.

Now the Debug tab: the second switch, plus each member's private session. Checking what the existing REQ-353 Debug-tab test pins first.

Writing the Debug tab additions: the group-chat switch beside delegation, and a read-only view of each member's private session.

Re-applying the remaining Debug-tab edits (the state-variable one is already in).

Running the existing chat-panel and Debug-tab UI suites to check the UI changes for regressions.

Existing UI suites pass (35/35). Adding a jsdom UAT for the room panel and the Debug-tab switch; checking how the REQ-122 panel test submits and stops.

Chasing a "process won't exit" warning that only the Debug-tab cases trigger.

Intermittent, gone on both re-runs. Next, the UAT that no display name appears as a literal. Checking where those strings already occur in the tree.

All REQ-357 UATs pass. Now the regression scope around what was touched: config validators, priming, backends, migrations, the host's turn path.

The batch run matched nothing because zsh doesn't word-split an unquoted variable; re-running with the list split properly.

Expected fallout: the REQ-182 UAT lists the corpus-free order's providers exactly, and `group.room` joins it, registered unconditionally like the delegation entry. Updating that expectation.

That failure is pre-existing: I only added the `assistant` block to `instances.json`; the builder's `ManageTextStyles` was already there. Confirming in the main checkout.

Confirmed pre-existing on xgd-working. Now the workers regression batch.

Those three look like upstream delegation drift, nothing to do with the room. Checking them on the main checkout.

All three fail identically on xgd-working, so they're pre-existing. Updating the REQ-353 Debug-tab comment that still claims there is no group-chat switch.

Checking whether `webui-chat`'s own CSS styles the speaker label, side and tone, or whether that lives only in `webui-room`'s stylesheet.

`webui-chat` leaves tone colours to the host, so adding minimal CSS for the two members' tones and the Debug tab's session view.

Checking every `managerFor` caller: one that defaults to ungrouped while the switch is on would rebuild the manager mid-room.

Type-check clean (the repo has no ESLint config). Re-running the REQ-357 suites and the two touched neighbours after the last edits.

Passes alone, so it's intermittent. Re-running the whole file to capture the failure.

Passed this time, so the stop case is flaky. Running the file several more times to catch the failure output.

Found it: `rooms()` returns every room in the business, and earlier cases leave theirs behind, so `[room]` sometimes picked another site's idle room. Scoping the helper to the site.

Stable across three runs. Re-reading the ticket body in case it changed while I built.

Body unchanged since the session began (only my status update touched it). Appending the implementation record to the ticket, keeping the existing body intact.

Ticket updated. Committing on the branch with explicit paths, not `git add -A`.

The project's free-coding process says no LLM attribution trailer, and project instructions win, so amending the unpushed commit to drop it.

Now locking and merging into xgd-working (merging working into the branch first, so the land is a fast-forward).

Merged cleanly, but REQ-356 (a plan surface) landed meanwhile. Checking for a migration-number collision and semantic overlap.

All green after the merge (20 workers, 35 node). Committing the plan-reminder addition.

Fast-forwarded. Adding the plan read to the ticket's record, then moving it to `free_coded` (the gate bumps the version itself).

Ticket is `free_coded` with three commits and version 0.2.431. Tearing down the branch and worktree.

Done. Saving two non-obvious facts to memory before reporting.

REQ-357 is implemented and merged into xgd-working. The ticket is at `free_coded` (version 0.2.431, three commits), and its body now ends with a record of what was built. I didn't ask you anything up front: the ticket and the framework code answered the design questions, so I made the remaining decisions myself and listed them below.

**What it does**
- **Switch:** a group-chat switch sits beside delegation on the Debug tab. It's off by default, and off leaves the builder exactly as it was. It's stored per business in a new D1 column (migration `0023`, which still has to be applied on deploy).
- **Room:** with it on, opening a site's builder conversation creates a room on its own chat ticket, using the framework's `createGroup`. Its members are the consultant's existing conversation, unchanged, and a new assistant session. Switching off brings you back to the consultant's conversation.
- **Assistant:** a new role on Haiku with its own `claude_assistant` entry in `backends.json` and its own priming. It can read the site, the knowledge base, the Library, the recorded decisions, the client's tickets and the room. It has no site writes, no delegation, no images and no screenshots.
- **Exchange:** the client's message is posted to the room and one `Orchestrator.run()` happens inside the prompt request. Each member round goes through the consultant's own turn path, so pending turns, spend, the turn clock, `site_changed`, the context guard and exhaustion narration all apply. On a cold isolate both members' junctions are loaded and attached first, so neither gets skipped.
- **UI:** the chat panel shows who said each contribution, the same live and on reload. Stop ends the exchange. The Debug tab shows each agent's private session.
- **Names:** "Alice" and "Bob" live only in `group-chat.json`.

**Decisions I made**
- **Stop works differently from the ticket's wording.** The existing control-record stop on its own can't reach a run in another isolate, because the running isolate doesn't re-read the junction mid-turn. So Stop sets a flag on the room ticket's one-at-a-time guard. The running isolate checks it between rounds and every 2 s during a round, then ends the round with the framework's control-record stop.
- **UI:** I extended our own chat panel instead of vendoring `webui-room`. `webui-chat` already draws speaker-labelled turns, and `webui-room`'s roster and settings aren't wanted here.
- **Room limits:** at most 6 member rounds per exchange and 2 posts per member, set in `group-chat.json`.
- **Plan reminder:** REQ-356 (the site plan) landed while I was working. The assistant now gets the same per-turn plan reminder as the consultant, since it should see what the consultant sees.
- **Leaving the page:** a client who closes the page doesn't end an exchange; it runs to completion. Stop is how to end one.
- **Reload mid-exchange:** the room is drawn as recorded so far and doesn't rejoin the live stream.
- **Other tickets' tests:** I updated one expectation in REQ-182's test (the new room-framing entry) and one comment in REQ-353's Debug-tab test, whose "no group-chat switch" claim no longer holds.

**Testing**
- All the new tests pass: 7 workers tests against the real route, D1, ticket store and junction Durable Object, 5 browser-panel tests, and 1 test that no display name appears in source. The stop test was flaky because of test isolation in the test itself; that's fixed and it passed three runs in a row.
- The only stand-in is the Anthropic client, scripted to post through the room tools. Nothing has run against the real model or in a real browser yet.
- Four existing delegation tests fail, but they fail identically on xgd-working without my change (REQ-295 ×3, REQ-296 ×1).

Promoting to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->