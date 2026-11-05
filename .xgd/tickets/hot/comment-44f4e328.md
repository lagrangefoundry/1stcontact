---
uid: comment-44f4e328
id: COMMENT-5823
type: comment
title: Comment on request REQ-483
created_by: xgd
created_at: '2026-10-28T22:19:38.013825+00:00'
updated_at: '2026-10-29T21:08:07.633632+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-92812788
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "dc2e32c1-1503-4452-bc7c-6321f59391fb",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-28T22:19:32Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-28T22:19:32Z" -->
#### You
How do we split into multiple invocations? Should we not do that now rather than create a patch that will become code debt? What is involved in the investigation? Create a ticket to do that and create the fixes.

<!-- xgd-chat role="assistant" ts="2026-10-28T22:19:32Z" -->
#### Claude
Delegate runs the builder in the same request, so all CPU sums. Options: move heavy tools out (A), run each builder session in its own invocation via a framework seam (B), resumable turns (C). Measure first by profiling a replay; keep the auto carry-on as a general safety net.

<!-- xgd-turn id="210ee61b-cab1-40d1-80bf-f6ac405a4d92-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T18:36:38.230675+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="210ee61b-cab1-40d1-80bf-f6ac405a4d92-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T18:55:10.417940+00:00" -->
#### Claude
Reading the ticket and the turn/delegation code so I can scope Phase 1 (measure) before choosing the split.Found a builder replay harness (REQ-452/454); checking whether it can drive a faithful turn in Node, where CPU can actually be measured (workerd freezes its clocks).

Pulling the production site's pages into a temp copy for the CPU probe.

Writing a throwaway Node probe that times the heavy primitives (preview render, validation, PNG decode/tile/encode, pixel diff) on the production site and a real full-page screenshot.

Framework source matches the installed copy, so the polling is still a full re-read upstream. Checking the framework's ticket store for an existing ticket before filing one.

Measuring the framework's watchers directly: a real 6.5 MB dev session log, `ControlWatcher` at its default interval, and the delegation stop-watch, for 5 seconds of wall time.

Filed lagrange-framework **BUG-101** (`bug-c77500d1`). Now recording the findings and the decision on REQ-483, appended so the existing body stays intact.

`--append-body -` took the dash as literal text. Checking the body's tail, then re-applying with `--append-body-file`.

Ticket updated. Saving two memories: the CPU root cause, and the `--append-body -` quirk.

That quirk is already recorded. Saving only the CPU finding.

I measured where the CPU went. It wasn't the tools or the delegation, so splitting the turn across invocations wouldn't fix it. The real fix is in lagrange-framework, so I've filed it there as **BUG-101** (`bug-c77500d1`). No code has landed against REQ-483 and it stays at `draft`.

**What the CPU is.** Two of the framework's stop-checks re-read and re-parse the entire session log from the start on every tick:
- `ControlWatcher.check()` runs every 50 ms for every live turn.
- The delegation watch runs every 100 ms for the whole `Delegate`, on the consultant's log.

The site conversation's log is never trimmed (local dev logs are 6–27 MB), and one full read costs about 3.5 ms of CPU per MB. On a real 6.5 MB log with nothing else running:

| Check | CPU, as a share of elapsed time |
|---|---|
| `ControlWatcher` | 42–46% |
| delegation watch | 22–23% |
| both, reading only new records | about 1% |

So a turn's CPU grows with log size times how long the turn lasts, whatever it does. On a ~4 MB log over 13.8 minutes that comes to about 290 s, which matches production's 303 s.

**The tools are cheap.** I took the lost turn's tool mix from production (~45 `set_l1`, ~27 `screenshot`, ~10 `compare`, 6 `describe_page`). I timed each step on the production 1st Contact site with a real full-page screenshot:

| Step | CPU per call |
|---|---|
| `screenshot` | ~200 ms |
| `compare` | ~120 ms |
| render | 20–60 ms |
| `set_l1` | 7 ms |

That totals tens of seconds, not 300. These figures come from Node rather than the Worker, because the Worker runtime's clock doesn't advance while code is running, so CPU can't be timed there. The JavaScript is the same.

**Why no split.** Moving tools out (A) or builder sessions out (B) leaves the consultant's own check polling its log for the whole request. A 13.8-minute turn on a 6.5 MB log would still cost ~350 s without delegating at all. Resumable turns (C) is the largest change and keeps the waste. The fix is for both checks to read only what's new since the last tick. Once BUG-101 lands, a turn like the lost one should come to about 20–40 s, roughly 10% of the limit. That number is an estimate; I couldn't measure it yet. BUG-312's automatic carry-on stays as the safety net.

**What's recorded where:**
- **REQ-483:** the original body is kept, with the findings, the decision, the expected numbers and a revised test plan added. The budget test `test_UAT_FC_REQ-483_first_draft_turn_within_cpu_budget` is still planned here, as this repo's guard once the fix is in the shared framework package. It would fail today, so I haven't committed it.
- **BUG-101** (lagrange-framework): the measurements, the fix design and its test plan. Per your rule about other repos, I wrote no framework code.

Decision for you: until BUG-101 lands, a small interim change here would cut both checks about 5–10×. It means passing `pollIntervalMs: 250` and `stopPollMs: 1000` in `host-core.ts`, both settings the framework already has. The cost is that a Stop can take up to a second to land. It's the kind of tuning patch you said you didn't want, and BUG-101 would make it redundant, so I left it out. Do you want it shipped as a stopgap?

<!-- xgd-turn id="4dc147c6-294b-44e3-9e4e-4384650912f8-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T19:11:01.274485+00:00" -->
#### You
Are we comfortable that the consultant can run for 50 minutes building the first draft with these fixes?

<!-- xgd-turn id="4dc147c6-294b-44e3-9e4e-4384650912f8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T19:11:44.317334+00:00" -->
#### Claude
No, not with BUG-101 alone. It removes the dominant cost, but a 50-minute first draft leaves less margin than the 13.8-minute turn did, and I haven't measured any of the after-numbers.

**A 50-minute draft runs as one Worker request.** The host's automatic continuations (REQ-409: up to `max_continuations: 2`, plus the held-round cues) loop inside the same request (`host-core.ts` ~7040). `turn_timeout_seconds` is 3600, so all 50 minutes share one 300 s CPU budget.

**Estimated CPU for 50 minutes after BUG-101** (an estimate from the lost turn's rate, not a measurement):
- **Tools:** about 2 s of CPU per minute, so roughly 100 s.
- **Remaining full log reads:** the framework still re-parses the whole log a few times per round, not per tick. At ~190 rounds on a log growing from ~4 MB to ~10 MB, that's another 20–30 s.
- **Total:** about 120–150 s, or 40–50% of the limit. That's at the edge of the ticket's 50% budget, and a busier builder or a longer log pushes it over.

**Other things that could end a 50-minute request, which I haven't checked:**
- **Memory (128 MB):** the Worker holds the whole session log in memory and parses copies of it each round. With a 10–27 MB log, that may be the next wall.
- **Client disconnect:** since BUG-277, a turn keeps running after the panel disconnects, held open by `waitUntil`. As I recall, Cloudflare caps `waitUntil` at about 30 s after the client goes, which would end a long turn soon after a closed tab. I haven't checked this against the docs or the BUG-277 code.
- **Deploys and evictions:** BUG-312's carry-on already handles these, once per turn.

**What would make me comfortable:**
1. **Widen BUG-101** so the per-round reads also tail the log, or the junction drops closed turns once archived. Then CPU no longer depends on log size at all.
2. **Run each host continuation in its own request.** The `lost` cue BUG-312 added already starts a fresh request with a fresh budget. Routing REQ-409's continuations the same way would cap any one request at one turn, with no framework change. This is 1stcontact code and fits this ticket.
3. **Make the budget test a 50-minute draft** with a multi-MB log, and record memory use as well as CPU.

Shall I add the 50-minute requirement and option 2 to REQ-483, and widen BUG-101 with option 1?

<!-- xgd-turn id="bacdc33c-4ced-47ae-a43b-43136092b314-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T19:21:01.293734+00:00" -->
#### You
101 has just delivered - the log tail should ahve been in it - please create another bug for that
2. This is implemented, right? can we increase the auto restart budget from 2 to say 5 please?

<!-- xgd-turn id="bacdc33c-4ced-47ae-a43b-43136092b314-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T19:24:42.663733+00:00" -->
#### Claude
Filing the framework bug first, for the remaining whole-log reads that BUG-101 didn't cover.

Filed **BUG-102**. Now the continuation budget. It's pinned at 2 by a REQ-409 UAT, so this goes through free coding on REQ-483.

The test hard-codes 2 for the count of "Still working on it" lines. Tying it to the configured budget.

Tests pass. Bumping the version and committing on xgd-working under the session lock.

Updating the stale "no code lands" line in the ticket body, then releasing the lock.

The continuation budget is now 5, and the new framework bug is filed. One correction first: option 2 is not implemented. I only proposed it last turn. Continuations still run inside the same Worker request as the turn they continue, so they share one 300 s CPU budget.

**New framework bug.** lagrange-framework **BUG-102** (`bug-9a496ef2`), at draft. BUG-101 (`b535719ae4`) fixed the two checks that ran every 50–100 ms. BUG-102 covers the whole-log reads it left, which run per round, per tool call or per progress line. Each costs 20–90 ms on a 6–27 MB log. The ticket lists every call site and makes the per-round ones the priority. It also asks whether to trim finished turns from the log once they're archived, which would bound every full read.

**Continuations raised from 2 to 5.** Committed as `3ae609e9f24` on xgd-working, version 0.2.702. REQ-483 is at `free_coded` with the ticket body updated.
- `max_continuations` is 5 in `turn-clock.json`. The 60-minute ceiling per client message, the spend ceiling and builder replacements (2) are unchanged.
- REQ-409's budgets test now expects 5. Its loop test had a hard-coded 2 for the "Still working on it" lines. It now reads the configured value, so it exercises all five. The test's name still says "third", which I've noted on the ticket for reconcile to rename.
- REQ-409, BUG-168 and BUG-241 suites all pass. The REQ-409 loop test failed on the hard-coded 2 until I tied it to the setting.

Because the 60-minute ceiling covers the whole message, raising continuations to 5 can't make a request run longer than an hour. It does let more of that hour be spent working. So until BUG-102 lands, or each continuation gets its own request, a 50–60-minute draft can still get close to the CPU limit. If it does hit it, BUG-312's carry-on catches it once. Do you want me to implement option 2 under REQ-483 now?

<!-- xgd-turn id="272ce74d-b460-4c78-a761-cda93535067b-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T19:43:45.468004+00:00" -->
#### You
yes please

<!-- xgd-turn id="272ce74d-b460-4c78-a761-cda93535067b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T20:36:12.909774+00:00" -->
#### Claude
Reading the REQ-409 continuation loop and BUG-312's carry-on path first. The design should reuse the existing cue mechanism, not add a second way of starting a turn.

Recording the scope on REQ-483 before coding, then cutting a branch.

Worktree ready. Using BUG-312's Worker test as the template for the new route tests.

Implementing the host side: a `ROUND_HANDOFF` marker, yielded at each continuation point when the host has opted in.

Now the edits: the constant, the `HostDeps` option, and a yield at each of the three continuation points.

Now the router: set `handOffRounds` on the Worker host, park at the marker, and take the `continue` cue.

Adding `handOffRounds: true` to the Worker host's deps, then the route changes.

Now the route and `streamTurn` changes, as one scripted edit:

Typecheck is clean. Now the panel: when a stream ends with `continues`, send the `continue` cue, and fall back to the Carry on notice if it's refused.

Panel wired. Now the Worker UATs, modelled on BUG-312's suite and REQ-409's exhaustion script.

Both new Worker UATs pass. Now the existing Worker suites that expect a continuation inside one request: they should now see a hand-off instead.

13 failures. Running the same suites on clean xgd-working to see which failures predate this change.

Now patching each suite's prompt helper to read the whole message:

Down to one failure of mine: BUG-249's ledger check, which now needs to read the second request's row. `stalls_twice` fails the same way on clean xgd-working. Updating the ledger assertion:

Clean apart from the existing failure. Next, the full Worker suite in batches, to catch hold paths my grep missed, compared against a baseline.

Many hold-related failures. Baselining exactly those files on clean xgd-working to separate mine from pre-existing:

About 30 tests across ~15 files now fail, all hold or recovery suites that read a whole message from one response. Checking whether they share a support helper before patching each one:

Most share one shape: a local helper that builds a `route(...)` request to `/api/ai/prompt`. Reading a few to write one mechanical patch:

I'll script the common `route(...)` shape: wrap it with `.then(first => wholeMessage(first, () => route(<the same request with the continue cue>)))`, then patch the odd ones by hand.

All 13 pass, BUG-229 included, so its earlier crash was load in the big batch. Now the panel UAT, using BUG-312's panel test as the template.

Both pass, and they ran rather than skipped. Now the node suites that load the panel (`chat.js`) or the host continuation loop:

All seven fail the same way on clean xgd-working. Updating the `continuedTurn` header so it doesn't contradict the new behaviour:

Everything passes apart from the failures that predate this change. Recording on the ticket what landed, then committing and merging back.

Committed. Now the merge-back sequence: lock, merge xgd-working into the branch, bump the version, then merge.

Merged and cleaned up. Saving one memory for future test authors, since every Worker test of a multi-round message now has to follow the hand-off.

Option 2 is in. Each continuation of a client message now runs in its own Worker request, with its own 300 s CPU budget. It's merged into xgd-working; it isn't deployed, and I haven't watched a real long draft run with it yet.

**How it works:**
- **Where a request ends:** at any point where the host would start a continuation, the Worker finishes the round and ends that request. That covers REQ-409's budget continuation, the layout, structure, review, promise and held-round holds, and the stall and error recoveries. The last frame says the work continues.
- **Where the next round starts:** the panel then sends a `continue` cue and the next round starts from exactly where it stopped. The remaining continuations, the 60-minute clock, the spend ceiling and any owed work are all kept, because the message's state stays in memory between requests rather than being saved and reloaded.
- **What the client sees:** each round arrives in a new chat bubble instead of being appended to the same one. Nothing is sent in their name.

**Fallbacks:**
- **Cue refused:** if the cue reaches a different Worker instance, or comes more than 10 minutes later, it's refused. The panel then shows the existing "The work stopped before it finished" notice with its Carry on button.
- **Client writes first:** a new message from the client replaces the waiting round.
- **Client gone:** if the client has disconnected, nobody sends the cue, so the round runs on in the same request as before.
- **Local `1c`:** the local host is unchanged.

**Limit:** this caps a request at one round, not at a fixed time. One round can still run up to an hour, so CPU inside a single long round still depends on BUG-102.

**Side effect on the turn log:** a message that recovered from a stall or error now has one row per request. The first row says "continued in a new request", and the recovery's cause is on the later row.

**Tests:**
- **New tests, all passing:** a continuation runs in its own request; `continue` with nothing waiting is refused; the panel sends the cue and falls back to Carry on.
- **Updated suites:** 23 existing Worker suites, mostly the hold and recovery ones, read a message as a single response. They now follow the cue through a shared helper, `tests/support/whole-message.ts`, and four read the later ledger row.
- **Full Worker suite:** no new failures compared with clean xgd-working. The ones still failing (BUG-249 `stalls_twice`, REQ-342 and about 20 others) fail the same way there.

**Commits:** `212d51ede93` (the change) and `35e4bbe4367` (version 0.2.704) are added to REQ-483 alongside `3ae609e9f24`. REQ-483 is at `free_coded` with 8 story points, and the ticket body describes what landed.

**Before shipping:** the browser panel only picks up the change after an asset build (`1c assets`) and a deploy. I'd check one real long first draft in dev before production, to see rounds arriving in separate bubbles and the turn log showing one row per request.

<!-- xgd-turn id="9b960e6e-7f17-4e46-a7cd-9e730fd641da-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T20:56:42.625949+00:00" -->
#### You
Can you answer the questions in BUG-102's transcript in its ticket please

<!-- xgd-turn id="9b960e6e-7f17-4e46-a7cd-9e730fd641da-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T21:07:57.358232+00:00" -->
#### Claude
Reading BUG-102's open questions and checking the framework's `SessionLog` so the answers are grounded.

I've answered BUG-102's three questions in its ticket body, under a new "Decisions" section, with the existing content kept. No code was written, and REQ-483 is unchanged.

1. **How to stop re-reading the whole log: option (A), a shared cache of parsed records, with three conditions.**
   - **Share it per log, not per handle.** Two handles open on the same session log share one key, and the cache should use that key. Then the other readers (`control.js`, `agent_toolbox.js` and the orchestrator) get the saving as well as `manager.js`.
   - **Don't spot a rewritten log by its size alone.** That was the proposal's plan, and it's unsafe. The framework only rewrites a session log by deleting it and seeding it again from the archive. If the re-seeded log comes out larger than the cached part, a check that only resets when the log shrinks would join old records onto the new log. So deleting or seeding has to clear the cache, with the shrink check kept as a backstop. I added a test for this case to the ticket.
   - **Freeze records once, when they're parsed.** Freeze them all the way down, so any code that edits a shared record fails in tests.

   On memory: production's log was about 4 MB, so expect roughly 10–20 MB held per open site session in the Worker's 128 MB. That's fine for now. The cache must also be freed when a session is closed.
2. **Python too: yes.** Change it alongside the JS, as BUG-101 did. 1stcontact only runs the JS version, so the Python tests have to cover their side themselves.
3. **Trimming finished turns out of the log: left out of this fix, but recorded in BUG-102 as the open follow-up.** It's the only thing that stops the cache and the remaining whole-log reads growing with the log. It should get its own ticket when you ask for one, or sooner if a production log nears ~15 MB.

The framework session that asked can now go ahead with the fix.

<!-- xgd-chat-end -->