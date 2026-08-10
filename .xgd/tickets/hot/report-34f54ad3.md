---
uid: report-34f54ad3
id: REPORT-1750
type: report
title: 'Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets,
  Provenance & Palette (level=ac)'
created_by: xgd
created_at: '2026-08-10T07:59:01.748406+00:00'
updated_at: '2026-08-10T07:59:01.748406+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-b4ac88fc
  level: ac
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

Anchor report: report-69e94af9. Previous attempts: 0.

## Cumulative Intent Considered

Level is `ac`, so story bodies are the working reference and intent history is
consulted only for provenance. The ledger below is recorded as the
drift-prevention artifact; no story body was found internally inconsistent, so
no finding below rests on intent-history interpretation.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-11 (bundle-ee56a66e) → REQ-101 | free_and_reconciled | 2026-08-05 (merged f9a415a) | No font-acquisition path or licence provenance: font registry + `1c fonts` check → STORY-92 | YES |
| BUNDLE-11 (bundle-ee56a66e) → REQ-102 | free_and_reconciled | 2026-08-05 (merged f9a415a) | `1c new` scaffolds no L1 document: authored sites start from nothing → STORY-93 | YES |
| BUNDLE-14 (bundle-0385746c) → REQ-114 | free_and_reconciled | 2026-08-06 (merged cd8f98c) | L1 palette colour model (literal base, palette overlay) + retrofit existing sites → STORY-97; also `updated_by` on STORY-93 (colour provenance moved off the retired theme colour group) | YES |
| REQ-118 (request-66e4c630) | free_and_reconciled | 2026-07-31 (merged b2b9208) | Image selection: click image segment → asset picker → structured src edit; the asset-store listing half landed here → STORY-102 | YES |

Bundle members not touching this capability (BUG-27, REQ-94, REQ-96–100,
REQ-103–107, BUG-28, BUG-31, REQ-116) are recorded here as scanned and
out-of-tree; none of them adds behaviour this capability should be expressing.

## Alignment Ledger

All four stories are `story_kind: feature`, so all are Capability-Matrix stories
expected to carry ACs. All 36 ACs across the capability are `status: active`,
`kind: behavior`.

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-102 (story-c46abfa6) — asset store, 6 ACs (AC-1018…AC-1023) | REQ-118 | aligned — every in-scope bullet of the story body has an AC; the three deliberate no-AC decisions the body records (no label/thumbnail, no assertion that the editing surface calls the route, licence obligations held in STORY-92) are honoured, with no AC asserting any of them |
| STORY-93 (story-86c7c21b) — authoring start point, 8 ACs (AC-869…AC-876) | REQ-102, REQ-114 (`updated_by`) | aligned — the story's five load-bearing properties map 1:1 (AC-869 complete+valid document, AC-870 renders, AC-871 screenshots, AC-872 ladder = capture ladder, AC-873 hex literals + no palette, AC-874 flowed root, AC-875 one shape / no opt-in, AC-876 wholesale import replacement). AC-873 correctly restates colour provenance after REQ-114 retired the theme colour group, matching the story's Technical Context |
| STORY-92 (story-8685be2d) — font provenance, 12 ACs (AC-857…AC-868) | REQ-101 | aligned — record contract (AC-857), all four failure kinds (AC-858 unregistered-family, AC-859 unregistered-file, AC-860 unprovenanced-file, AC-861 redistribution), advisory channel (AC-863), distribution marker (AC-862), report + machine-readable form (AC-867, AC-868), record integrity as hard error (AC-864). The three divergences the body records as deliberately un-asserted (invalid definitions skipped by the reference join; commercial-use and self-hosting recorded but not gated; the cosmetic pass line) correctly have no AC written against them, and no AC asserts an acquisition verb the body puts out of scope |
| STORY-97 (story-5e7eb0c5) — colour census & palette retrofit, 10 ACs (AC-932, AC-939…AC-947) | REQ-114 (depends on STORY-80 / bundle-ab9e0cb6, framework-substrate capability) | gap: exclusivity — AC-932's two substantive claims are already carried by AC-941 and AC-944 (finding 1). The remaining nine ACs cover the body's five in-scope bullets cleanly: census human (AC-939) and machine-readable (AC-940), the write and its report (AC-941), exact alpha collapse (AC-942), hue-family ramp grouping with the vivid/near-neutral split and the unclustered singleton (AC-943), lossless proof (AC-944), refuse-and-write-nothing (AC-945), reproducible naming and `--names` renaming (AC-946), re-runnability (AC-947) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | exclusivity | AC-932 (acceptance_criterion-9f1e7baf) under STORY-97 | ac-edit | AC-932's two substantive claims are both already criteria elsewhere in the same story. Claim (a) "the number of entries is materially smaller than the number of distinct colours the site used" is verbatim the same criterion as AC-941 bullet 1 ("adds a site-level palette … whose entry count is materially smaller than the site's distinct colour literal count (a palette, not a colour list)"), including the verification shape (compare declared palette size against pre-conversion distinct-colour count). Claim (b) "every colour the site painted before the conversion is still painted after it, and no new colour appears" is a strictly weaker form of AC-944, which asserts byte-identical render before/after **and** that every reference resolves back to exactly the literal it replaced including opacity. Only one clause of AC-932 is unique — "Sites with no L1 colour axes carry no palette at all and remain valid", the vacuous-retrofit case the story body records for `1stcontact` and `harbor-cafe`; it is covered by no other AC (AC-939 covers the zero-colour *census*, AC-945 covers refuse-on-failure, neither covers a zero-colour retrofit no-op) | Narrow AC-932 to its one non-duplicated criterion: a site whose definition carries no colour literals retrofits as a valid no-op — no palette is written, the definition still validates, and the command does not fail. Drop the "materially smaller" claim (owned by AC-941) and the colour-losslessness claim (owned by AC-944), retitling accordingly. Do not simply deprecate AC-932 without first folding the zero-colour clause somewhere, or coverage of the vacuous case is lost |
| 2 | warning | consistency | AC-932 (acceptance_criterion-9f1e7baf) under STORY-97 | ac-edit | AC-932 bakes frozen repo-state numbers into a criterion: "the two stored sites carrying L1 pages landed at 6 entries from 16 distinct RGB and 8 entries from 30." STORY-97's Technical Context explicitly rules this out as capability surface — "The census measures the definition as it stands; the durable property is the method and the collapse (distinct RGB strictly fewer than distinct literals), not the frozen counts" — and records that the same drift already happened once, when REQ-114's AC7 froze DOC-23 §5.3's 17/15 and the site moved to 18/16. A criterion pinned to today's site contents fails the moment a page is added | Remove the specific counts from AC-932's body; if an illustrative figure is wanted, mark it as observed repo state at time of writing rather than as part of the criterion. Fold into the same edit as finding 1 |
| 3 | info | — | STORY-102 / STORY-92 deliberate no-AC decisions | — | Both story bodies name behaviours they deliberately do **not** assert (STORY-102: no friendly label or thumbnail, no assertion that the editing surface calls the builder route; STORY-92: invalid site definitions skipped by the reference join, commercial-use and self-hosting recorded but ungated, the cosmetic pass line). Verified: no AC asserts any of them, and none is a coverage gap | none |
| 4 | info | — | AC-932 index entry | — | `xgd ticket list --type acceptance_criterion --filter fields.story_uid=story-c490f1cf` still returns AC-932 (acceptance_criterion-9f1e7baf) alongside its correct result under `story-5e7eb0c5`. The ticket's own `fields.story_uid` is `story-5e7eb0c5` (updated 2026-08-09), so the authoritative parent is STORY-97 and this is a stale index entry from the move off STORY-80, not matrix drift. Recorded so a downstream editor does not conclude AC-932 is dual-parented | none — XGD index staleness, outside this capability's matrix |

## Notes for the Editor

- **One element, one edit.** Both the violation and the warning land on AC-932
  and should be repaired in a single rewrite. The safe shape is: retitle to the
  zero-colour no-op, keep only that criterion and its verification, delete the
  "materially smaller" and "no colour lost" claims and the 6/16 and 8/30 counts.
- **Provenance of the duplication.** AC-932 was authored under STORY-80
  (story-c490f1cf, the L1 palette *model* story in capability-ae9d65d6) on
  2026-08-06 and moved onto STORY-97 on 2026-08-09. Under STORY-80 it was the
  model's own end-to-end assertion; landing beside STORY-97's purpose-built
  retrofit criteria (AC-941, AC-944) is what made it redundant. Worth checking
  whether any other AC moved in that same operation carries the same problem —
  this check saw only the four stories under capability-b4ac88fc.
- **Everything else is clean.** STORY-93, STORY-92 and STORY-102 need no AC
  action at this level. Their bodies are unusually explicit about which
  behaviours are deliberately left un-asserted, and in every case the AC set
  matches that statement — the drift this check exists to catch is absent from
  three of the four stories.
- **Not assessed here (uat level).** Every AC in the capability carries
  `uat_coverage: pass`; whether each test actually exercises its AC is the uat
  level's question, not this one. Note that if finding 1 is applied as
  suggested, AC-932's existing UAT will be exercising claims that have moved to
  AC-941/AC-944 and will need re-pointing at the zero-colour case.
