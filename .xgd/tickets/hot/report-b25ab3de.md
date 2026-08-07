---
uid: report-b25ab3de
id: REPORT-1599
type: report
title: 'Capability-Intent Alignment: site-materials-and-start-point (level=story)'
created_by: xgd
created_at: '2026-08-07T18:10:25.026246+00:00'
updated_at: '2026-08-07T18:10:25.026246+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-b4ac88fc
  level: story
  violations: 0
  warnings: 4
  needs_review_count: 0
---

# Capability-Intent Alignment: site-materials-and-start-point
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 4
**Needs review**: 0

Anchor report: report-17a279f7. Previous attempts: 0.

## Cumulative Intent Considered

Intents reached via `fields.intent_uid` / `fields.updated_by` on the capability's
four stories. Both intent UIDs on the stories are **bundles**; the behavioural
asks live in the bundled source requests, so the ledger is written against those.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-101 (request-b63bbed5, via BUNDLE-11 / bundle-ee56a66e) | free_and_reconciled | created 2026-07-26, merged `f9a415a8` 2026-08-06 | Project-level font provenance registry; `1c fonts check` with four violation kinds; three-state `redistribute_in_product`; `siteConfig.distribution` marker; actions warn-but-pass; missing/malformed registry is a hard error. Explicitly **no** acquisition verb. | YES |
| REQ-102 (request-56cb1897, via BUNDLE-11 / bundle-ee56a66e) | free_and_reconciled | created 2026-07-26, merged `f9a415a8` 2026-08-06 | `1c new` seeds a minimal **valid** L1 document (widths ladder, background, flowed root, placeholder run); `render`/`shot` succeed unedited; `repro` over a scaffolded slug equals a never-scaffolded one; no flag, no mode detection. | YES |
| REQ-114 (via BUNDLE-14 / bundle-0385746c) | free_and_reconciled | merged `cd8f98c8` 2026-08-06/07 | §3 retrofit of existing sites (alpha collapse then ramp grouping, unclustered keeps its own entry), §5 repeatable census command, pixel-identical conversion (AC3), one entry for `xgd`'s three alpha variants (AC5), all four sites retrofitted (AC6), census reproduces DOC-23 §5.3 (AC7). §1/§2/§4 (palette model, renderer, legacy-token retirement) land in CAP-70 / STORY-80. | YES |
| REQ-118 (request-66e4c630) | free_and_reconciled | created 2026-07-31, completed 2026-08-07, main `b2b9208c` | §3 one asset listing shared by three consumers — union of `site.json.assets` and `draft/assets/`, entries `{id, src, alt, kind, onDisk, registered}`, `/assets/<name>` vocabulary, kind from extension; §4 reachable independently (`1c asset list`, `GET /api/assets`). §1/§2/§5 (enum field descriptor, write-side membership check, editor) land in CAP-86. | YES |

No intent in the ledger is `abandoned` / `deprecated` / `wont_fix`, and none is
merely imminent — all four are fully reconciled. No later intent retires any
behaviour an earlier one established here; the one supersession inside the
window (REQ-114 deleting the theme colour token group) is already carried on
STORY-93 via `updated_by: bundle-0385746c`.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-93 (story-86c7c21b) — scaffold | REQ-102; REQ-114 (via `updated_by`) | **aligned**. All four REQ-102 acceptance items are expressed. The REQ-114 consequence (theme colour group deleted, so a fresh site's colour is now stated in the page's own L1 document as literals) is restated rather than quietly reinterpreted, and matches `scaffold.ts:45-46,58-61,80` — two literals, no third value, no palette declared. Ladder derived from `RESPONSIVE_VIEWPORTS`, not restated (`scaffold.ts:25`), which is exactly the story's "the ladder is the capture ladder" claim. |
| STORY-92 (story-8685be2d) — font provenance | REQ-101 | **aligned**. Registry contract, four violation kinds, warning channel, distribution marker, hard-error integrity and the report's machine-readable form all trace to REQ-101 §1–§4. The "machine-readable form" is real: `cmdFontsCheck` returns a structured `FontsCheckReport` (`fonts.ts:126,256`) and `--json` is wired at `index.ts:977`. The four recorded divergences are each honest and match REQ-101's own text. |
| STORY-97 (story-5e7eb0c5) — colour census & retrofit | REQ-114 | **aligned**. Census / retrofit / lossless-or-nothing / `--names` renaming / re-runnable all trace to REQ-114 §3, §5 and AC3–AC7, and are present in `colors.ts` (`cmdColors`, `cmdColorsAssign`, `derivePalette`, the round-trip and re-validate gates at `colors.ts:471,490`) with `--assign` / `--names` / `--json` wired at `index.ts:952-973`. Two divergences from REQ-114's acceptance numbers are explicitly recorded in the story body — see finding 5, both verified true. |
| STORY-102 (story-c46abfa6) — site asset store | REQ-118 | **aligned on behaviour**; carries a stale capability cross-reference (finding 1). Union listing, provenance per entry, one handle vocabulary, usage kind and gesture-free reachability all trace to REQ-118 §3/§4 and are present at `edit.ts:748,781` and `builder.ts:205-211`. The story correctly assigns the chooser obligation to CAP-86 rather than asserting it here. |

Exclusivity among the four stories: clean. STORY-92 and STORY-102 both look at
`draft/assets/`, but at different questions (obligation over a byte vs. what this
site can reference), and each body holds the other apart explicitly. STORY-93's
mention of "declares no palette" is a consequence note, not a second claim on
STORY-97's retrofit behaviour.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-102 (story-c46abfa6) | story-body-edit | Body twice defers licence/provenance to **CAP-80** as a neighbouring capability ("that is a project-level question (CAP-80)"; "Relationship to CAP-80 … the two are deliberately held apart"). CAP-80's scope was consolidated into CAP-89, so that subject is now STORY-92 — a **sibling under this same capability**, not a different one. The substantive boundary (obligation ≠ listing) is still correct and is preserved by CAP-89's own body as two separate scope sections; only the pointer is stale. | Re-point both references at STORY-92 / this capability's "Asset provenance & licence compliance" section instead of CAP-80. |
| 2 | warning | consistency | capability-b4ac88fc (body, "Asset provenance & licence compliance") | story-body-edit | The section describes the record as "a project-level index over **every asset file of a governed kind**" and never names fonts. REQ-101 and the implementation govern **fonts only** (`fonts/registry.yaml`, `1c fonts check`, `packages/site-schema/src/fonts.ts`); no intent in the ledger extends provenance to images or stylesheets. Phrasing inherited verbatim from CAP-80's body. A matrix reader would over-read the platform's current governance surface. | Name fonts as the sole governed kind today, keeping "of a governed kind" as the extension point rather than as an implied current scope. |
| 3 | warning | exclusivity | capability-745b9a6c (CAP-80), capability-105cfacf (CAP-88) | story-body-edit (consolidation bookkeeping) | CAP-89's body asserts "Each was previously its own capability; they are consolidated here", but the four predecessors sit in **three different bookkeeping states**: CAP-81 `status=superseded` + `superseded_by_uid` (correct); CAP-83 `status=active` + `merged_into=capability-b4ac88fc` (marked, not retired); CAP-80 and CAP-88 `status=active` with **no marker at all**. Two still-active capabilities whose bodies fully describe behaviour CAP-89 now owns. | Retire CAP-80 and CAP-88 the way CAP-81 was retired (`superseded` + `superseded_by_uid`), and settle CAP-83 to the same shape. |
| 4 | warning | exclusivity | all four stories | — | The ticket search index still resolves each story under its **predecessor** capability UID as well as under CAP-89: `capability_uid=capability-745b9a6c` → STORY-92, `capability-105cfacf` → STORY-102, `capability-e382c142` → STORY-97, `capability-ccac1b1d` → STORY-93. Each ticket's authoritative `fields.capability_uid` is `capability-b4ac88fc` (verified on all four via `xgd ticket get`), so this is index staleness, not a dual parent — but any consumer that walks the matrix by capability double-counts all four stories. | Reindex; no ticket-body change required. Fixing finding 3 first may resolve it. |
| 5 | info | consistency | STORY-97 (story-5e7eb0c5) | — | The two "Intent/observation note" divergences from REQ-114's acceptance numbers are **correctly recorded and independently verified**: (a) AC6's "all four sites retrofitted" is vacuous for two of them — `storage/sites/1stcontact` and `storage/sites/harbor-cafe` contain **zero** hex literals across their whole draft trees and carry no `palette` key, while `xgd` carries 6 entries and `gigabytealchemy` 8; (b) AC7's frozen §5.3 counts (17/15) have moved to 18/16 because the site gained a document-level text colour. The story asserts the method and the collapse, not the numbers — which is the right durable property. | none |
| 6 | info | coverage | STORY-92 (story-8685be2d) | — | REQ-101's opening gap statement names "no font-**acquisition** path", and no acquisition verb was built. This is not a coverage gap: REQ-101's own "Not done (deliberate)" section and its operator direction of 2026-07-25 scope the ask to tracking, and the story records the divergence explicitly rather than inheriting the ticket's opening sentence. | none |

## Notes for the Editor

**The intent alignment itself is clean.** All four stories fully and accurately
express their intents' asks, including four separately-recorded divergences that
each turned out to be honest on inspection. Nothing in any story body describes
retired behaviour, and no reconciled ask in the ledger is unexpressed. Every
warning below is **consolidation bookkeeping left over from folding four
capabilities into CAP-89**, not drift between the matrix and intent — which is
why this level passes.

**The warnings share one root cause.** Findings 1, 3 and 4 are all the same
unfinished consolidation seen from three angles: a story body still naming a
predecessor, two predecessors still `active`, and an index still pointing at all
four. Repairing finding 3 properly (retire CAP-80 and CAP-88 the way CAP-81 was
retired, settle CAP-83) plus a reindex likely clears 3 and 4 together and makes 1
a one-line edit. Finding 2 is independent — inherited phrasing, not a stale link.

**Deliberately not raised as a finding.** `fields.uat_coverage` is present
(`pass`) on STORY-93 and STORY-97 but absent on STORY-92 and STORY-102. That is a
uat-level concern and the uat-level cycle owns it; flagged here only so it is not
mistaken for a story-level omission.

**Verification depth.** Every load-bearing story claim was checked against
production code, not just against ticket text: `scaffold.ts`, `colors.ts`,
`fonts.ts`, `edit.ts`, `builder.ts`, `cli/index.ts`, and the on-disk state of all
four `storage/sites/*`. No `code-issue` was found — in every case the story, the
intent and the code agree.
