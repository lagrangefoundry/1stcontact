---
uid: comment-df6587c3
id: COMMENT-5752
type: comment
title: Comment on request REQ-467
created_by: xgd
created_at: '2026-10-26T02:34:29.624769+00:00'
updated_at: '2026-10-26T02:52:44.211053+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4798c8f7
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c2a9222c-498c-44e3-bc78-033735a4a99d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="323c8ff8-5f4d-4a62-84b9-ef4935c2002e-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T02:33:46.862727+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="323c8ff8-5f4d-4a62-84b9-ef4935c2002e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T02:52:41.691518+00:00" -->
#### Claude
Now let me look at the code areas.

Reading the panel's `showAsk` path next, to see why a question already in the plan wasn't drawn when the link was clicked.

Checking whether the plan read has a cache, which would explain the lag.

Store and panel read the same projection, so the lag is on the client side. The bounded re-read will cover it. Next I'm checking the host's build-done line.

Now marking the ticket in progress and cutting the branch.

Branch ready. Now finding every test that pins the old link wording.

Most hits are scripted consultant text and stay as they are. The ones to update are host-written strings. Reading the `show_client` description and the priming link guidance:

Reading the remaining plan-core link sites before editing.

Now making the edits. First the TypeScript link sites, scripted:

Writing the edit script for the host and tool text:

Fixing one over-escaped match in the script before running it:

Keeping "under Input" in the question examples, since that orientation matters (REQ-433):

Host and tool text done. Now the priming text, spliced in place:

Priming done. Now the panel: replacing the single re-read in `showAsk` with a bounded wait and an "on its way" line.

Now the panel edit:

Tightening the loop so a draw that lands during the wait is caught right away:

Extending the same bounded wait to page and comparison-site links in `app.js`:

Code changes are in. Now updating the existing tests that pin the old host wording. First, more pinned fragments:

Updating those pinned assertions to the new wording, scripted:

Existing tests updated. Now the new FC UATs. Looking at the harness the REQ-413 builder test uses for a question link:

A gone question now waits about 6s before saying so, so tests that expect the "no longer there" note at once need a longer wait. Finding them:

No shared jsdom harness exists, so the new builder UAT carries a slim copy. Now looking at the BUG-265 workers harness for the host-side UAT:

The Meanwhile line is already covered through a real turn. The build-done cue needs REQ-436's harness, so checking how heavy that is:

Too heavy to copy. I'll move the build-done line into `show-core.ts` as `pageDoneLine`, so a light test can check it directly. I'll also add the label check to REQ-436's existing cue test.

Now the new UAT files. Checking how existing tests load priming and the surface:

Writing the builder-side UAT:

Now the text-side UAT:

Running the new UATs and the touched jsdom/node suites:

All pass. Checking the builder suites actually ran rather than silently skipping (the worktree can hide webui):

Both builder suites ran for real. Now the workers suites, including the BUG-129 priming budget:

Four failures. Some look environmental or pre-existing, so I'll list them and baseline against clean xgd-working:

Baselining the same four in the clean main checkout:

Priming went from 99,927 to 100,069 against a 100,000 cap, so I'm shortening the new rule sentence:

Budget passes. Sweeping for any other tests that pin text I changed:

My "on its way" line shares the `plan-panel__ghost` class, so it could be picked up by `querySelector`. Placing it after the empty-state line and running those suites:

Passing. Now a wider regression over every test that imports a touched module:

153 files. Running them in batches of 40 (long path lists make vitest find nothing):

All five fail on clean xgd-working too. Checking whether BUG-245's later lines (hidden behind that failure) pin my changed wording:

Nothing of mine pinned there. Batches 2–4:

Baselining the batch 2–4 failures (bar the known REQ-431 pair) on clean xgd-working:

All 15 also fail on clean xgd-working, so none are from this change. Typecheck and lint next:

No type errors in the touched files. Checking the tree before committing:

Updating the ticket body first (appending, keeping what's there), so every UAT is backed by its language:

Committed. Confirming what the commit holds, then merging back under the lock:

Lock held. Merging xgd-working into the branch first to surface any conflicts there:

The merge was clean, but BUG-294 also touched the panel, so re-running my suites and BUG-294's on the merged tree:

Landed on xgd-working. Moving the ticket to free_coded, letting the gate bump the version itself:

REQ-467 is implemented, merged into xgd-working and parked at `free_coded` (commit `1ce1850`, version 0.2.663, 5 points). The ticket body now records what landed.

**1. Links only point at what's there.** The host's links were already safe: the "Meanwhile" line reads its question ids from the same saved plan the panel reads. A page is named only once the store holds it, and question and board links are handed over only after the plan is written. The delay you saw came from the panel giving up after one re-read, so change 2 is the fix.

**2. A link that arrives early still lands.** Clicking a question link before the panel has the question no longer leaves you on an empty Input. Input opens straight away and shows "Your question is on its way…". The panel then re-reads the plan every half second for about 6 seconds. As soon as the question appears it is unfolded and highlighted. Only if it never appears does the chat say "That's no longer there." Links to a page of the draft and to a comparison site get the same wait.

**3. Link words name where they go.** For example:
- "Meanwhile, 1 question needs you: [the question]."
- "The Home page is done: [Home page]."
- "Your first draft is ready: [your first draft]."

Other links now read [the comparison board], [the story board], [Questions] and "Showing you [the story board]". A `show_client` link with no label of its own is now just the target's name, not "Open …". The `show_client` description now states the rule with the Home page example. The consultant's priming gets one short line ("Link words name the place, never the action"). It had to be that short because the priming size limit test (BUG-129) had only about 70 characters to spare.

**Tests.** Two new UAT files:
- `test_UAT_FC_REQ-467_a_link_that_lands_early`: runs the real builder and checks both the late-arriving question and the one that never appears.
- `test_UAT_FC_REQ-467_links_name_where_they_go`: checks the host's lines word for word. It also checks that no host template, tool description or priming text uses an action as a link label.

Eleven existing test files that pinned the old wording were updated, plus one test fixture.

I ran all 153 test files that touch these modules. Every failure also fails on clean xgd-working, so none come from this change. They are in REQ-431, REQ-436, REQ-342, REQ-416, REQ-424, BUG-245, BUG-244 and nine others.

**Decisions you may want to revisit:**
- The "How you can help" row now reads just "Your first draft is ready", because the whole row is the link.
- Clicking a link to something that really has gone (like a withdrawn question) now takes about 6 seconds to say "That's no longer there." That's the price of the bounded wait.

Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->