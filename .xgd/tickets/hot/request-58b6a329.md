---
uid: request-58b6a329
id: REQ-122
type: request
title: 'Builder chat panel: AI session, declared tool surface, per-site sessions'
created_by: xgd
created_at: '2026-08-07T23:28:11.086984+00:00'
updated_at: '2026-08-10T11:00:56.948121+00:00'
completed_at: '2026-08-10T11:00:56.948121+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 9abdc0f8a9fec2e033988ab2978734873fb99585
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - b05dcdce4286ad396edfc456cc1d5a0977ae591b
    - bd57c7478abaffaa3d5d335d36f8a57027189731
  - working_sha: 7f447ee55321b626021cbd2a5018c974fea6d0f0
    reconcile_sha: null
    main_sha: null
  version: 0.1.29
  story_points: 8
  bundled_in: bundle-e59210c5
  chat_comment: comment-3a4e4f6f
---

# Builder chat panel — AI session, declared tool surface, per-site sessions

Replace the `builder-chat-placeholder` in the builder's split with a live chat
panel backed by a Claude API session whose tool surface is the site's existing
structured edit functions.

## Behaviour

**The panel.** The split's secondary pane hosts `webui-chat` instead of the
placeholder text. It streams assistant turns, renders markdown, and shows tool
activity in the collapsible tool pane. The existing rail-collapse and
drag-to-resize behaviour is unchanged.

**One session per site.** Selecting a different site in the toolbar swaps the
chat to that site's session. The pane follows the display panel's site and has
no selector of its own to disagree with the toolbar's. Each site's conversation
is persisted and survives a browser reload: on mount, and on every site switch,
the panel is rehydrated from the session's stored transcript, so what the AI
remembers is what the operator can see.

A switch is a **remount, not a clear** — a fresh `mountChat` keyed
`builder-chat:<slug>`. That is not a workaround for the missing clear: it also
keys the composer's draft per site, so a half-typed message survives a trip to
another site and back.

**The AI can only change the site through declared tools.** It cannot write HTML,
CSS, JavaScript, or framework source, because no tool accepts them — the
forbidden list is enforced by absence (DOC-8 §5.2). No filesystem tool is offered
either. Every write goes through the same `edit.ts` functions the CLI and the
click-to-edit modal dispatch to, so validation, atomicity and the re-render are
unchanged and cannot be bypassed.

**Failures are reported, not swallowed.** A tool call the validator refuses
returns its `CommandError` code, path and hint to the model as a string, and the
model corrects within the turn. A missing API key, an unreachable origin, or a
model failure mid-turn surfaces in the panel as a message rather than a silent
no-op — and never at the cost of the stored conversation, which is read before
the backend is touched and returned alongside the reason it is frozen.

## The tool declaration

Tools are declared once, as data, in this project. Two renderings, both local:

- **`Tool[]`** for `FilesystemTools(policy, extraTools)` — the wire schema plus a
  model-facing description **composed** from the declaration rather than authored
  beside it. Enums are written once, in the schema, and rendered into the prose,
  so the restatement DOC-8 §5.3 requires cannot drift from the schema it restates.
- **Markdown** for the priming document — the surface described as a surface:
  what exists, what sequences work, what the errors mean, and a declared
  `absent:` list naming what deliberately has no tool and what to say instead.

The framework supplies the seams and none of the content: `Tool.description` is
an opaque string, `extraTools` is the registration seam, and `ContextSource` is
duck-typed, so the generated manual is a `ContextSource` implementation here
returning strings in memory. No upstream change is required for any of this.

### Core declarations

Read: `describe_site`, `list_pages`, `describe_page`, `get_copy`, `list_assets`,
`get_config`. Write: `set_copy`, `add_page`, `update_page`, `remove_page`,
`set_config`, `publish`.

These are the surface that exists today. Expansion is expected and the
declaration format is built for it.

## Priming: three layers, one hand-written

1. **The system preamble** (`ai/roles.ts`) — who the assistant is and how it
   works. It deliberately does not enumerate the tools: a hand-written inventory
   is the text that is still describing last month's surface six weeks later.
2. **The tool manual** — generated from the declarations, supplied through the
   `ContextSource` seam. The system KB, when it lands, arrives through this same
   seam without any of this changing shape.
3. **The reminder** — re-applied every turn through the backend's system channel,
   never written to the transcript. It carries only what decays over a long
   conversation: which site this is, no framework vocabulary, act rather than
   narrate.

## Site binding is structural

Three things are bound to a site, and none of them is a value the model could get
wrong:

- the **tools** close over the slug, so no tool can name another site;
- the **backend** is registered under `claude+site:<slug>`, because the registry
  is global and a backend instance carries its tool set — the shape the reference
  host uses for its `+fs` variant;
- the **session id** is derived (`site-<slug>`), so a reload resumes with no index
  to keep in step and nothing to lose.

## Transport

Three routes on the builder origin (Node), mirroring the reference host contract
in `components/ai/py/showcase/ai_host.py`:

- `GET  /api/ai/roles`   — the role and whether the assistant can run
- `POST /api/ai/session` — `{slug}` → the stored transcript, `ready`, and why not
- `POST /api/ai/prompt`  — `{slug, text}` → SSE of `text` / `tool_activity` / `done`

`/api/ai/prompt` takes the **slug, not a session id**. The id is derivable, so
carrying one over the wire would only add a value the client could send stale —
it would have to sequence "open, then send" correctly across every site switch
and get it wrong exactly once. Naming the site makes a turn self-sufficient.

A failure mid-turn is delivered **in** the stream: the headers are long gone by
the time a model call can fail, and a stream that simply stops leaves the panel
spinning forever.

The Node origin is where this lives because the *tools* are — every one bottoms
out in `edit.ts` over the operator's store. The `claude` backend is fetch-based
and its node built-ins are inside what `nodejs_compat` reaches, so the backend and
the tool loop move to workerd unchanged with the store at DOC-12 §7 phase 2.

The AI library is resolved through `sharedModuleUrl` (`webui.ts`), the same single
resolution point the components use — a bare specifier would find the shared store
from the main checkout and nothing from a linked worktree.

## Storage

Transcripts live at `storage/chat/<session>.md`, beside the store they are about
rather than in the library's machine-global default. Gitignored: operator-local,
and often verbatim business detail.

## Evidence

`tests/test_UAT_FC_REQ-122_chat_host.test.ts` — real HTTP against a real
`startBuilder`: real session manager, real role assembly, real tool loop, real
`edit.ts` writes, real SSE. One double, the Anthropic client, injected at the
`client` seam the library's backend is written to have injected. Covers: a turn
that calls a tool changes the draft and streams what it did; a refused call comes
back correctable within the turn and leaves the draft byte-identical; the
conversation persists and replays after a host restart; two sites are two
conversations over two tool surfaces; the model is primed with the generated
manual, bound to this site, offered no filesystem tool and no `slug` parameter; a
missing API key is explained without losing the conversation; a mid-turn failure
arrives in the stream.

`tests/test_UAT_FC_REQ-122_chat_panel.test.ts` — the installed `webui-chat`
mounted in the real builder composition, transport injected (jsdom cannot serve
HTTP, and the routes are proven above). Covers: the secondary is a live panel
bound to the shown site; switching site switches conversation and replays the new
site's transcript; a turn is sent for the site on screen; an unavailable assistant
and an unreachable origin are both explained in the panel.

## Adjacent changes

- `WEBUI_PACKAGES` gains `webui-chat` and its `webui-markdown` peer, so both reach
  the browser import map and stylesheet links.
- REQ-115's AC-4 UAT and story-e674c60a's AC-973 asserted on
  `.builder-chat-placeholder`. Both criteria are about the split's two halves, not
  what fills the second; the selector is updated to the live pane. This is REQ-122
  implicitly superseding the placeholder those criteria incidentally named.
- A route-coverage guard (AC-977) requires every route the origin declares to have
  a probe; the three new routes are probed in the shapes that need no model.
- Two pre-existing violations of the one-scope-literal guard (AC-960) are cleared:
  prose in `ai/declare.ts` (this ticket's own earlier commit) and a comment in
  `req121-copy-modal-elegance.test.ts`. Comment-only, no behaviour.

## Not in this ticket

- **Knowledge-base retrieval.** The priming path goes through the `ContextSource`
  seam so a KM-backed source drops in behind it, but no corpus exists yet — the
  system KB is a separate ticket. Until then priming is the role preamble plus
  the generated tool manual.
- **Structural L1 edits.** No tool sets an axis, adds a node or moves anything,
  because no such write path exists yet. The chat can change words, swap images,
  add and rename pages, set config and publish. "Make the hero darker" needs an
  L1 write tool, which is its own design. The declared `absent:` list says so, so
  the assistant answers cleanly instead of flailing.

## Requirements

`ANTHROPIC_API_KEY` must be present in the builder process environment. Absent,
the panel mounts, shows the site's history, and says exactly what is missing.