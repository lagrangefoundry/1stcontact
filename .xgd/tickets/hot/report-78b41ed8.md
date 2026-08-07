---
uid: report-78b41ed8
id: REPORT-1611
type: report
title: 'Capability-Intent Alignment: Site Asset Store: What This Site Can Reference
  (level=uat)'
created_by: xgd
created_at: '2026-08-07T19:11:29.281598+00:00'
updated_at: '2026-08-07T19:11:29.281598+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-105cfacf
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Asset Store: What This Site Can Reference
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Headline

**CAP-88 has no UAT check set, because it has no AC tree, because it has no story
tree — it is a retired capability.** Consistency, coverage and exclusivity hold
vacuously at uat level. This is the correct post-retirement end state, not drift.

Authoritative state, read off the ticket itself (`xgd ticket get --json`), not the
search index:

```
capability-105cfacf  status: superseded
                     superseded_by_uid: capability-b4ac88fc   (CAP-89)
                     stories: 0    acceptance criteria: 0    UATs: 0
```

The story-level cycle (REPORT-1609 `report-962c67e7`, PASS) and the ac-level cycle
(REPORT-1610 `report-5746c198`, PASS) both reached this same conclusion. Per the
level cascade, those upper-layer results are my working reference; nothing found at
uat level forces me to reopen either.

## Verification performed (index deliberately distrusted, re-derived this run)

REPORT-1599 finding 4 / REPORT-1609 warning 1 / REPORT-1610 warning 1 established
that the canonical search index is stale for this capability. It still is: this run's
`xgd ticket list --type story --filter "fields.capability_uid=capability-105cfacf"`
returned **STORY-102**, whose own ticket says `capability_uid: capability-b4ac88fc`.
I therefore built no check set from `--filter`. Every claim below is re-derived by
fetching tickets individually:

- **All 25 story tickets fetched individually**, `fields.capability_uid` read off each.
  **Zero** point at `capability-105cfacf`. Four point at `capability-b4ac88fc`
  (STORY-92, STORY-93, STORY-97, STORY-102) — including STORY-102, the story the stale
  index still mis-attributes to CAP-88.
- **All 50 acceptance-criterion tickets fetched individually.** Every `story_uid`
  resolves to a live story — **zero orphans**. They parent as STORY-92 (12),
  STORY-93 (8), STORY-97 (9), STORY-98 (13), STORY-102 (6), STORY-101 (2).
  **No AC field or body string mentions `capability-105cfacf` or `CAP-88`.**
- Therefore **no test in the repository is reachable from CAP-88** by the
  story → AC → `test_UAT_AC<n>_*` chain that defines the uat-level check set.

The check set is empty by direct enumeration, not by an empty query result.

## Cumulative Intent Considered

Both intents that ever touched this capability's (now migrated) tree, re-verified
this run:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-11 (`request-53c276dd`) | free_and_reconciled | 2026-06-30 | `1c` structured-edit CRUD, including the original **registry-only** `asset list` | YES — superseded in place by REQ-118 |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | 2026-07-31 (merged `b2b9208c`) | Replaced the registry-only listing with the **union** of registry + `draft/assets/`; per-entry provenance; one `/assets/<name>` handle vocabulary; derived usage `kind`; independent `GET /api/assets` origin route (AC-7). Explicitly rejected a second "pickable" listing. | YES — sole originating intent for this scope |

No later intent retires, narrows or re-homes the asset store. CAP-88's consolidation
into CAP-89 was process bookkeeping from this regression run's own structural pass
(REPORT-1573 → REPORT-1576 cluster 2 → REPORT-1599 finding 3 → REPORT-1608 fix), not
a change to product intent — which is why no ledger entry retires REQ-118's asks.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-88 (`capability-105cfacf`) | REQ-11, REQ-118 (both via STORY-102, migrated) | **retired** — 0 stories, 0 ACs, 0 UATs. Empty uat-level check set. Correct end state. |
| — (no UAT reachable from CAP-88) | — | nothing to assess at this level |

### Nothing stranded at UAT level by the retirement

REQ-118's asks are carried by six **active** ACs, all `uat_coverage=pass`, all
parented to STORY-102 — which sits under **CAP-89**, where the uat level has already
been assessed and passed (REPORT-1605 `report-323f3682` PASS, then UAT coverage
REPORT-1606 `report-ddccacb5` PASS):

| CAP-88 scope statement (retired body) | AC now carrying it | UAT proving it |
|---|---|---|
| Union of the two disagreeing sources, with provenance | AC-1018, AC-1019 | `test_UAT_AC1018_…`, `test_UAT_AC1019_…` |
| One handle vocabulary | AC-1020 | `test_UAT_AC1020_…` |
| Usage kind, so a caller can narrow | AC-1021 | `test_UAT_AC1021_…` |
| Reachable without any editing gesture | AC-1022 (command line), AC-1023 (builder origin + missing-site caller fault) | `test_UAT_AC1022_…`, `test_UAT_AC1023_…` |

All six live in `tests/reconciliation-site-asset-listing.test.ts` and belong to
CAP-89's check set, not this one. Because the migration is recent, I confirmed the
underlying evidence is real and green rather than assuming it — `npx vitest run
tests/reconciliation-site-asset-listing.test.ts`: **6 passed, 0 failed** (753ms).
They drive real entry points with nothing internal stubbed — the CLI through
`run(argv)` into `editAssetList` → `listSiteAssets`
(`tools/generate/src/cli/edit.ts:781`, `:749`) and the builder origin over real HTTP
through `startBuilder` into `GET /api/assets`
(`tools/generate/src/cli/builder.ts:205`). Re-assessing them here would be a
duplicate assessment filed against the wrong subject.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | canonical ticket search index (XGD tooling) | — (not a matrix edit) | `xgd ticket list --type story --filter "fields.capability_uid=capability-105cfacf"` still returns STORY-102, whose own ticket has `capability_uid: capability-b4ac88fc` since `updated_at 2026-08-07T18:45:19`. Third consecutive level at which the index has misreported this capability (REPORT-1599 f4, REPORT-1609 w1, REPORT-1610 w1). | Reindex; until then, any check on a recently-migrated capability must re-derive its tree with `xgd ticket get --json` per ticket rather than trusting `--filter`. No ticket edit required. |

**PASS**: 0 violations, 0 needs_review.

## Notes for the Editor

**1. The stale index is now a standing hazard, not an incident.** It has produced a
false non-empty check set at all three levels of this capability's validation. A
downstream consumer that trusts `--filter` would have assessed STORY-102's six ACs
against CAP-88 and filed the result under a retired subject. The mitigation is
mechanical (fetch each ticket) and cheap; the failure mode is silent.

**2. One observation belonging to CAP-89, recorded here so it is not lost.** While
confirming the evidence was green, I noticed a boundary that AC-1020's criterion text
does not state. AC-1020 says *"Every entry's handle is the single site-local reference
form a page already uses… regardless of how its source named it."* The implementation
(`assetHandle`, `tools/generate/src/cli/edit.ts:713`) deliberately passes an
already-complete reference through untouched, and
`test_UAT_AC1020_…` (`tests/reconciliation-site-asset-listing.test.ts:301-311`) asserts
exactly that: a registry entry naming `https://cdn.example/far.png` is listed under
that handle, not under `/assets/https://cdn.example/far.png`. The behaviour is correct
and well-reasoned — prefixing would manufacture a handle no page holds — but the AC's
unqualified "every entry" over-claims relative to it.

This is **out of scope for this report** (`subject_uid` is CAP-88; AC-1020 hangs off
CAP-89) and is filed as an observation, not a finding. If pursued, it is an `ac-edit`
on AC-1020 (`acceptance_criterion-cd61874f`) adding the carve-out, under CAP-89 —
whose uat level has already passed, so this would be opportunistic rather than
blocking.

**3. Exclusivity: an overlap that is not a duplicate.** REQ-118's free-coded tests
`test_UAT_FC_REQ-118_the_asset_listing_is_callable_independently_of_the_modal`
(`tests/req118-image-selection.test.ts:341`) and
`test_UAT_FC_REQ-118_the_asset_store_is_reachable_without_opening_a_modal` (`:461`)
cover ground adjacent to AC-1022 and AC-1023. They are not redundant: they run a
different fixture state (registry declares one file of five, `hero` unregistered)
against the reconciled UATs' three-declaration registry including a declared-but-absent
`ghost`. Both sets earn their keep. Noted so a future exclusivity pass does not delete
one on a name-similarity reading.
