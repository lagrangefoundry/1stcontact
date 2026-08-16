---
uid: report-d59c15c2
id: REPORT-2090
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=uat)'
created_by: xgd
created_at: '2026-08-16T07:54:59.473203+00:00'
updated_at: '2026-08-16T07:54:59.473203+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: uat
  violations: 2
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: uat

**Result**: FAIL
**Violations**: 2
**Warnings**: 3
**Needs review**: 0

CAP-71 (`capability-2049c9ec`) holds two `upgrade` stories: STORY-84
(`story-8acc338d`, the fold) now carries **18** ACs — up from 16, REQ-136 added
AC-1133 and AC-1134 on 2026-08-12 — and STORY-86 (`story-24098299`, the 3-probe
gate + cross-gate reconciliation) carries 16. All 34 are `active`; none is
deprecated.

**Method and its limit this run.** Command execution is denied in this session's
harness mode: `npx vitest`, `pnpm vitest` and `node_modules/.bin/vitest` were each
refused, as was `ls` on the Playwright browser cache. **This report therefore
grades UAT bodies against AC bodies statically** — every finding below is derived
by reading the live AC text from the ticket store, the test source, and the
production code it drives, and each is stated so that it stands on what the source
says rather than on a test outcome. Where a claim in the previous uat-level report
(REPORT-1731 / `report-03c71b09`, 2026-08-09) depended on execution, I have said so
and re-derived a static form of it rather than carrying the executed claim forward.

**Working reference and its caveat.** At `uat` level the AC body is the working
reference. It holds for 32 of the 34 ACs. It does **not** hold for AC-691 and
AC-731, whose bodies the ac-level cycle has repeatedly found stale (AC-691's
widest-sample sentence vs BUG-18; AC-731's per-run model vs BUG-14) — recorded as
info 4 and 5, **not** as uat findings, because their resolution is `ac-edit` and no
uat editor can act on them. Both the story-level cycle (REPORT-2088 /
`report-13bc38e7`, 5 violations) and the ac-level cycle (REPORT-2089 /
`report-a9ff561a`, 6 violations) ran **today** and both failed unrepaired; that
cascade is why three items here are info rather than actionable uat work.

**The headline.** Coverage is not the failing property — all 34 ACs have exactly
one substantive UAT driving a real entry point, and REQ-136's two new ACs arrived
with genuinely strong tests. The failure is **two consistency gaps in one file that
has not been touched since 2026-07-22** and is now on its **fourth** consecutive
report.

## Cumulative Intent Considered

At `uat` level intent is consulted only where an AC is itself suspicious. Statuses
below were read from the live tickets this session.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more — recorded as both stories' `intent_uid` | YES |
| BUG-14 | free_and_reconciled | 2026-07-23 | Surface reconstruction is band → card, **not** per-run | YES (retires per-run) → **info 5** |
| BUG-18 | free_and_reconciled | 2026-07-23 | Flat text axes keyframed per width, not taken at desktop | YES (retires widest-sample) → **info 4** |
| BUNDLE-8 / BUNDLE-10 | free_and_reconciled | 2026-07-29 | The full-language fold (REQ-89/90/91/92 + BUG-12…16 + others) — the source of the clauses violations 1 and 2 leave unexercised | YES |
| BUNDLE-11 (`bundle-ee56a66e`) | free_and_reconciled | 2026-08-05 | BUG-27 + REQ-94 + REQ-96 + REQ-97/98 + 10 more — recorded as both stories' `updated_by` | YES |
| **REQ-136** (`request-8a132869`) | **free_and_reconciled** | **2026-08-12** | Non-destructive framing + colour adjustment as typed L1 axes ("adjust the view, never the bytes"); added AC-1133 + AC-1134, widened AC-729 | **YES — new since the last uat cycle; see info 1** |

Earlier members (REQ-79, REQ-83, REQ-86, REQ-88, REQ-66-retired, BUG-5…BUG-9,
BUG-11, BUG-13, BUG-17, BUG-19…BUG-23, BUG-27, REQ-90/92/93/94/96) resolve through
the bundles above and are unchanged from the ledgers of REPORT-1731 and
REPORT-2089. REQ-114 and REQ-82/84/85 are out of scope per this capability's own
"Out of scope" statement (CAP-70 / CAP-63).

## Alignment Ledger

### STORY-84 (fold) — 18 ACs

| AC | UAT | Outcome |
|---|---|---|
| AC-689 | `reconciliation-l1-fold.test.ts:207` | **drift** — bundle artifact / `validateL1` / ladder widths / root kind / empty-ladder throw all proven; the BUNDLE-8 full-language clause is unexercised because the driver fixture is text-only (**violation 2**) |
| AC-690 | `…l1-fold.test.ts:233` | aligned — `multistate.json` retained, oracle widths equal the folded `widths` |
| AC-691 | `…l1-fold.test.ts:256` | **drift** — keyframe `at`/x/y/width and widest-sample `fontSizePx` proven; **both height clauses unasserted** (**violation 1**). Body itself stale vs BUG-18 (info 4) |
| AC-692 | `…l1-fold.test.ts:292` | aligned — fluid → `['interpolate']`, reflow → `['snap']` |
| AC-693 | `…l1-fold.test.ts:319` | aligned — bounded `fromPx: 1024`, `undefined` on the always-present node |
| AC-694 | `…l1-fold.test.ts:345` | **weak** — three criterion dimensions asserted on neither path; two Verification items live only inside the engine-gated branch (**warning 2**) |
| AC-695 | `…l1-fold.test.ts:392` | aligned — renders from the folded doc alone, no sidecar in scope |
| AC-696 | `…l1-fold.test.ts:413` | aligned — unknown-command + exit 1 + dead symbols absent |
| AC-729 | `…full-language.test.ts:83` | **narrowed** — src/alt/fallback, omitted-axis discipline, four-side pinning, visibility, render, src-less → residual all proven; REQ-136's "how the picture is *seen*" clause is deliberately deferred to siblings (**warning 1**) |
| AC-730 | `…full-language.test.ts:214` | aligned — full surface axes, single-axis divider proves omission, height-bearing track, CSS paints |
| AC-731 | `…full-language.test.ts:303` | **test right / AC stale** — UAT asserts the shipped BUG-14 band+card model; AC body still states the retired per-run model (info 5) |
| AC-732 | `…full-language.test.ts:384` | aligned — five treatments fold + render, re-fold identity, painted-only font table |
| AC-733 | `…full-language.test.ts:502` | aligned — five typed residuals with kind/reason/axes/widths; geometry-bearing control binds; opt-in channel |
| **AC-1133** | `…framing-and-adjustment.test.ts:92` | **aligned (new)** — seven fixtures cover every Criterion rule: off-centre pair carried, browser's centre → nothing, keyword and length forms → nothing, half-pair → nothing, fractional percentages survive, surface excluded; closes on `validateL1` **and** on the emitted `object-position` set being exactly the two framed pictures (`:157`) — which is what proves no value was invented |
| **AC-1134** | `…framing-and-adjustment.test.ts:164` | **aligned (new)** — decimal ≡ percent spelling, all-eight-at-own-identity → no axis, opposite extremes both carried (the assertion a single-constant skip rule fails), ceiling clamp, floor clamp, negative skipped, drop-shadow not read, surface carries the stack; `emitted).toHaveLength(6)` (`:261`) pins the negative space |
| AC-812 | `…seams-and-refold.test.ts:101` | aligned with a gap — image handle + fill + four-side track, ordering ahead of the headline in both the leaf list and the rendered HTML, band clamp proven by counterfactual, page base inferred; the criterion's "peer of the section-background boxes" half is unasserted (**warning 3**) |
| AC-813 | `…seams-and-refold.test.ts:229` | aligned — one seam per form at the union rect at all six widths, control leaves, per-width rebase against the retained oracle |
| AC-814 | `…seams-and-refold.test.ts:498` | aligned — real `cli.run(['refold'])`, offline proven by `fetch` spy, sha256 over the bundle proves only derived artifacts move, ladderless bundle rejected |

### STORY-86 (gate + cross-gate) — 16 ACs

All sixteen are unchanged since the previous uat cycle (`git log --since=2026-08-09`
reports no commit touching `reconciliation-3probe-gate.test.ts`,
`…-evaluator.test.ts` or `…cross-gate-reconciliation.test.ts`), and their AC bodies
are likewise unedited. REPORT-1731's per-AC ledger for AC-705…AC-710, AC-724,
AC-734…AC-737 and AC-852…AC-856 therefore stands; I re-checked the symbol map (one
`test_UAT_AC<n>_*` per AC, no orphans, no duplicates) and re-read AC-710 against
`tools/generate/src/l1/probes.ts` for info 6. No new drift found in this half.

| AC | UAT | Outcome |
|---|---|---|
| AC-705, AC-706, AC-707, AC-708, AC-709, AC-724 | `…3probe-gate.test.ts:299…673` | aligned (unchanged) |
| AC-710 | `…3probe-gate.test.ts:636` | aligned **to its AC body** — Verification asks for an overlap and a clip and gets both; the pinned-box overflow path is a third envelope violation no AC states (info 6) |
| AC-734, AC-735, AC-736, AC-737 | `…gate-evaluator.test.ts:114…591` | aligned (unchanged; AC-736 wording still broader than the code's fold-synthesized-only rule — info 7) |
| AC-852…AC-856 | `…cross-gate-reconciliation.test.ts:250…659` | aligned (unchanged) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-691 (`acceptance_criterion-304cae4c`) / `test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box` | uat-edit | AC-691's criterion turns on a **height** distinction — "A box, image or backing-surface leaf additionally pins its height at every keyframe … a text leaf's keyframes carry no height, leaving its height natural from flow" — and its Verification names both halves ("and no keyframe carries a height"; "For a folded image leaf and a folded box leaf, assert every keyframe carries a height"). The UAT (`tests/reconciliation-l1-fold.test.ts:256-290`) asserts keyframe `at` values, x/y/width (`:278-286`) and the widest-sample `fontSizePx` (`:288`) and makes **no height assertion at all**. Keyframe-height assertions exist elsewhere only on image/box leaves (`…full-language.test.ts:166-172`, `:276-280`, under AC-729/AC-730), so the **text-leaf "no height" invariant has zero executable evidence anywhere in the repo** — verified by grepping `tests/` for every form of a no-height assertion (`height).toBeUndefined`, `height === undefined`, `toHaveProperty('height')`): the only two hits are in `reconciliation-copy-edit-form-presentation.test.ts:140,142` and are fixture construction, not assertions. The distinction is live and load-bearing in code: `tools/generate/src/l1/fold.ts:1786` `buildGeometry(withHeight)`, whose `:1799` guard `if (withHeight && …) kf.height = …` is the omission, called `false` for the text leaf at `:1849` and `true` for image at `:1980` and box at `:2023`. It also silently governs a second axis — `:1797` rounds a text box's width **up** (REQ-88) and a box/image's to nearest — equally unasserted. AC-707's content-robustness probe grows text runs, which is only meaningful because text height is natural rather than pinned (`probes.ts:305-307`), so a regression that started pinning text heights would leave every UAT in this capability green. **Fourth offence: REPORT-1320 violation 1 (2026-08-05), REPORT-1662 violation 1 (2026-08-07), REPORT-1731 violation 1 (2026-08-09); `git log -1` on the file returns `f0367940d`, 2026-07-22 — no repair has ever been attempted.** | In `test_UAT_AC691`, assert `kfs.every((k) => k.height === undefined)` for the `Headline` text leaf, and extend the existing fixture with one media element and one painted panel, asserting each of their keyframes carries `height` equal to the captured box height |
| 2 | violation | consistency | AC-689 (`acceptance_criterion-7785b92a`) / `test_UAT_AC689_capture_emits_one_validated_l1_document` | uat-edit | AC-689 states the document "is emitted in the **full** L1 language, not text alone: it may carry text leaves, image leaves, box leaves and backing-surface leaves", and its Verification asks to "Fold a capture containing runs, media and painted panels and assert the document contains leaves of more than one kind". The UAT (`tests/reconciliation-l1-fold.test.ts:207-231`) drives the real `cmdCapturePage` with `FakeDriver`, whose `signalsFor()` (`:103-133`) carries exactly **one** text run (`:120`) and `items: []`, `fields: []` (`:122-123`), `images: []` (`:131`) — so the folded document can only hold one leaf kind and the clause BUNDLE-8 added to this AC is never exercised. The five assertions present (`:220-230`) cover only the REQ-83-era criterion: artifact exists, `validateL1` ok, `widths` = ladder, root kind, explicit empty-ladder throw. Nearest coverage anywhere is `…full-language.test.ts` line 330's kind-set check, but that is AC-731's UAT and runs on `foldToL1` directly — **not** the `cmdCapturePage` bundle path that is the whole subject of AC-689. **Fourth offence: REPORT-1320 violation 2, REPORT-1662 violation 2, REPORT-1731 violation 2 — never repaired.** | Add a media element (`images`/a textless `src`-bearing element) and a painted panel (`surfaceFill`) to `signalsFor()`, then assert the `l1.json` read back from the bundle carries leaves of more than one kind, e.g. `expect(new Set(children.map((n) => n.kind)).size).toBeGreaterThan(1)` |
| 3 | warning | consistency | AC-729 (`acceptance_criterion-39597704`, rewritten 2026-08-12) / `test_UAT_AC729_media_folds_to_image_leaf_with_src_alt_and_axes` | uat-edit | REQ-136 widened AC-729 from "which picture it is and what it is called" to **how the picture is *seen*** — the criterion now names "how the picture is framed (its fit, and which part of itself its box shows), how it is adjusted (the colour-adjustment stack painted over it)", and its Verification asks for "the expected axes including a non-default framing pair and a folded colour adjustment where the element paints them". The UAT's fully-painted `hero-media` fixture (`…full-language.test.ts:93-105`) carries neither `objectPosition` nor `filter`, and its closed assertion `expect(hero.axes).toEqual({ objectFit, borderRadiusPx, opacity, blendMode, border, boxShadow })` (`:154-161`) omits both. The test says so explicitly (`:84-88`): it defers the widened clause to `test_UAT_AC1133_*` / `test_UAT_AC1134_*`. **This is a warning, not a violation**: those siblings do prove framing and adjustment on real image leaves, so the behaviour is not unevidenced — but AC-729's own claim is the *union* on one leaf (that a picture carrying finishing axes carries its framing and adjustment alongside them, none crowding the others out), and no fixture in the repo paints all three families on a single image element. | Add `objectPosition: '30% 70%'` and `filter: 'saturate(0.6)'` to the `hero-media` fixture and extend the `toEqual` to include `objectPosition: { xPct: 30, yPct: 70 }` and `filter: { saturate: 0.6 }` — one fixture edit, no new test, and it keeps AC-1133/AC-1134 as the rule-by-rule proofs rather than duplicating them |
| 4 | warning | consistency | AC-694 (`acceptance_criterion-c8dd43d2`) / `test_UAT_AC694_capture_emits_advisory_structural_hint_sidecar` | uat-edit | AC-694's criterion enumerates six sidecar dimensions (ancestry/`parentId`, parent computed layout, authored sizing unit per axis, position mode, sibling-repetition count, ascending `@media` breakpoints). Three of them — `parentId`, `position`, `repeatCount` — are asserted on **neither** path: grepping the test file returns them only at `:141`, `:144`, `:149`, which is the `CANNED_HINTS` literal, never an `expect`. Of the two dimensions AC-694's *Verification* names explicitly (parent layout mode + `justify-content`), both sit only inside the engine-gated branch at `:364` (`if (!(await chromiumAvailable())) return`), at `:385-387`. The two assertions on the always-run path (`:358` breakpoints ascending, `:359` some node `widthUnit === 'percent'`) are satisfied by the test's own `CANNED_HINTS` (`:135-153`, returned verbatim by `FakeDriver.query` at `:165`), so they prove the sidecar round-trips to disk, not that extraction computes those values — and `CANNED_HINTS.parentLayout` is `null` (`:146`), so even an enriched canned path would need new fixture data. **Note on evidence:** REPORT-1731 confirmed by execution that this branch skips on the regression runner; I could not re-run it (execution denied this session), so I state the static form only — the criterion coverage gap holds regardless of whether Chromium happens to be present. **Re-raise of REPORT-1320 warning 3 / REPORT-1662 warning 3 / REPORT-1731 warning 3.** | Enrich `CANNED_HINTS` with a non-null `parentLayout` and a second child node, then move the *contract* assertions (per-node `parentId`, `position`, `repeatCount`, non-null `parentLayout`) onto the always-run canned path, leaving only extraction *accuracy* engine-gated. Do **not** repair by deleting the skip |
| 5 | warning | consistency | AC-812 (`acceptance_criterion-fd94d9ab`) / `test_UAT_AC812_backdrop_folds_behind_content_bounds_bands_and_feeds_the_page_base` | uat-edit | AC-812's layering clause has two halves — the backdrop sits "behind the text runs of the band it sits under, **and after the section-background boxes it is a peer of**". The UAT proves the first half twice (`…seams-and-refold.test.ts:144-147` leaf index before the first text leaf; `:151-152` `id=` before `Nested Hero` in the rendered HTML) and asserts **nothing** about the backdrop's position relative to the band/section-background boxes — even though the same fixture already materialises them as `heroBands` (`:160-163`) and then only checks their vertical clamp (`:164-169`). The rule is live in `fold.ts` (`children: [...bandNodes, ...sectionBgNodes, ...backdropNodes, …]`) and load-bearing: absolutely-positioned siblings with no z-index paint in source order, so a backdrop emitted *before* its band would have the band's opaque fill paint over the hero photograph — the mirror image of the defect the asserted half guards against. Warning rather than violation because AC-812's *Verification* section stops at the first half. **Re-raise of REPORT-1662 warning 4 / REPORT-1731 warning 4.** | One assertion, using node sets the fixture already builds: `expect(leaves.indexOf(backdrop)).toBeGreaterThan(Math.max(...heroBands.map((b) => leaves.indexOf(b))))` |
| 6 | info | coverage | AC-1133 + AC-1134 (REQ-136) | — | The two ACs REQ-136 added on 2026-08-12 arrived with `tests/reconciliation-l1-fold-framing-and-adjustment.test.ts`, one UAT each, both driving real `foldToL1` / `validateL1` / `renderL1Document` over synthetic multi-viewport captures with no mocks. Each covers **every** rule its Criterion states, and both close on a *negative-space* assertion — AC-1133 pins the emitted `object-position` set to exactly the two framed pictures (`:157`), AC-1134 pins the emitted `filter` count to 6 (`:261`) — which is the only shape of assertion that can prove "no value was invented for the ones that folded nothing". AC-1134 also carries the under-floor case (`:197`, `hue-rotate(-5000deg)` → `-3600`) with a comment recording that a ceiling-only clamp previously produced a document `validateL1` refuses. **This is the standard findings 1 and 2 should be repaired to.** | none |
| 7 | info | consistency | AC-691 / BUG-18 | — | Separate from finding 1: AC-691's closing sentence ("A node's authored typography axes are taken from its widest present sample") is the behaviour BUG-18 (free_and_reconciled, 2026-07-23) was filed to remove. The AC-691 fixture varies `fontSizePx` (24/32/44 at 320/768/1280, `…l1-fold.test.ts:263`) so the folded leaf carries a responsive text track, and the UAT asserts only `axes.fontSizePx === 44` (`:288`) — which still holds because the widest keyframe equals the scalar. The UAT is consistent with its stale AC and silent on BUG-18's shipped behaviour. Resolution is `ac-edit` (REPORT-2089's finding, unrepaired) plus `story-body-edit` (REPORT-2088). | none at this level; a `uat-edit` adding the track assertion follows the AC rewrite |
| 8 | info | consistency | AC-731 (`acceptance_criterion-6a5e0eec`) | — | The UAT asserts the shipped BUG-14 model — band runs coalesce into one `section-band-*` box and the surface-differing runs fold `card-*` boxes (`…full-language.test.ts:303-351`, with an in-test comment naming BUG-14). AC-731's body still specifies the retired per-run model, and its "runs on that fill emit no backing box" clause is not assertable as worded. Test right, AC stale; `ac-edit`, filed at ac level and unrepaired. | none at this level; a `uat-edit` follows once AC-731 is rewritten |
| 9 | info | coverage | pinned-box content overflow | — | `tools/generate/src/l1/probes.ts` raises **three** envelope violations: sibling overlap (`:479`), horizontal clip beyond the viewport (`:453`), and pinned-box content overflow (`:410-415`, `detail: "content height … exceeds pinned box height …"`). `test_UAT_AC710` exercises overlap and the viewport-edge clip only — which **satisfies AC-710's Verification as written** ("Force an overlap and a clip"), so this is not a UAT defect. The gap is that no AC states the third violation. First filed 2026-08-05; it has now survived four ac-level cycles. Repair is `ac-add`; a UAT written now would trace to no matrix element. | none at this level; a `uat-add` follows once the AC lands |
| 10 | info | consistency | AC-736 (`acceptance_criterion-76d9ee68`) | — | AC-736 excludes "a painted surface leaf — a childless box carrying a card/panel/section fill" from the sibling-overlap check; the code is narrower, excluding only fold-synthesized surfaces (`section-band-*` / `section-bg-*` / `card-*`) while a captured standalone `box-*` still participates. `test_UAT_AC736` asserts the code's narrower rule. Recorded so the AC editor knows the UAT needs no change once AC-736 is tightened. | none |
| 11 | info | exclusivity | AC-729 vs AC-1133/AC-1134; AC-733 + AC-813; AC-731 + AC-812; AC-705 + AC-724; AC-707 + AC-709 | — | Checked for duplication across all 34. The one genuinely new adjacency this cycle is AC-729 vs REQ-136's pair, and it is **not** a duplicate — AC-729 owns the media-element fold (source, alt fallback chain, four-side pinning, visibility, residual-on-missing-src) and the siblings own the framing and adjustment *rules* (spelling normalisation, per-function no-op, envelope clamping). Finding 3's suggested repair is deliberately a fixture edit rather than a new test, so closing it does not create a duplicate. The older pairs are unchanged from REPORT-1731's analysis: disjoint assertions in every case. **No duplicates across all 34.** | none |

## Notes for the Editor

**Repair one file.** Both violations live in `tests/reconciliation-l1-fold.test.ts`,
both are cheap, and both are now **fourth** offences — filed 2026-08-05,
2026-08-07 and 2026-08-09 and never touched. `git log -1` on that file still
returns `f0367940d` (2026-07-22). AC-691 needs one `height === undefined`
assertion plus a media element and a painted panel added to its existing fixture;
AC-689 needs the same two elements added to `signalsFor()` plus one kind-set
assertion. The two repairs share the same fixture work. **If this cycle repairs
only one thing, repair this file** — and note that the AC-689 repair (adding a
media element and a painted panel to `signalsFor()`) is a prerequisite for nothing
else and blocks nothing else, so there is no ordering excuse.

**Finding 1 remains the more important of the two.** The image/box half of AC-691's
height rule is at least proven elsewhere (AC-729/AC-730 UATs assert
`kf.height` explicitly); the text-leaf half is proven **nowhere in the repository**
— I grepped every assertion form for it and found none. That invariant is what
makes AC-707's content-robustness probe meaningful: the probe grows text and
expects flow to absorb it (`probes.ts:305-307`), which is only true because
`buildGeometry(false)` omits the height at `fold.ts:1799`.

**Do not repair finding 4 by deleting the skip.** The previous cycle established by
direct invocation that Chromium cannot launch on the regression runner (build-ID
mismatch). I could not re-verify that this session — execution was denied — but the
repair shape is unchanged and does not depend on it: move the *contract* assertions
(`parentId`, `position`, `repeatCount`, a non-null `parentLayout`) onto the canned
path, which needs `CANNED_HINTS` enriched first, and leave extraction *accuracy*
engine-gated.

**REQ-136's UATs are the standard to copy.** AC-1133 and AC-1134 are the strongest
tests in this capability: every Criterion rule has a fixture, and each closes by
pinning the *negative space* in the rendered CSS (the exact `object-position` set;
`filter` count exactly 6). That last move is what turns "the axis folded" into "and
nothing else defaulted one in" — precisely the class of proof AC-689 and AC-691 are
missing. Whoever repairs the two violations should reach for the same shape.

**Findings 7–10 are deliberately not filed as UAT work.** All four are ac-level
repairs already filed by REPORT-2089 (today) and left unrepaired. Editing UATs for
them now would encode a fixed bug (AC-691's widest-sample sentence, AC-731's
per-run model) or trace to no matrix element (pinned-box overflow). Each carries a
follow-on `uat-edit` / `uat-add` that becomes actionable the moment the AC lands —
the next uat cycle should expect three new items, not zero.

**Verification performed, and its boundary.** Read this session in this worktree
(`regression-d24ebf03`): the live bodies of AC-689, AC-691, AC-694, AC-710,
AC-729, AC-812, AC-1133 and AC-1134 from the ticket store; the full sources of
`reconciliation-l1-fold.test.ts` (fixture + AC-689…AC-696), the AC-729/AC-730
regions of `…full-language.test.ts`, the AC-812/AC-813 regions of
`…seams-and-refold.test.ts`, and all of `…framing-and-adjustment.test.ts`;
`fold.ts:1783-1812` plus every `buildGeometry` call site and every leaf-emission
site; the `pinned` / envelope-finding surface of `probes.ts`; the `test_UAT_AC*`
symbol set across `tests/` (34 ACs, exactly one test each, no orphans, no
duplicates); a repo-wide grep for any no-height assertion; and `git log` on all
seven test files. **Not performed:** the test suite was not executed — `npx
vitest`, `pnpm vitest` and `node_modules/.bin/vitest` were all refused by the
harness's don't-ask permission mode, as was inspecting the Playwright browser
cache. No finding above rests on a test outcome; each rests on the source read.
