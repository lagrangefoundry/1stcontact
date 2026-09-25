---
uid: request-e1a43d83
id: REQ-309
type: request
title: Session transcripts must outgrow D1's 2 MB value ceiling without discarding
  a byte
created_by: EPIC-19
created_at: '2026-09-23T03:12:32.825619+00:00'
updated_at: '2026-09-25T01:32:01.446933+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c2a75f89
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
  **16,000 confirmed by the operator 2026-09-24**, on the calibration above, as
  this project's judgement and not a value inherited from anywhere: REQ-177 names
  no default and no figure appears in the framework, so this constant is the only
  place the number exists. 12,000 to 32,000 was the defensible range considered;
  it is recorded as the reasoning, not as a range still open. One named constant,
  a one-line change if the beta says otherwise.
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


## What this host does about it

Decided 2026-09-24, on reading what lagrange-framework REQ-176 actually delivered.

**The segmenting is not built here, and that is the point.** REQ-176 makes an
archived artifact a SEQUENCE of bodies, and it makes the ceiling *the store's to
declare*: the archive reads `max_value_bytes` off the injected client and packs to
it. A store that declares nothing behaves exactly as it always did. So "roll
across comments" reduces, on this side, to this host stating the figure for its own
substrate — and the archive, the join, the packing and the position markers are
the framework's, reused rather than restated. No byte count and no marker format
appears in this repository twice.

- **The ceiling is declared by the ticket store, as one named constant.** It is
  below D1's documented 2,000,000 bytes rather than equal to it: that figure is
  documented as the maximum for a string, a BLOB *or a row*, and a comment row
  carries its uid, its fields and its timestamps beside the body. A body packed to
  the full documented limit would be a row over it. The headroom is named where the
  constant is, so the next reader is not left to infer why the two numbers differ.
- **Nothing is migrated, and no stored byte is rewritten.** REQ-176 writes no
  position marker at index 0, so every body already in this store is a conforming
  sequence of one, and an open segment already at or over the ceiling rolls rather
  than being grown. The session that has already exceeded the ceiling is therefore
  repaired by the declaration alone: its existing content stays where it is, is
  read back as the first segment of its sequence, and its next turn opens a second.
  A repair command would be a second way to reach the same state, with a window in
  which it had run against some sessions and not others.
- **A refused write is reported with what this host knows and the framework does
  not** — which substrate refused, what ceiling this deployment declared, and that
  the conversation's other artifacts were still written. The framework reports a
  failed artifact write to whatever channel the host wires and to the console when
  it wires none; an unwired report is honest but anonymous, and an operator reading
  it cannot tell a value ceiling from a quota from a transient error.
- **Copying a conversation carries each artifact as the sequence it now is.** A
  chat's comments are carried wholesale, but they were *landed* one per kind —
  first one wins — so a segmented transcript would have arrived at the destination
  with every segment but one discarded, silently and reported as a success. That is
  the same "nothing is thrown away" clause as the storage half, on the path that
  moves a conversation between deployments. A destination holding more segments of
  a kind than the source sends keeps none of the surplus: a re-copy must leave the
  destination holding the source's conversation, not the source's spliced onto the
  tail of an older one.

## What the composer bound cost, in the end

lagrange-framework REQ-177 landed before this work started, so the `mountChat`
maximum is adopted rather than worked around, and the in-repo stub-stream shape
described above was not built: **the pane already had it.** The chat transport
renders a refused request's `error` as the assistant's reply and follows it with a
terminal event, which is exactly what that section asked for and what keeps
`onTurnLost` from chasing a turn that never opened; and the pane already remembers
a submission before the request exists, so the client's words are already
recoverable. So the two enforcement points cost one check at the route and two
options at the mount, and no second refusal path exists to keep in step with the
first.

The bound is one constant, stated once on each side of the wire — the Worker's and
the browser's — because browser JavaScript here cannot import the Worker's
TypeScript. The two are held equal by a test rather than by an import, which is the
arrangement this repository already uses for every other value that has to cross
that boundary.


### Two clauses the implementation made explicit

- **The ceiling is declared once, for every business.** It is a property of D1, not of
  a tenant, so it is stated on the store's base handle and forwarded to every scoped
  store rather than passed per business. One business quietly not segmenting while
  another does would be the original failure with a smaller blast radius and no way to
  notice which accounts had it.
- **The alarm names the substrate and not the cause.** A failed artifact write reaches
  the host for any reason the store had — a value ceiling, a quota, a lost
  compare-and-set, a transient error — and the host knows which substrate it was, not
  which of those happened. So the report names the artifact, the segment, the size and
  the ceiling this deployment declared, and leaves the operator to tell the cases
  apart from those figures. Asserting a cause it cannot know would send them somewhere
  wrong with more confidence than the anonymous report it replaced.


### One guard had to be widened

`REQ-146`'s structural guard requires every `error:` value in `router.ts` built from a
variable to be the scrubbed one, which is right: the leak it defends against arrives
from below, as an SDK that puts the request it tried to send into the error it threw.
A named constant whose whole value is written in that file in quotes cannot carry a
secret, and the guard rejected one anyway — so the only ways past it were to inline
the refusal sentence at the call site, losing the single named constant that makes the
route and the composer say the same thing, or to wrap it in `scrub()`, which would be
a redaction pass over bytes the file authored and would teach the next reader that
`scrub` means something it does not.

The guard now admits any `const` whose initializer is string literals and `+` and
nothing else. It is a property and not an exemption list: a constant built from a
template with an interpolation in it, or from another value, is still rejected —
which is where a leak could actually hide.
