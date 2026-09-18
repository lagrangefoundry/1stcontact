---
uid: bug-ef327f84
id: BUG-114
type: bug
title: 'repro console: two checks that cry wolf — the ready_* assertion and the empty
  rail'
created_by: EPIC-12
created_at: '2026-09-18T02:25:43.950444+00:00'
updated_at: '2026-09-18T03:47:59.933644+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: medium
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-dbce224c
  story_points: 3
  commits:
  - working_sha: 60bed8240199a251aec898468b139d51f285bf33
    reconcile_sha: null
    main_sha: null
  - working_sha: a691146586f86bccccb33c447a4efd99cbebdb30
    reconcile_sha: null
    main_sha: null
  version: 0.2.258
---

# Repro console: two checks that cry wolf — the `ready_*` assertion and the empty rail

Both of these report alarming words for non-events. An operator who learns to discount either one will discount the real thing when it arrives, which is the whole cost.

## Part 1 — the `ready_*` assertion reports the operator's own actions

`tools/repro-console/src/ticket.ts` compares a snapshot of every ticket at a dispatcher-trigger status before the round with one taken after, and reports anything new. The comment says what that buys and what it costs:

> "MEASURED BY DIFFERENCE, NOT BY AUTHORSHIP. The ticket store does not record which process moved a status, so this compares before with after... It also means an operator promoting a ticket in another window during a round shows up here — a false positive that costs one line of report and is strictly the safer way to be wrong."

That was the right call when it was written. It has now fired on BUG-100 (`created_by: REQ-261`, promoted to `ready_to_reconcile` by the operator during a round), reported as:

> "a ticket reached a dispatcher-trigger status during this round: BUG-100 (`bug-14025216`) is at `ready_to_reconcile`. The round files through the console at `draft` and must never set a `ready_*` status."

No round touched it. The report accuses the round of the operator's own action, in the language of a violation.

### What changed since the check was written

BUG-104 added `ROUND_CREATED_BY` and `filedByRound()` to this same file. The console can now tell a round-filed ticket from a human-filed one, which it could not when the difference-based check was chosen.

### Behaviour wanted

1. A ticket reaching a trigger status is reported as a **violation** only when it is attributable to the round — its `created_by` carries the round marker, or its uid appears among the tickets the round named in its own outcome.

2. Anything else that arrives at a trigger status during the round is either not reported, or reported as an **observation** in language that does not accuse the round. It must not read as a violation.

3. The hazard the check exists for is undiminished: a round filing at `ready_*`, or promoting a ticket it named, still reports as a violation. The check stays a report and never a prompt — the console runs unattended by design.

## Part 2 — the regression rail has never had a baseline

Every iteration on `gigabytealchemy.ai` recorded the same `rail.json`:

```
"pass": false,
"summary": "the regression rail — REGRESSED
REGRESSED · references: no baseline at storage/rail/baseline.json.
The rail cannot say \"no worse\" against nothing — record one with `repro-rail record`."

```

Three rounds have run with the safety rail inert while the page said **REGRESSED** each time. The message names the fix correctly, but the headline word is wrong: an unrecorded baseline is a setup step that was never done, not a regression that was detected.

### Behaviour wanted

1. A missing baseline reports as **not yet recorded** — a setup state with the command that fixes it — and never as `REGRESSED`. The word `REGRESSED` is reserved for a comparison that was actually made and came out worse.

2. The console surfaces the un-recorded rail prominently enough that it cannot run three rounds without the operator noticing, rather than folding it into a line that looks like an ordinary red result.

## Testable

- Promote a ticket to `ready_to_reconcile` by hand while a round is running: the round's report carries **no violation**.

- Have a round file at `ready_*`, or promote a ticket it named: the violation is still reported, in its current language.

- Run an iteration with no `storage/rail/baseline.json`: the rail reports "not recorded" and names the command, and the word `REGRESSED` does not appear.

- Record a baseline, break a serializer, re-run: `REGRESSED` appears and names the reference that moved.


---

## How this is being built (session notes, BUG-114)

### Part 1 — attribution replaces difference

`readyStatusViolations(before, after)` is replaced, not extended, by two
functions in `tools/repro-console/src/ticket.ts`:

- `readyStatusArrivals(before, after)` — the tickets that were not at a trigger
  status when the round started and are now. The difference is still how an
  arrival is *found*; it is no longer how it is *charged*.
- `readyStatusFindings(arrivals, attribution)` — splits those arrivals into
  `violations` and `observations`.

An arrival is attributable to the round, and so a **violation**, when either
holds:

1. its `created_by` passes `filedByRound()` — the marker BUG-104 added; or
2. its uid or its id appears among the tickets the round named in its own
   outcome (`ticketId`, `bugTickets`) — which is how a round PROMOTING a ticket
   it filed is caught.

The violation keeps its current sentence verbatim and gains a trailing clause
naming which of the two ties it to the round, so an operator reading it knows
why the round is being charged with it.

Everything else is an **observation**: one line, in language that states the
coincidence and says plainly that nothing ties it to the round. It renders on
the page beside the round in neutral styling, not in the red violations list,
and it does not contribute to the "See the violations under it" message.

Consequences of this design that the code states as deliberate:

- The console reads each arrival back with `xgd ticket get <uid> --json` to
  reach `created_by`, because `xgd ticket list --json` does not carry that
  field. The cost is bounded by the number of arrivals, which is zero in the
  ordinary round.
- An arrival the console **cannot read back** is not attributable, so it is an
  observation. Same principle as BUG-104's read-back: "the console could not
  look" must never render as "the round did this."
- A round that promotes a ticket it never filed and never names is
  indistinguishable from the operator doing the same thing, and is reported as
  an observation. That residual is accepted here: it is the cost of not
  accusing the operator of a violation, and the hazard the check exists for —
  a round filing at `ready_*`, or promoting what it filed — is still charged.

This supersedes REQ-262 requirement 11's difference-only reading; the REQ-262
UATs that pin the old behaviour are updated to the new one in the same commit.

### Part 2 — the wording, and the banner

BUG-109 already landed the half that matters most: `runRail` returns
`noBaseline`, and neither `summarise` nor `formatRailReport` says `REGRESSED`
when there is no bar. What this ticket adds:

- the phrase becomes **"not yet recorded"** rather than "not available", which
  is what the state is: a setup step nobody has done. BUG-109's assertions on
  the old phrase are updated with it.
- `RailRoundResult` carries `noBaseline` so the console can tell an unrecorded
  rail from every other reason a rail did not run.
- while the most recent iteration's rail has no baseline, the console page
  carries a **notice at the top** — above the iteration list, distinct from
  both the red failure line and the dimmed per-iteration rail line — saying the
  rail is checking nothing and naming `repro-rail record`. That is the answer
  to "three rounds ran without the operator noticing": it is no longer a line
  folded into an iteration, it is a standing banner on the console itself.


### Two details the tests also pin

- The ordinary round — nothing arrived at a trigger status — reports neither a
  violation nor an observation. Silence in the ordinary case is what makes
  either list worth reading when one appears.
- The notice is conditional, not decoration: a console with nothing to report
  renders no banner at all, and the banner tracks the **most recent** rail, so
  it goes as soon as a baseline is recorded.
- `repro-rail`'s own terminal report says `NOT YET RECORDED` too, rather than
  `NOT AVAILABLE`. One state of the checkout, one command that fixes it, and an
  operator who meets it in the console and at the terminal should not have to
  work out that they are the same thing. It still exits non-zero.