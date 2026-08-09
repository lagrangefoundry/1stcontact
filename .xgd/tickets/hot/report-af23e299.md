---
uid: report-af23e299
id: REPORT-1734
type: report
title: 'Capability-Intent Alignment: Site Delivery: Deploy & Public Serving (level=ac)'
created_by: xgd
created_at: '2026-08-09T10:34:40.439155+00:00'
updated_at: '2026-08-09T10:34:40.439155+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a12e557f
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Delivery: Deploy & Public Serving
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

The capability's matrix elements carry bundle UIDs as `intent_uid` /
`updated_by` rather than individual REQ/BUG UIDs. Both bundles are
`free_and_reconciled`, so every intent inside them counts toward cumulative
intent. Delivery-relevant members are listed individually below.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-13 (`bundle-e0143ffa`) | free_and_reconciled | 2026-08-06, merged at `1ee6aaf` | Umbrella: REQ-108 + REQ-109 + REQ-110 + REQ-111 + REQ-113 + BUG-30 | YES |
| — REQ-110 | via BUNDLE-13 | 2026-08-06 | R2 artifact store + `1c deploy`: ship rendered snapshots to Cloudflare | YES → STORY-94 |
| — REQ-111 | via BUNDLE-13 | 2026-08-06 | public-site Worker: serve draft previews and published sites from R2 (SiteStore seam) | YES → STORY-95 |
| — REQ-113 | via BUNDLE-13 | 2026-08-06 | `1c serve`: extensionless URLs 404 (preview disagrees with production) | YES → STORY-96 |
| — REQ-109 | via BUNDLE-13 | 2026-08-06 | Rendered output relocatable / document-relative asset URLs | YES, but owned by STORY-83 in another capability; consumed here as a dependency |
| — REQ-108, BUG-30 | via BUNDLE-13 | 2026-08-06 | L1 pointer accent; `relativizeUrl` fragment bug | YES, not delivery-scoped |
| BUNDLE-14 (`bundle-0385746c`) | free_and_reconciled | 2026-08-06, merged at `cd8f98c` | Umbrella: BUG-31 + REQ-114 + REQ-116 | YES |
| — BUG-31 | via BUNDLE-14 | 2026-08-06 | `1c deploy --sandbox` wrote into a real site's R2 keyspace; resolved by namespacing per store tree (not by refusal) | YES → STORY-94 (AC-899/924/926), STORY-95 (AC-927) |
| — REQ-114, REQ-116 | via BUNDLE-14 | 2026-08-06 | L1 palette colour model; the edit render | YES, not delivery-scoped |

Level cascade honoured: this is an **ac**-level check, so the three story
bodies are the working reference. Intent history was consulted only to
confirm the provenance of the store-tree ACs (BUG-31), which are the newest
and the only ones added by a second bundle.

## Alignment Ledger

### Matrix shape

| Story | Kind | Status | ACs | In matrix scope? |
|---|---|---|---|---|
| STORY-94 (`story-5349d01f`) | upgrade | updated | 13 | yes — feature/upgrade, ACs expected |
| STORY-95 (`story-d34eccd8`) | upgrade | updated | 14 | yes — feature/upgrade, ACs expected |
| STORY-96 (`story-66115f6b`) | feature | completed | 9 | yes — feature/upgrade, ACs expected |

All 36 ACs are `status=active`, `kind=behavior`, `uat_coverage=pass`.

### STORY-94 — story-body bullet → AC mapping

| Story bullet | AC(s) | Outcome |
|---|---|---|
| One command, two channels | AC-892 (draft), AC-896 (published + live pointer) | aligned |
| Rendering is not optional | AC-894 | aligned |
| The artifact is complete (output + definition) | AC-892 | aligned |
| Shipping scoped to the store tree | AC-924 (keys), AC-926 (index), AC-899 (prune enumeration) | aligned |
| A snapshot nothing can serve says so | AC-925 | aligned |
| Content addressing | AC-893 | aligned |
| Two deploys do not silently overwrite | AC-901 | aligned |
| Previews are not revisions | AC-895 | aligned |
| Publish mints, deploy ships | AC-897 | aligned |
| Rehearsal and cleanup | AC-898 (dry run), AC-899 (prune) | aligned |
| A legible report | AC-900, AC-925 (no-URL terminator) | aligned |

### STORY-95 — story-body bullet → AC mapping

| Story bullet | AC(s) | Outcome |
|---|---|---|
| Two addressing forms, one server | AC-902 (preview), AC-903 (published) | aligned |
| One servable store tree, fixed in the server | AC-927 | aligned |
| The deploy index is the authority on what is servable | AC-905 | aligned |
| The address grammar rejects before it reads | AC-907 | aligned |
| The trailing slash is correctness | AC-904 | aligned |
| Preview privacy by URL, and only by URL | AC-910 | aligned |
| Honest, opaque failure | AC-906 | aligned |
| A read-only surface | AC-912 | aligned |
| Responses typed from what answered them | AC-908 | aligned |
| Freshness policy, and a cache that follows it | AC-909 (policy), AC-911 (cache behaviour) | aligned |
| A reserved first segment | AC-914 | aligned |
| Apex holding response (stated in the out-of-scope clause) | AC-913 | aligned — see finding 1 |

### STORY-96 — story-body bullet → AC mapping

| Story bullet | AC(s) | Outcome |
|---|---|---|
| The mapping (both environments, both addressing forms, full + header-only) | AC-915 (local preview), AC-916 (deployed, both forms, header-only) | aligned |
| Exact matches always win | AC-917 | aligned |
| Extensions are never eligible; only the last segment is examined | AC-918 | aligned |
| A response is typed from the page that answered | AC-920 | aligned |
| A directory-shaped URL is never eligible on the deployed site | AC-921 | aligned |
| No existing guard is loosened | AC-922 (preview confinement), AC-923 (deployed grammar) | aligned |
| The mapping resolves, never invents | AC-919 | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-913 (`acceptance_criterion-08d88be5`) / STORY-95 | story-body-edit | AC-913 pins two behaviours — the apex returns a holding response, and the apex never serves any site's snapshot. The second is squarely inside STORY-95's serving-confinement surface, but the story body mentions the apex **only** in its Out-of-scope clause ("the apex marketing site (the apex is deliberately held back to a holding response)"). The AC is not contradicted by the story — the parenthetical asserts exactly the behaviour AC-913 verifies — but an active, UAT-covered AC is sourced from an exclusion clause rather than an in-scope bullet, which reads as if the behaviour were unowned. | Add an in-scope bullet to STORY-95 stating that the apex address returns a holding response and never serves a site's snapshot, keeping the out-of-scope clause for the apex *marketing site* only |
| 2 | info | exclusivity | AC-924 + AC-926 (STORY-94) | — | Partial overlap: AC-924 ("no index write, no read of the other tree's index") touches AC-926's subject. Judged **not** a duplicate — the story body enumerates three distinct clauses of one bullet ("every key a deploy writes carries it, each tree keeps its own deploy index, and a prune enumerates only the tree being pruned"), and AC-924 / AC-926 / AC-899 map 1:1 onto them. Their verifications differ in channel and fixture: AC-924 deploys a same-slug scratch site on the draft channel and asserts the real tree is untouched; AC-926 deploys revision 1 on the *published* channel and asserts the real site's index bytes, live pointer and revision bytes are unchanged. | none |
| 3 | info | exclusivity | AC-905 + AC-927, AC-906 + AC-910 (STORY-95) | — | Both pairs sit on adjacent surfaces and both explicitly disclaim each other's territory in their own bodies (AC-905: "The tree gate is AC-927's criterion and is proven there"; AC-906: "the two channels differ in exactly one response header: the no-index directive AC-910 requires"). This is deliberate boundary-drawing, not duplication. | none |
| 4 | info | consistency | AC-901 (STORY-94) | — | AC-901 states the lost-update guard as read-compare-write ("if the stored index changed between the moment this deploy read it and the moment it writes"), which matches the narrowed implementation STORY-94's Technical Context records as a known divergence from the intent's compare-and-swap. AC and story body agree; the divergence is documented, not hidden. | none |
| 5 | info | coverage | STORY-94 | — | STORY-94's body explicitly assigns `--json` output hygiene to STORY-79 and relocatable output to STORY-83. No AC under STORY-94 covers either — correct exclusion, not a coverage gap. | none |

## Notes for the Editor

- **No violations and no needs_review at this level.** Every in-scope bullet in
  all three story bodies is addressed by at least one AC, no AC describes
  behaviour its story body excludes, and no two ACs within a story restate the
  same criterion.

- **The store-tree ACs are the newest layer and are well-formed.** AC-899,
  AC-924, AC-925, AC-926 (STORY-94) and AC-927 (STORY-95) all trace to BUG-31
  via BUNDLE-14. They correctly reflect the *chosen* resolution — namespace per
  store tree — rather than the considered-and-rejected alternative of refusing
  to deploy the scratch tree, which STORY-94's Technical Context records. AC-927
  is also correctly stated as a positive confinement property ("never derived
  from a request") rather than as a rejection check, matching STORY-95's
  explicit reasoning for that phrasing.

- **Two ACs are deliberately proven below the end-to-end boundary, and both say
  so in their own bodies.** AC-914 (reserved preview segment) notes the
  collision is unreachable through the deploy command today because rendered
  output is flat, so it is proved at the gate's own entry point; AC-918 and
  AC-908 note that shapes the flat render cannot emit may be seeded into a
  snapshot directly. These are transparent, in-body scope statements consistent
  with their story bodies (STORY-95: "Standing invariant, not currently
  reachable"), not evidence gaps hidden at AC level. They are worth re-checking
  at **uat** level, where whether the test exercises a real entry point is the
  governing question.

- **Marginal, not raised as a finding:** STORY-96's mapping bullet says the
  behaviour holds "for full and header-only requests alike"; AC-916 pins
  header-only explicitly on the deployed site, while header-only in *local
  preview* is covered only through AC-920's content-type assertion. If the
  editor is touching STORY-96 anyway, widening AC-916 or AC-920 to state
  local-preview header-only status explicitly would close the last gap. Not a
  coverage violation — the behaviour is asserted, just distributed.

- **Tooling note (not a matrix finding):** `xgd ticket list --filter` and
  `xgd ticket query` were unusable throughout this check — both force a cold
  index rebuild and time out after 30s on the exclusive flock at
  `main/.xgd/_locks/__cold_index__.flock`, which PID 28114 (the port-5555
  dashboard server) holds near-continuously. `xgd ticket get` and
  `xgd ticket children` work normally. Story and AC enumeration for this report
  was therefore done by reading `.xgd/tickets/{hot,cold}/index.json` for UIDs,
  with every ticket's authoritative content then fetched through
  `xgd ticket get --json`. No matrix conclusion rests on the index files.
