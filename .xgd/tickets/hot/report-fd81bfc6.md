---
uid: report-fd81bfc6
id: REPORT-3745
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=ac)'
created_by: xgd
created_at: '2026-09-10T14:37:37.829770+00:00'
updated_at: '2026-09-10T14:37:37.829770+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: ac
  violations: 3
  warnings: 4
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: ac

**Result**: FAIL
**Violations**: 3
**Warnings**: 4
**Needs review**: 0

CAP-71 (`capability-2049c9ec`) holds two stories, both `story_kind: upgrade`, so both
are Capability-Matrix kinds expected to carry ACs and both do. STORY-84
(`story-8acc338d`, the fold) now carries **23** ACs (18 `active` + 5 `pending`);
STORY-86 (`story-24098299`, the 3-probe gate + cross-gate reconciliation) carries
**16**, all `active`. None is `deprecated`.

**The tree moved substantially since the last ac-level cycle (REPORT-2091 /
`report-a9ff561a`, 2026-08-16, 6 violations / 3 warnings).** Five ACs were authored
under STORY-84 — AC-1625 (responsive tracks), AC-1626 (per-side padding), AC-1627
(viewport-height response), AC-1628 (`1c repro` materialization), AC-1629 (band
scrim) — AC-691 was extended with the varying-axis carve-out and a cross-reference,
and AC-731 was rewritten to carry the self-painting-run discrimination and the
captured-surface-rect card geometry. **REPORT-2091 findings 3, 4, 5, 6 and info 11
are closed**, and REPORT-2091 finding 2's parts (a) and (c-partial) with them. Each
closure was re-verified against the live source in this worktree, not taken on the
fix report's word.

**Working reference.** The story-level cycle for this capability ran **today** and
**passed** (REPORT-3744 / `report-421de5ec`, 2026-09-10T14:30, 0 violations), so
per the level cascade both story bodies are my working reference. I escalated to
implementation exactly once — finding 3 — where the story body is internally
inconsistent about one decision and therefore cannot arbitrate its own ACs.

**What is left.** Two genuine coverage holes, both supported by the stories' own
bodies and neither requiring a story-body edit: STORY-86's third envelope violation
(**fifth** consecutive raise) and STORY-84's derived nowrap threshold (**new** at
this level). One direct AC-vs-AC contradiction over the page-base rule. The three
carried-over warnings on AC-705 / AC-710 / AC-729 are unrepaired.

## Cumulative Intent Considered

ACs in this tree carry no `intent_uid` / `updated_by` of their own — their fields
are `story_uid`, `kind`, `regression_only`, `uat_coverage` only — so attribution
resolves at story level. Both stories carry `intent_uid: bundle-31e474b9`
(BUNDLE-7); STORY-84 carries `updated_by: request-8a132869` (REQ-136) and STORY-86
`updated_by: bundle-ee56a66e` (BUNDLE-11). Every status below was read from the
store **this run**.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-66 | free_and_reconciled | 2026-07-18 | `adopt-values` pre-L1 reproduction command | YES (retired by REQ-83) |
| REQ-79 | free_and_reconciled | 2026-07-19 | Framework pivot to L1; absolute-base reproduction (D1) | YES |
| REQ-83 | free_and_reconciled | 2026-07-20 | Capture→L1 fold + oracle retention + advisory hints — origin of STORY-84 | YES |
| REQ-86 | free_and_reconciled | 2026-07-20 | End-to-end 3-probe gate + demand-driven promotion — origin of STORY-86 | YES |
| REQ-88 | free_and_reconciled | 2026-07-21 | `1c repro` / `1c l1-gate`; captured surface rect; section-edge clamp; responsive padding tracks; viewport-height response; **nowrap threshold** | YES — finding 2 |
| BUG-5 | free_and_reconciled | 2026-07-23 | Occurrence-index fidelity pairing + idempotence identity | YES |
| BUG-6 | free_and_reconciled | 2026-07-23 | Unexpressed element → typed residual | YES |
| BUG-7 | free_and_reconciled | 2026-07-23 | Evaluator must tile a row along the main axis | YES |
| BUG-8 | free_and_reconciled | 2026-07-23 | Half-open breakpoint intervals | YES |
| BUG-9 | free_and_reconciled | 2026-07-23 | Recursive, region-aware promotion | YES |
| REQ-90 / REQ-91 / REQ-92 | free_and_reconciled | 2026-07-23 | Resource table, text pixel-movers, full-language fold | YES |
| BUG-11 / BUG-12 / BUG-13 | free_and_reconciled | 2026-07-23 | `surfaceFill`/`surfaceGradient`; font faces; background-image elements | YES |
| **BUG-14** | free_and_reconciled | 2026-07-23 | Nest, don't flatten: section-band → card → text; stop per-run boxing | YES — **now expressed** (AC-731 rewrite) |
| BUG-17 | free_and_reconciled | 2026-07-23 | Fold per-side padding onto the leaf | YES — **now expressed** (AC-1626) |
| BUG-18 | free_and_reconciled | 2026-07-23 | Keyframe the varying type axes per width | YES — **now expressed** (AC-1625, AC-691) |
| **BUG-19** | free_and_reconciled | 2026-07-23 | A full-bleed **bar** (footer/nav strip) seeds a band, not tiny cards | YES — **still unexpressed** (warning 7) |
| BUG-20 / BUG-21 | free_and_reconciled | 2026-07-23/24 | Pill/chip and padded-control runs are self-painting | YES — **now expressed** (AC-731) |
| BUG-22 | free_and_reconciled | 2026-07-24 | `SurfaceShape` — captured surface rect as card identity | YES — **now expressed** (AC-731) |
| BUG-23 | free_and_reconciled | 2026-07-24 | `localizeAssets`; unmirrored handle fails the import | YES — **now expressed** (AC-1628) |
| **BUG-24** | free_and_reconciled | 2026-07-24 | Colour alpha representable; the band scrim | YES — **now expressed** (AC-1629) |
| BUG-27 | free_and_reconciled | 2026-07-25 | Backdrop index; backdrop edges are section edges; **backdrops count toward the page base** | YES — finding 3 |
| REQ-93 | free_and_reconciled | 2026-07-25 | L1 pages host behavior modules in slots | YES |
| REQ-94 | free_and_reconciled | 2026-07-25 | Cross-gate reconciliation, floor, coverage, named causes | YES |
| REQ-96 | free_and_reconciled | 2026-07-26 | L1 `control` node — a captured control binds | YES |
| REQ-114 | free_and_reconciled | 2026-07-31 | `l1Color` = `hex \| PaletteRef` | out of scope (CAP-70) — info 11 |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Framing pair + colour-adjustment stack | YES — expressed (AC-1133/1134/729) |
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Carrier for REQ-63/79/82/83/84/86 | YES |
| BUNDLE-11 (`bundle-ee56a66e`) | free_and_reconciled | 2026-08-05 | Carrier for BUG-27 / REQ-94 / 96 / 97 / 98 | YES |
| REQ-154 | **bundled** | 2026-08-20 | CF Browser Rendering driver behind the existing `BrowserDriver` seam | imminent — **no ask on this capability** (body: 0 occurrences of "fold", "probe", "oracle"; the seam is CAP-63's) |
| REQ-155 / REQ-156 / REQ-157 | draft | 2026-08-20 | Capture in workerd; sharp off the fidelity path; fidelity surface | NO — not yet active |
| REQ-134 | abandoned | 2026-08-12 | Image generation component | NO |

No intent created after 2026-08-16 asks anything of the fold or the gate; the
2026-08/09 wave (REQ-140…REQ-166, BUG-34…BUG-39) is builder / workers-runtime /
KB work.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-689 (validated full-language document) | REQ-83, REQ-92 | aligned |
| AC-690 (oracle retained) | REQ-83 | aligned |
| AC-691 (geometry keyframes; scalar from widest sample, varying axis carved out) | REQ-83, BUG-18 | **aligned — repaired since REPORT-2091** (now says an axis identical at every width is scalar, an axis the page varies "folds to a per-width track instead (see the responsive-track criterion)"), matching `fold.ts:1837` + `:1853` |
| AC-692 / AC-693 (interpolate/snap; visibility) | REQ-83 | aligned |
| AC-694 / AC-695 (hint sidecar; advisory-only) | REQ-83 | aligned |
| AC-696 (adopt-values removed) | REQ-66 retirement | aligned |
| AC-729 (image leaf) | REQ-92, REQ-136 | aligned; still duplicates AC-733's negative case — warning 6 |
| AC-730 (text-free surface → box leaf) | REQ-92, BUG-11 | aligned |
| **AC-731** (run-composited surfaces, rewritten) | BUG-11, BUG-14, BUG-20, BUG-21, BUG-22 | **partly repaired**: self-painting families and captured-surface-rect grouping now stated and verified against `fold.ts:1003-1054`, `:1599-1666`. **Page-base clause still contradicts AC-812 and code — finding 3.** BUG-19's bar rule still absent — warning 7 |
| AC-732 (text pixel-movers + font table) | REQ-90, REQ-91, BUG-12 | aligned |
| AC-733 (typed residuals; controls bind) | BUG-6, REQ-96 | aligned |
| AC-1133 / AC-1134 (framing pair; colour-adjustment stack) | REQ-136 | aligned |
| **AC-1625** (responsive tracks, `pending`) | BUG-18, REQ-88 | **aligned** — "at least two sampled widths carry the axis *and* their values are not all equal", widest keyframe equals the scalar, segments omitted → `interpolate`; matches STORY-84 Technical Context verbatim and `fold.ts:607-642`, `:657` |
| **AC-1626** (per-side padding, `pending`) | BUG-17, REQ-88 | **aligned** — insets inside the pinned border box, zero/absent/out-of-range sides dropped, all-zero emits no axis; matches `foldPadding()` `fold.ts:552` |
| **AC-1627** (viewport-height response, `pending`) | REQ-88, BUG-27 | **aligned** — measured finite difference, no probe → no response, probe is never a keyframe, card inherits its representative row's; matches `fold.ts:174/188/249-287`, `:1687-1688` |
| **AC-1628** (`1c repro` materialization, `pending`) | REQ-88, BUG-23 | **aligned** — closes REPORT-2091 info 11; verb exists (`cli/index.ts:803`, `cmdRepro` `cli/repro.ts:95`) |
| **AC-1629** (band scrim, `pending`) | BUG-24 | **aligned** — one box, two axes, per-axis widest-width read, image **OR** scrim triggers the fold; matches `foldSectionBackgrounds` `fold.ts:1254-1292` line for line |
| **STORY-84 AC tree** | **REQ-88 (`nowrapThreshold`)** | **gap — no AC covers the derived nowrap threshold** (finding 2) |
| AC-812 (backdrop → background layer; edges bound bands; fill counts to page base) | BUG-13, BUG-27 | aligned to code; contradicted by AC-731 — finding 3 |
| AC-813 (control leaf rebased to seam) | REQ-93, REQ-96 | aligned |
| AC-814 (offline re-fold) | REQ-88 | aligned |
| AC-705 (fidelity pairing, text + kind keys) | BUG-5, REQ-96 | aligned; its report shape is restated by AC-710 — warnings 4, 5 |
| AC-706 / AC-707 (off-sample, robustness) | REQ-86, BUG-9 | aligned to the story body, but both enumerate only two of its three envelope violations — finding 1 |
| AC-708 / AC-709 (combined gate; recursive recovery) | REQ-86, BUG-9 | aligned |
| **AC-710** (diagnostic findings) | REQ-86 | **stale vs AC-705 + duplicative** — warnings 4, 5 |
| AC-724 (idempotence identity) | BUG-5 | aligned |
| AC-734 / AC-735 (row tiling; half-open intervals) | BUG-7, BUG-8 | aligned |
| AC-736 (backing-surface overlap exception) | BUG-14 | aligned to the story body; broader than code — info 8 |
| AC-737 (fold-residual channel) | REQ-92, REQ-96 | aligned |
| AC-852–AC-856 (cross-gate verb, floor, coverage, causes, exit code) | REQ-94, BUG-27 | aligned |
| **STORY-86 AC tree** | REQ-86 (story body: "sibling overlap, horizontal clip beyond the viewport, **and pinned-box content overflow**") | **gap — the third violation is uncovered** (finding 1) |
| STORY-84 ↔ STORY-86 | — | exclusivity OK across stories; the reciprocal out-of-scope clauses partition fold vs gate cleanly |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-86 AC tree | ac-add | STORY-86's body names **three** envelope violations the analytic evaluator reports — "sibling overlap, horizontal clip beyond the viewport, **and pinned-box content overflow**" — and puts "its envelope findings" In scope. The third is live and re-verified in this worktree: `tools/generate/src/l1/probes.ts:405-416` pushes a `clip` finding with detail `content height {N}px exceeds pinned box height {M}px` when a pinned box/container's flow-interior content exceeds `keyframes[0].height`, and `evaluateLayout`'s docstring (`probes.ts:429-433`) names all three. **No AC covers it.** Every AC that enumerates envelope violations names only overlap and viewport-edge clip: AC-706 ("no two leaf boxes overlap and no leaf clips beyond the viewport"), AC-707 ("no sibling overlap and no clip"), AC-734, AC-736 ("right edge extends beyond the viewport"); AC-710 fixes the finding vocabulary at "kind (overlap or clip)" without giving this trigger. A programmatic search for "overflow" / "content height" across all 39 AC bodies matches only AC-734's *title*. An implementer working from the AC tree alone would ship only the viewport clip. **Fifth raise: REPORT-1319 (2026-08-05), REPORT-1658 (2026-08-07), REPORT-1730 (2026-08-09), REPORT-2091 (2026-08-16); none repaired.** Fully supported by STORY-86's own body — no story-level dependency, no judgement call. | Author an AC under STORY-86: a pinned box/container whose flow-interior content height exceeds its pinned keyframe height is reported as a `clip` finding naming the overflow magnitude and the offending index path, at every evaluated width and under content perturbation. (Extending AC-707 alone is insufficient — AC-706 needs the same rule off-sample.) |
| 2 | violation | coverage | STORY-84 AC tree | ac-add | STORY-84's body devotes a bolded section to the derived nowrap threshold ("**The ladder also fixes where a run stopped wrapping**") and lists "the derived nowrap threshold a run carries" **In scope**. The body states three load-bearing rules: it is a **width, not a flag**; the threshold is the smallest width at which the reference was single-line **at that width and every wider one**, so a run one line at 1024 but two at 1280 yields the higher rung; and an unmeasurable line count **breaks the suffix** rather than reading as "one line". All three are live: `nowrapThreshold()` (`fold.ts:233-240`) scans the ladder backwards and breaks on `lineCountOf(...) !== 1`; `lineCountOf` (`fold.ts:215-220`) returns `undefined` when line height or glyph extent is unavailable; applied at `fold.ts:1843-1844` onto `axes.nowrapFromPx`, an optional axis in `packages/site-schema/src/l1/schema.ts:983`. **No AC under STORY-84 mentions it** — a case-insensitive search for "nowrap", "wrap", "single line" or "one line" across all 23 STORY-84 AC bodies returns one match, the word "wrapper" in AC-812. The renderer half is correctly out of scope and correctly owned elsewhere (AC-1010 under STORY-83 / CAP-70 states the floor's width gating), but AC-1010 specifies only what the renderer does *above* the threshold — it states none of the three derivation rules, so nothing in the matrix pins the fold's side. New at ac level. | Author an AC under STORY-84: the fold derives, per text run, the smallest sampled width at which the reference set it on a single line at that width and at every wider one, and carries it on the run as the `nowrapFromPx` axis; a run that is single-line at a width but wrapped at a wider one takes the higher rung; a width whose line count cannot be measured breaks the suffix rather than counting as single-line; a run that never rested on one line carries no axis. |
| 3 | violation | consistency | AC-731 (+ AC-812) | ac-edit | AC-731 opens "The solid fill that the greatest **number of runs** sit on becomes the folded document's background band, painted by the document body", and its Verification prescribes "assert the document background equals the dominant run fill". That is the **fallback**, not the rule. Re-verified in this worktree: `fold.ts:2105-2130` builds `bandHeightByFill` over `[...bandNodes, ...backdropNodes]` and picks the fill covering the **greatest total band height**; the run-count rule fires only `if (!band)` at `fold.ts:2136-2141`, with the captured canvas fill as a last resort at `:2142-2146`. The code comment states the reason explicitly (BUG-27: on a page whose panels are all nested "they are the only honest evidence of what the page is mostly painted in"). AC-812 already states the shipped half — "its fill also counts toward the page-base inference alongside the reconstructed bands, so the page base is chosen from measured evidence on a page that reconstructs almost no bands" — so **two sibling ACs currently give two different rules for one decision**, and AC-731's is the one that is false. Escalation to implementation is warranted here because the story body cannot arbitrate: its reconstructed-surfaces bullet says "the solid fill the most runs sit on becomes the document background band" while its backdrop bullet says "its fill counts toward the page-base inference" — the body is internally inconsistent on exactly this point, which is the condition the level cascade names for consulting the tier below. Carried from REPORT-2091 finding 2(b), unrepaired by the AC-731 rewrite. | Restate AC-731's page-base clause as: the document background band is the fill covering the greatest total band height across reconstructed bands **and captured backdrops alike**; the most-common run fill is the fallback used only when no full-bleed band was reconstructed, and the captured canvas fill the last resort. Defer the backdrop half to AC-812 rather than restating it, and fix the Verification to assert against band height, not run count. **Companion story-body edit needed** on STORY-84's reconstructed-surfaces bullet. |
| 4 | warning | consistency | AC-710 | ac-edit | AC-710 still states the fidelity residual in text-only terms — "carries the run text, the width, and the per-axis deltas … plus a coverage entry (text, width) for any oracle sample with no reproduced run". AC-705, its sibling under the same story, extends fidelity to image and box leaves, which carry no text and whose residuals are labelled by kind ("carrying the leaf's text (**or kind label**)"), and STORY-86's body states the same. A non-text residual therefore satisfies AC-705 and fails AC-710's literal wording. **Fourth raise** (REPORT-1319, REPORT-1658, REPORT-1730, REPORT-2091). | Reword AC-710's fidelity clause to "the leaf's text (or kind label)" and its coverage entry to "(text or kind label, width)" — or, better, apply warning 5 and delete the clause. |
| 5 | warning | exclusivity | AC-705 + AC-710 | ac-edit | AC-710's fidelity half restates AC-705's "Report shape" clause: the same residual (text, width, dx/dy/dw) and the same unmatched coverage entry are specified in both, and warning 4 shows the two copies have already diverged. AC-710's non-duplicated content is the **envelope-finding** diagnostic contract (kind, magnitude-bearing detail string, index paths of the leaves involved), which no other AC states. **Fourth raise.** | Narrow AC-710 to the envelope-finding diagnostic contract and delegate the fidelity residual shape to AC-705, leaving one authority per report shape. Pairs naturally with finding 1, which adds a third finding trigger to that same contract. |
| 6 | warning | exclusivity | AC-729 + AC-733 | ac-edit | AC-729 (image leaf) still closes with the negative case — "A media element captured with no resolvable source, or with no box at any sampled width, produces no leaf at all: it is signalled as a residual" — and its Verification prescribes it ("Fold a fixture whose media element has no resolvable source and assert no image leaf is emitted and a residual is signalled"). AC-733 owns the residual channel and states and verifies the identical scenario ("a media element with no resolvable source or no geometry … Fold a capture containing a source-less image … assert one typed residual"). Two ACs specify the same criterion and prescribe the same test in the same shape. **Third raise** (REPORT-1658, REPORT-1730, REPORT-2091); survived both REQ-136's 2026-08-12 rewrite and this cycle's edits. | Narrow AC-729 to what a foldable media element emits (leaf, source, alt text, geometry, axes) and let AC-733 own the source-less / geometry-less outcome; keep at most a cross-reference. |
| 7 | warning | coverage | AC-731 | ac-edit (+ story-body-edit) | BUG-19's full-bleed **bar** rule — a footer/nav strip whose runs are individually narrow but horizontally distributed seeds a **band** rather than a row of tiny cards — is live (`barBandFills`, `fold.ts:1384-1397`, applied `fold.ts:2059-2070`: "a bar member defines the full-bleed bar band") and expressed by no AC. Filed as a **warning rather than a violation** because, unlike findings 1–2, it is not supported by the story body either: STORY-84's reconstructed-surfaces bullet describes only band-vs-card by fill dominance and says nothing about a bar, so the AC tree cannot be repaired at this level without the story body gaining the rule first. Carried from REPORT-2091 finding 2(c). | Add the bar rule to STORY-84's reconstructed-surfaces bullet, then extend AC-731: a set of narrow runs sharing one fill and spanning the page's content width horizontally seeds a full-bleed band rather than one card per run. |
| 8 | info | consistency | AC-736 | — | AC-736 excludes "a painted surface leaf — a childless box carrying a card/panel/section fill, positioned behind the content it backs" from the sibling-overlap check. The code is narrower: only **fold-synthesized** surfaces are excluded (`isSynthesizedSurfaceId`, `probes.ts:460-474` — `section-band-*` / `section-bg-*` / `card-*`), while a genuine captured standalone surface (`box-*`) "is real painted content and still participates". AC-736 is faithful to STORY-86's body, which states the same broad rule, so this remains story-body drift rather than ac-level drift — but a UAT written to AC-736's literal wording would assert exclusion for a captured `box-*` leaf and fail. Unchanged from REPORT-2091 info 10. | none at this level; flag for the story-level editor, then tighten AC-736 to fold-synthesized surfaces |
| 9 | info | — | AC-1625, AC-1626, AC-1627, AC-1628, AC-1629 | — | These five carry `status: pending` (24 of the project's 660 ACs are `pending`; only 1 is `deprecated`), and none carries a `uat_coverage` field. Treated here as active expression of intent — `pending` is authorship state, not retirement — and their content was verified against both the story body and the source. Their UAT status is a uat-level question. | none at this level |
| 10 | info | exclusivity | AC-1625 + AC-1626 | — | Both speak about padding. This is an altitude split, not a duplicate: AC-1626 owns the `padding` axis itself (four sides, inset-not-inflate, drop rules), AC-1625 owns the varying-axis→track rule and uses a padding side only as one instance of it ("the varying padding side carries a track while a constant side on the same element does not"). Recorded so a future cycle does not read the overlap as drift. The same holds for AC-729 ↔ AC-1133/AC-1134 (what an image leaf composes vs the admission rules), carried from REPORT-2091 info 12. | none |
| 11 | info | coverage | REQ-114, REQ-154 | — | REQ-114 (`l1Color` = `hex \| PaletteRef`) asks nothing of the fold: `fold.ts:2115-2118` records that the fold emits colour literals only, palette assignment being a separate re-runnable pass; schema/renderer/validator are CAP-70. REQ-154 (`bundled`, imminent) swaps the Playwright driver for a CF Browser Rendering driver behind the existing `BrowserDriver` seam — its body contains zero occurrences of "fold", "probe" or "oracle" and the seam belongs to CAP-63. No AC is owed by either. | none |

## Notes for the Editor

**Findings 1 and 2 are the two clean, self-contained repairs — neither needs a
judgement call and neither needs a story-body edit.** Finding 1 sits under
STORY-86, is stated verbatim in STORY-86's own body, and has now survived **five**
ac-level cycles. Finding 2 sits under STORY-84, is stated in a bolded section of
STORY-84's body with all three of its derivation rules spelled out, and is
In-scope there. Close these two and the level's coverage property holds.

**Finding 3 is the last surviving piece of the old REPORT-2091 finding 2 and needs
a companion story-body edit.** The AC-731 rewrite closed parts (a) and most of the
self-painting work but left the opening sentence — the page-base rule — untouched,
and that sentence is now in direct conflict with AC-812 under the same story. An
`ac-edit` alone leaves STORY-84's body still saying "the solid fill the most runs
sit on". **If the ac-level editor may not touch story bodies, record the residual
story-body inconsistency explicitly** rather than closing the AC and leaving the
body behind — that omission is what carried this finding through four cycles.

**Warnings 4 and 5 are one edit to AC-710.** Narrowing it to the envelope-finding
diagnostic contract dissolves the staleness in warning 4 and the duplication in
warning 5 at once — and finding 1 then extends that same contract with its third
trigger, so doing 1, 4 and 5 together is strictly less work than doing them apart.

**What this cycle genuinely repaired, so the next one does not re-derive it.**
AC-1625/1626/1627/1628/1629 and the AC-691 extension close REPORT-2091's findings
3, 4, 5, 6 and info 11, and the AC-731 rewrite closes its finding 2(a) and finding
5. All six closures were re-verified against live source this run, not inherited
from the fix report.

**Verification performed.** Every code claim above was read in this worktree
(`regression-800a17f7`): `probes.ts:405-417` and `:429-433` (pinned-box
content-overflow clip; the docstring naming all three violations); `probes.ts:450-485`
(viewport-clip loop and the `isSynthesizedSurfaceId` overlap exclusion);
`fold.ts:209-240` (`lineCountOf` / `nowrapThreshold`) with `:1843-1844` and
`packages/site-schema/src/l1/schema.ts:983` (`nowrapFromPx`); `fold.ts:2105-2146`
(page base by greatest total band height over bands **and** backdrops, run-count
fallback, canvas last resort); `fold.ts:1384-1397` and `:2059-2070` (BUG-19 bar
detection and the band/card partition); `fold.ts:1244-1292` (`foldSectionBackgrounds`
— image **OR** scrim trigger, per-axis widest-width read); `cli/index.ts:57`/`:803`
and `cli/repro.ts:95` (`cmdRepro`). All 39 AC bodies were fetched from the ticket
store this run and searched programmatically for every term cited above; all ticket
statuses and field values were read from the store this run, including the
project-wide AC status census (635 active / 24 pending / 1 deprecated).
