---
uid: report-2a0fed77
id: REPORT-2091
type: report
title: 'UAT Coverage: L1 Reproduction Pipeline: Fold & Acceptance Gate'
created_by: xgd
created_at: '2026-08-16T08:05:21.306137+00:00'
updated_at: '2026-08-16T08:05:21.306137+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-2049c9ec
  violations: 8
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: L1 Reproduction Pipeline: Fold & Acceptance Gate

**Result**: FAIL
**AC verdicts**: 31 pass, 3 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 0 pass, 2 fail, 0 stale, 0 needs_review
**Capability verdict**: fail

CAP-71 (`capability-2049c9ec`) holds two `upgrade` stories: STORY-84
(`story-8acc338d`, the fold) with **18** ACs and STORY-86 (`story-24098299`, the
3-probe gate + cross-gate reconciliation) with **16**. All 34 are `status:
active`, `kind: behavior`; none is retired by any intent in the ledger, so there
are no `deprecated` verdicts and no `needs_review`. This is attempt **7**.

## Method and its limit this run

**Command execution is denied in this session's harness mode.** `npx vitest run …`
was refused both as a batch and for a single file, as were shell `for` loops and
`mkdir`. **Every verdict below is therefore derived statically** — by reading each
AC body from the ticket store, the test body that names it, and the production
code the test drives. This is the right instrument for the question this workflow
asks (*does the test substantively exercise the AC's behavioral claim?*), which is
answerable from the test source; it is **not** a claim that the suite is green.
Test outcome is the quality gate's question, not this one. Where the previous
uat-coverage report (REPORT-1732 / `report-dd339267`, 2026-08-09) relied on an
executed run or on a measured `chromiumAvailable()`, I have re-derived a static
form of the claim rather than carrying the executed one forward.

All 34 ACs have **exactly one** `test_UAT_AC<n>_*` test, and no AC is covered only
by a structural/AST check. Coverage is broad and mostly genuine; the failures are
specific.

## Cumulative Intent Considered

Statuses were read from the live tickets this session, not inherited.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-83 | free_and_reconciled | 2026-07-20 | Capture→L1 fold: keyframes + `interpolate\|snap` + visibility, oracle retention, advisory hint sidecar; dissolves `adopt-values` — origin of STORY-84 | YES |
| REQ-86 | free_and_reconciled | 2026-07-20 | End-to-end 3-probe gate + demand-driven promotion — origin of STORY-86 | YES |
| REQ-88 | free_and_reconciled | 2026-07-21 | `1c repro` / `1c l1-gate`; **responsive padding tracks**; **viewport-height response** | YES (partly unexpressed — findings 6, 7) |
| REQ-92 | free_and_reconciled | 2026-07-23 | Rebuild `foldToL1` to populate the **full** L1 language (image/box/container) | YES (finding 1) |
| BUG-6 | free_and_reconciled | 2026-07-23 | Unexpressed element → typed residual, never a silent drop | YES |
| BUG-7 / BUG-8 / BUG-9 | free_and_reconciled | 2026-07-23 | Row main-axis tiling; half-open breakpoint intervals; recursive region-aware promotion | YES |
| **BUG-14** | free_and_reconciled | 2026-07-23 | Surface reconstruction is section-band → card, **retiring** the per-run model | YES (retires a clause of AC-731 — warning 2) |
| **BUG-17** | free_and_reconciled | 2026-07-23 | Fold a captured element's per-side padding | YES (finding 5) |
| **BUG-18** | free_and_reconciled | 2026-07-23 | Varying numeric text axes keyframed per width, **retiring** the widest-sample rule | YES (finding 4; retires a clause of AC-691 — warning 1) |
| **BUG-20 / BUG-21** | free_and_reconciled | 2026-07-23/24 | Remaining box treatments; the self-painting pill/chip run; padded control is self-painting | YES (finding 8) |
| REQ-94 | free_and_reconciled | 2026-07-25 | Cross-gate reconciliation, perceptual floor, reference coverage, named causes | YES |
| REQ-96 | free_and_reconciled | 2026-07-26 | L1 `control` node — a captured control binds instead of being dropped | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Non-destructive framing + colour adjustment as typed L1 axes; added AC-1133/AC-1134, widened AC-729 | YES — new since the last coverage cycle |

No intent retires a whole AC. BUG-14 and BUG-18 each retire a **clause** of an
otherwise-active AC (warnings 1 and 2); their resolution is `ac-edit` and was
already filed by today's ac-level cycle (REPORT-2089 / `report-a9ff561a`).

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-84 (fold) | REQ-83, REQ-92, REQ-96, REQ-136, BUG-6, BUG-11…BUG-14, BUG-27 | **fail** | Three ACs fail on evidence (findings 1–3). Four reconciled fold behaviours are carried by **no AC at all** (findings 4–8) — but see the headline below: their evidence exists |
| STORY-86 (gate) | REQ-86, REQ-88 (`l1-gate`), REQ-94, BUG-5, BUG-7, BUG-8, BUG-9 | **fail** | Body is faithful to intent and all 16 ACs are substantively covered; the body's own **third** envelope violation is stated by no AC and asserted by no test (finding 4) |

## The headline this run: attribution, not absence

The four STORY-84 gaps that previous cycles recorded as coverage holes are
**not** untested behaviour. Each has a substantive free-coded UAT suite already
in the repo:

| Behaviour | Live in code | Existing evidence |
|---|---|---|
| BUG-18 responsive text tracks | `fold.ts:607` `RESPONSIVE_TEXT_AXES`, `:623` `responsiveTextTracks`, applied `:1853` | `tests/bug18-responsive-text-axes.test.ts` — 6 tests, incl. `…_mobile_font_size_is_not_desktop` (the discriminator) |
| BUG-17 / REQ-88 padding + responsive padding | `fold.ts:552` `foldPadding`, `:657` `responsivePaddingTracks`, applied `:1856-1861`, `:1984-1989`, `:2026-2031` | `tests/bug17-fold-padding.test.ts` |
| REQ-88 viewport-height response | `fold.ts:173-205`, `:1548-1555`, `:1800` (`atHeight`) | `tests/req88-viewport-relative-and-nowrap.test.ts:331-370` — asserts `kf.atHeight` per width, plus the "without a probe, no response is invented" negative |
| BUG-20 / BUG-21 self-painting run | `fold.ts:2277` (`chip.responsivePadding`) | `tests/bug20-chip-self-surface.test.ts` (11 tests), `tests/bug21-control-surface-outset.test.ts` |

Those suites are named `test_UAT_FC_<INTENT>_*` — traceable to intent, **not** to
an AC. So the defect is that the **capability matrix under-describes what the fold
does**, not that the fold is unproven. That makes findings 5–8 materially cheaper
than prior reports implied: the repair is `story-body-edit` + `ac-add`, and the
UAT can largely be **re-attributed** (renamed to `test_UAT_AC<new>_*`, or a thin
AC-named UAT written over the same fixtures) rather than authored from scratch.

Findings 1–4, by contrast, are genuine evidence gaps — no test anywhere asserts
those behaviours.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | ac | AC-689 | uat-edit | The AC's headline claim is the **full** L1 language ("not text alone"), and its Verification says "Fold a capture containing runs, media and painted panels and assert the document contains leaves of more than one kind". `test_UAT_AC689` (`tests/reconciliation-l1-fold.test.ts:207`) drives `cmdCapturePage` with `FakeDriver`, whose `signalsFor()` (`:103-133`) carries **one** text run and `items: []`, `fields: []`, `images: []`. It asserts artifact existence, `validateL1`, `widths`, root kind and the empty-ladder throw — every clause except the one the AC is named for. REQ-92's clause has zero evidence on the `cmdCapturePage` bundle path. | Add a media element and a painted panel to `signalsFor()`; assert on the `l1.json` read back from the bundle that `new Set(children.map((n) => n.kind)).size > 1` |
| 2 | violation | ac | AC-691 | uat-edit | The AC turns on a height distinction — "a box, image or backing-surface leaf additionally pins its height at every keyframe … a text leaf's keyframes carry no height" — and its Verification names both halves. `test_UAT_AC691` (`:256-290`) asserts `at`, x, y, width and `axes.fontSizePx`, and makes **no height assertion at all**; its fixture contains no image or box leaf. A regression that pinned text heights would leave this UAT green. | Assert `kfs.every((k) => k.height === undefined)` for the text leaf, and extend the fixture with one media element and one painted panel asserting each keyframe's `height` equals the captured box height |
| 3 | violation | ac | AC-694 | uat-edit | The AC requires the sidecar to report, per visible element: ancestry (parent id), the parent's computed layout (display, flex-direction, justify-content, gap, grid template columns), authored sizing unit per axis, position mode, and a sibling-repetition count. On the always-run path (`:345-359`) the test asserts only that `mediaBreakpoints` is sorted and that some node has `widthUnit === 'percent'` — both read back out of `CANNED_HINTS` (`:135-153`), a constant the **test itself** hands the driver, so that path is near-vacuous. The real-engine assertions (`:365-389`) sit behind `if (!(await chromiumAvailable())) return` — a silent early return. Ancestry, position mode, repetition count, gap, flex-direction and grid template columns are asserted on **neither** path. | Assert the remaining criterion dimensions on the real-engine path, and make the skip explicit (`it.skipIf`) so an unconditionally-skipped branch is visible rather than reported as a pass |
| 4 | violation | story | STORY-86 | ac-add + uat-add | The story body states the evaluator "reports envelope violations (sibling overlap, horizontal clip beyond the viewport, **and pinned-box content overflow**)". The third is real and live: `tools/generate/src/l1/probes.ts:410-415` pushes a finding with detail `content height Npx exceeds pinned box height Mpx` when a pinned container's flow interior overruns its keyframe height. **No AC states it** — AC-706 scopes itself to "no two leaf boxes overlap and no leaf clips beyond the viewport" — and **no test in the repo reaches it**: `grep` for `exceeds pinned box` / `content height` across `tests/` returns nothing. AC-710's clip assertion (`:665-670`) takes its finding from `evaluateLayout(narrow, 500)` — the viewport-edge clip at `probes.ts:453` — and asserts only `detail).toMatch(/\d+px/)`, which both details satisfy, so it does not discriminate. This has now survived four cycles. | Add an AC for the pinned-box content-overflow violation and a UAT that pins a container's keyframe height below its grown flow interior, asserting the finding's `detail` names the pinned height and its `paths` name the container |
| 5 | violation | story | STORY-84 | story-body-edit + ac-add | BUG-17 / REQ-88 (both reconciled) fold a captured element's per-side padding and its per-width responsive padding tracks onto text/image/box leaves. Live at `fold.ts:552`, `:657`, `:1856-1861`. The story body never mentions padding; no AC states it. | Add the padding fold to the story's account of what the fold emits; add an AC; re-attribute `tests/bug17-fold-padding.test.ts` to it |
| 6 | violation | story | STORY-84 | story-body-edit + ac-add | BUG-18 (reconciled) makes a **varying** numeric type axis (`fontSizePx`, `lineHeightPx`, `letterSpacingPx`) fold to a per-width scalar track while a static axis stays scalar. Live at `fold.ts:607-642`, applied `:1853`. The story body describes only geometry keyframes; no AC states the track. | Add the responsive scalar track to the story body; add an AC; re-attribute `tests/bug18-responsive-text-axes.test.ts` |
| 7 | violation | story | STORY-84 | story-body-edit + ac-add | REQ-88 (reconciled) gives a keyframe a measured `d(geometry)/d(viewport height)` response so a `100vh` block reproduces as a height response rather than a pinned pixel height. Live at `fold.ts:173-205`, `:1548-1555`, `:1800`. No story-body sentence, no AC. | Add the viewport-height response to the story body; add an AC; re-attribute `tests/req88-viewport-relative-and-nowrap.test.ts:331-370` |
| 8 | violation | story | STORY-84 | story-body-edit + ac-add | BUG-20 / BUG-21 (reconciled) make a badge/pill run self-painting — it carries its own chip surface on the text leaf rather than getting an outset backing box, and a padded control does not double-apply its padding. Live at `fold.ts:2277`. No story-body sentence, no AC. | Add the self-painting run to the story body; add an AC; re-attribute `tests/bug20-chip-self-surface.test.ts` / `tests/bug21-control-surface-outset.test.ts` |
| 9 | warning | ac | AC-691 | ac-edit | The AC body's closing sentence — "A node's authored typography axes are taken from its widest present sample (the desktop rendering)" — states BUG-18's **root cause** as the rule. BUG-18 (reconciled) retired it. Already filed by today's ac-level cycle; recorded here so the uat-editor does not write evidence for a retired clause. | Scope the widest-sample rule to **static** axes only |
| 10 | warning | ac | AC-731 | ac-edit | The AC body describes the per-run backing-box model ("Runs sitting on the band get no backing box"); BUG-14 (reconciled) replaced it with section-band → card. `test_UAT_AC731` (`…full-language.test.ts:303`) asserts the **shipped** band+card model (1 `section-band-*` + 2 `card-*` for five runs) and is correct — the AC text is what drifted. Graded `pass` on that basis. Already filed at ac level. | Rewrite the AC body to the band → card model |
| 11 | warning | ac | AC-729 | — (accept) | REQ-136 widened this AC with "how the picture is *seen*" (framing + colour adjustment). `test_UAT_AC729` explicitly delegates that clause to its siblings (`:84-88`), and AC-1133 / AC-1134 do prove it thoroughly. Recorded as accepted delegation, not a gap. | None — or add a one-line pointer in the AC body |

## Notes for the Editor

**Findings 1–3 are one file.** All three live in
`tests/reconciliation-l1-fold.test.ts`, untouched since 2026-07-22, and all three
are the same defect shape: the fixture is too thin to reach the clause. A single
pass that enriches `signalsFor()` with one media element and one painted panel
closes finding 1 outright and supplies the leaves finding 2 needs; finding 3 is
independent but in the same file. Do them together.

**Findings 5–8 are one pass, and cheaper than they look.** Read the "attribution,
not absence" section above before estimating. The behaviour is implemented and
already proven by `test_UAT_FC_*` suites; what is missing is the AC to carry the
claim and the story-body sentence to describe it. Prefer re-attributing the
existing UAT (rename to `test_UAT_AC<new>_*`) over writing a second test over the
same fixtures — a duplicate would violate the project's one-authoritative-location
rule. If the matrix convention forbids renaming a free-coded UAT, write the
AC-named UAT as a thin wrapper over the same fixture module rather than a copy.

**Finding 4 is the only genuinely uncovered behaviour in this capability** and is
the one to prioritise: it is a live branch of the acceptance gate's own evaluator
with zero executable evidence, and it has now been reported in four consecutive
cycles without repair.

**On grading AC-694.** The `chromiumAvailable()` early return is a silent skip: on
a runner without Chromium the test reports as passing while asserting almost
nothing. Whether or not Chromium is present in any given worktree, a UAT whose
substantive half can vanish without changing the result is not evidence. Making
the skip explicit is part of the fix, not cosmetic.

**Execution was not possible this run** (see Method). If the next cycle runs in a
harness where `npx vitest` is permitted, the three failing ACs above should be
re-checked against an executed run — but note that all three fail on *what the
tests assert*, not on whether they pass, so an execution would not change these
verdicts.
