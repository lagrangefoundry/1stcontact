---
uid: bug-c1132e6c
id: BUG-104
type: bug
title: 'repro console: a round''s gap ticket is attributed to the operator, not the
  loop'
created_by: EPIC-12
created_at: '2026-09-17T21:42:17.916425+00:00'
updated_at: '2026-09-17T21:54:49.655703+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  severity: medium
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-fe086f81
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

UATs named `test_UAT_FC_<TICKET-ID>_*` in `tools/repro-console/tests/`:

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