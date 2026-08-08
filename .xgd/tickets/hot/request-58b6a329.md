---
uid: request-58b6a329
id: REQ-122
type: request
title: 'Builder chat panel: AI session, declared tool surface, per-site sessions'
created_by: xgd
created_at: '2026-08-07T23:28:11.086984+00:00'
updated_at: '2026-08-08T00:45:10.004595+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: bd57c7478abaffaa3d5d335d36f8a57027189731
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - b05dcdce4286ad396edfc456cc1d5a0977ae591b
  version: 0.1.27
---

# Builder chat panel — AI session, declared tool surface, per-site sessions

Replace the `builder-chat-placeholder` in the builder's split with a live chat
panel backed by a Claude API session whose tool surface is the site's existing
structured edit functions.

## Behaviour

**The panel.** The split's secondary pane hosts `@lagrangefoundry/webui-chat`
instead of the placeholder text. It streams assistant turns, renders markdown,
and shows tool activity in the collapsible tool pane. The existing rail-collapse
and drag-to-resize behaviour is unchanged.

**One session per site.** Selecting a different site in the toolbar swaps the
chat to that site's session. Each site's conversation is persisted and survives a
browser reload: on mount (and on every site switch) the panel is rehydrated from
the session's stored transcript, so what the AI remembers is what the operator
can see. A session is created lazily on the first message for a site, and is told
at creation which site it is bound to.

**The AI can only change the site through declared tools.** It cannot write HTML,
CSS, JavaScript, or framework source, because no tool accepts them — the
forbidden list is enforced by absence (DOC-8 §5.2). Every write goes through the
same `edit.ts` functions the CLI and the click-to-edit modal dispatch to, so
validation, atomicity and the re-render are unchanged and cannot be bypassed.

**Failures are reported, not swallowed.** A tool call that the validator refuses
returns its `CommandError` code, path and hint to the model as a string, and the
model corrects within the turn. A missing API key, an unreachable backend or a
dead session surfaces in the panel as a message rather than a silent no-op.

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

## Core declarations (this ticket)

Read: `describe_site`, `list_pages`, `describe_page`, `get_copy`, `list_assets`,
`get_config`. Write: `set_copy`, `add_page`, `update_page`, `remove_page`,
`set_config`, `publish`.

These are the surface that exists today. Expansion is expected and the
declaration format is built for it.

## Transport

Three routes on the builder origin (Node), mirroring the reference host contract
in `components/ai/py/showcase/ai_host.py`:

- `GET  /api/ai/roles`   — available roles and backends
- `POST /api/ai/session` — create or resume the session for a slug
- `POST /api/ai/prompt`  — SSE stream of `text` / `tool_activity` / `done`

The Node origin is where this lives for the same reason the render does: the
store, `publish` and the draft definitions are all bound to the operator's
machine. The `claude_api` backend is fetch-based (`@anthropic-ai/sdk`) and its
node built-ins are inside what `nodejs_compat` reaches, so the same backend and
the same tool loop move to workerd unchanged at DOC-12 §7 phase 2.

## Not in this ticket

- **Knowledge-base retrieval.** The priming path goes through the `ContextSource`
  seam so a KM-backed source drops in behind it, but no corpus exists yet — the
  system KB is a separate ticket. Until then priming is the role preamble plus
  the generated tool manual.
- **Structural L1 edits.** No tool sets an axis, adds a node or moves anything,
  because no such write path exists yet. The chat can change words, swap images,
  add and rename pages, set config and publish. "Make the hero darker" needs an
  L1 write tool, which is its own design.

## Requirements

`ANTHROPIC_API_KEY` must be present in the builder process environment. Absent,
the panel mounts and says so rather than failing opaquely.