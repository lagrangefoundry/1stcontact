---
uid: bug-3d91a05e
id: BUG-138
type: bug
title: Turn times and day separators are dropped on the way to the panel, so only
  the live turn is stamped
created_by: EPIC-19
created_at: '2026-09-22T23:27:35.161946+00:00'
updated_at: '2026-09-23T02:39:26.827170+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-21e571fb
---

## What happens

Every turn in the chat pane is supposed to carry its time, under the scheme
`webui-chat` implements (REQ-96 upstream): a time on each turn, and a day
separator whenever a turn's local calendar day differs from the one before it.
The scheme works — but only for the turn that just happened. Scroll back and the
history is bare: no times, no day separators, on a conversation that spans days.

Reload, and the turn that WAS stamped loses its stamp too, because it is history
now.

## Why

The timestamp exists at every layer except the two that would show it.

- **Upstream carries it.** `transcript.js` parses `<!-- xgd-chat role="user"
  ts="…" -->` into `{role, ts, content}` and `manager.js` pushes `ts` onto every
  turn it folds (`session.turns.push({role, content, ts: closed.ts})`). The
  archived transcript comment in the ticket store has a `ts` on every single
  marker, going back to the first turn of the conversation.
- **`webui-chat` will render it.** `appendMessage(role, text, {ts})` calls
  `stampTurn`, which writes the time, records the day key, and emits a day
  separator when the day changes. Omit the third argument and it renders exactly
  as it did before stamps existed — no time, no separator, no error.
- **We drop it, twice.** `host-core.ts`'s `storedTranscript` maps upstream's
  turns to `ChatTurn` as `{role, markdown}` and discards `ts`; `ChatTurn` has no
  field for it. Then `chat.js`'s replay calls `chat.appendMessage(turn.role,
  turn.markdown)` with no third argument, so `stampTurn` never runs for a single
  historical turn.

The only stamped turn is the live one, which `webui-chat` stamps itself from its
own clock when the composer submits.

## Behaviour

- Every turn replayed from the transcript carries the time it happened, formatted
  by the same scheme a live turn uses — because it is the same call.
- Day separators appear throughout the history, wherever consecutive turns fall
  on different local calendar days, not only near the end. A separator is a
  statement about the turns below it, so it is emitted ABOVE the first turn of
  each day rather than merely somewhere in the thread.
- The time shown is the turn's own recorded moment, taken from the transcript,
  never the moment the page was loaded. A conversation reloaded tomorrow shows
  the same times it showed today. The moment is carried the whole way — never
  recomputed at read time, which would be the defect wearing the fix's clothes.
- A turn whose record carries no usable timestamp renders as it does now — no
  time, no separator — rather than showing a wrong one or failing the mount. It
  takes no part in day-boundary detection either, so the days that open are the
  days that are actually known, and the turn itself is still painted.
- The words handed back after an interrupted or unaccounted turn ([[BUG-121]],
  [[BUG-122]]) are stamped with the moment they were SENT, which the pending
  record and the sent-prompt entry each already keep, rather than with the moment
  they were painted back. These are the messages most likely to be days old by
  the time they are handed back, so they open the day they were sent on.
- A turn still IN FLIGHT when the page loads is dated the same way. It is the one
  turn the replay loop never appends — the transcript's last assistant turn is
  seeded into the resumed bubble instead, so the half already written and the
  half still coming are one message — and so it would otherwise be the only
  bubble in the thread dated by whenever the tail happened to drain. Worst for
  the turn most likely to need it: a reattach whose `turn_end` is already past
  the cursor drains at once, making "now" the reload rather than the reply.
  `webui-chat`'s `resume` already takes the turn's metadata for exactly this; the
  seed passes it.
- Notices in the panel's own voice ("that turn was interrupted…") are not turns
  and stay unstamped, as they always have been.

## Where it touches

- `tools/generate/src/cli/ai/host-core.ts` — `ChatTurn` gains the field, optional
  because a record may carry no moment; `storedTranscript` stops discarding it,
  omitting rather than emptying it so "absent" means one thing on the wire.
- `apps/control-app/src/builder/chat.js` — the replay passes it, as do
  `paintInterrupted`, `paintUnsent`, and the seed handed to `resume`. One helper
  decides once what "no moment" looks like, so the four call sites cannot each
  decide it differently.
