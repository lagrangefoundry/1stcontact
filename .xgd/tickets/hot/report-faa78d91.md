---
uid: report-faa78d91
id: REPORT-831
type: report
title: 'Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene (level=story)'
created_by: xgd
created_at: '2026-07-23T10:07:40.423521+00:00'
updated_at: '2026-07-23T10:07:40.423521+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ac7ca849
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

Chronological ledger of intents that touched CAP-66 / STORY-79:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (bundle-ab9e0cb6) | free_and_reconciled | 2026-07-17 (merged 7a42e182) | REQ-58 pass-3, plan item 5: boolean `--multi-viewport` flag parsing (commit 4f681c73) + `--json` stdout output hygiene (commit a4323720) | YES |
| BUNDLE-7 (bundle-31e474b9) | free_and_reconciled | 2026-07-22 (merged edeb1c2c) | BUNDLE-7 plan item 9: store-selecting flags (`--sandbox` + source + cwd) propagate into the render/serve a sub-command drives — `aligned-crops --sandbox` (commit 09fa7cf5) | YES |

Attribution verified: 4f681c73 and a4323720 are in bundle-ab9e0cb6's commit manifest; 09fa7cf5 is in bundle-31e474b9's commit manifest. All three story-claimed commits belong to the intents the story cites.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-79 (story-e15a19ef, upgrade) | BUNDLE-6 (g1, g2), BUNDLE-7 (g3) | aligned — body's three guarantees each map 1:1 to a reconciled intent + verified commit; no unsupported text; no coverage gap |
| CAP-66 (capability-ac7ca849, umbrella body) | BUNDLE-6 only | stale — umbrella body enumerates only g1+g2 and attributes the capability solely to bundle-ab9e0cb6; g3 (bundle-31e474b9) is absent (see warning #1) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | CAP-66 (capability-ac7ca849) body | story-body-edit (capability umbrella) | Capability body lists only two guarantees (flag parsing, output hygiene) and closes with "This capability documents behavior reconciled from bundle-ab9e0cb6 (REQ-58 pass-3), plan item 5." Guarantee 3 — store-selecting flag propagation into sub-commands (aligned-crops `--sandbox`), reconciled from bundle-31e474b9 (free_and_reconciled, 2026-07-22, commit 09fa7cf5) and already present in STORY-79 — is not reflected in the umbrella description. | Add a third bullet for store-flag propagation into sub-commands and extend the closing attribution to include bundle-31e474b9 (BUNDLE-7, plan item 9). Non-blocking: the story tree itself is fully aligned. |
| 2 | info | coverage | STORY-79 | — | All three story guarantees are supported by reconciled intents with verified commits; no reconciled-intent CLI-arg/output-hygiene behavior is missing from the story tree. | none |
| 3 | info | consistency | STORY-79 | — | No text in the story body lacks intent support; every clause traces to BUNDLE-6 or BUNDLE-7. | none |

## Notes for the Editor

- **Only story-level alignment gates this pass.** STORY-79 is the sole story in CAP-66 and is fully aligned to cumulative intent: consistency (no unsupported text), coverage (all reconciled slices expressed), and exclusivity (single story, no overlap) all hold. Hence PASS.
- **The one warning is peripheral, not a story defect.** The CAP-66 *umbrella body* was written when only BUNDLE-6 had landed and was not refreshed when BUNDLE-7 added the third guarantee to STORY-79. The story is correct; the capability's own descriptive prose lags one intent behind. There is no dedicated "capability-body-edit" resolution category, so it is filed as `story-body-edit` scoped to the capability umbrella. It does not block the level.
- **Scope note.** BUNDLE-7 is a large bundle (REQ-63/79/82/83/84 + more, mostly the L1 framework pivot). Only its plan-item-9 slice (commit 09fa7cf5, aligned-crops `--sandbox` store routing) belongs to this capability; the rest belongs to L1-substrate / coverage-audit capabilities and is correctly absent here.
