---
uid: request-9a60c063
id: REQ-277
type: request
title: 'repro console: the unmeasured set is the headline number; the delta count
  is not progress'
created_by: EPIC-12
created_at: '2026-09-18T22:31:33.905493+00:00'
updated_at: '2026-09-18T23:47:36.115244+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 5
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-8db729d9
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