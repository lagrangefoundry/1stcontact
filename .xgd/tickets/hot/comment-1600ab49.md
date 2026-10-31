---
uid: comment-1600ab49
id: COMMENT-5755
type: comment
title: Comment on request REQ-465
created_by: xgd
created_at: '2026-10-26T15:39:28.976931+00:00'
updated_at: '2026-10-27T20:04:44.919854+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-9f48b7ff
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "653eb292-cc8b-47be-b262-dbf858bc9e0f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="7fd65c5e-145e-46c8-b1ae-503eb16ef8a3-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T15:37:51.022649+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="7fd65c5e-145e-46c8-b1ae-503eb16ef8a3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T16:15:20.100156+00:00" -->
#### Claude
I'm reading the ticket and its reference documents. This ticket asks for a written audit rather than code, so it's documentation work and won't produce a free-coding commit.

I'm looking for a way to get the full text of a captured consultant request. The dev store records only sizes and fingerprints, not the text itself.

I'm working out how the consultant's request is assembled. My plan is to rebuild the exact live request text and confirm it matches the live request's recorded fingerprints.

I'm checking how the deployed worker builds its Anthropic client, so I can point it at a local capture server instead of the real API.

I'm setting up the replay. The deployed dev worker will run against a copy of the dev store, with model calls sent to a local capture server, so no real API calls happen and live data isn't touched.

I'm working out which recent live build to replay. The candidate is the most recent consultant session on the current dev snapshot.

The capture server is running. Next I'm starting the deployed dev worker on a separate port, using a copy of the store.

I'm working out how the app decides which business a request belongs to. My replay landed on the default dev business rather than Dina's Diner 5.

I'm mapping the captured system text back to its source entries in `priming.json`, so each finding can name where its text lives.

While the six reviewers work, I'm checking what has changed since the snapshot and saving the capture somewhere more durable than `$TMPDIR`.

Still waiting on the six reviewers; none has written its findings yet. I'll keep waiting.

All six reviews are in. Before writing them up I'll spot-check a sample of the high-confidence claims against the code myself.

Now I'm filing the audit as a doc ticket attached to REQ-465.

I'm saving the replay technique to memory, since it is reusable and not obvious from the code.

The audit is done and filed as **DOC-70**, attached to REQ-465. It's a written audit, so no code was changed and there's no free-coding commit. REQ-465 is still at `draft` with an outcome section added to its body; where it moves next is your call.

**How the request was captured.** The live database only keeps the size and a fingerprint of each request, not the text. So I re-ran the deployed dev worker (snapshot `1f70f43828`) on a copy of the dev store for Dina's Diner 5, and sent its model call to a local server that recorded it. The captured system and tool text produce exactly the same fingerprints as the live session's 50 requests, so it's byte-for-byte what the model read. That's 118,698 chars of system text, 127,833 of tool definitions (91 tools) and a 14,086-char per-turn tail. None of the consultant's prompt files have changed on xgd-working since.

**What I found** (169 findings, using six parallel reviewers, with a sample of their claims checked against the code):
- **Mostly repetition, not error.** A typical rule appears in 3–5 places: priming, the manual, the tool description, the per-turn tail, and what a tool returns. The doc keeps one copy, normally where the rule is used, and says how I settled the cases where reviewers wanted to cut opposite copies.
- **Text written for other roles.** The framework prints every surface's manual and "not available" list whatever the session is granted. So the consultant reads builder instructions (`decompose_page`, write advice), ticket-write notes and a "summary" it is deliberately not given. About 5K chars come from this one cause.
- **Tests pin the wording, not just the behaviour.** Many tests check a rule's wording in the priming itself, which is why the duplicate copies could never be removed. Most cuts need those tests pointed at the remaining copy.

**Proposed cuts:**

| Cut | What | Saving |
|---|---|---|
| 1 | Priming and this repo's manuals; exact passages and every test to repoint are listed | ~11.4K system chars (BUG-129 headroom is ~100 today) |
| 2 | This repo's tool text: `compare`'s second picture duplicates the first word for word (4.4K), plus `AnimateImage` repeats | ~5.4K tool chars |
| 3 | Show text only to the role that can use it (framework change) | ~4.1K system chars |
| 4 | Text owned by the framework repo, e.g. the delegation manual's 3.2K | ~5.4K system chars |
| 5 | Remove tools the consultant doesn't use (`compare` was called once in 3,858 calls; `AgentContext`/`AgentPriming`/`AgentReminder` and three Ticket tools never) | ~9K |

Cut 5 is a product decision for you. Nine contradictions also need your decision rather than a deletion; they're listed in the doc. Two examples:
- What the build-start message should say and how it ends is stated four different ways.
- The comps section says to talk the direction through first, while the host's cue says to record it straight away.

**Other problems the audit turned up:**
- **Plan entry cut short.** The per-turn plan entry hits its 2,000-char limit and ends at a bare "Due:". Readiness, story and focus lines never reach the consultant, though several tools say they arrive every turn.
- **DOC-47 is out of date.** It says there are no custom domains and contact forms don't work. The knowledge map tells the consultant to trust it over everything else.
- **Two tests already fail on clean xgd-working:** REQ-376 `the_consultant_priming_names_the_control_in_both_orders` and BUG-245 `the_consultant_is_primed_for_one_voice_and_the_comp_cards`. The reviewers who ran them reported this; I didn't run them again.

**Needs you:** the sandbox wouldn't let me stop the processes I started. Two copies of the dev worker are still running on ports 8796 and 8797, and the capture server on 8798; they only touch copies of the store. To stop them:
```
lsof -ti tcp:8796,8797,8798 | xargs kill
```

The captured request and working files are in `.xgd/tmp/req465/` (gitignored).

<!-- xgd-turn id="9582b5c2-3bf2-4691-90f4-c9ce6be51bd6-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T16:18:22.925552+00:00" -->
#### You
Its been run

<!-- xgd-turn id="9582b5c2-3bf2-4691-90f4-c9ce6be51bd6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T16:18:34.306680+00:00" -->
#### Claude
Thanks. Nothing is listening on ports 8796, 8797 or 8798 any more, so both replay workers and the capture server are stopped.

The audit is in DOC-70, and REQ-465 is still at `draft`. Two things are waiting on you:
- **The nine contradictions** listed in DOC-70 each need a decision before they can be cut.
- **Cut 1** (~11.4K of system text, high confidence) is ready to become its own follow-up ticket, along with the tests that would need to point at the remaining copy.

<!-- xgd-turn id="f4f8b3c1-af4f-4a48-91a2-7abff1ebdd91-user" -->

<!-- xgd-chat role="user" ts="2026-10-27T18:59:29.601751+00:00" -->
#### You
I believe that these contracditcions have been resolved can you verify and mark this ticket as legacy_done if they have indeed been fixed

<!-- xgd-turn id="f4f8b3c1-af4f-4a48-91a2-7abff1ebdd91-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-27T19:03:45.802064+00:00" -->
#### Claude
Truncated output; I'll read the doc file directly.

The consultant's priming was replaced wholesale by REQ-473 (DOC-73 v2). I'll check each of the nine against the current text.

DOC-73 records a resolution for all nine, but that is the plan. Now I'll check the shipped text and code.

Rule 11 now says "on your own initiative". The opposing halves of D-7 and D-8 lived in manuals (Development tickets, Delegation overview), so I'll check whether those are still projected.

Both opposing passages still exist upstream. Next I'll check whether 1stcontact overrides them or still projects them to the consultant.

D-5 (comps), D-6 (headline) and D-1–D-4 are consistent in the new text. Next, D-9 in the plan-entry code.

D-9 is still open in the code. Last, D-7 and D-8: whether the consultant still receives the framework manuals.

Before I report, I'll run REQ-473's no-contradiction UAT to confirm the priming-side checks pass.

Six of the nine are resolved and three aren't, so I'm leaving the ticket at draft. I'll add the verification to the ticket body.

Not all of them are fixed, so I haven't marked REQ-465 `legacy_done`; it's still at `draft`. REQ-473's rewrite of the consultant's priming (DOC-73) fixed six of the nine contradictions. The other three remain.

**Fixed:**
- **D-1 to D-4** (how a build starts, options vs one proposal, the hand-over, "build sooner") are gone from the priming and the reminders.
- **D-5 (comps):** the stage guide now records the direction as proposed straight away, which matches the host's message when the board is finished.
- **D-6 (headline):** the guide now says a headline must be agreed before the first draft, which matches the host's finish line.

REQ-473's no-contradiction test checks those six, and the whole test file passes (6/6).

**Still open:**
- **D-7 (reporting bugs):** the consultant's own instructions now say to file with ReportBug on its own initiative. The framework's Development tickets manual still says "Filing is not something to do on your own initiative", and the consultant still gets that manual unchanged. REQ-473's test only checks the priming and reminders, so it can't see this.
- **D-8 (checking builder work):** the instructions now say checking delegated work isn't optional. The framework's Delegation overview still says that re-checking the builder's work moves the cost rather than saving it. The framework change that would remove that line (Cut 4) hasn't been made.
- **D-9 (the plan entry):** the code is unchanged. While the client hasn't seen the draft, the entry says "Other questions wait until they have" and then still lists questions as due. The 2,000-character cut-off is also still there. DOC-73 planned this as a code fix that hasn't been made yet.

I've added these results to the end of REQ-465's body. D-7 and D-8 need either a change to the framework manuals or a 1stcontact override for the consultant. D-9 is a small change to `plan-core.ts`. Let me know which of those you'd like done and where. Once they're in, I'll mark the ticket `legacy_done`.

<!-- xgd-turn id="6a19a81f-e820-478d-b27d-e66045f8c812-user" -->

<!-- xgd-chat role="user" ts="2026-10-27T20:02:19.676999+00:00" -->
#### You
Can you check again and resolve your ticket if we are good after REQ-301 please

<!-- xgd-turn id="6a19a81f-e820-478d-b27d-e66045f8c812-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-27T20:04:33.838174+00:00" -->
#### Claude
BUG-301 is the one for this (REQ-301 is an unrelated page-copy ticket). I'll check what it changed.

D-7 and D-9 look covered. For D-8 the commit changed rule 12 but not the Delegation overview, so I'll compare the two.

Rule 12 now matches the overview: ask for checks in `accept`, then look only at what came back unverified, unreported or failed. D-8 is resolved. Next I'll run the BUG-301 and REQ-473 UATs.

One test fails: the consultant's prompt is 1,800 chars over REQ-473's 205,000 budget. I'll check whether BUG-301 caused it.

The contradictions are all resolved. The budget overrun comes from REQ-474's new Library tool text plus BUG-301, not from a contradiction. I'll record the result and close the ticket.

The status change went through, but the body is now frozen, so I'll put the note in a comment instead.

All nine contradictions are now resolved, so REQ-465 is marked `legacy_done`. I took your "REQ-301" to mean BUG-301 (`46c40cc599`), which is the fix for the last three; REQ-301 itself is an unrelated page-copy ticket.

The last three are fixed like this:
- **D-7 (filing bugs):** the consultant is only told to report bugs with ReportBug where it actually has that tool. The framework manual's "not on your own initiative" paragraph has been replaced.
- **D-8 (checking builder work):** rule 12 now says to ask for checks when delegating, then look only at results that came back unverified, unreported or failed. That now agrees with the delegation manual's "don't re-inspect everything".
- **D-9 (the plan entry):** while the client hasn't seen the first draft, no other questions are listed as due. A plan entry that's too long is now cut at a line break, not mid-sentence.

I ran the BUG-301 and REQ-473 tests: 12 of 13 pass. The one failure isn't a contradiction. `test_UAT_FC_REQ-473_the_consultants_authored_size_is_inside_the_lowered_budget` measures the consultant's prompt at 206,800 characters against the 205,000 limit REQ-473 set. It has grown since REQ-473: probably most of it is REQ-474's Library work, plus a little from BUG-301. That needs either a trim or a higher limit, under whichever of those tickets you choose.

Setting `legacy_done` locked the ticket body before my write-up could be added to it, so the write-up is in a note on the ticket instead (COMMENT-5776).

<!-- xgd-chat-end -->