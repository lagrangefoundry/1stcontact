---
uid: request-9cb17465
id: REQ-311
type: request
title: The font catalogue has no generator — it cannot be refreshed or trusted to
  stay current
created_by: EPIC-21
created_at: '2026-09-23T03:18:31.288893+00:00'
updated_at: '2026-09-23T18:27:26.800540+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  epic_parent: epic-b9b27697
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-0e70aa37
  story_points: 5
  commits:
  - working_sha: 00675d47ba672e45c84e15bf54f26c6abd9c8d36
    reconcile_sha: null
    main_sha: null
  - working_sha: 8b6319652f9cbfcb4b83a11c6c561c4f2fde114d
    reconcile_sha: null
    main_sha: null
  version: 0.2.343
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
---

## What was built

Two commands, deliberately separate. The catalogue is the evidence and [[DOC-56]] is the
advertisement, so a refresh can be inspected and committed before the thing that tells the
assistant what it may serve moves.

### `1c fonts catalogue [--json] [--metadata <url|file>] [--repo <url|dir>]`

Rebuilds `fonts/catalogue.json` and `fonts/CATALOGUE.md`. Existence comes from the live
family list; licence comes from each family's own `METADATA.pb`. `--metadata` and `--repo`
point the same build at a saved snapshot of the live list or at a checkout already on disk,
so a refresh can be re-run and inspected without pulling the sources again.

**How the ~2,031 `METADATA.pb` files are read.** A blobless partial clone
(`--filter=blob:none --no-checkout --depth 1`) followed by a sparse checkout naming only
`METADATA.pb` — ~5 MB and a couple of seconds, against a repository of many gigabytes of
font binaries, and against the two thousand round trips that fetching them individually
would be. It needs `git` on PATH; a clone that fails says so and writes nothing.

**The join is on the name each `METADATA.pb` declares for itself.** `licence_source`
records that file's repo-relative path (`ofl/roboto/METADATA.pb`) rather than a word for a
kind of guess — there are no guesses left to name, and a path is checkable. Two files
declaring one family name is not resolved by order: both are dropped and the family falls
out as undeterminable.

**The renamed `Edu` families are excluded, as the rule requires.** Reading each family's own
`METADATA.pb` does not rescue them — their repository directories still carry the
pre-rename names, and the live service serves `Edu NSW ACT Cursive` from a directory that
does not exist in `google/fonts` at all. Six live families therefore leave the catalogue and
are named in the report and in the file's own caveats. 1,946 live → **1,940 catalogued**,
**1,935** in [[DOC-56]].

**`classifications` and `subsets` are sorted.** Upstream's order for both is unstable
between responses, and an unsorted copy would make every refresh a diff — which would
defeat the no-change-no-write rule below. `designers` is *not* sorted: attribution order is
upstream's own statement about who did what.

**`retrieved` only advances when the records changed**, so a refresh that found nothing new
leaves both files byte-identical and produces no commit.

### `1c fonts doc [--json] [--stdout]`

Projects [[DOC-56]]'s body from `fonts/catalogue.json` and writes it into the document.

**The target is found by what it declares** — the system-KB `doc` ticket carrying
`fields.source: fonts/catalogue.json` — not by a hard-coded uid, so the generator and the
document agree by construction. No such document, or more than one, is a refusal rather
than a guess. `--stdout` prints the body instead of writing it.

**Only OFL 1.1 and Apache 2.0 families appear.** The five UFL 1.0 families stay in the
catalogue and out of the document: their modification terms are cleared per family, and the
document is read as permission.

**Group assignment is ordered, and the order is the rule**: Symbols, then Noto, then Slab
Serif, then category. A Noto symbol font is a symbol font; a slab upstream files under
`Display` is still found by a slab query. Slab Serif comes from upstream's `stroke`, which
is not its `category`.

**An unchanged document is not rewritten.** The ticket store strips trailing whitespace on
write, so the comparison normalises it — a byte comparison would call every run a change
and commit the document on every invocation.

## Test plan

`tests/test_UAT_FC_REQ-311_font_catalogue_generator.test.ts`, driven through the CLI's real
entry point against fixture sources on disk (a saved metadata document and a
checkout-shaped directory) so the parse, join, writes and exit code are exercised without
depending on Google's uptime:

1. the catalogue is rebuilt from upstream, carrying every field of the record shape;
2. licence is not resolved by directory name — a directory whose slug disagrees with the
   family name still resolves, and a family no `METADATA.pb` declares is excluded and named;
3. delisted families are dropped and reported, and additions are reported;
4. unreachable upstream — on either side — fails and leaves the existing catalogue byte-identical;
5. an unchanged refresh rewrites nothing, including `retrieved`; a real licence change is named;
6. the projected document carries only servable families, splits Slab Serif / Symbols / Noto
   out of category, and breaks each group into sub-headings of 22 by usage;
7. the document is written once and not again;
8. the document target is resolved by its declared source, and zero or two candidates refuse.