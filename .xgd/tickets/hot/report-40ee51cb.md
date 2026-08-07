---
uid: report-40ee51cb
id: REPORT-1607
type: report
title: 'Capability-Intent Alignment: Site Asset Store: What This Site Can Reference
  (level=story)'
created_by: xgd
created_at: '2026-08-07T18:50:25.473855+00:00'
updated_at: '2026-08-07T18:50:25.473855+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-105cfacf
  level: story
  violations: 1
  warnings: 0
  needs_review_count: 0
  anchor_report_uid: report-17a279f7
---

# Capability-Intent Alignment: Site Asset Store: What This Site Can Reference
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 0
**Needs review**: 0

Anchor report: report-17a279f7. Previous attempts: 0.

## Headline

**CAP-88 holds zero stories.** Its only story, STORY-102, was reassigned to CAP-89
during this run's consolidation (commit `4d47c96f2`, 2026-08-07 08:26:44, seven
seconds after CAP-89 was created in `ec6256a06`). CAP-88 remains `status: active`
with **no `merged_into`**, so it is an active capability asserting a scope for
which it carries no story, no AC and no UAT — while the identical scope is
restated inside CAP-89 and evidenced there.

The intent this capability describes (REQ-118) is fully expressed in the matrix —
just not under *this* capability. So this is not missing behaviour; it is a
capability that should have been retired by the consolidation and was not.

> **⚠️ To the editor: the repair is NOT to author a story here.** Authoring an
> asset-store story under CAP-88 would create a second description of behaviour
> STORY-102 already covers — exactly the duplication the consolidation removed.
> The repair is capability retirement. See "Notes for the Editor".

## Cumulative Intent Considered

CAP-88 itself carries no `intent_uid`; it was authored by a structural-rebalance
pass (`740de5c86`, 2026-08-06 22:25:37), not by an intent ticket. The only intent
that ever reached its tree is the one on its (now departed) story.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-118 | request-66e4c630 | free_and_reconciled | merged `b2b9208c` | Image selection: one `listSiteAssets` union listing (registry ∪ `draft/assets/`), per-entry provenance (`onDisk`/`registered`), `/assets/<name>` handle vocabulary, `kind` derived from extension, `GET /api/assets` reachable without a modal; supersedes the registry-only listing in place | YES |
| REQ-117 | request-395b67e6 | free_and_reconciled | — | Prerequisite (`depends_on` of REQ-118): the copy-edit loop REQ-118 reuses. Adds no asset-store behaviour of its own | YES (context only) |

No intent in the ledger is retired, abandoned or imminent. Nothing REQ-118 asked
for has been withdrawn by a later intent.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-88 story tree | — | **empty**: 0 stories, 0 ACs, 0 backlinks (`links: []`), no `uat_coverage` field |
| STORY-102 (story-c46abfa6) | REQ-118 | **not an element of this capability** — `fields.capability_uid = capability-b4ac88fc` (CAP-89). Aligned, and validated under CAP-89 by REPORT-1599 (PASS, 0 violations) |
| AC-1018 … AC-1023 | REQ-118 | Attached to STORY-102, i.e. under CAP-89. Untouched by the reassignment |
| CAP-88 body vs CAP-89 `### The site asset store` | REQ-118 | **duplicate scope prose**: the same five points (union of two disagreeing sources; provenance per entry; one handle vocabulary; usage kind; reachable without an editing gesture) in the same order in both bodies |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | capability-105cfacf (CAP-88) | story-body-edit (capability retirement — see note) | CAP-88 is `status: active` with zero stories. REQ-118 (free_and_reconciled, merged `b2b9208c`) is the only intent its tree ever carried, and its behaviour now lives entirely under CAP-89/STORY-102 after `4d47c96f2` reassigned `capability_uid` from `capability-105cfacf` to `capability-b4ac88fc`. Nothing under CAP-88 expresses the scope CAP-88's body claims, and CAP-89's `### The site asset store` restates that scope point for point — so the capability is both uncovered and duplicative. | Retire CAP-88 the way CAP-64/65/66/67/68/69/72/73 were retired: set `fields.merged_into = capability-b4ac88fc` and `status = deprecated`. Do **not** author a replacement story. |
| 2 | info | — | STORY-102 / CAP-89 | — | The reassignment itself is correct and already independently confirmed: REPORT-1576 (`report-fbeb5fec`, cluster 2) resolved `confirm`, and REPORT-1599 validated CAP-89 at story level as PASS. Re-verified here from `xgd ticket get` and from `git show 4d47c96f2`, not taken on those reports' word. | none |
| 3 | info | — | ticket index | — | The canonical index returns STORY-102 for **both** `fields.capability_uid=capability-105cfacf` and `=capability-b4ac88fc`, contradicting the ticket's own field. Independently reproduced here, including the control query (`capability-deadbeef` → no tickets), so the filter is not leaky — it is stale residue from the reassignment. This is why this validation was scheduled against CAP-88 at all. | none in the matrix; see Notes |

## Notes for the Editor

### The required action shape is not in the category vocabulary

Finding 1 is tagged `story-body-edit` only because that is the nearest available
category; the vocabulary in this check has no `capability-deprecate` shape. The
action required is at the **capability** level, not the story level:

```
merged_into: capability-b4ac88fc
status: deprecated
```

This is not a novel judgement — it is the shape this project already applied to
the previous consolidation round. CAP-66 (`merged_into: capability-aa030c83`) and
CAP-72 (`merged_into: capability-ae9d65d6`) are both `deprecated` with the field
set. The 2026-08-07 consolidation that produced CAP-89 performed the story moves
but skipped this step for **all five** absorbed capabilities.

### This is one defect, five times over

CAP-88 is not alone. REPORT-1574's overlap survey (clusters 1–5) records the same
residue on:

| Capability | Absorbed into | Story that left |
|---|---|---|
| CAP-81 (capability-ccac1b1d) | CAP-89 | STORY-93 |
| **CAP-88 (capability-105cfacf)** | **CAP-89** | **STORY-102** |
| CAP-80 (capability-745b9a6c) | CAP-89 | STORY-92 |
| CAP-83 (capability-e382c142) | CAP-89 | STORY-97 |
| CAP-84 (capability-25f7e486) | CAP-87 | STORY-98, STORY-101 |

If this run repairs CAP-88 in isolation, the other four will surface the same
finding one capability at a time. They are one edit repeated five times and are
better done together.

Two of the four carry an extra loss that CAP-88 does not, and that a bare
retirement would make permanent — worth checking before deprecating them:

- **CAP-83** states an explicit boundary against CAP-70 for the palette model;
  CAP-89 does not carry it.
- **CAP-84** is still cited as a live owner in sibling story prose ("the editable
  render belongs to CAP-84" in STORY-99; "Depends on the edit rendering (CAP-84)"
  in STORY-101).

CAP-88's own boundary prose — the "deliberately held apart from CAP-80 and CAP-70"
argument — is likewise stranded, but CAP-89's `### The site asset store` section
preserves its substance, so no scope statement is lost by deprecating CAP-88.

### Escalation: stale canonical ticket index (finding 3)

Not fixable from here and not a matrix edit. `xgd ticket rebuild-index` refuses to
run from a branch worktree by design, and forcing `--branch main` would mutate the
canonical store from a regression worktree — precisely what that guard prevents.
**It needs a rebuild from `xgd-working`.**

This is load-bearing beyond bookkeeping: the overlap survey's inputs *are* these
capability→story queries, so stale entries can manufacture phantom overlaps, and a
capability with zero real stories can be scheduled for story-level validation as if
it had one. REPORT-1576 flagged the same thing; it is recorded again here because
it remains unfixed and it shaped this run's scope. Left unrepaired per this check's
read-only constraint.

### Verification performed

Read-only throughout; no ticket, test or code was modified. Every claim above was
checked against the ticketing API (`xgd ticket get --json`, authoritative fields)
and against git history (`git show 4d47c96f2 ec6256a06 740de5c86`) rather than
against `xgd ticket list --filter`, which is the surface known to be stale.
REPORT-1596's fix-report claims were not relied on for anything in this report.
