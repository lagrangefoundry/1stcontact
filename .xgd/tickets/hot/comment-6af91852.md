---
uid: comment-6af91852
id: COMMENT-4844
type: comment
title: Comment on bug BUG-182
created_by: xgd
created_at: '2026-10-03T19:34:29.467563+00:00'
updated_at: '2026-10-03T20:01:38.615189+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f06f6245
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "413e12c9-1d29-47e7-9cba-2f5ae5684e0d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="3326f071-c95c-4fca-af91-c32e889f18aa-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T19:28:24.244073+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="3326f071-c95c-4fca-af91-c32e889f18aa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T20:00:28.505871+00:00" -->
#### Claude
Reading the delegation and turn-clock config to find where the worker's operation budget comes from.

Now reading how checks are paired (`unaskedChecks`/`reconcile`) and what the builder is primed with.

Checking the ticket's chat comment for session/run evidence, and how the element vocabulary reaches the worker.

Last check: the status of upstream REQ-203 (configurable `max_iterations`).

## BUG-182: what I found

I changed nothing in code or in the ticket. I also couldn't find the run's own records on this machine (they live in the deployed environment), so the numbers below are inferred from the code.

### 1. Why the budget runs out: a 50-call cap per run, and the worker is a Haiku
- **The builder runs on `claude-haiku-4-5`** (`tools/generate/src/cli/ai/backends.json`, `claude_builder`). The consultant runs on Opus 5.5.
- **Each worker run is capped at 50 tool calls.** The framework hard-codes `MAX_TOOL_ITERATIONS = 50` (`lagrange-framework/components/ai/js/src/backends/api_tools.js:48`), and the backend never passes a different value.
- **A worker that runs out gets a second run.** If it ends without reporting, the framework gives it one more turn (the "nudge", `delegation_toolbox.js:577-588`), which also allows up to 50 calls. That matches what you saw: 64 = 50 + 14 and 90 = 50 + 40. The nudge says "do not start any more", but in pass 2 the Haiku went on working for 40 more calls instead of just reporting.
- **This was already known.** The comment block in `backends.json` says `claude_builder` should have `max_iterations: 100` because "3 of 8 builder runs exhausted the 50-call limit". It's blocked on **lagrange-framework REQ-203**, which is still `draft`. Until that lands, the host can't add the key, because the framework's `configureBackends` refuses keys it doesn't know and the host wouldn't start.

### 2. Why orientation is expensive: the worker is never given the element vocabulary
- **The builder's priming has no element vocabulary.** It gets its role text, the **summary** manual, and the system knowledge base's map. The summary leaves out parameters and return shapes on purpose (REQ-171). The surface's `element` shape only says "the element itself… exactly as stored".
- **The vocabulary lives only in `kb/system/REF-l1.md`.** That's about 40k characters: element kinds, then about 60 field shapes. The worker can only reach it through knowledge-base searches and reads, one tool call at a time. That's the "read the L1 vocabulary carefully… read the L1 schema outline" in its `last_words`.
- **A blank site makes this worst.** The normal way to learn the vocabulary is to read an existing element and copy its shape. A page with only a placeholder heading has almost nothing to copy, so all of the orientation cost lands on the budget.
- **Skipping the contact form fits this picture.** Short on budget, the worker narrowed the job ("brief specified … structure, not adding form"). That's the kind of narrowing the role text forbids.

### 3. Why correct answers to checks are lost
The matching is in the framework (`delegation_toolbox.js`):
- **Matching is nearly exact.** `normalise` (line 1518) only lowercases, collapses whitespace and strips a trailing full stop. A reworded check, a leading `- ` copied from the brief's bullet list, surrounding quotes, or curly versus straight quotes all fail to match.
- **Pass 2, refused report.** `report()` refuses the *whole* report with `unasked_check` if any `passed` entry doesn't match. The worker presumably retried with only the entries that matched exactly, which is why the record is partial.
- **Pass 3, `unreported` checks.** `unaskedChecks` checks only `passed`. A `failed` entry that matches nothing is accepted silently and then dropped when results are tallied. So a reworded `failed` entry, or an answer given only in the summary, leaves the asked check `unreported`, with nothing telling the worker. That fits "the summary answered both".

### Where each fix would go
| Gap | Fix | Repo |
|---|---|---|
| 50-call cap | Land REQ-203, then set `max_iterations` for `claude_builder` in `backends.json` (one-line host change) | framework, then 1stcontact |
| Nudge turn keeps working | Give the nudge turn a small iteration cap, since it should only report | framework |
| Vocabulary fetched piecemeal | Add a condensed L1 element vocabulary as a stable entry in the builder's priming (the kinds-of-element part of REF-l1, about the first 190 lines). It sits in the cached prefix, so it costs little per delegation | **1stcontact** |
| Check wording | Strip leading bullets and quotes in `normalise`; refuse unmatched `failed` entries the way unmatched `passed` ones are refused, so the worker can correct them | framework (JS and Python, with conformance tests) |

### My recommendation
BUG-182 should take on the one fix that belongs to this repo: **prime the builder with the condensed L1 vocabulary**. It's what the ticket's own "Expected" asks for: spend the budget on content, not on orientation.

The other three belong in the framework. REQ-203 already covers the cap. The nudge cap and the check matching would be new framework tickets; check matching is cross-language, so it needs conformance tests in both JS and Python.

**Decision for you:** should I scope BUG-182 to the priming change, and file the framework items as tickets there (with your OK)? Or do you want to hold BUG-182 until REQ-203 lands and do the `max_iterations` change here as well?

<!-- xgd-turn id="941ae0ce-2acc-4597-8abb-c88f0be713e8-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T20:01:26.781758+00:00" -->
#### You
Please continue

<!-- xgd-chat-end -->