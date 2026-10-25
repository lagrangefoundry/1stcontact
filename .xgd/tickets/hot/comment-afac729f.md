---
uid: comment-afac729f
id: COMMENT-5365
type: comment
title: Comment on bug BUG-208
created_by: xgd
created_at: '2026-10-17T14:03:25.484524+00:00'
updated_at: '2026-10-17T14:24:55.719723+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-7ec95fe4
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "bf3d00d0-ae4f-4688-90ce-3f31e0a8bfef",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="756f8b00-46bd-43cd-ae66-c150161ac576-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T14:02:46.085300+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="756f8b00-46bd-43cd-ae66-c150161ac576-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T14:24:55.672994+00:00" -->
#### Claude
I'm working out where delegation and the builder worker loop live before I look at the CHAT-3–19 transcripts.

I'm locating the Charlie's plumbing - 3 worker transcripts in the local D1 database.

I'm reading the worker tool transcripts to see how each worker actually ended.

CHAT-3 already gives a strong lead: the worker kept rebuilding the whole page, as if it never saw its own tool results. I'm finding the upstream delegation code to check that.

Upstream delegation already returns distinct `exhausted` / `silent` outcomes. Now I'm checking what the problem delegations actually returned.

Findings so far: worker 1 ended `exhausted` (tool-call cap), worker 13 ended `silent`. Now comparing worker 2's brief with what it received.

Finding (2): every brief arrived whole, so worker 2 dropped items it was given. Reading what it was asked for and what it said.

I'm checking what the installed framework does when a worker's budget runs out, and which reminder told worker 1 "the site is at change 6".

Strong lead on (1): the builder's reminders include a site digest that is built once when the round opens, then re-sent after every tool result. Checking what that digest says.

I'm measuring how many model requests each worker actually used, to decide the step budget.

Findings are clear. Now I'm checking how this repo wires the builder, to decide what to fix here and what belongs upstream in lagrange-framework.

A host seam already exists: `reportingDelegationToolbox` annotates any non-reported delegation with `activity` and `ended`. Reading it.

The host can name the limit: the worker's `turn_end` record carries `exhausted_by`, but `workerEnding` only reports aborted or errored turns. Checking how the seam is constructed.

Plan is taking shape. Looking for existing delegation UATs with a scripted worker to build on.

Investigation done. Recording the findings and the confirmed fix on BUG-208 before I write any code.

Now cutting the branch.

The test harness runs in the worktree. Now editing the builder's priming and reminders.

Two REQ-339 UATs pin the builder receiving the digest, so this change supersedes them as well. Checking their status and code.

Making the priming edits with a script, since the same text is duplicated across both builder orders.

Now the `roles.ts` comments that claim the builder gets the digest.

Now the builder's step budget in `backends.json`.

Now the host's `ended` field in `account-core.ts`.

Now rewriting `WorkerEnding` and `workerEnding`.

Now the `ended` description the consultant reads, and the toolbox signature.

Now the consultant's out-of-budget notice in `turn-clock-core.ts`, so a hand-off that ended without a report is described rather than shown as a bare "handed off work".

Code changes are in and typecheck passes. Now writing the UAT file, modelled on the BUG-191 harness.

Adding the builder's brief ceiling to the role, and a clear refusal for briefs that exceed it.

Typecheck passes. Updating the brief UAT to expect the whole brief, and adding one for the refusal of an over-long brief.

The brief arrives whole now. That assertion used a check the host settles itself, so it is never in the brief. Switching it to a worker-answered check.

All 7 pass. Now updating the UATs this supersedes: BUG-191's "carries no ended" and REQ-339's behaviour 4.

Running the regression scope: every suite touching the builder, delegation, backends or the turn clock.

The REQ-341 failure is listed in memory as failing before this change; I'll confirm that against the main checkout. The REQ-295 prefix UAT pins the digest, so it is superseded the same way.

Those four match the failures memory lists as pre-existing. One REQ-295 case covers a silent worker, which `ended` now touches, so I'm reading its failure diffs rather than assuming.

The REQ-295 failures are the `by`/`reason` verdict drift memory records, not mine. Checking lint before committing.

Typecheck is clean, and the repo has no eslint config to run. Committing on the branch.

Committed. The brief finding has reversed since I wrote the ticket body, so I'm correcting the body before merging.

Ticket body corrected. Merging back into xgd-working.

Merged. Moving the ticket to `free_coded`, letting the gate do the version bump.

Ticket is `free_coded` with both commits recorded, and the branch is cleaned up. One last run of the new suite against the merged xgd-working.

I've fixed BUG-208. All three failures had a concrete cause in the worker records, and the merged xgd-working passes the new UATs (9 of 9 across the BUG-208 and BUG-191 suites). The ticket is at `free_coded` with commits `e0e80ab` and the version bump `f3621c4` (0.2.510).

**What caused each failure:**
- **(2) Items skipped: the consultant's guess was right, briefs were being cut.** The builder role inherited the framework's 4,000-byte limit on a user message, which is meant for client pastes, and a worker can't read the cut part back. Worker 2's brief was cut in the middle of item 5. Items 6–8 and every check never reached it, so its "the brief did not request" was literally true. Worker 1 lost its checks the same way. The stored transcripts hold the whole brief, which is why they looked fine; the new UAT caught the cut on the actual request.
- **(1) Ran out before checking: it was the 10-minute time limit, not the step cap.** The builder's per-turn reminders included a snapshot of the site taken when its single turn began, re-sent after every tool result with "use it instead of looking". After each write it was still told "change 6, placeholder". It believed that, replaced the whole page nine times and ran out of time. Two other workers were misled the same way. The framework's budget warnings did reach it.
- **(3) Ended without reporting: it wrote its report as text instead of calling `ReportResult`, even when the framework asked again.** Text is never delivered, so the consultant got `outcome: silent` with nothing saying why. That text did mention the half-styled contact form.

**What changed:**
- **Briefs:** the builder now accepts messages up to 32,000 bytes, four times the longest brief in that engagement. A longer brief is refused with a clear `brief_too_long` error before any worker starts, so it is never shortened.
- **Site snapshot:** the builder no longer gets it. The consultant keeps its own, which is rebuilt every turn.
- **Ending reported:** any run that ends without a report now says why. A run that ran out of steps or time names the limit and its size; one that just stopped says `no_report`. The consultant's own "ran out of time" message now says a hand-off ended without reporting, and why.
- **Builder instructions:** it now lists every item in the brief before starting and checks each piece as it finishes it. It also treats its own tool results as the current site. It reports only through `ReportResult`.
- **Step budget:** raised from 50 to 100 tool calls. Across the 17 runs the builder used 8–45 calls (median 23), and an earlier record shows 3 of 8 runs hitting 50. The time limit stays at 600 s, now written down. The only run that hit it was the snapshot loop. The measurement is recorded in `backends.json`.

**Decisions for you:**
- **Older tests rewritten.** This deliberately replaces two earlier decisions, and the tests that pinned them now pin the new behaviour. BUG-191 said a silently finished run carries no ending; REQ-339 behaviour 4 said the builder gets the site snapshot. Both are named in the ticket body. REQ-339 is at `ready_to_reconcile`, so its reconcile will meet the change.
- **Framework ticket.** In lagrange-framework, the reason given on each unanswered check always says "ran out of tool calls", even when time ran out. Our new ending field is correct, but it can contradict that text. I haven't filed anything there; should I open a ticket?
- **Builder model.** The builder runs on `claude-haiku-4-5`. These fixes remove the causes, but writing its report as text is a Haiku habit. If it keeps happening, the next lever is the model.

Of the roughly 30 related test suites I ran, four tests still fail. Each matches a failure your notes record from a clean xgd-working (two REQ-295 delegation cases, REQ-341, REQ-122); I checked the REQ-295 diffs, and they are the older verdict-format drift, not this change. Dev serves a frozen snapshot, so none of this is live until you run `bin/deploy --env dev`.

<!-- xgd-chat-end -->