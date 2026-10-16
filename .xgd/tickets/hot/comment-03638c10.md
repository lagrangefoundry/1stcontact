---
uid: comment-03638c10
id: COMMENT-5363
type: comment
title: Comment on request REQ-399
created_by: xgd
created_at: '2026-10-15T17:01:29.587000+00:00'
updated_at: '2026-10-16T18:43:25.314039+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-46d65625
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "07cf13b1-8796-435a-818b-79396043b36c",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a2b7b64d-8f34-4c13-8ca1-3d4667c02090-user" -->

<!-- xgd-chat role="user" ts="2026-10-15T16:59:05.509904+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a2b7b64d-8f34-4c13-8ca1-3d4667c02090-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-15T19:21:00.372544+00:00" -->
#### Claude
Reading the plan core and related surfaces to understand the current features ask before scoping.

Still mapping the code: plan ops are clear; next the control-app panel rendering and the builder host's turn path for the opening turn.Scope is clear and the ticket is complete; no blocking questions. Starting the free-coding flow: marking REQ-399 `free_coding` and cutting its branch.

Now the catalogue data. Checking what the framework actually builds so I can set `available` honestly.

Only `contact-form` exists, so the starting `available` values hold. Editing the seed.

Now the plan-core changes: catalogue type, ask fields, `ask_features`, panel projection, and the "Something else?" answer.

Plan-core model and `ask_features` are in; now adding the catalogue to what the consultant reads, then the surface declaration.

Now the panel: labels, `[not yet available]` marker, "Something else?" field, and one-per-line/columns layout.

Panel done. Now the consultant-speaks-first opening turn; looking at the priming structure.

Panel and plan side are done; wiring the opening turn now (host, route, client transport).

Adding the host side of the opening turn (empty-conversation check, transcript filtering).

Now the host and route edits for the opening turn.

Artifacts copied. Running the existing affected suites to see what my change breaks.

All seven failures are the REQ-379 "seeded features ask" behaviour this ticket explicitly removes. Updating those assertions to the new intent.

Existing tests updated. Now the new UATs; reading the harnesses I'll imitate.

Writing the node UAT for the catalogue, `ask_features`, and the answer path.

Node UAT passes. Now the panel UAT; reading the BUG-200 harness.

Webui linked (otherwise panel suites silently skip). Writing the panel UAT.

Panel UATs pass (and actually ran). Now the opening-turn workers UAT; reading the BUG-121 harness.

Writing the opening-turn workers UAT.

Server-side opening UAT passes. Now a chat-pane UAT for the client half; checking the BUG-46 pane harness.

New UATs pass. Running the broader regression scope (plan, panel, chat pane, priming, host) in batches.

While the sweep runs: DOC-64 needs the new ordering (the ticket asks for it).

DOC-64 is a doc ticket; I'll update its body through the ticket CLI.

The sweep's first batch shows failures; checking them against a baseline in the main checkout (which has none of my changes).

⚠️ Chat generation failed: Claude Code CLI error (exit code 1)
Error: API Error: Can't reach the API server — check your internet or DNS (ENOTFOUND) | API Error: Unable to connect to API: SSL certificate hostname mismatch

<!-- xgd-turn id="62a17144-bd72-456c-9c67-1cca0f20174e-user" -->

<!-- xgd-chat role="user" ts="2026-10-16T18:35:33.427537+00:00" -->
#### You
Please continue

<!-- xgd-turn id="62a17144-bd72-456c-9c67-1cca0f20174e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-16T18:43:25.206924+00:00" -->
#### Claude
Seven of the eight failing files fail the same way on the unmodified checkout, so those were already failing. REQ-386 passes there, so I'm checking that one.

That fits this ticket's intent: the test counted the seeded `features` ask as an open question, and new plans no longer have one. I'll update the expected count.

To keep the plural count covered, I'll add a second ask of the test's own rather than drop the expected count to 1.

REQ-386 passes. Next I'm checking whether the DOC-64 update landed before the session dropped.

Not done yet. Reading the relevant DOC-64 sections to make targeted edits.

Priming and DOC-64 now agree. Next, typecheck and lint.

Typecheck is clean. Checking my notes on the version gate before committing.

Committing the work on the branch, staging only my files by name.

Committed. Locking and merging back into xgd-working.

Clean merge, nothing to rematerialize. Moving the ticket to `free_coded`; the gate does the version bump itself.

Releasing the lock and removing the branch, then adding the result to the ticket body.

REQ-399 is built, merged into `xgd-working` and parked at `free_coded`. I haven't promoted it to reconcile; that's your call. Nothing has been deployed, so dev won't show it until you run `bin/deploy --env dev`.

**What changed**
- **Catalogue:** the features list in `plan-seed.json` now has only the seven things the site does (messages, quotes, booking, payment, newsletter, blog, notices). Each has an `available` flag. Only "Visitors can send you a message" is available, because the contact form is the only one of these the framework builds today. Content sections and click-to-call are gone, and a new plan has no features question.
- **The question:** the consultant posts it herself with a new plan operation, `ask_features`. She can leave options out, tick some in advance and reword labels, and anything not in the catalogue is refused. Answers are stored by capability id, so a reworded option still maps back. Her instructions (priming) and DOC-64 both say she raises it after the opening and before the comps, and never promises a capability that isn't available.
- **Panel:** every multi-choice question now lists one option per line, in columns when the panel is wide enough. Unavailable options carry a small, muted `[not yet available]`. A "Something else?" field sits under the list, and what's written there is stored with the answer. Tick-then-Done works as before.
- **She speaks first:** opening a conversation that has nothing in it starts one assistant turn, with no client message, through the normal turn path. Reopening, a second tab, or a conversation that already has turns starts nothing. It doesn't happen in group-chat mode either.

**Tests**
- The four new REQ-399 test files pass, and so do the existing ones I updated.
- Four older tests (REQ-364 ×2, REQ-379, REQ-386) assumed every new plan starts with a features question, so I changed them to match. REQ-386's check that the count of open questions reads "2 questions" was kept by having the test add two questions of its own.
- In the wider run of about 160 related test files, 11 tests in 9 files still fail. I re-ran 8 of those files on the unmodified checkout and they fail there in exactly the same way. The other two (REQ-295 delegation and AC1058) are already recorded as failing on a clean tree. So none of the 11 come from this change.
- Typecheck is clean.

The ticket now has an "As built" section, and the commits are `36ee3c3e22` plus the gate's version bump, `1c51c9816e` (0.2.507).

**One thing for you:** `xgd branch clean REQ-399` merged and removed the worktree folder, but the sandbox wouldn't let it delete `.git/worktrees/free-REQ-399`. So the `free-REQ-399` branch and a stale worktree entry are still there. Run `xgd branch clean --stale` outside the sandbox to clear them.

<!-- xgd-chat-end -->