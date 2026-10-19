---
uid: request-49bb6915
id: REQ-409
type: request
title: 'Execution budgets: deliver an outcome, never stop half-done to ask permission'
created_by: xgd
created_at: '2026-10-18T18:25:12.050358+00:00'
updated_at: '2026-10-19T01:03:16.706035+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: high
  epic_parent: epic-95bc3b15
  chat_comment: comment-0bb9ad56
  story_points: 5
---


## What I was trying to achieve
Hand the client a first draft I would defend. In practice the first builder's output had structural gaps: a missing hero section, page colours not using the palette, broken form styling, and a floating header. Fixing them took four more delegations inside one consultant turn. All of these were my own mistakes to fix, not decisions for the client.

## What stopped me / what went wrong
- **Budget and turn shape.** A long build→check→fix chain inside one turn is fragile. The consultant cannot know whether there is room for another pass, and the client cannot tell why the consultant comes back when it does.
- **Progress is opaque to the client.** The only things the client sees during the run are the `note` lines ("Fixing the top banner…"). These arrive with no frame, so a novice reads them as things going wrong, not as quality control.
- **No mid-run client input.** Anything the client says during the chain is not visible to the consultant until the end, and in practice it was lost entirely (filed separately as a bug).

## What would have let me finish
1. An explicit "first-draft mode" in which the consultant may continue across turns (or with an extended budget) until its own acceptance checks pass. It must not take taste decisions, which still stop and wait for the client.
2. A client-facing progress channel written in plain language, e.g. "Checked the draft: headline missing → adding it (step 2 of ~4)", distinct from the one-line delegation note.
3. Client messages delivered to the consultant between tool calls, so it can acknowledge them and fold them in mid-run.

## Suggestion vs gap
The gap is (a) a bounded but sufficient budget for self-correction on the first draft, and (b) visibility in both directions while it happens. The three items above are suggestions for closing it.



## Notes (EPIC-19, 2026-10-18)

The three asks mostly have homes already; what's left is narrower than a first-draft mode.

- **Item 3 (client messages mid-run)** is BUG-224. Not repeated here.
- **Item 2 (plain-language progress)** is largely BUG-215 (ready_to_reconcile): a turn line with the opening estimate and a step line timed from when the step started, with routine steps shown as light step lines. Anything still missing after BUG-215 is deployed belongs here, e.g. a step count ("step 2 of ~4").
- **Item 1 (budget for self-correction).** Four repair passes on a first draft are mostly the other defects showing: builders passing checks that were false (BUG-225), whole-page scopes that let a fix rewrite other sections (BUG-225, REQ-410), and builders running one after another (REQ-410). Fix those first and re-measure. If a first draft still can't finish inside one turn, the narrow version of this request is: the consultant may continue a first draft into a follow-up turn of her own, without a client message, only for her own acceptance checks, never for a taste decision, with a fixed cap and the client told.



## Decision (operator, 2026-10-18): give the client an outcome, not confusion

*"It is a poor user experience when the AI ends with a half finished piece of work and has to ask permission to continue. This user is not paying the token bill, I am — we need to give them an outcome not confusion."*

This supersedes the measure-first plan above. A budget is a safety net against runaway, never a way to ration the client's work.

### 1. Raise the budgets
| | now | new |
|---|---|---|
| Consultant (`claude`, Opus 5.5) calls per turn | 50 (framework default, never set) | **200** (`max_iterations` in `backends.json`) |
| Consultant time per turn | 30 min (`turn-clock.json`) | **60 min** |
| Builder (`claude_builder`, Haiku 4.5) calls per run | 100 | **200** |
| Builder time per run | 10 min | **20 min** |

The builder model stays Haiku 4.5. Its context limit (200k window, stopped at about 150–168k) is not raised; item 3 handles it.

### 2. A turn that hits a budget continues by itself
When a consultant turn ends on a budget (calls, time or context) with work in progress, the host starts a **continuation turn** automatically, with no client message, carrying the work in progress. At most **2 continuations** per client message. The client sees *"Still working on [the task]…"*, never a question asking whether to go on. She stops and waits only for a decision that is the client's: taste, content or an approval.

### 3. A builder that runs out is replaced by a fresh one
When a builder ends on its context budget, call budget or time, the host recommissions **a fresh Haiku builder** (a new session, so a new 200k window) with:
- what is already done, taken from the host's account of what changed, never the previous builder's summary;
- what is left of the brief, with the original checks;
- the same scope, claimed as the first builder releases it.

At most **2 replacements** per delegation. The consultant receives one combined result, with the account covering all of them. Only if the work is still unfinished after that does she hear that it was not completed, and why.

### 4. The real backstop is spend
A per-turn spend ceiling of **$10**, counting the consultant's turn, its continuations and every builder it commissions. It is visible to the operator, never to the client. When it is reached, the consultant finishes cleanly and says what is left. The limit is configuration, not a constant.

### Test plan
UATs (`test_UAT_FC_REQ-409_*`), real host, only the model scripted:
- A consultant turn that hits its call budget mid-task continues automatically with no client message; the transcript shows the continuation and no permission question; a third would-be continuation does not start.
- A builder that ends on its context budget is replaced by a fresh builder whose brief carries the host's account and the remaining items; the consultant gets one result.
- The $10 ceiling ends the work cleanly once crossed, counting builders' spend.
- `backends.json` and `turn-clock.json` carry the new limits, and both backends are constructed with them.


## What landed (REQ-409, 2026-10-18)

The operator's decision above, as built. Every behaviour below has a UAT in `tests/test_UAT_FC_REQ-409_an_outcome_not_a_question.test.ts`, through the real host with only the model scripted.

### 1. Budgets raised
- `backends.json`: `claude.max_iterations: 200` (the consultant had never set it and ran at the framework's 50); `claude_builder.max_iterations: 200`, `claude_builder.turn_timeout: 1200`. The builder stays on `claude-haiku-4-5`; its window is not raised.
- `turn-clock.json`: `turn_timeout_seconds: 3600`, plus three new keys: `max_continuations: 2`, `max_builder_replacements: 2`, `spend_ceiling_usd: 10`. All three are configuration, read by `turn-clock-core.ts`.

### 2. A consultant turn that runs out of calls or time is continued by the host
- When a consultant turn ends `exhausted` (calls or time) with work in progress, the host starts a continuation turn itself, with no client message, up to `max_continuations` per client message, while the message is under its spend ceiling (`continuedTurn` in `host-core.ts`).
- Instead of a question, the turn's closing paragraph says *"Still working on it: <the current step's own words>…"*, followed by the list of what the turn did, which the continuation reads back. Only the last reply, once the continuations are used, says it stopped: *"That is as far as I can take this in one go. Send me any message and I will continue from here."* No reply asks permission to go on.
- The continuation is started by a fixed host cue recorded as the user turn (`continuation-cue` in `priming.json`). It tells the consultant to carry on with her own checks, not to ask whether to continue, and to stop only for a decision that is the client's (taste, content, approval). Like the opening cue, it is hidden from the transcript the client sees.
- The client's stream carries one terminal `done`, the last turn's. Each continuation is still a whole turn with its own pending record, spend row (turn id `<id>-continued-N`) and clock.
- **Design decision:** a turn stopped by the **context** guard is not continued. That conversation is full, and the next turn would be refused before it started (the existing "start a new conversation" path). The ticket's "(calls, time or context)" therefore applies to builders (item 3) but not to the consultant, whose window is 1M.

### 3. A builder that runs out is replaced by a fresh one
- When a delegation's builder ends on its calls, its time or its context (`ended.reason` of `calls`, `time` or `context_budget`), the host recommissions a fresh builder session, up to `max_builder_replacements` per delegation and only while under the spend ceiling (`reportingDelegationToolbox` in `account-core.ts`).
- The fresh builder's brief is the original goal (with the story block and the original checks), plus *"A builder before you started this brief and stopped before finishing: <why>."*, plus the host's record of what was already written (the account's differences, capped at 40 lines), or *"The host's record shows it wrote nothing to the draft."* It is never the previous builder's summary. It claims the same scope, which the previous run's `finally` has released.
- The consultant receives one result: the last run's summary, checks and outcome, plus `replaced: N`, `sessions: [...]`, and `account.changed` / `usage` merged across all runs. If the work is still unfinished after the replacements, `ended` is still present, and the result field descriptions tell her to tell the client what is left and why.

### 4. The per-message spend ceiling
- `SpendMeter` (`spend-core.ts`) is charged per request, priced from `prices.json`, by the guard on every backend serving the message: the consultant's turns, the continuations, and every builder (`guardTurn`'s new `charge` hook). It resets on each client message.
- Once the ceiling is crossed:
  - the consultant is told on every following request (`spend-ceiling` template, on the per-call signal) to start no new work, commission no builder, and tell the client what is done and what is left, without mentioning cost;
  - a new `Delegate` call is refused with `spend_ceiling` before anything runs;
  - no builder is replaced and no continuation starts.
- The operator sees it as a `console.warn` naming the session and the micros spent, which is the Worker's log. The client never hears of cost.

### Superseded behaviour (existing UATs updated)
- BUG-168: the clock is 60 minutes. A turn that runs out of time is continued until the continuations are used. The old "Ask me to carry on" line is gone.
- BUG-191, BUG-212, REQ-296: a builder stopped by its context budget is now replaced twice. Those cases now script every builder to go over, so their result (the last run's) still shows what they pin.

### Test plan (as run)
- `test_UAT_FC_REQ-409_the_budgets_are_raised_and_both_backends_are_built_with_them`
- `test_UAT_FC_REQ-409_a_turn_out_of_tool_calls_is_continued_by_the_host_and_finishes`: the continuation needs no client message, the client sees no permission question, and the cue is hidden from the transcript.
- `test_UAT_FC_REQ-409_a_third_continuation_never_starts`
- `test_UAT_FC_REQ-409_a_builder_out_of_context_is_replaced_by_a_fresh_one_briefed_from_the_host_record`: the consultant gets one result.
- `test_UAT_FC_REQ-409_the_spend_ceiling_ends_the_work_cleanly_counting_the_builders_spend`
