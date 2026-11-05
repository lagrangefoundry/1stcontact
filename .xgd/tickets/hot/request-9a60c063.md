---
uid: request-9a60c063
id: REQ-277
type: request
title: 'repro console: the unmeasured set is the headline number; the delta count
  is not progress'
created_by: EPIC-12
created_at: '2026-09-18T22:31:33.905493+00:00'
updated_at: '2026-09-18T23:58:18.211946+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 4
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-8db729d9
  commits:
  - working_sha: a7d57961e68f11ed6b35168eb7a639c4ccf47545
    reconcile_sha: null
    main_sha: null
  - working_sha: cfa0119e26bda8824b1cbb35c644524875e1f0e3
    reconcile_sha: null
    main_sha: null
  version: 0.2.275
---

# The unmeasured set is the headline number; the delta count is not progress

## Where this came from

EPIC-19's audit closed with a metric warning, and it is the most load-bearing
sentence in it:

> **Stop reading delta count as progress.** Landing BUG-107 took deltas from 1 to
> 14 — that's the instrument sharpening, not the reproduction degrading. The
> number that means something is the unmeasured set shrinking.

BUG-107 added `role`/`a11yRole` comparison. Before it, eleven lost headings read
as **zero deltas**. After it, the same reproduction read as fourteen. Nothing
about the page changed. A console operator reading the delta count as a score saw
a 14x regression on a pure improvement.

The same inversion is queued to happen again: the capture-completeness work will
add axes, every added axis can only raise the count, and the re-capture this epic
is about to run will make five currently-invisible axes measurable at once.

## What the instrument already knows

BUG-106 and BUG-111 established the discipline that an unmeasured axis is not a
clean one — `values-diff.ts:3183`: *"an unmeasured axis is not a clean one: it is
skipped rather than compared against a stand-in"* — and BUG-111 lifted unpaired
bands into counts the gate reads. `1c l1-gate` already prints what it did not
measure on the pass rung.

So the quantity exists. What is missing is that **it is not the number anyone
reads**. The console's headline, the round's sense of whether it is winning, and
the operator's glance all still land on the delta count.

## Behaviour wanted

1. **The unmeasured set is a first-class reported quantity** with a stable
   definition: axes skipped for want of a measurement on either side, unpaired
   bands, uncompared populations, probes that did not run. One number, plus the
   breakdown behind it.
2. **It is the console's headline for an iteration**, above the delta count — the
   delta count stays, it is simply no longer the thing the eye lands on first.
3. **Iteration-to-iteration, the console says which direction each moved**, and
   states plainly that a delta count rising while the unmeasured set falls is the
   instrument sharpening. The operator should not have to know this ticket exists
   to read the page correctly.
4. **A re-captured or refolded iteration is marked as not comparable** on the
   delta axis specifically — REQ-272 already marks the seam; this is what the
   seam means for the numbers either side of it.
5. **The round's brief says the same thing.** A round optimising for fewer deltas
   will avoid adding an axis, which is exactly backwards.

## Acceptance

- The console shows an unmeasured count per iteration, with its breakdown.
- Adding a comparison axis to a fixture moves the unmeasured count down and the
  delta count up, and a test asserts the console renders that as progress rather
  than regression.
- The brief tells the round that a rising delta count from a sharpening
  instrument is a success, and names the unmeasured set as the number to drive.

## Not in scope

Changing what the gate measures. This is about which of the numbers it already
produces is treated as the score.


## As built

**One definition, three surfaces.** `tools/repro-console/src/unmeasured.ts` is
the console's only definition of the set. The page, the evidence digest and the
round's prompt all take their headline from it, so the three can never quote
different totals. Nothing about what the gate measures changed — this is
arithmetic over `gate.json` fields that already existed.

**The four parts**, mapped onto what the gate already writes:

| part | `gate.json` | what it means |
|---|---|---|
| axes | `values.unmeasuredAxes` | a compared axis only one side of the projection can read (REQ-274) |
| bands | `values.unpairedSections` + `values.unpairedActualSections` | a section with no counterpart, so its section-level values were never compared (BUG-111) |
| populations | `values.unmatched` + `values.unpairedActual` | an element on either side that paired with nothing (BUG-106) |
| probes | `values.sectionsNotComparable` | a measurement the run declared it could not make at all (BUG-102) |

**A quantity the report does not carry is not zero.** A gate report written
before REQ-274 says nothing about unmeasured axes, and reading that silence as
"none" would manufacture exactly the clean bill this ticket exists to refuse. A
partial report reads as `unmeasured ≥ N` and the breakdown names what it could
not say. An iteration with no readable report says so instead of showing a zero.

**Iteration-to-iteration movement is compared over the parts both reports
carry**, and the page says what the basis was whenever that is not the whole
set. Differencing a part one side is silent about would report the ARRIVAL of a
quantity as a movement in the thing it measures — the same false-progress shape,
inverted.

**On the page**: the headline sits directly under the `Iteration N` heading,
above the links, with the delta count beneath it and — when there is an
iteration above to compare against — one plain-English sentence saying what the
pair of movements means. An operator who has never read this ticket has to be
able to read the page correctly, so the sentence is rendered in full rather than
as a marker.

**The seam** (behaviour 4) is detected from the two facts REQ-272 already
records: the iteration's own `recaptured` flag, or a `bundleCapturedAt`
different from the iteration above it — the second catches a reference re-rolled
outside the console, which moves the oracle just as completely and leaves no
flag behind. At a seam the DELTA line alone is marked not comparable; the
unmeasured movement is still shown, because a re-capture is the main way that
number falls.

**What the round is told**: the prompt's gate block leads with the unmeasured
set and names it as the number to drive, and says of the delta count that it
counts what the gate DID compare and is not a score. The digest carries the same
section above its value-delta section. The brief gains §3's *"The score is the
unmeasured set, not the delta count"*, which tells a round that a gap whose fix
raises the delta count is still a good gap to file, that a delta count falling
over a rising unmeasured set is the instrument going blind, and never to report a
rising delta count as a regression without reading what the unmeasured set did.

## Test plan

`tests/test_UAT_FC_REQ-277_unmeasured_is_the_headline.test.ts` — five UATs
against the real console over HTTP, with `1c`, `claude`, `git` and `xgd`
substituted at the seams the console already had:

1. the count and its breakdown appear per iteration, and the delta count is
   rendered below the headline;
2. an added axis moves the unmeasured count down and the delta count up, and the
   page renders that as the instrument sharpening rather than as a regression;
3. a re-captured iteration is marked not comparable on the delta axis
   specifically, while the unmeasured movement crosses the seam;
4. a report that does not carry a part reads as `≥` with the missing parts
   named, not as zero;
5. the prompt, the digest and the brief all name the unmeasured set as the
   number to drive, each with the headline above the delta count.

Regression scope: every repro-console suite (BUG-99, BUG-103, BUG-104, BUG-105,
BUG-108, BUG-109, BUG-114, REQ-254 ×2, REQ-255, REQ-256, REQ-261, REQ-262,
REQ-270, REQ-272, REQ-276). REQ-256's hand-built `GateSummary` fixture gained the
new field, which is the only change to an existing test.