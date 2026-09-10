---
uid: comment-b4fedc09
id: COMMENT-2575
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T18:02:15.874740+00:00'
updated_at: '2026-09-10T18:02:15.874740+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-fa69c065
  kind: note
---

All three findings closed with three `ac-edit` mutations. Completion report is REPORT-3772 (`report-fa69c065`).

**What I changed**

| Finding | AC | Edit |
|---|---|---|
| 1 (violation) | AC-1130 | Title, criterion and verification now carry REQ-136's unit distinction: "bounded **whole-number** controls" with percent / degrees / pixels named, the projection claim scoped to the four *scaling* adjustments, and an explicit clause that hue shift and blur **are** the axis — same name, same number, unconverted |
| 2 (warning) | AC-1026 | Added the producer clause "**from the command line**", matching AC-982's repaired wording. One clause; nothing else moved |
| 3 (warning) | AC-1275 | "A **region** is marked unavailable" → "A **field** is marked unavailable". One word |

The code confirmed the diagnosis independently: `FILTER_CONTROLS` gives `hueRotateDeg` and `blurPx` `scale: 1` with an `axis` string identical to their `name`, against `scale: 100` on the four `*Pct` controls (`packages/site-schema/src/l1/edit.ts:794-801`). The AC prose was the only wrong layer.

**Two judgement calls worth flagging.** The assessor's suggested verification text for AC-1130 was "the hue shift and blur stored **unconverted**" — but the shipped UAT offers those two and never submits them, so that wording would have demanded an assertion no current test makes and manufactured a fresh uat-level gap. I wrote it as a name-and-no-conversion assertion instead, which the shipped test does satisfy. Separately, I stated the italic precedent inline rather than cross-referencing AC-1117, keeping the criterion self-contained.

**Sweeps.** I ran the assessor's widened successor rule in both directions over STORY-100's 43 ACs. The unqualified-claim grep (`on disk|was written|is written`) hits eight ACs, but seven are "nothing is written" claims asserting no artifact — AC-982 and AC-1026 really were the only two, and both now name their producer. The unit grep found AC-1024 already saying "either a **bounded whole number** … or a **closed pick**" — it was correct all along, so it's now the corroborating sibling rather than a second defect, and I phrased AC-1130's opening to agree with it. No new findings.

`npm test -- tests/reconciliation-copy-edit-image-framing.test.ts` passes 6/6, including the AC-1130 UAT. The wrangler `EPERM` in that output is the sandbox refusing `~/Library/Preferences/.wrangler/logs`, not a failure. I touched no code and no tests.

One new item forwarded to the uat level: that same test's comment reads "Every colour control is a BOUNDED PERCENTAGE" above a loop over only the four `*Pct` controls, and its name says "in percentages". Its assertions are already correct and correctly scoped — this is finding 1's lag one layer down, in test prose only, and out of scope at level=ac.
