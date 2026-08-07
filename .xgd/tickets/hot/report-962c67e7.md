---
uid: report-962c67e7
id: REPORT-1609
type: report
title: 'Capability-Intent Alignment: Site Asset Store: What This Site Can Reference
  (level=story)'
created_by: xgd
created_at: '2026-08-07T19:00:18.374322+00:00'
updated_at: '2026-08-07T19:00:18.374322+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-105cfacf
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Asset Store: What This Site Can Reference
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Headline

**CAP-88 is a retired capability with an empty story tree, and that is the correct
end state — not drift.** Attempt 1's fix (REPORT-1608, `report-84177029`) retired it
exactly as REPORT-1599 finding 3 prescribed:

```
capability-105cfacf  status: superseded
                     superseded_by_uid: capability-b4ac88fc  (CAP-89)
```

Its sole story, STORY-102, carries `fields.capability_uid = capability-b4ac88fc` on the
ticket itself, and its entire scope was absorbed losslessly into CAP-89's
`### The site asset store` section before retirement. There is no matrix element left
under CAP-88 that could be misaligned with intent, and no intent whose asked behaviour
has been stranded by the retirement.

## Verification performed (index deliberately distrusted)

`xgd ticket list --filter fields.capability_uid=capability-105cfacf` still returns
STORY-102. **That result is stale index residue, not the truth** (see warning 1). The
zero-story claim was therefore re-derived from authoritative ticket state:

- All **25** stories fetched individually with `xgd ticket get --json`; every
  `fields.capability_uid` read off the ticket. **Zero** point at `capability-105cfacf`.
  Four point at `capability-b4ac88fc` (STORY-92, 93, 97, 102).
- No acceptance criterion or UAT references `capability-105cfacf`; the six ACs
  AC-1018…AC-1023 hang off STORY-102, which never changed parent story, so no AC
  reassignment or `test_UAT_AC<n>_*` rename is implicated.
- Retirement bookkeeping matches the established precedent: all five retired
  capabilities in this consolidation (CAP-80, 81, 83, 84, 88) carry
  `status=superseded` + `superseded_by_uid` and **no** prose marker in the body. CAP-88
  is consistent with its siblings; the absence of a prose "superseded by" note is the
  convention, not an omission.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability's (now migrated) tree:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-11 (`request-53c276dd`) | free_and_reconciled | 2026-06-30 | `1c` structured-edit CRUD incl. the original **registry-only** `asset list` | YES (superseded in place by REQ-118) |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | 2026-07-31 (merged `b2b9208c`) | Replaced the registry-only listing with the **union** of registry + `draft/assets/` (`listSiteAssets`), per-entry provenance `{onDisk, registered}`, one `/assets/<name>` handle vocabulary, derived `kind`, and the independent `GET /api/assets` origin route. Explicitly rejected a second "pickable" listing. | YES — sole originating intent for this scope |

REQ-118 §3 is unambiguous that this **replaces a partial truth rather than adding a
second one**: *"`editAssetList` (`1c asset list`) now returns this union rather than the
registry alone."* No later intent in the 50-request ledger retires, narrows or re-homes
the asset store. Nothing in the ledger is left unexpressed by the retirement.

The consolidation of CAP-88 into CAP-89 was **not** driven by an intent ticket — it came
from this regression run's own structural pass (REPORT-1573 `structural_rebalance`,
REPORT-1576 `overlap_resolution` cluster 2, REPORT-1599 finding 3). That is process
bookkeeping over the matrix, not a change to product intent, which is why no intent
ledger entry retires REQ-118's behaviour.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-88 (`capability-105cfacf`) | REQ-11, REQ-118 (both via STORY-102, now migrated) | **retired** — `superseded` → CAP-89; scope absorbed losslessly; 0 stories, 0 ACs, 0 backlinks. Correct end state. |
| STORY-102 (`story-c46abfa6`) | REQ-118 | **not under this capability** — `capability_uid = capability-b4ac88fc`. Aligned and evidenced under CAP-89 (REPORT-1599, PASS; `uat_coverage=pass`). Out of scope for this check. |

### Coverage of REQ-118 after retirement — nothing stranded

Each CAP-88 scope bullet, traced into CAP-89's body (verified by reading CAP-89 at
`updated_at 2026-08-07T18:54:21`):

| CAP-88 scope statement | Present in CAP-89? |
|---|---|
| One listing, many consumers (operator / builder origin / editing surface) | yes — verbatim in substance |
| Union of the two disagreeing sources, merged by handle, with provenance | yes — incl. "an undeclared file is visible as an undeclared file and a declared asset with no file is visible as a missing one" |
| One handle vocabulary | yes — added by the attempt-1 fix (was previously stranded) |
| Usage kind, so a caller can narrow | yes — added by the attempt-1 fix |
| Reachable without any editing gesture | yes — added by the attempt-1 fix |
| Out of scope: uploading / importing / converting / processing | yes — added by the attempt-1 fix |
| Out of scope: licence & provenance (was "CAP-80") | yes — now a **sibling section** of CAP-89 rather than a foreign capability |
| Out of scope: serving bytes to a page (CAP-70) | yes — "Binding an asset handle to its served substance… also the framework substrate" |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | canonical ticket search index | — (tooling, not a matrix edit) | `xgd ticket list --type story --filter fields.capability_uid=capability-105cfacf` still returns STORY-102, whose authoritative `fields.capability_uid` is `capability-b4ac88fc`. Reproduced independently this run. Previously raised as REPORT-1599 finding 4 and forwarded as `needs_review` by REPORT-1608; **still unresolved**. Any consumer that walks the matrix by capability double-counts STORY-102 and sees a phantom story under a retired capability. | Rebuild the index from `xgd-working` (`xgd ticket rebuild-index`). It refuses to run from a branch worktree by design, so it cannot be fixed from this regression worktree. No ticket-body change required. |
| 2 | info | coverage | CAP-88 (`capability-105cfacf`) | — | Zero stories under a `superseded` capability is the correct post-retirement state, not a coverage gap. The attempt-1 fix correctly declined to author a replacement story. | none |
| 3 | info | exclusivity | CAP-88 vs CAP-89 `### The site asset store` | — | The two bodies describe the same scope. This is intended: a superseded capability's body is a historical record and its successor restates the scope. Not an exclusivity violation between two *live* elements. | none |
| 4 | info | consistency | CAP-88 body | — | Body reads as an active capability description with no prose "superseded by CAP-89" note. Consistent with all four sibling retirements (CAP-80/81/83/84), which likewise carry only the `superseded_by_uid` field. `superseded_by_uid` is the schema's single declared retirement field (`ticket_types.yaml`, `required_when: status == superseded`). | none — do not invent a prose convention |

## Notes for the Editor

**No edits are required at this level. Do not re-open CAP-88.** The one open item
(warning 1) is an XGD tooling defect that cannot be repaired from a regression worktree
and has already been escalated to the operator twice. Re-classifying it as
`needs_review` would fail this level and spin a fix loop with no available action —
which is why it is recorded as a warning here.

**Where the live alignment work actually sits.** CAP-88's subject matter is now
governed by CAP-89, whose story-level check has already passed (REPORT-1599,
`report-b25ab3de`: PASS, 0 violations, 4 warnings). Two of those warnings still stand
and belong to CAP-89's ledger, not this one:

- STORY-102's body twice defers licence/provenance to "CAP-80" as a *neighbouring
  capability*; CAP-80 is now a retired sibling section inside CAP-89. Stale pointer,
  correct substance.
- CAP-89's provenance section says "every asset file of a governed kind" where the
  implementation governs **fonts only**.

**A caution for whoever runs the next structural survey.** Until the index is rebuilt,
capability→story queries will keep resurfacing STORY-102 under CAP-88 and manufacturing
this exact phantom. Validate any capability→story edge against `xgd ticket get --json`
on the story before treating it as real; `xgd ticket list --type capability --json` also
omits `superseded_by_uid` entirely, which is how CAP-83's half-retired state stayed
invisible through an earlier pass.
