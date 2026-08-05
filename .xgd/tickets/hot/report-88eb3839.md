---
uid: report-88eb3839
id: REPORT-1326
type: report
title: 'Capability-Intent Alignment: 1c_capture_diff_fidelity (level=story)'
created_by: xgd
created_at: '2026-08-05T22:49:05.135715+00:00'
updated_at: '2026-08-05T22:49:05.135715+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: story
  violations: 1
  warnings: 3
  needs_review_count: 2
---

# Capability-Intent Alignment: 1c_capture_diff_fidelity
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 3
**Needs review**: 2

`capability-aa030c83` (CAP-63) is the survivor of the 2026-08-05 structural
rebalance (`report-bdaf6840` / REPORT-1266), having absorbed CAP-64
(`capability-36dd68c5`), CAP-65 (`capability-18a822ac`) and CAP-66
(`capability-ac7ca849`). It now owns five stories: STORY-75, 76, 77, 78, 79.

The material finding is a **coverage hole created by the consolidation itself**:
`values-diff --multi-viewport` — the reproduction-vs-reference cell-for-cell
ladder diff that REQ-58 (T2/A) landed and that is live, documented and UAT-covered
in code — is expressed by no story in this capability, and by no story anywhere in
the matrix. Each predecessor capability disclaimed it toward the other; the merge
folded both disclaimers into one body.

## Cumulative Intent Considered

Chronological ledger. Rows 1–3 are the linked ledger (reachable from the tree via
`fields.intent_uid` / `fields.updated_by` or cited in a story body). Rows 4–5 are
reconciled intent inside this capability's *declared scope* that never entered the
tree — see findings 5 and 6.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 `bundle-ab9e0cb6` = REQ-58 (`request-c2d25c7b`) + REQ-59 (`request-bc936f38`) + REQ-62 (`request-90edd177`) + REQ-61 (`request-d6bc0d26`) | free_and_reconciled | created 2026-07-17, main `7a42e182` | `intent_uid` of all five stories. REQ-58: T1 rendered-text extent, T5 alpha-composited surface fill, T7 box-border axis, T14 duplicate-text pairing, **T2/A multi-viewport capture (`multistate.json`) + `values-diff --multi-viewport` cell-for-cell ladder diff + worst-cell-first formatter + STALE REFERENCE guard**, T2/A follow-ups (boolean flag `4f681c73`, `--json` stdout hygiene `a4323720`). REQ-59 gradient stop positions. REQ-62 panel/surface gradient capture+render+diff. REQ-61 `--size` on both diff commands + `responsive-diff` N-way table + classifier | YES |
| BUNDLE-7 `bundle-31e474b9` = REQ-63 (`request-8d885016`) + REQ-79 (`request-87b26bca`) + REQ-82/83/84 + 2 more | free_and_reconciled | 2026-07-22, main `edeb1c2c` | REQ-63 coverage audit: typography treatment axes, element effect axes, border style + box-border on text runs, `objectPosition`; deferred residuals (glyph-shape hashing, per-side border colours, inline-SVG fill). REQ-79 reconcile note explicitly KEEPS two measurement-spine commits: `09fa7cf5` aligned-crops `--sandbox` forwarding and `9ca73953` (part) the values-diff fontLoad false-positive fix | YES |
| BUNDLE-8 `bundle-cceaba25` = BUG-7 + REQ-91 + REQ-89 (`request-bde8d037`) + REQ-90 + REQ-92 + 5 more (incl. BUG-10 `bug-e4af6a67`) | free_and_reconciled | 2026-07-29, main `b1bd5b6b` | REQ-89: "Missing pages directory" suppressed at source on every command; Astro container only for behavior-module pages (`5dc46d0f`); the proposed lazy-registry fix deliberately NOT implemented. BUG-10: list-marker capture gated on a painted marker box | YES |
| BUNDLE-10 `bundle-4ff83a8b` = BUG-12…BUG-25 + REQ-88 + REQ-93 | free_and_reconciled | 2026-07-29, main_sha `2d59a3b6` | Capture/diff-fidelity asks in this capability's scope: BUG-15 `bug-9dafeb0b` (extractor band fallback so values-diff can read a flat absolutely-positioned render), BUG-16 `bug-7e28b435` (webfont/FOUT barrier + full font-shorthand `fonts.check`), BUG-22 `bug-3e3fabdb` (capture the surface-BEARING box; stop mis-attributing split text+box controls), BUG-24 `bug-c50fdfcc` (colour alpha / modern-syntax scrim representable in the captured value set), BUG-25 `bug-fe8af80a` (per-line run geometry). **Reaches no story in the matrix** | YES — see finding 5 |
| Pre-matrix values-diff cohort: REQ-35 `request-b68d501b`, REQ-47 `request-65fa5199`, REQ-48 `request-bb28220d`, REQ-53 `request-52fc5c06`, REQ-64 `request-07d0e3e1`, REQ-72 `request-0698bbdf`, REQ-73 `request-859652ae`, REQ-74 `request-69ca5755`, REQ-76 `request-3a11304d` | free_and_reconciled | 2026-07-03 … 2026-07-18 | Per-metric tolerances + bad-capture handling; severity-ranked structural diff; multi-state fidelity axes (the machinery REQ-58 T2 wired); exact-match-by-default; noise audit + `--collapse` repair order; in-browser gradient-stop hexify; adjacent-gap axis; `--fix-gaps` inversion; cause clustering with dispositions. **Reaches no story in the matrix** | YES — see finding 6 |
| REQ-80 `request-7756b2e8` (per-element Elementor band backgrounds) | abandoned | 2026-07-19 | Proposed a per-band capture axis | NO — retired; correctly absent |
| REQ-65 `request-4345b7af`, REQ-69 `request-fd7fc88e` | abandoned | 2026-07-17/18 | — | NO |
| BUNDLE-11 `bundle-ee56a66e` (incl. BUG-27 `bug-2936cebf` — CSS background images / lazy media not captured; REQ-94 gate calibration) | reconciling | 2026-08-05 | Imminent capture-side ask (BUG-27) and a gate-calibration ask (REQ-94, CAP-71/73 territory) | imminent — flagged, not yet enforced |

No intent in the ledger retires a behavior any of the five stories describes. The
REQ-79/REQ-84 framework pivot retired the semantic *layout* modules but explicitly
preserved the capture + values-diff measurement spine, which is exactly this
capability's surface.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| `capability-aa030c83` — body | BUNDLE-6, BUNDLE-7, BUNDLE-8 | **partially aligned.** Scope bullets 1–3 and the "0 value-diffs ⟺ pixel-faithful" invariant trace to REQ-58/REQ-59/REQ-62/REQ-61/REQ-63 (invariant wording is REQ-63's Notes verbatim). Gaps: bullet 3 omits the `--multi-viewport` ladder diff and the persisted value-matrix ladder itself (finding 1); bullet 4 covers only STORY-79 guarantees 1–2 (finding 2) |
| STORY-75 `story-d5de22a5` (upgrade) | REQ-58 T1/T5/T7/T14, REQ-63, REQ-79 (fontLoad), BUG-10 | aligned on substance — all seven items trace to reconciled intent and to live code (`values-diff.ts:76-122, 272-309`; `extract.ts:118-120, 736, 766-769`); deferred residuals match REQ-63 verbatim. Provenance is now unattributed in the body (finding 4) |
| STORY-76 `story-82eb6908` (feature) | REQ-59, REQ-62 | aligned — stop-position tolerance + surface-gradient axis (`values-diff.ts:76, 272-274`) and the shared authoring resolver (`packages/framework/src/modules/text-style.ts:257`). Both intents cited by ID in the body. Exclusivity vs CAP-70 adjudicated today (REPORT-1273, confirm-in-place) |
| STORY-77 `story-16f2793c` (feature) | REQ-61 §"Size parameter…", REQ-58 (ladder dependency) | aligned on the `--size` surface (AC-639…647); **gap: the REQ-58 T2/A ladder-diff mode that shares this machinery is described nowhere** (finding 1). Stale CAP-63 self-reference (finding 3) |
| STORY-78 `story-2c7069fe` (feature) | REQ-61 §"New command" + §"Phase 2" | aligned — N-way table, `--sizes`, join-key alignment, presence flips, `--classify`, `--json`/`--out`, terminal-fail; `--ref` divergence disclosed. Stale CAP-65 ownership line (finding 3) |
| STORY-79 `story-e15a19ef` (upgrade) | REQ-58 T2/A follow-ups (g1–2), REQ-79/`09fa7cf5` (g3), REQ-89 (g2 bootstrap clause, g4) | aligned — all four guarantees trace to reconciled intent, with commit-level citations in the body; g3/g4 absent from the capability's own scope statement (finding 2). Stale sibling-capability references (finding 3) |
| BUNDLE-10 asks (BUG-15/16/22/24/25) | — | **unexpressed, and code absent from `main`** (finding 5) |
| Pre-matrix cohort (REQ-35/47/48/53/64/72/73/74/76) | — | **unexpressed; live in code** (finding 6) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | `capability-aa030c83` body + STORY-77 `story-16f2793c` | story-body-edit | REQ-58 (`request-c2d25c7b`, free_and_reconciled, via BUNDLE-6 `bundle-ab9e0cb6`, main `7a42e182`) T2/A landed **`1c values-diff <slug> --ref <bundle> --multi-viewport`**: capture projects the reference across `RESPONSIVE_VIEWPORTS` and persists `multistate.json`; the diff projects the served draft across the reference's own ladder, pairs cell-for-cell, reports worst-cell-first, is loud on a missing cell, and terminal-fails on a bundle with no ladder. It is live and documented (`tools/generate/src/cli/index.ts:152` usage; `:456-484` dispatch, formatter selection and non-zero exit; `capture/capture.ts:47-48,65-66` and `capture/bundle.ts:71,79` ladder persistence; `capture/pipeline.ts:187` `runMultiStateCapture`) and carries free-coding UATs (`tests/req58-multi-viewport.test.ts:78,192,236,274` — stale-reference guard, formatter missing/clean ordering, capture persists the ladder, catches a wordmark %-drift at 375 while 1280 stays clean). **No story or AC in the matrix expresses it**: AC-656 covers only that the flag parses as boolean; STORY-75 puts "viewport-ladder diffing" out of scope; STORY-77 covers only `--size` (one chosen width); STORY-78 is single-site `responsive-diff`. Capability Scope bullet 3 likewise names only `--size`, per-width screenshots and `responsive-diff`. The hole is a merge artifact: REPORT-892 (CAP-63, 2026-07-24) delegated "REQ-58 T2 multi-viewport" to the ladder-diff sibling, and REPORT-1303 (CAP-65, today) scoped CAP-65 to REQ-61's diff side and listed multi-viewport only as an "upstream dependency" — the consolidation merged both disclaimers into one body | Extend STORY-77's Description with the ladder-diff mode as its own numbered item (cell-for-cell pairing across the reference's persisted ladder, worst-cell-first report, loud missing cells, stale-reference terminal fail) and add the matching Scope bullet-3 clause to the capability body, including the persisted **value-matrix** ladder (not just its screenshot siblings — cluster-6's resolution `report-ae68a81b` already reads CAP-63 as owning "the ladder's value matrix"). Then author ACs; the `test_UAT_FC_REQ-58_multiviewport_*` UATs already exist as evidence to reference |
| 2 | warning | coverage | `capability-aa030c83` body (Scope bullet 4) | story-body-edit | Bullet 4 states only guarantees 1–2 of STORY-79 (boolean flags don't swallow positionals; `--json` stdout carries one document with diagnostics on stderr). Guarantee 3 — store-selecting flags propagate into the render/serve a sub-command drives (`aligned-crops --sandbox`, AC-720, intent BUNDLE-7/REQ-79 keep-note, commit `09fa7cf5`) — and guarantee 4 — an Astro container is constructed only for pages carrying behavior modules (AC-739, REQ-89 via BUNDLE-8, commit `5dc46d0f`) — are absent from the capability's scope statement although both are reconciled intent expressed in the story | Extend bullet 4: "…store-selecting flags forward into the render/serve a sub-command drives, and the render path engages Astro only for pages carrying behavior modules" |
| 3 | warning | consistency | STORY-77, STORY-78, STORY-76, STORY-79 | story-body-edit | Four pre-consolidation cross-references are now wrong: STORY-77 "Generalizes CAP-63 (1c Values-Diff Fidelity)" (self-reference, and CAP-63 is renamed); STORY-78 "Belongs to CAP-65 (1c Size-Aware Diffing)"; STORY-76 names `[[values_diff_fidelity]]`'s `surfaceFill` as a *sibling* capability's axis (same capability now); STORY-79 "Related capabilities: CAP-63 (1c Values-Diff Fidelity), CAP-65 (1c Size-Aware Diffing)" plus "the aligned-crops capabilities", which do not exist in the matrix. STORY-77/78 were filed as warnings 1–2 of REPORT-1303 today and remain unrepaired | Re-point each to CAP-63 `1c Capture & Diff Fidelity`, or name the *behavior* rather than the capability ticket; keep CAP-64/65/66 mentions as historical lineage only; drop "the aligned-crops capabilities" or name the real owner |
| 4 | warning | consistency | STORY-75 `story-d5de22a5` | story-body-edit | STORY-75's body cites **no** intent ID, so provenance rests entirely on fields. `fields.updated_by` is single-valued and now reads `bundle-cceaba25` (BUNDLE-8) only — REPORT-892 recorded `updated_by = bundle-31e474b9` on 2026-07-24, so the BUNDLE-7 link (REQ-63 typography/effects/border-style/`objectPosition`; REQ-79 fontLoad keep-note) has since been overwritten and is now unrecoverable from the matrix. Items 5–7 of the story therefore have no traceable intent, and BUG-10's marker precondition is attributable only via the bundle title | Cite the intents inline as STORY-79 does (e.g. "items 1–4: REQ-58 T1/T5/T7/T14; item 3 style + text-run capture and items 5–6: REQ-63; item 5 marker precondition: BUG-10; item 7: REQ-79 reconcile note, commit `9ca73953`"), and restore `bundle-31e474b9` in the `updated_by` chain if the field permits multiple values |
| 5 | needs_review | coverage | `capability-aa030c83` story tree ← BUNDLE-10 `bundle-4ff83a8b` | — | BUNDLE-10 is `free_and_reconciled` (2026-07-29, `fields.commits[0].main_sha = 2d59a3b6`) and carries five asks squarely inside this capability's declared scope — BUG-15 `bug-9dafeb0b`, BUG-16 `bug-7e28b435`, BUG-22 `bug-3e3fabdb`, BUG-24 `bug-c50fdfcc`, BUG-25 `bug-fe8af80a`. None is expressed by any story in the matrix (no story carries `bundle-4ff83a8b` in its intent chain; a keyword sweep of all 11 story bodies finds no band fallback, webfont barrier, surface-bearing box, colour-alpha capture or per-line run geometry). **And the code is not on `main` either**: `tools/generate/src/cli/capture/extract.ts` was last touched by `338da512b` (2026-07-28, BUG-10) and still shows the pre-fix state — 2-arg `fontLoadedOf` at `:303`, no body-spanning band fallback at `:893`, `overlayOf` reading the legacy `/rgba\(([^)]+)\)/` regex at `:662`; the fix commits (`7acf90977` flat-DOM read, `3781589d4` FOUT barrier, `ed2df25b2` whole-subtree capture) exist only on `reconcile-BUNDLE-10`, are not ancestors of HEAD, and no `bug1[2-9]`/`bug2[0-5]` test file exists under `tests/`. So this is not a matrix-text gap alone — either the reconciliation is incomplete or the code was lost. Authoring stories for behavior `main` does not have would make the matrix claim vapor; deleting the intent is not mine to decide | Escalate to the operator: confirm whether BUNDLE-10's code is expected on `main` (re-land / resync) before any matrix back-fill, then re-run this level. Do **not** author stories for BUG-15/16/22/24/25 until the code state is settled |
| 6 | needs_review | coverage | `capability-aa030c83` story tree ← pre-matrix intents | — | Nine `free_and_reconciled` intents inside this capability's declared scope predate the matrix (CAP-63 was created 2026-07-19 from BUNDLE-6; nothing earlier was ever back-filled) and are expressed by no story: REQ-35 per-metric tolerances/bad-capture handling, REQ-47 severity-ranked structural diff, REQ-48 multi-state fidelity axes (the machinery REQ-58 T2 wired), REQ-53 exact-match-by-default, REQ-64 noise audit + `--collapse` repair order, REQ-72 in-browser gradient-stop hexify, REQ-73 adjacent-gap axis, REQ-74 `--fix-gaps` inversion, REQ-76 cause clustering with dispositions. All are live: `'gap'` delta kind at `capture/values-diff.ts:306,346`; `--fix-gaps` at `cli/index.ts:654`; `collapseMultiViewport` / `clusterDefects` / `formatClusterReport` at `cli/index.ts:40-42,468-480,73-74`; suites `tests/req35-values-diff-noise.test.ts`, `req47-fidelity-structural.test.ts`, `req48-fidelity-axes.test.ts`, `req53-values-diff-exact.test.ts`, `req74-gap-inversion.test.ts`. The capability's scope claims "the captured-and-compared per-element properties … their tolerances and severities", which the gap axis and the tolerance model sit inside — but no intent in the ledger says whether the matrix is meant to cover pre-2026-07-19 capture/diff intent, and the omission is matrix-wide (no capability covers any pre-BUNDLE-6 intent), not specific to this tree | Escalate: operator decides whether pre-matrix capture/diff intent is back-filled here (and, if so, whether `--collapse`/`--clusters` belong in the finding-1 ladder-diff story and `--fix-gaps`/`adopt-values` in a repair-side capability). Independent of finding 1, which is in-ledger and repairable now |
| 7 | info | exclusivity | STORY-75/76/77/78/79 | — | Cross-capability exclusivity was surveyed and adjudicated today: REPORT-1269 (`report-56449702`) raised clusters 2 (gradients authored vs diffed), 3 (CLI hygiene spanning pipeline commands), 4 (element/occurrence pairing) and 6 (persisted ladder/oracle) against this tree; REPORT-1273/1274/1275/1277 resolved all four **confirm-in-place, 0 reassigned, 0 merged**. No intra-capability duplication found either: the five stories partition axes / gradients / `--size` / cross-size / CLI with explicit mutual out-of-scope lines | none |
| 8 | info | consistency | STORY-75 item 1 | — | The rendered-text-extent axis is attributed to "REQ-58 (T1)", but BUNDLE-6's body has no T1 section (the REQ-58 Progress list's early entries are empty placeholders). Grounded instead by code tags at `capture/extract.ts:118-120,766-767`, `capture/sections.ts:105-106`, `capture/values-diff.ts:308-309` and `tests/req58-rendered-text-box.test.ts`. Not a drift — an intent-record gap on the reconciled bundle | none |
| 9 | info | — | CAP-64 `capability-36dd68c5`, CAP-65 `capability-18a822ac`, CAP-66 `capability-ac7ca849` | — | All three remain `status: active` with `merged_into: capability-aa030c83` and `uat_coverage: pass` while holding zero stories; the stale branch index still returns STORY-76/77/78/79 for them (each capability appears twice in `ticket list`, 22 rows for 11 capabilities). Already diagnosed in `report-bdaf6840` and re-filed by REPORT-1299/1303 — a blocked deprecation in the xgd system repo, not this capability's drift | none here |
| 10 | info | — | `capability-aa030c83` fields | — | The capability ticket carries no `intent_uid`; its provenance (BUNDLE-6 / REQ-58 pass-3, plus the consolidation lineage) is recoverable only from body prose. Same observation as REPORT-1299 finding 4 for CAP-66 | none |

## Notes for the Editor

1. **Finding 1 is the only violation and it is repairable now** — the intent is
   in-ledger (REQ-58, BUNDLE-6), the behavior is shipped, and the free-coding UATs
   already exist. The natural home is STORY-77 (it owns the ladder-reading
   machinery and the fail-loud-on-missing-ladder guarantee), not a new story; the
   2026-08-05 rebalance consolidated *away* from below-threshold fragments.

2. **Two related surfaces hang off that same mode** and are covered by finding 6,
   not 1: `--collapse` (REQ-64 repair order) and `--clusters` (REQ-76 cause view)
   are dispatched inside the `--multi-viewport` branch at `cli/index.ts:468-480`.
   If the operator settles finding 6 toward back-fill, they belong in the same
   story as the ladder diff.

3. **Findings 5 and 6 are different questions.** Finding 6 is "should the matrix
   reach back before it existed?" Finding 5 is sharper: a bundle marked
   `free_and_reconciled` whose code is not on `main`. Verify finding 5's git
   evidence before acting — `git merge-base --is-ancestor 7acf90977 HEAD` returns
   non-zero, `git branch --contains 7acf90977` names only `reconcile-BUNDLE-10`,
   and no branch tip in the repo contains the `bandRoots` fallback the fix
   introduced.

4. **Cross-cutting pattern in findings 3 and 4:** every consistency defect at this
   level is rebalance fallout, not intent drift — stale capability names/numbers in
   four story bodies and one overwritten `updated_by` chain. Repairing them is
   mechanical and touches no behavioral claim.

5. **Worktree caveat for whoever repairs this:** human-ID lookups fail here
   (`xgd ticket get STORY-75` → `TICKET_ID_NOT_FOUND`); use UIDs. `ticket list`
   also returns stale duplicate rows on this branch, so read ticket records rather
   than trusting index output (same defect as `report-bdaf6840`).

6. **Imminent (BUNDLE-11, `reconciling`):** BUG-27 `bug-2936cebf` ("CSS background
   images and lazy-loaded media are not captured") is a capture-side ask that will
   land in this capability's scope. Not counted as a gap yet, but the finding-1
   repair should leave room for it.
