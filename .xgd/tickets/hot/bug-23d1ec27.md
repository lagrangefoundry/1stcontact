---
uid: bug-23d1ec27
id: BUG-39
type: bug
title: 'Node chat-host UATs fail: the model double still speaks the pre-streaming
  contract'
created_by: xgd
created_at: '2026-08-24T22:25:21.810676+00:00'
updated_at: '2026-08-25T23:21:06.793799+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: medium
  severity: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-72dd436d
---

## Symptom

`tests/test_UAT_FC_REQ-122_chat_host.test.ts` — 5 of 8 tests fail on
`xgd-working`, in the main checkout and in a worktree alike:

- `..._a_turn_that_calls_a_tool_changes_the_draft_and_streams_what_it_did`
  — `expected 'The old headline.' to be 'A new headline.'`
- `..._a_refused_call_comes_back_correctable_and_leaves_the_draft_alone`
  — `expected 'undefined' to contain 'NOT_FOUND'`
- `..._the_conversation_persists_and_is_replayed_from_the_store`
  — `expected [ 'user' ] to deeply equal [ 'user', 'assistant' ]`
- `..._two_sites_are_two_conversations_over_two_tool_surfaces`
  — `expected 'The old headline.' to be 'Annex news.'`
- `..._a_missing_api_key_is_explained_without_losing_the_conversation`
  — `expected [ { role: 'user' } ] to have a length of 2 but got 1`

The common thread is that **the assistant's half of every turn is missing**: the
user turn is recorded, no tool ever runs, no assistant turn reaches the archive.

Found while fixing BUG-38. Pre-existing and unrelated to it — the failures are
byte-identical with BUG-38's change stashed.

## Root cause

The test's model double still speaks the **non-streaming** Anthropic contract.
Its steps hand back a finished message:

```ts
const says = (text: string) => () => ({ content: [{ type: 'text', text }] })
const calls = (name, input) => () => ({
  content: [{ type: 'tool_use', id: `call-${name}`, name, input }],
})
```

The shared AI library's backend does not consume that shape. `ClaudeAPIBackend._callModel`
(`lagrange-framework/components/ai/js/src/backends/claude_api.js:104`) calls
`this._client.messages.create({..., stream: true})` and treats the result as an
async iterable of raw wire events, reassembling the message alongside the tool
loop. Iterating a plain `{content: [...]}` object yields nothing — so the turn
completes having seen no text and no `tool_use`, which is precisely the five
failures above.

The backend moved to streaming upstream; this Node-side suite was not moved with
it. Its workerd counterpart WAS — `tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts`
was written after the change, its double emits `content_block_start` /
`content_block_delta` / `content_block_stop`, and it passes. That file's own
comment states the contract:

> The backend calls `messages.create({stream: true})` and consumes an async
> iterable of raw Anthropic events [...] So the double has to speak that protocol
> rather than hand back a finished message: anything else is a different contract
> from the one production uses, and the test would be asserting against a fiction.

## Fix

Move the Node suite's double onto the streaming contract, matching the workerd
suite's `scriptedClient` / `says` / `calls` helpers — same protocol, so the two
runtimes stay compared on equal terms.

Prefer **sharing one double** over copying it a second time. Two hand-maintained
transcriptions of the same wire protocol is how this drifted in the first place:
the workerd suite got the update and the Node one did not. A `tests/support/`
module holding the scripted client, with both suites importing it, means the next
upstream protocol change breaks one place and is fixed in one place.

## Watch for

**The 3 currently-passing tests in this file may be passing vacuously.** They
were written against the old contract too, so any that assert only on the
transport (status, content-type, SSE framing) would pass whether or not the model
double produced anything. Check each one still means what its name claims once
the double is fixed.

## Acceptance criteria

1. All 8 tests in `test_UAT_FC_REQ-122_chat_host.test.ts` pass.
2. The scripted-client double is defined once and imported by both the Node and
   the workerd chat-host suites, not transcribed twice.
3. The three tests that pass today still pass, and each is confirmed to exercise
   a real model turn rather than the transport alone.

## Reproduce

```
npx vitest run tests/test_UAT_FC_REQ-122_chat_host.test.ts
```