---
uid: bug-a1cafa46
id: BUG-125
type: bug
title: 'repro console: a stored round written before REQ-276 takes the whole page
  down on open'
created_by: EPIC-12
created_at: '2026-09-20T19:12:43.538142+00:00'
updated_at: '2026-09-20T19:25:38.364625+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  priority: high
  story_points: 2
  auto_merge_back: true
  needs_review: false
  epic_parent: epic-bf282b3d
  chat_comment: comment-fa994b87
  commits:
  - working_sha: 897f0ea1348411e7d2c19be0a4345453f618b62c
    reconcile_sha: null
    main_sha: null
  - working_sha: da9eeb9ff3a18f7e467068065259bc293207d790
    reconcile_sha: null
    main_sha: null
  version: 0.2.290
---

# A stored round written before REQ-276 takes the whole page down on open

Parent: [[EPIC-12]]. Found by the operator on 2026-09-20 firing up the console
against a site it had already run rounds on.

## What the operator experienced

The console started, the blank page rendered, they clicked a stored site, and
the page came back as a bare 500:

```
Cannot read properties of undefined (reading 'length')
```

No iteration list, no diff links, no rounds — and nothing on the page or in the
log saying which of the console's many reads had failed. The console looks
healthy right up to the click, because the blank page touches none of this.

Reproduced deterministically against `storage/tmp/repro-console/repro-gigabytealchemy-ai`:

```
GET  /       200      the blank page, which is fine
POST /open   303      click a stored site
GET  /       500      Cannot read properties of undefined (reading 'length')
```

## Where it breaks

```
TypeError: Cannot read properties of undefined (reading 'length')
    at filingsOf              console.ts:1768   ticket.defectClasses.length
    at ReproConsole.aiView    console.ts:434
    at ReproConsole.view / .state / .handle
```

[[REQ-276]] (`5d55aa8c03`, "a round classifies every ticket it files") added
`defectClasses: string[]` to `ReadTicket` as a **required** field, and
`filingsOf` reads `.length` off it with no guard — correctly, for an object the
type says always has it.

`readOutcome` restores `outcome.json` from disk with a bare spread and an
assertion:

```ts
const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<AiOutcome>
if (typeof parsed.status !== 'string') return null
return { ...parsed, status: parsed.status, violations: parsed.violations ?? [], observations: parsed.observations ?? [] } as AiOutcome
```

The `as AiOutcome` makes the compiler agree the field is there. The disk
disagrees. Every `ticketsRead` entry written before REQ-276 carries exactly
four keys:

```
repro-gigabytealchemy-ai/iteration-1/ai/outcome.json   ['createdBy','found','id','status']  x4
repro-gigabytealchemy-ai/iteration-2/ai/outcome.json   ['createdBy','found','id','status']  x2
repro-gigabytealchemy-ai/iteration-3/ai/outcome.json   ['createdBy','found','id','status']  x3
```

`violations` and `observations` are defaulted on that same line — this is the
third field added to a restored outcome and the first two were each patched in
as they broke. The nested list is the one the pattern did not reach.

## Why it is worse than one missing default

**The blast radius is the whole page, not the ticket row.** `filingsOf` is
called from `aiView`, which is called from `view`, which is mapped over every
iteration inside `state()`. One unreadable field in one round's artifact takes
down the verdict, the iteration list, the diff links and the reference line
with it — the console loses a site's entire history because it cannot classify
one ticket.

**It is the console failing a rule it already holds `1c` to.** The comment over
`RegionReportFile` states it outright: *"Every field is optional, because the
console must render a report written by any version of `1c diff` it is pointed
at. A missing `bbox` costs the caption, not the page."* `readIterations` follows
it for the manifest, field by field, and [[REQ-272]]'s `bundleCapturedAt` says
in its own doc comment that it is optional so older manifests still parse.
`readGateReport` follows it too — which is why [[REQ-277]]'s `unmeasured`, also
declared required, is safe: it is recomputed from `gate.json` rather than
restored. `readOutcome` is the one boundary that does not follow the rule, and
the console's own artifact is the one it does not apply it to.

**The console's whole purpose is the comparison it just lost.** Requirement 33's
comment: *"restarting it showed an empty page beside a full `storage/tmp/`"* and
*"made 'come back tomorrow and see how far this has moved' impossible for the
one tool whose whole purpose is that comparison"*. That is exactly the state
this crash restores, worse — an error string instead of an empty page.

## Behaviour wanted

1. **A stored round written by any earlier version of the console renders.**
   `readOutcome` normalises what it read off disk before anything downstream
   sees it, the way `readIterations` already normalises the manifest: every
   field the code declares required is given a value here, whatever the file
   carries. A field the artifact does not have costs what it names, not the page.

2. **A round with no classes reads as having none, not as having been checked.**
   Those tickets carry no `defect_class`, so the page's class-split clause is
   dropped entirely rather than rendered empty or defaulted to a queue, and no
   violation is manufactured against a round that predates the field — the
   unclassified-ticket check belongs to the live confirmation path, where the
   console can still see the store, and must stay there.

3. **A malformed entry costs itself, not its neighbours.** An entry that is not
   an object, or whose `id` or `status` is the wrong type, is normalised to the
   same unread shape `readTicket` already uses for a ticket it could not read,
   and the other entries in the list still render.

4. **Nothing about what a live round records changes.** A round running today
   reads its tickets back exactly as [[REQ-276]] specified and its class split
   renders as it does now. This ticket is about the read side of the boundary.

## Acceptance

- Opening a site whose `outcome.json` has `ticketsRead` entries without
  `defectClasses` renders the console page with its iteration list, verdict and
  round rows, and `/state`, `/iteration/<n>/page`, `/iteration/<n>/ticket` and
  `/iteration/<n>/diff/` all answer rather than 500.
- That page shows no defect-class split for those rounds, and reports no
  unclassified-ticket violation against them.
- An `outcome.json` written today, with classes present, still renders its split
  exactly as it does now.
- An `outcome.json` whose `ticketsRead` holds one malformed entry beside a good
  one renders the good one.


## What landed

`897f0ea134` (+ the auto version bump), on the read side of the boundary only.

**`normaliseOutcome` in `ai.ts`, called by `readOutcome`.** The bare spread and
the `as AiOutcome` are gone: what `JSON.parse` returned is handed to a
normaliser that gives every field the code declares required a value, whatever
the file carries — the same thing `readIterations` does for the manifest and
`readGateReport` for the verdict. `status` stays the one exception: an outcome
with no status is not an outcome, and the caller already reads that as "this
iteration has no round".

Two technical consequences of behaviour 1 worth naming, because they are what
"every field the code declares required" means in practice beyond
`defectClasses`:

- **`violations`, `observations` and `bugTickets` are re-derived, not
  defaulted.** They were defaulted with `?? []`, which only answers absence — a
  file holding a non-list under one of those names would still have reached the
  page and thrown there. Each is now filtered back to a list of strings,
  `bugTickets` through the same `ticketIds` the live parse uses.
- **Absence is kept as absence for `ticketsRead` and `bugTickets`.** A round
  that named no secondary bug and one whose read-back came out empty are
  different facts, and only the file can say which — so a missing key stays
  missing rather than becoming `[]`.

**`unreadTicket` in `ai.ts`, shared with the live read-back.** Behaviour 3 asks
for "the same unread shape `readTicket` already uses", so that shape is now
declared once beside `ReadTicket` and called from both places rather than
written out twice.

**Nothing on the write side moved.** `parseOutcome`, `confirm` and
`wrongDefectClass` are untouched; the unclassified-ticket violation is still
raised by the live confirmation path and by nothing else.

## Evidence

`tests/test_UAT_FC_BUG-125_stored_round_renders.test.ts` — five UATs against a
real `node:http` console on loopback, driven with real `fetch`, reading real
artifacts. The pre-REQ-276 fixture is made by RUNNING a round and then editing
its `outcome.json` down to the four keys an earlier console wrote, rather than
hand-writing a file this suite invented.

| UAT | Pins |
|---|---|
| `…_a_round_recorded_before_the_class_field_still_renders` | acceptance 1 — the page, and `/state`, `/iteration/1/page`, `/iteration/1/ticket`, `/iteration/1/diff/` |
| `…_a_round_with_no_classes_reads_as_having_none` | acceptance 2 — split clause absent, filings block absent, no violation |
| `…_a_round_recorded_today_still_renders_its_split` | acceptance 3 |
| `…_a_malformed_entry_costs_itself_not_its_neighbours` | acceptance 4 |
| `…_the_unclassified_check_stays_on_the_live_path` | behaviour 4 |

Before the fix the first, second and fourth fail with `expected 500 to be 200`
and `TypeError: Cannot read properties of undefined (reading 'length')` — the
operator's own error. The third and fifth pass on both sides, which is what
makes them the guards they are.

Regression scope: the eleven repro-console suites (131 tests) plus this one.
Two `REQ-254` cases that spawn the real `1c` CLI fail in a `git worktree`
checkout and pass in the main checkout — the known worktree artifact, unrelated
to this change.
