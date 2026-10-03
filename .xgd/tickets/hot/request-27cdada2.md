---
uid: request-27cdada2
id: REQ-362
type: request
title: 'Backends: consultant on Opus 5.5, spend meter records each role''s own backend,
  builder step limit 100'
created_by: EPIC-20
created_at: '2026-10-02T18:49:40.887550+00:00'
updated_at: '2026-10-03T01:01:36.076315+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  epic_parent: epic-0923bb64
  created_by: EPIC-20
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-708f6963
  commits:
  - working_sha: 25bceef09d1ff4ac3d8b4324400b14ae840bce23
    reconcile_sha: null
    main_sha: null
  - working_sha: cd3cfa540c54b8fe636cfc9d947fb1942adf9ef6
    reconcile_sha: null
    main_sha: null
  version: 0.2.442
  story_points: 2
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


## What landed (free-coded)

- **Consultant on Opus 5.5.** `backends.json` `claude` → `claude-opus-5-5`, `max_tokens` 64000 unchanged, plus `context_window: 1000000` because the installed framework's model table names only `claude-opus-5`. Delete the key once the framework knows the model.
- **Prices.** `prices.json` `claude` → `claude-opus-5-5` at $4 / $20 / $0.20 cache read / $5 cache write. `claude-opus-5` stays so rows already written can still be re-priced. **Also added: `claude_coordinator` → `claude-haiku-4-5`** ($1 / $5 / $0.10 / $1.25). This follows from the meter fix: once a coordinator row names `claude_coordinator`, an absent entry would leave every coordinator turn unpriced (`cost_micros` NULL).
- **Meter records the backend that ran.** `writeTurnSpend` takes the role's configured backend: coordinator → `claude_coordinator`, everything else → `claude`. `projectBackendModel(lib, name)` now resolves the model for any configured backend through the framework's merge, using the same `{family: 'claude'}` the adapter uses. The row's `cost_micros` is priced from that (backend, model) pair.
- **Every configured backend can be priced.** Each `backends.json` entry's resolved model has a `prices.json` entry under its own backend name.
- **Deferred, blocked upstream:** the consultant's `effort: high` and `claude_builder`'s `max_iterations: 100`. lagrange-framework REQ-203 is still `draft`, and `configureBackends` rejects a key it doesn't declare at start-up, so naming either today would stop the host from starting. `backends.json`'s `about` records the pending edits.
- **Not verified: the preserved-thinking risk.** A live consultant conversation past one window slide on Opus 5.5 has not been run, because the sandbox has no network to Anthropic. It still has to be checked on a live session.

## Test plan

- `tests/test_UAT_FC_REQ-362_consultant_on_opus_5_5.test.ts`: the consultant resolves `claude-opus-5-5` at the 5.5 rates with a 1M window; every configured backend resolves to a model `prices.json` can price; the coordinator stays on Haiku.
- `tests/test_UAT_FC_REQ-357_group_chat.workers.test.ts` › `test_UAT_FC_REQ-362_each_member_rounds_spend_row_names_and_is_priced_at_its_own_backend`: a real room exchange through the Worker route. Consultant rows read `claude`/`claude-opus-5-5`, coordinator rows read `claude_coordinator`/`claude-haiku-4-5`, and each `cost_micros` equals its counters priced at its own pair.
- Superseded pins updated: the REQ-295 consultant-model pin now reads `claude-opus-5-5`. The REQ-296 window assertion accepts an entry's declared `context_window` (the documented escape hatch) before the framework table.