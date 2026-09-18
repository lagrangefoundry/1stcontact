---
uid: request-2a60571e
id: REQ-275
type: request
title: 'capture: audit completeness once, mechanically, instead of one round at a
  time'
created_by: EPIC-12
created_at: '2026-09-18T22:31:25.525963+00:00'
updated_at: '2026-09-18T22:31:25.525963+00:00'
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

# Audit capture completeness once, mechanically, instead of one round at a time

## Where this came from

EPIC-19's audit of rounds 1–3: five of the 22 defects are one shape — *the
extractor stores a rounded or defaulted value instead of the true one, and no
fold fix or L1 axis can recover what capture discarded*. Padding, the
line-height fraction, `href`, alpha, transparent-vs-white.

Each was found by a separate console round, at roughly $7 a round.

## The mechanism we have is reactive by construction

REQ-270 landed `CAPTURE_SCHEMA` (`tools/generate/src/cli/capture/schema.ts`) and
`CAPTURE_SCHEMA_AXES`, which is the right machinery: it stamps a bundle, names
the axes a bundle is missing, and tells the operator to re-capture. It works.

But an axis only joins `CAPTURE_SCHEMA_AXES` **after a round has discovered it is
missing**. The registry currently holds five axes, and those five are precisely
the five a round paid to find. There is no reason to believe the list is
complete, and no cheaper way to extend it than running another round.

Measured today on the epic's own reference:

```
storage/references/gigabytealchemy.ai/index/capture.json
  captureSchema: absent -> schema 1      vs CAPTURE_SCHEMA 3 today
  padding*Px on a field  : absent
  href on a run          : absent
  headingLevel on a run  : absent
  background.kind "none" : absent
  fractional lineHeight  : absent
```

Five for five. That is the reactive registry working, and it is also a
demonstration of how much a single bundle can be behind.

## Behaviour wanted

**Turn discovery into one mechanical pass instead of N rounds.**

1. **A completeness probe.** For a reference page, enumerate the CSS properties
   and DOM facts the live page actually uses — computed styles over the rendered
   DOM, not a fixed wishlist — and diff that against what `capture.json` records
   for the same nodes. Output: the properties the page demonstrably uses that the
   bundle does not carry.
2. **Run it over all three stored references**, so a property that matters on one
   site and not another is still surfaced. `gigabytealchemy.ai`, `faelan.com`,
   `joyfulculinarycreations.com`.
3. **The result is a list, and the list is triaged in the ticket**, each entry
   marked: *record it* (the extractor should carry it), *deliberately not
   recorded* (with the reason, as REQ-73 does for band padding), or *not
   expressible in L1* (which makes it a capability item, not an instrument one).
4. **Whatever comes out of (3) marked "record it" is landed**, and each lands as
   a `CAPTURE_SCHEMA_AXES` row so the staleness message names it for every older
   bundle. `CAPTURE_SCHEMA` bumps once, not five times.
5. **The probe is a command, not a one-off script.** It will be worth re-running
   the next time the reproduction reaches a new class of site, and a script that
   lived only in a transcript will not be there.

## Why now

The alternative is finding the sixth, seventh and eighth lossy axis at $7 each,
across rounds that also spend their budget re-confirming residuals a frozen
bundle cannot clear. This is the single highest-leverage unfiled item in the
epic's instrument half.

## Acceptance

- A command reports, for a reference bundle, the properties its page uses that
  its `capture.json` does not carry.
- It is run over all three stored references and the combined list appears in
  this ticket's body, triaged.
- Every entry triaged *record it* is carried by the extractor, has a
  `CAPTURE_SCHEMA_AXES` row, and is visible to `staleCaptureDetail`.
- Entries triaged *deliberately not recorded* carry their reason in the code
  beside the decision, the way REQ-73's band-padding note does.

## Not in scope

Comparing the two sides of a diff — that is the one-projection ticket. This is
about whether the reference side has the value at all.
