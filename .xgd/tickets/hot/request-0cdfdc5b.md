---
uid: request-0cdfdc5b
id: REQ-146
type: request
title: The AI host moves into workerd
created_by: xgd
created_at: '2026-08-15T20:33:27.556016+00:00'
updated_at: '2026-08-31T14:22:38.684806+00:00'
completed_at: '2026-08-31T14:22:38.684806+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  story_points: 9
  auto_merge_back: true
  needs_review: true
  depends_on:
  - REQ-141
  - REQ-142
  - REQ-143
  - REQ-144
  - REQ-145
  - REQ-147
  commits:
  - working_sha: b37c95a60decbe971f2960396a30ec1a6878b5a2
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 2765de0ffc0c192fac87ba24ba476a7093563268
    - ed0fc92031854e747deb5013ad37a393cfa83182
  - working_sha: 1d10effc8449b8c81c2c8a36c3d8c5e4ae112ebb
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 2ee204b4e70f1b3080dcccbeac90c6ae7ff5d1a9
    - c5088a8e0635422746cdb535ca51e35b2176a3b8
  - working_sha: b8b01ebf26bcef0627c936c68fbc813b7c20240e
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - b60b52e8faaeedb6ba9792b0206bff3352189f9c
    - 07c6ba434fafdfcc9e7539db208a62c2c6a07dd4
  - working_sha: 0f7795003980bc25abe96ab164aea316df7061b0
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 5932f17ff2e03166f656606f96c4c3622319f3fe
    - 4586874257362760b94c58319c7409be43e1ecb6
  version: 0.1.61
  chat_comment: comment-419ac5a2
  bundled_in: bundle-b3b7c399
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


---

## What landed (2026-08-18)

Commit `2765de0ff` — `feat(control-app): the AI host runs in workerd [FREE-CODED]`, v0.1.58.

### The shape: core + two runtimes

The split mirrors upstream's own `archive.js` / `file_archive.js` shape rather
than inventing one.

| New | Role |
|---|---|
| `tools/generate/src/cli/ai/toolbox-core.ts` | The tool surface. Names no filesystem; library and store are required parameters. |
| `tools/generate/src/cli/ai/host-core.ts` | The host — session model, tool loop, per-turn change signal, the three entry points. Takes `HostDeps`. |
| `apps/control-app/src/ai.ts` | **workerd's** runtime for those deps. |
| `apps/control-app/src/redact.ts` | Secret scrubbing at the response boundary (AC4). |
| `bin/deploy.d/secrets/10-anthropic-api-key` | Pushes the key as a `wrangler secret`. |

`toolbox.ts` and `host.ts` remain the **Node** entry points and keep their
existing API exactly — the ~30 call sites and the `1c` CLI are untouched, as §4
required. `GlobalOptions` is imported from the leaf `cli/options.ts` rather than
`commands.ts`, because a type-only import of the latter pulled the Astro module
registry into the Worker's tsc program.

### Four adapters, each replacing a disk

| Node | workerd |
|---|---|
| `sharedModuleUrl('ai')` → dynamic `import()` of a file URL | the bundled `/workers` rung, statically imported |
| `FileArchive(dir)` | `R2TranscriptArchive` |
| file junction under the cwd | `memoryJunctions()` (REQ-103) |
| `fileAuditSink` (`appendFileSync`) | `bufferedAuditSink` + a per-turn `flushAudit` |

**The archive keeps the stored form byte for byte.** `Session.toFile()` /
`fromFile()` round-trip the language-neutral session file, so a conversation
archived by the Worker still loads in the Node host and in the Python peer. A
Cloudflare-shaped row format would have made the two runtimes stop being the
same product.

**The audit is one R2 object per record, not a folded `.jsonl`.** R2 has no
append; a read-modify-write would let two concurrent turns lose each other's
records, and an audit that drops entries under load is worse than none because
it reads as evidence. Distinct keys are append-only by construction.

**The flush is in a `finally`, inside the stream.** Inside, because a Worker may
be torn down the moment the response completes and `ctx.waitUntil` is not
reachable from the route; in a `finally`, because an abandoned or failed turn
must still record what it managed to do.

**Transcripts and audit sit outside `draft/`** — `chat/<tenant>/<session>.md`
and `audit/<tenant>/<session>/<n>.json`. `draft/` is the only prefix the site
store composes, and nothing in the router derives an R2 root from a request
(DOC-12 §7), so no URL can name a transcript.

### Two deviations from §4 worth stating

- **The store is required, not defaulted.** §4 proposed `createL1Toolbox` taking
  a store *defaulted* to the filesystem. In the core it is required, and the
  Node default lives in the `toolbox.ts` wrapper instead. A default reaching
  `fsSiteStore` from the core would have put `node:fs` back on the Worker's
  import graph — the exact thing AC6 forbids — so the default had to move up a
  layer. Call sites see no difference.
- **The chat host is one per isolate, not per request.** Every other route
  builds its store per request so the tenant check is never stale. The chat
  routes cannot: the `SessionManager` cache is keyed by the store's *object
  identity*, so a fresh store per request is a fresh conversation per request.
  The tenant is still checked once, when the host is built; what is given up is
  re-checking a mid-isolate deactivation, on these two routes only. Stated in
  `router.ts` rather than shared, because it is the wrong trade everywhere else.

### AC4 — redaction is a backstop at the boundary

Nothing formats a key into a response on purpose. The leak arrives from below:
an SDK that puts the request it tried to send into the error it throws. So the
scrub is applied at the last point before a string becomes a response body — the
router's outer `catch` and the SSE turn — and matches on the Worker's *known
secret values*, not on a pattern. A pattern is wrong in both directions: it
misses a credential in an unexpected shape and mangles prose that happens to
match.

## Evidence

**Verified here:**

- `tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts` — **11/11 pass**. Covers
  AC4 (redaction, incl. secrets containing regex metacharacters), AC5 and AC6 by
  walking the Worker's static import graph from `index.ts`. Per DOC-20's
  "who tests the harness", four cases prove the walker is *non-vacuous* — a
  deliberately-planted `node:fs` import and a planted filesystem-store import are
  each caught, so a walker that followed nothing would fail rather than pass.
- **The shipped bundle** (`wrangler deploy --dry-run`, 1.6 MB): AI library
  present (`memoryJunctions`, `applyRecords`, `ArchiveSyncer`, `SessionManager`,
  `fromFile`); `node:` specifiers are `events`, `path`, `process`, `stream` only;
  **zero** `pathToFileURL`, `require.resolve`, `sharedModuleUrl`, or dynamic URL
  import. The one `node:fs` string in the bundle is inside an upstream JSDoc
  comment, not an import. AC5 + AC6.
- **`1c assets`** emits the AI rung and resolves the component from a linked
  worktree; `1c preflight` fails loudly when it is absent.
- **The deploy hook** in all three branches: dry-run announces, `public-site`
  no-ops silently, and a missing key exits non-zero with a message naming the
  variable.
- **Typecheck clean** on both `tools/generate` and `apps/control-app`.
- **No regression in the AI test scope.** REQ-126 is at its pre-existing 7
  failures (two regressions found mid-work — REQ-126 7→8 and REQ-130 0→1 — were
  the same invariant, declaration↔implementation agreement now split across two
  modules; both tests were updated to compose the two halves and both are back to
  baseline). Every remaining failure in the scope is one of two pre-existing
  bucket: sync calls on upstream's now-async `run` (`.toMatch()` got an object,
  `answer.replace is not a function`), proved pre-existing by reproducing them
  with the *pre*-REQ-103 library on the base commit. (A second bucket, the
  sandbox's `listen EPERM`, was environmental and is gone — see below.)

**Verified after the sandbox was opened (2ee204b4e):**

The `listen EPERM` that blocked every workers test was a sandbox restriction, not
a defect. With socket binding permitted:

- **All 47 workers tests pass**, across all four files. That includes
  `tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts` — **9/9** — so
  **AC1, AC2, AC3 and AC7 are now demonstrated, not argued**. Each runs inside
  workerd through the Worker's own `fetch` against real D1 and R2, with the
  Anthropic client as the single double: a streaming double that speaks the raw
  `content_block_start`/`_delta`/`_stop` protocol the backend actually consumes,
  because a finished-message double would assert against a fiction.
- **All five packages typecheck** (`site-schema`, `framework`, `public-site`,
  `control-app`, `generate`).

**Three landed assertions had to be corrected**, because REQ-146 made them false.
Each still states its invariant; none was deleted:

- REQ-145's `deferred_capabilities_answer_501_naming_their_ticket` pinned
  `/api/ai/roles` at 501 naming lagrange-framework REQ-103. That deferral is
  gone. The invariant is about the *shape* of a deferral, not about any
  particular route staying deferred forever — so a route graduating is expected
  to leave the test. Publish (REQ-149) still holds it up.
- REQ-129's and the two reconciliation surfaces' declaration-vs-implementation
  checks compared the declaration against `l1Operations` alone. Since the
  core/wrapper split that is only half of Node's surface: `nodeOperations`
  supplies `add_asset` and `publish`, the two that need a disk. Comparing against
  the core alone asserts a *declared* operation is unimplemented — the opposite
  of the invariant. All three now compose both halves, matching the fix REQ-126's
  twin assertion already got in `2765de0ff`.

Measured, not assumed: on the three touched node files the correction takes
28 failed / 9 passed → 27 failed / 10 passed. Every remaining failure is the
pre-existing async-`run` bucket, each failing at a `box.run(...)` call *past* the
corrected assertion.

The router's header comment was updated to match: `/api/ai/*` is no longer
described as deferred, and publish is the one route that answers 501.