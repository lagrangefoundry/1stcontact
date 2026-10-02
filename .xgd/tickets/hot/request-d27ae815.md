---
uid: request-d27ae815
id: REQ-356
type: request
title: 'Plan ticket: one living per-site plan for Alice and Bob (upgrade of brief
  type)'
created_by: CHAT-58
created_at: '2026-10-01T21:01:43.211151+00:00'
updated_at: '2026-10-02T00:19:02.917523+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-02942a11
  commits:
  - working_sha: f6b8225cd43d488f5d138127788b2b8039292a8f
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: cf5b0b8d5f974c6a1acd4abb39f54ed14dbee38d
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: f871eb726e6d9211c636e0674c965f7fb338592c
    reconcile_sha: null
    main_sha: null
  - working_sha: 8350bb8e5706d43c16ee149cb8ad9851dac54e68
    reconcile_sha: null
    main_sha: null
  version: 0.2.430
  story_points: 8
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

- **The type is `plan`, with `kind` as a field.** This REQ delivers `kind: site`, the site plan. Later kinds (e.g. `kind: marketing`) share the shape (brief, decisions, checks, tasks, decision log) and differ only in their seed list, so by [[DOC-38]] §9's rule ("a type exists where the shape differs; everything else is a field") they are kinds, not types.
- Exactly **one site plan per site**, keyed by `site_key`: the store-minted site key ([[DOC-45]] §6; sites carry no slug). Uniqueness is on (`kind`, `site_key`). The plan lives in the business's own ticket store, so it belongs to the business through the store and to the site through the field.
- It is living: a later redesign moves `phase` back rather than creating a new plan.
- This **resolves [[DOC-62]] open question 1** (what the shared structure belongs to). Today a business has exactly one site (`provisionBusiness` creates "the one site a business has"), so the site plan is 1:1 with the business. Keying on the site key keeps that true if a business ever runs several sites, and the plan survives a lost conversation, which was DOC-62's load-bearing concern.

### When it is created

- **At business provisioning.** `provisionBusiness` (`apps/control-app/src/identity.ts`) creates the site plan immediately after `createStarterSite`, seeded from [[DOC-64]] §6–§7, with `phase: intake`. Every business therefore starts with a plan in place before its first conversation.
- **On first open, if missing.** Businesses provisioned before this change (and any provisioning run that failed after the site was created) have no plan. The first read of the site plan for a site creates it with the same seed. Creation is idempotent: two concurrent first opens produce one plan.
- **Watch item, not in scope:** `brief.business` (what the business is) is a business fact rather than a site fact. When a second plan kind arrives it would be duplicated, and may need to move to a business-level home.
- It also **resolves [[DOC-62]] open question 3**: the plan panel and the decision log are one object. The panel projects the frontmatter; the log is the body.
- Included in priming for both agents (small, always relevant: [[DOC-38]] §9), not fetched by search. It stays in `PROJECT_CORPUS_TYPES` (renamed from `brief`). **As built:** the consultant gets it every turn as a `site-plan` reminder entry; the coordinator's priming lands with the coordinator's runtime (out of scope), using the same renderer.

### Frontmatter (structured, displayable)

```yaml
kind: site                   # plan kind; later kinds e.g. marketing
site_key: string             # required; store-minted site key; unique with kind
phase: intake | first_pass | revision | prelaunch | live

brief:                       # the client's input, structured
  business: string
  site_job: string           # what the site is for *right now* (distinct from audience)
  audiences: [{ who: string, priority: int }]
  goal: { kind: leads|conversions|awareness|traffic|credibility|other, measure: string?, proxy: string? }
  quality_bar: string        # e.g. "premium", "directionally right for beta"
  existing_site: { url: string?, feeling: string? }
  constraints: [string]

functionality:               # chosen from the fixed feature catalogue (none exists yet: any feature id is accepted)
  - { feature: <catalogue id>, status: wanted | not_wanted | later }

decisions:                   # seeded from the generic decision list
  - id: string
    title: string            # what the decision is, as the panel shows it
    area: purpose|messaging|style|imagery|functionality|liveness|structure
    tier: concept | detail
    settle: ask | talk | show | offer   # how it is expected to be settled (DOC-64 §6)
    state: open | defaulted | proposed | not_objected | chosen | delegated | parked
    value: string?
    compared: bool           # ever chosen from visible alternatives?
    parked_reason: string?   # required when state=parked
    answer: { quote: string, at: datetime }?   # the client's own words; required for chosen/delegated/parked
    log: int?                # → "Decision N" in the body

checks:                      # Bob's questions: "are we all happy with …?"
  - id: string
    question: string
    triggers: [string]       # e.g. first_pass_complete, before_fan_out, before_publish (DOC-64 §7 lists several per check)
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

- Rename the `brief` type to `plan` in `productTypePack()` and `PROJECT_CORPUS_TYPES`, and in the project KB declaration (`kb/knowledge_bases.json` and its scaffold in `kb.ts`). (The repro-console `brief` is a folder holding its prompt, not a ticket type, so it is unchanged.)
- **Move the decision log**: `record_decision` appends to the site's plan body instead of the chat ticket body. The chat ticket keeps the transcript and the `frame` standing note (per-session working memory, REQ-283), not the durable log.
- Existing chat-ticket ledgers are left in place, not migrated. They predate the plan.

### Tools (the `plan` surface)

Groups, granted per role (`planInstanceConfig(role)`); no operation takes a role:

- `ReadPlan` (both): `read_plan`, which answers the plan, its body and the panel projection.
- `KeepBrief` (both): `update_brief` (structured fields, plus `quote` kept verbatim under `## Brief`), `set_feature`, `add_note`.
- `PlanWork` (Alice): `set_decision` (value; state limited to `open`/`defaulted`/`proposed`; adds a new decision given title/area/tier), `set_task` (create/update, `depends_on`, `decisions`), `answer_check` (recorded as `by: alice`; the answerer is the grant, not a parameter).
- `CoordinatePlan` (Bob): `record_client_answer` (state `not_objected`/`chosen`/`delegated`/`parked`, with `quote`, `value`, `compared`, `parked_reason`; a settled decision is appended to the decision log in the client's words), `ask_check` (starts a fresh round: sets `asked_at`, clears answers; can add a new question), `record_check_answer` (`by` ∈ {alice, user}), `set_task_status`, `set_phase`.
- Alice keeps writing the "why" with the ledger's `record_decision`, which now appends to this plan's `## Decision log`.
- Panel: `planPanel()`, a read-only projection of frontmatter (phase, decisions grouped by state, checks asked and not yet answered by both, task progress with the next unblocked tasks). It is returned by `read_plan` and rendered into the consultant's per-turn reminder. No UI route.

## Out of scope

- Bob's runtime: the room, turn-taking, triggers firing ([[DOC-62]] §4). This REQ is the shared structure only.
- The panel UI design beyond "projection of frontmatter".
- Migrating historic chat ledgers.

## Implementation

- `tools/generate/src/cli/ai/plan-core.ts`: shape, `seedPlan`, `checkPlan` (the invariants plus closed vocabularies and task references), body-section helpers, `planPanel`, `planReminder` (≤ 2,000 chars, unsettled decisions first), and the surface's operations. Every operation runs on a copy and checks the result before handing it to the host, so a refused write leaves the plan byte-identical.
- `tools/generate/src/cli/ai/plan-seed.json`: DOC-64 §6 decisions and §7 checks, as data.
- `tools/generate/src/cli/ai/plan-surface.json`: the declaration; enums on the parameters are the first wall, `checkPlan` the second.
- `apps/control-app/src/plan.ts`: the plan as a `plan` ticket. `findPlan` matches on (`kind`, `site_key`) and ignores archived plans. `ensurePlan` handles creation; `createPlan` refuses a second plan (`PLAN_EXISTS`). `sitePlan` is the port: `read` ensures the plan exists, and `write` ensures it, runs `checkPlan`, then compare-and-sets (`CONFLICT` on a race).
- `apps/control-app/src/identity.ts`: `provisionBusiness` calls `ensurePlan` after `createStarterSite`. This is best-effort: a failure there doesn't fail provisioning, because the first open creates the plan.
- `apps/control-app/src/ledger.ts`: `chatLedger(tickets, sessionId, site)`. `record_decision` appends to the site plan's `## Decision log`, numbered from that log. `read` delivers that log to the session seed. The title and standing note stay on the chat ticket.
- `host-core.ts` / `roles.ts` / `priming.json` / `ai.ts`: a `plan` host dep; the plan surface is composed with the consultant's grant; the `site.plan` provider feeds the consultant's `site-plan` reminder entry.

### Design decisions made during implementation

- **The rules live on the write path, not in the type pack.** The store's type pack checks only the top-level shape of a `list` or `object` field, and its validators are a string DSL with no reach into a list. So `checkPlan` runs in the core (before any host sees a write) and again in the host port on every store write, which covers the ledger's append too. The AI's only way to write a plan is the plan surface; its ticket surface over client tickets is read-only.
- **"Exactly one plan, even when raced" without a unique constraint.** The store has none a product can declare, and its preset-uid create is private. Creation is create-then-settle: re-read, keep the oldest (by `created_at`, then uid), and archive the rest. Creation always writes the bare seed, and the change then lands by compare-and-set on the survivor, so nothing written is lost.
- **`kind` defaults to `site` in the type pack**, so a `plan` created without it is a site plan.
- **Explicit supersession.** This intent supersedes the REQ-171 and REQ-283 behaviour that put the decision ledger in the chat ticket body, and the `NO_LEDGER` refusal on `record_decision` when no chat ticket exists yet: a decision is now always writable, because the record belongs to the site. Their UATs were updated accordingly (`test_UAT_FC_REQ-171_*` ledger cases, `test_UAT_FC_REQ-283_*` placement and clobber cases).

## Test plan

UATs (`test_UAT_FC_REQ-356_*`), through the ticket store, the Worker and the tool surface:

`tests/test_UAT_FC_REQ-356_the_plan_is_the_sites.workers.test.ts` (workerd, real D1, Worker `fetch`):
- Provisioning a business creates its site plan (`kind: site`, `phase: intake`, keyed by the starter site's key), seeded with the generic decisions and checks.
- Opening the site plan for a site with no plan creates one with the same seed; five concurrent first opens produce exactly one live plan.
- A second plan for the same (`kind`, `site_key`) is refused (`PLAN_EXISTS`); another site gets its own.
- The rules hold on every store write: a `by: bob` answer, `chosen` without a client answer, or `parked` without `parked_reason` are refused, and the version is unchanged.
- `record_decision` appends `### Decision N` to the plan body, inside `## Decision log`, numbering across sessions; the chat ticket's body holds no decision.
- The consultant is offered the plan tools (not the coordinator's) and is shown the plan on the next turn, with a default named as a default.
- The `brief` type no longer exists in the type pack; `plan` declares the structured fields.

`tests/test_UAT_FC_REQ-356_the_plan_surface.test.ts` (node, Toolbox `box.run`):
- Each role holds its own groups.
- A new plan holds the generic list; the client's words are kept verbatim under `## Brief`.
- A check answer by anyone but `alice`/`user` is refused; a check stays open until both have answered.
- Alice can't settle; `chosen` needs the client's words; `parked` needs a reason; settled decisions are logged in the client's words.
- Tasks take optional dependencies and refuse unknown ones; the coordinator tracks progress and phase.
- The reminder names what is unsettled and stays within its bound.
- `PROJECT_CORPUS_TYPES` includes `plan` and not `brief`.

Not covered: coordinator priming. It depends on the coordinator's runtime, which is out of scope.
