---
uid: comment-954b55fc
id: COMMENT-2319
type: comment
title: Comment on chat CHAT-47
created_by: xgd
created_at: '2026-09-09T02:35:36.626538+00:00'
updated_at: '2026-09-09T02:46:16.473653+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-5011da11
  kind: chat_transcript
---

<!-- xgd-turn id="bd878745-b638-4c83-86de-5543e61917de-user" -->

<!-- xgd-chat role="user" ts="2026-09-09T02:35:20.996614+00:00" -->
#### You
I am working with the model on a concept site - its slow and expensive. Not disasterously but still. I have a hero segment design in about an hour and it cost me $20 => Claude costs more than minimum wage...

What model are we calling with the API?

Does anthropic give any details of the relative costs of different models?

<!-- xgd-turn id="bd878745-b638-4c83-86de-5543e61917de-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-09T02:38:06.716425+00:00" -->
#### Claude
## What model

`claude-sonnet-4-6`, and nothing in this repo chooses it — it's the shared library's fallback default.

- `tools/generate/src/cli/ai/host-core.ts:613` constructs `new lib.ClaudeAPIBackend({ client?, apiKey?, tools })` with **no `model`**.
- `@lagrangefoundry/ai/src/backends/claude_api.js:32` → `export const DEFAULT_MODEL = 'claude-sonnet-4-6'`.

Request shape (`claude_api.js:126`): `max_tokens: 4096`, `stream: true`, no `thinking`, no `output_config.effort`.

## Anthropic's published per-model pricing

Yes — [anthropic.com/pricing](https://www.anthropic.com/pricing), per million tokens:

| Model | Input | Output | vs. what you're on |
|---|---|---|---|
| Claude Haiku 4.5 | $1 | $5 | **0.33×** |
| Claude Sonnet 4.6 ← *you* | $3 | $15 | 1× |
| Claude Sonnet 5 | $3 | $15 | **1×** (same price, newer) |
| Claude Opus 5 | $5 | $25 | 1.67× |
| Claude Fable 5 | $10 | $50 | 3.3× |

Cross-cutting multipliers matter more than the model choice here: **cache read ≈ 0.1×** input, cache write ≈ 1.25×, Batch API = 0.5×.

Worth noting Sonnet 5's introductory rate ($2/$10) ended 2026-08-31, so Sonnet 5 is now list-price identical to Sonnet 4.6 — a free capability upgrade if you want one.

## Why it's costing $20/hour, though

The model isn't your problem. This is:

**`cache_control` is applied to the system prompt only — never to `messages[]`.** The sole application site in the whole library is `api_tools.js:249`, inside `anthropicSystem()`. So your priming docs and tool schemas cache correctly (they sit before the breakpoint in the `tools → system → messages` prefix), but the conversation history — **including every screenshot you've taken** — is re-sent at full $3/MTok on *every single turn*.

That makes session cost quadratic in turn count, which is exactly the curve DOC-33 §4 predicts and warns about.

Compounding it: `ClaudeAPIBackend.capabilities` declares `compaction: false` (`claude_api.js:53`), so the manager's 140k compaction threshold never fires on this path. History grows unbounded within a sitting.

Rough arithmetic: an hour of design work, ~60 turns, history averaging ~80–100k tokens (a handful of screenshots at ~1.5–4.8k each will do that fast) → ~5–6M uncached input tokens → ~$15–18. That's your $20.

**The fix with the best ratio by far** is a cache breakpoint on the message history — mark the last stable block before the new user turn. Cache reads at 0.1× would take that same hour from ~$18 to ~$2–3, with no change to model, quality, or behaviour. Dropping screenshot bytes from history once their finding is in the ledger (DOC-33 §4's "crop at gates") is the second lever.

Want me to open a ticket for the message-history cache breakpoint? It's in `@lagrangefoundry/ai`, not this repo, so it'd be a lagrange-framework ticket.

<!-- xgd-turn id="9f14b3ba-034c-438f-9b79-38b81b2fd12b-user" -->

<!-- xgd-chat role="user" ts="2026-09-09T02:41:48.842342+00:00" -->
#### You
Can you look at the actual transcript and exchanges, and tool use? This session started around 6.34pm I'm sure there were not 60 exchanges - neither me nor Claude goes that fast

<!-- xgd-turn id="9f14b3ba-034c-438f-9b79-38b81b2fd12b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-09T02:46:16.061492+00:00" -->
#### Claude
You're right — 15 exchanges, not 60. Here's what the audit ledger actually says.

## Source

R2 `audit/biz_51a6.../site-1stcontact/*.json` — 121 events, one per tool call, with `resultBytes` and `durationMs`. The sequence number resets per exchange, so turn boundaries are recoverable. (Read via the miniflare R2 sqlite + blob store.)

**There is no token telemetry anywhere.** `claude_api.js:_callModel` never reads `response.usage` — `input_tokens` / `cache_read_input_tokens` are on the `message_start` frame and dropped on the floor. Only the `claude_code` backend reads them (`claude_code/invoker.js:230`). So the ledger gives exact tool counts and result sizes; token counts below are modelled from those.

## The design stretch — 18:44 to 19:31, 47 minutes

| | |
|---|---|
| Exchanges (you ↔ Claude) | **15** |
| Tool calls | **102** |
| **Model API round trips** | **117** |
| messages[] at end | ~70k tokens |

That's the number that matters. Every tool result forces another `messages.create` carrying the *entire* conversation so far. Your first exchange at 18:44 ran **41 tool calls in a single turn** — 42 API requests, each resending everything accumulated before it.

## The cost curve

| # | time | tools | ctx@start | $ turn | $ cum |
|---|---|---|---|---|---|
| 1 | 18:44 | 41 | 0k | 2.09 | 2.09 |
| 4 | 19:01 | 10 | 32k | 1.26 | 4.16 |
| 10 | 19:22 | 7 | 55k | 1.47 | 10.16 |
| 11 | 19:23 | 2 | 61k | 0.58 | 10.74 |
| 13 | 19:25 | 2 | 64k | 0.60 | 11.93 |
| 15 | 19:30 | 5 | 66k | 1.28 | **13.83** |

Turns 11–14 are the tell: `write_image` + `screenshot`, five seconds of wall time, **60¢ each**. Nothing about that work is expensive — you're paying to re-upload 60k tokens of history three times for a wordmark tweak.

~$14 input by this model, plus output and the 16:13/18:28 fragments. Your $20 is consistent.

## What fills the 70k

| source | n | tokens | share |
|---|---|---|---|
| `fidelity.screenshot` | 21 | 23.4k | 33% |
| `knowledge.chunk_search` | 5 | 11.5k | 16% |
| `l1.get_l1` | 15 | 9.8k | 14% |
| `l1.set_l1` | 18 | 7.8k | 11% |

Screenshots lead, but I want to walk back the emphasis I put on them last message: at the 1024px cap (`MAX_IMAGE_EDGE`, fidelity-core.ts:77) each is only ~700–1,100 tokens. 21 of them is ~23k — **2% of the 3.5M tokens actually billed.** They're not expensive because they're big. They're expensive because they sit in `messages[]` and get re-sent 117 times.

## Estimated vs. measured

Measured: exchange count, tool counts, `resultBytes`, timings, round-trip count, and that `cache_control` appears only on system blocks. Estimated: system prompt ≈30k tokens (from ~90KB of surface JSON → rendered manuals), image tokens ≈1,100 each, 3.5 chars/token. If the priming renders larger than 30k the total goes up.

## The fix, re-ranked on this data

1. **Cache breakpoint on `messages[]`.** ~3.5M of the ~7M billed tokens are uncached history. At 0.1× read this alone takes the session from ~$14 to ~$4. Single change in `api_tools.js`.
2. **Add `ttl: "1h"` to `CACHE_CONTROL`** (`api_tools.js:195` is bare `{type:'ephemeral'}` = 5 min). Your gaps at 18:47→18:56 and 19:09→19:15 blew the window; design thinking is slower than 5 minutes.
3. **Record `usage` from `message_start`.** Cheap, and it ends the guessing — it also unblocks occupancy reporting, which is why `ClaudeAPIBackend.capabilities` has `compaction: false` and the manager's 140k threshold can never fire on this path.
4. Screenshot hygiene — real, but worth ~2%. Not first.

All four are in `@lagrangefoundry/ai`, not this repo. Want me to open a lagrange-framework ticket for 1–3?

<!-- xgd-chat-end -->