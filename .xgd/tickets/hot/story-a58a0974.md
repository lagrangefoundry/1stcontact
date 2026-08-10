---
uid: story-a58a0974
id: STORY-103
type: story
title: Hold one continuing conversation about my site with an assistant that can only
  act on that site
created_by: xgd
created_at: '2026-08-10T08:34:38.465488+00:00'
updated_at: '2026-08-10T08:34:38.465488+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-e59210c5
  capability_uid: capability-7e4714b7
  story_kind: feature
  story_points: 3
---

## Story

**As a** person who owns a site on this platform, **I want** to hold one
continuing conversation with an assistant about that one site — still there when
I come back tomorrow, able to change the site only through the operations it has
been granted, and honest with me when it cannot run — **so that** I can ask for
changes in my own words and be certain that what changes is my site and nothing
else.

## Description

This story owns the conversation itself: the place where a site becomes a
conversation, what a turn is addressed to, what the assistant is told about
itself, where the transcript lives, and how each kind of failure is reported.

In scope:

- **Asking what the assistant is** — the role on offer and whether it can run
  right now, answerable without opening a conversation at all, so a caller can
  say what is missing before it starts one.
- **Opening a conversation for a site** — the one and only point at which a site
  becomes a conversation. It answers with an identifier for that conversation,
  the turns already spoken, and whether a turn can be run (and why not). Opening
  the same site again is the same conversation, not a new one.
- **Running a turn** — addressed to a conversation, never to a site. What the
  assistant said and what it did are streamed as they happen, ending in exactly
  one completion.
- **Binding** — a conversation belongs to exactly one site, fixed when it is
  opened. Nothing above the host names a site; the assistant is offered no
  operation that takes one, so acting on the wrong site is not a mistake
  available to it.
- **Continuity** — one conversation per site, stored with the workspace the site
  belongs to, replayed after the origin restarts, and never sacrificed to report
  an unrelated failure.
- **Honest failure** — a refused operation the assistant corrects within the same
  turn with the site untouched; a missing prerequisite explained to the operator
  alongside their history rather than instead of it; a conversation identifier
  the host never issued refused outright before anything is streamed; a failure
  after streaming has begun delivered inside the stream so nothing is left
  hanging.

Out of scope:

- **What the assistant can reach.** The declaration, grant, parameter validation,
  error taxonomy and audit of the operations it calls are a separate capability
  (see plan item 6 of this bundle); this story only requires that the assistant
  reaches the site *through that surface and nothing else*.
- **The write path.** Validation, atomicity and re-render are unchanged and
  belong to the structured edit capability (CAP-87 / story-37a3921b); the
  assistant is a second producer of the same kind of change, not a second path.
- **The browser pane.** The surface that renders the conversation for the
  operator is its own story (plan item 5), for the same reason the display panel
  and the origin behind it are separate.
- **Knowledge-base retrieval.** The intent states priming is the role preamble
  plus the generated manual until a corpus exists; no retrieval is claimed here.

## Technical Context

- The conversation host sits on the builder workspace origin (CAP-85 /
  story-e674c60a), which owns the routes' shared behaviour — confinement,
  freshness, and the route-coverage guard that requires every declared route to
  be probed. This story adds three routes to that origin and inherits those
  properties rather than restating them.
- Every change the assistant makes goes through the same validated, atomic write
  path the command line and the click-to-edit modal use (CAP-87 /
  story-37a3921b). Nothing here re-implements validation, atomicity or re-render,
  and nothing here can bypass them.
- **Intent supersession within this bundle.** REQ-122 specified a turn carrying
  `{slug, text}` and a site identity held by the browser. REQ-127 withdrew that,
  and also withdrew its own earlier clause making the site binding a *declared
  scope predicate*, on the stated argument that a predicate would hand the model
  a site parameter it must get right on every call — re-opening an error class
  that does not currently exist. The binding was *located* in the session
  instead. The criteria below follow the later, amended intent.
- **Known divergence, recorded not absorbed.** REQ-122 stated a refused operation
  returns its code, path and hint to the assistant. Since REQ-126 the per-call
  path and hint no longer reach it — the tooling layer renders the declared
  meaning of the error class instead. The intent records this as a loss of
  specificity it did not choose and has raised upstream. AC coverage therefore
  asserts the property the intent is about (a named refusal the assistant can act
  on within the turn, site untouched) and does not claim the per-call address is
  delivered.
- REQ-127 deliberately carried an upstream transcript-storage migration
  (incremental archive; the live tier placed explicitly). Its observable
  consequence is that both tiers of a conversation sit under the workspace
  directory rather than half of it under a machine-global home path — which is
  what the continuity criterion is written against.
- Transcripts are operator-local and frequently contain verbatim business detail;
  they are stored with the workspace and excluded from version control.

## Dependencies

None within this bundle's plan. Related work that must not be re-derived here:
plan item 6 (the declared control surface the assistant acts through) and plan
item 5 (the operator-facing pane), which depends on this story.

## Story Points

3
