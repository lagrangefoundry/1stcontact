---
uid: bug-23d1ec27
id: BUG-39
type: bug
title: 'Node chat-host UATs fail: the model double still speaks the pre-streaming
  contract'
created_by: xgd
created_at: '2026-08-24T22:25:21.810676+00:00'
updated_at: '2026-08-31T05:05:09.315020+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: medium
  severity: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-72dd436d
  commits:
  - working_sha: 759cd87405a4b50f81995b2c9b510bf23be54fbd
    reconcile_sha: null
    main_sha: null
  version: 0.2.15
  story_points: 3
  bundled_in: bundle-8eef3846
---

## Symptom

`tests/test_UAT_FC_REQ-122_chat_host.test.ts` — 5 of 8 tests fail on `xgd-working`, in the main checkout and in a worktree alike:

- `..._a_turn_that_calls_a_tool_changes_the_draft_and_streams_what_it_did` — `expected 'The old headline.' to be 'A new headline.'`

- `..._a_refused_call_comes_back_correctable_and_leaves_the_draft_alone` — `expected 'undefined' to contain 'NOT_FOUND'`

- `..._the_conversation_persists_and_is_replayed_from_the_store` — `expected [ 'user' ] to deeply equal [ 'user', 'assistant' ]`

- `..._two_sites_are_two_conversations_over_two_tool_surfaces` — `expected 'The old headline.' to be 'Annex news.'`

- `..._a_missing_api_key_is_explained_without_losing_the_conversation` — `expected [ { role: 'user' } ] to have a length of 2 but got 1`

The common thread is that **the assistant's half of every turn is missing**: the user turn is recorded, no tool ever runs, no assistant turn reaches the archive.

Found while fixing BUG-38. Pre-existing and unrelated to it — the failures are byte-identical with BUG-38's change stashed.

**The blast radius is wider than the reproduce line.** The same stale double sits in two more Node suites, and they fail the same way: `REQ-127_session_binding` (3) and `reconciliation-assistant-conversation` (7). Fifteen failures, one cause.

## Root cause

The test's model double still speaks the **non-streaming** Anthropic contract. Its steps hand back a finished message:

```
const says = (text: string) => () => ({ content: [{ type: 'text', text }] })
const calls = (name, input) => () => ({
  content: [{ type: 'tool_use', id: `call-${name}`, name, input }],
})

```

The shared AI library's backend does not consume that shape. `ClaudeAPIBackend._callModel` (`lagrange-framework/components/ai/js/src/backends/claude_api.js:104`) calls `this._client.messages.create({..., stream: true})` and treats the result as an async iterable of raw wire events, which `AnthropicAccumulator` (`backends/api_tools.js:317`) reassembles from `content_block_start` / `content_block_delta` / `content_block_stop` — text as `text_delta`, tool arguments as `input_json_delta` fragments parsed at the stop. Iterating a plain `{content: [...]}` object yields nothing — so the turn completes having seen no text and no `tool_use`, which is precisely the failures above.

The backend moved to streaming upstream; three Node suites were not moved with it. Their workerd counterpart WAS — `test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts` was written after the change, its double emits the block events, and it passes.

## Fix — as landed

**One double, in **`tests/support/scripted-model-client.ts`, exporting `scriptedClient` / `says` / `calls` on the streaming contract, with the contract itself written down in the module header. Four hand-maintained transcriptions collapsed into it — 274 lines of duplicated protocol deleted, 57 added:

suite

before

after

`test_UAT_FC_REQ-122_chat_host`

5 failing

8/8 pass

`test_UAT_FC_REQ-127_session_binding`

3 failing

1 failing (different cause, below)

`reconciliation-assistant-conversation`

7 failing

1 failing (same different cause)

`test_UAT_FC_REQ-131_change_journal`

passing on a stale double

passing on the shared one

`reconciliation-draft-change-journal`

3rd copy

imports the shared one

`test_UAT_FC_REQ-146_ai_host_in_workerd`

4th copy

imports the shared one

`test_UAT_FC_BUG-38_chat_session_survives_isolate_churn`

inline copy

imports the shared one

`reconciliation-assistant-conversation-knowledge`

inline copy

imports the shared one

The one inline double left is REQ-122's `create: async () => { throw }` — it models the network failing and transcribes no protocol at all.

### The evidence for this ticket

`tests/test_UAT_FC_BUG-39_model_double_contract.test.ts`, two cases:

1. `..._the_shared_double_is_consumed_by_the_real_backend` — the double driven through the real host (real session manager, real tool loop, real `edit.ts` write) produces prose AND a tool call whose arguments survive the wire's fragmentation and change the site on disk, and the loop runs twice with the tool result fed back in. This is exactly the assertion the broken suites could not make: under the pre-streaming shape the route still answered, the stream still framed and a `done` still arrived.

2. `..._the_wire_protocol_is_transcribed_in_exactly_one_place` — the drift guard. Scans `tests/**` and asserts the provider's block events appear in one file only, and that no file installing a model client has drifted back to the pre-streaming `content: [{type: 'text'…}]` shape. Repairing the suites proves they pass today; this is what stops the next protocol change splitting them again.

## Watch for — resolved

The three REQ-122 tests that passed before were **not** vacuous: two assert on `client.seen[0]`, i.e. on what the model was SENT, which a real call produced. They were incomplete, though — neither asserted a reply. Both now also assert the scripted answer reached the stream, so neither can pass on the transport alone. The third (`a_failure_mid_turn…`) uses the throwing double and never depended on the contract.

## Out of scope — a second, unrelated defect surfaced

Two failures survive and are **not** this bug:

- `test_UAT_FC_REQ-127_an_unissued_session_id_is_refused_rather_than_opened`

- `test_UAT_AC1055_an_identifier_the_origin_never_issued_is_refused_before_anything_is_streamed`

Both post to `/api/ai/prompt` with `site-<slug>` — an id nobody issued but that `sessionIdFor` would derive — and expect `404`. They get `200`. They fail identically before this change and in isolation, so they are not order-dependent and not caused by the double.

The cause is **BUG-38, deliberately**. It deleted the per-process session registry (a `Map` that could not survive isolate churn in workerd — every cloud turn was told its conversation was closed) and replaced its protection with a store read: `slugForSession` now resolves an id iff it names a site this tenant actually holds (`host-core.ts:294`). So "derivable is not the same as issued", which is the invariant both tests state in their own comments, is an invariant the code no longer holds by design.

That is an intent conflict between BUG-38 and REQ-127/AC1055, not a regression — and rewriting another intent's acceptance criterion from inside this ticket is the wrong place for it. Flagged for the operator to decide.

## Acceptance criteria

1. ✅ All 8 tests in `test_UAT_FC_REQ-122_chat_host.test.ts` pass.

2. ✅ The scripted-client double is defined once and imported by both the Node and the workerd chat-host suites — and by every other suite that had a copy. Enforced by a test, not by convention.

3. ✅ The three tests that pass today still pass, and two of them were strengthened to assert a real model turn rather than the request alone.

## Reproduce

```
npx vitest run tests/test_UAT_FC_REQ-122_chat_host.test.ts

```

Note: in a fresh worktree this first fails with `Cannot find module './generated/ai-workers.js'` — a build artefact, not this bug. `./bin/1c assets` emits it.