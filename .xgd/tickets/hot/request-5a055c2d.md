---
uid: request-5a055c2d
id: REQ-276
type: request
title: 'repro console: a round says what KIND of thing it found — instrument defect
  or capability gap'
created_by: EPIC-12
created_at: '2026-09-18T22:31:26.883729+00:00'
updated_at: '2026-09-18T22:31:26.883729+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  story_points: 3
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9df8a526
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