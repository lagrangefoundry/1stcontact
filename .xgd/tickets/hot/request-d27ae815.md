---
uid: request-d27ae815
id: REQ-356
type: request
title: 'Plan ticket: one living per-site plan for Alice and Bob (upgrade of brief
  type)'
created_by: CHAT-58
created_at: '2026-10-01T21:01:43.211151+00:00'
updated_at: '2026-10-01T21:03:48.222046+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Summary

Give each site one living **plan** ticket: the shared project state that the consultant (Alice) and the coordinator (Bob) work from, and that Bob projects as a panel/card for the client. Structured state lives in frontmatter; the client's own words and the decision log live in the body.

This is an **upgrade of the existing `brief` type**, not a new type. `productTypePack()` in `apps/control-app/src/tickets.ts` already declares `brief` ("the per-site canonical decisions document", [[DOC-9]] §4, [[DOC-38]] §9), but nothing writes it: there are zero `brief` tickets and no tool creates or primes one. Rename it to `plan` and widen it. Renaming costs nothing while no instance exists.

Origin: CHAT-58 (the Bob coordination design discussion), building on [[EPIC-19]] and [[DOC-62]].

## Why

Evidence from the Lagrange Foundry and 1st Contact builds (CHAT-58):

- Decisions were made by accident, not by choice. Typography sat at the defaults (Georgia/Helvetica) for ~80 turns until the operator asked "does this look premium?". Nothing recorded that it had never been chosen.
- The context that set the quality bar ("placeholder/teaser", "$100k site") arrived at turns 18 and 101 because intake never asked for it, and it was recorded nowhere.
- Open items were tracked as prose appended to each turn: the hero sub-line was re-raised 37 times. There was no *parked* state and no reason recorded for parking.
- The existing decision log (REQ-171 `record_decision`) lives in the **chat** ticket's body, so it is per session. A site built over several sessions gets several partial logs, and the log dies with a bricked conversation ([[DOC-62]] §7).

## Behaviour

### Identity and lifetime

- Exactly **one plan per site**, keyed by `site_slug`. It is living: a later redesign moves `phase` back rather than creating a new plan.
- This **resolves [[DOC-62]] open question 1** (what the shared structure belongs to) in favour of the site. DOC-62's analysis leaned towards the business, but its load-bearing concern was surviving a lost conversation, and a site-keyed plan does. One business can run several sites with different jobs.
- It also **resolves [[DOC-62]] open question 3**: the plan panel and the decision log are one object. The panel projects the frontmatter; the log is the body.
- Included in priming for both agents (small, always relevant: [[DOC-38]] §9), not fetched by search. It stays in `PROJECT_CORPUS_TYPES` (renamed from `brief`).

### Frontmatter (structured, displayable)

```yaml
site_slug: string            # required, unique per site
phase: intake | first_pass | revision | prelaunch | live

brief:                       # the client's input, structured
  business: string
  site_job: string           # what the site is for *right now* (distinct from audience)
  audiences: [{ who: string, priority: int }]
  goal: { kind: leads|conversions|awareness|traffic|credibility|other, measure: string?, proxy: string? }
  quality_bar: string        # e.g. "premium", "directionally right for beta"
  existing_site: { url: string?, feeling: string? }
  constraints: [string]

functionality:               # chosen from the fixed feature catalogue
  - { feature: <catalogue id>, status: wanted | not_wanted | later }

decisions:                   # seeded from the generic decision list
  - id: string
    area: purpose|messaging|style|imagery|functionality|liveness|structure
    tier: concept | detail
    state: open | defaulted | proposed | not_objected | chosen | delegated | parked
    value: string?
    compared: bool           # ever chosen from visible alternatives?
    parked_reason: string?   # required when state=parked
    log: int?                # → "Decision N" in the body

checks:                      # Bob's questions: "are we all happy with …?"
  - id: string
    question: string
    trigger: string          # e.g. first_pass_complete, before_fan_out, before_publish
    asked_at: datetime?
    answers: [{ by: alice | user, verdict: yes | not_sure | no, note: string? }]

tasks:                       # Alice's plan
  - { id: string, title: string, status: todo|doing|done|dropped,
      depends_on: [id]?, decisions: [decision id]? }
```

### Body (free text, indexed)

- `## Brief`: the client's goals and purpose **in their own words**, including verbatim quotes. The structured `brief` fields index this section; they don't replace it.
- `## Decision log`: append-only `### Decision N` entries recording what was decided, why, and what was rejected.
- `## Notes`: anything else that helps build the site.

### Write authority

| Section | Alice (consultant) | Bob (coordinator) | Client |
|---|---|---|---|
| `brief`, `functionality` | refines | records intake answers | supplies |
| `decisions` | creates or proposes values; may set `defaulted` / `proposed` | records a state change **only by attaching the client's stated answer** | the only source of `chosen`, `delegated`, `parked` |
| `checks` | answers | asks and records | answers |
| `tasks` | owns: creates, orders, adds dependencies | updates progress | — |
| decision log | writes the "why" | appends what the client said | — |

Invariants enforced by the store:

1. `checks[].answers[].by` is `alice` or `user`. **Bob can never be an answerer**, so Bob has no opinion on the site, by construction ([[DOC-62]] §3: "it has no opinion of the site").
2. A decision reaches `chosen`, `delegated` or `parked` only with a client answer attached. This refines [[DOC-62]] §3 ("the interrogator must not be able to open or settle a decision"): Bob may *record* the client settling a decision, never settle one himself.
3. `parked` requires `parked_reason`.

### Seeding

A new plan is created with the generic decision list and standing checks defined in [[DOC-64]] §6 (decisions) and §7 (checks). The seed is data, not code, so it can change without a code change.

### Migration

- Rename the `brief` type to `plan` in `productTypePack()` and `PROJECT_CORPUS_TYPES` (and the repro-console type list).
- **Move the decision log**: `record_decision` appends to the site's plan body instead of the chat ticket body. The chat ticket keeps the transcript and the `frame` standing note (per-session working memory, REQ-283), not the durable log.
- Existing chat-ticket ledgers are left in place, not migrated. They predate the plan.

### Tools (surface sketch, final names TBD)

- Alice: read plan; propose/set decision values and states (within authority); create and update tasks; append to the decision log.
- Bob: read plan; record intake answers into `brief` / `functionality`; record check questions and answers; record client answers on decisions; update task status; set `phase`.
- Panel: a read-only projection of frontmatter for the client (phase, decisions by state, open checks, task progress).

## Out of scope

- Bob's runtime: the room, turn-taking, triggers firing ([[DOC-62]] §4). This REQ is the shared structure only.
- The panel UI design beyond "projection of frontmatter".
- Migrating historic chat ledgers.

## Test plan

UATs (`test_UAT_FC_<REQ>_*`) through the ticket store and the tool surface:

- Creating a plan for a site seeds the generic decisions and checks; a second plan for the same `site_slug` is refused.
- A check answer with `by: bob` (or any value other than `alice` or `user`) is refused.
- Moving a decision to `chosen` without an attached client answer is refused; `parked` without `parked_reason` is refused.
- `record_decision` appends `### Decision N` to the plan body, not the chat ticket body, numbering correctly across sessions.
- The plan is present in both agents' priming for that site.
- The `brief` type name no longer exists in the type pack or the project corpus types.
