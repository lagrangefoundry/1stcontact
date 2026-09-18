---
uid: request-5a055c2d
id: REQ-276
type: request
title: 'repro console: a round says what KIND of thing it found — instrument defect
  or capability gap'
created_by: EPIC-12
created_at: '2026-09-18T22:31:26.883729+00:00'
updated_at: '2026-09-18T23:41:58.387979+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: medium
  story_points: 3
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9df8a526
  commits:
  - working_sha: 5d55aa8c0333e9b5f4ce5e87965e70ce4677b16c
    reconcile_sha: null
    main_sha: null
  - working_sha: 96108ce32a130b6d26d810fc093ca351eaea7b62
    reconcile_sha: null
    main_sha: null
  version: 0.2.273
---

# The round says what KIND of thing it found — instrument defect or capability gap

## Where this came from

EPIC-19 classified the 22 defects rounds 1–3 filed:

| where it sits | n |
|---|---|
| instrument reports pass/clean when it measured nothing or wrong | 5 |
| the two sides measured by different procedures | 4 |
| capture loses information the page had | 5 |
| comparator has no axis for it | 2 |
| fold is wrong | 2 |
| **L1 genuinely cannot express it** | **2** |
| process/harness | 2 |

**Two of twenty-two raise the product's ceiling.** The other twenty make the
ruler trustworthy. Both are worth doing and they are not the same queue: ruler
repair is unblocking work, capability work is the actual product.

That classification took a human-directed audit of ten ticket bodies after the
fact. The round that filed each ticket knew the answer at the time and was never
asked.

## Behaviour wanted

1. **A round classifies every ticket it files**, into a small closed set — the
   rows above are the candidate set and the ticket should land with whatever set
   survives contact with the brief. The class goes in a ticket field, not in
   prose, so it can be filtered.
2. **The class is justified in one line** in the ticket body, from the evidence
   the round already has. A round that cannot tell whether a residual is the
   instrument or the engine says so, and *that* is a class — it is the honest
   answer often enough to be worth a name.
3. **The console shows the split.** A round's summary line says what it filed and
   in which classes, so the operator can see at a glance whether $7 bought ruler
   repair or ceiling.
4. **The epic can be read by class.** Enough that "show me the capability queue"
   is a filter rather than a re-audit.

## Why the round and not a later pass

The evidence for the classification is the evidence the round already gathered:
which probe fired, whether the axis was measured, whether the reference carries
the value. That context is in the round's head at filing time and gone
afterwards — reconstructing it is what EPIC-19 just spent an audit doing.

## Acceptance

- Every ticket a round files carries a class field from the closed set.
- The class is defended in the body in one line citing the round's own evidence.
- `1c` / the console can list a round's filings grouped by class.
- The brief tells the round what the classes mean and that "I cannot tell" is a
  permitted answer — a forced choice would produce confident noise.

## Not in scope

Re-classifying the existing ten tickets. EPIC-19 has done that and its table is
quoted above; this ticket is about not needing to do it again.

---

# What was built

## The closed set that survived contact with the brief

Nine classes, one field value each, lower-case and hyphenated. The set is
**declared once in code** (`tools/repro-console/src/defect-class.ts`) and is the
only authority: the brief explains what each one means, the prompt carries the
literal list, and the console checks read-back tickets against it.

| class | queue | what it means |
|---|---|---|
| `instrument-blind` | ruler | the instrument reported pass/clean when it measured nothing, or measured the wrong thing |
| `instrument-asymmetric` | ruler | the two sides were measured by different procedures, so the comparison is not like for like |
| `instrument-no-axis` | ruler | the comparator has no axis for the property, so a real difference is invisible to the score |
| `capture-loses-it` | ruler | the capture does not carry something the page had, so nothing downstream can recover it |
| `fold-wrong` | ruler | the capture carries it and L1 can express it; the fold writes the wrong value |
| `renderer-wrong` | ruler | L1 carries the right value and the render disagrees with it |
| `l1-cannot-express` | **ceiling** | there is no way to author the thing in L1 as it stands |
| `harness` | process | the console, the brief, the CLI or the round's own process — not the engine |
| `cannot-tell` | unknown | the evidence in hand does not separate the instrument from the engine |

Four **queues**, which is the split behaviour 3 asks the console to show:
`ceiling` (raises the product's ceiling), `ruler` (makes the instrument
trustworthy), `process` (neither), `unknown` (the honest answer).

Two notes on why the set is this and not EPIC-19's seven rows verbatim:

- The brief's §5 already sorts every engine finding into three kinds. Class 1
  (*engine shortfall*) splits here into `capture-loses-it` and `fold-wrong`,
  which is EPIC-19's own split; class 2 is `l1-cannot-express`; class 3 —
  *renderer bug* — has no row in EPIC-19's table because rounds 1–3 filed none,
  and is `renderer-wrong` here rather than left with nowhere to go.
- The three instrument rows have no home in §5 at all today: they arrive as the
  secondary `1c` bugs of §5's last subsection, which carry no class. That is
  nine of twenty-two defects — the largest block — sorted by nothing.

`cannot-tell` is a first-class member of the set and the brief says so. A forced
choice between instrument and engine, made without the evidence to separate
them, is confident noise that costs more to unpick than the absence would.

## How it lands

**The field.** `defect_class`, a non-empty list of ids from the set, passed by
the round on `xgd ticket create --fields`. A list rather than a scalar because
one gap ticket carries every residual a round found, ordered by dependency: if
issue three is `l1-cannot-express` and issue one is `fold-wrong`, a scalar keyed
to the leading issue would hide the ceiling finding from exactly the filter this
ticket exists to make possible. Most tickets carry one.

**The authority is the ticket, not the outcome block.** The console already
reads every ticket a round names back through `xgd ticket get --json` to check
its status and its `created_by`; it reads `fields.defect_class` in the same
call. Nothing new is mined from the transcript and nothing is taken on trust —
the class is checked where it has to be right, which is the store.

**The check.** A read-back ticket carrying no `defect_class`, or one carrying a
value outside the set, is a **violation** in the same list as a wrong status and
a wrong `created_by`, shown under the round on the page. It applies to the gap
ticket and to every secondary `1c` bug equally: "every ticket a round files"
means every ticket.

**The justification.** The brief requires one line per class in the ticket body,
citing the evidence the round already has — which test it ran and what came
back. Enforcing prose is not something the console can do honestly, so this is
asked for in the brief and in the prompt, and the field is what is checked.

**The split, on the page.** A round's status line and its block under the
iteration say what it filed and in which classes, grouped by queue — `1 ceiling
(l1-cannot-express), 2 ruler (fold-wrong, instrument-blind)`. A `what this loop
has filed` panel above the iteration list aggregates the same split across every
round on the loaded site, with the ticket ids under each class, so "show me the
capability queue" is a glance at the console as well as a `--filter` on the
field.

**The class registry.** `gap-tickets.json` — the console's own memory of what
each residual class has already been filed as — records the classes alongside
the ticket, unioned across rounds like the references and the iterations beside
it. A later round appending to a class can discover that what looked like a fold
bug also cannot be authored in L1, and the next round's prompt carries where a
known class sits as well as what it is.

**Drift.** The prompt carries the closed set generated from the code, so the
round is never told a set the console will not accept. A test asserts every
class in the code appears in the brief with its meaning, so the two cannot part
company silently.

## Where it landed

- `tools/repro-console/src/defect-class.ts` — the set, the queues, the parse,
  the grouping and the one-line split. New.
- `tools/repro-console/src/console.ts` — the read-back of `fields.defect_class`,
  the violation, the status line's clause and the cross-round panel.
- `tools/repro-console/src/ai.ts` — `ReadTicket.defectClasses`, and the prompt
  section that hands the round the set.
- `tools/repro-console/src/page.ts`, `src/gaps.ts`, `brief/DIAGNOSE-THE-GAP.md`,
  `README.md`.
- `tests/test_UAT_FC_REQ-276_defect_class.test.ts` — ten UATs.
- `tests/support/xgd-ticket-get.ts` — the shared `xgd ticket get --json` stub now
  carries a valid class by default, so suites that are not about this check do
  not trip its violation.