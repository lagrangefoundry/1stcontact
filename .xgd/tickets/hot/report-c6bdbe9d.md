---
uid: report-c6bdbe9d
id: REPORT-5809
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T16:24:59.600503+00:00'
updated_at: '2026-10-02T16:24:59.600503+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — REQ-329 `a8fc4f256c` onto REQ-328

- Branch `resync-377b581e`, HEAD `ac4a2e08d3`, CHERRY_PICK_HEAD `a8fc4f256c4fb88e7c646061a28cac00bf58ddbb`
  ("feat(l1): compose motions per node, exclusive per property [FREE-CODED]", 2026-09-26 13:01:37 -0700)
- Apply target `ec118d67626fd31cfce67ca88dc9908ecdde70ed`, anchor `report-377b581e`, `prior_stage_failure` empty.
- Prompt body arrived empty; arguments recovered from `session-r36f21cf3.jsonl` seq 59041.

## Conflicts (2 `UU`, one region each, both CODE paths → integrate both sides)

| Path | Ours (REQ-328 sticky.lift) | Theirs (REQ-329) | Resolution |
|---|---|---|---|
| `tests/reconciliation-l1-shared-axis-groups.test.ts` | `sticky` sample gains `lift: true` + comment sentence | REQ-329 comment block above `scrollTrack` | keep BOTH |
| `tests/req105-node-axis-groups.test.ts` | `sticky` sample gains `lift: true` + comment sentence | comment reworded: "two motions animating one CSS property" replaces "a track against a `reveal`" | keep BOTH |

## Method — the developer's own merge is the oracle

`e74e16bb53` "Merge branch 'xgd-working' into free-REQ-329" (2 min after the pick; first parent ==
the pick; `# Conflicts:` lists exactly these two files) resolved this same conflict on xgd-working.

- Stage 2 blobs == `e74e16bb53^2` blobs for both files (`0c9775b05f`, `15cb11e3ea`).
- `git diff --stat HEAD e74e16bb53^2` over all pick paths: empty (ours == the merge's other parent).
- `git diff --cached --stat e74e16bb53` over the 9 cleanly applied paths: empty before resolving.
- Resolved with `git checkout e74e16bb53 -- <2 paths>`; afterwards
  `git diff --cached --stat e74e16bb53 -- <all 11 pick paths>` is empty.

Result: incoming's REQ-329 text and sweep changes land in full, and ours' `lift: true` plus its
REQ-328 comment sentence survive in both files. Staged vs HEAD is +897/-131 over 11 files against
the pick's own +895/-129 — the +2/-2 is the two re-wrapped comment lines that carry both sides.
Only the pick's own 11 paths are staged. No markers remain, CHERRY_PICK_HEAD intact, HEAD unmoved.

The enrichment's "take the more recent commit by timestamp" rule was not applied: either side alone
would have dropped the other's change.

## Tests

`npx vitest run` on the five suites the pick touches: 33 pass, 4 fail (4 files green, 1 red).

- Green: `reconciliation-l1-shared-axis-groups`, `req105-node-axis-groups`,
  `test_UAT_FC_REQ-329_composed_motion`, `test_UAT_FC_REQ-325_scroll_position_state`.
- Red, NOT caused by this resolution: 4 tests in
  `tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts`
  (`…refusals_that_are_not_numbers_are_projected_not_authored`,
  `…every_stated_rule_is_one_the_validator_actually_refuses`,
  `…the_reference_covers_everything_it_says_it_is_generated_from`,
  `…the_coverage_check_has_teeth`). All four trace to one gap: `L1_STRUCTURAL_RULES` has
  `zoomGroupChromeAgrees` (from `6ec3ee3a0b` "a zoom may name a set…", already on HEAD) but the
  BUG-48 test has no entry for it. That key appears only in `validate.ts` on HEAD, in the index, in
  the developer merge `e74e16bb53`, AND at the apply target `ec118d67…` — so the suite is red on
  xgd-working's own tip. Not fixed here; flag for post-merge review.

## Flag for review

- `tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts` — missing
  `zoomGroupChromeAgrees` coverage entry; pre-existing, not delivered by any commit up to the
  apply target.
