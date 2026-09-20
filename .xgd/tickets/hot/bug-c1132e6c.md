---
uid: bug-c1132e6c
id: BUG-104
type: bug
title: 'repro console: a round''s gap ticket is attributed to the operator, not the
  loop'
created_by: EPIC-12
created_at: '2026-09-17T21:42:17.916425+00:00'
updated_at: '2026-09-20T18:41:21.259025+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-fe086f81
  commits:
  - working_sha: b96e9a8ece28e5ca63ea5a195a2d284d1306db75
    reconcile_sha: null
    main_sha: null
  - working_sha: bab60193ce702e9920b388708e3c04d77fcbf33e
    reconcile_sha: null
    main_sha: null
  version: 0.2.239
  story_points: 3
---

## Symptom

[[REQ-265]] was filed by a loop-1 diagnosing round — an autonomous subprocess
spawned by the reproduction console, with no human in the loop — and its
provenance reads:

```
created_by: martin-github@westhead.me
```

The ticket is attributed to the operator. Every ticket any round files carries
the same attribution, so nothing in the ticket store distinguishes work the
operator wrote from work an unattended loop wrote.

That matters beyond tidiness. The console's whole design ([[REQ-256]],
[[REQ-262]]) is about keeping the round's authority visible and bounded — the
`ready_*` assertion, the working-tree diff, the read-back in `confirm`. A
ticket that claims the operator wrote it is the one place that boundary is
invisible, and it is invisible in the direction that matters: an unreviewed
machine diagnosis wearing a human's name.

## Root cause

`tools/repro-console/brief/DIAGNOSE-THE-GAP.md` §6 tells the round to run:

```
xgd ticket create --type request --title '...' --fields '{"status":"draft"}' --body-file <file>
```

No `--created-by`. With the flag absent, `xgd`'s
`resolve_cli_created_by()` auto-detects in this order: `--created-by` →
`XGD_CHAT_TICKET_ID` (set only by an interactive chat session's own turn) →
`git config user.email`. A round has no chat ticket, so it falls through to the
git identity of the checkout it is running in — the operator's.

This is `xgd` behaving as designed. The round is a plain non-interactive CLI
caller and there is nothing in its environment that identifies it as one.

## Fix

Two parts, and the second is what makes it hold.

**1. The brief names the flag.** §6's worked example becomes:

```
xgd ticket create --type request \
  --created-by repro-console \
  --title 'fold: background gradient direction is dropped' \
  --fields '{"status":"draft"}' \
  --body-file <a file you wrote>
```

and the same for the secondary `bug` tickets of §5. The exact string is a
decision to make when this is implemented — `repro-console` is the minimum;
something carrying the run (`repro-console:<slug>#<iteration>`) is more useful
in a ticket list and costs nothing, since the round already knows both.

**2. The console checks it, because an instruction is not a property.** This is
the same reasoning [[REQ-262]] D7 forced on the `ready_*` rule: once the round
holds `Bash`, what the brief asks for is checked after the fact rather than
guaranteed. `console.ts`'s `confirm()` already reads every ticket a round
claims to have filed back through `readTicket()`. It should also read
`created_by` and report a violation when a ticket filed during a round does not
carry the expected provenance.

`readTicket()` currently regex-scrapes `Status:` out of `xgd ticket get`'s
human output. `created_by` is not in that output — it is in `xgd ticket get
--json` under `frontmatter.created_by`. So the read-back moves to `--json`,
which also makes the existing status check parse rather than scrape.

The violation is a line in the round's report, never a prompt — the console
runs unattended by design.

**Not in scope, and deliberately.** The structurally stronger fix is an env-var
override in `xgd` itself (an `XGD_CREATED_BY` the console sets around the
round's subprocess, alongside `XGD_CHAT_TICKET_ID`), which would make correct
provenance a property of the environment rather than an instruction the round
keeps. That is a change to another repository and belongs in a ticket there.
This ticket fixes it where it can be fixed today: the brief asks, the console
verifies.

**Retrospective repair.** [[REQ-265]] itself should have its `created_by`
corrected once the string is settled. It is the only ticket a round has filed
so far.

## Test plan

UATs named `test_UAT_FC_BUG-104_*` in `tests/` — the repo's own test root, not
`tools/repro-console/tests/` as first written here. `vitest.node.config.mts`
includes `tests/**/*.test.ts` and nothing else, so a suite under `tools/` would
never have run:

1. The brief's create example carries `--created-by` — a static assertion over
   `DIAGNOSE-THE-GAP.md`, the same shape as the existing brief-content tests.
   Cheap, and it is what stops the flag being dropped in a later edit of §6.
2. `confirm()` reports a violation when the read-back shows a ticket filed with
   a `created_by` that is not the round's, with the ticket id in the message.
3. `confirm()` reports nothing when the provenance is right — so the check is
   proven in both directions, not just observed passing.
4. `readTicket()` parses `created_by` and `status` out of `xgd ticket get
   --json`, and a ticket that cannot be read back is still reported as
   unverified rather than as a provenance failure. The two are different
   outcomes and must not collapse into one.


## Security: checked, and it is not a vulnerability

Asked directly, because "an autonomous process files under a human's identity"
sounds like a privilege problem. It is not one here, and the check is recorded
so it does not get re-litigated.

**Nothing reads `created_by` as a trust signal.** Every consumer in `xgd` is
display-only: the dashboard's ticket header (`static/index.html`'s
`formatCreatedBy`), comment attribution rendering, `api/intents.py`'s
passthrough. No authorization, routing, filtering or dispatch decision reads
the field. The dispatcher triggers on `status`, which is why the `ready_*`
assertion exists and this one does not need to. Nothing in `1stcontact` reads
it at all. So a wrong `created_by` grants nothing and blocks nothing.

**What it does cost is forensic.** `created_by` is the only marker that
separates "an unattended round wrote this" from "the operator wrote this."
That is a detection and attribution control, not a preventive one — its whole
value is post-incident, when someone is working out where a claim came from.
The relevant property is that a round's input includes `raw.html` captured
from a third-party site, so a round's output is downstream of content this
project did not write. A ticket carrying the operator's name is a ticket whose
reader has no cue to read it with that in mind.

That is the honest size of it: **audit-trail integrity for a single-operator
local dev tool**. It justifies fixing the bug — which was already justified —
and it does not justify raising the severity. `medium` stands.

**Two adjacent findings, raised separately rather than folded in here**, since
neither is caused by this bug and neither is fixed by fixing it:

1. `brief/DIAGNOSE-THE-GAP.md` §1 tells the round "You have no tool that can
   write a file, spawn another agent or reach the network." With `Bash` granted
   whole ([[REQ-262]] D7, `ai.ts`'s `AI_ALLOWED_TOOLS`), the first and third
   are not true — `ai.ts` says so itself for authoring ("the round can write
   through it"). The deny list removes the named network *tools*; it does not
   remove `curl`. The sentence reads as a statement of fact about the round's
   containment and is an instruction. It should be written as one.
2. Untrusted captured HTML is read by a round holding an unrestricted shell,
   with no OS sandbox on the spawn (`claudeCommand` passes permission mode,
   tool lists and setting sources; no sandbox flag). This is a known and
   documented consequence of D7 rather than an oversight, and for sites the
   operator chose to reproduce the realistic risk is low. It is worth being
   written down where D7's reasoning is, because the containment argument
   there covers tools and does not mention shell egress.

## What landed

Written after implementation, because two things in the Fix above were left open
for whoever built it and one turned out not to be buildable.

### The string is `repro-console:<slug>#<iteration>`, checked by its marker

The brief asks for the run-qualified form — it is strictly more useful in a
ticket list than the bare marker and costs the round nothing, since its prompt
already names both the slug and the iteration. `ROUND_CREATED_BY` in
`tools/repro-console/src/ticket.ts` is the one definition site for the
`repro-console` marker; the brief and the console both derive from it, and a UAT
asserts the brief carries it so the two cannot drift apart silently.

**The check is a prefix on the marker, not an exact match on the run**, and that
is deliberate in two directions. An *appended* ticket was filed by an earlier
round, so its qualifier is legitimately a different one — demanding this round's
would report a violation against a round that did exactly as it was told. And
the qualifier is free text an LLM types, so an abbreviated slug would fail an
exact match while being no kind of provenance failure. The boundary worth
checking is machine-versus-human and the marker is that boundary exactly.

The separator is required, so a `created_by` that merely *starts* with the marker
— `repro-console-operator@example.com` — does not pass as one.

### The console checks bug tickets to the same standard

`confirm()` applies the provenance check to the secondary `1c` bug tickets as
well as to the gap ticket. They are filed by the same round through the same
command; a check that covered only the gap ticket would let half of a round's
output keep the operator's name. The brief says so in §5 for the same reason.

### A violation never fails the round

Consistent with everything else `confirm()` finds. The diagnosis is real and was
done; a console that discarded it over its own audit trail would be committing a
worse version of the fault it was reporting. The finding is a line in the round's
violations, which is how the page already says a round misbehaved.

### `ReadTicket` grew `createdBy`, and unreadable stayed its own outcome

`readTicket()` now runs `xgd ticket get <id> --json` and parses
`frontmatter.status` and `frontmatter.created_by` through the existing
`parseJsonOutput` — which already tolerates `xgd`'s `▶`/`◀` banners, so no new
parsing was written. A refusal, a non-JSON answer and a document with no status
all come back `found: false` with empty fields and are reported as *unverified*.
That is a different finding from wrong provenance and must not collapse into it:
one asks the reader to repair a ticket, the other says the console could not
look. An empty `created_by` is exactly the value a naive check would have
reported as a violation, so this is asserted rather than assumed.

### Test infrastructure: one definition of the read-back document

`tests/support/xgd-ticket-get.ts` renders what `xgd ticket get --json` prints,
banners included. Three suites drive `readTicket()` through the injected
`CommandRunner`; before this change the document each had to produce was the one
line `Status: draft`, cheap enough to restate, and it is now a nested frontmatter
object. Three hand-written copies would drift the moment a fourth field is read
back. `test_UAT_FC_REQ-256_*` and `test_UAT_FC_REQ-261_*` were moved onto it as
part of this change.

### Retrospective repair of REQ-265: blocked, not done

`created_by` is settable only at creation. `xgd ticket create` takes
`--created-by`; `xgd ticket update` has no equivalent and `--stdin` with a
`created_by` key is refused ("Must provide --title, --fields, --body, …").
Editing the ticket file directly is not an option — the file is the store's, not
ours. So REQ-265 keeps `martin-github@westhead.me` until either `xgd` grows a way
to amend the field or the operator decides it is not worth one. It is one ticket
and the loop is correct from here on.

### Adjacent finding, not fixed here

`ai.ts`'s `buildPrompt` still carries the pre-[[REQ-262]]-D10 text — "**You still
do not file.** You hand the ticket back and the console creates it at `status:
draft`. Never create one yourself" — and, under "What you hand back", "the
console files each one separately at `draft`". Both contradict the brief's §1 and
§6, which tell the round to run `xgd ticket create` itself, and contradict what
the console actually does (`ticket.ts`'s own header records that `fileTicket` was
deleted). A round is handed the brief and this prompt in one message and has to
pick. Not touched here: it is a stale-prompt defect that predates this ticket,
is not caused by it and is not fixed by fixing it. Raised for the operator
rather than folded in.