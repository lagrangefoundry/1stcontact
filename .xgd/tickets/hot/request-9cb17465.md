---
uid: request-9cb17465
id: REQ-311
type: request
title: The font catalogue has no generator — it cannot be refreshed or trusted to
  stay current
created_by: EPIC-21
created_at: '2026-09-23T03:18:31.288893+00:00'
updated_at: '2026-09-23T03:18:31.288893+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-b9b27697
  auto_merge_back: true
  needs_review: false
---

## The gap

`fonts/catalogue.json` and `fonts/CATALOGUE.md` were produced by a one-off script on
2026-09-22 and committed. Nothing reproduces them. Google Fonts gains families
continuously — 42 were added in 2026 alone — so a catalogue nobody can regenerate is stale
from the day it lands, and [[DOC-56]] (the system-KB document the assistant reads) is
generated from it.

## Wanted

A command — `1c fonts catalogue` — that rebuilds the catalogue from upstream, and a second
that projects [[DOC-56]]'s body from it.

### Sources

- `https://fonts.google.com/metadata/fonts` — the live family list with `category`,
  `stroke`, `classifications`, `fonts` (weights/styles), `axes`, `subsets`, `designers`,
  `dateAdded`, `popularity`, `isNoto`.
- `github.com/google/fonts` — licence, read from **each family's own `METADATA.pb`**.

### Licence must not be resolved by directory join

The one-off script joined the live family list to the repo's licence directories
(`ofl/`, `apache/`, `ufl/`, `cc-by-sa/`) on a normalised slug. **Six families failed**: the
`Edu *` set was renamed upstream, so `Edu NSW ACT Cursive` does not match its directory
`edunswactfoundation`. They were resolved by directory prefix and are marked
`licence_source: prefix-inference` in the committed file.

A silent licence misattribution is the one failure this catalogue must not have, so the
generator reads each family's own `METADATA.pb` rather than inferring from a name. A family
whose licence cannot be determined is **excluded and reported**, never defaulted.

### Delisted families must not be mirrored

The repo carries 2,056 family directories against 1,946 live. The difference is delisted
and sandboxed families. The live list is the authority for what exists; the repo is the
authority for licence.

### Output

1. `fonts/catalogue.json` — one record per family: `family`, `slug`, `licence`,
   `licence_source`, `category`, `stroke`, `classifications`, `weights`, `italic`,
   `variable`, `axes`, `subsets`, `designers`, `date_added`, `popularity_rank`, `is_noto`.
2. `fonts/CATALOGUE.md` — the human summary: counts by licence and category, methodology,
   caveats.
3. **[[DOC-56]]'s body**, regenerated. Only OFL 1.1 and Apache 2.0 families appear there —
   it tells the assistant what it may use, so an excluded family must not be listed.

### Grouping is load-bearing, not cosmetic

KB chunking is heading-anchored, so the heading structure of [[DOC-56]] decides chunk
boundaries and therefore what a retrieval returns. The committed shape — group by category
with Slab Serif, Symbols and Noto split out, then sub-headings of ~22 families ordered by
usage — yields 92 sub-headings and ~90KB, which is ~141KB of embeddings against a
bundle-resident index whose whole current corpus is 548KB. A chunk per family would add
~2.9MB and is not affordable.

A retrieval should return **a slate of candidates to choose among**, not one family, so
groups stay at roughly this size.

### Reporting

The command says what changed: families added, removed, licence changes, and any family
excluded for an undeterminable licence. A silent refresh hides an upstream removal, which
is the case most likely to break a live site.

## Behaviour

- `1c fonts catalogue` with no upstream reachable fails and leaves the existing catalogue
  untouched — a half-written catalogue is worse than a stale one.
- Re-running with no upstream change rewrites nothing and reports no change.
- A family whose licence cannot be determined is excluded and named in the report.
- Delisted families are dropped from the catalogue and named in the report.
- The generated [[DOC-56]] body contains only OFL 1.1 and Apache 2.0 families.

## Known limit, out of scope here

Upstream carries no **style descriptors** — nothing says "geometric", "humanist" or
"grotesque". Family names are proper nouns and embed poorly for style queries, so a style
query retrieves the category slate rather than a precise match. Enriching entries with
style descriptors is separate follow-up work and must not be done by inventing
descriptions.
