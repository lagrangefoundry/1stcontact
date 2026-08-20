---
uid: report-2d3ee21a
id: REPORT-2345
type: report
title: Fix 1c Capture & Diff Fidelity (story) — attempt 7
created_by: xgd
created_at: '2026-08-20T03:19:44.782939+00:00'
updated_at: '2026-08-20T03:19:44.782939+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: story
  fixes_applied: 4
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — 1c Capture & Diff Fidelity (story)

**Attempt**: 7
**Fixes applied this call**: 4
**Violations remaining**: 0
**Needs more work**: false

All four violations (findings 1–4) and all three actionable warnings (findings
5–7) are resolved. Finding 8 is deferred by the assessor's own instruction ("No
edit yet — carry into BUNDLE-19's reconciliation"); findings 9 and 10 are `info`
with resolution "none".

## Root cause addressed

Findings 1–5 were one omission, not five: `bundle-4ff83a8b` (BUNDLE-10,
`free_and_reconciled` 2026-07-29) was referenced by no ticket in the matrix,
while five of its members were live in this capability's capture-and-compare
spine. Each was independently re-verified live in production code on this branch
before being written into the story, at the file:line the assessor cited:

| Behaviour | Verified at |
|---|---|
| BUG-22 surface-bearing box | `capture/types.ts:282` (`SurfaceShape {self,box,borderRadiusPx,boxShadow,border}`, doc comment 270–281), `capture/extract.ts:11,24,29`, `capture/values-diff.ts:38,146,712,752` |
| BUG-15 all-collapse band fallback | `capture/extract.ts:1391-1403` (`bandRoots.length === 0` → body-spanning band) |
| BUG-25 per-text-node run geometry | `capture/extract.ts:666-684` (`textNodeBox` via per-node `Range`), `:1097-1116` (two-pass `runsUnder` with per-element `runCounts`) |
| BUG-16 capture-time font settling | `capture/playwright-driver.ts:21-68` (`FONT_BARRIER`), `:155-160` (re-run after `settlePage`), `capture/reextract.ts:50,100` (`rewriteMirroredRefs`), `capture/extract.ts:389,1152` (`fontLoadedOf`) |
| BUG-24 modern-syntax scrim capture | `capture/extract.ts:1047-1071` (`overlayOf` resolving through `rgbaOf`), `:294-318` (`rgbaOf` canvas probe preferring the lossless serialization) |

Intent wording was taken from BUNDLE-10's own body (BUG-15 §"Fix (as
implemented)", BUG-16 §"Fix (as implemented)", BUG-22 §"What changed", BUG-24
§"Root cause"/"Fix", BUG-25 §"Problem"/"Acceptance"), not paraphrased from the
finding table.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-75 (`story-d5de22a5`) | Added four Description items and two clauses; renumbered 11 items → 14; extended the Story sentence, **In scope**, **Out of scope** and Technical Context. Detail below. |
| 2 | story-body-edit (metadata) | STORY-75 (`story-d5de22a5`) | `updated_by` → `[bundle-31e474b9, bundle-cceaba25, bundle-4ff83a8b, bundle-ee56a66e]` — adds BUNDLE-7 (finding 7: §7 is REQ-79's, named in the production comment at `values-diff.ts:2477`) and BUNDLE-10 (findings 1–5 root cause). Chronological. |
| 3 | story-body-edit (metadata) | STORY-79 (`story-e15a19ef`) | `updated_by` → `[bundle-31e474b9, bundle-cceaba25, bundle-15c1f647]` (finding 6) — the body already reconciles guarantee 3 from BUNDLE-7 (commit 09fa7cf5) and guarantee 2's bootstrap clause + guarantee 4 from BUNDLE-8 (commit 5dc46d0f / REQ-89); the attribution now matches. |
| 4 | story-body-edit | CAP-63 (`capability-aa030c83`) | Added a **History** entry recording the BUNDLE-10 attribution repair and the deliberate scope split, so the omission is not re-litigated and the CAP-70/CAP-71 follow-up is on the record. |

### STORY-75 body edit, per finding

| Finding | Where it landed |
|---|---|
| 1 (violation, BUG-22) | New Description item **5, "Surface-bearing box"** — placed after the box-border axis and before duplicate-text pairing, since it is the identity question those two stand on. Carries the `self` discriminator, tightest-first resolution over the same chain `surfaceFill` walks, the diff resolving `shape`/`border`/surface-geometry against the bearing box on identity disagreement, the phantom `radius 8px → 0px` leading the Type-A repair order while the real defect went unreported, and all four inertness cases (self-on-both-sides, ordinary run on its band, genuinely-lost rounding, pre-`surface` bundle). |
| 2 (violation, BUG-15) | Second paragraph of item **11, "Painted band extent"** — explicitly framed as the *all*-collapse case distinct from BUG-27's per-band extent rule (the partial-collapse case, "where the fallback never fires"), with the L1-flat-DOM motivation, the byte-identical frozen-scoreboard signature, generality to any absolutely-positioned layout, and dormancy on semantic multi-band pages. A Technical Context bullet states the two rules are distinct and neither subsumes the other. |
| 3 (violation, BUG-25) | New Description item **2, "Per-text-node run geometry"** — placed immediately after rendered-text extent, the axis it corrects. Per-node `Range` measurement when the element holds >1 run, unchanged per-element reading at exactly 1, the overprint failure, and `nowrapFromPx` measuring the pair and misclassifying both one-line runs as two-line. |
| 4 (violation, BUG-16) | New Description item **9, "Capture-time font settling"** — placed immediately before item 10 (the fontLoad diff-direction correction), the other half of the same problem. All three live mechanisms as sub-bullets: the post-`settlePage` bounded barrier force-loading each visible run's exact face+text, the offline re-extraction rewrite of mirrored absolute URLs to loopback-relative (with the `text/css` clause for extensionless CSS mirrors), and `fontLoaded` probing the real painted weight/style. States that asset-mirror *naming* is not owned here — only the capture-side use of the mirror — mirrored in **Out of scope**. A Technical Context bullet records that the two fontLoad halves are complements, not alternatives. |
| 5 (warning, BUG-24) | Third paragraph of item **12, "Document-wide backdrops"** — attached directly to the exclusion clause that had been presupposing it. States the band overlay is captured through the browser-accepted-colour probe with alpha preserved for any engine-computed syntax (`color-mix`/`oklab`/`oklch`/`color()`), the silent-skip of every modern-syntax scrim, `overlay: null` on the hero, and the lossless-serialization preference over a premultiplied pixel read-back. |

Cross-cutting edits so the story does not document behaviour in one place only:
the Story sentence now names the all-collapse band, per-run measurement against
the real face, and the surface-bearing box; **In scope** adds run geometry, the
surface-bearing box, and font settling; **Out of scope** adds asset-mirror naming
and extends the fold carve-out to a captured scrim; three Technical Context
bullets were added (resolve-don't-read node identity, run-vs-band geometry as one
lesson at two scales, and the colour-probe-accepts-what-the-engine-computes rule).

Renumbering 11 → 14 items was checked safe first: a scan of all 30 story bodies
found no `STORY-75 §N` cross-references (the only inbound reference is STORY-94's
prose mention of STORY-79, unnumbered).

## Code Edits (if any)

None this call. No production code was touched; every behaviour written into the
story was verified as already live at the cited file:line, which is what makes
these coverage findings rather than code issues.

## Tests

None run — no code or test mutation was made this call, so there is nothing
affected to exercise. All four resolution categories applied were
`story-body-edit`.

## needs_review Items Forwarded

None. Two items are deferred rather than ambiguous:

| Element | Status | Note |
|---|---|---|
| STORY-79 (finding 8) | Deferred by assessor instruction | BUNDLE-19 (`bundle-77b28def`) is still `reconciling`; neither `cli/shared-store.ts` nor a `preflight` verb exists on this branch, so enforcing it now would make the story describe absent code. Extend guarantee 5 with the verb surface during BUNDLE-19's reconciliation, and settle the CAP-63/CAP-82 line for the shared-store component inventory it reports. |
| CAP-70 / CAP-71 | Out of this scope path | BUNDLE-10's other members (BUG-12/13/14/17/18/19/20/23, REQ-88, REQ-93 — fold/L1-pipeline; BUG-21 — framework control surface) are not CAP-63's and were deliberately not swept into STORY-75. The same skipped intent probably left gaps there; recorded in CAP-63's History so the follow-up is not lost. |
