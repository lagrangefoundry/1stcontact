---
uid: comment-07d6a4dc
id: COMMENT-3023
type: comment
title: Comment on request REQ-262
created_by: xgd
created_at: '2026-09-16T21:40:12.882573+00:00'
updated_at: '2026-09-17T01:11:09.691821+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ba7e2bb9
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3abbcbce-d460-480f-bfb6-ea92d97b4e54",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="054f9a55-6b0c-4bfc-aae8-3f30353b8fda-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T21:40:03.466897+00:00" -->
#### You
Can you outline what your plan is here for priming a session. Let me lay out my expectations:

1. We need to create a knowledge base specifically for this function that contains all the relevant docs including DOC-63 which is specifially for this
   2. We need to review the prompt that we are giving the AI together once everything else is in place
   3. We need to make sure that the AI has proper access to the tools - I just discovered that it didn't have xgd execution so it couldn't make tickets properly!!

<!-- xgd-turn id="054f9a55-6b0c-4bfc-aae8-3f30353b8fda-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T21:43:30.426594+00:00" -->
#### Claude
I read the ticket, the brief, `ai.ts`, and the first round's actual artifacts. Two things need saying before the plan, because both change it.

## Two corrections first

**1. There is no DOC-63.** The highest doc ticket is DOC-53 — *"The reproduction engine and the loop-1 session — the diagnosing session's knowledge base"*, `doc_kind: architecture`. That is the one the ticket names and the one I'll work on. Its §1 (the pipeline map) is still marked **TO BE WRITTEN** and is a deliverable here.

**2. The first round did not fail for want of `xgd`. It produced a complete, excellent gap ticket and the console threw it away.**

`storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-1/ai/outcome.json` reads `status: failed`, `reason: "the round produced no outcome block."` But `transcript.txt` ends with a full, well-formed `"status": "filed"` block — the `coverage-check-misses-section-background-images` diagnosis that DOC-53 §3.1 already records as the first round's finding.

The cause is `parseOutcome` in `ai.ts:~470`:

```
/```(?:json)?\s*\n([\s\S]*?)```/g
```

Non-greedy. The ticket `body` is a JSON string containing literal ` ``` ` fences — because brief §6.3 *requires* the round to quote `gate.json` and `values-diff.json` with their actual numbers, and that is how anyone quotes JSON. The match terminates at the first inner fence, the JSON is truncated mid-string, no later fence parses, and the round is recorded as having produced nothing. I reproduced it: 1 fence found, `Unterminated string starting at line 8 column 13`, 0 parsed.

The failure mode is perverse: **the better the round's evidence, the more certain it is to be discarded.** A thin, unquoted diagnosis would have parsed fine.

By the REQ-261/REQ-262 split this is REQ-261's ("what the round hands back"), and I have not touched it. But it is worth more than anything in this ticket and I'd fix it first. Tell me whether to file/extend it there or pull it in here.

Related, and also uncomfortable: the round reached ticket knowledge by **reading `.xgd/tickets/hot/request-7ff1bacd.md` directly by path** (transcript line 89). Nobody gave it that path; it grepped `^title:|^status:` and found the store. So requirement 7 is not currently held — not because the prompt points at a path, but because nothing stops the round finding one.

---

## The plan

### Part 1 — the session KB

**Selection rule.** `doc_kind` is single-valued and already means production membership, so it can't carry this; DOC-53 is `architecture` and must stay so. Three candidates:

| | drift risk | cost |
|---|---|---|
| hand list in console code | high — drifts from what exists | nil |
| `fields.session_kb: true` opt-in on the doc ticket | low — travels with the document | one field |
| link-walk from DOC-53's Related | nil — self-maintaining | pulls in whatever gets linked |

**Recommend the opt-in field**, with the six named docs (DOC-53, 23, 27, 30, 19, 21) asserted present by a test — so the rule is a rule, and the minimum set is a floor that can't silently empty.

**Mechanism.** Mirror `exportCorpus` (`tools/generate/src/cli/kb.ts:354`), which already solves exactly this: the *console* (which has `Bash`) runs `xgd ticket list --type doc --view --json`, filters on the field, and writes `<DOC-ID>.md` into a `kb/` directory in the console workspace, rebuilt per round so it cannot go stale. The round reaches it with `Read`/`Glob`/`Grep` alone. Requirement 6 is then structural, not a promise.

**Plus a generated `INDEX.md`** — one line per document saying *what question it answers*. This is the thing that stops the KB from just making the prompt longer: the round reads the index and then one document, not six.

**Non-mixing.** Forward direction is already free — `inSystemKb` admits only `doc_kind: system_kb`, so DOC-53 is excluded by construction; I'll assert it rather than assume it (requirement 5). Reverse direction needs your call: I'd **permit** a production doc in the session KB via the same opt-in field, one document at a time, so it's a deliberate act and not a category leak.

### Part 2 — the prompt review

Done *after* Part 1 exists, reviewed with you, as you asked. My going-in position:

- **Keeps**: §1 constraints, §2 the one rule, §3 reading order, §4 verdicts, §5 residual-class naming, §7 the output contract. All of it earned its place — the first round followed §3's order exactly and §5's class name is textbook.
- **Moves to the KB**: vocabulary and the engine map. The brief teaches method and should not grow a glossary.
- **Changes**: §7's worked examples get a *realistic* body (the ticket is right that a toy example teaches a toy shape) — **and an explicit rule about fenced blocks inside `body`**, which is the writing half of the parser fix. §8's Related becomes reachable KB filenames instead of `[[DOC-19]]` citations the round cannot follow.
- **Dropped**: §6 and §7 restate the ticket shape twice; consolidate.

I'll state keeps/moves/drops as a table in the ticket before changing a line, so the review is a review and not a diff read.

### Part 3 — tools

The constraint is measured and I'm not relitigating it: the **deny list is the gate**, the allow list is not. So "give the round `xgd`" means putting `Bash` back, which reopens everything.

What the round actually needs is **read-only ticket search** — and it is already doing it, by grepping the store. Two honest routes:

- **Broker**: the console exports a ticket digest (id, type, title, status, one line) into the KB each round; grep over that is sanctioned, and full-body reads go through a request back to the console.
- **Scoped `Bash`**: `--allowedTools 'Bash(xgd ticket get:*)'` with everything else denied. This *might* gate correctly — prefix rules are a different mechanism from omission — but the original finding was measured and so must this be, before anything relies on it.

I'd **measure the scoped rule first** (it's ten minutes and the answer is durable either way), then choose. If it doesn't gate, broker. Writing stays the console's under both.

### Part 4 — measurement

Baseline from the failed round: **18 tool calls**, 7 of them `Read`, 8 `Grep`. Cost needs REQ-261 req 13. A primed round on a comparable reproduction gets the same two numbers recorded beside it.

---

## What I need from you

1. **The `parseOutcome` fence bug** — fix here, or under REQ-261?
2. **Selection rule** — opt-in field, as recommended?
3. **May a production-KB doc enter the session KB?**
4. Confirm you meant **DOC-53**, not DOC-63.

Nothing committed yet, and no code until the ticket body carries whatever we settle.

<!-- xgd-turn id="7672f117-da6f-4293-acdb-c0ab5764ff40-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T22:02:55.367328+00:00" -->
#### You
- **The **`parseOutcome`** fence bug** — fix here, or under REQ-261? REQ-258 made changes to 261 perhaps it added this fix there
- **Selection rule** — opt-in field, as recommended? No need for opt in just do it this is a dev tool don't over complicate
- **May a production-KB doc enter the session KB? Yes very much so**
- Confirm you meant **DOC-53**, not DOC-63. I did my bad

<!-- xgd-turn id="7672f117-da6f-4293-acdb-c0ab5764ff40-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T22:05:55.992916+00:00" -->
#### Claude
REQ-258 is custom domains — unrelated. But you were right that it's already handled: **REQ-261 covers the fence bug** (its behaviour 1, requirement 1) and it's `free_coded` with three commits — and all three are now in `xgd-working`. `jsonObjectsFromEnd` has replaced the fence regex in `ai.ts`. That landed during this session; my read was from before the merge. Nothing for me to do there.

Let me re-read the current `ai.ts`, since REQ-261 also reshaped `buildPrompt` and the round context I'm about to extend.

Sizing the sweep-all rule: **52 doc tickets, 888 KB (~222k tokens if all read)**, median 14 KB. So the index isn't a nicety — it's what makes sweep-all viable. Recording the decisions in the ticket now.

Decisions are in the ticket body (appended, nothing overwritten). Here's the settled plan, and the one thing still unmeasured.

## What your answers changed

**Sweep-all makes the index load-bearing.** 52 docs, 888 KB, ~222k tokens. The round can never read the KB — it searches it. So `INDEX.md` (one line per doc: *what question does this answer*) isn't a nicety, it's the mechanism. A KB built without one is not built.

**D4 fell out of your "don't overcomplicate".** Since there's no opt-in to check, the KB is a straight export: console writes `<DOC-ID>.md` per doc into its workspace, frontmatter stripped, rebuilt every round. Requirement 6 becomes structural. This also closes a hole I found — requirement 7 is *not* currently held: the first round read `.xgd/tickets/hot/request-7ff1bacd.md` by path after grepping `^title:|^status:`. Nobody gave it that path. Exporting is what makes the sanctioned route cheaper than the unsanctioned one.

## Sequence

1. **Measure the scoped `Bash` rule** (D5) — running now, below. Gates the Part 3 decision.
2. **Write DOC-53 §1**, the pipeline map, plus the learnings section. Doc change, no branch.
3. **Cut the branch. Build the KB export** — `kb.ts` in the console, mirroring `exportCorpus`; `INDEX.md` generator; `RoundContext.kbDir`, which follows the `digestFile` precedent REQ-261 just set.
4. **Review the prompt with you** — keeps/moves/drops as a table before I change a line. Note REQ-261's resume path complicates this: a resumed round doesn't get the brief again, so the KB pointer has to survive resume.
5. **Ticket search** — broker or scoped, per step 1's result.
6. **Measure**: baseline is the first round at **18 tool calls** (7 `Read`, 8 `Grep`); cost comes from REQ-261's telemetry.

Running the D5 measurement now — three `claude -p` calls, one-line prompts:

While that runs, reading DOC-53 so I know exactly what §1 owes.

**Test A reproduces the original finding exactly** — `"permission_denials":[]`, `result: "It ran. Output: MEASURED-A."`. `Bash` merely absent from the allow list still runs, on today's CLI. That measurement is not stale.

**Test B settles it.** With `Bash(xgd ticket get:*)` in the allow list and `Bash` not in the deny list, a *non-matching* `echo MEASURED-B` **ran, exit 0, no denial**. The scoped allow rule does not gate — it's the same failure as a bare omission.

All three complete. Recording the measurement in the ticket, since requirement 8 demands it be recorded beside the policy.

## D5 is measured, and the answer is no

| | tool flags | asked to run | `permission_denials` | outcome |
|---|---|---|---|---|
| **A** control | `Read Glob Grep`, no deny list | `echo MEASURED-A` | `[]` | **ran** |
| **B** scoped, non-matching | `… 'Bash(xgd ticket get:*)'`, deny list without `Bash` | `echo MEASURED-B` | `[]` | **ran**, exit 0 |
| **C** scoped, matching | as B | `xgd ticket get request-ba7e2bb9` | `[]` | ran |

**A** re-confirms REQ-256's original finding on today's CLI — that measurement isn't stale. **B** is the result that matters: naming a prefix rule doesn't *narrow* `Bash`, it *admits* `Bash`, and the prefix isn't enforced. **C** is moot — a mechanism that permits the command you wanted and every command you didn't is not a gate.

So: **console-as-broker**, `Bash` stays denied by name, requirement 9 holds, and DOC-53 §2's "there is no `xgd`" stays true. Measurement is in the ticket and reproducible from `.xgd/tmp/d5/run.sh`; it'll go beside the policy in `ai.ts` next to the finding it re-confirms.

That means your point 3 lands differently than expected. The round never lacked ticket-*making* — that was the fence bug, fixed under REQ-261. What it lacks is ticket-*searching*, and it can't be given `xgd` without giving it everything. The broker is what it gets: the console pre-fetches a ticket digest into the KB each round, and full-body reads go through a request back to the console.

## Where that leaves the plan

Steps 1 and the decisions are done. Next is **DOC-53 §1** — the pipeline map, a doc change needing no branch — then the branch and the KB export.

Two things worth your eye before I write §1:

1. **What the digest carries.** A digest of id/type/title/status across all open bugs and requests is ~cheap and greppable; full bodies are 888 KB on docs alone and much more across all tickets. I'd start with the one-line digest and let the round ask the console for a body it wants. Reasonable?
2. **The broker needs a request channel** — a round asking the console for something is a new interaction shape, and the round's only output today is the final outcome block. That's plausibly REQ-261 territory again ("what the round hands back"). I'd rather scope it here and say so than let it fall between the two.

Say go and I'll write DOC-53 §1.

<!-- xgd-turn id="288c0e6f-1ef2-43f1-9bd6-aa4c690b7372-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T23:08:07.822253+00:00" -->
#### You
1. This is probably better just queried real-time with the ticket API than added to the kb it is a rapidly moving picture.
   2. Ok this was an idea of REQ-258s I saw it in passing but I don't understand what it means is this about permissions? I want to give the system all the permissions it needs. I do not want to baby sit the process answering low level questions that I probably won't understand. What is this about?

<!-- xgd-turn id="288c0e6f-1ef2-43f1-9bd6-aa4c690b7372-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T23:10:25.107298+00:00" -->
#### Claude
Let me check one thing before answering, because it may change the answer entirely.

That changes the answer. Let me confirm the two pieces.

**This isn't about babysitting, and it turns out the broker was a workaround for a problem `xgd` already solved.**

Answering your question first, plainly:

"Permission" here doesn't mean anyone gets asked anything. The round is a headless `claude -p` subprocess with no human attached — nothing can prompt you, ever. What the word means is: **what is this unattended process physically able to do while nobody is watching?** Today the answer is "read files, and nothing else," because it's diagnosing the very engine it would otherwise be able to edit, and because a ticket set to a `ready_*` status spawns an autonomous pipeline within ~30 seconds. That's the thing being protected — not your attention.

(Also: the broker idea isn't REQ-258's, it's REQ-262's own §4. REQ-258 is custom domains.)

**And it's now moot.** `xgd mcp-server start` exposes exactly two tools:

- `ticket_search` — semantic search over every ticket type, *"the index is refreshed incrementally before each search"*
- `system_search` — xgd's own methodology docs

**There is no write tool in that server.** Not denied, not filtered — it doesn't exist. And `claude --mcp-config <file> --strict-mcp-config` loads only that server, ignoring every other MCP config on the machine.

So you get exactly what you asked for in both points: real-time ticket query against a moving picture (your #1), full access with no babysitting (your #2), and no ability to mutate — because the mutating verb isn't in the interface. That's the same kind of gate as the deny list, which is the only kind we've measured to work.

Measuring it now, same shape as D5:

Working directory had persisted in the xgd repo — the config landed there. Re-running with absolute paths.

The measurement is running — `ticket_search` builds a semantic index over the whole ticket store on first use, so the first call is slow. I'll report when it lands.

To summarise where the two answers leave the design:

**Your #1 — tickets queried live, not baked into the KB.** Agreed, and `ticket_search` is exactly that ("the index is refreshed incrementally before each search"). So the split is clean: the **KB is documents you read whole** (52 doc tickets exported as `<DOC-ID>.md` + an index), and **everything else is live search**. No ticket digest, nothing to go stale.

**Your #2 — no babysitting, full access.** The MCP route gives more access than the broker would have, with less machinery, and drops the round-trip I was about to ask you to scope. It replaces D5's conclusion, which I'll amend in the ticket once measured.

What I'm checking is the one thing that would sink it: that `--strict-mcp-config` plus the deny list actually produces a round that **can** search tickets and **can't** run a shell. Given D5 showed allow lists don't gate, I'm not assuming this one does either — same test, both halves in one call.

<!-- xgd-turn id="fcdd9a4b-09a4-4fb4-977e-26348ca8a7f0-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T23:57:49.383317+00:00" -->
#### You
DO NOT touch the xgd mcp code it is about a year old and to my knowledge completely unmaintained.

The API xgd exposes to claude code is the command xgd - just use it. What is the problem that you are trying to solve?

<!-- xgd-turn id="fcdd9a4b-09a4-4fb4-977e-26348ca8a7f0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T00:17:02.386969+00:00" -->
#### Claude
You're right to stop me. Dropping the MCP direction entirely — I won't touch that code.

## The problem, plainly

The round is a headless `claude -p` subprocess. To run `xgd` it needs the `Bash` tool. **`Bash` is currently in the round's deny list by name** (`ai.ts`, `AI_DISALLOWED_TOOLS`), so the round cannot run any command at all — that's REQ-256 behaviour 3, and it's why the console files tickets on the round's behalf today.

I then measured whether `Bash` could be handed over *narrowly* — `--allowedTools 'Bash(xgd ticket get:*)'`. It can't: that admits `Bash` wholesale and does not enforce the prefix (`echo MEASURED-B` ran, exit 0, no denial). So it's all or nothing.

That's the whole problem. It's one line, and it's a policy call, not a technical one — which is why I kept bringing it back to you instead of just deciding. I should have put it that plainly two turns ago.

## Taking your answer as the decision

You've said twice that you want the round to have what it needs without you in the loop, and now that the interface is the `xgd` command. So: **`Bash` comes off the deny list, and the round runs `xgd` directly.** I'll stop asking.

One consequence I'll state once and then handle in code rather than ask you about: with `Bash`, "the round cannot write" stops being a property of the process and becomes an instruction in the brief. The only version of that I actually care about is a ticket created at a `ready_*` status, because the dispatcher spawns an autonomous pipeline against it within ~30 seconds. That doesn't need your attention — the console can list what the round created and assert none of it is at a `ready_*` status, as a check that reports, not one that prompts. I'll build that alongside.

Amending the ticket now, since requirement 9 and D5 both say the opposite of what we've just decided.

Recorded. D7 supersedes D5, requirement 9 amended, requirement 11 added. The plan is settled — moving to the work.

Starting with DOC-53 §1, the pipeline map, which needs an accurate survey of the engine.

Enough to write an accurate map. Note the bundle holds 11 files; the brief names only 4 — a prompt-review finding for later. Checking how to replace a section rather than append:

Now writing §1 — the pipeline map — grounded in the module headers I just read.

§2 and §3.3 both still assert "no `Bash`, no `xgd`", which D7 reverses. Fixing them so the document is internally consistent.

DOC-53 is complete — requirement 3 met. §1 is a six-part pipeline map (capture / fold / L1 / probes / gate, plus the field-distinctions list), §2 and §3.3 now match D7, `doc_kind: architecture` preserved so it stays out of the production corpus.

Cutting the branch for the code half.

Branch cut. Building in the worktree.

Confirmed: 52 docs with bodies, untruncated, DOC-53 at 15,213 chars. Writing the KB module.

Typechecks clean. Now the tool policy and the prompt wiring.

The measurement script is gitignored, so that reference would dangle. Committing it beside the policy instead — which is what requirement 8 actually asks for.

Now the KB section in the prompt and the `ready_*` assertion.

2 minutes for a full list of 643 tickets — far too slow to run twice a round. Checking cheaper shapes.

4.8s for a status-filtered list — cheap enough to run either side of a round. Writing the assertion.

Now wiring both into `console.ts`.

Typechecks clean. Now the UATs.

Before writing UATs, adding the ticket language a few of them need — retirement, rebuild cadence, and fail-soft — so every test traces to the body.

The test caught a real bug: `xgd` prints a trailing log line after the JSON, and slicing to end-of-string breaks the parse. Fixing it properly, in one place.

`parseJsonOutput` already exists and has the same trailing-suffix blind spot. Extending it rather than hand-rolling a second parser.

All 17 pass. Checking I haven't broken the neighbouring suites.

Expected — that test asserts the behaviour D7 deliberately reversed. Updating it honestly rather than deleting the assertion.

Passes on the main checkout, fails in the worktree — the known location artifact, not my change. Confirming:

Confirmed: `apps/control-app/src/generated/` is gitignored and absent in the worktree. Copying it from the main checkout, as the known fix.

All console suites green. Committing before anything else — worktrees have been torn down mid-session before.

The commit didn't land — my fallback heredoc construction misfired. Redoing it cleanly.

Needs the gating command with a version bump. Checking the current version.

Needs lock-and-merge-back first. Following the protocol.

Merged, promoted, cleaned. Final verification on the main checkout:

All green on `xgd-working`. Let me generate the real index so we have something concrete to review.

`npx` can't install (root-owned npm cache — I won't run installs). Using the already-installed vitest instead, as a throwaway.

Tree is clean; nothing of mine left behind. Here's where things stand.

## Shipped — REQ-262 `free_coded` at 0.2.228

Merged to `xgd-working`, branch cleaned, **69 tests passing** across the four affected suites.

**The KB.** `session-kb.ts` sweeps every `doc` ticket through `xgd ticket list`, writes one `<DOC-ID>.md` per document, and generates `INDEX.md`. I built it for real against your store: **52 documents + index**, and the summaries are genuinely useful — DOC-13 reads *"Capture an external web page into a structured, AI-facing reference bundle…"*, which is exactly enough for a round to decide whether to open it. Rebuilt every round, retired docs swept out, and a KB that can't be built never fails the round.

**The tool grant.** `Bash` is off the deny list; the round runs `xgd` directly. `measurements/tool-gating.sh` is committed beside the policy carrying both measurements, so the justification is re-runnable rather than folklore.

**What the grant cost, and what replaced it.** `readyStatusViolations` compares trigger-status tickets before and after each round and reports anything that arrived at one — reports, never prompts. The status-filtered query is ~5s against the 2+ minutes an unfiltered sweep of your 643 tickets takes.

**DOC-53 is complete** — §1 is a six-part pipeline map (capture/fold/L1/probes/gate, including the verdict ladder and why rung 3 sits above rung 4), and §2/§3.3 now match D7 instead of contradicting it.

Two things worth flagging plainly:

- **A UAT caught a real bug in my own code.** `xgd` brackets its output with a banner at each end; `parseJsonOutput` sliced from the first `{` to end-of-string and choked on the closing banner — a failure that looks exactly like malformed data. Fixed in the shared helper, which the rail also uses.
- **I edited REQ-256's tool-policy UAT** rather than deleting the assertion. It now tests the new policy and records the old one alongside, so the reversal reads as a decision.

## Next: the prompt review, which you asked to do together

Everything it depends on is now in place. I have three concrete findings to bring to it:

1. **The brief names 4 of the 11 files in a bundle.** It mentions `capture.json`, `raw.html`, `multistate.json`, `screenshot.full.png` — the bundle also holds `l1.json`, `forms.json`, `hints.json`, `rendered.html` and six per-viewport screenshots. The round has never been told the folded L1 document is sitting right there.
2. **§8's Related cites `[[DOC-19]]` and `[[DOC-17]]`** — now reachable as `DOC-19.md` in the KB, so those citations should become filenames.
3. **One sentence I wrote in `INDEX.md` is badly worded** — *"read whole it is far larger than a round should spend"*. Cosmetic, but the round reads it every time. I'd fold it into the prompt-review commit rather than spend a whole free-coding cycle on one sentence.

Say when, and I'll bring the keeps/moves/drops table for the brief.

<!-- xgd-turn id="c8d972d3-b22a-4f69-97b2-cb5f8ae16c4d-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T00:35:08.886546+00:00" -->
#### You
can you point me at the prompt file?

<!-- xgd-turn id="c8d972d3-b22a-4f69-97b2-cb5f8ae16c4d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T00:35:38.870117+00:00" -->
#### Claude
There are three, and the distinction matters for the review:

**The one you probably want to edit:**

`tools/repro-console/brief/DIAGNOSE-THE-GAP.md` — 268 lines, the standing brief. Plain markdown, hand-edited, deliberately a file in the repo so changing what the AI is told is a diff someone reviews. This is where the method lives: the one rule, the reading order, the verdict table, how to name a residual class, the output contract.

**The one that generates the rest:**

`tools/repro-console/src/ai.ts:309-381` — `buildPrompt()`. Everything the brief can't know: this round's gate summary, where the evidence is, the KB pointer, the ticket-store section, the rail, known gap classes. Editing this is a code change.

**What actually got sent, so we can review the real thing:**

`storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-1/ai/prompt.md` — 11.6 KB, written before the round started. Note this one is **stale**: it's from the 2026-09-16 round, so it predates the KB and the ticket-store section. It's the right artifact for judging what the first round was working from, not for judging what a round gets now.

Worth knowing for the review: the brief is sent whole on a fresh round, but a **resumed** round gets `resumePreamble()` instead (`ai.ts`, REQ-261) — so anything we move into the brief is invisible to resumed rounds, and anything that must survive resume belongs in `buildPrompt`'s per-round half. That constraint shapes the keeps/moves/drops call more than anything else.

If you want to read the current-shape prompt rather than the stale one, I can render one without spending a round — `buildPrompt` is a pure function.

<!-- xgd-turn id="85f7fe5b-9fa9-492a-9fac-6257d1f5c8ba-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T01:08:45.072207+00:00" -->
#### You
ok first paragraph:
**You can read, and that is all you can do. -->  You can read and create tickets, and that is all you can do.**

**lets get ticket creation in at the start**

Lets talk about the scope of the ticket. There is absolutely no fixed limit to the size of the ticket, but I am concerned that if we try to fix everything in one ticket we may fail because the issues are not all independent. So I think we need to recognize that there may be multiple rounds

Perhaps the ticket lists all the issues it can see in order with proposed fixes and the implementation prompt is left to do what it can - can we validate that the implementation prompt (a version of you with the permissions you have) can get to all the materials and run all the tools?

You do not run `xgd`. You hand the console a `type`, a `title` and a `body`, and
it creates the ticket at `status: draft` — never at any `ready_*` status, which
is a dispatcher trigger that would spawn an autonomous pipeline against your
ticket within about thirty seconds. <-- this is nuts why not let it just run xgd?? Its much simpler - please you are making this too complicated we can restrict to xgd ticket ** - it should create a REQ ticket for the changes

In the Body section: can we add how the implementing agent checks its work? It needs to get specific instructions on how to see the problem

Again with bugs lets use xgd ticket directly please - or is there a reason not to?

I don't see anything here that recongnises that L1 or its rendering might be at fault - there are 3 kinds of issue that are core:

1. Engine short fall (expected primary)
2. L1 lack of expressibility - something that cannot be captured in L1 as it is today (we will get these they are important to flag and they involve different fixes obviously)
3. Rendering bug - engine gets it right, it can be express (and is) in L1 but the renderer fails to render it correctly

The prompt should cover all these in its primary mandate - finding 1c bugs is secondary to all of that.

<!-- xgd-turn id="85f7fe5b-9fa9-492a-9fac-6257d1f5c8ba-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T01:11:09.638106+00:00" -->
#### Claude
Three things in your message, and one of them I need to correct before the rest follows.

**The restriction you want isn't available, and I already measured it.** `--allowedTools 'Bash(xgd ticket *)'` does not scope `Bash` — it *admits* `Bash` whole and ignores the prefix. That was D5 test B: `echo MEASURED-B` ran, exit 0, no denial. So "restrict to `xgd ticket **`" can't be enforced by the harness. The good news is it doesn't block you: **the round already has full `Bash` as of D7** — that shipped an hour ago. The brief saying "You do not run `xgd`" is simply stale text describing the old policy. Making it run `xgd` is a brief edit, not a permissions fight.

Now the validation you asked for, because it's the one empirical question here.

Now the actual test — can an implementing agent run the tools it needs? Trying the real ones against the stored bundle.

Confirmed the known sandbox limit — Chromium can't get a Mach bootstrap port here. Mapping precisely what *does* work:

## Validation result: mostly yes, with one real gap

I ran these as the implementing agent, with the permissions I have:

| | |
|---|---|
| `1c l1-gate --ref <bundle>` | ✅ ran — `PASS`, full 3-probe report, 0 fold residuals |
| `1c render <slug> --sandbox` | ✅ rendered 2 files |
| `1c page get <slug> home --sandbox --json` | ✅ 64 KB L1 document |
| `1c page list`, `1c refold`, `repro`, `responsive-diff` | ✅ offline, never install-gated |
| `xgd ticket *` | ✅ |
| All evidence + all 11 bundle files | ✅ readable |
| `npm test` | ✅ — I ran 69 tests this session |
| **`1c gate`** | ❌ **Chromium dies: `bootstrap_check_in … Permission denied (1100)`** |
| `1c diff`, `capture`, `shot`, `values-diff <slug>` | ❌ same browser dependency |
| `1c values-diff --ref X --actual <manifest>` | ❌ browser-free form exists but rejects the bundle's manifest: `actual.elements is not iterable` |

**So: the implementing agent can reach every material and run the offline half of the engine, but cannot re-run the browser-backed gate in a sandbox like mine.** The console can — it drove Chromium fine for the first round — so this is about *where the implementer runs*, not a missing capability.

That has a direct consequence for your "how does the implementer check its work" request: **the ticket's check-your-work section must lead with something that works without a browser** — `1c l1-gate`, reading `values-diff.json`, a targeted `npm test` — and name `1c gate` as the operator-run confirmation rather than the primary check. If we write "run `1c gate` to see the problem" as the only instruction, a sandboxed implementer is stuck at step one.

## On the three issue classes

This is the most important thing in your message and the brief currently has no vocabulary for it. Right now §5 says a residual is *"a serializer bug, a missing L1 axis, a missing capture hint, or a region that needs promoting to flow"* — which collapses your (1) and (2) into a list of examples and **omits (3) entirely**. The renderer isn't mentioned anywhere in the brief as a possible culprit.

Worth noting it's also a testable distinction rather than a judgement call, which makes it much stronger than a taxonomy the round has to intuit:

- **(2) L1 can't express it** — the value is absent from the L1 document. `1c page get` shows nothing carrying it.
- **(3) renderer bug** — the value *is* in the L1 document and the render is still wrong. `1c page get` shows it; the output doesn't.
- **(1) engine shortfall** — L1 has the axis, the renderer honours it, but the fold/capture put the wrong value in.

That's three distinguishable evidence patterns, and the round can be told to *state which test it ran*. I'd make that the spine of the new §5 and the mandatory first section of the ticket body.

## Before I draft

Everything above is agreed and I'll write it. Two things I want to get right rather than guess, because they change the code and not just the brief:

**Does the round still hand back an outcome block at all?** If it creates its own tickets, the console's `fileTicket` path and the `ticket`/`bugs` fields in the outcome become dead — the round would report *"I filed REQ-263, BUG-96"* instead of handing over content. That's a real simplification and it reverses REQ-256 behaviour 4. I think it's what you want; say if not.

**Multiple rounds — is the ordered list one ticket or several?** You said the ticket lists all issues in order with proposed fixes and the implementer does what it can. That reads to me as: **one REQ per round**, internally ordered, and a later round that finds the same class appends to it. The alternative — one ticket per issue — loses the ordering you're asking for. I'll go with one-REQ-per-round-internally-ordered unless you say otherwise.

<!-- xgd-chat-end -->