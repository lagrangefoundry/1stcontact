---
uid: request-27cdada2
id: REQ-362
type: request
title: 'Backends: consultant on Opus 5.5, spend meter records each role''s own backend,
  builder step limit 100'
created_by: EPIC-20
created_at: '2026-10-02T18:49:40.887550+00:00'
updated_at: '2026-10-02T18:50:38.059442+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  epic_parent: epic-0923bb64
  created_by: EPIC-20
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-708f6963
---

**Parent:** EPIC-20. **Depends on:** lagrange-framework REQ-203 (per-backend `max_iterations` and `effort`) for the builder step limit and the consultant's effort. The model change and the meter fix do not depend on it.

## Problem

1. **The consultant runs on Claude Opus 5.** Claude Opus 5.5 is the current Opus and is cheaper: $4 in / $20 out, cache read $0.20 per million tokens, against $5 / $25 / $0.50. Cache reads are the consultant's biggest line, so the saving is larger than the list price suggests. Re-pricing the Charlie's Plumbing session's measured counters: the consultant's $28.88 becomes about **$16.4 (−43%)**, before any other change.
2. **The spend meter labels every turn as the consultant's backend.** `writeTurnSpend` in `host-core.ts` records `backend: PROJECT_BACKEND` and `model: projectBackendModel(lib)` for every role. The coordinator is configured on `claude_coordinator` (Haiku) in `backends.json`, but its rows say `claude` / `claude-opus-5` and are priced at Opus rates ($0.90 in that session, ~$0.18 at Haiku). The meter cannot be trusted per role, so it cannot measure this ticket.
3. **Builders run out of steps.** 3 of 8 builder runs hit the 50-call limit and came back `exhausted`.

## Required behaviour

- **Consultant on Opus 5.5.** `backends.json`'s `claude` entry names `claude-opus-5-5`. `prices.json` carries `claude` → `claude-opus-5-5` at $4 / $20 / $0.20 cache read / $5 cache write. If the installed framework does not yet know the model's window, the entry declares `context_window: 1000000`.
- **Effort stays where it was.** Opus 5.5 defaults to effort `medium` where Opus 5 defaulted to `high`. The consultant's entry declares `effort: high` once the framework accepts the key, so this ticket changes price and not judgement depth. Whether `medium` is good enough is a separate, measured decision.
- **Coordinator stays on Haiku** (`claude_coordinator` → `claude-haiku-4-5`, unchanged), and the meter now proves it.
- **The meter records the backend that ran.** Every `turn_spend` row carries the backend and model of the session's own role: consultant → `claude`, coordinator → `claude_coordinator`, each with its configured model. Cost is priced from that pair.
- **Builder step limit 100.** `claude_builder` declares `max_iterations: 100` once the framework accepts the key.

## Risk to check before relying on it

Opus 5.5 binds thinking blocks to an unedited history ("preserved thinking"); on accounts created on or after 2026-08-31 an edited history is refused. The host's window bound (`boundDialogue`) and image ageing (`ageImages`) both edit earlier messages. Verify on a live session that a consultant conversation past one window slide still succeeds on Opus 5.5. If it is refused, that blocks this ticket and goes upstream.

## Acceptance

- A consultant turn's `turn_spend` row reads `claude` / `claude-opus-5-5` and is priced at the 5.5 rates.
- A coordinator turn's row reads `claude_coordinator` / `claude-haiku-4-5` and is priced at Haiku rates.
- With the framework key available: the consultant's requests carry `effort: high`, and a builder run can make more than 50 tool calls.