---
uid: request-c4b6044f
id: REQ-361
type: request
title: 'Consultant context: drop old tool results and stop oversized results entering
  it'
created_by: EPIC-20
created_at: '2026-10-02T18:49:38.862851+00:00'
updated_at: '2026-10-02T23:02:48.200427+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  epic_parent: epic-0923bb64
  created_by: EPIC-20
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-503b8c6e
---

**Parent:** EPIC-20. **Evidence:** EPIC-20 § "Charlie's Plumbing session, 2026-10-01/02".

## Problem

In the Charlie's Plumbing session the consultant (Opus) cost $28.88 of $33.41. More than half was cache reads ($16.73): every request re-reads the whole conversation, which grew from ~50k tokens on the first turn to ~514k on the last. Nothing trims it within a session. About $12 of the consultant's cost was spent carrying old tool results forward.

Three outsized results did most of the damage:

1. **`Delegate` results carry whole subtrees.** The REQ-340 account lists a whole element tree as `before`/`after` when a worker creates a page or restructures a box. Four results were 62 KB, 70 KB, 53 KB and 54 KB (~76k tokens together).
2. **`capture_site` returned 241 KB**, almost all a list of `data:` URLs it refused to fetch (~69k tokens).
3. **Plan and ledger writes echo the whole document back.** `set_decision` and `set_task` return the full plan (11–24 KB) on every call. `set_standing_note` returns the full note.

## Required behaviour

### A. Old tool results leave the context after the turn that used them

- A tool result produced in an earlier consultant turn is replaced in later requests by a short stub naming the tool, the turn, and how to get it again (re-read, or the tool-transcript record by id). The result in the current turn is untouched.
- The stub is stable: the same result always renders the same stub, so the cached prefix stays valid from one turn to the next. The rewrite happens once, at a turn boundary, never mid-turn. Re-rendering history differently on every request would break the cache and cost more than it saves.
- The model's own text, the client's messages and the `Delegate` brief stay. Only tool *results* are stubbed.
- The stored transcript keeps every result in full. This is a change to what is sent, not what is recorded.
- This must stay compatible with Opus 5.5's preserved-thinking rule (thinking blocks are bound to an unedited history). If stubbing earlier turns would invalidate thinking blocks, the turn-boundary rewrite must use whichever form the API accepts, and the ticket must record which.

### B. The three oversized results are slimmed at the source

- **`Delegate` account:** a difference whose `before` or `after` is an element subtree is reported as an address, the operation (`created`, `replaced`, `removed`), the element kind and a child count, not the tree itself. Field-level differences (`padding.topPx: 32 → 56`) keep their values. A whole new page reports its id and element count.
- **`capture_site`:** refusals are summarised as a count per reason (`41 × scheme: data:`) plus at most five examples.
- **Plan/ledger writes** (`set_decision`, `set_task`, `record_decision`, `update_brief`, `add_note`, `set_standing_note`) return a confirmation: what was written and its id/version, not the whole document. A separate read returns the document when the consultant needs it.

## Acceptance

- Replaying the Charlie's Plumbing session's consultant tool calls through the new path, the context sent on the last request is under 150k tokens, against ~514k measured.
- A two-turn conversation where turn 1 calls a tool shows, on turn 2's first request, a cache read covering turn 1's (stubbed) history. Stubbing must not cost the cache.
- A `Delegate` that creates a page returns an account under 4 KB.
- The 241 KB `capture_site` refusal list renders as a per-reason summary under 2 KB.
- Each plan/ledger write returns under 1 KB.

## Not in scope

The step count (39 bookkeeping and 27 room calls out of 121). That is prompt and method, and is measured again after this lands.


## What landed (free-coded, part B)

Part B is implemented in this repository. Part A is not (see "Part A — where it has to land" below).

**`Delegate` account** (`account-core.ts`, `draftChanges`). A difference whose `before` or `after` would have been a tree now carries `op` (`created` / `replaced` / `removed`) and a size instead of the values, and never `before`/`after`:
- an element added or removed: its address, `op`, `kind` and `children` (its direct child count — what it has now, or had when removed);
- an element whose position now holds an element of a different kind: one `replaced` entry at the new address, with `kind`, `was` (the old kind) and `children`. The alignment already reports a change of kind as a removal next to an addition; the pair is folded into one entry;
- a whole page created or removed: its page id, `op`, and `elements` (every element on the page, its own tree plus every component instance's slots);
- a component instance created or removed: page, module, `op`, `kind` (the component type) and `elements`; a slot created or removed: page, module, slot, `op`, `elements`; a page's L1 tree appearing or disappearing: `field: 'l1'`, `op`, `elements`.
Field-level differences (`axes.fontSizePx: 32 → 56`, text, settings, assets by digest) keep their values exactly as before. This supersedes REQ-340's shape for whole-element differences: REQ-340's inserted-band case now asserts `{op: 'created', kind, children}` and no `after`.

**`capture_site`** (`egress-guard.ts`, `summariseRefusals`; `fidelity-core.ts`). `refusals` is now `{ total, reasons, examples }`:
- `reasons` counts refusals per reason; a `scheme` refusal is keyed by the scheme it named (`"scheme: data:": 41`), so different schemes stay separate findings;
- `examples` holds at most five, one of each reason first; each URL is shortened to 120 characters plus its full length, so a `data:` payload never rides along;
- an empty capture reports `{ total: 0, reasons: {}, examples: [] }`.
The fidelity surface's description of `refusals` says the same. BUG-127's two `capture_site` cases assert the new shape; its guarded fake browser moved to `tests/support/guarded-capture.ts` so both suites drive the same double.

**Plan writes** (`plan-core.ts`, `plan-surface.json`). Every plan write, not only the four named above, returns what it wrote instead of the whole plan: `set_decision` and `record_client_answer` → `{decision}` as it now stands; `set_task` and `set_task_status` → `{task}`; `answer_check`, `ask_check`, `record_check_answer` → `{check}`; `update_brief` → `{brief: [keys set], quoted?}`; `set_feature` → `{feature}`; `add_note` → `{note: {section, characters}}`; `set_phase` → `{phase}`. Any string in a confirmation is shortened to 200 characters plus its length. `read_plan` still returns the whole document (fields, body, panel). Writes declare a new `written` shape, and the plan overview tells the model a write confirms rather than echoes.

**Ledger writes** (`ledger-core.ts`, `ledger-surface.json`). `record_decision`, `name_engagement` and `set_standing_note` return `{entries, title, note_bytes}`: the note's length in bytes instead of the note. The note is already put in front of the session on every turn, so echoing it repeated it, and `set_standing_note` used to return the whole note it had just been sent. The byte count still confirms the write landed.

## Part A — where it has to land, and what the API allows

**It is not in this repository.** The request sent to the model is assembled by the `@lagrangefoundry/ai` library (lagrange-framework `components/ai`): the backend keeps `messages[]` itself (`claude_api.js` `_state`), and `boundDialogue` (`api_tools.js`) is where history is already bounded at the turn boundary. It ages images into pointers with `ageImages` and drops old exchanges with `recentExchanges`. Stubbing old tool results is the same kind of rule and belongs beside those. The host has no hook into `messages[]`. A lagrange-framework ticket is needed. It is drafted, not filed, because filing it needs the operator's go-ahead.

**Opus 5.5's preserved-thinking rule, recorded as the ticket asks.** The library stores and replays thinking blocks: `AnthropicWire.record` keeps every non-text, non-`tool_use` block. On Opus 5.5 a thinking block is valid only while the `system`, `tools` and every earlier message are byte-identical to when it was produced. Replacing an earlier `tool_result` with a stub, client-side, is an edit. It invalidates every thinking block after it, and on accounts created on or after 2026-08-31 the request is rejected with a 400. Older accounts can opt in to the same check. API guidance says client-side pruning of tool results has no append-only workaround on this model. The forms the API accepts:
1. **Server-side context editing**: `context_management.edits: [{type: "clear_tool_uses_20250919", ...}]` under beta `context-management-2025-06-27`. It does not count as an edit, because the check compares the conversation as sent. Each clearing pass rewrites the cached conversation, though. Anthropic's measured run of context editing cost more than it saved, so it is a context-window tool rather than a savings lever. It needs a high trigger and `clear_at_least` so that clears are rare and large.
2. **Client-side stubbing plus dropping thinking**: stub the earlier turns' tool results and, in the same rewrite, drop every thinking block from those turns. Alternatively, send `thinking.block_binding.prefix_mismatch_behavior: "drop_block"` under beta `thinking-binding-controls-2026-08-01`. This is valid, at the cost of the earlier turns' reasoning. Done once per turn boundary with a deterministic stub, it costs one cache write of the changed span per turn rather than a miss on every request.
Recommendation for the upstream ticket: option 2, applied in `boundDialogue` at the turn boundary, never mid-turn, and never to an assistant turn whose `tool_use` still awaits its result. `ageImages` already rewrites earlier messages client-side, so it has the same exposure, and the upstream ticket should cover both.

**Acceptance as written cannot be met in two places:**
- *"turn 2's first request shows a cache read covering turn 1's (stubbed) history"*: the stubbed form of turn 1 is first sent on turn 2's first request, so that request writes it to the cache, and only later requests read it. The achievable criterion is that turn 2's second request (or turn 3's first) reads turn 1's stubbed history, and turn 2's first request reads the prefix up to turn 1.
- *"the context sent on the last request is under 150k tokens"* depends on part A, and was not measured here. It needs the session replay once part A lands upstream.

## Test plan

`tests/test_UAT_FC_REQ-361_oversized_results_are_slimmed.test.ts`:
- a `Delegate` bracket that creates a page with a 60-element tree (over 10 KB serialised) yields an account under 4 KB, with the page named by id, `op: 'created'` and `elements: 61`, and no `after`;
- a band replaced by a box of ten yields one `replaced` entry (`kind: 'box'`, `was: 'text'`, `children: 10`), and a field change on another band keeps `before: 32, after: 56`;
- `capture_site` on a page requesting 41 large `data:` URLs and one link-local beacon reports per-reason counts (`scheme: data:`, `private-address`), at most five examples with one of each reason and short URLs, and the whole summary under 2 KB;
- on a plan holding 30+ decisions, `update_brief` (with a long quote), `add_note` (long text), `set_decision` and `set_task` each return under 1 KB, a `set_decision` returns the decision and no `plan`/`body`, and `read_plan` still returns the whole document;
- `set_standing_note` returns `{entries, title, note_bytes}` with the note's byte length and none of its text; `record_decision` returns under 1 KB.

Regression scope: REQ-340 (node + workers), BUG-127, REQ-356 (surface + workers), REQ-283 (both), REQ-339, REQ-171, REQ-126, REQ-157, BUG-172, REQ-281, REQ-342, REQ-354, REQ-166, BUG-167, REQ-357, BUG-129, REQ-206 and the assistant control surface all pass. REQ-295's REQ-341 case fails identically on clean xgd-working.
