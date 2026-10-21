---
uid: comment-708569da
id: COMMENT-5537
type: comment
title: Comment on bug BUG-239
created_by: xgd
created_at: '2026-10-21T01:16:50.067580+00:00'
updated_at: '2026-10-21T14:31:59.297775+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f8800a8e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "84d91763-5844-4c51-ae65-eaf4ba02920f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e4155d24-abe5-4afb-8211-32491cbb22c7-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T01:15:48.319742+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e4155d24-abe5-4afb-8211-32491cbb22c7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T01:19:12.542663+00:00" -->
#### Claude
Upstream isn't fixed yet and has no ticket for this, so I'm filing the lagrange-framework ticket first (per the cross-repo rule). Checking the upstream code so the ticket is precise.

Diagnosis confirmed against both the upstream source and the installed copy. Filing the upstream ticket.

Now recording the upstream ticket on BUG-239.

I haven't implemented BUG-239 yet, and no code has been written for it. As the ticket itself says, the fix has to happen upstream in lagrange-framework first, and that hasn't happened.

**What I checked:** the rule that chooses Stop is still the old one, both in lagrange-framework's source (`components/webui/chat/js/src/input.js:489`) and in the copy installed for 1stcontact:

```js
const stopOffered = () => modes.stop && busy && (talking || !stopHidden)
```

The ticket's diagnosis is right. Stop is only hidden once the status widget has been drawn. In the gap between the worker starting and its first progress update, an empty composer therefore shows Stop.

**What I did:**
- **Filed lagrange-framework BUG-89 (`bug-c489db35`)** at `draft`. It has the symptom, root cause, the one-line fix, and a jsdom UAT plan, and it points back to 1stcontact BUG-239. With a talker, only a talker reply would show Stop; sessions without a talker keep today's behaviour. Per the cross-repo rule, I wrote no code in that repo; its own session should implement it.
- **Added a Status section to BUG-239** saying it's blocked on BUG-89, that nothing has landed, and what happens next. It stays at `draft` and I didn't cut a branch.

**Why I stopped here:** BUG-239's only 1stcontact change is the UAT, and that test checks for the fixed behaviour. Written now, it would fail against the installed package, and committing a failing test breaks the free-coding rules.

**Next steps:**
1. Run BUG-89 in a lagrange-framework session.
2. After its release, run `bin/install --lang js --component all`.
3. Re-run this session; I'll write the UAT from the ticket's test plan, commit it, and move BUG-239 to `free_coded`.

<!-- xgd-turn id="b1ba2277-13cf-4ba2-a695-3b2a9051ce36-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T14:28:56.820052+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b1ba2277-13cf-4ba2-a695-3b2a9051ce36-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T14:31:55.089606+00:00" -->
#### Claude
The upstream fix appears to be installed now. Checking the installed code.

The fix is installed upstream. Now I'll find the existing 1stcontact talker jsdom suites so the new UAT can reuse their harness.

Harness found. Cutting the branch and moving the ticket to `free_coding`.

Writing the UAT in the worktree.

Linking the shared webui store into the worktree's gitignored `node_modules` (the known location fix), then running the new suite.

The talker frame answers no message here, so the panel likely drops it. In practice a talker reply follows a message the client typed mid-build, so the test should type one first.

All 23 tests pass, including the REQ-416, BUG-240, BUG-236 and BUG-241 talker suites. Running the builder chat suites as well.

Four builder suites fail. My diff only adds a new test file, so these can't come from it, but I'll confirm against the main checkout.

Updating the ticket body first: the Status section is out of date, and the UATs need matching wording in the body.

Committing on the branch.

Locking and merging the branch back into xgd-working.

Merged. Moving to `free_coded` and letting the gate bump the version itself.

BUG-239 is fixed and the ticket is at `free_coded`. The fix itself came from lagrange-framework BUG-89, which is now installed for 1stcontact. This repo only gets a new test proving the builder panel behaves as the ticket requires.

**What changed upstream:** with a talker session, the composer only offers Stop while a talker reply is being generated. The status widget with **Stop building** now appears as soon as the worker starts, instead of at its first progress update, so the worker can always be stopped.

**The new test** is `tests/test_UAT_FC_BUG-239_composer_shows_send_while_the_worker_runs.test.ts`. It mounts the real builder panel with a worker that has started but sent no progress update yet, and checks three things:
- **Empty composer, worker running:** Send shows and Stop doesn't. **Stop building** is in the widget and stops the worker.
- **Client messages the talker:** Stop shows while the reply is being generated and stops only that reply. When the reply ends, the composer goes back to Send while the worker keeps running.
- **Session without a talker:** Stop still shows, as before.

**One behaviour to check you're happy with:** the moment the client sends a message to the talker, the composer switches to Stop, even before the talker starts replying. That's because the panel treats the reply as underway from that point. It fits the ticket's rule (Stop belongs to the talker's reply), so I kept it and wrote it into the ticket.

**Tests:** all three new tests pass, as do the REQ-416, BUG-240, BUG-236 and BUG-241 talker suites (23 tests). Four builder chat tests fail: BUG-64 `a_genuinely_live_turn_still_gates_the_composer`, REQ-127 `a_turn_carries_the_session_it_was_given_and_nothing_else`, AC1065 and AC1070. They fail the same way in the main checkout without my change, so they were already broken. The REQ-309 suite also failed to load in the branch worktree but passes in the main checkout.

**Ticket:** the body now records the final behaviour, the new tests, those existing failures, and that it's no longer blocked. It's merged into xgd-working with 2 commits recorded: the test commit (`9c0b6717`) and the version bump the gate added. Story points are set to 1.

<!-- xgd-chat-end -->