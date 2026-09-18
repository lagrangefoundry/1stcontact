---
uid: bug-fa7f98ce
id: BUG-108
type: bug
title: 'repro console: the round prompt says both "you file the ticket yourself" and
  "you never file"'
created_by: repro-console:repro-gigabytealchemy-ai#1
created_at: '2026-09-17T23:30:26.217135+00:00'
updated_at: '2026-09-18T00:51:22.479607+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-ccd1ee37
  commits:
  - working_sha: 5662ab68dd3ebfccbc050f8680328728c39f7abf
    reconcile_sha: null
    main_sha: null
  version: 0.2.248
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


---

## Decision: the round files. The console reads back.

Resolved in favour of the standing brief, on three grounds — the first of which
is decisive on its own:

1. **It is what the code already does.** `tools/repro-console/src/ticket.ts`'s
   header records the change outright: *"IT NO LONGER CREATES ANY … `fileTicket`,
   `appendGapEvidence` and `parseTicketRef` went with that change: a relay with
   nothing on the far end is worse than no relay, because it looks like it is
   doing something."* `console.ts`'s `confirm` reads every reported id back and
   records the status it really carries. There is no filing path left in the
   console to route a hand-back into.
2. **The console could not file even if told to.** §7's block is the round's only
   channel and carries `status`, `residualClass`, `ticketId`, `summary`,
   `bugTickets` — ids, not bodies. A hand-back has nowhere to put the ticket.
3. **`--created-by` only works from the round.** `wrongProvenance` in
   `console.ts` reports any ticket whose `created_by` does not start with
   `repro-console:`; a console-filed ticket would carry the console's identity,
   which is the check's own failure case.

So the stale half is deleted, in all three sources.

## Scope of the fix

**`tools/repro-console/src/ai.ts` — the round context appended beneath the brief**

- *The ticket store*: the "**You still do not file**" paragraph is replaced by
  one that says the round files, at `status: draft`, never at `ready_*`. The
  `ready_*` warning is the load-bearing half of that paragraph and is kept
  verbatim in substance — it is the one mistake that spends money unattended.
- The paragraph also now states **this round's literal `--created-by` value**
  (`repro-console:<slug>#<n>`, interpolated), rather than leaving the round to
  assemble it from the slug and iteration stated elsewhere in the context. This
  is a technical consequence of choosing "the round files": `wrongProvenance`
  checks a string the round types by hand, and a value handed over whole cannot
  be mis-assembled. The brief §6 keeps the general form and the reason.
- *What you hand back* → *What you produce*: bugs are tickets the round files
  itself and **names** in `bugTickets`, not bodies it hands over. The heading
  changes because "hand back" is the framing that carried the error.
- The module header's two stale claims — line 6's "the console files the
  ticket" and the "THE DELIVERABLE IS STILL THE TICKET'S CONTENT, and the
  console is still what files it" paragraph — are corrected to match
  `ticket.ts` and `console.ts`.

**`tests/test_UAT_FC_REQ-262_session_priming.test.ts`**

`test_UAT_FC_REQ_262_the_prompt_sends_the_round_to_xgd_and_warns_off_ready_statuses`
asserts `/You still do not file/i`. That assertion is what kept the contradiction
alive — it pinned the wrong half. It is replaced by an assertion of the corrected
instruction, keeping every other assertion in that test untouched.

**New UAT — `tests/test_UAT_FC_BUG-108_round_files_its_own_ticket.test.ts`**

Asserts against the one string the round actually reads (brief + round context,
as `buildPrompt` joins them):

- the prompt tells the round to file, exactly once and in one direction;
- no hand-back instruction survives anywhere in it — the phrases that made the
  two halves contradict are absent;
- the `ready_*` warning survives the edit;
- the literal `--created-by` value for the round is present in the prompt.

**DOC-53 §2 and §3.3** — the knowledge base the round is handed carries the same
stale instruction, so a round that reads the KB meets the contradiction again
from the other side. Corrected in the same cycle. (Doc-ticket change; no code.)

## How to know it is fixed

```
cd /Users/martin/lagrangefoundry/1stcontact
npm test -- tests/test_UAT_FC_BUG-108_round_files_its_own_ticket.test.ts \
            tests/test_UAT_FC_REQ-262_session_priming.test.ts
```

**Wrong result (before):** the prompt contains both "Your deliverable is a ticket
you file yourself" and "You still do not file".
**Right result (after):** only the first, and `bugTickets` is described as a list
of ids the round filed.


## Two further stale assertions found while implementing

**`tools/repro-console/brief/DIAGNOSE-THE-GAP.md` §6** told the round to *take
`<slug>` and `<iteration>` from "This round" below* and assemble the
`--created-by` value itself. Now that the round context writes the literal value
out, §6 points at it and says to copy rather than assemble. The general form and
the reason for the flag stay where they were.

**`tests/test_UAT_FC_REQ-261_loop1_rounds.test.ts`** —
`test_UAT_FC_REQ_261_the_brief_asks_for_one_unbounded_ticket_and_for_bugs`
asserted the prompt contains `` `bugs` ``. That string existed in exactly one
place: the round context's "hand it back in `bugs`" — naming a field the closing
block has never had (it is `bugTickets`, and it holds ids). The assertion is
corrected to `` `bugTickets` ``, which is both the real field and the thing the
test meant to pin.

The new UAT also carries one guard assertion — that the prompt really contains
the brief file on disk — so the suite cannot quietly start asserting against a
default that has drifted from the reviewed document.