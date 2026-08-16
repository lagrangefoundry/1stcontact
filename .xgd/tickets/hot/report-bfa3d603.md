---
uid: report-bfa3d603
id: REPORT-2095
type: report
title: 'UAT Coverage: Framework Substrate: L1 Layout, Values & Behavior Modules'
created_by: xgd
created_at: '2026-08-16T08:47:34.554810+00:00'
updated_at: '2026-08-16T08:47:34.554810+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ae9d65d6
  violations: 5
  warnings: 8
  needs_review_count: 0
---

# UAT Coverage Assessment: Framework Substrate: L1 Layout, Values & Behavior Modules

**Result**: FAIL
**AC verdicts**: 98 pass, 1 fail, 1 deprecated, 0 needs_review
**Story verdicts**: 4 pass, 2 fail, 1 stale, 0 needs_review
**Capability verdict**: fail

Anchor report: report-7ef6a9ea · Capability: capability-ae9d65d6 (CAP-70) · Previous attempts: 6

Scope: **7 stories**, **100 live ACs** (43 STORY-83, 19 STORY-90, 15 STORY-85,
10 STORY-91, 6 STORY-81, 5 STORY-80, 2 STORY-82). Set moved by +4 since the last
coverage cycle (REPORT-1728, 96 ACs): **+5** new under STORY-83 (AC-1124…AC-1128,
REQ-136, authored 2026-08-12) and **−1** relocated (AC-932 left STORY-80 for
STORY-97 on 2026-08-10).

## ⚠ Execution limitation — disclosed, not worked around

**I could not run the test suite.** The session is in don't-ask mode with no
allowlist entry for a test runner; `npx vitest run tests/reconciliation-l1-substrate.test.ts`
was denied by the permission layer. The last cycle that could execute
(REPORT-1727) reported 18 files green, 96 passed / 2 skipped — **I am not
restating that as a current result.**

This does not weaken the verdicts below. Coverage assessment asks whether a test
*substantively exercises* its AC, which is a property of the test body, not of its
pass state. Every judgement here was established by reading the test at the cited
file:line this cycle. The one thing I cannot confirm is the suite's current
greenness; if the fix loop needs that, it must come from a runner with execution
permission.

Two other mechanical notes: `.xgd/uat_index.json` is **empty** (`acs: {}`), so the
prescribed index lookup returns nothing for every AC — AC→test resolution was done
by scanning `tests/` for `test_UAT_AC<n>_*` definitions directly. And 93 of the 100
ACs already carried the correct `uat_coverage` value from the prior cycle; I wrote
only the 7 that changed rather than re-committing 93 identical values.

## Cumulative Intent Considered

Statuses below were re-derived this cycle from the ticket store (bundle bodies +
standalone `request` tickets), not carried from the sibling reports.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-58/59/61/62 (BUNDLE-6) | free_and_reconciled | 2026-07-17 | Pre-pivot capture/diff value work; original home of STORY-80/81/82 | YES |
| REQ-79 / REQ-82 / REQ-84 / REQ-85 (BUNDLE-7) | free_and_reconciled | 2026-07-22 | **The pivot.** L1 typed substrate + safety envelope + sole renderer; deletes the semantic layout modules and their ~20 dials; reframes carousel / contact-form as vetted modules | YES (retires module dials) |
| **REQ-87** (`request-84af044b`) | free_and_reconciled | 2026-07-21 | `capability module` → **behavior module**, no back-compat alias | YES (retires `Capability*` naming) |
| **REQ-93** (`request-f26cbe32`, reconciled in BUNDLE-10) | free_and_reconciled | 2026-07-25 | Page-level slot binding + five rejections, renderer mount, `mountInL1`, `fields[].labelMode` | YES — **live code + 10 UATs, claimed by no AC (Findings 3, 4)** |
| REQ-90 / REQ-91 (BUNDLE-8) | free_and_reconciled | 2026-07-29 | Resource table + `@font-face`; captured pixel-mover axes | YES |
| REQ-96 / REQ-97 / REQ-98 / REQ-103…107 (BUNDLE-11) | free_and_reconciled | 2026-08-05 | `control` leaf; deletes `carousel.config.view`; **replaces `intro`/`submit` slots with one required `form` slot**; shared axis groups; per-width layout track; link role | YES (retires the two slots) |
| REQ-99 / REQ-100 / REQ-108…111 / BUG-28 / BUG-30 (BUNDLE-13) | free_and_reconciled | 2026-08-06 | Interaction state, scroll reveal, pointer accent, renderer safety floor; relocatable URLs | YES |
| REQ-114 / REQ-116 (BUNDLE-14) | free_and_reconciled | 2026-08-06 | **Deletes the closed colour-role vocabulary**; edit-channel settled-state carve-out | YES (retires "overlay role") |
| REQ-115 / REQ-117 (BUNDLE-16) | free_and_reconciled | 2026-08-07 | Navigation/link role; nowrap width floor | YES |
| **REQ-136** (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Non-destructive image framing + typed colour adjustment + typed shape | **YES — newly covered this cycle, all 5 ACs clean** |
| REQ-137 (`request-d2980a95`, BUNDLE-18) | bundled / `reconciling` | 2026-08-12 | Deletes palette `steps`; Oklab `shade` on the reference | imminent — not yet enforced (Warning 8) |

BUNDLE-12 and BUNDLE-15 are `abandoned` duplicates of BUNDLE-13 / BUNDLE-14 and do
not count separately.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-80 Absolute values re-homed in L1 | BUNDLE-6 → REQ-84, REQ-114 | aligned | Body records the REQ-84 dial deletion and the REQ-114 move of the colour overlay into L1. 5/5 ACs substantive |
| STORY-81 Responsive layout track | BUNDLE-6 → REQ-104 | aligned | Body records that its per-breakpoint dials died with REQ-79/84 and REQ-104 gave it distinct behaviour. 6/6 ACs substantive |
| STORY-82 Reproduction treatments | BUNDLE-7 (REQ-84, REQ-85) only | **stale** | Body untouched since 2026-07-22. Missed REQ-87 (naming), REQ-93 (`labelMode`) and REQ-96 (slot replacement) entirely |
| STORY-83 L1 layout substrate | BUNDLE-7 → REQ-136 | **incomplete** | Tracks REQ-87/96/97/98/105/114/117/136 correctly, but states REQ-93's mount as its negation and no AC claims the mount |
| STORY-85 Behavior modules | BUNDLE-7 → REQ-116 | **incomplete** | Records REQ-96 supersession and the REQ-116 carve-out, but stops at config/slots/controls — REQ-93's page-level binding and `mountInL1` are absent |
| STORY-90 Interaction / motion / pointer accent | BUNDLE-13 | aligned | 19/19 ACs substantive |
| STORY-91 L1 navigation | REQ-106 / REQ-115 | aligned | 10/10 ACs substantive |

## Evidence Assessment

**All 100 ACs resolve to a real `test_UAT_AC<n>_*` definition in `tests/`** across 19
files. No AC is unmatched. AC-685 is the only AC with two definitions
(`reconciliation-l1-substrate.test.ts:302` and
`reconciliation-l1-shared-axis-groups.test.ts:131`) — legitimate split coverage of
its two paragraphs, not a duplicate.

Entry points are real throughout: `validateL1`, `validateSite`,
`renderL1Document` / `renderL1Fragment` / `renderL1Page`,
`validateBehaviorConfig` / `Slots` / `Controls` / `Instance`, `getModule` and the
real `registry`, the real Astro SSR container, real `cmdNew` / `cmdRender` /
`cmdColors` / `cmdColorsAssign` against the real filesystem, `foldToL1`, and real
Playwright engines. Screened for the four disqualifying shapes:

- **Existence-only assertions**: none.
- **Source-text-only tests**: none. Where a test reads a file it is supplementary
  to behavioural assertions (AC-810 reads the *generated* `theme.css` after a real
  `cmdNew` + `cmdRender`; AC-722 drives three real validators through accept/reject
  pairs before grepping for residual `Capability*` names).
- **Internal mocking**: exactly one instance, AC-702 (Warning 5). The
  `vi.spyOn(mounted.form, 'getAttribute')` in AC-877/878 fakes a **DOM API** — an
  external boundary TEST-STRATEGY permits.
- **Engine gating**: AC-683/AC-688 use `it.runIf(...)` and surface honestly as
  *skipped*. AC-1009/AC-1011/AC-1012 use a bare `if (!HAVE_CHROMIUM) return`, which
  reports **pass** for an arm that never ran (Findings 2, Warning 4).

Spot-checks confirming the post-REQ-96 repointing is real rather than nominal: no
test in the capability references `config.view`, `view-single|peek|multi`,
`flex-basis`, or the `intro`/`submit` slots; AC-718's test asserts
`Object.keys(contactFormMeta.slots)` is exactly `['form']`.

**The REQ-136 surface lands clean.** I re-verified AC-1124 independently
(`reconciliation-l1-image-framing.test.ts:130-188`): it drives the real `validateL1`
and proves the pair-or-nothing rule, the 0–100 bound with a located field path
(`/root/children/0/axes/objectPosition/xPct`), absence meaning the browser's own
centre rather than a recorded default, and refusal on all four non-image kinds —
with a positive control that the boundary is the *kind*, not the shape. AC-1125…1128
follow the same shape. These five moved from *no verdict* to `pass`.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | story | STORY-82 (`story-46e3b3c7`) | story-body-edit | **Fifth consecutive cycle; body byte-identical since 2026-07-22.** Three reconciled intents passed it by. (a) REQ-96 deleted the `intro`/`submit` slots the body still describes ("L1 mounted into the `submit` slot, decorative framing into the `intro` slot") — `contact-form/meta.ts:58-61` declares `slots: { form: { required: true } }` with `submit` now a **control**. (b) REQ-87 renamed the runtime type with no alias, yet the body says "capability module", "capability config", "capability validators" and names its dependency "the **Capability Modules** story"; sibling AC-722 asserts that negative *as a criterion*. (c) REQ-93 added `config.fields[].labelMode: 'visible' \| 'placeholder'` as a captured a11y fact, so the body's claim that `fieldLabels=placeholder` "is gone" now denies the very mechanism its own title promises ("placeholder-labelled … contact forms") | Repoint the contact-form paragraph to the required `form` slot + `control` leaves, keeping `intro`/`submit` only as a named supersession; rename to behavior module / behavioural config / STORY-85 throughout; replace the "`fieldLabels=placeholder` is gone" clause with `labelMode`, framed as a captured fact rather than a dial |
| 2 | violation | ac | AC-718 (`acceptance_criterion-f3328e22`) | ac-deprecate — **applied this cycle** | Every specific claim the criterion makes was retired by later reconciled intent: the `submit` and `intro` slots (REQ-96), the config set "only `action`, `fields`, `successMessage`" (REQ-96 added `submitLabel`), and the runtime type "capability" in five clauses (REQ-87). Its own UAT has **already moved past it** — `test_UAT_AC718_*` (`reconciliation-reproduction-treatments.test.ts:126`) asserts `submitLabel` is live, the retired dials are gone, `slots` is exactly `['form']`, and the submit button is an L1 `control` leaf carrying `surfaceFill`. The test is the correct party. Set to `uat_coverage: deprecated`, `lifecycle: deprecated` per the retired-AC rule | Done at the field level. The editor still owns the prose half: fold the pivot supersession into STORY-82's body as provenance, then retarget or retire `reconciliation-reproduction-treatments.test.ts` with the ACs it serves |
| 3 | violation | story | STORY-83 (`story-d0a8cfad`) | story-body-edit | Out-of-scope section closes: a `slot` renders as an inert placeholder "**with no module code and no behaviour attached**". REQ-93 (free_and_reconciled) gave the sole emitter a `mounts` map — a bound module's already-rendered fragment becomes the slot's content and is inserted **verbatim, unescaped** (`packages/framework/src/l1/render.ts:1816`, `:1847`, `:2119`). The story's load-bearing claim is that a single safe renderer neutralises every value at emit time; the one place that inserts markup verbatim is stated as its negation, so the reasoning for the carve-out is nowhere on record | State the mount: a slot is the inert placeholder **when no mount is supplied**, and carries the bound module's framework-rendered fragment when one is. State the trust boundary explicitly (framework-rendered markup already through the module's own escaping/URL sinks, binding pre-proved by the page validator) rather than restoring the false absolute |
| 4 | violation | story | STORY-85 (`story-179b8c06`) + STORY-83 | ac-add (+ story-body-edit first, + uat-relink) | **A whole reconciled intent is unclaimed by the matrix.** REQ-93's page-level binding rule ("modules may accompany `l1` when each is bound by name to a `slot` present in the L1 tree") and its five rejections — unbound module, dangling slot name, double-bound seam, orphan seam, `slot` with no `l1` — are implemented at `packages/site-schema/src/schema.ts:469-599`, and `mountInL1` exists at `tools/generate/src/conformance/types.ts:92` + `harness.ts:140`. **The evidence already exists**: `tests/req93-l1-slot-mounted-behaviors.test.ts` carries 10 substantive UATs. They are named `test_UAT_FC_REQ-93_*` (free-coded form), so no AC claims them and the matrix cannot credit them. AC-698 is not a substitute — it covers *per-instance* slot validation, not the page↔tree binding | Sequenced: extend STORY-85's in-scope list with the binding rule + `mountInL1` and STORY-83's with the render-time mount (Finding 3), **then** author ACs under STORY-85 for page-level binding (bound-by-name + each rejection with its path) and `mountInL1`, and under STORY-83 for the mount. **Relink the 10 existing tests** by renaming them to `test_UAT_AC<n>_*` rather than writing fresh ones |
| 5 | violation | uat | AC-1012 (`acceptance_criterion-c9bec9a2`) | uat-edit | **Third cycle**, re-read line by line. Two gaps in `test_UAT_AC1012_*` (`reconciliation-nowrap-width-floor.test.ts:428`). **(a)** The measurement arm — the AC's actual criterion, *measured bounding boxes* — sits behind a bare `if (!HAVE_CHROMIUM) return` at `:460`, an early return, so without chromium the test reports **pass**, not skip. What runs unconditionally is a stylesheet-equality proxy (`strip()` at `:453-459` removes width declarations and compares the rest): a good argument, but not the criterion. **(b)** The AC's second Verification clause — "the same document's round-trip **fidelity against the original capture** is unchanged" — is exercised by **no arm at all**. The fixture is a synthetic `multi(LADDER.map(…))` document built inline at `:429-439` with no original capture to compare against; the only occurrence of *fidelity* in the file is a comment at `:474`. The clause is unreachable as written. This is the one AC in the capability whose verdict moved `pass → fail` | Either (i) add a fidelity assertion against a real folded capture — the shape `test_UAT_AC683_*` already uses — and split the browser arm into a separate `it.runIf(HAVE_CHROMIUM)` test so an unexercised arm reports as **skipped**; or (ii) narrow AC-1012's Verification to drop the fidelity clause and state the stylesheet-equality proxy as the engine-free arm. Resolve alongside Warning 4 — same file, same gate |
| 6 | warning | ac | AC-719 (`acceptance_criterion-da7c62ec`) | ac-edit | The criterion still grants an L1 leaf's colour "a literal **(or a named overlay role)**". REQ-114 deleted the closed colour-role vocabulary outright; the overlay is now a free-form kebab-case palette reference (`packages/site-schema/src/l1/palette.ts:55-60`). Siblings AC-935 and AC-928 assert the opposite *as criteria*. **Warning, not violation, and NOT deprecated**: unlike AC-718 the criterion's substance is live and `test_UAT_AC719_*` proves it substantively — real `registry` (exactly `['carousel@3','contact-form@4']`), real `validateL1` + `renderL1Document`, frosted veil `#f8fafccc` emitted, no hairline border, verbatim footer copyright, departing link/text colours, and both envelope rejections | Replace "(or a named overlay role)" with "(or a palette reference)". The identical clause appears twice in STORY-82's body — move all three together with Finding 1. **Note the divergence**: today's ac-level cycle (`report-d0196843` finding 4) recommends deprecating AC-719 too, on *exclusivity* grounds (a corrected AC-719 would duplicate AC-716/AC-928). That is a real concern but not a coverage one — on coverage AC-719 passes. The operator should settle exclusivity at the ac level; I have deliberately not deprecated it here |
| 7 | warning | uat | AC-702 (`test_UAT_AC702_*`, `reconciliation-behavior-modules.test.ts:556`) | uat-edit | **Third cycle.** The negative arm mocks an **internal** module — `vi.doMock('../packages/framework/src/index', …)` overriding `getModuleClientJs` to `() => ''` — to prove "no client behaviour in the catalog ⇒ no asset and no script reference". TEST-STRATEGY forbids mocking internal components. **Warning, not violation**: the positive arm runs the entire real pipeline (`cmdNew` + `cmdRender`, real catalog, real filesystem) and carries every substantive claim; the test guards vacuity at `:574` with `expect(getModuleClientJs().length).toBeGreaterThan(0)`; and `cmdRender(slug, opts)` accepts no catalog injection, so there is no unmocked route to the empty-catalog branch. This is the **only** internal mock among the capability's 100 UATs | Add a resolver/catalog seam to the render path mirroring `assertModuleConforms`'s `resolveModule` and drop the mock — or record in AC-702 that the empty-catalog arm is proven against a substituted catalog by construction. Low urgency: no claim is currently unproven. *(The `capabilities.js` filename this test asserts is **not** REQ-87 residue — AC-702 pins it deliberately as a plural bundle-output filename. Do not "fix" it.)* |
| 8 | warning | uat | AC-1009 (`:228`) and AC-1011 (`:410`), `reconciliation-nowrap-width-floor.test.ts` | uat-edit | Same silent-gate pattern as Finding 5(a) at two more sites, both still bare `if (!HAVE_CHROMIUM) return`. **Warning rather than violation** because I verified both engine-free arms are substantive and prove each criterion's main clause directly: AC-1009 asserts the captured value survives as `min-width: 686px` with no hard width, that a wrapping run gains no floor, and that a `control` leaf relaxes on identical terms via `renderL1Fragment`; AC-1011 asserts the per-rung `width: auto` reset and an extrapolation guard proving the fixture discriminates. Contrast AC-683/AC-688, which use `it.runIf(...)` and report honestly as skipped | Convert all three sites to `it.runIf(HAVE_CHROMIUM)` on a separate browser-arm test, so an unrun arm is never reported as a pass |
| 9 | warning | ac | AC-685 (`acceptance_criterion-62adf959`) ¶1–¶2 | ac-edit (alt: code-issue) | **Fourth cycle.** AC-685 claims neutralisation "holds even for a value that bypassed validation" and that a structured axis reaches CSS re-derived from its numeric, **closed-enum** and hex fields. Closed-enum axes are still interpolated raw with no emit-time re-check (`render.ts:227` `font-style`, `:624` `mix-blend-mode`, `:676` `text-decoration-line`, `:2006` `list-style-type`, `:2089` `object-fit`); `grep -n cssEnum packages/framework/src/l1/render.ts` returns **0 hits**. `test_UAT_AC685_*` renders an unvalidated document — exactly the AC's premise — but carries payloads only in `text`, `alt`, `src` and `fontFamily`. **Exposure is bounded**: `validateL1` rejects an enum breakout and is genuinely in the production path, and **DOC-2 §2 enumerates the Layer-2 guarantees as text / colour / font-family / length / image-src — enums are not among them**, so policy and code agree and the AC over-claims. Logged here as a warning because the coverage that DOC-2 actually requires is present; today's uat-alignment cycle owns it as a violation | Narrow ¶1's "even if bypassed" claim to the families DOC-2 §2 guarantees at Layer 2 and drop "closed-enum" from ¶2's re-derivation list. **Decide before touching the test** — adding an enum payload would turn a green test red against behaviour policy does not require |
| 10 | warning | ac | AC-686 ¶2 and AC-687 ¶2 (`reconciliation-l1-substrate.test.ts:341`, `:451`) | ac-edit (do **not** uat-add) | Both ACs carry a second Verification clause neither test exercises. AC-686 asks for a representative violation repeated "as an authored page inside a site definition"; the test's only entry point is `validateL1` (`:342`). AC-687 asks that "every reported path is prefixed into that page's L1 body" (e.g. `/pages/0/l1/…`); the test asserts only bare `/widths/1`, `/root/children/0/axes/fontSizePx`, `/root/children/1/src`. **The behaviour is proven elsewhere** — I confirmed `reconciliation-l1-authoring-envelope.test.ts` asserts `/pages/0/l1/root/children/0/axes/fontSizePx` (`:103`), the multi-page `/pages/1/l1/…` case (`:125`) and `multiPaths.every(p => p.startsWith('/pages/1/l1/'))` (`:126`) — so this is an **attribution gap, not an evidence gap** | Do **not** write new tests; that would duplicate AC-849/AC-850. Delete the site-definition clause from AC-686's Verification and the page-prefix clause from AC-687's, cross-referencing AC-849/AC-850 which own them |
| 11 | warning | uat | AC-930 (`reconciliation-colour-palette-overlay.test.ts:277`) vs AC-942 (STORY-97, capability-b4ac88fc) | uat-edit (+ one-line ac-edit) | Both tests stage a site carrying one RGB at three opacities, run the real `cmdColors` then `cmdColorsAssign`, and assert collapse to one opaque entry. Cross-capability duplication. Held at warning: AC-930's own Verification *prescribes* the conversion drive, so the test is faithful to its AC and the redundancy is inherited from the AC pair; and AC-930's test carries real distinct content STORY-97's does not (the whole-byte-range exactness loop at `:332-337`, the opaque-reference case at `:340`) | Retarget `test_UAT_AC930_*` at the axis AC-930 uniquely owns — a reference carrying its own alpha resolves to the right literal, via `validateL1` + `resolveL1Color` at the load boundary, keeping the byte-range loop — and drop the `cmdColors`/`cmdColorsAssign` drive. Needs a matching one-line `ac-edit` because the AC currently mandates that drive |
| 12 | warning | story | STORY-80 (`story-c490f1cf`) | — (no edit now) | REQ-137 is `bundled` in BUNDLE-18, which was **`reconciling` as of this check** — imminent. It deletes `steps` from the palette entry, moves the light↔dark position onto the reference as a continuous Oklab `shade`, supersedes REQ-114 AC3's byte-identity with a bounded ≤8/255, and re-shapes the retrofit counts. STORY-80 still states an entry is "an opaque hex value plus optional named steps", and AC-928 still requires the `steps` map. **Warning, not violation**: `steps` is still live on this branch (`palette.ts:72`), so the matrix correctly describes the *enforced* state | No edit now — the repair point is BUNDLE-18's own reconciliation. If that lands without repointing STORY-80's entry shape, retrofit numbers and the superseded REQ-114 AC3 guarantee, this becomes a violation next cycle |
| 13 | warning | story | STORY-83 (`story-d0a8cfad`) | story-body-edit | Closing section describes STORY-81 as "(\"Responsive dials …\", CAP-68, **now archived**)". STORY-81 is live on CAP-70 with distinct REQ-104 behaviour and `uat_coverage: pass`. A reader following the pointer lands on a story the note says does not exist | Update the merge note: STORY-81's *pre-REQ-104* archived state is what AC-717's reassignment refers to; the story itself is active. Fold into the Finding 3 edit — same body |

## Notes for the Editor

**One intent accounts for three of the five violations.** REQ-93 reconciled on
2026-07-29, after the pivot bundle that last edited STORY-82 and before everything
since. Its clauses were split across capabilities and only the fold clause found a
home (CAP-71/STORY-84). Findings 1(c), 3 and 4 are the three orphaned clauses.
**This is one coordinated pass, not three unrelated edits**, and it has a natural
order: STORY-85's and STORY-83's bodies must admit the binding and the mount before
ACs can assert them, because an AC may not assert behaviour its story body denies.

**The cheapest violation to close is already 90% done.** Finding 4 needs no new test
authoring — `tests/req93-l1-slot-mounted-behaviors.test.ts` already carries 10
substantive UATs against the real page validator, the real renderer mount and the
real conformance harness. They are invisible to the matrix only because they are
named `test_UAT_FC_REQ-93_*`. Author the ACs, rename the tests to
`test_UAT_AC<n>_*`, and both the ac-level coverage gap and this one close together.

**Do not re-prescribe `ac-edit` for AC-718.** Four ac cycles prescribed it and
produced four no-ops; the reason is that a faithful edit yields a near-duplicate of
AC-701, so the edit has no destination. I have applied the deprecation at the field
level (`uat_coverage: deprecated`, `lifecycle: deprecated`) on the coverage ground
that every specific claim in the criterion was retired by REQ-96/REQ-87. What
remains for the editor is the prose half: preserve the supersession as provenance in
STORY-82's body. **AC-719 I deliberately left `pass`** — its substance is live and
well-tested, so on the coverage dimension it does not fail. If the operator wants it
deprecated it should be on the ac-level cycle's exclusivity reasoning (Finding 6),
which is a different question from whether it is covered.

**Greenness is not the signal here and cannot be, this cycle.** Every violation
above is about an assertion that is *absent* (Findings 5, 10), a gate that hides a
skip (Findings 5, 8), a body that contradicts shipped code (Findings 1, 3), or
evidence the matrix does not claim (Finding 4). The suite would stay green through
every one of these repairs — the last cycle that could execute ran fully green while
carrying six of the same findings. A fix loop that re-runs the suite and reports
success will not converge.

**Coverage itself is in good shape.** 100/100 ACs resolve to real tests at real
entry points, with exactly one internal mock in the whole capability and no
existence-only or source-text-only tests. Only **one** finding (Finding 5) is a true
`uat-edit` for missing evidence, and only **one** (Finding 4) requires new ACs. The
rest of this report is matrix prose lagging behind code that is already correct and
already tested.
