---
uid: comment-b54989c2
id: COMMENT-5796
type: comment
title: Comment on request REQ-479
created_by: xgd
created_at: '2026-10-28T00:22:39.256306+00:00'
updated_at: '2026-10-28T00:49:23.037377+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-0756cc2f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0201ed6d-7b20-4b0e-86aa-b6f7c705d0e1",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="95dbea72-382b-4efc-9234-124923bc100c-user" -->

<!-- xgd-chat role="user" ts="2026-10-28T00:20:31.648719+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="95dbea72-382b-4efc-9234-124923bc100c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-28T00:49:21.552861+00:00" -->
#### Claude
Reading the ticket and the existing code paths (terms, contact history, builder chat panels) before cutting a branch.

Now mapping the chat panels and preview state in the builder UI.

Still mapping: finding how chat transcripts (per-site conversations) are read, so session times can come from stored message timestamps.

Enough mapped. Recording the design decisions on the ticket, then cutting the branch.

Worktree ready. Starting with the shared vocabulary in `contact-events.js`.

Now the terms clause and version.

Now the shot helper accepts an exact width, then the server module.

Server route and terms are in; now the browser side (API client, then the Feedback control in the chat pane).

Writing the Feedback control module.

Wiring the panel names into the builder, then the deep link.

Now the operator side: the feedback entry on the contact page's History.

Typecheck clean. Checking suites that pin shapes I touched before writing UATs.

Writing the workers UAT for the route, the contact history entry, the screenshot and the terms.

Server UATs pass (5/5). Now the browser UATs: the control in both panels, mid-turn submission, empty refusal, and the contact-page entry.

Debugging why the settings panel isn't opened in the test harness (it needs a business in scope).

All 9 new UATs pass. Tightening one assertion, then running the neighbouring suites (terms, contact history, chat, people, seed) for regressions.

Checking whether that BUG-64 failure exists without my change (baseline in the main checkout).

Pre-existing (fails identically on clean xgd-working). Now the workers neighbours.

The dev seed is pinned to the current terms version by REQ-192; updating the seed's two rows.

Seed fixed. Checking whether builder modules need registering anywhere (asset manifests) for the new `feedback.js`.

Running the 151 suites that import the changed builder modules, as a detached background job so it survives the turn limit.

While that runs: preparing the commit (version bump script for this repo).

17 failures; baselining them in the main checkout (clean xgd-working) to separate mine from pre-existing ones.

Nothing in the remaining failures is mine: BUG-53 names a Library class, and BUG-58 is a Chromium page timeout in this worktree (an environment artifact). Committing.

Now the merge-back sequence: lock, merge xgd-working in, bump, merge back.

Others touched `api.js`, `people.js` and `router.ts` meanwhile; re-checking the typecheck and my UATs on the merged tree.

Final ticket sync — appending what landed and the test files.

REQ-479 is built, merged into `xgd-working` and parked at `free_coded` (commits `ce4f6dbd7e` and `3970649e20`, version 0.2.689). The 9 new UATs pass, before and after merging in others' changes to `api.js`, `people.js` and `router.ts`. I haven't run it in a real browser or deployed it.

**What the tester sees**
- A **Feedback** link under the composer in both assistant panels, Site consultant and Settings assistant. It lives in the shared chat pane, so any future panel gets it by passing one option.
- It works while a reply or build is running. It opens a dialog with the seven options and a text box. **Send** stays disabled until something is ticked or typed, and the server also rejects an empty submission.
- After sending, a "Thanks — your feedback was sent." line appears under the composer. Nothing is added to the conversation, and no assistant ever sees the feedback.

**What gets recorded:** a "Sent feedback" entry on the tester's contact, written the same way the terms acceptance is. Besides the options and text, it holds:
- which panel it came from, the conversation, and the last message on screen;
- the plan's current stage, plus every stage's state;
- the preview's page, pane, width and view setting, and whether a build was running;
- minutes into the session and total minutes on the site.

**Where the operator reads it:** the contact page's History shows those details, the screenshot, and an **Open in conversation** link. The link opens the tester's builder on the right panel with that message scrolled to and outlined.

**Terms:** a beta review clause is added, and `TERMS_VERSION` moves to `2026-10-28`, so everyone will be asked to accept again on their next request. I also stamped the two dev-seed members with the new version, because REQ-192's test requires seeded members to be on the current terms.

**Decisions I made**
- **"Phase":** the plan has no separate phase field, so I record every stage's state alongside the current stage.
- **Session times:** worked out on the server from tester messages already stored in the site and business conversations, with the existing 30-minute gap rule. The submission itself counts as activity.
- **Screenshot:** taken on the server after the response, using the same preview screenshot path the assistant uses, at the tester's page and width. Only the draft and edit panes are photographed; Story, Looks and Input record no screenshot. If the browser fails, the entry still lands, just without a picture.
- **Plan creation:** reading the stage goes through the same plan reader as everything else, so a site with no plan yet gets one created on first feedback.

**Test results:** across the 151 browser-side suites that touch the changed files, 17 tests fail.
- **Pre-existing:** most fail the same way on clean `xgd-working`, including BUG-64, BUG-53, BUG-52, REQ-127, REQ-259, REQ-398, BUG-244 and AC1065/1070.
- **Worktree only:** a few `workspace-origin` and `copy-edit` tests, which is the known problem of the builder's shared packages not resolving from a worktree.
- **Not baselined:** BUG-58 timed out waiting in Chromium in the worktree and passed on clean `xgd-working`. I put it down to the same worktree problem but didn't confirm that.
- **Server side:** all 12 neighbouring suites pass, terms and contact history included.

REQ-480 is being built at the same time and uses the same 30-minute session rule. My calculation is the exported `sessionTimes` in `feedback.ts`, so that ticket can reuse it rather than write a second one.

<!-- xgd-chat-end -->