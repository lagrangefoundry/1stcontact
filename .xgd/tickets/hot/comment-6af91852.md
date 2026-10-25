---
uid: comment-6af91852
id: COMMENT-4844
type: comment
title: Comment on bug BUG-182
created_by: xgd
created_at: '2026-10-03T19:34:29.467563+00:00'
updated_at: '2026-10-03T20:29:58.319131+00:00'
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

<!-- xgd-turn id="941ae0ce-2acc-4597-8abb-c88f0be713e8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T20:29:56.794380+00:00" -->
#### Claude
I'll take "continue" as a go-ahead for my recommendation: scope BUG-182 to priming the builder with the condensed L1 vocabulary. Reading the ticket and the priming code first.

Still reading code; nothing has been changed. I'm checking how the builder's priming providers are wired, so the vocabulary can be added as one more entry the same way.

Now scoping the ticket and cutting the branch.

Building the shared, file-free schema walk module by moving the helpers out of `kb-projection.ts`.

Writing the new module.

Now the `priming.json` entries and template.

Writing the first UAT.

Running the new UAT in the branch worktree.

All 4 pass. Now I'll look at the rendered vocabulary itself, to check its size and that it reads well.

The vocabulary UAT passes, including the new value sets. Next, the end-to-end UAT: a real delegation in workerd, checking what the worker is actually sent.

Both pass. Now the regression scope: the builder priming suites, the KB projection suites (since I moved helpers out of `kb-projection.ts`), and a typecheck.

Seven failures. The REQ-295/REQ-341 delegation cases are on my notes as already failing on a clean tree. The four BUG-48 failures need checking, since they cover the projection I touched.

Same failures on the clean tree, so they're pre-existing. The two REQ-295 workers cases match my notes from 2026-10-01. Now a typecheck.

I'll commit on the branch, merge it back under the lock, then call `move-to-free-coded` without `--version` so the command does the bump itself. My notes say that avoids the version race.

The work has landed. Last step: the ticket body needs the one change from during the build (the named-values section) and the test results.

I went ahead with my recommendation: BUG-182 now covers the one fix that belongs to this repo. Every builder worker is primed with the page vocabulary, so it no longer has to look field names up one search at a time. The work has landed on xgd-working, the ticket is at `free_coded` (version 0.2.454, 3 story points), and the branch is cleaned up. I haven't promoted it to `ready_to_reconcile`; that's your call.

**What the worker now gets**
- **Where:** a new "page vocabulary" section in both of the builder's priming setups (with and without the system knowledge base). It sits second, after the role text and inside the cached part of the prompt, so it costs one cache write per deployment rather than a fetch per delegation.
- **What it lists:** the page's own fields, every kind of element with its fields (the ones every kind shares are listed once), every field shape those reach, and every named value set.
- **Size:** about 14k characters against `REF-l1`'s 39k. It drops the per-field explanations but omits no kind, field or shape.
- **How it stays current:** it's generated from the same L1 schemas `REF-l1` comes from, by a new module, `tools/generate/src/cli/ai/l1-vocabulary-core.ts`, that reads no files and so also works in the deployed Worker. `kb-projection.ts` now uses the same code instead of keeping its own copy, and `REF-l1` comes out unchanged.

**One gap I found while building it:** `REF-l1` never lists what the named value sets accept. It says "`layout` — layout mode" but never `stack | row | grid`, and the same goes for `easing`, `align`, `color` and others. A worker reading only `REF-l1` would still have to guess these, so the vocabulary spells them out. `REF-l1` itself still has the gap; it could be fixed the same way if you want.

**Tests**
- Two new tests pass: one checks the vocabulary against the schema, and one runs a real delegation in workerd and checks the worker's prompt (with and without the knowledge base). The consultant's prompt doesn't get the vocabulary.
- The 14-file regression run had 7 failures, all of which also fail on the clean tree without my change:
  - **BUG-48 (4):** a structural rule, `zoomGroupChromeAgrees`, has no definition to project.
  - **REQ-341 (1)** and **REQ-295 workers (2):** already on my list of known failures.

**Still open, in lagrange-framework (no tickets filed yet):**
- The 50-call cap per worker run. This waits on REQ-203; then `claude_builder` gets `max_iterations: 100` here.
- The nudge turn gets a full 50 calls when it should only report.
- Check matching in `ReportResult` is too strict: a reworded `passed` check gets the whole report refused, and a reworded `failed` check is silently dropped.

Should I file tickets there for the last two?

<!-- xgd-chat-end -->