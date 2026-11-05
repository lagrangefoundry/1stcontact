---
uid: request-fe6c7122
id: REQ-451
type: request
title: 'Builders: run on Claude Haiku 5.5, with the meter pricing its two rate cards'
created_by: EPIC-20
created_at: '2026-10-24T20:32:14.429737+00:00'
updated_at: '2026-10-24T21:08:36.854686+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-242922e0
  commits:
  - working_sha: 69066798f9df48031f3a9a05ee9e562914be3cce
    reconcile_sha: null
    main_sha: null
  - working_sha: ebd7e6a68626805324752ac15af84a30840fd8a4
    reconcile_sha: null
    main_sha: null
  version: 0.2.621
  story_points: 5
---

## What

Delegated builders (`claude_builder`) move from `claude-haiku-4-5` to **`claude-haiku-5-5`**, and the spend meter prices Haiku 5.5 correctly.

Costing is in DOC-68. On six recent builds this is about −55% of builder spend (≈ −25% of a whole build), and about −87% if builder prompts stay at or under 100K Haiku 5.5 tokens. Haiku 5.5 is also described as substantially better than Haiku 4.5 at instruction following and as a sub-agent. Most of our builder spend is rework from scope and instruction mistakes.

Only the builder moves. The consultant stays on Opus 5.5 and the critic on Opus 5.5. The coordinator (`claude_coordinator`, also Haiku 4.5, small spend) is out of scope unless the operator says otherwise.

## Behaviour

1. **Builder model.** `backends.json`'s `claude_builder.model` is `claude-haiku-5-5`. Its `max_tokens` (32000) and `cache_ttl` (system 1h / messages 5m) are unchanged.
2. **Builder context window set explicitly.** The framework's shipped model-window table (`@lagrangefoundry/ai` `src/defaults/models.json`) has no entry for `claude-haiku-5-5`. With no known window, the host's context guard (`budget-core.ts` `budgetCeiling`, REQ-296) reads zero as "do not guard", and the builder's context-pressure and ReportResult cues would never fire. So `claude_builder` names `context_window` itself, as `claude` already does. **Value: 200000**, which keeps today's builder behaviour: runs end and report where they do now. Haiku 5.5's 1M window is deliberately not used, because a longer run is a more expensive run, billed at the long-prompt card. The prompt-size work in DOC-68 may lower this later.
3. **Meter: two rate cards.** `prices.json` gains a `claude-haiku-5-5` entry under `claude_builder`:
   - ≤100K prompt: input $0.10, output $0.50, cache read $0.01, 5m write $0.125, 1h write $0.20;
   - above 100K: input $0.50, output $2.50, cache read $0.05, 5m write $0.625, 1h write $1.00.

   The card is chosen **per request**, by that request's prompt size (input + cache read + cache write tokens). Not per turn, because one builder turn crosses the threshold mid-run. `spend-core.ts` prices a turn as the sum of its requests' costs whenever a model has a long-prompt card. The framework already hands the host one usage record per request (`requests` on the terminal meta), and `request_spend` stores them. A model without a long-prompt card is priced exactly as today. Existing `claude-haiku-4-5` prices stay, so historical rows keep their price.
4. **Thinking.** Haiku 5.5 runs adaptive thinking by default (effort `medium`), and its thinking tokens count as output within `max_tokens`. The adapter sends no `thinking`, `budget_tokens`, sampling parameters or prefill, so no request shape needs to change. The meter counts thinking as output as usual. Check thinking volume on the first dev build; if output cost rises materially, revisit with the operator.
5. **Tokenizer.** Haiku 5.5 counts the same text as ~30% more tokens. Token-based thresholds that assume Haiku 4.5 counts are unchanged by this ticket, but note them in the ticket if found: the builder's context-pressure line, BUG-129's priming cap is in characters, and so on.

## Not in scope

- Shrinking builder prompts (DOC-68 prompt-size section) — separate follow-up if pursued.
- Open-weights backends (needs a framework adapter).
- Adding `claude-haiku-5-5` to the framework's shipped model tables. This ticket sets `context_window` locally so it isn't blocked; a framework ticket can follow.

## Test plan

- UAT: the builder backend resolves to `claude-haiku-5-5` with `context_window` 200000, so a builder session is guarded against its window: the host's request ceiling is non-zero.
- UAT: a builder turn of two requests, one at 60K prompt tokens and one at 120K, is priced at the ≤100K card for the first and the >100K card for the second. The turn's `cost_micros` equals the sum, and each `request_spend` row carries its own request's cost.
- UAT: a turn on a model with no long-prompt card (e.g. `claude-haiku-4-5`, `claude-opus-5-5`) is priced exactly as before.
- Regression: the existing spend / tenant-cost / spend-report UATs that pin `claude-haiku-4-5` still pass. Update their fixtures only where they assert the builder's configured model.

## Implementation (as landed)

- **`backends.json`**: `claude_builder.model` = `claude-haiku-5-5`, `context_window: 200000`; `max_tokens` and `cache_ttl` unchanged. Without the declared window the host would actually refuse to start (`checkProjectWindows`, REQ-296) rather than run unguarded. Resolved ceiling: 151,200 tokens.
- **`prices.json`**: `claude_builder/claude-haiku-5-5` carries the ≤100K card as its base rates and the >100K card as a `long_prompt` object (`above: 100000` plus the same five rate names). Exactly 100,000 prompt tokens is the short card. The `about` text documents the shape. `claude-haiku-4-5` prices are unchanged.
- **`spend-core.ts`**: `ratesFor(backend, model, prompt)` picks the long card when `prompt > above`. `costMicros` picks the card by its usage's own prompt size (input + cache read + cache write). That is exact for one request (`request_spend` rows, the per-message `SpendMeter`) and an upper bound for a sum. New `requestsCostMicros`: on a model with a long card, a turn is the sum of its requests' costs; on any other model, or a turn with no request records, the summed counters are priced exactly as before. `turnSpendRecord` uses it. New exports: `hasLongPromptCard`, `promptTokens`.
- **Console delegated half (`apps/control-app/src/spend.ts`)**. This is a technical consequence of per-request pricing. A builder's spend reaches the console through the consultant's `attributed` entry, and that entry holds only the builder's **summed** counters. The builder has no `turn_spend` row of its own. Priced as one request, a 60K + 120K builder would land on the long card (180K): 32,500 micros instead of the 16,900 actually billed. So `tenantDelegatedSpend` and `tenantTurnCosts` now price a long-card entry from the builder's own `request_spend` rows (the sum of their stored `cost_micros`; unpriced if any row is unpriced). Unattributed (lost) builders on such a model are priced the same way. An entry with no request rows keeps the summed figure, which is an upper bound, never an under-count. Entries on other models are unchanged.

## Thresholds noted (tokenizer, item 5)

These are unchanged by this ticket. Haiku 5.5 counts the same text as ~30% more tokens, so each one now holds less page text:
- `budget-core.ts` `TURN_BUDGET_FRACTION = 0.9` (the guard's ceiling) and `REPORT_RESERVE_FRACTION = 0.8` (the builder's ReportResult cue, `priming.json` `report-reserve`). Both are fractions of the token window.
- The 200,000 window itself.
- BUG-129's priming cap is in characters, so the tokenizer does not affect it.

## Tests as landed

- `tests/test_UAT_FC_REQ-451_builder_on_haiku_5_5.test.ts`: the builder resolves to haiku-5-5 with a 200K window and a non-zero ceiling, and the other roles have not moved. A 60K + 120K turn is priced per card in its request rows and in its turn total. Boundary at exactly 100K. Models without a long card are priced as before.
- `tests/test_UAT_FC_REQ-451_builder_spend_by_request.workers.test.ts`: through the real route, a delegated builder's two requests are priced at their own cards in `request_spend`, and the console's delegated half (`tenantTurnCosts`, `tenantDelegatedSpend`) equals their sum. Checked: this fails at 32,500 without the spend.ts change.
- Fixture updates, only where a fixture asserted or priced via the builder's configured model: BUG-242 (builder hour-rate entry sized under 100K), REQ-409 (builder model pin; the spend-ceiling builder now outputs 21M tokens to cross $10), REQ-296 (builder window may be declared), REQ-297 / REQ-320 / BUG-166 (worker entry re-sized to 90K in / 22K out, which keeps 20,000 micros at Haiku 5.5 rates; delegated `byModel` key is `claude-haiku-5-5`). Stored historical `claude-haiku-4-5` rows in those fixtures are unchanged.
- Pre-existing failures, also red on clean xgd-working: REQ-292 `a_host_with_no_meter` (`logDir`), REQ-143 d1r2 import, REQ-208 vendor, REQ-295 ×2, REQ-416 priming.