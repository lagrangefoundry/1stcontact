---
uid: request-1e65a5f0
id: REQ-274
type: request
title: 'values-diff: one projection over both sides — retire the asymmetric-axis defect
  as a category'
created_by: EPIC-12
created_at: '2026-09-18T22:31:18.860464+00:00'
updated_at: '2026-09-18T22:31:18.860464+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 8
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
---

# One projection over both sides — retire the asymmetric-axis defect as a category

## Where this came from

EPIC-19 audited the ten tickets rounds 1–3 filed and grouped their 22 defects.
Four of the 22 share one root: **the reference side and the reproduction side are
read by two different procedures**, so an axis can be recorded, projected or
normalised on one side and not the other, and the comparator has no way to know.

REQ-270 #3 said it outright. The four were fixed one axis at a time
(REQ-269 #5, REQ-270 #2/#3/#4). None of those fixes stops the fifth.

## The two procedures

`tools/generate/src/cli/capture/values-diff.ts`:

- `flattenCapture(capture: Capture): ValueManifest`   — line 1121, the reference
- `flattenSignals(signals: RawSignals, source): ValueManifest` — line 1178, the reproduction

Same return type, two independent bodies, ~185 lines between them. Every axis the
gate compares has to be read twice, in two places, by two authors, and the type
system cannot tell you when only one of them was updated — `ValueManifest` is
satisfied either way.

`flattenSignals`' own doc comment records the resulting drift as a known fact:

> Section values are read from the *raw* bands (uncoalesced), so the two sides'
> section indices do NOT correspond — the capture's are coalesced by style
> signature.

## Why this is not just "call one function twice"

The two sides genuinely have different inputs and this ticket must not pretend
otherwise:

- `Capture` is a stored bundle, written by the extractor, possibly at an older
  `CAPTURE_SCHEMA` (see the sibling capture-completeness ticket).
- `RawSignals` is a live extraction from a rendered reproduction, in this
  process, always current.
- The capture's sections are coalesced by style signature; the reproduction's
  bands are raw. BUG-102 already had to join them by geometry rather than index
  because of this, and that join is correct and stays.

So the deliverable is **not** one function over both inputs. It is **one place
where each axis is read**, with the two inputs normalised to a common
intermediate first.

## Behaviour wanted

1. **An axis is declared once.** A single table — axis name, where it lives on a
   `Capture`, where it lives on `RawSignals`, its type, its tolerance — and both
   manifests are projected from that table rather than from two hand-written
   bodies. Adding an axis means adding a row, and it is then present on both
   sides or on neither.
2. **A half-projected axis is a build error, not a silent clean gate.** If the
   table names an axis that only one side can supply, that is stated at the
   declaration and the comparator treats it as unmeasured (the discipline
   BUG-106/BUG-111 established), rather than comparing against a default.
3. **The existing four fixes are expressed in the table, not beside it.** REQ-269
   #5, REQ-270 #2/#3/#4 are re-landed as rows; if any of them cannot be expressed
   that way, say so in the ticket rather than leaving a special case unremarked —
   a table with four exceptions has not retired the category.
4. **The coalesced-vs-raw asymmetry stays, and is named.** This ticket does not
   change the section join. It changes who reads an axis, not how bands are
   paired.

## Acceptance

- Every axis compared by `diffValues` is reachable from one declaration site,
  and a test enumerates the table and asserts both projections cover it.
- Adding a row with a reference-side reader and no reproduction-side reader makes
  the axis report `unmeasured`, and a test shows the gate saying so rather than
  passing.
- No regression in the gate verdict for the three stored references.

## Not in scope

The capture's own completeness (does the extractor record the axis at all) is the
sibling ticket. This one is about what happens to an axis that IS recorded.
