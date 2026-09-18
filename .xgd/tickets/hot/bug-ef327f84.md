---
uid: bug-ef327f84
id: BUG-114
type: bug
title: 'repro console: two checks that cry wolf — the ready_* assertion and the empty
  rail'
created_by: EPIC-12
created_at: '2026-09-18T02:25:43.950444+00:00'
updated_at: '2026-09-18T02:25:43.950444+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
---

# Repro console: two checks that cry wolf — the `ready_*` assertion and the empty rail

Both of these report alarming words for non-events. An operator who learns to
discount either one will discount the real thing when it arrives, which is the
whole cost.

## Part 1 — the `ready_*` assertion reports the operator's own actions

`tools/repro-console/src/ticket.ts` compares a snapshot of every ticket at a
dispatcher-trigger status before the round with one taken after, and reports
anything new. The comment says what that buys and what it costs:

> "MEASURED BY DIFFERENCE, NOT BY AUTHORSHIP. The ticket store does not record
> which process moved a status, so this compares before with after... It also
> means an operator promoting a ticket in another window during a round shows up
> here — a false positive that costs one line of report and is strictly the safer
> way to be wrong."

That was the right call when it was written. It has now fired on BUG-100
(`created_by: REQ-261`, promoted to `ready_to_reconcile` by the operator during a
round), reported as:

> "a ticket reached a dispatcher-trigger status during this round: BUG-100
> (`bug-14025216`) is at `ready_to_reconcile`. The round files through the
> console at `draft` and must never set a `ready_*` status."

No round touched it. The report accuses the round of the operator's own action,
in the language of a violation.

### What changed since the check was written

BUG-104 added `ROUND_CREATED_BY` and `filedByRound()` to this same file. The
console can now tell a round-filed ticket from a human-filed one, which it could
not when the difference-based check was chosen.

### Behaviour wanted

1. A ticket reaching a trigger status is reported as a **violation** only when it
   is attributable to the round — its `created_by` carries the round marker, or
   its uid appears among the tickets the round named in its own outcome.
2. Anything else that arrives at a trigger status during the round is either not
   reported, or reported as an **observation** in language that does not accuse
   the round. It must not read as a violation.
3. The hazard the check exists for is undiminished: a round filing at `ready_*`,
   or promoting a ticket it named, still reports as a violation. The check stays
   a report and never a prompt — the console runs unattended by design.

## Part 2 — the regression rail has never had a baseline

Every iteration on `gigabytealchemy.ai` recorded the same `rail.json`:

```
"pass": false,
"summary": "the regression rail — REGRESSED
REGRESSED · references: no baseline at storage/rail/baseline.json.
The rail cannot say \"no worse\" against nothing — record one with `repro-rail record`."
```

Three rounds have run with the safety rail inert while the page said
**REGRESSED** each time. The message names the fix correctly, but the headline
word is wrong: an unrecorded baseline is a setup step that was never done, not a
regression that was detected.

### Behaviour wanted

1. A missing baseline reports as **not yet recorded** — a setup state with the
   command that fixes it — and never as `REGRESSED`. The word `REGRESSED` is
   reserved for a comparison that was actually made and came out worse.
2. The console surfaces the un-recorded rail prominently enough that it cannot
   run three rounds without the operator noticing, rather than folding it into a
   line that looks like an ordinary red result.

## Testable

- Promote a ticket to `ready_to_reconcile` by hand while a round is running: the
  round's report carries **no violation**.
- Have a round file at `ready_*`, or promote a ticket it named: the violation is
  still reported, in its current language.
- Run an iteration with no `storage/rail/baseline.json`: the rail reports "not
  recorded" and names the command, and the word `REGRESSED` does not appear.
- Record a baseline, break a serializer, re-run: `REGRESSED` appears and names
  the reference that moved.
