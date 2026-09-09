---
uid: comment-954b55fc
id: COMMENT-2319
type: comment
title: Comment on chat CHAT-47
created_by: xgd
created_at: '2026-09-09T02:35:36.626538+00:00'
updated_at: '2026-09-09T02:41:48.875446+00:00'
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

<!-- xgd-chat-end -->