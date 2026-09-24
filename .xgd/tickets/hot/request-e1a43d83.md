---
uid: request-e1a43d83
id: REQ-309
type: request
title: Session transcripts must outgrow D1's 2 MB value ceiling without discarding
  a byte
created_by: EPIC-19
created_at: '2026-09-23T03:12:32.825619+00:00'
updated_at: '2026-09-24T23:32:48.574920+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
---



## What this is for

This Worker stores a session's transcript as a ticket-comment body in D1. D1's
documented maximum for a string, BLOB or row is **2,000,000 bytes**. The
consultant session for Lagrange Foundry reached **2,162,212 bytes of
`tool_transcript` for a single page**, over 85 turns, and from that moment every
archive write failed with `SQLITE_TOOBIG` — no prose folded, no turn recorded,
the session permanently dead. At roughly 25 KB of tool records per turn, any
session hits that ceiling at about 80 turns.

Beta sites are expected to be multiples of the size of the one that broke. On
today's code every beta tester hits this wall, most of them inside their first
site.

## The principle this is held to

**Nothing is thrown away.** A stored conversation is product knowledge, and the
earliest turns are often the most load-bearing — what was decided, what was
rejected and why. Eliding the oldest content to fit a row is not an acceptable
answer here. Whatever shape the storage takes, every byte a session wrote must
remain readable.

Note this is not a limit of the archive design: the file-backed archive has no
ceiling at all. It is a property of THIS host's storage substrate, which is what
this ticket is about.

## Behaviour

- A session's transcript and tool transcript grow without a practical ceiling.
  Reaching any single-value limit of the underlying store is not a thing a client
  can do by using the product.
- No stored content is discarded to make room. A session that has run for a
  thousand turns can still be read from its first turn.
- A reader — the panel replaying a conversation, the assistant addressing a turn
  by id — sees one continuous transcript regardless of how the bytes are stored
  underneath.
- The session that has ALREADY exceeded the ceiling is repaired rather than
  abandoned: its existing content is carried into whatever shape this adopts, and
  it takes turns again.
- A deployment whose store cannot accept a write says so in a way an operator can
  act on, rather than surfacing as a conversation that silently stops recording.

## Two shapes, and the order to take them

1. **Roll across comments — do this first.** Comments are tickets in their own
   right and a ticket can hold many, so a session gets `chat_transcript` 1, 2,
   3…; the archive appends to the newest and a reader concatenates. No new
   binding, no second store, every byte kept, and compare-and-set preserved per
   segment. Depends on lagrange-framework REQ-176 for the artifact shape and the
   `<!-- xgd-chat-end -->` sentinel question.
2. **R2 log segments — when rolling is outgrown.** One object per fold increment,
   with D1 keeping the manifest. Worth recording why this is viable now when the
   R2 archive it replaced was not: `ai.ts` states that the old one existed
   "because R2 has no append and the read-modify-write had to be written
   somewhere". A log segment is never rewritten — each fold PUTs a new object —
   so the objection that retired the R2 archive does not apply to this shape.

## Upstream dependencies

- **lagrange-framework REQ-176** — archived artifacts must segment; the format
  question about the transcript sentinel.
- **lagrange-framework BUG-66** — a failed tool-transcript write currently takes
  the prose transcript and the turn with it. That coupling is what turned this
  size limit into a dead session rather than a degraded one, and it is separately
  shippable.
- **lagrange-framework BUG-67** — seed assembly reads the whole tool transcript
  to answer whether one exists; the cost grows with the artifact under any
  storage shape.

## Immediate, separate from the above

The Lagrange Foundry session is dead now and holds three unchosen page variants.
It needs its oversized artifact brought under the ceiling so it takes turns
again, ahead of any of the work above.

## Where it touches

- `apps/control-app/src/ai.ts` — `sessionArchive`, the adapter over the ticket store.
- `apps/control-app/src/tickets.ts` — the D1 ticket store's comment handling, if
  many comments of one kind need addressing by order.

## A message too long to store is refused at the front door

Decided 2026-09-24. lagrange-framework REQ-176 left one question to this host:
what becomes of a single turn larger than the ceiling, which no segment can hold.
The answer is that a client never gets to make one.

There is no reason to put a long document in a chat message. The builder already
takes documents — the **Background information** drop area (*"Brand guidelines,
notes, reports. I'll use these to understand your business; they won't appear on
your site."*), and a drop into the conversation itself is one of its two entry
points. Material arriving that way is better off than pasted text in every
respect: it is described, it is labelled (`DOC-n`), it stays in the Library to be
reused, and it is indexed into the client's knowledge base so the consultant can
retrieve it in a later session. Pasted text lives in one transcript and nowhere
else.

- A message over the bound is **refused, and the client is told why in a sentence
  that names what to do instead** — to the effect of *"That's too long to send as
  a message. Save it as a text file and drop it in as Background information —
  I'll read it from there, and it stays in your Library."*
- The refusal is **not a truncation and not a failed turn.** Nothing is sent,
  nothing is archived, and the client's words are not lost: they are recoverable
  into the composer, which is what this pane's `remember` and the composer's
  recall already exist for.
- **The bound is 16,000 characters, and it is a product judgement rather than a
  storage guard.** Once REQ-176's segmenting lands the store's ceiling is no
  longer what sets this; the limit is the point past which a message has stopped
  being a message. Calibration, measured on real content in this repository — a
  pasted line averages about 50 characters across source, CSS, commented code and
  wrapped prose alike, and 500 lines of prose is 4,165 words:

  | paste | characters | words | pages |
  |---|---|---|---|
  | a normal message | 100-400 | 20-70 | - |
  | a long, careful message | ~1,000 | ~170 | 1/3 |
  | 50 lines - everything about a business, in paragraphs | ~2,500 | ~420 | 1 |
  | **16,000 limit — about 320 lines** | 16,000 | ~2,700 | **5** |
  | 500 lines | 20,000-27,000 | ~4,200 | 8 |
  | a brand-guidelines document | 30,000-90,000 | 5,000-15,000 | 10-30 |

  So a 500-line paste is refused, deliberately: eight pages is a document by any
  reading. The asymmetry decides the figure — a false refusal costs the client one
  drag-and-drop, while a false accept loses the knowledge-base entry permanently.
  Anything from 12,000 to 32,000 is defensible, so the figure lives in one named
  constant and is a one-line change.
- **The message states no number.** A figure in the sentence invites bargaining
  and counting; what the client needs is the gesture that works.
- **Two enforcement points.** The composer, so the client is told before anything
  is sent; and `POST /api/ai/prompt`, beside its existing `text is required`
  check, so a direct caller gets the same refusal and the same sentence. The
  route's answer is the contract; the composer's is the courtesy.

### The one non-obvious constraint

`webui-chat`'s composer **clears the box before the submit handler runs**, and
deliberately: *"the text has been accepted by the session the moment it is
submitted... leaving it in the box would invite sending it twice."* So a refusal
inside this host's `sendPrompt` arrives after the draft is gone and after the user
bubble and an empty assistant bubble have been painted. Two consequences:

- The refusal can be delivered as the assistant's reply for that turn, from a
  stub stream — but that stream **must end with a proper terminal event**. A
  stream that simply stops is what `onTurnLost` exists to detect, and it would
  chase a turn that never existed (BUG-123).
- `setInputMarkdown` is exposed, so the text can be put back in the box.

Refusing *before* the composer clears — the better shape, where the client sees
the sentence with their own text still in front of them and no bubbles are painted
at all — needs a declared maximum on `mountChat`. That is
**lagrange-framework REQ-177**, raised from here. Worth having; not worth waiting
for, so this ticket ships the in-repo shape and adopts the composer bound when it
arrives.
