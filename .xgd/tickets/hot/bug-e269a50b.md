---
uid: bug-e269a50b
id: BUG-140
type: bug
title: 'repro console / xgd: the round is told to append to an existing class ticket,
  and all five such tickets are frozen against appends'
created_by: repro-console:repro-gigabytealchemy-ai#5
created_at: '2026-09-23T02:35:21.574251+00:00'
updated_at: '2026-09-25T02:38:44.198593+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  defect_class:
  - harness
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-baa4f6c7
  commits:
  - working_sha: 2d37a5a4c2372550e14420862ab0054def3e7a0c
    reconcile_sha: null
    main_sha: null
  - working_sha: 821eaf66dd815bcfad0241bfe249900e2b1e492b
    reconcile_sha: null
    main_sha: null
  version: 0.2.353
---

Found by loop 1, iteration **5** of `repro-gigabytealchemy-ai`.

**Residual class:** `append-to-an-existing-class-ticket-is-refused-for-every-class-ticket`

**`defect_class: harness`** — this is the round's own process and the ticket CLI, not the
reproduction engine. Nothing about the reproduction changes if it is fixed; what changes
is whether a round's re-measurement reaches the ticket it belongs to.

## What the round is told to do

The console's prompt (`/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-5/ai/prompt.md`, "Classes that already have a ticket") says:

> If your diagnosis is one of these, **append to that ticket** and report
> `"status": "appended"` naming it. Do not file a second one.

…and lists five: REQ-265, REQ-269, REQ-270, REQ-271, REQ-302.

## What actually happens

```
$ xgd ticket append REQ-302 --file /tmp/req302-append.md
Error: ticket is in the reconcile pipeline (queued at ready_to_reconcile or beyond);
       body/title are frozen
  field: body
  condition: status in [ready_to_reconcile, bundled, reconciling, free_and_reconciled]
  ticket_type: request
  status: ready_to_reconcile
```

And this is not one unlucky ticket — it is **all five**:

```
$ for t in REQ-265 REQ-269 REQ-270 REQ-271 REQ-302; do
    printf "%s " $t; xgd ticket get $t | grep -m1 "^Status:"; done
REQ-265 Status: ready_to_reconcile
REQ-269 Status: ready_to_reconcile
REQ-270 Status: ready_to_reconcile
REQ-271 Status: ready_to_reconcile
REQ-302 Status: ready_to_reconcile
```

The freeze is correct and deliberate — a ticket being worked must not have its body move
under the implementer. The defect is that the instruction and the store disagree, and the
disagreement is total: **every** ticket the round is told it may have to append to is in a
state that refuses an append. A round that follows the instruction literally gets an
error; a round that files instead is told it filed a duplicate.

## The second half: the round marker cannot ride on the fallback

The working route is a comment, and `add-comment` has no `--created-by`:

```
$ xgd ticket add-comment REQ-302 --kind note --created-by 'repro-console:…#5' --body-file …
xgd: error: unrecognized arguments: --created-by repro-console:repro-gigabytealchemy-ai#5

$ xgd ticket add-comment REQ-302 --kind note \
    --fields '{"created_by":"repro-console:repro-gigabytealchemy-ai#5"}' --body-file …
Created comment: COMMENT-3671 (comment-25c71903)

$ xgd ticket get COMMENT-3671 --json | …
frontmatter.created_by              = xgd
frontmatter.fields.payload.created_by = repro-console:repro-gigabytealchemy-ai#5
```

So the marker the console reads back (`created_by`) says `xgd`, and the round's identity
survives only inside the comment payload and in the body text where the round wrote it by
hand. The prompt is explicit that a missing `--created-by` is a reported defect
("the console reads it back and reports the ticket that does not carry it"); on the append
path there is no way to supply one.

## Right

Any one of these closes it; the first is the cheapest:

1. **Say so in the brief.** Name the comment as the append route —
   `xgd ticket add-comment <id> --kind note --body-file <f>` — and say that a ticket at
   `ready_to_reconcile` or beyond cannot take a body append, so a comment is the append.
   Then `"status": "appended"` is achievable by construction.
2. **Give `add-comment` a `--created-by`,** written to the comment's own frontmatter, so a
   round's identity survives on the only route it is allowed to take.
3. Or let `append` write into a dedicated, unfrozen section of a pipeline ticket.

## What this round did

Appended the iteration-5 re-measurement of REQ-302's issues 2 and 4 as **COMMENT-3671**
on REQ-302, with the round marker in the payload and named in the comment's own first
line, and reported the gap ticket it did file ([[REQ-308]]) separately. Both facts are in
the round's closing block rather than one being silently dropped.


---

## Investigation, and the behaviour this ticket asks for

Both halves above reproduce unchanged. All five class tickets are still at
`ready_to_reconcile`; `xgd ticket add-comment` still has no `--created-by`
(`xgd_source/cli/ticket_commands.py`, the `add-comment` parser), while
`xgd ticket create` has carried one since BUG-1332. A `--fields
'{"created_by":…}'` lands in `fields.payload` because `comment_create` funnels
every unrecognised key there.

### The root cause is a permanence mismatch

`gap-tickets.json` is a **permanent** registry — `readGaps` returns every entry
ever recorded, and the prompt's "Classes that already have a ticket" block
renders all of them unconditionally as *append to that ticket, do not file a
second one*. The body it points at is **not** permanently writable. Only
`draft`, `free_coding`, `free_coded` and `failed` accept a body append; every
other status freezes `body`/`title`. So a class ticket is appendable for a short
window and unappendable **forever** afterwards, including after it is
successfully reconciled. "All five are frozen" is not bad luck, it is the steady
state every class ticket converges to.

A second consequence: a class whose ticket is already resolved still tells the
round not to file. A recurrence of a supposedly-fixed class — the most
interesting signal this loop can produce — currently has nowhere to go.

### And a successful append would still be reported as a violation

`confirm()` runs the identical read-back for `filed` and `appended`, against a
ticket that in the append case was filed by an **earlier** round and has since
moved on. Three checks then fire on a round that did exactly as it was told:

- the `status !== draft` check fires on all five, with the rider "a ready_*
  status is a dispatcher trigger", which the round neither caused nor can undo;
- the provenance check fires on REQ-265, whose `created_by` is the operator's
  address because the operator filed it;
- the defect-class check fires on REQ-265, REQ-269, REQ-270 and REQ-271, none of
  which carry the field — they predate it.

`filedByRound` was deliberately loosened for exactly this case and says so; the
status and class checks never got the same treatment. So naming the comment
route in the brief is **not sufficient on its own** — it makes `"status":
"appended"` mechanically reachable and the console then reports the round for
reaching it.

### Behaviour

**1. The brief names the comment as the append route.** §6 gains a subsection,
and §7's `appended` example matches it. It states the command —
`xgd ticket add-comment <id> --kind note --body-file <f>` — and states that a
ticket outside `draft`/`free_coding`/`free_coded`/`failed` refuses a body
append, so on such a ticket the comment **is** the append. Because `add-comment`
has no `--created-by`, the brief requires the round to write its
`repro-console:<slug>#<n>` marker as the comment's own first line, and says why:
that line is the only place the round's identity survives on this route.

**2. The prompt carries each class ticket's live status, and the route that
follows from it.** Before building the prompt the console reads each registry
ticket back and sorts it into one of three routes, which the prompt states per
class beside the id:

- **append** — the ticket is at `draft`, `free_coding`, `free_coded` or
  `failed`: the body is writable, so `xgd ticket append` is the route, and the
  round reports `"status": "appended"`.
- **comment** — the ticket is in flight (any `ready_*`, `in_progress`,
  `bundled`, `reconciling`, `merging_back`, `error`): the body is frozen, so the
  comment is the append, and the round still reports `"status": "appended"`.
- **new ticket** — the ticket is settled (`free_and_reconciled`, `merged`,
  `implemented`, `fixed`, `legacy_done`, `abandoned`, `wont_fix`, `deprecated`):
  this class was disposed of and the recurrence is news, not an append. The
  round files a **new** ticket that cites the old id in its body, and reports
  `"status": "filed"`.

A ticket the console cannot read back is shown as unknown and routed to
**comment** — the one route that is never refused, so an unreadable registry
entry costs a comment rather than the finding.

**3. `confirm()` charges the round only for what it is responsible for.** A
`filed` round is checked exactly as today. For an `appended` round the named
ticket is read back for **existence only**: its status, its `created_by` and its
`defect_class` are properties of an earlier round's ticket and are not
violations of this one. `bugTickets` are still checked in full on both paths,
because the round created those.

What an `appended` round **is** checked for is evidence that the append
happened: a comment on the named ticket whose body carries this round's
`repro-console:<slug>#<n>` marker. Absent, the console reports it, naming the
marker it looked for — so "appended" stops being an unverified claim and becomes
a read-back like every other.

**4. A deliberate re-file against a settled class is not a duplicate.** The
"one ticket per gap class" check reports a round that filed a second ticket for
a class that already had one. When the class's recorded ticket is at a settled
status, filing a second one is what behaviour 2 told the round to do, so it is
not reported. The registry succeeds the class to the new id and keeps the old
one in a `priorTicketIds` list, so the class's history stays readable and no id
is silently dropped.

### Out of scope, filed separately

`xgd ticket add-comment --created-by`, written to the comment's own frontmatter,
is a change to the `xgd` CLI and belongs in that repository. Behaviour 1's
first-line marker is the in-repo answer that does not depend on it.


---

## What landed

Commit `2d37a5a4c2372550e14420862ab0054def3e7a0c` on `free-BUG-140`, as `[FREE-CODED]`.

- **`tools/repro-console/src/append-route.ts`** (new) — the three routes and
  the status sets they are derived from, read off `xgd`'s own `immutable`
  rules rather than guessed, plus the round-marker helper.
- **`ai.ts`** — `KnownGap` carries the live status and the route; the
  "Classes that already have a ticket" block names all three routes, writes this
  round's marker out literally, and gives each class its own instruction.
- **`console.ts`** — `routeGaps()` reads every class ticket back before the
  prompt is built; `confirm()` runs the status/provenance/class checks only on
  a `filed` round's own ticket and on `bugTickets`, and charges an
  `appended` round with `appendEvidence()` instead; the duplicate-class check
  is suppressed when the predecessor is settled.
- **`gaps.ts`** — `priorTicketIds` and succession under `supersedes`.
- **`run.ts`** — `parseJsonArrayOutput`, because `xgd ticket comments
  --json` prints a bare array and the object parser silently could not read it.
- **the brief** — §6 gains "Appending to a class that already has a ticket";
  §7's `appended` example matches it.

24 UATs in `tests/test_UAT_FC_BUG-140_the_append_route.test.ts`, each making
both directions of its claim. `tests/test_UAT_FC_REQ-256_ai_iteration.test.ts`
gained a `ticket comments` branch in its stand-in `xgd` so its appended round
still models a well-behaved one.

The sibling-repo half is filed as **BUG-1448** in `xgd`: `add-comment` with a
`--created-by` written to the comment's own frontmatter. Nothing here depends
on it landing — the prose marker is the in-repo answer, and the console reads the
comment body for it.