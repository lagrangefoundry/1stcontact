---
uid: report-2b93d999
id: REPORT-2353
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=story)'
created_by: xgd
created_at: '2026-08-20T03:34:39.505395+00:00'
updated_at: '2026-08-20T03:34:39.505395+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: story
  violations: 4
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: story

**Result**: FAIL
**Violations**: 4
**Warnings**: 3
**Needs review**: 0

Attempt 8. The attempt-7 repair (BUNDLE-10) was verified complete and correct —
all four of its violations and three actionable warnings are genuinely resolved
(see the Verified-Resolved section). The failure at this attempt is a **new and
previously unexamined class of drift**: every ledger built in attempts 1–7
enumerated *bundles* only, and this capability's intent also arrives as
individually free-coded, unbundled `request` tickets. Four of those are
`free_and_reconciled`, live in production code, inside this capability's declared
scope, and expressed by no story anywhere in the matrix.

## Cumulative Intent Considered

Chronological ledger of intents that touched (or should have touched) this
capability's tree. **Bundled** intents first, then the unbundled ones that prior
ledgers never enumerated.

### Bundled intents

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUNDLE-6 (REQ-58 + REQ-59 + REQ-62 + REQ-61) | bundle-ab9e0cb6 | free_and_reconciled | 2026-07-17 | Multi-viewport capture ladder; boolean-flag parse; `--json` stdout hygiene; gradient stop positions; panel surface gradients; `--size` diffing; `responsive-diff` | YES — origin intent of all 5 stories |
| BUNDLE-7 (REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + REQ-85 + REQ-86) | bundle-31e474b9 | free_and_reconciled | 2026-07-22 | **REQ-63 coverage audit — capture + diff every render-affecting CSS axis** (STORY-75 §4/§7/§8: box-border + line style, typography treatments, element effects, object-position); REQ-79 fontLoad reverse direction (§10); `aligned-crops --sandbox` store propagation (STORY-79 §3) | YES |
| BUNDLE-8 (BUG-7 + REQ-89 + REQ-90 + REQ-91 + REQ-92 + 5 more) | bundle-cceaba25 | free_and_reconciled | 2026-07-29 | REQ-89 pages-directory warning suppressed at source + Astro-free render path (STORY-79 §2/§4); BUG-10 list-marker painted precondition (STORY-75 §7) | YES |
| BUNDLE-10 (BUG-12…BUG-25, REQ-88, REQ-93) | bundle-4ff83a8b | free_and_reconciled | 2026-07-29 | BUG-15 all-collapse band fallback; BUG-16 capture-time font settling; BUG-22 surface-bearing box; BUG-24 modern-syntax scrim capture; BUG-25 per-text-node run geometry | YES — **repaired in attempt 7, verified this attempt** |
| BUNDLE-11 (BUG-27 + REQ-94 + REQ-96 + 12 more) | bundle-ee56a66e | free_and_reconciled | 2026-08-05 | BUG-27 painted band extent, document-wide backdrops, background-image axis (STORY-75 §11–§13); REQ-96 module-invariant exclusion (§14) | YES |
| BUNDLE-16 (REQ-117 + REQ-115 + REQ-44) | bundle-15c1f647 | free_and_reconciled | 2026-08-07 | REQ-44 install preflight at dispatch (STORY-79 §5) | YES |
| BUNDLE-18 (BUG-34 + REQ-137) | bundle-d9226698 | free_and_reconciled | 2026-08-13 | Builder copy-modal glyph fill + palette `shade`. No capture/diff axis asked | YES (no CAP-63 ask) |
| BUNDLE-17 (REQ-119…REQ-130) | bundle-e59210c5 | free_and_reconciled | 2026-08-10 | Control-app / builder / control-surface API. No capture/diff or CLI-mechanism ask | YES (no CAP-63 ask) |
| BUNDLE-19 (REQ-133 + BUG-35 + REQ-131 + REQ-139 + REQ-140 + REQ-123 + REQ-141 + REQ-142 + REQ-144) | bundle-77b28def | **reconciling** | 2026-08-18 | REQ-144 adds a standalone `1c preflight` verb + `cli/shared-store.ts` | imminent — warning 1 |
| BUNDLE-12, BUNDLE-15 | bundle-0e41ff44, bundle-7985e0d1 | abandoned | 2026-08-06 | superseded duplicates | NO |
| BUNDLE-1…5 | — | free_and_reconciled | 2026-06-30…07-13 | pre-matrix-genesis | pre-history — not expected to be storied |

### Unbundled intents — enumerated here for the first time

A store-wide sweep (all 141 `request` + all `bug` tickets, minus every ID
appearing as a member of any bundle) found **38 reconciled intents that belong to
no bundle and are referenced by no story's `intent_uid`/`updated_by` anywhere in
the matrix**. Most belong to other capabilities. These are the ones inside CAP-63's
declared scope:

| Intent ID | UID | Status | When | Asked | Live at | Storied? |
|---|---|---|---|---|---|---|
| REQ-64 | request-07d0e3e1 | free_and_reconciled | 2026-07-17 | **Noise audit** — every values-diff delta must be a real visible difference; per-axis noise layer over an exact raw capture, `--collapse` to one row per defect, Type-A/Type-B repair-order classification | `cli/fidelity.ts:272,284,309,379,567,629`, `cli/index.ts:272,790`, `capture/values-diff.ts:71` | **NO** — violation 1 |
| REQ-72 | request-0698bbdf | free_and_reconciled | 2026-07-18 | **Capture gradient colour stops** — resolve each gradient colour token to `#rrggbb` in-browser so `normalizeGradient` can parse stops computed in oklch/oklab/`color()` | `capture/extract.ts:329` | **NO** — violation 2 |
| REQ-73 | request-859652ae | free_and_reconciled | 2026-07-18 | **Adjacent-gap axis** — a `gap` comparison axis over y-overlap rows (tolerance 6px, `--tolerant` 16px); section band `paddingTop/Bottom` deltas dropped as a superseded component | `capture/values-diff.ts:363,364,406,1127,1341,1406,1530,1953,2276,2493,2533,2575` | **NO** — violation 3 |
| REQ-76 | request-3a11304d | free_and_reconciled | 2026-07-18 | **Cause clustering** — `--clusters` rolls counted defects into ranked CAUSES, each tagged fix/review/accept | `cli/fidelity.ts:430,451,474,507`, `cli/index.ts:274,792` | **NO** — violation 4 |
| REQ-74 | request-69ca5755 | free_and_reconciled | 2026-07-18 | Gap inversion — `adopt-gaps` sets `spacingTop` to close a REQ-73 gap delta | `cli/edit.ts:1552-1596`, `cli/index.ts:303,955` | NO — warning 2 (ownership likely NOT CAP-63) |
| REQ-78 | request-6ae3512a | free_and_reconciled | 2026-07-19 | `1c aligned-crops` — drift-aligned ref/ours crop pairs for the AI perceptual judge | `cli/aligned-crops.ts:2`, `cli/index.ts:293,923` | NO — warning 3 (verb *meaning*, owned elsewhere) |
| REQ-66 | request-b94426f4 | free_and_reconciled | 2026-07-18 | `adopt-values` — copy reference Type-A flat values | **retired** — no `REQ-66` reference remains in `cli/` | Correctly absent — STORY-84 records the supersession |

**Why the genesis exemption does not cover these.** Prior ledgers exempted
BUNDLE-1…5 as pre-matrix pre-history. That boundary does not reach REQ-64/72/73/76:

- **REQ-64 is the explicitly-named sibling of REQ-63, which IS storied.** REQ-64's own
  body: *"Sibling to the coverage audit (REQ-63, false negatives). Coverage + noise
  together make '0 value-diffs ⟺ pixel-faithful' hold."* STORY-75's Technical Context
  asserts exactly that pair — *"Coverage closes false negatives; noise closes false
  positives — only with both does the invariant hold"* — while expressing only the
  coverage half. The matrix states the pair and carries one side of it; that is
  internal inconsistency, independent of any genesis date.
- REQ-72/73/76 postdate BUNDLE-6 (the storied origin intent) and are live, in-scope,
  and unretired. Nothing in a later reconciled intent retires any of them.

The real boundary is mechanical, not chronological: **matrix genesis consumed bundle
reconciliations, and these intents were never bundled** — see Notes for the Editor.

## Alignment Ledger

| Element | Kind | Intents aligned to | Outcome |
|---|---|---|---|
| STORY-75 (Values-diff closes capture blind spots) | upgrade | bundle-ab9e0cb6; updated_by bundle-31e474b9, bundle-cceaba25, bundle-4ff83a8b, bundle-ee56a66e | **gap** — BUNDLE-10 now fully carried and attributed (verified live in code, §2/§5/§9/§11/§12); REQ-63 correctly expressed via §4/§7/§8. But REQ-64 (noise layer, `--collapse`, repair order) and REQ-73 (`gap` axis) are absent (violations 1, 3) |
| STORY-76 (Gradients as a first-class value) | feature | bundle-ab9e0cb6 (REQ-59 + REQ-62) | **gap** — the legacy authoring half is still correctly scoped and live (`resolveSurfaceGradient` at `packages/framework/src/modules/text-style.ts:223`, `gradient` content-field at `packages/site-schema/src/schema.ts:194`), so overlap-cluster-4's ownership rule holds; but REQ-72's in-browser stop hexification — without which the captured stops this story rests on are empty — is unexpressed (violation 2) |
| STORY-77 (Size-aware diffing) | feature | bundle-ab9e0cb6 (REQ-61) | aligned |
| STORY-78 (Responsive-diff N-way) | feature | bundle-ab9e0cb6 (REQ-61) | aligned |
| STORY-79 (1c CLI correctness) | upgrade | bundle-ab9e0cb6; updated_by bundle-31e474b9, bundle-cceaba25, bundle-15c1f647 | aligned — attribution repaired in attempt 7; gated set re-verified verbatim against `cli/preflight.ts:64-73` (`capture`/`shot`/`values-diff`/`adopt-gaps` → playwright; `crop` → sharp; `diff`/`gate`/`aligned-crops` → both) and the ungated list against `preflight.ts:60-62`. REQ-76's `--clusters` and REQ-64's `--collapse` are values-diff *meaning*, so they land on STORY-75, not here |
| capability-aa030c83 | — | — | no `intent_uid`/`updated_by` (info 3) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-75 (or a new story) | story-body-edit | REQ-64 (`request-07d0e3e1`, free_and_reconciled 2026-07-17) — the **noise audit**, the false-positive half of this capability's animating invariant. Asks: a per-axis noise layer applied *over* an exact raw capture (never baked into capture) with an operator dial to turn it off; `--collapse` deduping per-cell multi-viewport deltas to one row per DEFECT; the Type-A (author-set) / Type-B (emergent) repair-order classification; derived axes (absolute `position`) recognised as the cumulative shadow of real deltas. Live at `cli/fidelity.ts:272,284,309,379,567,629`, `cli/index.ts:272,790`, `capture/values-diff.ts:71`. No story expresses any of it — the only matrix occurrence of "repair order" is an incidental aside inside STORY-75 §5, which *depends* on a classification the matrix never defines | Express the noise/report half. Cleanest shape is a **sibling story** ("values-diff report: noise layer, per-defect collapse, repair order") since STORY-75 is scoped to capture axes; alternatively extend STORY-75 with a report-surface section. Must state: noise is a layer over an exact raw axis, never a dropped axis; `--collapse` counts defects not cells; Type-A/B and what each implies for repair |
| 2 | violation | coverage | STORY-76 | story-body-edit | REQ-72 (`request-0698bbdf`, free_and_reconciled 2026-07-18) — gradient colour tokens are resolved to `#rrggbb` **in the browser** during capture, because a Tailwind-authored gradient computes to oklch/oklab/`color()` which the TS-side `normalizeGradient` stop regex cannot parse. Without it the gigabytealchemy card gradient captured as `135° []` — angle only, empty stops — leaving STORY-76's whole surface-gradient axis unreproducible. Live at `capture/extract.ts:329`. STORY-76 asserts "a captured text-fill gradient records each stop's position offset alongside its colour" while never expressing the mechanism that makes any stop capturable at all | Add to STORY-76's Description/Technical Context: gradient stop colours are resolved in-browser to hex before `normalizeGradient` parses them, for both `gradientCss` (text-fill) and `surfaceGradientCss` (panel). Exact parallel to the clause STORY-75 §12 already carries for the scrim probe (BUG-24) |
| 3 | violation | coverage | STORY-75 | story-body-edit | REQ-73 (`request-859652ae`, free_and_reconciled 2026-07-18) — the **adjacent-gap axis**. Paired elements are grouped into visual rows by y-overlap; the gap between consecutive rows is compared per side and emitted as one `gap` delta (tolerance 6px default, 16px under `--tolerant`), drift-free so one wrong gap is one delta rather than a cascade of absolute-position deltas. Its converse is a deliberate **retirement**: section band `paddingTopPx`/`paddingBottomPx` deltas are no longer compared, being one component of a sum the two sides distribute differently (padding-vs-margin noise). Live at `capture/values-diff.ts:363-364,406,1341,1406,1530,2276,2493,2533,2575`. Neither the added axis nor the retired one appears in any of the 30 story bodies (scanned for `REQ-73`, `adjacent[- ]gap`, `inter-row`, `vertical spacing`, `\bgap\b` — every `gap` hit is the unrelated "capability gap" sense) | Add a STORY-75 Description item for the `gap` axis: row grouping by y-overlap, gap-between-consecutive-rows as the compared coordinate, its tolerance, and the linear-inversion rationale (`Δ = ref_gap − our_gap` is the correction). State the paired retirement explicitly — section band vertical padding is deliberately NOT compared |
| 4 | violation | coverage | STORY-75 (or the same new story as finding 1) | story-body-edit | REQ-76 (`request-3a11304d`, free_and_reconciled 2026-07-18) — **cause clustering**: `--clusters` rolls the counted (non-derived) defects up into ranked CAUSES, each mapped from its fine-grained delta property and tagged with a disposition (fix / review / accept). Live at `cli/fidelity.ts:430,451,474,507`, `cli/index.ts:274,792`. Unexpressed anywhere. This is values-diff's own output *meaning*, which the capability's CLI ownership rule keeps with the verb — and values-diff is this capability's verb, so it belongs here, not on STORY-79 | Express the ranked-cause view alongside finding 1's report surface: delta-property → cause mapping, ranking, and the fix/review/accept disposition |
| 5 | warning | coverage | STORY-79 | story-body-edit | BUNDLE-19 (`bundle-77b28def`, **reconciling** — imminent) adds a standalone `1c preflight` verb plus `cli/shared-store.ts` (REQ-144). Carried forward from attempt 7's finding 8. Re-verified absent on this branch: no `cli/shared-store.ts`, and no `preflight` verb in the `cli/index.ts` command switch — correctly not yet enforced | No edit yet. Carry into BUNDLE-19's reconciliation and extend STORY-79 guarantee 5 with the verb surface; settle the CAP-63/CAP-82 line for the shared-store component inventory it reports |
| 6 | warning | coverage | REQ-74 / cross-capability | — | REQ-74 (`request-69ca5755`, free_and_reconciled 2026-07-18) — `adopt-gaps` gap inversion, writing `spacingTop` to close a REQ-73 `gap` delta. Live at `cli/edit.ts:1552-1596`, `cli/index.ts:303,955`. Expressed by no story: STORY-84 names it only to say it is "left untouched" by the `adopt-values` supersession, and STORY-79 names the verb only in its gated-command list. **Ownership is probably not CAP-63** — this capability is capture-and-compare, and REQ-74 *writes a repair into a site* — so it should not be swept into STORY-75 by reflex | Do NOT add here without deciding ownership. Check against the reproduction/adopt capability (CAP-71); if no capability claims it, that is a matrix-wide gap to file, not a CAP-63 story edit |
| 7 | warning | coverage | REQ-78 / cross-capability | — | REQ-78 (`request-6ae3512a`, free_and_reconciled 2026-07-19) — the `1c aligned-crops` verb itself (drift-aligned ref/ours crop pairs per section anchor + `index.md`, the AI perceptual judge's eyes). Live at `cli/aligned-crops.ts`, `cli/index.ts:293,923`. STORY-79's out-of-scope defers its content to "the aligned-crops capabilities" and its store-routing *mechanism* is correctly STORY-79 §3 — but no story anywhere expresses the verb's own meaning | Not a CAP-63 story edit under the ownership rule (mechanism here, meaning with the verb). File against whichever capability owns the perceptual pipeline |
| 8 | info | — | STORY-75, STORY-79, capability | — | **Attempt-7 repair verified complete.** All five BUNDLE-10 behaviours are now expressed AND independently re-verified live on this branch: BUG-22 surface-bearing box (§5) at `capture/types.ts:282`, `values-diff.ts:146,712`; BUG-15 all-collapse fallback (§11 ¶2) at `extract.ts:1391-1403`; BUG-25 per-text-node run geometry (§2) at `extract.ts:676,1106-1124`; BUG-16 font settling (§9) at `playwright-driver.ts:34,160`, `reextract.ts:50,100`; BUG-24 scrim probe (§12 ¶3) at `extract.ts:294,1047,1425`. Each was also checked against BUNDLE-10's own body text and reflects it faithfully — including BUG-24's split, where only the capture half is claimed and the fold half is left to CAP-71. `updated_by` chains on both STORY-75 and STORY-79 are now correct | none |
| 9 | info | — | capability-aa030c83 | — | The capability ticket still carries no `intent_uid` and no `updated_by` (`fields` is `{name, uat_coverage}`), so the ledger must be rebuilt from the story tree every cycle. Structural; applies to every capability in this store | none |
| 10 | info | — | CAP-64 / CAP-65 / CAP-66 | — | The capabilities consolidated into CAP-63 on 2026-08-05 still exist as active shells with no stories pointing at them; STORY-77/79 cite CAP-63/65/66 by pre-merge names | none at story level |

## Notes for the Editor

**The root cause is a hole in how the ledger has been built, not a new omission in
the code.** Attempts 1–7 each enumerated intent by walking *bundles*. This store
also carries intent as individually free-coded `request` tickets that are
reconciled (`free_and_reconciled`) without ever being bundled — REQ-64/66/72/73/74/76/78
are a dense cluster of exactly that shape, all filed 2026-07-17…19, all touching the
`1c` diff toolchain. Because no bundle contains them, seven consecutive ledgers
looked straight past them, and the four in-scope ones have been drifting since matrix
genesis.

**This is not confined to CAP-63.** The same sweep found **38** reconciled,
unbundled intents unreferenced by any story matrix-wide — including REQ-67/68/70/71/75/77
(framework module dials, plausibly retired by the REQ-84/REQ-96 pivot — worth
confirming rather than assuming), REQ-132/135/136/138 (page-editor), REQ-143/145/146/147/148
(`ready_to_reconcile`, the Cloudflare/workerd move) and REQ-118/125. **Every
capability's story-level check should re-run with unbundled intents included**; the
CAP-70/CAP-71 follow-up that attempt 7 recommended for BUNDLE-10 should be widened
the same way. The reusable sweep is at `.xgd/tmp/sweep.py` (it diffs bundle
membership against all `request`/`bug` tickets, then against every story's
`intent_uid`/`updated_by`).

**Scope discipline for whoever repairs this.** Only findings 1–4 are CAP-63's.
Findings 6 and 7 name live, unstoried intents whose ownership sits elsewhere — do
not resolve them by appending to a CAP-63 story. REQ-66 needs no action: it is
genuinely retired and STORY-84 records the supersession, which is what a correctly
handled retirement looks like.

**Shape advice for findings 1 and 4.** REQ-64 and REQ-76 are both about the
values-diff *report* — the noise layer, per-defect collapse, repair order, ranked
causes — whereas STORY-75 is scoped to capture axes and pairing. Bolting a report
surface onto STORY-75 would strain a story that is already 14 items and would blur
the capture/report line the capability body draws. A sibling story under this
capability is the better shape. Whichever is chosen, the repair-order
classification must be defined *somewhere*, because STORY-75 §5 already leans on it.

**What is genuinely healthy.** Every axis STORY-75 through STORY-79 describes was
verified live in code this attempt, including all five of attempt 7's additions and
STORY-79's gated command set verbatim against `cli/preflight.ts`. STORY-76's legacy
authoring half is still present and correctly scoped, so overlap-cluster-4's
value-axis ownership rule continues to hold. No story describes behaviour intent
never asked for, no two stories overlap, and no reconciled intent has been retired
without the matrix following. The failure is purely missing coverage.
