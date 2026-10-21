---
uid: request-577ab461
id: REQ-421
type: request
title: 'Builders: share the common starting context through the cache, and cache each
  run''s history for 5 minutes'
created_by: EPIC-20
created_at: '2026-10-21T13:22:20.449737+00:00'
updated_at: '2026-10-21T14:50:43.327557+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 3
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-41aadfd0
  commits:
  - working_sha: 2121f8813b2e5c2930e15be261c4fe455271b625
    reconcile_sha: null
    main_sha: null
  - working_sha: c393bd06756cf6f412f308f44ef43217e81cc716
    reconcile_sha: null
    main_sha: null
  version: 0.2.567
---

## What changes

Builders share their common starting context through the prompt cache instead of each one paying to write it, and a builder's own growing conversation is cached for the 5 minutes it actually needs rather than an hour.

## Why (Bob's Salon 3, 2026-10-20/21, analysis on EPIC-20)

Builders were 60% of the session's spend: 38 runs, 1,516 requests, $25.58 metered (about $29.50 at the true 1-hour write rate, see BUG-242).

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

Item 2 needed the framework to let a backend choose a lifetime for its system prefix separately from its message history, and to read it from `backends.json` (lagrange-framework REQ-216, `request-01439873`). That is installed, and item 2 lands here.

Item 1 turned out to need a framework change too (see "Cause" below). It is filed as **lagrange-framework BUG-90** (`bug-110add91`). No code for item 1 lands in this repository.

## Cause of item 1 (found 2026-10-21)

Reproduced through the real route with a recording model client, using two builder delegations in a row on one deployment:

- Their first requests' `tools` are **byte-identical** (49 tools, 64,522 chars of JSON). The tool definitions were never the problem.
- Their `system` is two cached blocks, `[902 chars, 1h][48,570 chars, 1h]`, and the two builders' blocks differ in one place only: `chat-985c4771` vs `chat-707c1fbe`. With that id masked, the systems are byte-identical.
- That id comes from the framework's session-memory core. `composeProduct` puts the core's stable entries (the memory charter, *"This conversation is ticket {ticket}."*) into the **product** tier's cached prefix, and `assembleMarked` always renders the product tier **before** the role tier. So every session's system prompt starts with ~900 characters naming its own ticket, with a breakpoint after them. A cache prefix must match from the start, so nothing after them can be read by another builder: not the ~48k role prose, vocabulary and manual, and not the tools in front.
- The consultant doesn't notice, because it is one long session re-reading its own prefix.

Nothing in 1stcontact can fix this without cutting words: memory configuration is per manager, which the consultant, coordinator and builder share, and requirement 4 forbids dropping the charter. The fix belongs upstream: the per-session text should go after the last shared breakpoint, with no wording change. That is lagrange-framework BUG-90.

Duplication check (requirement 4): no paragraph over 120 characters of the builder's system prompt also appears in its tool definitions, so there is no duplicate to remove.

## What landed (item 2)

- `backends.json` declares `cache_ttl` on every backend: `claude` (consultant) `"1h"`, `claude_coordinator` `"1h"`, and `claude_builder` `{"system": "1h", "messages": "5m"}`. The `about` text says why.
- The host no longer passes `cacheTtl` to any `ClaudeAPIBackend`. The framework reads `cache_ttl` from `backends.json` under the name each backend is constructed with, so the document is the single source for the wire.
- `cacheTtlOf(name)` (backends.ts) now returns `{system, messages}` read from the same key, so the meter prices from what the wire asked for. A plain string means both halves; an absent key means the framework's default, the hour.
- The meter (`costMicros`) still prices split writes by the lifetime the provider reports for each part. Any unsplit remainder is priced at the backend's **system** lifetime, the longer of the two, so a mixed-lifetime backend can be over-metered on an unsplit write but never under-metered.
- The consultant and the coordinator are unchanged: the hour on prefix and history alike.

## Test plan

- `tests/test_UAT_FC_REQ-421_builder_cache_lifetimes.workers.test.ts` drives one delegation through the real route with a scripted model client. Every builder request's `system` markers ask for `1h` and its message markers for `5m`. Every consultant request's markers ask for `1h`. `cacheTtlOf` returns `{1h, 5m}` for the builder and `{1h, 1h}` for the consultant.
- The BUG-242 and REQ-292 UATs now read `cacheTtlOf(...).system`; both still pin the consultant at the hour.
- The two-builders-share-the-prefix UAT (byte-identical up to the breakpoint) is lagrange-framework BUG-90's conformance fixture. Once BUG-90 is installed, the same assertion can be added here.
- Measure afterwards from `turn_spend.attributed`. Item 2 alone should show builder history writes at the 5m rate. Only after BUG-90 should a short builder run's writes come close to its own growth rather than its whole context.