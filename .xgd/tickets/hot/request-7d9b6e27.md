---
uid: request-7d9b6e27
id: REQ-386
type: request
title: Tell the user before any long-running operation, with a rough duration (1 min
  / 5 min / 30 min)
created_by: xgd
created_at: '2026-10-04T18:30:59.347301+00:00'
updated_at: '2026-10-04T21:00:53.555910+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  epic_parent: epic-95bc3b15
  chat_comment: comment-fd4f41e6
---



## What we were trying to do
During a consultation, the consultant agent made several `capture_site` calls back to back in one turn. Two of them timed out and were retried. The turn lasted about 20 minutes, and the user saw nothing: no message saying work had started, nothing about what was happening, and no idea how long it would take.

## What stopped us
- As far as the agent can tell, the user only sees the agent's final reply. Text written before or between tool calls in the same turn does not seem to reach them, so the agent cannot say "starting now, about 5 minutes" partway through a turn.
- `Delegate` has a `note` parameter that is shown to the user straight away. `capture_site` and other slow operations (`screenshot`, `compare`, `check_fidelity`, `CreateImage`, `EditImage`) have nothing like it.
- The agent's guidance says to announce work before going away, but only for delegation and before a turn ends. It does not set a threshold or ask for a duration estimate.

## What would close the gap
The product owner's requirement: **if the agent will be busy for more than about 20 seconds, the user must be told first, with an order-of-magnitude estimate: about 1 minute, about 5 minutes, or about 30 minutes.**

Suggestions, not requirements:
1. A user-visible `note` (as on `Delegate`) on every operation that can take more than a few seconds, shown the moment the call starts.
2. Or a general "status line" tool the agent can call mid-turn, shown to the user straight away.
3. Progress for retries: "site X timed out, retrying (2 of 3)".
4. Add the 20-second rule and the 1/5/30-minute estimate to the per-turn guidance, so the agent applies it consistently.


## Relation to REQ-379 (added by EPIC-19, 2026-10-04)

Not a duplicate. **REQ-379** (landed) gave `Delegate` a required client-visible note, shown before the builder session runs, and the "Meanwhile, N questions above need you" line. This ticket **generalises** that to every slow operation (`capture_site`, `screenshot`, `compare`, image generation and editing), adds the 20-second threshold and the about-1/5/30-minute estimate, and reports retries as they happen. Build it **on REQ-379's mechanism** (the same note-shown-before-the-call path), not as a second status channel. Check the consultant's belief that text written before a tool call doesn't reach the client: on the API path, prose deltas stream as they're produced, so the gap may be the consultant's lack of feedback, not delivery.


## Scope as implemented (free-coded, REQ-386)

**Delivery check (answering the question above):** on the API path the framework streams prose deltas as they are produced (`api_tools.js`: "Prose already went out as deltas"), and a call's `tool_issue` is yielded before it runs. So text the consultant writes before a tool call *does* reach the client live. The consultant's belief was wrong, and the per-turn reminder now says so.

**What the client sees.** Before a known-slow tool call runs, the host shows one italic line in the chat. It says what is happening and gives an order-of-magnitude estimate: about a minute, about 5 minutes, or about 30 minutes. For example, `_Capturing https://example.com — about 5 minutes._` It is the same mechanism and position as REQ-379's `Delegate` note (`keepClientOriented` in `cadence-core.ts`, wrapping the consultant backend's stream). There is no second status channel.
- The slow tools, their client-facing label, and their estimate class live in one data file, `slow-tools.json`: `capture_site` (5 min), `screenshot`, `compare`, `check_fidelity`, `CreateImage`, `EditImage` (1 min each). An estimate must be one of 1 / 5 / 30 minutes.
- The host owns the line. It is guaranteed whatever the model says, the same reasoning as REQ-379. No `note` parameter is added to these tools, because that would add per-call tokens and declaration surgery on a framework-owned surface (`CreateImage`/`EditImage`). The consultant adds context in prose before the call, and that prose streams.
- Every slow call is announced, not just the first one in a turn, because each call is new waiting time.
- "Meanwhile, N questions above need you" (REQ-379's panel count) is added only to the first announcement of a turn, whether that is a `Delegate` or a slow tool. It is not repeated on every line.
- `Delegate` is unchanged. Its model-written note is still shown once per turn, with the duration the model gives.

**Retries.** When a slow call has the same tool and the same input as an earlier call in the same turn whose result was an error (`Error: …`), it is announced as a retry: `_Capturing https://example.com again (attempt 2; the last try failed) — about 5 minutes._` Attempts are counted per tool+input within the turn. No "of N" is shown, because the host has no retry cap: the consultant re-issues calls itself.

**Per-turn guidance.** A new consultant per-turn reminder, `announce-long-work`, sits right after `commission-construction`. REQ-342 requires `commission-construction` to directly follow `act-rather-than-narrate`, and REQ-171 keeps the whole reminder under 600 characters. It reads: "Busy for more than about 20 seconds? Tell your client first: about a minute, 5 minutes or 30 minutes. They see what you write before a tool call as you write it."

**Test plan.** `tests/test_UAT_FC_REQ-386_long_work_is_announced.workers.test.ts` drives the Worker's own `/api/ai/session` and `/api/ai/prompt` routes. It uses a real D1, the real ticket store and the real capture pipeline. The only doubles are the Anthropic client and the browser. The scripted consultant captures a private address (refused by the capture guard, a real failure), captures it again, captures a good URL, then calls a fast tool. The test checks that:
- each capture's line precedes that call's `tool_activity` and carries "about 5 minutes"
- the repeat says "again (attempt 2; the last try failed)"
- "Meanwhile, 2 questions above need you" appears exactly once, on the first line
- the fast tool gets no line
- the next turn's transcript carries the host's line
- `slow-tools.json` lists exactly the six tools, each estimating 1, 5 or 30 minutes
- the consultant's first request carries the 20-second reminder

Regression scope run: the REQ-379 cadence and panel suites, REQ-378 comp board, REQ-206, REQ-283, REQ-339, REQ-342, REQ-364, REQ-171, REQ-182, and the priming/config suites. All pass. The one failure in REQ-295's config suite (the REQ-341 case) also fails on clean xgd-working.
