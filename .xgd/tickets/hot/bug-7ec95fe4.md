---
uid: bug-7ec95fe4
id: BUG-208
type: bug
title: 'Builder workers: briefed items skipped, steps run out before the self-check,
  and some end without reporting'
created_by: EPIC-19
created_at: '2026-10-17T13:58:30.805527+00:00'
updated_at: '2026-10-17T14:23:53.059323+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  severity: high
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-afac729f
---

## Symptom

Charlie's plumbing - 3 (`biz_d3c65efa8c51891c3ae734a7cedbcba2`, 2026-10-04) ran 17 builder worker sessions (CHAT-3 to CHAT-19, sessions `worker-builder-1` to `worker-builder-17`). The consultant reported three distinct ways a builder failed to deliver what it was briefed. Each forced an extra builder run and an extra wait for the client:

1. **It ran out of steps before checking its own work** (first rough cut, CHAT-3, 19:33). The consultant: *"The builder ran out of steps before it could check its own work, so I looked at the page myself."*
2. **It ignored part of its brief** (home page fixes, CHAT-4 to CHAT-6, 20:38). The second run did the layout work but skipped the reviews, the contact form and the page title, saying *"the brief did not request"* them. They were items 6–8 of the brief. The consultant guessed that a long brief gets cut short before the builder reads it, and switched to shorter briefs.
3. **It ended without reporting** (applying the Workwear look, CHAT-15 to CHAT-17, 22:05). *"The builder that applied the look went quiet at the end without reporting."* Its last step had also left the contact form half-styled, which nobody was told about.

Charlie 2 saw the third failure four times (EPIC-24 notes).

## What to find out

Find the cause of each failure from the worker transcripts and tool records on those chat tickets, before fixing anything:

- **(2): is the brief delivered whole?** Compare the `Delegate` call's goal text, as the consultant wrote it, with the worker's first user turn. If they differ, find where it was cut. If they match, the worker dropped items it was given, and the fix is in how it works through a brief.
- **(1) and (3): which limit ended the worker,** whether the iteration cap, the wall-clock timeout or something else? Does it now get LF REQ-181's warnings and its "the budget is spent, report now" instruction? REQ-181 has landed upstream; check that this repo's installed framework and the builder role actually receive it.
- **(3): what does the consultant receive** when a worker ends without calling its report? It should be a distinct, stated outcome ("ended without reporting: <which limit>"), never silence, and never something that reads like success.

## Findings

Read from the local D1 (chat and tool transcripts on CHAT-3 to CHAT-19), the R2 audit records under `audit/biz_d3c65efa…/`, and `turn_spend.attributed`. The builder runs on `claude-haiku-4-5`.

- **The brief was cut on the wire at 4,000 bytes; the consultant's guess was right.** The stored transcripts hold the whole brief: for all 17 delegations, the audited `Delegate` goal appears unchanged in the worker's stored first user turn. The model was sent less. The builder role set no `session.turn_max_bytes`, so it inherited the framework's 4,000-byte default bound on a user turn. That bound is sized for a client's paste and cuts with a marker saying the rest can be read back by id, and a worker has no way to read it back. Worker 2's brief was 8,053 bytes with its checks; the cut fell inside item 5's trust strip ("… · Open 8"), which is exactly where its report says it stopped. Items 6–8 and all 7 checks were in the cut half, so it truly never saw them. It learned the check wording only from a refusal, and then failed them as *"the brief did not request"*. Worker 1's 6,006-byte brief lost its check list the same way, which is why its reports answered none of them. The UAT for this caught it: driving a long brief through the real route showed `xgd-turn-elided kept="4000"` in the worker's first request.
- **The builder's page digest is stale for its whole run, and it says to trust it.** `site.digest` is in `builder_reminders`. Upstream assembles a reminder once, when the round opens, and re-sends it after every tool result. A worker's whole job is one round, so every request ended with *"The draft stands at change 6 … 0.0 'Your 1stcontact site' … use it instead of looking, and quote its numbers"*, while its own writes returned `now: 7 … 16`. Worker 1 believed the digest. It replaced the whole page nine times (about 42 s each), concluded that its edits "have not persisted", and ran out of time. Worker 2 ("the page map shows 0.1 as box, 4 children") and worker 13 ("the site snapshot at the start of this turn shows 4 pages") were misled the same way.
- **(1) was the time limit, not the call cap.** Worker 1 ended `exhausted` after 28 requests and ~607 s, at the framework's default 600 s `turn_timeout`. REQ-181 is installed and reaches the builder: it said *"I need to stop and report now due to time constraints"* and called `ReportResult` four times. Its reports answered none of the checks (`checks: 0`). The consultant's result said every check went unanswered because *"the worker's turn ran out of tool calls"*. Upstream gives that reason for every `exhausted` outcome, even when time ran out.
- **(3) is a report written as text.** Worker 13 used 25 requests and finished its turn normally, without calling `ReportResult`. Asked once more by the framework's nudge, it wrote its report as prose wrapped in pseudo-XML (`<ReportResult><summary>…`). That text is never delivered, so the outcome was `silent`. The text named the 9 inconsistent contact-form controls, which is the "half-styled" form. The consultant received `outcome: silent` with an empty summary. The prose reached it only as `activity.last_words`, and `ended` was absent because the turn had "finished". Nothing in the result named why it ended.
- **Step budget measurement.** Requests per worker across the 17 runs ranged from 8 to 45, median 23. One run reached 45 of 50, in the meter's "start converging" band. Earlier records (backends.json) show 3 of 8 builder runs exhausting the 50-call cap. Without the stale-digest loop, worker 1's first page took 3 writes (2 refused, 1 accepted) plus reads, comfortably inside 600 s.

## Fix

- **A brief arrives whole, or delegation refuses it.** The builder role declares `session: {turn_max_bytes: 32000}` (`BUILDER_TURN_MAX_BYTES`, `roles.ts`). That is four times the longest brief the engagement wrote, about 8,000 bytes with its checks, and a few thousand tokens in a 200k window. The host's `ReportingDelegationToolbox` measures the brief as the worker will receive it: upstream's own `brief(goal, checks)`, with every check the caller asked for. Over the cap, it refuses with a declared `brief_too_long` error before any worker opens, telling the consultant to split or shorten the work and naming the size and the limit. A brief is never shortened.
- **The builder no longer gets a stale snapshot of the site.** `page-digest` is removed from `builder_reminders`. Its own tool results are the only account of the site it gets during its run. The consultant keeps its digest; its turns are short, and the digest is rebuilt for each one.
- **The builder's priming says how to work through a brief and how to report.** Before writing, list every item the brief asks for, numbered or not. Do every one, and account for each in the report. A check is part of the brief, so "not requested" is never a reason for failing one. Make each check as soon as its work is done, not all at the end. When a BUDGET line says to report, report what was done, what was not and what was left half-done. The report is the `ReportResult` call; text in the reply is never delivered, however it is formatted. The worker's own tool results are the current site.
- **A builder always gets to report.** REQ-181's meter already reaches it; a UAT now pins that a worker told to report does so and its report reaches the consultant.
- **A worker that ends without a report says why.** The host's `ended` field, which BUG-191 added only for aborted or errored turns, is now present on every non-reported delegation whose worker ran a turn. It names `reason: calls` or `reason: time` with `limit`, the budget's size, when a budget ran out, whether or not a report arrived. It names `reason: no_report` when the turn finished with no budget reached and no `ReportResult` call. It keeps BUG-191's aborted, error and `context_budget` cases unchanged. **This supersedes BUG-191's "a worker whose turn finished silently carries no `ended`".** That case now carries `ended: {status: complete, reason: no_report}`. The consultant's out-of-budget notice (`exhaustionNotice`) also says that a hand-off ended without reporting, and why, instead of the bare "handed off work".
- **Step budget (recorded in backends.json with the measurement above).** `claude_builder` declares `max_iterations: 100` (was the framework's 50), now possible because LF REQ-203 added the key. It also declares `turn_timeout: 600`, the same value as before, now stated so `ended` can name it. The time limit is unchanged because the only time exhaustion was the stale-digest loop. Checking as it goes is the priming half.

**Upstream follow-up, not in this repo:** the framework's `UNREPORTED_REASON` / `UNVERIFIED_REASON` text for `exhausted` always says "ran out of tool calls", even when `exhausted_by` is `time`. `ended.reason` here is correct, but the check reasons beside it can contradict it.

## Test plan

`tests/test_UAT_FC_BUG-208_builder_runs_report.workers.test.ts`, driving the real `POST /api/ai/prompt` route in workerd with a scripted model (the only double):

- A brief with many numbered items (over 4,000 bytes) reaches the worker's first turn unchanged, with its worker-answered checks and no elision marker.
- A brief over the builder's turn ceiling is refused as `brief_too_long`, naming the ceiling, and no worker runs.
- No worker request carries the site digest, while the consultant's still does.
- A worker that keeps working until its tool-call budget is nearly spent receives REQ-181's "post your report now" instruction. It reports, and its report reaches the consultant as `outcome: reported`.
- A worker that ignores the budget and runs out comes back `exhausted` with `ended: {status: complete, reason: calls, limit: 100}`.
- A worker that finishes its turn without calling `ReportResult` comes back `silent` with `ended: {status: complete, reason: no_report}`, not an empty success.
- When the consultant's own turn runs out of budget after a hand-off that ended without a report, its notice says *"the worker ended without reporting: it finished without reporting"* rather than the bare "handed off work".

Superseded UATs, rewritten to the behaviour above:

- `test_UAT_FC_BUG-191_aborted_worker_says_why.workers.test.ts`: "a silent completed turn carries no `ended`" becomes "…says it never reported" (`reason: no_report`).
- REQ-339 behaviour 4 ("a worker still gets the site line and the page digest") in `test_UAT_FC_REQ-339_a_worker_is_told_to_act.test.ts` and `…_the_worker_has_no_memory_…workers.test.ts`: the builder now gets the site line and no digest.
- `test_UAT_FC_REQ-295_delegation_config.test.ts` "every worker sends the same cacheable prefix": the reminder tier names `site.line` and not `site.digest`.

**Explicit supersession:** BUG-208 supersedes BUG-191's "silent completed turn carries no `ended`" and REQ-339's behaviour 4 (the builder receives the page digest).

Regression scope run: 30 delegation, builder, backend and turn-clock suites. Four failures remain, and each also fails on a clean xgd-working (REQ-295 delegation ×2 on `by`/`reason` verdict drift, REQ-341 grant list, REQ-122 manual priming).
