---
uid: report-3738aebe
id: REPORT-1303
type: report
title: 'Capability-Intent Alignment: size_aware_diffing (level=story)'
created_by: xgd
created_at: '2026-08-05T19:40:55.341752+00:00'
updated_at: '2026-08-05T19:40:55.341752+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-18a822ac
  level: story
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: size_aware_diffing
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

## Headline

CAP-65 (`capability-18a822ac`) was **absorbed into CAP-63 `1c Capture & Diff
Fidelity` (`capability-aa030c83`)** by the structural rebalance of 2026-08-05
(`report-bdaf6840`). It now holds **zero stories**. Its cumulative intent
(REQ-61's diff-side scope) is fully expressed under the absorbing capability,
whose body explicitly carries the size-aware scope verbatim. No intent was lost
in the absorption, so there is no story-level drift to repair here.

**Index caveat (read before trusting any tooling output on this capability):**
`xgd ticket list --filter fields.capability_uid=capability-18a822ac` still
returns STORY-77 and STORY-78 with stale `UPDATE:2026-07-24` timestamps, on both
the branch and `--branch main` views. The ticket files themselves say otherwise:

| Story | UID | `fields.capability_uid` | `last_field_updated` | `updated_at` |
|---|---|---|---|---|
| STORY-77 | `story-16f2793c` | `capability-aa030c83` | `capability_uid` | 2026-08-05T17:24:11 |
| STORY-78 | `story-2c7069fe` | `capability-aa030c83` | `capability_uid` | 2026-08-05T17:24:10 |

The index is stale; the tickets are authoritative. This is the same defect
`report-bdaf6840` filed (`stale_index_on_branch`, plus 22 capability entries for
11 capabilities). Human-ID resolution is also broken on this worktree —
`xgd ticket get STORY-77` returns `TICKET_ID_NOT_FOUND`; only UID lookup works.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-61 (`request-d6bc0d26`) | free_and_reconciled | 2026-07-16 | Sole originating intent. `--size` selector on both `1c diff` and `1c values-diff`; new `1c responsive-diff` N-way cross-size table (Phase 1); change classifier value-step / presence-flip / layout-swap (Phase 2). Supersedes the earlier REQ-61 length-KIND-inference framing, which it explicitly drops. | YES |
| BUNDLE-6 (`bundle-ab9e0cb6`) | free_and_reconciled | merged @ `7a42e182` | Reconciliation vehicle (REQ-58 + REQ-59 + REQ-62 + REQ-61). `intent_uid` of both stories. Phase 1 = `b92a5cbe`, Phase 2 = `cb388975`. | YES |
| REQ-58 (in BUNDLE-6) | free_and_reconciled | 2026-07-13 | Upstream dependency: multi-viewport capture (the persisted ladder both stories read). | YES (dependency) |
| REQ-83 / REQ-88 / REQ-91 (L1 pivot) | free_and_reconciled | 2026-07-20…23 | Framework pivot to L1. Did **not** retire the diff commands — BUG-15 (`values-diff cannot read L1-rendered pages`, free_and_reconciled) repaired values-diff *for* L1 rather than removing it. | YES (no retirement) |

No intent in the ledger retires size-aware diffing. Two REQ-61 scope items —
per-breakpoint dial/length overrides, and nav/header collapse as a configurable
treatment — are reproduction-side asks that belong to the responsive-dials /
treatments capabilities (absorbed into `capability-ae9d65d6`), not here. CAP-65's
body correctly scopes itself to the diff side only, so their absence is not a
coverage gap for this capability.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-65 (`capability-18a822ac`) | REQ-61, BUNDLE-6 | absorbed — zero stories; scope transferred intact to `capability-aa030c83`, whose body reproduces it as scope bullet 3 ("Size-aware and cross-size diffing — the shared `--size` viewport selector on `values-diff` and pixel `diff`, the per-width reference screenshots capture persists, and the standalone `responsive-diff` N-way cross-size node analysis with its change classifier") |
| STORY-77 `story-16f2793c` (now under CAP-63) | REQ-61 §"Size parameter on the existing diff commands", REQ-58 | aligned — `--size` on both commands, optional with legacy single-width default, fail-loud on missing ladder/width, per-viewport reference screenshots at capture. Verified against code. |
| STORY-78 `story-2c7069fe` (now under CAP-63) | REQ-61 §"New command" + §"Phase 2" | aligned — N-way per-node table, `--sizes` selectable/orderable, join-key pairing, presence flips, `--classify` with exactly REQ-61's three labels, `--json`/`--out`, terminal-fail on stale reference. Divergence (`--ref` flag vs the plan's positional slug) is disclosed in the story body. |

**Code grounding** (both stories describe shipped behavior, not vapor):
- `tools/generate/src/cli/index.ts:158,168,179` — documented surfaces for `values-diff --size`, `diff --size`, `responsive-diff --ref/--sizes/--classify/--out/--json`
- `tools/generate/src/cli/index.ts:788-813` — `--size` / `--sizes` validation against the shared `VIEWPORTS` vocabulary
- `tools/generate/src/cli/perceptual.ts:419-431` — same-width reference pairing and the actionable re-capture message naming `screenshot-<width>.png`
- `tools/generate/src/cli/responsive-diff.ts`, `tests/req61-responsive-diff.test.ts`, `tests/reconciliation-responsive-diff.test.ts`

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-78 `story-2c7069fe` (now under `capability-aa030c83`) | story-body-edit | Technical Context says "Belongs to CAP-65 (1c Size-Aware Diffing), whose body already reserves this downstream `responsive-diff` command". Stale since the 2026-08-05 rebalance — the story now belongs to CAP-63. | Re-point to CAP-63 `1c Capture & Diff Fidelity`; keep the CAP-65 mention as historical lineage only. |
| 2 | warning | consistency | STORY-77 `story-16f2793c` (now under `capability-aa030c83`) | story-body-edit | Technical Context says "Generalizes CAP-63 (1c Values-Diff Fidelity)". Both halves are now stale: CAP-63 was renamed `1c Capture & Diff Fidelity`, and it is this story's own parent, so the sentence reads as self-reference. | Reword to name the single-width values-diff *behavior* it generalizes, not the capability ticket. |
| 3 | info | — | CAP-65 (`capability-18a822ac`) | — | Still `status: active` with `merged_into: capability-aa030c83` rather than `deprecated`. Not editor-actionable: `reject_deprecation_if_capability_has_stories` reads the canonical index, which still carries the pre-merge `capability_uid`, so it sees phantom attached stories. Filed as a system blocker in `report-bdaf6840`. | none here — requires the index fix in the xgd system repo. |
| 4 | info | coverage | CAP-65 story tree | — | Zero stories is the intended post-absorption state, not a gap. Re-homing stories back under CAP-65 would undo the rebalance. | none |

## Notes for the Editor

1. **Do not treat the empty story tree as a coverage violation.** Both stories
   moved by design. The correct target for any story-level repair on this
   capability's subject matter is now `capability-aa030c83`.

2. **Both warnings are cross-capability reference staleness introduced by the
   rebalance itself**, not by intent drift — the rebalance moved `capability_uid`
   without touching story bodies (as its report states: "No story content was
   modified — only `capability_uid`"). If other absorbed capabilities are
   validated in this run, expect the same pattern in their stories' Technical
   Context sections; it is worth a single sweep across all 8 absorbed
   capabilities rather than eight separate one-line edits.

3. **Tooling on this worktree is unreliable for this capability.** Use UID
   lookups (`xgd ticket get <uid>`), not human IDs, and do not trust
   `--filter fields.capability_uid` results without opening the ticket. Any
   downstream check that derives structure from the index will mis-read CAP-65 as
   still owning two stories.
