---
uid: request-22a6521a
id: REQ-127
type: request
title: L1 tooling configuration over the control surface API (deletes declare.ts)
created_by: xgd
created_at: '2026-08-08T21:14:47.241627+00:00'
updated_at: '2026-08-10T11:00:53.848752+00:00'
completed_at: '2026-08-10T11:00:53.848752+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 7347d224eebcb00b56146763e55d946a3304c5cc
    reconcile_sha: null
    main_sha: null
  version: 0.1.32
  bundled_in: bundle-e59210c5
  chat_comment: comment-0891bc1f
---

# L1 tooling configuration over the control surface API

Replace the builder's hand-built AI tool surface with a **configuration** over the L1 control
surface API, dispatched through the framework tooling object.

Depends on the L1 API (DOC-30, `doc-aca10bce`) and on the framework tooling object
(`ticket://lagrangefoundry/lagrange-framework/DOC-20`, and its build request REQ-74 there).
Best sequenced after at least one framework refactor has landed, so the tooling object has been
proven against a second consumer rather than shaped by this one.

## Behaviour

The builder's AI reaches the site through operations selected from the declared L1 API, under a
declared policy, bound to an in-process call type — shelling out to reach a store the process
is already holding is not acceptable.

Configuration carries **selection, policy and binding only**. Descriptions, schemas, enums,
error meanings and declared absences project from the API. No prose is written in the config;
if any is needed, that is a finding against the API declaration, not a licence to write it here.

Existing guarantees are unchanged and must be demonstrably so: the AI still cannot write HTML,
CSS, JavaScript or framework source, because no operation accepts them; every write still goes
through the same validated path as the CLI and the modal; a refused call still returns its code,
path and hint so the model corrects within the turn.

Two things get **stronger**. The site binding, today a closed-over slug, becomes a declared
scope predicate the tooling object enforces. And the read/write split, today a `writes` flag
that nothing checks, becomes enforced classification.

## Removal

`tools/generate/src/cli/ai/declare.ts` is **deleted**. Its renderer half becomes the framework's
projection; its handler-binding half becomes configuration; nothing remains. Per no-legacy-modes
this is a removal, not a parallel path — there must not be a second way to declare a tool
surface in this project when the work lands.

`tools.ts` is reduced to declaration and configuration, with no hand-written `Tool` construction
and no hand-written manual.


## Scope correction (2026-08-09)

REQ-126 (commit `02a9af06`) delivered almost all of the above: the declaration as data
(`ai/l1-surface.json`), the binding (`ai/toolbox.ts`), the configuration (`ai/instances.json`),
enforced read/write classification, and the deletion of both `declare.ts` and `tools.ts`. Nothing
in the tree still references the old declaration machinery.

One clause was left: "the site binding becomes a declared scope predicate the tooling object
enforces". **That clause is withdrawn, and replaced by the work below.**

A scope predicate would give the model a `slug` parameter it must get right on every call —
re-opening an error class that today does not exist, because no operation declares a `slug` at
all. DOC-30 makes the same argument (its option 1 "trades a real safety property for a
declarative one"). The binding does not need declaring; it needs **locating**.

### Behaviour

The site binding lives in the **session**, established once when the session is created, and no
layer above the host names a site.

Neither dependency asked for a slug. `mountChat` takes an opaque `id` and `sendPrompt(text)`;
`SessionManager` takes a `sessionId`. Both are single-session by design. The slug was inserted by
this project in four places, on a rationale recorded twice — `host.ts` and `builder.ts:270`:
"carrying a session id over the wire would add a value the client could send stale". Avoiding a
stale id by giving the browser a **site identity** inverted the layering: every turn re-asserts
which site it is for, and `chat.js` carries a `generation` token whose only job is to stop a late
answer landing in a window that has since switched sites.

After this ticket:

- `createChatPanel` is handed a session and knows nothing else. No `setSite`, no `site`, no slug,
  no `openSession` call of its own — and no generation token, because it receives an already-open
  session synchronously instead of performing the async open.
- `POST /api/ai/prompt` takes `{sessionId, text}`. The host resolves that id against sessions it
  minted; an id it did not mint is refused rather than treated as a free-form key. A session id
  is exactly the kind of value that invites being trusted as one.
- `POST /api/ai/session {slug}` is unchanged, and is the ONLY place a site becomes a session. This
  is 1c triggering session creation: the toolbar owns the site selector, so `app.js` legitimately
  knows the slug, opens the session on a site change, and swaps it into the panel. The async guard
  moves there, where the async now is.
- `sessionIdFor` stops being a mapping three layers recompute and becomes the host's own.

Unchanged and demonstrably so: the model still cannot write HTML, CSS or JS; every write still
goes through `edit.ts`; refusals still carry code and hint; the audit still records every call.

Consequence worth stating: the panel's draft-persistence key moves from `builder-chat:<slug>` to
`builder-chat:<sessionId>`, so an unsent draft typed before the upgrade is not found after it.
Transcripts are server-side and unaffected.

### Not in scope

The upstream Toolbox finding stands as REQ-126 raised it: construction-scoped bindings are not
declarable in DOC-20's field set. This ticket makes that irrelevant here rather than fixing it
there.


### Folded in: the transcript-archive migration

Verifying the above surfaced a PRE-EXISTING breakage, confirmed at HEAD with this ticket's work
stashed: all 8 `test_UAT_FC_REQ-122_chat_host` UATs failed with `lib.FileStore is not a
constructor`. Upstream `@lagrangefoundry/ai` had replaced the whole-object session store with an
incremental transcript-archive port. It is a dependency migration rather than this ticket's
subject, but REQ-127's origin half is unverifiable without it, so it is deliberately carried here
(operator's call) rather than split out:

- `FileStore` → `FileArchive`; `manager.store` → `manager.archive`, with `load` / `list` async.
- `attach` uses `getSession` rather than `resume`. `resume` reconciles the junction and is no
  longer idempotent, so re-resuming an already-live session re-folds a record stream that has
  already been folded ("fold started mid-stream"). `getSession` resumes only when the session is
  not live.
- **`logDir` is now passed explicitly.** A session has two tiers — the junction is canonical while
  it runs, the archive is what it drains into — and `logDir` defaults to `~/.xgd/sessions/live`, a
  MACHINE path. Left alone, one conversation lives half in the workspace and half in the home
  directory, and two checkouts share a junction keyed only by slug. That is exactly what
  `sessionsDir` was written to prevent, so both tiers now sit under it.

Three REQ-122 host assertions were also stale against REQ-126 and are updated to the behaviour
REQ-126 intended: the refusal text (per-call `path` / `hint` no longer reach the model — the
Toolbox renders the declared class meaning, which REQ-126 raised upstream), and two manual /
tool-description literals that now project from the declaration rather than from a local renderer.

### Evidence

- `test_UAT_FC_REQ-127_session_binding` — 7 UATs, real HTTP against a real `startBuilder`.
- `test_UAT_FC_REQ-127_session_panel` — 7 UATs, real `webui-chat` in jsdom.
- `test_UAT_FC_REQ-122_chat_host` / `chat_panel` / `tool_surface`, `test_UAT_FC_REQ-126_l1_surface`
  — 44 passing across the six AI suites, up from 8 failing before this work.
- Full suite: 1307 passed. The 6 remaining failures (`req115-builder-composition`,
  `req117-edit-loop-browser`, `reconciliation-copy-edit-gesture`) are byte-identical at HEAD with
  this work stashed — pre-existing, in the edit-modal/browser area, untouched by this ticket.