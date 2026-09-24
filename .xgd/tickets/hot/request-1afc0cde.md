---
uid: request-1afc0cde
id: REQ-317
type: request
title: The composer must refuse an over-long submission before it clears the box
created_by: EPIC-19
created_at: '2026-09-24T23:31:41.289581+00:00'
updated_at: '2026-09-24T23:31:41.289581+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
---

## What happens

`webui-chat`'s composer accepts a submission of any size. There is no maximum
anywhere in the component — not on the textarea, not in `submitWith`, not in
`send`.

A host that needs a bound therefore cannot enforce it where it belongs.
`submitWith` clears the box BEFORE the handler runs, deliberately and correctly:
*"the text has been accepted by the session the moment it is submitted, queued or
interjected, so leaving it in the box would invite sending it twice."* So by the
time a host's `sendPrompt` sees the text, the draft is gone, the reader's own
bubble is painted, and an empty assistant bubble is open.

The host's only available refusal is to answer that turn with an error reply and
push the text back in with `setInputMarkdown` — a refusal dressed as a turn,
painted as an exchange that never happened, from a stub stream that must remember
to emit a terminal event or `onTurnLost` will chase a turn which never existed.

What the reader is owed instead is the sentence, with their own text still in
front of them, and nothing painted.

## Behaviour

- `mountChat` takes an optional maximum submission length. Absent, behaviour is
  exactly as today: no bound, nothing to configure, no existing host affected.
- A submission over the maximum is **refused before the box is cleared**. The
  text stays where the reader typed it; no user bubble is appended, no turn
  opens, and `onSubmit`, `sendPrompt`, `onQueue` and `onInterject` are not
  called.
- **The sentence is the host's, not this component's.** It cannot know why a host
  has a bound or what the reader should do instead — upload a document, split the
  message, use a different surface — so the message is supplied alongside the
  figure.
- The refusal is visible where the reader is looking: beside the composer, not as
  a message in the transcript, because nothing was submitted.
- It applies to all three submit intents. Queue and interject carry text into the
  same session and the same store, and a bound that only the plain path honours
  is not a bound.

## The part that needs designing rather than deciding

**Characters or UTF-8 bytes.** A store's ceiling is bytes; a composer's
affordance — a counter, a warning as the reader approaches the limit — is natural
in characters. A host with a byte ceiling that declares a character maximum has a
bound that is exact for ASCII and loose by up to 4x for other scripts. For a
product bound set two orders of magnitude below a store's ceiling that does not
matter; for a bound set to fit a store exactly it would. Worth choosing
deliberately and saying which in the option's name.

**Whether to warn before refusing.** Refusing several thousand words a reader has
just written, with no prior signal, is the harsher shape; a live indication past
some fraction of the maximum is the kinder one. Not required by the host raising
this, and separable.

## Raised from

1stcontact EPIC-19 / REQ-309. That host is adding exactly this bound — a client
pasting a long document into the conversation is refused and told to upload it
instead, which is also the answer to the open question REQ-176 left to the host:
no single turn can then exceed a store's value ceiling. It will ship the in-repo
shape described above, because it can, and would rather not.

## Where it touches

- `src/input.js` — `submitWith`, which is the one place all three intents pass
  through, and `clear()`'s position within it.
- `src/index.js` — the `mountChat` option, and its documentation alongside
  `onSubmit`.
