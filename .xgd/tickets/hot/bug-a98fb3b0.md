---
uid: bug-a98fb3b0
id: BUG-38
type: bug
title: 'Builder chat: every turn fails in the cloud with "conversation is no longer
  open"'
created_by: xgd
created_at: '2026-08-24T22:12:54.350656+00:00'
updated_at: '2026-08-26T17:36:27.313051+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-dd005f45
  severity: high
  commits:
  - working_sha: 63df97c93542321a3d57d21e2e31a763ed3e4411
    reconcile_sha: null
    main_sha: null
  version: 0.2.14
  story_points: 2
  bundled_in: bundle-78f4e2fe
---

## Symptom

On the cloud deploy of the builder, every chat turn answers with:

> _That conversation is no longer open — reload the builder to start it again._

Reloading and retrying produces the same message. The chat is completely
unusable in workerd; it works locally under `1c builder`.

## Root cause

`tools/generate/src/cli/ai/host-core.ts` resolves a session id back to its slug
through `minted` — a **module-level in-memory `Map`** populated by `openSession`
and read by `streamPrompt`:

```ts
const minted = new Map<string, string>()          // sessionId -> slug
...
minted.set(mintedKey(sessionId, deps), slug)      // openSession
const slug = minted.get(mintedKey(sessionId, deps))
if (!slug) throw new UnknownSessionError(sessionId)   // streamPrompt
```

`/api/ai/session` (which mints) and `/api/ai/prompt` (which resolves) are **two
separate HTTP requests**. In workerd they are not guaranteed to land on the same
isolate, and on a fresh deploy with cold traffic they routinely do not. The
prompt request reaches an isolate whose `minted` map is empty, `streamPrompt`
throws `UnknownSessionError`, and `router.ts` renders it as the message above.

Everything else in the host was already built for isolate churn — the transcript
archive is R2-backed (`R2TranscriptArchive`) and `attach` resumes from it when
the in-memory junction has nothing. `minted` is the one piece of per-isolate
state whose loss is fatal rather than recoverable, and it holds no information
that isn't derivable: `sessionIdFor(slug)` is literally `` `site-${slug}` ``.

The registry existed as an *authority* check — "the host answers only for ids it
issued" — so an arbitrary client string could not become a free-form key into the
session store.

## Fix

Delete `minted` / `mintedKey` and resolve the session id durably instead:
strip the `site-` prefix and confirm the resulting slug is a site **this
tenant's store actually holds**, via `SiteStore.hasDraft(slug)`.

That preserves the authority property (and strengthens it — the check is now
tenant-scoped against real storage rather than against whatever a given isolate
happens to remember) while making resolution independent of which isolate serves
the turn. Per the no-legacy-modes rule the in-memory map is removed outright, not
kept as a fast path.

## Test plan

`tests/test_UAT_FC_BUG-38_chat_session_survives_isolate_churn.workers.test.ts` —
runs inside workerd against real D1 + R2:

1. Open a session, drop **all** per-isolate caches (`resetAiHost` +
   `resetChatHost` — this is the new-isolate case), then POST `/api/ai/prompt`
   with the id the client is still holding. The turn must run.
2. A session id naming a site that does not exist must still be refused with the
   "no longer open" message, so the authority check is not merely deleted.

Regression scope: `tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts`,
`tests/test_UAT_FC_REQ-122_chat_host.test.ts`.