---
uid: comment-f0856610
id: COMMENT-5591
type: comment
title: Comment on bug BUG-265
created_by: xgd
created_at: '2026-10-24T15:08:42.506052+00:00'
updated_at: '2026-10-24T15:24:16.173551+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-4ea7ae10
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8f9d3453-0453-476e-ac2d-b962d7ec2ff1",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="87f36ff2-4e7f-41f6-a021-872bf492e4f5-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T15:07:39.011912+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="87f36ff2-4e7f-41f6-a021-872bf492e4f5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T15:24:14.518909+00:00" -->
#### Claude
I'm on the free-BUG-265 branch, reading how `set_ask` and the existing board links (comparison sites, `show_client`) work before changing anything.

Still reading. I've found the host's "link it at the end if the reply left it out" mechanism (REQ-431, in `cadence-core.ts`); my plan is to apply the same mechanism to new questions.

I've found the test harness I'll copy (REQ-379's scripted-model host UAT). Next I'm checking which tools put up the other kinds of client input, so I can see whether each one already returns a link.

Now editing `show-core.ts`: a `questions` target, plus the matching logic for "this reply already links that kind of input".

Now the cadence wrapper: record each tool's `new_input` and add the missing links at the end of the reply. I'm also adding a link to the host's "Meanwhile" line and dropping its "above".

Next, `plan-core.ts`: `set_ask`, the direction card in `set_decision`, and `add_comp` will each name their `new_input`.

Now story notes: `pin_notes` gets a link to the story board in its result, with no host append.

Now the browser side: a `#show=questions` link has to open Input with Questions expanded.

Code changes are in. Now checking the worktree can run tests, then typechecking.

Typecheck is clean. Running the suites my change touches (REQ-379, REQ-401, REQ-413, REQ-431, REQ-433, and the show/ask suites) to see what moved.

Only the three expected failures: they pin the old wording that BUG-265 replaces. Updating them to the new wording.

Now the BUG-265 UATs, starting with the host-side test built on the REQ-379 harness.

All 7 host-side UATs pass. Next, the browser UAT: following the links opens Input with Questions expanded. I'm reusing the REQ-433 jsdom setup.

The browser test failed because jsdom has no markdown engine, so links render as text. I'm installing the same test parser REQ-413 uses.

Both pass. Adding the test-plan check that the priming and `set_ask`'s description both show the linked form.

Now re-running the related suites, plus the priming-budget and surface-declaration suites, to check nothing else moved.

Over the priming budget by 280 characters (200280 against a 200000 cap). Checking whether the baseline was already over before I blame my edit.

The baseline is already over before my change (200202, so it's pre-existing). My edit adds 78 characters, so I'll trim the priming paragraph until my change is net-negative.

Now 200068, which is 134 under the baseline. The suite is still red, as it already was on clean xgd-working; fixing that overage is outside this ticket. Running the second batch.

That's the known REQ-416 hand-over-line failure, which is already red on clean xgd-working and unrelated to my paragraph. Running lint on the changed files, then I'll commit.

No lint config in the repo. Next: version bump, then the ticket body before committing. Finding how this project bumps its version.

Committing the code first, then updating the ticket body.

Now the ticket body: I'm keeping the existing text and appending what changed, the design decisions and the test results.

Ticket body updated with the original text kept. Next, landing it: take the lock, merge xgd-working into the branch, bump the version at the tip, then merge back.

xgd-working had moved on (BUG-264 and BUG-266 landed), and the merge was clean. Re-running typecheck and my suites against the merged state.

Merged back as a fast-forward. Now moving the ticket to free_coded.

BUG-265 is done and merged into xgd-working. When the consultant tells the client there's something new for them in Input, the message now links straight to it. If the consultant leaves the link out, the host adds one at the end of the reply, never the top. The ticket is at `free_coded`, with commits `f61a6cf9` and `79cb05b8` and version 0.2.612.

**Questions**
- **Link handed over:** when `set_ask` adds a new question, its result now gives the consultant a link to that question and a link to the whole Questions section. Its instructions say to put the link inside the one line that announces the questions.
- **Host's backstop:** if a reply that added questions has no link to them, the host adds "[Answer the new question here]" (pointing at that question) or, for several, "[Answer the new questions here]" (pointing at the Questions section). A reply that already links them goes out unchanged.
- **New link target:** a Questions-section link didn't exist before, so I added one. Following it opens Input with Questions expanded and scrolled into view.
- **Example wording:** the priming example and `set_ask`'s description now read "I've put a few quick questions under Input: [answer them here](…)".

**The host's own working line** now reads "Meanwhile, 1 question needs you: [answer it]" (or "N questions need you: [answer them]"). The word "above" is gone.

**Other kinds of new input**
- **Direction card:** it now gets the same treatment, a link in the result plus the host's backstop, pointing at the comparison board where the card sits.
- **Comparison sites:** these already had a link; the host's backstop now covers them too.
- **Story notes:** these get a link in the result, but the host never adds one. I decided this myself: notes are pinned almost every turn, and a forced link each time would be noise. Say if you want it.
- **Looks:** these already had a link, so they're unchanged.

**Tests:** the 8 new BUG-265 tests pass. The REQ-413, REQ-431, REQ-433, BUG-236 and BUG-245 link tests also pass, and so do those suites after merging the latest xgd-working. I updated one assertion in each of REQ-379 and REQ-401, because they checked the old wording. Two suites are red, and both were already red on xgd-working before this change:
- **BUG-129 (priming budget):** xgd-working is 200202 characters against a 200000 cap. I trimmed my priming paragraph so it now reads 200068: lower, but still over. I didn't fix the rest of the overage under this ticket.
- **REQ-416:** fails on its known wrapped hand-over line, which my change doesn't touch.

<!-- xgd-chat-end -->