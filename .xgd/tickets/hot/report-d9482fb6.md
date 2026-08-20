---
uid: report-d9482fb6
id: REPORT-2422
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (story) — attempt 8'
created_by: xgd
created_at: '2026-08-20T11:19:02.067758+00:00'
updated_at: '2026-08-20T11:19:02.067758+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: story
  fixes_applied: 4
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (story)

**Attempt**: 8
**Fixes applied this call**: 4 (delivered as 2 ticket updates — STORY-84's body edited in three places, plus the paired AC-731 edit)
**Violations remaining**: 0
**Needs more work**: false

All three violations of `report-7d15aeac` are STORY-84's (`story-8acc338d`) and all
three were categorized `story-body-edit`. Each was re-derived from the code and the
cited intents before editing, rather than taken from the report's summary — findings
1 and 2 had already survived two cycles by being read only as "the injected report's
list". STORY-86 (`story-24098299`) required no edit and was not touched.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-84 | **Finding 1 (viewport-height axis).** Added a Description paragraph — "The ladder has a second sampling axis: the viewport's HEIGHT" — stating that selected ladder widths are re-shot at a second viewport height, that the pair is read as *evidence* and never as a keyframe (the keyframe ladder skips the probe), that a node's measured y/height change per unit of viewport height folds to a derivative on its geometry (`{heightFactor: 1}` on the hero, `{yFactor: 1}` on everything below saying one fact in one unit), that a **band takes its response from its section edges** rather than its runs and a **reconstructed card inherits its representative row's**, that a zero-indistinguishable response emits no axis, and that the response is **measured, not inferred**. Added the axis to **In scope**; added a Technical Context bullet covering the finite-difference pairing (same width + same engine), the element/section join rules, the measure-at-probe-width / apply-at-every-width decision and its cost rationale, and eighth-snapping. Extended the REQ-88 provenance bullet to name the height probe. Deferred the *substrate* half explicitly in **Out of scope** ("the axis vocabulary these folded values land in (the height-response axis among them) and how the renderer replays it") and the capture-side half ("shoot the height probe"). |
| 2 | story-body-edit | STORY-84 | **Finding 2 (self-painting run).** Rewrote both halves of the unqualified rule. The **text-leaf** bullet now states that a self-painting run — one whose own border box already spans the surface it sits on (a fully-rounded pill; a control with authored vertical inset) — carries that surface on the text leaf itself (fill, corner radius, border, shadow). The **reconstructed-run-surfaces** bullet now qualifies the rule: such a run is "the exception in both directions" — it contributes no row and no backing box, its fill is not evidence for band or card signatures, and the enclosing card is defined by its other runs. Added a Technical Context bullet naming the two recognition rules (BUG-20 pill saturation with the `rounded-full` sentinel clamped into the envelope; BUG-21 padded control with its gradient / accent-`borderLeft` guards and the 2x-height defect it fixed). Also corrected the In-scope phrasing ("reconstructed surfaces **with the self-painting run excepted from them**"). |
| 3 | story-body-edit | STORY-84 | **Finding 3 (`1c repro`, the materialization verb).** Added a Description paragraph — "A folded bundle is materialized as a servable site" — covering: writing a site whose page document *is* the bundle's folded L1 document with the recovered seams mounted into it; rewriting every media handle from the captured origin to the bundle's own mirror; hard failure with a re-capture instruction on an unmirrored handle (with the reason: a network-reaching reproduction is neither offline-reproducible nor honestly gate-able, and blinds the perceptual gate to image regressions); that handle rewriting is a materialization concern and not a fold concern; and idempotence (a re-run wipes and rebuilds). Noted in the body that the overwrite-vs-scaffold interaction is **AC-876's** under the site-import capability and is not restated. Added the verb to the Story sentence and to **In scope**, added the corresponding **Out of scope** deferral, and added a **BUG-23 provenance bullet** to Technical Context. |
| 4 | ac-edit | AC-731 (`acceptance_criterion-6a5e0eec`) | **Paired with finding 2**, which flagged it explicitly. AC-731 carried the same unqualified reconstruction rule in both its Criterion and its Verification. Criterion now carries the self-painting exception in both directions; Verification now asserts it (a pill run and a padded control run each fold to a text leaf with no box behind them, while an ancestor-attributed gradient / accent border on a modestly-rounded run still resolves to a card box). Applied in the same call so the matrix never sits in a state where the story states the exception and its AC contradicts it. `uat_coverage` left at `pass` — the added clause is already proven by `test_UAT_FC_BUG-20_chip_paints_once_no_duplicate_badge_box_behind_it`, `..._card_treatments_stay_on_the_card_box` and `..._a_modestly_rounded_single_run_card_is_not_a_chip`. |

## Evidence Consulted (re-derived, not taken from the report)

| Claim written into the story | Verified at |
|---|---|
| Probe is evidence, not a keyframe | `tools/generate/src/l1/fold.ts:159-161`, `heightProbesFor` `:182-199` |
| `{yFactor, heightFactor}` from a measured box delta | `responseFrom` `:249-258`, `probeResponses` `:266-288`; eighth-snapping `snapFactor` `:242-247` |
| Band takes its response from section edges | `sectionEdgeResponses` `:290-333` (incl. the `min-h-screen` rationale and the measure-once decision) |
| Card inherits its representative row's | `fold.ts:1687-1688`; written onto geometry at `:1578`, `:1814`, `:1943` |
| Self-painting families + both directions | `isSelfPaintingRun` `:1003-1007`, `isPaddedControlRun` `:1029-1036`, `chipAxes` `:1044-1056`, applied `:1836-1837`, `if (chip) continue` `:1873-1877` |
| Materialization verb, mirror rewrite, hard fail, idempotent rebuild | `tools/generate/src/cli/repro.ts:95` (`cmdRepro`), localization + throw `:127-140`, page document `:169`, `emptyDir(dir)` `:183`; CLI surface `cli/index.ts:233-236`, dispatch `:557` |

## Verification

`npm test -- tests/bug20-chip-self-surface.test.ts tests/bug23-repro-local-assets.test.ts`
→ **2 files, 18 tests, all passing**. No code or test files were modified this call;
these were run to confirm the behaviours newly expressed in the story body are live
and covered rather than aspirational.

## Code Edits (if any)

None this call.

## Follow-ups for the `ac` cycle (not violations of this level)

| Element | Note |
|---|---|
| STORY-84 AC set (18 ACs) | Findings 1 and 3 added behaviour to the story body that no AC yet states. The height response has no AC; candidate UATs already exist in `tests/req88-viewport-relative-and-nowrap.test.ts` (`test_UAT_FC_REQ-88_a_height_probe_makes_the_hero_track_the_viewport`, `..._content_below_a_viewport_hero_is_pushed_down_with_it`, `..._without_a_height_probe_no_height_response_is_invented`, `..._a_probe_is_partitioned_out_of_the_width_ladder`). The materialization verb has no AC either; candidates are in `tests/bug23-repro-local-assets.test.ts`. Both are `ac-add` work at the next level, not `story-body-edit` work — no AC was created here, per the finding categories. |

## needs_review Items Forwarded

None. Finding 3 was categorized `violation` / `story-body-edit` on the assessor's
three ownership checks (CAP-82's scope opens downstream of the verb; CAP-89's
overlapping slice stops at AC-876; STORY-84 already owns the verb's predecessor
AC-696 and its file-sibling AC-814) and was applied as directed rather than
re-escalated. The story body records the AC-876 boundary explicitly, so if the
operator later prefers a different owner the move is one paragraph.

## Matrix-hygiene item carried forward (unchanged from the assessor's notes)

Both stories carry a single scalar `updated_by` and all 34 ACs carry
`intent_uid: None`, so this capability's intent ledger still has to be rebuilt from
the corpus plus the implementation's own `REQ-`/`BUG-` attributions on every cycle.
Not addressable at level=story.
