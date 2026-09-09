---
uid: report-7617e6fa
id: REPORT-3581
type: report
title: Fix 1c Capture & Diff Fidelity (story) — attempt 7
created_by: xgd
created_at: '2026-09-09T23:32:16.251015+00:00'
updated_at: '2026-09-09T23:32:16.251015+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: story
  fixes_applied: 8
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — 1c Capture & Diff Fidelity (story)

**Attempt**: 7
**Fixes applied this call**: 8
**Violations remaining**: 0 (at level=story)
**Needs more work**: false

All 11 violations and all 3 warnings in REPORT-43e0f0f2 were addressed by
story/capability body edits, plus one paired `ac-deprecate`. No prior
`fix_structural_validation` report exists for this capability — attempt 7 is the
outer loop's counter, and this is the first fix pass here, so the whole finding
set was open.

## Actions Taken — by Resolution Category

| # | Category | Element | Finding(s) | Action |
|---|---|---|---|---|
| 1 | story-body-edit | CAP-63 (capability-aa030c83) | 11, 14, 1–5, 8 | Scope bullet 4: replaced REQ-89's conditional Astro-container clause with REQ-150's unconditional form (launcher configures a plain bundler SSR server; no render path names a build-transform specifier, statically or dynamically, and no such module resolves from disk), plus a note recording the supersession and pointing at STORY-79 guarantees 4 and 5. Added a **fifth Scope bullet** for deployed-runtime capture (injected browser seam, session economics, viewport presets, honest limits, self-origin fulfilment), stating the same boundary the "how a capture is taken is owned here" ownership rule does — the gap that made two overlap surveys read STORY-124/125 as misfiled. Extended bullet 1 with the axes and recording conditions from findings 1–5, and bullet 3 with the ladder-wide `--multi-viewport` mode and its `--collapse` / `--clusters` reporting stack. |
| 2 | story-body-edit | STORY-75 (story-d5de22a5) | 1, 2, 3, 4, 5, 12, 13 | Five coverage closures added where the related content lives, not appended: **BUG-25** multi-run geometry as a paragraph in item 1 (element box only when it owns exactly one run, text-node box otherwise); **BUG-22** split-control surface attribution as a paragraph in item 4 (surface axes resolve against the node that bears the surface; back-compat note — no reference on a pre-BUG-22 bundle, so the resolution is inert); **BUG-24** the band overlay/scrim as an explicitly captured axis read through the canvas colour probe rather than an `rgba()` regex, placed immediately before item 9's exclusion rule that depends on it; **BUG-16** the offline re-extract against the bundle's own mirrored faces, promoted to the head of item 7 with the fontLoad false-positive correction reworded as the *remainder after* it (closing the tension the assessor flagged); **REQ-73** the adjacent-row `gap` axis as item 12, with its 6px / 16px-under-`--tolerant` tolerance and the band-padding supersession it carries. In-scope line rewritten to name all of them. Technical Context: retired capability name corrected to "1c Capture & Diff Fidelity (CAP-63)" (finding 12), and two synthesis bullets added — "where an axis is read is as load-bearing as whether it is captured" (items 1, 4, 9 are one mistake in three places) and the shared root between the overlay axis and the translucent-fill exclusion. |
| 3 | story-body-edit | STORY-76 (story-82eb6908) | 6, 9, 12 | **REQ-72** added as item 0 — stop colours resolved to hex *in-browser*, framed as the precondition the stop-position axis stands on (a Tailwind gradient computing to `oklch`/`oklab`/`color()` captures as angle-with-empty-stops otherwise). **Authoring half marked superseded**: the user-story sentence no longer claims "authorable as a content value"; the Authored sub-bullet is retitled "(superseded — legacy module content-field path)" citing REQ-84 (modules deleted) and REQ-96 (`config` never aesthetic), recording `resolveSurfaceGradient`'s zero production callers and routing the live L1 `surfaceGradient`/`gradientFill` axis to CAP-70 under this capability's own value-axis ownership rule. In-scope narrowed to capture + diff; Out-of-scope rewritten accordingly. Retired name `[[values_diff_fidelity]]` (CAP-63) replaced with a sibling-story reference (finding 12). |
| 4 | ac-deprecate | AC-637 (acceptance_criterion-377af866) | 9 (paired with #3) | `status` set to `deprecated` — it was carrying an invented `lifecycle: deprecated` while still `status: active`, i.e. still counted in the matrix. Body prefixed with lineage to REQ-84 / REQ-96 and the zero-production-callers evidence; original criterion and verification preserved below the fold. Paired in the same call as #3 so the matrix never sits in a state where the story disclaims the authoring half while its AC still asserts a `text-block` render. |
| 5 | story-body-edit | STORY-77 (story-16f2793c) | 8, 7, 12, 13 | The largest gap. Story sentence and Description widened from "the `--size` selector" to the ladder and the modes over it. Added item 5 (**ladder persistence at capture is this story's artifact**, not borrowed infrastructure), item 6 (**`--multi-viewport`** — cell-for-cell projection across every persisted rung, worst-cell-first ordering, terminal refusal on a bundle with no ladder), item 7 (**`--collapse`** — per-defect rather than per-cell, with why the un-collapsed view stays the default), and item 8 (**`--clusters`**, finding 7's unhomed REQ-76 — cause roll-up with the several-properties-one-cause rationale, `fix`/`review`/`accept` dispositions, the derived-axes-never-counted and width-scope-always-shown rules, and the fall-back-to-property-name-at-`review` behaviour so a new axis cannot silently vanish from the count). Technical Context records the REQ-58 T2/A → REQ-64 → REQ-76 provenance and why the three views are one story (each consumes the previous one's output). Out-of-scope sharpened against STORY-75 and STORY-78; retired self-reference "Generalizes CAP-63 (1c Values-Diff Fidelity)" replaced. `updated_by` set to `bundle-ab9e0cb6`. |
| 6 | story-body-edit | STORY-78 (story-2c7069fe) | 12 | "Belongs to CAP-65 (1c Size-Aware Diffing)" → "Belongs to CAP-63 (1c Capture & Diff Fidelity)"; the plan-item-3 dependency now names sibling STORY-77 rather than the deprecated capability, with a one-line note that CAP-65 was merged by the 2026-08-05 rebalance. |
| 7 | story-body-edit | STORY-79 (story-e15a19ef) | 12, 13 | "Related capabilities: CAP-63 (1c Values-Diff Fidelity), CAP-65 (1c Size-Aware Diffing)" → "Related stories and capabilities: the sibling stories in this same capability, CAP-63 (1c Capture & Diff Fidelity) — STORY-75, STORY-77/STORY-78" (the self-reference-under-a-retired-name that survived the 2026-08-31 rewrite). `updated_by` restored to `["bundle-b3b7c399", "bundle-15c1f647", "bundle-31e474b9"]`. |
| 8 | story-body-edit | STORY-124 (story-080c6036) | 10 | Technical Context: "Filed under CAP-102 (1c Capture & Diff Fidelity)" → "Filed under CAP-63". Parenthetical name and the quoted scope phrase left unchanged, exactly as the finding specifies. This is the defect CAP-63's own body predicted would keep surfacing as an overlap cluster until a step permitted to edit story content corrected it. |

### Field-level writes (finding 13)

| Ticket | `updated_by` before | after |
|---|---|---|
| STORY-75 | `[bundle-cceaba25, bundle-ee56a66e]` | `+ bundle-31e474b9` (REQ-63 / BUNDLE-7), `+ bundle-4ff83a8b` (BUNDLE-10 — source of findings 2–5) |
| STORY-79 | `bundle-b3b7c399` | `+ bundle-15c1f647` (REQ-44, guarantee 6 — lost in the 2026-08-31 rewrite), `+ bundle-31e474b9` (BUNDLE-7 plan item 9, guarantee 3) |
| STORY-77 | *(unset)* | `bundle-ab9e0cb6` (REQ-58 / REQ-61) |

BUNDLE-10 (`bundle-4ff83a8b`) now appears on a story for the first time anywhere
in the matrix, which was the assessor's named systemic root under findings 2–5.

## Code Edits

None this call. Every finding was `story-body-edit` or a paired `ac-deprecate`;
the assessor recorded **no `code-issue` findings** ("every gap above is the
matrix failing to describe working code"). Production code was read, not
written — `tools/generate/src/cli/fidelity.ts:429-530` (the `DefectCause`
taxonomy, dispositions, `clusterDefects`, `formatClusterReport`) and
`tools/generate/src/cli/capture/values-diff.ts` REQ-73 sites (`:363`, `:1361`,
`:1530`, `:2493`, `:2575`) were re-read directly so the added story text states
the landed behaviour rather than paraphrasing the report.

## Verification

No test run applies — no code changed and this level authors no UATs. Instead
all eight writes were read back from the store and asserted programmatically:
each retired string absent (`constructs an Astro container`, `Belongs to CAP-65`,
`CAP-63 (1c Values-Diff Fidelity)`, `Filed under CAP-102`, `and authorable as a
content value`, `Belongs to capability **1c Values-Diff Fidelity**`) and each
newly required string present. All checks pass. AC-637 re-read confirms
`status: deprecated` (not merely `uat_coverage`), so it is durably out of the
active matrix.

## needs_review Items Forwarded

None. No finding in REPORT-43e0f0f2 was categorised `needs_review`, and none
required a judgement the report had not already made.

## Downstream, deliberately not done at this level

The report is explicit that the `ac-add` halves of findings 1–8 are "a forward
signal, not an instruction to act at this level". Eight behaviours now described
in story bodies carry no AC yet:

| Behaviour | Story |
|---|---|
| adjacent-row `gap` axis + band-padding supersession | STORY-75 (item 12) |
| split-control surface attribution | STORY-75 (item 4) |
| band overlay captured through the colour probe | STORY-75 (item 9) |
| per-text-node run geometry | STORY-75 (item 1) |
| offline re-extract against mirrored faces | STORY-75 (item 7) |
| in-browser hex resolution of stop colours | STORY-76 (item 0) |
| `--multi-viewport` ladder-wide diff + `--collapse` | STORY-77 (items 5–7) |
| `--clusters` cause view + dispositions | STORY-77 (item 8) |

Two further downstream notes for whoever runs level=ac / level=uat:

- STORY-76's four surviving ACs (AC-634, AC-635, AC-636, AC-638) are all
  capture/diff criteria and remain valid under the narrowed scope — **except
  AC-638** ("a gradient-typed content field accepts a well-formed gradient and
  rejects a malformed value"), which is an *authoring* criterion on the same
  superseded content-field path as the now-deprecated AC-637. It was left active
  because the finding named only AC-637 and validation of a value shape is not
  the same claim as rendering it on a deleted module; it is worth a look at
  level=ac rather than a silent deprecation here.
- The capability's `uat_coverage: fail` and STORY-75/77/79's `fail` are untouched
  — UAT-level facts, out of scope at level=story, and not fields this step owns.
