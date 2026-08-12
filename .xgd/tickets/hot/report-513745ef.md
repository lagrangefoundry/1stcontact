---
uid: report-513745ef
id: REPORT-1922
type: report
title: 'Reconciliation Review: commits — REQ-136 phase 1 (re-review after fix)'
created_by: xgd
created_at: '2026-08-12T22:36:43.326467+00:00'
updated_at: '2026-08-12T22:36:43.326467+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: request-8a132869
  anchor_uid: request-8a132869
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: —
**Anchor**: request-8a132869 (REQ-136), commit a1a43d2a / 94ba66626
**Stories Reviewed**: 4 — story-d0a8cfad (STORY-83), story-37a3921b (STORY-100), story-8acc338d (STORY-84), story-af36c2cb (STORY-98)

This is the second review of this anchor. REPORT-1917 (`report-63d4d81d`) failed on a
single, narrow basis: four ACs were **broadened** to claim a picture's framing, shape
and colour adjustment while the UAT each linked to still exercised the old, narrower
subject — each would have passed unchanged if the newly-claimed behaviour were deleted.
`fix_reconciliation_review` (REPORT-1919) mirrored the missing assertions out of the FC
suite, as that review's Remediation section prescribed. **That gap is now closed, and I
verified it by mutation rather than by a green run.** Everything the prior review found
sound — intent fidelity, plan accounting, the fourteen new ACs — I re-checked and confirm.

## What the fix changed, and what it did not

Confirmed against `git diff e1fae02d5..HEAD`: **test files only**. No production code, no
story body, no AC text was touched.

| File | Change |
|---|---|
| `tests/reconciliation-copy-edit-image-selection.test.ts` | AC-1027 gains a framing+shape+colour save between the `assetFingerprint` calls; AC-1024 gains the closed-control sweep. Stale "eventual home of framing" comment dropped. |
| `tests/reconciliation-copy-edit-image-framing.test.ts` | New `test_UAT_AC1121_*` and `test_UAT_AC1122_*` on the file that already carries the `A_PLAIN` / `A_FEATHERED` / `A_PILL` fixtures. |
| `reconciliation-l1-language` / `-shared-axis-groups` / `-fold-full-language` | Pointer comments only (the optional tidy for AC-725 / AC-802 / AC-729). |

This is the correct shape for a reconciliation story: UATs added, runtime code untouched.
The production footprint of the branch is unchanged from what the plan declared —
`render.ts`, `edit.ts`, `schema.ts`, `types.ts`, `validate.ts`, `fold.ts`, plus the
`package.json` version bump. No new command, route, endpoint, field type or module.

## Evidence Sufficiency (Step 5b) — the four ACs that failed last time

I did not take the fix report's word for it. For each claim I applied a mutation to
production code, ran the suites, and reverted (`git diff` clean afterwards).

| Mutation to `packages/site-schema/src/l1/edit.ts` | Result |
|---|---|
| `rangeError` returns `null` unconditionally (bounds never refuse) | **× `test_UAT_AC1121_a_pictures_bounds_bind_a_change_and_never_the_status_quo`** — and only that test, of 15 |
| Empty-bag prune removed from `writeImageFraming` | **× `test_UAT_AC1122_a_framing_edit_writes_among_the_parameters_the_picture_already_carries`** (plus AC-1129/1130/1131/1132, which also bind on it) |
| `imageFramingFields` returns `{fields: [], values: {}}` | **× `test_UAT_AC1024_*` and × `test_UAT_AC1027_*`** |

Each of the four previously-inert ACs now has a UAT that dies when the behaviour it
claims is removed. That is precisely what was missing.

Claim-by-claim against the AC Verification clauses:

- **AC-1027** (`acceptance_criterion-0bc092af`) — *"Repeat for a framing, shape and colour
  adjustment saved together."* The UAT now saves `{objectPositionYPct, shape, grayscalePct}`
  in one call, asserts the change map names exactly those three, re-fingerprints every file
  in the asset store, asserts `readdirSync` is identical (no file added), asserts
  `status` reports only `pages/home.json` modified, and asserts the handle, id, alt and
  captured `objectFit` all survive. The ticket's central "no operation touches a file"
  guarantee is now evidenced for **adjusting**, not only for choosing.
- **AC-1024** (`acceptance_criterion-8b6792de`) — *"every remaining field is either a bounded
  whole number carrying both bounds or a closed pick carrying a non-empty option list, and
  none of them is a free-form string."* The sweep over `fields.slice(2)` asserts exactly
  that, with a both-shapes-seen guard so neither branch can pass vacuously. The DOC-2 claim
  gained evidence rather than losing the claim, as the prior review required.
- **AC-1121** (`acceptance_criterion-db9faa7b`) — the Verification's image half asked for the
  pill-radius seed reported as current, an alt-text re-save reporting only `alt` changed,
  and then *"a colour adjustment, a pan and a scale outside their ranges ... each refused
  naming its bound, with the stored draft byte-for-byte unchanged."* The UAT covers all of
  it, across exactly those three control families, asserting `draftBytes()` around each
  refusal.
- **AC-1122** (`acceptance_criterion-66f57a24`) — the image half asked for a turn that
  disturbs the edge treatment nothing here can rewrite, an un-turn that removes the group
  rather than emptying it, and an identity re-save of a bare picture that reports nothing
  changed and leaves the draft byte-identical. `A_FEATHERED` and `A_PLAIN` cover all three.

No mocking and no source-inspection anywhere in the REQ-136 suites: `grep -E "vi\.(mock|fn|spyOn)"`
across all six returns nothing, and no test reads a `.ts` file to assert on its text. Entry is
through the real `1c copy get|set` CLI, the real renderer, the real validator.

## Execution

```
vitest run <6 REQ-136 suites>   → 6 files, 32 tests passed (was 30; +2 new)
vitest run (full suite)          → 213/216 files, 1535 passed, 4 skipped, 13 failed
```

The 13 failures are in `test_UAT_FC_REQ-122_chat_host`, `test_UAT_FC_REQ-127_session_binding`
and `reconciliation-assistant-conversation`. I confirmed all three files are **untouched by
this branch** (`git diff --stat <merge-base>..HEAD` on them is empty), and none of them
imports the framing code path. Pre-existing and unrelated, as the plan and both prior
reports stated.

## Coverage Map

All 22 load-bearing behaviours from the prior review's inventory remain covered; the four
that read **Partial** are now **Covered**. Only the changed rows are reproduced:

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 10 | Every image control bounded-int or closed-enum, none free-form | **Covered** | story-37a3921b | AC-1024 — closed-control sweep, non-vacuity guarded |
| 15 | **Adjusting** bakes nothing — no file touched | **Covered** | story-37a3921b | AC-1027 — framing/shape/colour save fingerprinted |
| 16 | Identity removes the axis; no empty bags (framing) | **Covered** | story-37a3921b | AC-1122 — second UAT on the image fixtures |
| 17 | Out-of-range refused not clamped (image controls) | **Covered** | story-37a3921b | AC-1121 — second UAT, three control families |

AC-725 / AC-802 / AC-729 (broadened, evidence carried by a sibling AC) received the optional
pointer comments naming `test_UAT_AC1124_*` / `AC1125_*` / `AC1126_*` / `AC1127_*` /
`AC1133_*` / `AC1134_*`. They were not the failure basis last time and are now tidied.

All twelve new ACs (AC-1124..AC-1135) resolve to a UAT; I checked each by name.

## Ungrounded Stories

None. No story claims behaviour that neither the intent nor the code supports.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. L1 substrate — framing/shape/colour axes and emission | story-d0a8cfad (STORY-83) | ✓ — "A picture's framing, shape and colour adjustment" section present |
| 2. Structured copy editing — a picture's framing on the one write path | story-37a3921b (STORY-100) | ✓ — the stale *"Image framing — crop, scale, scrim, rotation, edge effects, free positioning"* deferral is gone from Out of scope, replaced by the correctly-scoped phase-2 entry (*"Zooming into a picture"* — a true source-rect crop) |
| 3. The fold — captured pan and colour adjustment land | story-8acc338d (STORY-84) | ✓ — "How a measured value becomes a typed axis" section carries default-not-worth-carrying, identity-is-per-function, same-value-two-spellings, unreadable-is-a-gap-never-a-guess, clamp-to-nearest-expressible |
| 4. Edit render channel — paint parity | story-af36c2cb (STORY-98) | ✓ — AC-1135 |

No plan items dropped. Verified independently, not carried over from the prior review.

## Judgment Calls

- **The four fixes are mirroring, not authoring** — every assertion already existed in
  `tests/test_UAT_FC_REQ-136_image_framing.test.ts`. The prior review called this a
  traceability failure rather than a regression hole, and that was right: the fix moved the
  evidence into the matrix link a future planner actually reads, without inventing a claim.
- **`uat_coverage` is absent on AC-1121 and AC-1122** while AC-1024 and AC-1027 carry `pass`.
  The fix deliberately left it alone as evaluator-owned rather than fabricating a signal.
  I agree — and both now have passing, mutation-verified UATs regardless, so the substance
  the field would record is present. Noted for structural validation, not a story-coverage
  defect.
- **The pipeline's own quality gates remain vacuous** — REPORT-1920 (`report-75a96b44`), the
  latest scoped quality report, still reads `pass (0 tests, 0 failed)` with an empty `suites`
  map, exactly as REPORT-1914/1910/1908 did. Four new reconciliation suites exist on this
  branch and nothing in the pipeline ran them; I ran them myself, here and last time. Flagged
  identically to the prior review: this is a **workflow-scoping defect, not a story-coverage
  defect**, and it is the reason seven un-evidenced AC modifications reached review unflagged
  the first time. It will let the same class of gap through again on the next reconcile.
- **AC-1044 and AC-1028 still given no plan item** — re-confirmed correct. Both texts remain
  true verbatim; only the tests over-asserted, and restating a test to match an AC that was
  already right is not a matrix change.
- **Phase 2 remains correctly unplanned and unclaimed** — zoom / source-rect crop, tint over
  an `<img>`, background-surface framing, drag handles, the derived-render cache and
  `sepia`/`invert` in the editor are named in the ticket and unimplemented. Not a gap.

## Verdict

**PASS.** Stories accurately and completely document the behaviour surface, and they
document what the operator *intended* — the non-destructive model, not merely the code that
implements it. Intent fidelity is high and unchanged: no divergence was silently absorbed,
the one code behaviour the intent body is silent about (the fold clamping an over-ceiling
value to the nearest expressible one) is stated with its rationale in AC-1134 rather than
absorbed, and the supersession of the five "exactly src + alt" pins was handled deliberately.
All four plan items produced substantive story content, including the retirement of
STORY-100's stale deferral — the most valuable thing this reconciliation does, since a matrix
that calls a shipped capability deferred is a false negative a future planner would act on.

The sole failure basis of REPORT-1917 is closed. All four broadened ACs now carry UATs that
enter through the real CLI, mock nothing, inspect no source text, and — verified by three
separate mutations to `edit.ts` — fail when the behaviour they claim is removed. A developer
reading these stories would have a correct mental model of what this code does and why it
was built this way.
