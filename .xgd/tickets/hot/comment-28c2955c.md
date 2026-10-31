---
uid: comment-28c2955c
id: COMMENT-5763
type: comment
title: Comment on request REQ-466
created_by: xgd
created_at: '2026-10-26T20:29:32.598147+00:00'
updated_at: '2026-10-26T20:56:12.001890+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-92560d1d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "99523142-b3fb-436b-804a-99f1dffd3e35",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c39cc131-5741-4de4-bda1-62eb4f8e1495-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T20:29:01.409641+00:00" -->
#### You
Is this ticket dependent on resolving the contradictions in DOC-70 found by REQ-465?

<!-- xgd-turn id="c39cc131-5741-4de4-bda1-62eb4f8e1495-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T20:31:12.490066+00:00" -->
#### Claude
No, REQ-466 doesn't depend on the DOC-70 contradictions. The two tickets were filed as companions: REQ-465's out-of-scope section names REQ-466 as "the companion request filed beside this one". They don't block each other in either direction.

- **The contradictions are about wording, not size.** D-1 to D-9 ask which of two passages the consultant should follow, for example whether the hand-back is "about three lines" or the four-part hand-over. Whichever way the operator decides, the text gets a few hundred characters shorter or longer. REQ-466 changes how that text is measured, and the measurement works the same either way.
- **REQ-466 was designed not to wait on any cuts.** Item 2 sets each role's target "at today's measured size plus a small margin, so it doesn't block current work, and lowered as the audit's cuts land." Cuts that land before it just lower the starting figure. Cuts that land after it lower the target. Either order works.
- **The cuts don't depend on the contradictions either.** DOC-70's proposed first cut (about 11.4K system chars) and the later cuts are all high-confidence deletions and merges. The nine decisions are listed separately as "contradictions, not deletions".

There are a few weaker links, none of them blocking:

- **Measurement boundaries.** DOC-70's breakdown of the captured request is a good guide for REQ-466's split between authored text and the knowledge landscape. It shows the knowledge map at about 3.9K, the knowledge providers, and the manuals wrapped by `km.mechanism`. REQ-466 can use it without anything else being resolved.
- **Manual projection by role (DOC-70 Cut 3, framework).** The consultant currently reads builder manuals. If Cut 3 lands, the consultant's authored figure drops. That is only a new baseline for REQ-466.
- **The per-turn tail.** It holds the truncated plan entry and the REQ-171 limit (599 of a maximum 599), and decision D-9 touches it. REQ-466's budget doesn't count it: it covers priming, manuals and tool definitions only. So D-9 has no bearing on REQ-466 either.

I haven't changed the ticket. I can add a short "Relationship to REQ-465 / DOC-70" note to the REQ-466 body saying it's independent and DOC-70's breakdown is the reference for the split, if you'd like that.

<!-- xgd-turn id="c975db56-5043-44b8-bb73-641b2aa51342-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T20:39:40.423198+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c975db56-5043-44b8-bb73-641b2aa51342-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T20:56:11.682652+00:00" -->
#### Claude
Still investigating. Next I'm working out how priming providers are registered, so the host can measure the knowledge landscape's output on its own.

Still mapping where spend figures surface. Next I'm reading the spend route and the Debug tab's turn listing, to decide where the authored-prompt figure appears.

Still investigating. I'm finding how the framework sizes `parts.system` and `parts.tools`, so the authored figure uses the same units as the live columns.

Still investigating: I'm checking what context the framework passes priming providers, so the landscape measurement can be tied to its session.

Worktree is ready. Next I'm running the BUG-129 UAT to get a baseline before changing anything.

Baseline is green. Next I'm checking the existing tenant-cost and spend-route tests, so the new UATs follow the same pattern.

I have the test pattern I need: REQ-438 covers the consultant, builder and critic rows in one run. Now writing the core module.

All landscape registrations go through `registerCorpusProviders`, so that's the one place to measure it. Writing the core module.

Now the spend record: two new fields on `RequestSpendRecord`.

Now the migration, the request-row columns and the test schema list.

Now the live report: a per-role read of the latest authored figure in spend.ts.

Now the targets in priming.json. I'm inserting them with a text splice, because a JSON round-trip churns that file, and starting with placeholder values to replace once measured.

Now the UATs. First I'm checking how BUG-166 calls the admin spend route and mounts the console pane.

The core module, migration, route field and a two-case UAT are written. Running the new UAT now. The targets are still placeholders, so this first run is for measuring.

Two failures. My line-picker was off by one, and one role wrote no row. I'm dumping the rows to see which role.

No rows at all: unmetered scripted steps write nothing. I'll wrap every step with `metered()`, as REQ-438 does.

Both cases pass now. Next I'm reading the measured sizes to set real targets.

Workers swallow `console.log`, so I'm throwing a temporary error that carries the rows instead.

Measured: the consultant's authored prompt is 229,242 characters, the builder's 133,853 and the critic's 8,309. I'm setting the targets at about 2.5% above those figures and removing the debug line.

Now BUG-129's UAT: drop the doubling and use the stated landscape margin.

Now the console: a prompt-size block in the tenant cost pane.

Now the console UAT, using jsdom like BUG-166.

The new and adjacent UATs pass (40 tests). Next, a wider regression sweep of spend, priming, the fixture and knowledge suites, plus a typecheck.

A long path filter makes vitest find nothing, as I'd noted before, so I'm running it in batches.

Three REQ-416 failures. My notes say at least one REQ-416 priming UAT was already red on clean `xgd-working`. I'm checking the messages, then running the same file on the main checkout as a baseline.

The same three fail on the main checkout, so they were failing before my change. Next, a typecheck.

Typecheck is clean in both projects. Next I'm updating the ticket body, keeping the existing text and adding what was built.

The ticket body is updated. Next I'm committing the work on the branch.

Committed as `858a29e`. Next I'm checking my note on the free_coded version gate before merging back.

Only ticket files came in with the merge, so the test results still stand. Merging into `xgd-working` now.

The branch is on `xgd-working` as a fast-forward. Next, moving the ticket to `free_coded` and letting the gate do the version bump.

I've implemented REQ-466 and merged it into `xgd-working`. The ticket is at `free_coded` (version 0.2.673, 5 points); it has commit `858a29e` plus the gate's version bump, and the body now records what was built. I didn't need to ask you anything; the calls I made myself are listed below.

**What it does**
- **One figure covers everything authored.** Each request now records its authored size: system text plus tool definitions, minus the client's knowledge landscape. Moving a paragraph from priming into a tool description leaves the figure unchanged.
- **The landscape is measured separately.** It's counted as its provider produces it, and stored per request in two new `request_spend` columns (`authored_chars`, `landscape_chars`, migration 0035).
- **Targets are configuration.** A new `prompt_budget` block in `priming.json` holds the per-role targets and a 50,000-character landscape margin.
- **The backstop is unchanged.** `MAX_PRIMING_CHARS` stays at 200,000 and still refuses. The BUG-129 headroom check, and the same check in REQ-182's test, now assert priming plus the landscape margin fits, instead of doubling.
- **It shows live.** The admin spend route returns each role's latest prompt size, and the console's *Business cost* pane has a *Prompt size* grid: role, authored, target, landscape. A role over its target is shown in red.

**Measured today and targets set (about 2.5% headroom)**

| Role | Authored chars | Target |
|---|---|---|
| Consultant | 229,242 | 235,000 |
| Builder | 133,853 | 137,000 |
| Critic | 8,309 | 8,600 |

**Decisions I made**
- **The talker has no target of its own.** It reads the consultant's system text and a subset of its tools, and it's metered as `consultant`, so the consultant's target covers it.
- **The coordinator and settings roles have no target.** They appear on the console with the target shown as a dash.

**Expect the live consultant to show red.** The live Dina's Diner request (DOC-70) works out to about 242,600 authored characters, above the 229,000 the test tenant measures. So the consultant will read as over its target on the console until DOC-70's cuts land.

**Tests**
- Two new UATs: one runs a consultant turn that delegates to a builder and runs the critic, and also proves the move-a-paragraph case. The other covers the console grid.
- I ran 45 suites covering spend, priming, knowledge, migrations, the console, delegation and the talker. Everything passes except three REQ-416 talker cases, which fail the same way on clean `xgd-working`.
- Typecheck is clean.

<!-- xgd-chat-end -->