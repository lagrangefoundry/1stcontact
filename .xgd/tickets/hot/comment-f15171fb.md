---
uid: comment-f15171fb
id: COMMENT-4725
type: comment
title: Comment on request REQ-364
created_by: xgd
created_at: '2026-10-02T22:49:35.803646+00:00'
updated_at: '2026-10-02T23:41:46.171564+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-5776c96e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "02f342f7-4fef-4c82-8008-50117bb4404a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="98b21651-667b-469b-8d1c-e9ef13f517ee-user" -->

<!-- xgd-chat role="user" ts="2026-10-02T22:46:19.559149+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="98b21651-667b-469b-8d1c-e9ef13f517ee-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T23:41:46.085133+00:00" -->
#### Claude
Still mapping the code. I've read the plan core and the change notice; now I'm tracing how a turn gets its reminders, and how the coordinator's room reaches the plan.

Reading the shared split component to check it can stack vertically, which the panel-over-chat layout needs.

Still reading the chat pane, looking for where a turn ends so the panel can re-read the plan then.

Checking how the room names each member's session, so the change notice can find the site for either agent.

I've settled the shape (schema, ops, route, notice, panel). I'm checking the plan's type-pack declaration, then I'll write the ticket body and cut the branch.

I have enough to start. I'm recording the design decisions in the ticket, then cutting the branch.

Branch cut. Starting with the core: the asks schema, its rules, the agent operations and the client's answer, all in `plan-core.ts`.

Now editing `plan-core.ts`: constants and types first.

Now the ask rules in `checkPlan`.

Now the panel projection and the per-turn plan reminder learn about asks.

Next, the agent operations (`set_ask`, `withdraw_ask`, `fill_ask`), the client's answer, and the notice renderer.

Now the surface declaration: three operations, the `KeepAsks` group, and three new refusal codes.

The JSON rewrite reformatted the whole file. I'll redo it as a text splice so the diff only shows what was added.

Core done. Now the storage port and the type pack carry `asks`.

Now the host: the coordinator's plan surface, a `plan_changed` stream event, and the answers notice in each member's reminder. Reading the rest of the turn loop first.

Another session just changed `plan-core.ts` and `plan-surface.json` in the main checkout. Checking what changed before I go further, since my work touches the same files.

REQ-361 just landed on xgd-working and changed every plan write to return only what it wrote. I'll merge xgd-working into my branch now and adapt the ask operations to that shape.

Resolving both conflicts by keeping both intents: REQ-361's "a write confirms what it wrote" plus the asks, whose writes will return the ask as it now stands.

Merged REQ-361 in cleanly; ask writes now return just the ask. Typechecking before moving on to the host wiring.

Typecheck clean. Now `host-core.ts`.

Now `roles.ts` (the signal and two providers) and `priming.json` (the reminder entries).

Now the notice in `session-delta.ts`, with its own cursor on the session's chat ticket.

Wiring it into the Worker host in `ai.ts`.

Now the client's route. Checking how other routes confirm a site belongs to the business.

Adding the panel's view to `plan-core.ts`, then the two routes.

Routes typecheck. Now the browser side: transport helpers in `api.js`.

Transport done. Now the panel component itself. Checking the builder's CSS conventions for the split host and chat pane first.

Writing the panel component, `plan-panel.js`, with its labels in `config.js`.

Now wiring the panel into `app.js` and `chat.js`: a vertical split in the chat half, and re-reads on `plan_changed`, turn end and site open.

CSS for the chat half and the panel.

Now the priming: the consultant's few lines of panel rules.

Everything is wired. Running the existing plan and group-chat suites to catch regressions before I write the new UATs.

One expected failure: REQ-356's test pins the exact plan field list, and this ticket adds `asks` to it by design. I'll update that assertion and note it in the ticket.

Writing the node UAT for the plan surface now: validator, ownership rules, withdrawals, the notice text, and both roles' tool manuals.

All 8 pass. Now the workers UAT (real route, D1 and ticket store, plus a turn). Reading how the REQ-356 and REQ-357 workers suites drive a turn and capture what the model was sent.

Now how the REQ-357 suite turns the room on and drives a round through both members.

Checking how other workers suites upload material, so the upload-against-an-ask case uses the real route.

All 4 pass on the first run. To be sure they actually bite, I'll briefly remove the notice wiring and check the notice cases fail.

The notice cases fail without the wiring and pass with it, so they test the right thing. Now the panel UAT in jsdom; reading how the REQ-357 panel suite mounts the builder.

Server-side UATs pass. Writing the panel's jsdom UAT now: drawing, saving, re-reading mid-turn, and the divider surviving a reload.

All 4 panel UATs run (not skipped) and pass. Next is DOC-64, the system document both agents read. Reading its structure before adding DOC-65's §6–§7.

Adding to DOC-64: `asks` in §5 (the frontmatter list and who-writes-what), and a new section carrying DOC-65 §6–§7, which takes precedence where they conflict.

The one failure, REQ-341 in the delegation suite, is a known pre-existing failure on clean xgd-working, unrelated to this work. Now the workers suites that drive turns and reminders.

All 8 workers suites pass (65 tests). Confirming the `req115` failures are the worktree's environment by running the same file in the main checkout.

Committed. Updating the ticket body to describe what was built, keeping the existing content.

Ticket body updated. Now the merge back: lock, merge xgd-working into the branch, bump the version there, then fast-forward.

Only ticket files came in, so no code to re-test. Bumping the version on the branch.

Fast-forwarded. Recording the commits and moving the ticket to `free_coded`.

The ticket is at `free_coded` with all three commits, and the branch is cleaned up. One last check: my node and panel UATs plus `req115` on the merged main checkout.

One file failed without any failing test, which usually means a collection error. My two runs overlapped (the first was backgrounded and kept going), so I'll check which file it was.

REQ-364 is built and merged into xgd-working at version 0.2.441. The ticket is at `free_coded` with its three commits recorded, and the ticket body now describes the implementation as built.

**What the client sees.** A plan panel sits above the chat, behind the same draggable divider the builder already uses. It can be resized or collapsed, and both are remembered across reloads. It shows:
- **The phase** in plain words, such as "Rough first version" or "Refining".
- **Needs your answer:** every open question, with its one-line reason and an input that matches its type. The client can type, pick, skip, or upload a document instead.
- **What you've told us:** answered and skipped questions, each with a Change button.

Answers save as the client goes, nothing starts a turn, and no chat message is generated. The panel updates while the consultant works: when it adds a question mid-turn, when a turn ends, and when a site is opened.

**What the agents get.**
- **Three new tools:** add or edit a question, withdraw it with a reason, and fill it in from an uploaded document. An agent can never overwrite or withdraw an answer the client gave.
- **The next-turn notice** names what the client answered, skipped or changed, with the values. It leaves out the agent's own writes and stays within 600 characters.
- **Priming:** the consultant's priming now carries the panel rules: one topic and at most one question per message, and announce the stage before going away to work.
- **DOC-64** has a new §10 carrying DOC-65 §6–§7, marked as taking precedence where the two conflict.

**Decisions you should know about:**
- **The coordinator didn't have the plan tools.** The ticket assumed it did, which is also why it made no plan writes in the Charlie session. It now has them, so with the group chat on, either agent can keep the questions and each hears the client's answers on its own next turn.
- **One REQ-356 test changed.** It pinned the plan's exact field list; it now includes `asks`.
- **Merged mid-build.** REQ-361 landed on the same plan files while I worked. I merged it in, so writing a question returns just that question, not the whole plan.

**Tests.** The new tests all pass: 8 for the plan rules, 4 for the panel itself, and 4 that drive the real routes and turns with the group chat both off and on. Removing the notice wiring makes the two notice tests fail, so they check the right thing. The existing plan, group-chat, priming and builder suites also pass. Two failures were not caused by this:
- The REQ-341 case in the delegation suite also fails on a clean xgd-working.
- `req115-builder-shell` fails in a fresh worktree because the built `dist-assets` folder is missing; it passes 10/10 in the main checkout.

**Two things for you to do:**
1. Regenerate the system landscape so the agents read the new DOC-64. It needs your admin token, so I didn't run it. From the main checkout:
   ```
   NODE_USE_ENV_PROXY=1 CLOUDFLARE_API_TOKEN="$(cat ~/Documents/secrets/1c_Admin_Token)" ./bin/kb-release
   ```
2. To see the panel on dev, deploy with `bin/deploy --env dev`.

<!-- xgd-chat-end -->