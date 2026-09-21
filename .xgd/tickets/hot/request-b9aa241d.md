---
uid: request-b9aa241d
id: REQ-294
type: request
title: copy-to-cloud carries the site but not the conversations that built it
created_by: EPIC-16
created_at: '2026-09-21T23:01:33.483748+00:00'
updated_at: '2026-09-21T23:18:38.656612+00:00'
completed_at: null
last_field_updated: status
status: free_coding
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


## The decisions, taken

Each of the five questions above, answered — and the answers are what the code does.

**`--chats` is refused from-cloud, in `--contacts`' voice and for `--contacts`'
reason.** A conversation with the consultant is unstructured text the customer
typed and can contain anything, and the local builder runs with
`ACCESS_DEV_OPEN=1` — reachable on loopback with no identity check. The refusal
is a sentence naming that, not an unknown-flag error, and it lands before any
credential is read: an operator sent to provision an Access token, who
provisions one and is then told the flag was never going to be carried, has been
sent on an errand.

**The change-feed cursor does not travel, and neither does the pending turn.**
`kb_cursor` names positions in one store's `ticket_changes` sequence; carried, it
names sequence numbers that mean something else in the destination or nothing at
all, and the destination's indexer then skips turns it never saw. `pending_turn`
([[BUG-121]]) is the same rule one layer up: it is what a turn was asked *while
that turn is still unaccounted for*, a claim about a host that was running — and
the destination was running nothing, so an `open` record carried there is a
statement that is simply false where it lands. Both are named in one exported
constant with the rule written beside it, and a UAT pins that they are absent
from the payload. Everything else about the chat ticket travels: the
`chat_transcript` comment, the ledger body ([[REQ-171]]), the standing
engagement note ([[REQ-283]]), the session id, and the rest of the upstream chat
fields.

**Comments travel wholesale rather than by a list of kinds.** The transcript is
one kind; a session that called a tool also has a `tool_transcript`. Carrying
every comment the chat ticket holds, matched by kind at the far end, means a
kind added upstream later travels without this code being touched — the
alternative is a list that goes stale silently and drops part of the record.

**Tenancy and uids are rewritten, never carried.** The destination resolves its
own business from the authorised scope exactly as `/api/import` does, and mints
its own ticket uids. The payload carries the source business's NAME, which names
where the conversations came from and addresses nothing — the same statement
`SitePayload.slug` makes.

**Re-copying merges by `session_id`: a conversation the destination already
holds is kept and counted, and `--force` replaces it.** A second copy therefore
duplicates no turn, which is the failure to avoid. It is deliberately NOT
`--site`'s 409: a site is one object, so "part of this is new" is not expressible
and refusing the whole import is the only honest answer; a conversation history
is many objects, and refusing the set because one member is already there would
block every later conversation from ever landing. Skipping is also the safe
default in the direction this runs — the deployed builder is where the client
actually talks, so its copy of a session may have continued past the local one,
and replacing by default would delete the client's own turns. `--force` is
already the word for "I know what is there and I mean it" ([[BUG-51]]), so it is
reused rather than joined by a second flag. Replacement is per-conversation and
whole: the ticket's fields and body are rewritten and each comment is matched by
kind and rewritten, never appended to — merging two divergent copies of one
session file is a conflict nobody asked this command to resolve.

**A conversation is scoped to the BUSINESS, not to the site.** A `chat` ticket
carries no site reference at all — it is found by `fields.session_id` and
tenant-scoped by the handle — so "the conversations belonging to this site" is
not expressible without inventing a link this product does not have. `--chats`
carries every conversation the business holds. Archived ones do not travel,
which needs no code: the store's reads are hardcoded to `archived: false`, and a
conversation the client deleted is one they deleted.

## What is built

**A second pair of routes, matched the way the first pair is.**
`GET /api/chats/export` and `POST /api/chats/import` on the control app, reading
and writing through the ticket store the Worker already serves from, for the
reason the site pair gives: under `wrangler dev` D1 is a miniflare SQLite file
whose layout is an implementation detail and Node has no contract for it. Both
halves are the same `ChatsPayload`, produced and consumed by two functions in one
new module (`apps/control-app/src/chat-copy.ts`), so the pair cannot drift —
`SitePayload` is left exactly as it is, and a `--site` copy carries no
conversation.

**`--chats` on `bin/copy-to-cloud`,** alongside `--site` and `--contacts`, as a
third `DataClass`. `--backup` works for it too — it is the same source-side read
landing in a file, and a special-case refusal would be more code than supporting
it. The command reports what landed: conversations created, conversations kept
because they were already there, and comments written.

**The end-to-end claim.** An operator who built a site locally runs
`bin/copy-to-cloud --chats "<business>"` and the deployed builder then holds
those conversations — transcripts, ledgers and standing notes intact, readable
by the consultant through the surface it already has ([[REQ-228]]) — and running
the command a second time adds nothing and duplicates nothing.