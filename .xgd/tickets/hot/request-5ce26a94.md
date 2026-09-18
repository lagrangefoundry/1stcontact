---
uid: request-5ce26a94
id: REQ-278
type: request
title: 'L1 capability: a flow recovery that preserves horizontal geometry'
created_by: EPIC-12
created_at: '2026-09-18T22:31:35.276566+00:00'
updated_at: '2026-09-18T22:31:35.276566+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 13
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
---

# L1 capability: a flow recovery that preserves horizontal geometry

## Where this came from

BUG-113 resolved the served-vs-graded split and, in doing so, measured the
recovery we have and declined to serve it. Its numbers, on the three references:

| reference | sections | findings cleared | cost |
|---|---|---|---|
| `gigabytealchemy.ai` | 5 | 287 -> 0 | **318 fidelity residuals, maxΔ 1426px**, 12 oracle samples unmatched |
| `faelan.com` | 1 | 52 -> 0 | 66 residuals, maxΔ 1363px |
| `joyfulculinarycreations.com` | 4 | 114 -> 0 | 413 residuals, maxΔ 3958px |

`promoteToFlow` clears the envelope by dropping each promoted member's geometry,
so a region that was a 14px-wide check glyph in a grid becomes a full-bleed
stacked row. maxΔ 1426px on a 1440px viewport is the whole width. The recovered
document is a different page, not a repaired one — the 80%-faithful copy the
epic's doctrine §2.1 rules out.

So `1c repro` serves the absolute base, and BUG-113 records that choice with its
price printed on every run. Confirmed on the current tree:

```
$ 1c l1-gate --ref storage/references/gigabytealchemy.ai/index   (after refold)
  sample-fidelity     PASS  (maxΔ 0.9px, 0 residuals)
  on-sample           PASS  (0 envelope findings at the captured widths)
  off-sample          PASS  (0 envelope findings)
  content-robustness  FAIL  (287 findings)
  recovery (not served): 287 findings -> 0, at maxΔ 1426.5px / 318 fidelity residuals
```

BUG-113 named the gap and explicitly deferred it: *"The framework gap it names is
a flow recovery that preserves horizontal geometry; that is not this ticket."*
This is that ticket.

## Why it matters

This is one of the **two of twenty-two** items in EPIC-19's audit that raise the
product's ceiling rather than repair the ruler. Content-robustness is the last
failing probe on the epic's reference once the fold fixes land, and an
absolutely-positioned page is fragile by construction: any text that wraps one
line more than the capture did lands on its neighbour. That is a fidelity failure
too, and a more visible one than a sub-pixel position delta.

## Behaviour wanted

A recovery that converts pinned sibling groups to flow **without discarding the
horizontal geometry that made the group a grid**. Concretely, the failure mode to
beat is the one BUG-113 measured: a promoted member must keep its width and its
horizontal position within the group, so a 14px check glyph in a row of them
stays a 14px check glyph in a row of them, and only the *vertical* relationship
becomes flow.

The ticket must report, on the same three references and in the same units
BUG-113 used, what the new recovery clears and what it costs. A recovery whose
maxΔ is still in the hundreds of pixels has not solved this, and saying so is a
valid outcome.

## Acceptance

- The recovery is measured on all three stored references, in BUG-113's units
  (findings cleared, fidelity residuals, maxΔ px, oracle samples unmatched), and
  the table appears in this ticket's body beside BUG-113's for comparison.
- If it wins, `1c repro` serves it and the gate grades what is served — the
  invariant BUG-113 established, which this ticket must not re-break.
- If it does not win, the number is recorded and the base keeps being served, and
  that outcome is written up rather than quietly abandoned.
- Sample fidelity does not regress: currently PASS at maxΔ 0.89px, 0 residuals.

## Depends on

BUG-113, which is `ready_to_reconcile`. The gate must be grading the served
document before a change to what is served can be trusted.
