---
uid: report-f924eef4
id: REPORT-2341
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=story)'
created_by: xgd
created_at: '2026-08-20T03:12:18.630206+00:00'
updated_at: '2026-08-20T03:12:18.630206+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: story
  violations: 4
  warnings: 4
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: story

**Result**: FAIL
**Violations**: 4
**Warnings**: 4
**Needs review**: 0

## Cumulative Intent Considered

Chronological ledger of intents that touched (or should have touched) this capability's tree:

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUNDLE-6 (REQ-58 + REQ-59 + REQ-62 + REQ-61) | bundle-ab9e0cb6 | free_and_reconciled | 2026-07-17 | Multi-viewport capture ladder + `--multi-viewport` diff; boolean-flag parse; `--json` stdout hygiene; gradient stop positions; panel surface gradients; `--size` diffing; `responsive-diff` | YES — origin intent of all 5 stories |
| BUNDLE-7 (REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more) | bundle-31e474b9 | free_and_reconciled | 2026-07-22 | REQ-79 fontLoad reverse-direction correction (carried by STORY-75 §7); `aligned-crops --sandbox` store propagation (carried by STORY-79 §3) | YES |
| BUNDLE-8 (BUG-7 + REQ-91 + REQ-89 + REQ-90 + REQ-92 + 5 more) | bundle-cceaba25 | free_and_reconciled | 2026-07-29 | REQ-89 pages-directory warning suppressed at source + Astro-free render path (STORY-79 §2/§4); BUG-10 list-marker painted precondition (STORY-75 §5) | YES |
| **BUNDLE-10 (BUG-12 … BUG-25, REQ-88, REQ-93)** | **bundle-4ff83a8b** | **free_and_reconciled** | **2026-07-29** | **BUG-15 body-spanning band fallback; BUG-16 capture-side webfont barrier; BUG-22 split-control surface capture/diff; BUG-24 modern-syntax scrim capture; BUG-25 per-text-node run geometry** | **YES — and referenced by NO ticket in the matrix (see findings 1–5)** |
| BUNDLE-11 (BUG-27 + REQ-94 + REQ-96 + REQ-97 + REQ-98 + 10 more) | bundle-ee56a66e | free_and_reconciled | 2026-08-05 | BUG-27 painted band extent + document-wide backdrops + background-image axis (STORY-75 §8–§10); REQ-96 module-invariant exclusion (STORY-75 §11) | YES |
| BUNDLE-16 (REQ-117 + REQ-115 + REQ-44) | bundle-15c1f647 | free_and_reconciled | 2026-08-07 | REQ-44 install preflight at dispatch: resolution + lockfile drift, per-command gated set (STORY-79 §5) | YES |
| BUNDLE-18 (BUG-34 + REQ-137) | bundle-d9226698 | free_and_reconciled | 2026-08-13 | Palette `shade`; uses `values-diff` only as a *reporting instrument* for the retrofit — no capture/diff axis asked | YES (no CAP-63 ask) |
| BUNDLE-19 (REQ-133 + BUG-35 + REQ-131 + REQ-140 + REQ-139 + 4 more, incl. REQ-144) | bundle-77b28def | reconciling | 2026-08-18 | REQ-144 adds a **new `1c preflight` verb** (`cli/shared-store.ts` + verb; reports shared-store components and declared packages, exits 6) and `bin/build --skip-preflight` | imminent — see finding 8 |
| BUNDLE-15, BUNDLE-12 | bundle-7985e0d1, bundle-0e41ff44 | abandoned | 2026-08-06 | superseded duplicates of BUNDLE-14/13 | NO |

Matrix genesis note: the oldest stories in the whole matrix are STORY-75…79 (2026-07-19), all from BUNDLE-6. BUNDLE-1…5 predate the matrix and are not expected to be storied. **BUNDLE-10 is post-genesis**, which is what makes its absence drift rather than pre-history.

## Alignment Ledger

| Element | Kind | Intents aligned to | Outcome |
|---|---|---|---|
| STORY-75 (Values-diff closes capture blind spots) | upgrade | bundle-ab9e0cb6; updated_by bundle-cceaba25, bundle-ee56a66e; (body also carries REQ-79 from bundle-31e474b9) | **gap** — every axis it does describe is live in code, but four BUNDLE-10 capture/diff behaviours in its own declared scope are absent (findings 1–3, 5); REQ-79 attribution missing (finding 7) |
| STORY-76 (Gradients as a first-class value) | feature | bundle-ab9e0cb6 (REQ-59 + REQ-62) | aligned — the legacy authoring half is still live and correctly scoped: `resolveSurfaceGradient` at `packages/framework/src/modules/text-style.ts:223`, `gradient` content-field at `packages/site-schema/src/schema.ts:194`; capability body's value-axis ownership rule (overlap cluster 4) holds |
| STORY-77 (Size-aware diffing) | feature | bundle-ab9e0cb6 (REQ-61) | aligned — `--size` live on both diff paths (`cli/index.ts:697, 870, 972`) |
| STORY-78 (Responsive-diff N-way) | feature | bundle-ab9e0cb6 (REQ-61) | aligned — verb live (`cli/responsive-diff.ts`, help at `cli/index.ts:298`), `--ref` divergence already recorded in the body |
| STORY-79 (1c CLI correctness) | upgrade | bundle-ab9e0cb6; updated_by bundle-15c1f647; (body also carries bundle-31e474b9 §3 and bundle-cceaba25 §2/§4) | aligned on substance — gated map at `cli/preflight.ts:65-72` matches the body's enumerated set exactly, ungated set matches `preflight.ts:60-61`; `aligned-crops` sub-command options live (`cli/aligned-crops.ts:176`); conditional Astro container live (`render/render.ts:267`). Attribution incomplete (finding 6); imminent BUNDLE-19 verb pending (finding 8) |
| capability-aa030c83 | — | — | **no `intent_uid` / `updated_by` fields at all** (finding 9) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-75 | story-body-edit | BUG-22 (bundle-4ff83a8b, free_and_reconciled 2026-07-29) made capture record **which box paints the surface** (`SurfaceShape {self, box, borderRadiusPx, boxShadow, border}`) and made values-diff resolve a split text+box control against that backing box, killing the phantom `radius 8px → 0px` Type-A delta and surfacing the real surface-geometry defect. Live at `tools/generate/src/cli/capture/types.ts:282`, `capture/extract.ts:29`, `capture/values-diff.ts:146,712`. No story in the matrix describes it (grep of all 30 story bodies for `SurfaceShape` / "surface-bearing" / "split control" returns nothing). This sits inside STORY-75's own declared scope ("comparison tolerances/severities … the element-pairing rules") | Add an item to STORY-75's Description: capture records the surface-bearing box (`self` discriminator, resolved tightest-first over the same chain `surfaceFill` uses); the diff resolves `shape`/`border`/surface-geometry against it when the two sides disagree about node identity; inert on pre-BUG-22 bundles |
| 2 | violation | coverage | STORY-75 | story-body-edit | BUG-15 (bundle-4ff83a8b) added the **zero-band fallback**: when the top-level `>=8px` band scan finds no bands yet the body still paints, capture falls back to one body-spanning band, so `values-diff` can read an L1-rendered flat absolutely-positioned tree at all. Without it the actual manifest is empty and every reference element reads `missing`, freezing the scoreboard byte-identically. Live at `capture/extract.ts:1397-1403` (and cross-referenced at `:469`). STORY-75 §8 describes only BUG-27's *per-band painted extent* rule — BUNDLE-11's own body states this is "BUG-15's failure mode when only SOME children collapse, where that fallback never fires", i.e. two distinct rules, one storied and one not | Add to STORY-75 §8 (or a sibling item): the all-collapse fallback to a single body-spanning band, its L1-flat-DOM motivation, and its dormancy on semantic multi-band pages |
| 3 | violation | coverage | STORY-75 | story-body-edit | BUG-25 (bundle-4ff83a8b) changed **what geometry a run reports**: a text node in an element holding more than one run now takes its own `Range`-measured box and glyph box instead of inheriting the element's, so two runs of a wrapped `<h1>` no longer share one box (which overprinted them and made `nowrapFromPx` measure the pair). Live at `capture/extract.ts:666-680` (`textNodeBox`) and `:1097-1116` (two-pass `runsUnder` with per-element run counts). Unexpressed anywhere in the matrix | Add a STORY-75 item: run geometry is per-text-node when its element holds multiple runs, per-element when it holds exactly one (unchanged) |
| 4 | violation | coverage | STORY-75 / capability | story-body-edit | BUG-16 (bundle-4ff83a8b) closed the **capture-side** half of the fontLoad problem — the reference value set was being measured against a fallback face, corrupting `font-family` and every derived metric. Three live mechanisms: the pre-extraction web-font barrier (`capture/playwright-driver.ts:22-66,156-159`), the offline re-extraction rewrite of mirrored absolute URLs to loopback-relative (`capture/reextract.ts:50` `rewriteMirroredRefs`), and `fontLoadedOf` probing the actual painted face (`capture/extract.ts:389`). STORY-75 §7 carries only the *diff-direction* correction (REQ-79). A capture measured against the wrong face defeats the capability's animating invariant at the source | Add a STORY-75 item (or a sibling story) for capture-time font settling: force-load each visible run's exact face before extraction, bounded; serve mirrored faces on the offline re-extraction path; probe the real weight/style. Note that asset-mirror *naming* stays CAP-88's — only the capture-side use of the mirror is owned here |
| 5 | warning | coverage | STORY-75 | story-body-edit | BUG-24 (bundle-4ff83a8b) fixed the **capture** of a band scrim: `overlayOf` resolved the computed background with a legacy `rgba(...)` regex, so every `color-mix` / `oklab` / `oklch` / `color()` scrim was silently skipped and the hero veil captured as `null`; it now resolves through `rgbaOf` (`capture/extract.ts:1047`, used at `:1425`), which also now prefers the lossless canvas `fillStyle` serialization. STORY-75 §9 *presupposes* this axis ("scrims already recorded as the band's overlay") without ever expressing it. Warning rather than violation because the fold/L1 half of BUG-24 is CAP-70/CAP-71's and only the parse/precision half is CAP-63's | Add a clause to STORY-75 §9 (or the band-capture item) stating that the band overlay is captured through the browser-accepted-colour probe, preserving alpha, for any modern colour syntax |
| 6 | warning | consistency | STORY-79 | story-body-edit (metadata) | `fields.updated_by` is `bundle-15c1f647` alone, but the story's own Technical Context reconciles guarantee 3 from bundle-31e474b9 (BUNDLE-7, commit 09fa7cf5) and guarantee 2's bootstrap clause + guarantee 4 from bundle-cceaba25 (BUNDLE-8, commit 5dc46d0f / REQ-89). The body is correct; the attribution chain under-reports it, so a future check cannot see which intents this story answers | Extend `updated_by` to `[bundle-31e474b9, bundle-cceaba25, bundle-15c1f647]` |
| 7 | warning | consistency | STORY-75 | story-body-edit (metadata) | STORY-75 §7 (fontLoad reverse-direction correction) is REQ-79's, which reconciled under bundle-31e474b9 (BUNDLE-7) — the production comment names it: `capture/values-diff.ts:2477` "REQ-79 — the reverse fontLoad direction". `updated_by` lists only bundle-cceaba25 and bundle-ee56a66e | Add `bundle-31e474b9` to `updated_by` |
| 8 | warning | coverage | STORY-79 | story-body-edit | BUNDLE-19 (bundle-77b28def, **reconciling** — imminent) adds a standalone `1c preflight` verb (`cli/shared-store.ts` + a CLI verb; reports every shared-store component and declared package, exits 6 naming what is absent) plus `bin/build --skip-preflight`. By this capability's own ownership rule the install-preflight *mechanism* is CAP-63's, so the verb belongs on STORY-79 beside guarantee 5. Correctly not yet enforced: neither `cli/shared-store.ts` nor a `preflight` verb exists on this branch | No edit yet — carry into BUNDLE-19's reconciliation and extend STORY-79 guarantee 5 with the verb surface (and settle the CAP-63/CAP-82 line for the shared-store component inventory it reports) |
| 9 | info | — | capability-aa030c83 | — | The capability ticket carries no `intent_uid` and no `updated_by` (`fields` is `{name, uat_coverage}` only), so Step 0a's "originating intent" cannot be read off the capability itself and the ledger has to be rebuilt from the story tree each time | none (structural; applies to every capability in this store) |
| 10 | info | — | CAP-64 / CAP-65 / CAP-66 | — | The capability tickets consolidated into CAP-63 on 2026-08-05 (capability-36dd68c5, capability-18a822ac, capability-ac7ca849) still exist as active shells with no stories pointing at them; STORY-77's and STORY-79's bodies still cite CAP-63/CAP-65/CAP-66 by their pre-merge names | none at story level; noted so a future reader does not read the citations as live siblings |

## Notes for the Editor

**One root cause behind findings 1–5: `bundle-4ff83a8b` (BUNDLE-10) is referenced by no ticket in the matrix.** It is not in `intent_uid` or `updated_by` for any of the 30 stories, and its flagship REQ-88 appears exactly once across all story bodies — an incidental aside in a CAP-70 story. It reconciled `free_and_reconciled` on 2026-07-29, the same day as BUNDLE-8, which *is* attributed; so this is a single skipped intent, not a matrix-genesis boundary.

The absence was checked as substance, not just attribution: all 30 story bodies were grepped for the distinguishing terms of each behaviour (`SurfaceShape`, "surface-bearing", "split control", "body-spanning", "collapsed flat", "per-line", `getClientRects`, "FOUT", "webfont") and each behaviour was confirmed live in production code at the file:line cited. Nothing in a later reconciled intent retires any of them.

**Scope split for whoever repairs this.** BUNDLE-10's other members are not CAP-63's and should not be swept into STORY-75: BUG-12/13/14/17/18/19/20/23 and REQ-88/REQ-93 are fold/L1-pipeline (CAP-71/CAP-70), BUG-21 is a framework control-surface defect. Only the five listed above are capture-or-diff. A parallel check on CAP-70/CAP-71 is worth running — the same skipped intent is very likely to have left gaps there too, though CAP-71's fold stories may already carry that behaviour under BUNDLE-7 attribution.

**What is genuinely healthy here.** Every axis STORY-75 through STORY-79 *does* describe was verified live in code, and STORY-79's gated/ungated command sets match `cli/preflight.ts:60-72` verb-for-verb — the "pinned as a whole" evidence the capability body asks for is real. STORY-76's legacy authoring half is still present and correctly scoped under the value-axis ownership rule, so the overlap-cluster-4 decision still holds. The failure at this level is purely one of missing coverage, not of stories describing things intent never asked for.
