---
uid: request-70a8153f
id: REQ-279
type: request
title: A generated picture appears in the conversation, not only in the Library
created_by: EPIC-19
created_at: '2026-09-18T22:32:09.878454+00:00'
updated_at: '2026-09-18T22:32:09.878454+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

Parent: [[EPIC-19]]. Operator, 2026-09-18: *"right now I have to switch to the
Library to see the image we just created."*

## The behaviour

When the assistant makes a picture, **the picture appears in the conversation**,
where the client is already looking. Not a name, not a ticket id, not an
instruction to go and open another tab — the picture.

**This is the norm, not an option the assistant weighs each time** (operator
decision). A generated picture is shown unless there is a reason not to; the
assistant needs a reason to withhold it, never a reason to show it. The client
asked for a picture and is sitting in front of a conversation — putting it
anywhere else is asking them to go and find their own work.

Clicking it opens the image modal, exactly as clicking a picture in the Library
does, because it is the same picture.

## Almost all of this already exists

This is a wiring job, not a feature build. Four of the five pieces are built and
tested.

**The chat pane already renders pictures.** `mountChat` writes each turn's
markdown straight into a message element, so an `<img>` in the assistant's reply
reaches the DOM.

**The address is already a contract.** [[REQ-220]] built `materialFileUrl` /
`materialUidFromUrl` as a round-tripping pair in
`apps/control-app/src/builder/api.js:840` — `/api/material/file?uid=<uid>`,
business-scoped — precisely so the material can be read back out of an `<img
src>`.

**Clicking one already opens the modal.** Also REQ-220, through a listener
delegated at the pane's root, so it works for a turn replayed on reload as well
as for one that has just arrived. Its UAT is
`tests/test_UAT_FC_REQ-220_chat_picture_opens_the_same_modal.test.ts`.

**Upstream has a seam built for exactly this, and we pass nothing into it.**
`ImagegenToolbox` takes a `display` construction option: a function called with
the record the operation is about to return, answering one sentence about how to
put that picture in front of whoever is being talked to. Its own header says why
it is a sentence rather than a value:

> the shape of that line has no single framing — one host renders markdown, one
> needs a further call, one can only offer the ticket.

And the consequence of supplying it is the part that matters here:

> when it is supplied the declaration is **composed** to match: the shipped
> document carries a one-field `host_display` shape which is merged into
> `generated_image`, so a deployment that can show pictures reads a manual that
> says so and a deployment that cannot reads today's.

We supply no `display` anywhere in this repository. So `create_image` returns no
`display` field, and — this is the important half — **the manual the assistant
reads still says the id is the whole of what it can pass on.** It is not
declining to show the picture. It has been told it cannot.

## What is actually missing

One construction option: a `display` function that returns a sentence carrying
the markdown for `materialFileUrl(uid)`.

## Making it the norm rather than an option

Upstream's seam hands the assistant a sentence and leaves the choice to the
model, which is the right shape for a framework and one notch short of what this
ticket asks for. Two ways to close that gap:

1. **Phrase the sentence as the default, and back it in priming.** The display
   line says to include the picture in the reply, and `priming.json` gains the
   standing expectation that work the client can see is shown rather than
   described. One mechanism, no new concepts, and it composes with the existing
   `act-rather-than-narrate` reminder.
2. **Have the host place the picture in the transcript itself**, independent of
   what the model writes.

**Start with 1.** It is smaller, it keeps the transcript the model's own prose,
and it is reversible. But it is a behaviour we should then MEASURE rather than
assume: if the assistant still omits the picture in practice, escalate to 2,
where the guarantee is structural. Do not start at 2 — a host writing into the
conversation is a new kind of thing and should be earned by evidence that the
cheaper path does not hold.

## What this closes

[[BUG-118]] is the same seam seen from the other side: the assistant looked in
the site's assets, did not find its own generated picture, and told the client it
was blind. The `display` line fixes both faults at once — it tells the assistant
where the picture is AND how to show it. Whichever is implemented first should
name the other.

## Out of scope

Pictures the client uploaded. This is about pictures the assistant MAKES, which
is the case where the client has no reason to know a Library entry exists yet.
Whether an uploaded picture should also appear when referred to is a fair
question and a separate one.
