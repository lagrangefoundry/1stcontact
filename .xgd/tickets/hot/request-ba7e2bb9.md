---
uid: request-ba7e2bb9
id: REQ-262
type: request
title: 'Loop-1 session priming: review the prompt and build the session''s knowledge
  base'
created_by: REQ-261
created_at: '2026-09-16T21:28:26.800840+00:00'
updated_at: '2026-09-16T21:28:26.800840+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
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

### 4. The round reads the KB; it does not reach into the ticket store

**Tickets are read and written through the xgd ticket API, never by file path.**
That rule is absolute and it creates a real problem this ticket has to solve: a
round has `Read`, `Glob` and `Grep` and no `Bash`, so it cannot run `xgd` — by
design ([[REQ-256]] behaviour 3, which stands). It therefore cannot use the
ticket API at all.

So the round must never be pointed at the ticket store. **The console assembles
the KB using the API and writes it as ordinary files the round reads** — the
same shape as the evidence directory, where the console produces and the round
consumes. Whatever the mechanism, a round must never need a ticket path and
must never need to run a command.

This also covers something the first round did that we should support properly
rather than by accident: it searched prior tickets and found that the same
defect had been observed once before and shipped without a fix, which was worth
saying in its ticket. That is a good instinct served by a bad route. If a round
should be able to see relevant prior tickets, the console supplies them through
the API.

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
7. Nothing the round is given points at a ticket path. The console reads
   tickets through the xgd ticket API and writes the KB as files.
8. [[REQ-256]] behaviour 3 holds unchanged: the round still has no tool that
   can write a file, run a command, reach the network or spawn an agent.
9. Tool-call count and cost for a primed round are recorded against a
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
- The AI writing code. [[REQ-256]] stands.

## Related

[[REQ-261]] (the round's output, resume, telemetry) · [[REQ-256]] (the round) ·
[[REQ-254]] (the console) · [[DOC-53]] (the session's knowledge base) ·
[[EPIC-12]] §7.1, §8.5 · [[DOC-19]] · [[DOC-21]] · [[DOC-23]] · [[DOC-27]] ·
[[DOC-30]] · [[DOC-39]]
