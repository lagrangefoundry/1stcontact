---
uid: request-b9aa241d
id: REQ-294
type: request
title: copy-to-cloud carries the site but not the conversations that built it
created_by: EPIC-16
created_at: '2026-09-21T23:01:33.483748+00:00'
updated_at: '2026-09-21T23:01:33.483748+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  epic_parent: epic-96d8aca6
  chat_comment: comment-d3920f75
---

The local builder holds conversation history that production does not, and there is no
way to move it. Found during the first production go-live (EPIC-16 §I): the Lagrange
Foundry site is at version 210 locally, built over many consultant conversations, and
`bin/copy-to-cloud` carried the site to production with none of them. The operator's
judgement is that the history is critical — the reasoning behind a long-lived site's
decisions lives in those conversations, and a consultant that cannot see it will
re-litigate settled choices.

## What exists today

`bin/copy-to-cloud` and `bin/copy-from-cloud` move one class, `--site`, as two HTTP
calls: `GET /api/export` at the source and `POST /api/import` at the destination.
`router.ts:2553` states the payload obligation plainly — export followed by import
yields a draft identical to the original, *"same `site.json`, same page documents, same
asset bytes under the same names — because both halves are the same `SitePayload`,
produced and consumed by the same two functions in `push.ts`."*

Conversations are not in that payload and are not anywhere near it. Since [[REQ-160]]
the transcript is a ticket, not an R2 object: a `chat` ticket found or created by
`fields.session_id`, the whole session file in one `chat_transcript` comment, the
ticket body left alone because it is the AI-maintained summary's home ([[REQ-171]]).
Three further fields sit on that ticket — the session's change-feed cursor
([[REQ-160]]), its unaccounted-for turn ([[BUG-121]]), and the standing note it keeps
about its own engagement ([[REQ-283]]).

`--contacts` is a recognised flag on both scripts: refused outright from-cloud, and
reported as not implemented to-cloud. So the shape for adding a class already exists,
including the convention that a known flag fails with a sentence rather than as an
unknown-argument error.

## What this asks for

A third class — `--chats` — on `bin/copy-to-cloud`, carrying a business's conversation
history from the local builder to the deployed one, so an operator who has authored a
site locally can take its reasoning with it.

It should work the way `--site` works and for the same reason: the Worker reads through
the store it serves from, and the Worker writes through the store it serves to, because
under `wrangler dev` D1 and R2 are miniflare implementation details that Node has no
contract for. That means a matched export/import pair for this class, not a script that
opens a SQLite file.

**A second pair of routes rather than a bigger `SitePayload`.** The existing pair's
identity is that it is one payload with one producer and one consumer, and
`router.ts:2566` names keeping them in step as a maintenance obligation. Folding
conversations into it makes every future change to either half a change to both, and
makes a site copy carry data the operator did not ask for. A separate pair keeps
`--site` exactly as it is.

## What must be decided, and why each is not obvious

**The direction is not symmetric, and the refusal should be written before the feature.**
`bin/copy-from-cloud` refuses `--contacts` because the local builder runs with
`ACCESS_DEV_OPEN=1` — reachable on loopback with no identity check — so pulling a
customer's records onto a developer machine is not a smaller version of copying a site.
A conversation with the consultant is at least as sensitive: it is unstructured, the
customer typed it, and it can contain anything. **`--chats` should be refused
from-cloud on the same reasoning and in the same voice**, and that refusal should land
in this ticket rather than being left for whoever builds the reverse direction.

**The change-feed cursor should not travel, and the ticket should say so.** It answers
"what has this session already been told about" against a specific store's
`ticket_changes` sequence. Carried to another store it names sequence numbers that mean
something else there, or nothing. The transcript, the summary body, and the standing
engagement note are properties of the CONVERSATION and travel; the cursor is a property
of an index pass against one feed and does not. Getting this wrong is silent — the
import succeeds and the destination's indexer skips turns it never saw.

**Tenancy is rewritten, not carried.** `tickets.tenant_id` names the source business
and the destination resolves its own from the authorised scope, exactly as
`/api/import` already resolves a site's. Ticket uids likewise: a uid that collides with
something already in the destination store is a different failure from a conversation
that is genuinely already there.

**Re-copying must have a defined answer.** `--site` refuses a destination carrying
builder-authored changes and names the count, and `--force` is how the operator
overrides it. Conversations are append-only in a way a draft is not, so "overwrite" may
be the wrong verb entirely — merging by `session_id`, skipping sessions already
present, or refusing when the destination has conversations of its own are all
defensible and they are not the same. Pick one and say why; the failure to avoid is a
second copy silently duplicating every turn.

**Whether a conversation is scoped to a business or to a site.** The chat ticket is
found by `fields.session_id` and tickets are tenant-scoped, so "this business's
conversations" is well defined. Whether the operator wants all of them, or only those
belonging to the site being copied, is a question this ticket does not answer and the
implementation must.

## Done looks like

An operator who has built a site locally can run `bin/copy-to-cloud --chats
"<business>"` and find, in the deployed builder, the conversations that produced it —
with the consultant able to read back the record it keeps ([[REQ-281]]), the summaries
intact, and no turn duplicated by running the command twice. `bin/copy-from-cloud
--chats` refuses, in a sentence that says why.