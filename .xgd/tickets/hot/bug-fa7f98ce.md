---
uid: bug-fa7f98ce
id: BUG-108
type: bug
title: 'repro console: the round prompt says both "you file the ticket yourself" and
  "you never file"'
created_by: repro-console:repro-gigabytealchemy-ai#1
created_at: '2026-09-17T23:30:26.217135+00:00'
updated_at: '2026-09-17T23:30:26.217135+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-ccd1ee37
---

The loop-1 round prompt tells the round both that it files its own ticket and
that it must never file one. A round that resolves the contradiction the wrong
way loses its entire output, because the hand-back channel the round-context
half describes does not exist in the format the standing brief specifies.

Found on loop-1 iteration 1 of `repro-gigabytealchemy-ai` (gap ticket REQ-269).

## The two passages, verbatim

**Standing brief §1** ("What you may and may not do"):

> **Your deliverable is a ticket you file yourself.** You run `xgd ticket
> create`. Nothing is handed to a console to file for you and nothing waits on a
> human.

and §6 gives the full command, including the `--created-by
'repro-console:<slug>#<iteration>'` flag and the reason it is not optional, and
§7 says "**You have already filed by this point.** The block reports what you
did".

**The round context appended beneath it** ("The ticket store"):

> **You still do not file.** You hand the ticket back and the console creates it
> at `status: draft`. Never create one yourself…

and again in "What you hand back":

> hand it back in `bugs`, to the same standard of evidence, and the console files
> each one separately at `draft`.

## Why it is not merely cosmetic

The §7 completion block is the only channel the round has, and it is explicitly
exclusive: *"The console reads that block and nothing else you wrote"*. Its
fields are `status`, `residualClass`, `ticketId`, `summary`, `bugTickets` —
there is **no field for a ticket body**. So a round that follows the
round-context half has nowhere to put the ticket it wrote, and its whole
diagnosis is discarded; and a `"filed"` block without a `ticketId` is, by §7's
own rule, "read as a failed round".

The two halves also disagree about `--created-by`, which §6 says is the one
place the round's authority is visible in the store: a console-filed ticket
would not carry it.

The same instruction survives in the session's knowledge base — DOC-53 §2 ("What
a round produces") still says bugs are "their own tickets, **filed by the
console**, at `status: draft`", and §3.3 ends "Writing stays the console's."

This round resolved it in favour of the standing brief (filed REQ-269, BUG-106,
BUG-107 and this ticket itself, all at `status: draft`, all carrying
`created_by: repro-console:repro-gigabytealchemy-ai#1`) on the ground that the
alternative discards the round's work with no way to recover it.

## Proposed fix

Pick one and make all three sources agree: the standing brief §1/§6/§7, the
round-context sections "The ticket store" and "What you hand back", and DOC-53
§2/§3.3. If the round files (as today's brief says), delete the "you still do
not file" paragraphs and correct DOC-53. If the console files, §7's block needs
a field to carry the ticket body and §6's `--created-by` instruction has to move
to the console.

## How to see it

Read the round prompt stored with the round:

```
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-1
grep -n "file yourself\|still do not file\|the console creates it\|console files each one" $ITER/ai/prompt.md
```

**Wrong result (now):** both instructions are present in one prompt.
**Right result (fixed):** only one of them is.