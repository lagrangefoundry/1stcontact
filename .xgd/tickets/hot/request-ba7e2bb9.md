---
uid: request-ba7e2bb9
id: REQ-262
type: request
title: 'Loop-1 session priming: review the prompt and build the session''s knowledge
  base'
created_by: REQ-261
created_at: '2026-09-16T21:28:26.800840+00:00'
updated_at: '2026-09-17T01:20:44.736519+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-07d6a4dc
  commits:
  - working_sha: 0d7e2d57747236eec2e49cf796f93cfbafdcc17c
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 82051fd6237f651a3e119ab0fe41040356dcff15
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 7a47077db3262eb1af1c5115f9d7d8cf8dded802
    reconcile_sha: null
    main_sha: null
  - working_sha: 9670a3a58e3234cad86287b22d4dbcf7477231d1
    reconcile_sha: null
    main_sha: null
  version: 0.2.230
---

Parent: [[EPIC-12]] §8. **Split out of [[REQ-261]]**, which now covers the
round's output, resume and telemetry. This ticket covers everything upstream of
the round: what it is told before it starts.

## Goal

A loop-1 round starts knowing nothing beyond a method brief, and re-derives its
bearings every time. This loop is meant to run MANY times, so knowledge the
round has to rediscover is a cost paid on every round forever.

Two deliverables: **review and rework the prompt**, and **construct a knowledge
base for the session** carrying every document a round needs.

## What the first round showed

It ran on `gigabytealchemy.ai` on 2026-09-16 and found its way by grepping —
competently, but it spent tool calls rediscovering that `backgroundImageUrl` is
deliberately distinct from `src`, which is stated plainly in the engine's own
comments and will be rediscovered by every future round with the same question.
Twenty tool calls, ten of them `Read`, on a round whose answer turned on one
documented distinction.

## Behavior

### 1. The prompt is reviewed, not merely extended

The standing brief (`tools/repro-console/brief/DIAGNOSE-THE-GAP.md`) and the
per-round context assembled by `buildPrompt` have not been looked at since they
were written, and one live round is now evidence about them. Review both
against that evidence. In particular:

- The brief teaches **method** — transcribe don't reconstruct, the reading
  order, the verdicts, how to name a residual class. It teaches no
  **vocabulary** and gives no map of the engine.
- It references [[DOC-19]] and [[DOC-17]] only, and neither is reachable by the
  round.
- Its §7 worked examples show a small `body`. A real gap ticket body is
  thousands of characters of quoted evidence, and the examples should look like
  one so the shape the round copies is the shape we want.
- Adding the KB must not simply make the prompt longer. State what the brief
  keeps, what moves to the KB, and what is dropped.

### 2. A knowledge base for the session

Assemble the documents a round needs and make them reachable. At minimum:

- **[[DOC-53]]** — the reproduction engine and the loop-1 session. Owned by
  this ticket: its pipeline map is still to be written, and its learnings
  section is the place diagnostic patterns accumulate as rounds teach us more.
- **The L1 documentation that already exists** — [[DOC-23]] (the typed element
  tree), [[DOC-27]] (L1 reproduction vocabulary), [[DOC-30]] (the control
  surface API). The brief references none of them today.
- **[[DOC-19]]** (the reproduction runbook) and [[DOC-21]] (the growth loop),
  which the brief cites but does not deliver.

Decide and state the selection rule. A hand-maintained list drifts from what
exists; a rule that sweeps every `doc` ticket puts material in front of the
round that has nothing to do with reproduction.

### 3. The session KB is not the production KB

The production corpus is what the builder AI searches in a client-facing
conversation. The session KB is what a diagnosing round reads. **They must not
mix in either direction.**

Membership in the production corpus is already opt-in: `exportCorpus` admits
only `doc_kind: system_kb` (`tools/generate/src/cli/kb.ts:256`), and [[DOC-53]]
carries `doc_kind: architecture`, so it is excluded by construction rather than
by convention. Any further session-KB document takes the same route, and the
exclusion is asserted rather than assumed.

The reverse direction needs deciding too: a production-KB document may well be
worth showing a round, and nothing says whether the session KB may include one.

### 4. How a round reaches ticket knowledge — an open design question

**Tickets are created and updated only through the xgd ticket API.** That is
already true and must stay true. The console runs `xgd ticket create` and
`xgd ticket update --append-body-file` (`tools/repro-console/src/ticket.ts`),
and nothing in the console reads or writes the ticket store by path —
`page.ts:352` and `console.ts:749` both record that deliberately.

The open question is narrower: **a round subprocess has no `Bash`, so it cannot
invoke `xgd` itself.** Everything it needs from the ticket store today arrives
because the console fetched it through the API first. That works for material
we can anticipate — the KB, the known-gap registry. It does not work for a
SEARCH, because the console cannot know the query in advance.

This matters because the first round did exactly that: it searched prior
tickets and found the same defect had been observed once before and shipped
without a fix, which was worth saying in its ticket. Good instinct, and there
is currently no sanctioned route for it.

Decide between:

- **Console-as-broker** — the round asks, the console runs the API call and
  supplies the result. Keeps [[REQ-256]] behaviour 3 exactly as measured, at
  the cost of a round trip and a narrower query surface.
- **Scoped `xgd` access for the round** — permit only read verbs
  (`ticket get`, `ticket list`) and nothing that mutates. This reopens
  behaviour 3, whose comment records a MEASURED finding that a tool merely
  absent from the allow list still ran. Scoped allow rules are a different
  mechanism from omission and may well gate correctly — but that must be
  MEASURED before it is relied on, exactly as the original finding was.

Whichever is chosen: tickets are still only ever WRITTEN by the console,
through the API, at `status: draft`. That is [[REQ-256]] behaviour 4 and it is
not in question here.

### 5. This ticket owns the tool policy, exclusively

**Every change to what a round may do lands here.** `AI_ALLOWED_TOOLS`,
`AI_DISALLOWED_TOOLS`, `AI_PERMISSION_MODE` and `AI_SETTING_SOURCES`
(`tools/repro-console/src/ai.ts`) are this ticket's surface and no other
ticket's. [[REQ-261]] is being worked concurrently, touches the same file, and
carries an explicit requirement that it changes none of them — so if a
permission question surfaces over there, it arrives here.

Two things to settle while holding that surface:

**The decision from behaviour 4** — console-as-broker, or scoped read-only
`xgd` for the round. Whichever wins, the policy constants record it.

**The deny list goes stale.** `AI_DISALLOWED_TOOLS` enumerates every tool that
can act, and its own comment admits the list "can go stale as the CLI grows
tools" — the enumeration is the gate precisely because a tool merely absent
from the allow list was MEASURED to run anyway. A round gaining resume and a
wider filing surface makes that staleness matter more.

The session's reported tool list arrives in the transcript's first event.
Check what the round actually got against what the policy intended, rather than
trusting the enumeration to have kept up.

**Anything measured here is recorded beside the policy**, in the form the
original finding took: what was tried, what happened, and what it therefore
proves. A permission asserted without a measurement is the exact mistake that
finding exists to prevent.

### 5. Priming is measured

The reason for this ticket is cost, so the change has to show a difference.
Record what a round costs before and after — [[REQ-261]] requirement 13 adds
per-round cost and model to the artifacts, and this ticket is its first
consumer. Tool-call count and round cost on a comparable round are the measure.

Priming that makes rounds more expensive without making them better is a
regression, and we should be able to see that rather than argue about it.

## Requirements

1. The brief and `buildPrompt`'s round context are reviewed against the first
   live round, and what changed is stated.
2. A session KB exists carrying at least [[DOC-53]], [[DOC-23]], [[DOC-27]],
   [[DOC-30]], [[DOC-19]] and [[DOC-21]].
3. [[DOC-53]] is complete: the pipeline map is written, the session's role is
   stated, and the learnings section is in place and appendable.
4. The selection rule for KB membership is stated in the code that implements
   it.
5. No session-KB document reaches the production corpus. [[DOC-53]] does not
   appear in `1c kb build`'s output, and this is asserted by a test.
6. The round reaches every KB document with `Read`, `Glob` and `Grep` alone.
7. Nothing the round is given points at a ticket path, and no ticket is ever
   created or updated except through the xgd ticket API.
8. The route by which a round reaches ticket knowledge is decided and stated.
   If it is scoped `xgd` access, the gating is measured and the measurement
   recorded beside the policy, as [[REQ-256]]'s original finding was.
9. [[REQ-256]] behaviour 3 holds unchanged: the round still has no tool that
   can write a file, run a command, reach the network or spawn an agent.
10. Every change to `AI_ALLOWED_TOOLS`, `AI_DISALLOWED_TOOLS`,
    `AI_PERMISSION_MODE` and `AI_SETTING_SOURCES` lands in this ticket and no
    other, and each is justified by a recorded measurement.
11. The round's actual tool list is checked against what the policy intended,
    rather than assumed from the enumeration.
12. Tool-call count and cost for a primed round are recorded against a
   comparable unprimed one.

## Acceptance

- A round answers, without grepping the engine for it, a question that cost the
  first round tool calls to rediscover — `backgroundImageUrl` versus `src` is
  the worked example.
- A round cites a KB document in its gap ticket.
- The production corpus is unchanged by the session KB's existence.
- Per-round cost and tool-call count are readable for a primed and an unprimed
  round.

## Out of scope

- **Session resume** — [[REQ-261]], which is about carrying a PRIOR ROUND's
  context forward. This ticket is about what every round is told before it
  starts.
- **What the round hands back** — [[REQ-261]].
- **The outcome parser, transcript, recoverability and cost telemetry** —
  [[REQ-261]]. This ticket consumes its cost telemetry (behaviour 5) but does
  not build it.
- The AI writing code. [[REQ-256]] stands.

## Related

[[REQ-261]] (the round's output, resume, telemetry) · [[REQ-256]] (the round) ·
[[REQ-254]] (the console) · [[DOC-53]] (the session's knowledge base) ·
[[EPIC-12]] §7.1, §8.5 · [[DOC-19]] · [[DOC-21]] · [[DOC-23]] · [[DOC-27]] ·
[[DOC-30]] · [[DOC-39]]


## Decisions (operator, 2026-09-16)

These settle the open questions posed above. Where a decision overrides
something stated earlier in this body, the decision wins.

### D1. The outcome-block fence defect belongs to [[REQ-261]], not here

The first live round did not fail for want of tool access. It produced a
complete, well-formed `"status": "filed"` block carrying the
`coverage-check-misses-section-background-images` diagnosis, and the console
recorded `status: failed`, `reason: "the round produced no outcome block."`
The cause was `parseOutcome`'s lazy fenced-block regex terminating at the first
` ``` ` *inside* the ticket body — fences the brief's own §6.3 requires, because
quoting `gate.json` is how evidence is carried. The better the round's evidence,
the more certain it was to be discarded.

This is [[REQ-261]] behaviour 1 and requirement 1, it is `free_coded`, and its
three commits are in `xgd-working`: `jsonObjectsFromEnd` has replaced the fence
regex. **Nothing about it is in scope here.** It is recorded because it is the
reason the first round looks like a failure in the artifacts, and any later
reading of those artifacts needs to know that the round itself was sound.

### D2. The selection rule is every `doc` ticket — no opt-in

§2 above worried that a sweep "puts material in front of the round that has
nothing to do with reproduction". The operator has weighed that and chosen the
sweep anyway: this is a dev tool, and an opt-in field is a mechanism somebody
has to maintain for a benefit that an index already delivers.

So: **every `doc` ticket is in the session KB.** The rule is one line, it cannot
drift from what exists, and no document has to be remembered into it.

What makes it affordable is that the round does not read the KB, it *searches*
it. The corpus is 52 documents and ~888 KB — around 222k tokens if read whole,
which no round may do. A generated `INDEX.md` carries one line per document
saying what question that document answers, and the round reads the index and
then the two or three documents it points at. **The index is load-bearing, not
a convenience**: without it the sweep is unusable, and a KB built without one is
not built.

### D3. A production-KB document may enter the session KB

The reverse-direction question in §3 is answered yes. A `doc_kind: system_kb`
document is a document like any other as far as a diagnosing round is
concerned, and D2's rule admits it without a special case.

The forward direction is unchanged and remains the thing that is asserted:
**no session-KB document reaches the production corpus.** `exportCorpus` admits
only `doc_kind: system_kb` (`tools/generate/src/cli/kb.ts:256`), [[DOC-53]]
carries `doc_kind: architecture`, and requirement 5 stands as written. The two
rules are deliberately asymmetric because the two readers are: a round reading
an extra document wastes tokens, and a client-facing agent reading an extra
document misinforms a customer.

### D4. The round must not reach the KB through the ticket store

Requirement 7 is currently NOT held, and the first round is the evidence: it
read `.xgd/tickets/hot/request-7ff1bacd.md` directly by path (transcript line
89) after grepping for `^title:|^status:`. Nobody gave it that path — it found
the store. The instinct was good and the finding it produced was worth having;
the route was not sanctioned.

So the KB is an EXPORT, not a pointer: the console writes each document to
`<DOC-ID>.md` in its own workspace, frontmatter stripped, rebuilt every round so
it cannot go stale. The round reaches it with `Read`, `Glob` and `Grep` over
that directory, which is requirement 6 held structurally. This mirrors
`exportCorpus`, which already solves exactly this problem for the production
corpus.

### D5. Ticket SEARCH is still open, and is measured before it is chosen

D4 settles how a round reaches DOCUMENTS. It does not settle §4's question,
which is how a round reaches TICKETS — the thing the first round wanted when it
went looking for prior art on its defect.

Before choosing between console-as-broker and scoped `xgd` access, the scoped
allow rule is MEASURED, exactly as [[REQ-256]]'s original finding was: whether
`--allowedTools 'Bash(xgd ticket get:*)'` actually refuses a `Bash` call that
does not match the prefix. Prefix rules are a different mechanism from omission
and may well gate correctly, but the project has one measurement on record
saying an allow list did not, and that measurement is why behaviour 3 is shaped
the way it is. The result is recorded beside the policy whichever way it falls.

If the scoped rule does not gate, the route is the broker and `Bash` stays
denied by name.


### D5 — MEASURED, 2026-09-16: a scoped `Bash` allow rule does NOT gate

Three `claude -p` runs, argv identical to `claudeCommand()` except for the tool
flags under test. `--permission-mode manual`, `--setting-sources ''` throughout.
The verdict is read from the result event's `permission_denials`, not from the
round's prose.

| | tool flags | asked to run | `permission_denials` | outcome |
|---|---|---|---|---|
| **A** control | `--allowedTools Read Glob Grep`, no deny list | `echo MEASURED-A` | `[]` | **ran** |
| **B** scoped, non-matching | `--allowedTools Read Glob Grep 'Bash(xgd ticket get:*)'`, deny list without `Bash` | `echo MEASURED-B` | `[]` | **ran**, exit 0 |
| **C** scoped, matching | as B | `xgd ticket get request-ba7e2bb9` | `[]` | ran |

**A reproduces [[REQ-256]]'s original finding on today's CLI.** That measurement
is not stale: a tool merely absent from the allow list is still in the session
and still runs.

**B is the answer, and it is a no.** Naming a prefix rule does not narrow
`Bash` — it admits `Bash`, and the prefix is not enforced. `echo MEASURED-B`
ran with no denial recorded. A scoped allow rule is a description of intent in
exactly the way a bare omission was, and behaviour 3 needs a property.

C confirms the matching command also runs, which is moot: a mechanism that
permits the command we wanted AND every command we did not is not a gate.

**Therefore the route is console-as-broker**, and `Bash` stays denied by name
in `AI_DISALLOWED_TOOLS`. Requirement 9 holds unchanged, and [[DOC-53]] §2's
"there is no `xgd`" remains true as written. This measurement is reproduced by
`.xgd/tmp/d5/run.sh` and belongs beside the policy in `ai.ts`, alongside the
original finding it re-confirms.


### D7 — the round gets `Bash` and calls `xgd` directly. This SUPERSEDES D5.

**The problem D5 and §4 were circling.** A round is a headless `claude -p`
subprocess. Running `xgd` requires the `Bash` tool. `Bash` is denied by name in
`AI_DISALLOWED_TOOLS`, so the round can run nothing, which is why the console
files on its behalf. D5 then measured whether `Bash` could be handed over
narrowly and found it cannot: `--allowedTools 'Bash(xgd ticket get:*)'` admits
`Bash` wholesale and does not enforce the prefix. It is all or nothing.

**The decision is all.** `Bash` comes off the deny list. The round calls `xgd`
the same way every other agent on this project does — it is the API this
project exposes to Claude Code, and a second mechanism wrapping it is a second
thing to maintain for no capability that `xgd` does not already have.

This settles §4 without either of the options §4 offered:

- **Console-as-broker is dropped.** It was a workaround for the round's
  inability to run a command, and the inability is gone.
- **An MCP route is dropped and explicitly out of bounds.** `xgd mcp-server`
  exists but is roughly a year old and unmaintained; nothing here depends on it
  or modifies it.
- **A ticket digest in the KB is dropped** — the ticket store is a rapidly
  moving picture and is queried live. The KB carries documents, which are read
  whole; everything else is a live `xgd` call.

**Requirement 9 is amended.** It read: the round still has no tool that can
write a file, run a command, reach the network or spawn an agent. It now reads:
the round has `Bash` and may run `xgd`; every OTHER tool that can write a file,
spawn an agent or reach the network stays denied by name. [[REQ-256]]
behaviour 3 is narrowed by this ticket rather than upheld by it, and that is a
deliberate reversal by the operator, not drift.

**What is given up, stated honestly.** "The round cannot write" was a property
of the process and becomes an instruction in the brief. The engine it is
diagnosing is now editable by it. That is bounded by free-coding's own
machinery — an un-ticketed edit is drift and `test_fix` eliminates it — so it
is a cost that is already paid for elsewhere.

**What is NOT given up, and is asserted instead.** The one expensive mistake is
a ticket created at a `ready_*` status, because the dispatcher spawns an
autonomous pipeline against it within about thirty seconds. Filing stays the
console's job at `status: draft`, exactly as behaviour 4 has it, and in
addition the console REPORTS after each round on any ticket the round created
itself, asserting none carries a `ready_*` status. A check that reports, never
one that prompts: the operator is not to be asked questions mid-round.

### Requirement 11 (new)

After each round, the console reports which tickets the round created directly,
and asserts that none of them carries a `ready_*` status.


### Requirements 12–14 (added while implementing D2)

These are consequences of D2's sweep rule rather than new intentions, but they
are behaviour and so they are stated rather than left to the code to imply.

12. **The KB is rebuilt every round, so it cannot be stale.** A document written
    or edited since the last round is present in the next one without anybody
    refreshing anything. The alternative — build once, refresh on demand — makes
    "is this current?" a question the round has to hold, and removing questions
    the round would otherwise answer for itself is the entire purpose of the KB.

13. **A document that is retired stops being searchable, not merely stops being
    refreshed.** A sweep that only ever adds leaves a deleted document sitting in
    the KB looking current, and a round would quote it. A stale file in a swept
    directory is worse than a missing one.

14. **A KB that cannot be built never fails the round.** If `xgd` will not list,
    the round runs against whatever is on disk — possibly nothing — and is told
    plainly that it has no KB this round. That is the round we had before this
    ticket, and it was a working round. Turning an improvement into a new way to
    fail would be a poor trade.


### D9 — Chromium runs in an agent sandbox. It needed one flag.

**The claim this replaces was wrong.** It was reported here that a sandboxed
agent "cannot re-run the browser-backed gate", and that the check-your-work
instructions in a gap ticket would therefore have to avoid `1c gate`. That was
accepting a constraint instead of attacking it. The operator pushed back — the
round, the implementer and the console all run on the same laptop in the same
directory, and there is no reason the tools should differ — and the pushback
was correct.

**What actually fails.** Chromium's browser process registers a Mach port
rendezvous server so it can hand ports to its renderer and GPU children. macOS
seatbelt, which wraps an agent session's commands, denies the registration:

```
FATAL:base/apple/mach_port_rendezvous_mac.cc:159] Check failed: kr == KERN_SUCCESS.
bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.N: Permission denied (1100)
```

**It is not a missing browser**, and the distinction is the whole finding:
`chrome-headless-shell --version` prints its version happily. Only the
registration is denied, and only once a child process is needed.

**`--single-process` removes the children**, so there are no ports to hand over
and nothing to register. Measured, in this order:

1. `--single-process` alone → Chromium wrote a real 2,727-byte PNG.
2. Through Playwright → a page rendered, computed styles read back exactly
   (`rgb(192, 57, 43)`), geometry returned.
3. **`1c gate repro-gigabytealchemy-ai --ref …` ran end to end**, reproducing the
   first round's numbers exactly — `l1-gate PASS`, 2 value deltas over 59
   matched elements, perceptual mean 0.69/255, 12 regions, and the same false
   `unreferenced-image` coverage finding. The whole instrument, working, inside
   the sandbox.

**The seam.** `CHROMIUM_LAUNCH_ARGS` — comma-separated extra launch arguments,
applied at every browser launch in `tools/generate/` (`launch-args.ts`).
OPT-IN: `--single-process` is not a supported upstream configuration, is slower
and less isolated, and an operator's console has no sandbox and no reason to
pay for it. An unconfigured host launches exactly what it launched before.

**Consequence for the brief.** The check-your-work section of a gap ticket
leads with `1c gate` and the other browser-backed verbs, because they work.
What it must also carry is the flag, since an implementing agent that does not
know about it will conclude the tool is broken and fall back to reading someone
else's evidence — which is the reconstruction the whole loop exists to prevent.

### Requirement 15

Every browser-backed `1c` verb — `gate`, `diff`, `values-diff`, `capture`,
`shot`, `aligned-crops` — is runnable by an agent session. The mechanism is
stated wherever a round or an implementer is told to run one, and it is proven
by running `1c gate` rather than asserted.