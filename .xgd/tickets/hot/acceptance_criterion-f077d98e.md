---
uid: acceptance_criterion-f077d98e
id: AC-1794
type: acceptance_criterion
title: What a conversation has already been told about the corpus is recorded on that
  conversation's own ticket, not beside the index
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:53:02.877993+00:00'
updated_at: '2026-09-14T06:23:08.853713+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

What a conversation has already been told about the corpus it can search is
recorded **on that conversation** — a field on its own `chat` ticket — and not
beside the index as derived data.

The distinction is a lifetime, not a preference. An index's own bookmarks are a
property of an indexing pass and are rebuilt with the index; this one answers "what
has *this* conversation already been shown", so it is born with the conversation,
travels with it across every host that serves it, and dies with it. Being a field
on the conversation's own ticket is also what makes it survive everything held in
memory being dropped, with no separate lifecycle to keep in step: a reload, an
eviction and a redeployment all look the same from here.

It is one field holding one fact — a boundary in a change feed, together with the
entries that sat exactly on that boundary — rather than several fields, because a
store update that moved one without the others would leave the boundary meaning
something nobody wrote.

## Verification

Hold a conversation on the deployed runtime and read its `chat` ticket: the field
is present and non-empty after the conversation has been told anything, and it
carries both halves of the fact — the boundary and the entries on it. Discard
everything held in memory and re-open the conversation: the field is unchanged and
still on the same ticket. Open a second conversation for a different site: it has
its own field, and neither conversation's is affected by the other's.

What the field is *used for* — how a per-turn report is derived from it and how it
advances — belongs to the change-delta capability and is verified there; what is
verified here is that the conversation is where it lives.