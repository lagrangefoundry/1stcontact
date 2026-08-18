---
uid: request-0cdfdc5b
id: REQ-146
type: request
title: The AI host moves into workerd
created_by: xgd
created_at: '2026-08-15T20:33:27.556016+00:00'
updated_at: '2026-08-18T03:21:15.082454+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  story_points: 8
  auto_merge_back: true
  needs_review: true
  depends_on:
  - REQ-141
  - REQ-142
  - REQ-143
  - REQ-144
  - REQ-145
  - REQ-147
---

# The AI host moves into workerd

> **Unblocked 2026-08-17.** lagrange-framework REQ-103 landed (`5c82f6251`, v0.0.162,
> `ready_to_reconcile`) and the component has been re-installed into the shared store. All three
> structural blockers below are gone; §2 is kept as the record of what was waited on and why.

The last thing binding the builder to a Node process, once [[REQ-145]] has moved the routes.

**Scope narrowed (2026-08-17).** This ticket was "the AI host **and `publish`**". Publish is
now [[REQ-149]]'s, and only the AI host is left here. See "Publish is not here" below.

## 1. The AI host is closer than it looks

`tools/generate/src/cli/ai/host.ts` says so itself: the Claude backend is **fetch-based** and its
node built-ins are inside what `nodejs_compat` reaches, so *the backend and the tool loop are not
what pin it to Node*. What pins it is that **every tool bottoms out in `edit.ts`**, which reads
and writes the operator's store. [[REQ-142]] and [[REQ-143]] remove exactly that.

What is genuinely left here:

- `fileAuditSink` uses `appendFileSync` — the audit trail needs a store.
- Session persistence: a session id is derived from the slug so a reload resumes the site's
  conversation. Where that transcript lives in a Worker is undecided; [[DOC-10]] is the relevant
  design and should be reconciled with whatever [[REQ-143]] built rather than inventing a third
  store.
- `ANTHROPIC_API_KEY` becomes a `wrangler secret`, wired into [[REQ-144]]'s secret hook. REQ-144
  ships the mechanism and names no key, so this dependency points this way and not back.
  `bin/deploy` already carries the pointer: *"bin/deploy.d/secrets/ — REQ-146 lands the API key
  here"*.
- `l1-surface.json` and `instances.json` are read from disk and must ship as bundled data.

The structural properties should survive untouched: the surface stays declared as data, a slug
becomes a session in exactly one place, and no operation takes a `slug` parameter.

## 2. What blocked this, and how REQ-103 removed it

The four items above are real but secondary — each is a small change once the host can load at
all. Three structural blockers sat underneath them, and all three were lagrange-framework
REQ-103's to remove. **All three are now cleared** — re-verified against the refreshed package:

1. **~~The library is loaded by file URL at runtime.~~ CLEARED — but only for the Worker.**
   `host.ts` reaches it through
   `sharedModuleUrl('ai')` (`tools/generate/src/cli/webui.ts:172`), which does `require.resolve`
   → `pathToFileURL` → a dynamic `import()` of that URL. workerd has no filesystem and no
   dynamic import of an arbitrary URL. REQ-103 adds a fourth `exports` rung —
   **`@lagrangefoundry/ai/workers`** — that a bundler can follow statically.

   Note this does **not** delete `sharedModuleUrl`. It closes a real hazard on the *Node* path:
   a bare specifier resolves the shared store by walking up from the importing file, which finds
   it from the main checkout and finds nothing from a linked `git worktree`. So the library
   becomes an **injected dependency** — the Worker host passes the statically imported
   `/workers` rung, the Node host passes what `sharedModuleUrl` resolves — which is the same
   two-transport shape [[REQ-145]] used for `RouterDeps`, not a mode flag.

2. **~~`@lagrangefoundry/ai/core` is not workerd-safe.~~ CLEARED.** `session_log.js` now holds
   zero filesystem calls and nothing reachable from `/core` imports `node:fs`, `node:os` or
   `node:child_process`. REQ-103 drew the junction's storage as a port at the **byte** layer
   (`JunctionStorage`) rather than around `SessionLog`, so record framing, `seq`, timestamping,
   the torn-trailing-line rule and the byte cursor stay single-implementation — adapters express
   only "append these bytes", "read from this offset", "replace atomically", and so cannot encode
   a divergence from the Python peer. Two adapters ship: file and memory. [[DOC-21]] §15 records
   the reversal of its "Not a port" decision.

   REQ-103 also found the failure this ticket would otherwise have shipped: under `nodejs_compat`
   `node:fs` **resolves** in workerd and gives a per-isolate ephemeral filesystem, so a
   file-backed junction *passes a test in workerd* and loses every session in production. A
   successful import is not evidence; the guard is a static import-graph check.

3. **~~The package is not a dependency of this repo.~~ CLEARED, with a caveat that stays.**
   It is installed out-of-repo at the workspace root (`node_modules/@lagrangefoundry/ai`) by
   lagrange-framework's deliberate install, and `webui.ts` states it is *never vendored*. That
   flat store is a normal ancestor `node_modules`, so a bundler resolves the bare specifier
   without a `package.json` entry. The caveat is `bin/install`'s own stated cost — the dependency
   stays **implicit**, so a fresh clone on another machine gets nothing with no diagnostic
   pointing at `bin/install`. The build must fail loudly rather than emit a Worker whose chat
   route is silently absent.

**Why we waited rather than worked around.** The tempting shortcut was to port the session
junction here, against D1. REQ-103 rejects that in its own words: it would be a **third**
implementation, after `components/ai/py` and `components/ai/js`, and one that would drift from
both. The session model belongs in the library that owns it — and the packaging REQ-103 shipped
is a re-export list over the same code the Node barrel runs, with one shared UAT running a turn
against both junction adapters, which is what makes "a packaging, not a third implementation" a
checked claim rather than an intention.

[[REQ-145]] landed `/api/ai/*` as a deliberate 501 naming this blocker
(`apps/control-app/src/router.ts`) — *"the route exists, the capability does not yet"* — so
nothing was silently broken while this waited. This ticket replaces that 501 with the handler.

## 3. Publish is not here

`cmdPublish` was §2 of this ticket. It is now [[REQ-149]], *"Publish in the cloud: revisions,
history and rendered output without a filesystem"*, and [[REQ-145]] already landed
`/api/publish` as a 501 pointing there.

That split is right and should not be undone. Publish is not a relocation: the `SiteStore` port
has no notion of a revision at all — no history, no `nextRevisionId`, no snapshot, no
store-level diff — so it is a new storage contract with four unsettled design questions, which
REQ-149 poses and this ticket never did. The `sandbox` constraint ([[DOC-12]] §7) and the
forward-only `live` advance travel with it.

## 4. What this ticket does

The Node coupling that is left is not in the library any more — it is in this repo's two AI
files, and each piece is a seam that already half exists.

| Where | Today | After |
|---|---|---|
| `host.ts` `ai()` | `import(sharedModuleUrl('ai'))` | injected library; Worker passes `/workers` |
| `toolbox.ts` `aiCore()` | `import(sharedModuleUrl('ai','./core'))` | same injection |
| `toolbox.ts` L1 surface | `readFileSync(l1-surface.json)` | static JSON import, bundled as data |
| `toolbox.ts` instances | `readFileSync(instances.json)` | static JSON import, bundled as data |
| `toolbox.ts` store | `fsSiteStore(ctxOf(opts))`, hardcoded | injected `SiteStore` |
| `toolbox.ts` `fileAuditSink` | `appendFileSync` | buffered sink + durable flush |
| `host.ts` archive | `FileArchive(sessionsDir(opts))` | store-backed `TranscriptArchive` |
| `host.ts` junction | `logDir` under the workspace | `memoryJunctions()` (REQ-103) |
| `host.ts` baseline | `draftCounter(ctxOf(opts), slug)` — sync, fs | `store.counter(slug)` — async, ported |
| API key | `process.env.ANTHROPIC_API_KEY` | `env.ANTHROPIC_API_KEY`, a `wrangler secret` |

**The store is injected, not detected.** `createL1Toolbox` names `fsSiteStore` at line 505 today;
that becomes a parameter defaulted to the filesystem, so the ~30 existing call sites and the `1c`
CLI are unchanged while the Worker passes the D1/R2 store. Same shape as `RouterDeps` — one
implementation, two hosts, no mode flag.

**The transcript reconciles with [[REQ-143]] rather than adding a store.** REQ-103 offers
`TicketSessionArchive` over a `TicketClient`, which would mean standing up ticketing's D1 schema
alongside the site store. This ticket instead implements the same `TranscriptArchive` port
(`apply` / `load` / `list`) over the bindings REQ-143 already built — which is what §1 asked for:
*reconciled with whatever REQ-143 built rather than inventing a third store*. The junction in
front of it is `memoryJunctions()`, and `ArchiveSyncer` drains one into the other during the
turn, so an eviction costs the turn in flight and not the conversation.

**The audit sink buffers and flushes.** Upstream's `emit` is deliberately sync and swallows sink
failures, so an `await` cannot be introduced there. The Worker's sink appends to a per-turn
buffer and the route flushes it durably before the response completes. AC3 is about survival, so
the test kills the isolate and reads the audit back.

**Two capabilities stay refused, by name.** The `publish` operation on the surface reaches
`cmdPublish`, which is filesystem-bound and is [[REQ-149]]'s; it is not in the `caretaker` grant
today and must not arrive with this change. The system KB (`openKnowledgeRuntime`) is
filesystem-bound too, and degrades to `null` — an assistant that knows its tools but not the
design corpus, which is the documented degradation, not a failure.

## 5. Acceptance criteria

1. A chat turn runs end to end in workerd, with the API key read from a secret, and its edits
   land in the store [[REQ-143]] built.
2. Reloading the builder resumes the site's conversation.
3. Every AI write is audited durably; the audit survives a Worker restart.
4. No API key appears in logs, error envelopes, or client responses.
5. The AI library is bundled at build time — no `require.resolve`, no `pathToFileURL`, no
   runtime dynamic import remains on the Worker path, and the build fails loudly if the
   component is absent rather than shipping a Worker with no chat.
6. No filesystem-backed junction or archive can reach the Worker path. `node:fs` resolves under
   `nodejs_compat` and silently loses sessions, so this is asserted over the import graph rather
   than by a passing turn.
7. The `publish` operation is not reachable from the assistant in the Worker — it is
   [[REQ-149]]'s and is filesystem-bound.

Criteria 4 and 5 of the original list — the publish revision and the unreachable `sandbox` key —
moved to [[REQ-149]] with §2.

## Origin

[[CHAT-25]]. After this, nothing in the authoring loop needs the operator's machine.
