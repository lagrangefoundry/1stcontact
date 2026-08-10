---
uid: capability-44a04848
id: CAP-91
type: capability
title: 'Assistant Pane: The Conversation Beside The Page'
created_by: xgd
created_at: '2026-08-10T08:45:31.120965+00:00'
updated_at: '2026-08-10T08:45:31.120965+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: assistant_pane
---

# Capability: Assistant Pane — The Conversation Beside The Page

**The operator sees the conversation about their site next to the site itself: it is
always about the page on screen, it remembers what was said, it keeps what they were
half-way through typing, and it says out loud when it cannot run.**

The conversation host answers questions over a wire. This capability owns what an
operator actually experiences of it: a working conversational surface in the
workspace's secondary pane, which follows the site being displayed, replays that
site's history, holds an unsent message per conversation, and explains a failure in
the place the operator is already looking.

## Scope

- **A live surface, not a label** — the workspace's secondary pane presents a message
  list and a composer, with what the assistant did during a turn visible alongside
  what it said.
- **Following the displayed site** — the conversation shown is always the one about
  the site the display panel is showing. The site is chosen in one place in the
  workspace; the pane offers no second control that could disagree with it.
- **Replay** — the pane shows what the conversation remembers, on first open and on
  every switch, so the assistant never answers from context the operator cannot see.
- **Per-conversation composing state** — an unsent, half-typed message belongs to one
  conversation and survives leaving that site and coming back.
- **Visible failure** — an assistant that cannot run and an origin that cannot be
  reached are each explained in the pane, without costing the operator the history
  they already have.

## Out of scope

- **The conversation itself** — routes, session lifecycle, binding, persistence,
  priming and stream semantics belong to the AI site assistant capability. This one
  owns only what the browser shows of them.
- **What the assistant can reach** — the declared, granted and audited operations
  belong to the site control surface.
- **The split's geometry** — the divider, the rail collapse and drag-to-resize, and
  where workspace layout state is persisted, belong to the builder workspace
  capability. This one owns what fills the secondary pane, not the pane's frame.
