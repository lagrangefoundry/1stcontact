---
uid: capability-7e4714b7
id: CAP-90
type: capability
title: 'AI Site Assistant: Per-Site Conversations'
created_by: xgd
created_at: '2026-08-10T08:34:05.264297+00:00'
updated_at: '2026-08-16T05:46:28.893985+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  name: ai_site_assistant
  uat_coverage: pass
---

# Capability: AI Site Assistant — Per-Site Conversations

**A continuing conversation about one site: the operator asks for changes in their
own words, the assistant makes them through the operations it has been granted,
and the conversation is still there tomorrow.**

Everything the platform can do to a site is reachable by typing a command or by
clicking a region of the page. This capability owns the third way in: describing
what you want. It is the conversation itself — where a site becomes a
conversation, what a turn is addressed to, what the assistant is told about
itself, where the transcript lives, and how a failure is reported — not what the
assistant is able to do once it is talking.

## Scope

- **The conversation host** — the origin that answers what the assistant is and
  whether it can run, turns a named site into a conversation, and runs one turn
  in an open conversation, streaming what the assistant said and did.
- **Binding** — a conversation belongs to exactly one site, established once when
  the conversation is opened. Nothing above the host names a site, and a turn
  names a conversation the host issued rather than a site or a free-form key.
- **Continuity** — one conversation per site, stored with the workspace the site
  belongs to, replayed after a restart, and never destroyed by the assistant
  being temporarily unable to run.
- **Priming** — what the assistant is told about who it is and what it can reach,
  assembled from the operations it was actually granted rather than restated by
  hand.
- **Honest failure** — a refusal the assistant can correct within the turn, a
  missing prerequisite explained to the operator without losing their history,
  and a failure after streaming has begun delivered inside the stream.

## Out of scope

- **What the assistant can reach** — the declaration, grant, validation and audit
  of the operations it calls belong to the site control surface.
- **The write path itself** — validation, atomicity and re-render are owned by the
  structured edit capability; the assistant is one more caller of it.
- **The operator-facing pane** — the browser surface that renders the conversation
  is a separate, independently observable capability.