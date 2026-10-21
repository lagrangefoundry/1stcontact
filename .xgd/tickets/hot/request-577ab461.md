---
uid: request-577ab461
id: REQ-421
type: request
title: 'Builders: share the common starting context through the cache, and cache each
  run''s history for 5 minutes'
created_by: EPIC-20
created_at: '2026-10-21T13:22:20.449737+00:00'
updated_at: '2026-10-21T13:22:20.449737+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 5
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
---

## What changes

Builders share their common starting context through the prompt cache instead of each one paying to write it, and a builder's own growing conversation is cached for the 5 minutes it actually needs rather than an hour.

## Why (Bob's Salon 3, 2026-10-20/21, analysis on EPIC-20)

Builders were 60% of the session's spend: 38 runs, 1,516 requests, $25.58 metered (about $29.50 at the true 1-hour write rate, see the meter bug filed alongside).

**1. Every builder writes its whole starting context to the cache itself.** A builder starts at roughly 45–50k tokens before it does anything: its role prose, the page vocabulary, the summary manual and, above all, the tool definitions for its grant (the L1 surface declaration alone is ~100 KB). That prefix is identical for every builder of a deployment, and `roles.ts` says it is meant to be shared: *"every worker of a deployment shares it in the cached prefix."* It isn't. The shortest runs show it:

| builder | requests | written to cache | average context |
|---|---|---|---|
| builder-29 | 8 | 54k | 49k |
| builder-37 | 16 | 62k | 56k |
| builder-23 | 18 | 73k | 65k |

Each wrote its entire context, including builder-37, which started at 01:11 with builder-35 started ten minutes earlier. If the prefix were shared, those runs would read ~45k from the cache and write only their own growth. The cause is not yet known: the tool definitions don't vary per builder (`toolSet` only wraps execution), so the candidates are the system assembly for worker sessions (whether its cache breakpoint is emitted at the `cache_boundary`), or something per-session before the boundary.

Cost today: 38 × ~45k tokens written at Haiku's 1-hour rate ≈ $3.40 a session, where sharing would cost ≈ $0.20.

**2. A builder's conversation is cached for an hour it never uses.** A builder's requests come seconds apart, and its conversation is never resumed once it reports. The 1-hour cache costs 2× input per written token; 5 minutes costs 1.25×. Builders wrote about 5.2M tokens in this session, so ≈ $2.60 of the session's writes beyond the shared prefix paid for an hour nobody used.

Together: roughly $6 of ~$29.50, about a fifth of builder spend, with no change to what builders are told or can do.

## Required behaviour

1. **Find why builders don't share the prefix, and make them.** A second builder of the same deployment, started within the prefix's lifetime, has its first request **read** the shared prefix from the cache (`cache_read_input_tokens` on request 1 ≥ the prefix size), not write it. Record the cause in this ticket.
2. **The shared prefix is cached for 1 hour; a builder's message history for 5 minutes.** The API allows mixed lifetimes in one request as long as longer ones come first, and the system/tools prefix always precedes the messages. Builders started in different bursts across an evening then share one prefix, and each run's own history pays the cheaper rate.
3. **The consultant is unchanged.** Its conversation is resumed across turns minutes apart, so its 1-hour cache is right.
4. **Nothing is cut from the builder's instructions or tools to save tokens.** Operator, 2026-10-21: unclear instructions cost more in mistakes than they save in reading. If the investigation finds the same text sent twice (for example a surface's overview in both the summary manual and the tool descriptions), removing the duplicate is in scope; shortening anything is not.

## Depends on

Item 2 needs the framework to let a backend choose a lifetime for its system prefix separately from its message history, and to read that from `backends.json` (lagrange-framework REQ filed alongside). Item 1 does not, and can land first.

## Test plan

- `test_UAT_FC_<ID>_*`: two builder delegations in a row on one deployment, with a recording model client: the second builder's first request carries the same system and tools as the first's, with a cache breakpoint at the end of the shared prefix, so a provider would read it rather than write it. Assert on the request payloads, byte-identical up to the breakpoint.
- With the framework change installed: the builder's system breakpoint asks for 1 hour and its message breakpoints for 5 minutes; the consultant's ask for 1 hour throughout.
- Measure afterwards from `turn_spend.attributed`: a short builder run's cache writes should be close to its own growth, not its whole context.
