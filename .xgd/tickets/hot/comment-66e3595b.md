---
uid: comment-66e3595b
id: COMMENT-5465
type: comment
title: Comment on bug BUG-212
created_by: xgd
created_at: '2026-10-17T22:50:44.485709+00:00'
updated_at: '2026-10-17T23:12:05.241845+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f1eea393
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "5a5dc275-2607-4104-85fd-e5dc9b921bb8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a36c5bea-39f2-4d8f-bdd9-c28571be0e06-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T22:49:07.176930+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="a36c5bea-39f2-4d8f-bdd9-c28571be0e06-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T22:56:02.615040+00:00" -->
#### Claude
I'm tracing where `ReportResult` is validated and where an aborted worker's report gets put together. So far that's the upstream `delegation_toolbox.js` and `account-core.ts` in this repo.

The upstream picture is clear. One more check: what JSON schema the model actually receives for `failed`.

I've traced the incident end to end; nothing has been changed. There are two separate failures, and the first is the one that actually lost the report.

## 1. The report was refused because the worker was never told the shape of `failed` (upstream, lagrange-framework)

- **What the model sees.** `failed` is declared as a `failure_list`, which is an array of objects (`delegation_surface.json:35`). The tool schema built for it (`toolbox/params.js:298`) is just `items: {type: "object"}`. It lists no `check` or `reason` properties, because the declaration has no way to give array entries their own keys. The upstream code admits this in a comment at `delegation_toolbox.js:1196`. The only hint is a description saying "each naming the check and the reason", so the worker guessed and sent plain strings.
- **What the refusal says.** The error, `ReportResult parameter 'failed' entry 0 must be an object, got str` (`params.js:151`), says the entry must be an object but never names the keys it needs. A retry would have been another guess.
- **What gets lost.** The parameter check refuses the whole call. So one bad `failed` entry threw away the summary, the `changed` list and every `passed` verdict along with it.
- **Why the budget then cut it off.** The ReportResult call itself took the worker over its context ceiling. The guard stops a turn right after a tool call once it crosses the ceiling (`budget-core.ts` `guardTurn`), so no retry request was ever built.
- **A correct call would have survived.** `report()` stores the result before the guard fires, and an aborted run that already reported keeps `outcome: reported` (`delegation_toolbox.js:650`). So with a schema the worker could get right first time, this run would have come back with a full report and `ended: context_budget`.

**Fix:** let array parameters declare keys for their entries and send them to the model as `items.properties`, the way BUG-20 already does for object parameters. Declare `check` and `reason` on `failure_list`, and have the refusal name those keys. A plain string in `failed` could also be accepted as `{check: <string>, reason: ""}`; it still matches against the requested checks by their normalised text. This needs both the JS and Python implementations plus the conformance fixtures, so it's a lagrange-framework ticket, not code from here.

## 2. An aborted worker comes back with an empty `summary` (this repo, partly already covered)

After BUG-191 and BUG-208, the result already includes `account` (what was written), `wrote`, `activity` (79 operations and the last call, i.e. the refused report) and `ended: {status: aborted, reason: context_budget, occupancy_tokens, ceiling}`. So the ticket's "partial report from the account" is mostly there. What's missing is that `summary` is still `""`. The upstream code marks the run silent and skips the second ask (`_nudgeSkip`, because the turn status isn't `complete`), and nothing fills the summary in.

**Fix (in this repo):** in `reportingDelegationToolbox` (`account-core.ts:1228`), when the outcome isn't `reported` and the summary is empty, write a short host-authored summary from `ended`, `activity` and `account`. For example: "Stopped by the host at 152,499 of 151,200 tokens after 79 operations; wrote N changes (see account); its report call was refused: <error>." It should be clearly marked as the host's account. This is small and fits the BUG-208 pattern.

## 3. Not recommended for this ticket: a reserved report budget

The ticket also asks for the worker to keep budget in reserve for its report. That would need the host to warn the worker shortly before the ceiling. Today the guard is a hard stop, and the proxy only sees streamed events, so it can't add a warning to the worker's context. That would be a new mechanism. Given point 1 above, I'd defer it. The oversized brief (about 10 sections, a component, 6 crops and 7 checks) is still the underlying cause, and EPIC-24's per-section scopes already push toward smaller briefs.

## Proposed split
- **This ticket (BUG-212):** fix 2, the host-written summary, with a UAT for an aborted worker over the context ceiling.
- **New lagrange-framework ticket:** fix 1, the item keys, the clearer refusal and possibly the string fallback. Per our cross-repo rule I'd only file the ticket there. Until it lands, I could also spell out the exact `failed` shape in the declaration text this repo already rewrites, as a stopgap.

Do you want this split, and should I file the lagrange-framework ticket?

<!-- xgd-turn id="1861b100-9f5d-408f-8157-e74c45f4ac25-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T22:59:07.471154+00:00" -->
#### You
Sorry I'd l;ike you to do all three please - you can do multiple commits

<!-- xgd-turn id="1861b100-9f5d-408f-8157-e74c45f4ac25-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T23:12:01.699896+00:00" -->
#### Claude
`toolSet` is where this host builds the worker's tools, both the schemas it sends to the model and the code that runs each call. That gives us a host-side place for fixes 1 and 3.

Before writing anything, I need to know when the adapter records a request's usage relative to running that request's tools. That decides whether a tool handler can read the current occupancy.

Ceiling = 0.9 × (200k − 32k) = 151,200, which matches the incident. Now where model-facing text lives:

Next, how the manager passes `signals` to the backend, so the guard can wrap whatever is already there:

The installed copy matches. Last check before scoping: what `box.run` returns when a call is refused, so the ReportResult wrapper can improve that refusal.

I have what I need to scope it. Next I'll look at the existing UAT harness for aborted workers (BUG-191) so the new tests reuse it.

The BUG-191 harness covers all three cases. Checking the scripted client's request shape (tools, system and messages):

Now I'll scope the ticket. I'm appending the agreed design to the body and keeping the existing content.

Filed lagrange-framework BUG-86. Before coding I'm re-reading my notes on running the workers suite from a fresh worktree:

Copied the gitignored build artifacts in. Next, a baseline run of the BUG-191 suite from the worktree, to confirm the harness works there:

The harness runs in the worktree. Before starting fix 1, checking account-core's imports so the new helpers fit:

Starting fix 1, the report shape.

Fix 1 is wired in, and `toolSet` is the only tool projection in the repo. Now the UAT file. I'm putting all three parts in one file, with tests added per commit, on the BUG-191 harness:

All three pass. To check they're real evidence, I'll run them once against the unfixed host-core:

They fail without the fix and pass with it. Before committing, a typecheck and lint:

Typecheck is clean. Checking this repo's commit-message convention before committing:

Fix 1 is committed. Now fix 2, the host-written summary when a worker ends without reporting.

`HOST_SUMMARY_LEAD` is read inside `HOST_RESULT_FIELDS` at module load, so it has to be declared above it. Moving it up into the report section:

Now the call site in `delegate`:

Adding the fix 2 UATs (a context-budget stop and a turn that finished without reporting) to the same file:

All six pass. Quick check that the two new summary tests depend on the change: I'll swap the call site back to the worker's own summary and run them.

That's the right result. Some older suites may assert an empty `summary` on silent runs, so I'm running the neighbouring delegation suites:

13 failures. My notes say some delegation suites already fail on a clean tree, so first I'll get a baseline: the same suites with both source files at the pre-BUG-212 state.

10 of the 13 fail on the unchanged code too. The 3 new ones are BUG-167 `a_silent_worker_that_only_read…` and two in BUG-208. Looking at their assertions:

Now pointing the new test's import at the moved constant, and updating the two assertions BUG-212 supersedes:

The same 10 tests as the baseline fail, and nothing else does. To make sure those pre-existing failures aren't hiding a `summary` assertion, I'll look at why REQ-295 and REQ-340 fail:

Those failures are about `by` fields and spend records, not the summary, so they're pre-existing drift. BUG-168's turn-clock suite isn't a workers suite, so it runs separately:

Both clean. The BUG-208 consultant-notice test now covers the `workerSummary` fix: it failed before it and passes after. Committing fix 2:

Fix 2 is committed. Now fix 3, the reserve notice, starting with its template in `priming.json`. I'm splicing it in as text because a JSON round-trip churns that file.

Next, the guard in budget-core:

Adding a line to `guardTurn`'s doc comment about the reserve, then wiring it into the builder's backend:

Typecheck is clean. Now the fix 3 UATs: one request below the reserve gets no notice, the next request after crossing it gets one, and the notice is never stored in the dialogue.

All 7 pass. RED check: I'll run them with the reserve removed from the builder's guard.

Now regressions. The guard and `priming.json` are shared, so I'm finding the suites that touch either:

I need baselines for those. I'll run the 4 failing files with every BUG-212 source file put back to its pre-BUG-212 state:

Every one of those fails identically before BUG-212, so they're pre-existing. Committing fix 3:

All three fixes are committed. Now I'll bring the ticket body up to date with what actually landed:

The ticket body is current. Now the merge back to xgd-working: lock first, then merge.

The merge went through without conflicts. Now the ticket overlay check; my notes say the rematerialize path that `lock` prints is missing, so I'm using the `xgd ticket-store` form:

All three fixes are in, as three commits merged into xgd-working. BUG-212 is at `free_coded` (version 0.2.522, branch cleaned up), and its body describes what landed.

**1. A report isn't lost to the shape of `failed`.** This is the host-side version: per our cross-repo rule, the code change in lagrange-framework is a ticket there, not code from here.
- The builder's `ReportResult` schema now names `check` and `reason` on each `failed` entry, and both are required.
- A plain string in `failed` is accepted as `{check: <string>, reason: ""}`. The rest of the report is kept, and the check it quotes still comes back `failed`.
- If a report is still refused, the refusal now ends with the exact shape to send and "Call ReportResult again now".
- I filed **lagrange-framework BUG-86** to add item keys to the declaration language itself, in both languages. Once that lands, this shim can go.

**2. A worker that ends without reporting gets a summary written by the host.** It opens with "The worker did not report; this summary is the host's, from its own records." It then says:
- why the run ended (context limit with both numbers, call or time budget, or no `ReportResult` call);
- how many tool calls it made and which was last, quoting the refusal if there was one;
- whether it wrote anything to the draft.

A worker's own summary is never replaced. Two side effects:
- BUG-167 and BUG-208 each had a test expecting an empty summary on a silent run. This change supersedes that, so I updated both tests and recorded it on the ticket.
- The consultant's "ran out of budget" message would have quoted the host summary as "the worker reported: …". I fixed that, and the existing BUG-208 test now covers it.

**3. A builder is warned before the context limit stops it.** From 80% of the room (the hard stop is at 90%), every further request in that turn tells the builder its token count and the stopping point, and to call `ReportResult` now. The warning rides a per-request channel and is never saved into the conversation, so it doesn't pile up. Only builders get it; the consultant is unchanged.

**Tests:** the 7 new tests in `tests/test_UAT_FC_BUG-212_worker_report_survives_its_budget.workers.test.ts` pass. I checked that each fix's tests fail without that fix. Typecheck is clean. In the related suites, 18 tests fail, and they fail identically with all BUG-212 changes removed. They're in the REQ-340, REQ-354, REQ-295, REQ-379, REQ-342, REQ-285, REQ-341 and AC1320 suites, plus two in BUG-167, and the ones I checked fail on `by` fields, spend and digest assertions. They're listed on the ticket.

I set story points to 5. The ticket is ready for you to promote to `ready_to_reconcile` when you want.

<!-- xgd-chat-end -->