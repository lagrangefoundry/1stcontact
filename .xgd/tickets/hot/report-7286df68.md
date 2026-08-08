---
uid: report-7286df68
id: REPORT-1679
type: report
title: 'UAT Coverage: Framework Substrate: L1 Layout, Values & Behavior Modules'
created_by: xgd
created_at: '2026-08-08T00:46:29.079230+00:00'
updated_at: '2026-08-08T00:46:29.079230+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ae9d65d6
  violations: 6
  warnings: 8
  needs_review_count: 0
---

# UAT Coverage Assessment: Framework Substrate: L1 Layout, Values & Behavior Modules

**Result**: FAIL
**AC verdicts**: 92 pass, 4 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 4 pass, 2 fail, 1 stale, 0 needs_review
**Capability verdict**: fail

Anchor report: report-17a279f7 · Capability: capability-ae9d65d6 (CAP-70) · Previous attempts: 4

## What was executed this cycle

**All 18 AC-bearing test files were run** (`npx vitest run` over them):
**96 passed, 2 skipped (98 total)**, 18/18 files green, 2.16s. The two skips are
AC-683 and AC-688 — both `it.runIf(engineAvailable())`, and no Playwright engine
launches in this worktree.

**All 96 ACs across the 7 stories carry at least one `test_UAT_AC<n>_*` test**
(AC-685 carries two, one per criterion paragraph). No AC is unnamed.

**72 of the 96 ACs have never been through a uat_coverage cycle** — REPORT-1317
(2026-08-05) saw 24. The 2026-08-06 matrix rebuild added STORY-90 and STORY-91
whole and grew STORY-83 from 15 ACs to 38.

Three claims below were verified by direct execution in this worktree rather than
carried over from the alignment cycle:
- the AC-685 enum breakout was **reproduced** (see violation 1);
- the AC-1012 / AC-1009 / AC-1011 browser gate was read in source at
  `tests/reconciliation-nowrap-width-floor.test.ts:410,460`;
- `tests/req93-l1-slot-mounted-behaviors.test.ts` was found to hold **ten
  substantive `test_UAT_FC_REQ-93_*` tests**, which changes the character of the
  REQ-93 gap (violation 5) from an evidence gap to an attribution gap.

Scanned all 18 files for the two disqualifying evidence shapes. **No structural
test** (reading source text to assert a name appears) stands where a behavioural
probe belongs. **One internal mock** in 97 UATs (warning 3); the single
`vi.spyOn` in `reconciliation-contact-form-enhancement-gate.test.ts` fakes a DOM
API, which TEST-STRATEGY permits as an external boundary.

## Cumulative Intent Considered

Every story carries a **bundle** as `intent_uid`. All six bundles resolve
`free_and_reconciled`, so all count. Every REQ status below was re-verified by
`xgd ticket get` this cycle.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-58/59/61/62 (BUNDLE-6) | free_and_reconciled | 2026-07-17 | Expression audit / gradient / responsive-diff — originating delivery for STORY-80/81/82 | YES (delivery superseded) |
| REQ-67, REQ-68 | free_and_reconciled | 2026-07-18 | contact-form field dials; footer `copyrightOpacity` — origin of STORY-82's archived AC-674…681 | YES (retired by REQ-84/85) |
| REQ-79 | free_and_reconciled | 2026-07-19 | Framework pivot: L1 substrate + module contract | YES |
| REQ-82 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | L1 schema, sole safe renderer, envelope validator | YES |
| REQ-84 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | **Retired** header/hero/footer/text-block/services-grid/layer + ~20 dials | YES (retires) |
| REQ-85 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | Module contract; reframed carousel & contact-form | YES |
| REQ-87 | free_and_reconciled | 2026-07-21 | **Retired** the `Capability*` runtime type → `Behavior*`, atomic, no alias | YES (retires) |
| REQ-90, REQ-91 | free_and_reconciled | 2026-07-23 | Font resource table + `@font-face`; typed pixel-mover axes | YES |
| REQ-93 | free_and_reconciled | 2026-07-25 | **A page binds behavior-module instances to L1 slots; renderer mounts the fragment into the seam** | YES — **violation 5** |
| REQ-96 (BUNDLE-11) | free_and_reconciled | 2026-07-26 | `control` leaf; deleted `config.view`; **replaced contact-form's `intro`/`submit` slots with one required `form` slot** | YES (retires) |
| REQ-97, REQ-98, REQ-103, REQ-105 | free_and_reconciled | 2026-07-26/27 | Text measure; uniform shared surface group; texture/radial; sizable slot | YES |
| REQ-99, REQ-100 | free_and_reconciled | 2026-07-26 | Typed hover/focus state; typed scroll-reveal + stagger | YES (STORY-90) |
| REQ-104 | free_and_reconciled | 2026-07-27 | Per-width **layout mode** track + wrapping row | YES — **revives STORY-81** |
| REQ-106 | free_and_reconciled | 2026-07-27 | Typed link role + DOM id emission | YES (STORY-91) |
| REQ-107 | free_and_reconciled | 2026-07-27 | Envelope validator wired to the authoring path | YES |
| BUG-28 | free_and_reconciled | 2026-07-27 | contact-form enhancement must not cancel a baseline it cannot complete | YES |
| REQ-108 (BUNDLE-13) | free_and_reconciled | 2026-07-29 | Pointer-reactive texture accent | YES |
| REQ-109 + BUG-30 (BUNDLE-13) | free_and_reconciled | 2026-07-30/31 | Relocatable document-relative URL emission | YES |
| REQ-114 (BUNDLE-14) | free_and_reconciled | 2026-07-31 | L1 palette colour model; **retired the closed colour-role vocabulary** | YES (retires) |
| REQ-116 (BUNDLE-14) | free_and_reconciled | 2026-07-31 | Edit render — settled-state carve-out on the module contract | YES |
| REQ-117 (BUNDLE-16) | free_and_reconciled | 2026-07-31 | Copy editing — surfaced the nowrap captured-width floor | YES |
| REQ-69, REQ-80 | abandoned | 2026-07-18/19 | services-grid raw card dials; Elementor band backgrounds | NO |
| REQ-17, REQ-43 | draft | 2026-07-02/03 | Bespoke-module lifecycle; module-contract template | NO |

**No AC in this capability describes behaviour a later reconciled intent retired
outright**, so there are zero `deprecated` verdicts. Three intents retire things
(REQ-84, REQ-87, REQ-96, REQ-114) and each retirement lands *inside* an otherwise
active AC or story body as a stale clause — which is why the drift shows up as
`fail` / `stale`, not as deprecation.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-83 `story-d0a8cfad` (38 ACs) | REQ-79, 82, 87, 90, 91, 96, 97, 98, 103, 105, 107, 109, BUG-30, 114, 117 | **fail** | Body aligned; two ACs fail coverage (AC-685 ¶1, AC-1012) and the "Merged from STORY-81" note is now false (warning 8) |
| STORY-85 `story-179b8c06` (15 ACs) | REQ-85, 87, 96, 116, BUG-28 | **fail** | All 15 ACs covered; body is **incomplete** — REQ-93's page-level binding is described by no story (violation 5) |
| STORY-80 `story-c490f1cf` (6 ACs) | REQ-58/59/61/62 (superseded), 79, 84, 114 | pass | All six covered by executed tests against real entry points |
| STORY-90 `story-d2b5cb1c` (19 ACs) | REQ-99, 100, 108 | pass | All 19 executed against `validateL1` / `renderL1Document` / `L1_POINTER_SCRIPT` in JSDOM; no mocks in either file |
| STORY-91 `story-2e4e2c45` (10 ACs) | REQ-106 | pass | All 10 executed; JSDOM browsing-context drive, no mocks |
| STORY-81 `story-3569e1a4` (6 ACs) | REQ-58…62 (deleted), 79, 84, **104** | pass | Revived by REQ-104 with distinct behaviour; all 6 covered, real `cmdNew`/`cmdRender` + `evaluateLayout`. **Was `needs_review` from the cycle when it held no ACs — corrected to `pass`** |
| STORY-82 `story-46e3b3c7` (2 ACs) | REQ-67, 68 (retired), 79, 84, 85 | **stale** | Body predates REQ-87, REQ-96 and REQ-114; both its ACs fail coverage as a consequence |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | ac/uat | AC-685 `acceptance_criterion-62adf959` ¶1 | ac-edit (alt: code-issue) | **Third consecutive cycle; demonstrated again by execution this cycle.** ¶1 claims "No value carried by an L1 document can produce executable code… This holds even for a value that bypassed validation — the emitter is the last line of defence." Closed-enum axes have **no emit-time guard**: `packages/framework/src/l1/render.ts` has `cssColor()` at `:78` but no `cssEnum` equivalent, and enums interpolate raw at `:505` (`border`), `:523` (`mix-blend-mode`), `:575`/`:1895` (`text-decoration-line`), `:1905` (`list-style-type`), `:1988` (`object-fit`). I rendered an unvalidated document with `border.style = 'solid; } body { display: none } .pwn {'` through `renderL1Document` and asserted the emitted CSS **contains** `body { display: none }` — the assertion passed. Both AC-685 tests pass because neither carries an enum payload, so the AC's strongest sentence is proven only over the families that are actually protected. **Exposure is bounded**: `validateL1` rejects the same document and Layer 1 is in the production path. DOC-2 §2 enumerates the Layer-2 guarantees as text / colour / font-family / length / image-src — enums are not among them, so policy and code agree and the AC over-claims | Narrow ¶1's "even if bypassed" clause to the DOC-2 §2 families, keeping closed enums a Layer-1 (schema) guarantee. If the operator prefers the stronger reading this becomes a `code-issue` — add a `cssEnum` re-check shaped like `cssColor` — and `test_UAT_AC685_*` must then gain an enum payload case. **Decide the AC before touching the test** |
| 2 | violation | uat | AC-1012 `acceptance_criterion-c9bec9a2` / `tests/reconciliation-nowrap-width-floor.test.ts:426` | uat-edit | AC-1012's criterion is **entirely** a browser measurement: "measure every node's bounding box at each width on the ladder, with the run widths floored and with them held fixed… the two sets of boxes are identical… **and that the same document's round-trip fidelity against the original capture is unchanged**." Two gaps. (a) The whole measurement arm sits behind `if (!HAVE_CHROMIUM) return` (`:460`) and did not run — yet the test reports **pass**, not skip, so the green result overstates what was proven. What executed is a stylesheet-equality proxy (`strip()` removes width declarations and compares the rest). (b) The **round-trip fidelity clause has no arm at all** — the fixture is a synthetic `multi(LADDER.map(…))` document with no original capture to compare against, so the clause is unreachable as written | Add a fidelity assertion against a real folded capture (the shape `test_UAT_AC683_*` uses) and convert the browser gate to `it.runIf(HAVE_CHROMIUM)` so an unexercised arm reports as **skipped**; or narrow AC-1012's Verification to drop the fidelity clause and state the stylesheet-equality proxy as the engine-free arm. Resolve with warning 2 — same file, same gate |
| 3 | violation | ac | AC-718 `acceptance_criterion-f3328e22` (STORY-82) | ac-edit | The AC as written is not what any test proves, because two of its clauses describe behaviour REQ-96 retired. It says "`submit`/`intro` are declared L1 slots" and "the submit button's appearance… mounted into the capability's named `submit` slot"; `packages/framework/src/modules/contact-form/meta.ts:57-60` declares `slots: { form: { required: true } }` and `:62-77` makes `submit` a **control**. It says `config` carries only `action`/`fields`/`successMessage`; `meta.ts:55` adds `submitLabel` and `:47` adds `fields[].labelMode`. Its Verification says "Inspect the contact-form **capability meta**" — REQ-87 removed that symbol family, and sibling AC-722 asserts its absence as a criterion. `test_UAT_AC718_*` is **ahead of its AC** and asserts the current shape correctly, so the fix is entirely on the AC | Retitle to "…authored via behavior config + L1 slots, not module dials". Replace every runtime-type "capability" with behavior-module terms. Repoint the presentation clause to the single required `form` slot with `submit` as a `control` leaf. Restate the config set as `action`, `fields` (incl. `labelMode`), `successMessage`, `submitLabel`. No test change needed |
| 4 | violation | ac | AC-719 `acceptance_criterion-da7c62ec` (STORY-82) | ac-edit | The criterion grants an L1 leaf's colour "a literal **(or a named overlay role)**". REQ-114 deleted the closed colour-role vocabulary outright; the overlay is now a free-form kebab-case **palette reference** (`packages/site-schema/src/l1/palette.ts:56`). Two siblings assert the opposite as criteria — **AC-935** ("No closed colour-role vocabulary survives… no alias, no grandfathered spelling") and **AC-928** ("an arbitrary-size map of free-form kebab-case entry names"). `test_UAT_AC719_*` proves the L1 leaf-axis literals and nothing about a role, so the clause is uncovered *and* uncoverable. Second consecutive cycle at ac level (REPORT-1670 Finding 2), raised on the older grounds by REPORT-1315 before that | Replace "(or a named overlay role)" with "(or a palette reference)". The identical clause appears twice in STORY-82's body — move both together with violation 6 |
| 5 | violation | story/ac | STORY-85 `story-179b8c06` (+ cross-ref AC-723 `acceptance_criterion-8db8ef76` on STORY-83) | story-body-edit + ac-add | **REQ-93 is a whole reconciled intent with live code, ten passing FC tests, and no criterion anywhere in this capability.** The page-level binding rule is at `packages/site-schema/src/schema.ts:483-599` (`moduleInstance.slot` required on a page carrying `l1`, forbidden otherwise; `pageSchema.superRefine` rejects unbound / dangling / duplicated / double-bound seams with machine-readable paths) and the render-time mount at `packages/framework/src/l1/render.ts:1998-2014`. STORY-85's in-scope covers per-instance config/slot/control validation only; STORY-83's AC-723 pins the **inert placeholder** and now reads as the whole truth about a slot, which REQ-93 made it no longer. **This is an attribution gap, not an evidence gap** — `tests/req93-l1-slot-mounted-behaviors.test.ts` carries ten substantive `test_UAT_FC_REQ-93_*` tests covering binding, each rejection class with its path, the mounted fragment replacing the placeholder, and conformance of the mounted behavior. That makes the fix cheap: the ACs can be authored against evidence that already exists and passes | Under STORY-85: admit the page-level binding rule in the body's in-scope, then author one AC for the binding rule (bound-by-name + each rejection class with its path) and one for the render-time mount. Rename the corresponding `test_UAT_FC_REQ-93_*` tests to `test_UAT_AC<n>_*` rather than writing new ones. Under STORY-83: extend AC-723 with a sentence that the inert placeholder is what a seam renders when **no** module is bound |
| 6 | violation | story | STORY-82 `story-46e3b3c7` | story-body-edit | Body drifted against three reconciled intents. (a) REQ-87 — describes contact-form as a "**capability module**" with "**capability** config", "the **capability** validators" and "the **Capability Modules** story"; STORY-85 records that there is no back-compat alias for the pre-rename names. (b) REQ-96 — states "the submit button's appearance is authored as L1 mounted into the `submit` slot, decorative framing into the `intro` slot"; both slots were deleted. (c) REQ-114 — says L1 leaf colour is "a literal (or a named overlay role)" **twice**; the role vocabulary is gone. Raised at story level last cycle (REPORT-1668 Findings 1, 2, 8) and by REPORT-1317 before that, unrepaired | Replace the capability-module vocabulary with behavior-module terms and point at STORY-85; rewrite the contact-form paragraph to the required `form` slot + `control`-leaf model; replace both "named overlay role" occurrences with "palette reference". Apply in the **same pass** as violations 3 and 4 — repairing the body alone leaves the drift live where the ACs read it |
| 7 | warning | uat | AC-683 `acceptance_criterion-5787336a`, AC-688 `acceptance_criterion-18356eea` | environment | Both engine-gated probes **skipped** — `playwright@1.61.1` is installed under `tools/generate` but every engine fails to launch on a build mismatch (`~/Library/Caches/ms-playwright` holds `chromium_headless_shell-1234` / `webkit-2336` / `firefox-1538`; 1.61.1 demands `-1228` / `-2311` / `-1532`). Both test bodies are substantive and both ACs sanction a clean skip in their own Verification, so this is not matrix drift and no editor action fits — but the practical effect must not be lost: the capability's **headline round-trip gate** (`capture(render(L1)) ≈ L1`) and the **three-engine equivalence** contributed **zero executed evidence** this cycle, as they have for six cycles. They correctly report as `skipped` (`it.runIf`), unlike warning 2 | Not a matrix edit. Run `npx playwright install` in this worktree (or pin the regression runner to 1.61.1) before the capability is treated as regression-proven |
| 8 | warning | uat | AC-1009 (`tests/reconciliation-nowrap-width-floor.test.ts:228`), AC-1011 (`:410`) | uat-edit | Same silent-gate pattern as violation 2 at two more sites: both browser arms sit behind `if (!HAVE_CHROMIUM) return`, both returned early, and both tests reported **pass**. Unlike AC-1012 the engine-free arms here are substantive and prove the criterion's main clause directly (per-rung `min-width` with `width: auto` reset, threshold gating, and an explicit extrapolation guard asserting the low segment would have run past 2× the viewport) — which is why this is a warning | Convert all three sites to `it.runIf(HAVE_CHROMIUM)` on a separate browser-arm test so an unrun arm is never reported as a pass |
| 9 | warning | uat | AC-702 / `test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset` (`tests/reconciliation-behavior-modules.test.ts:556`) | uat-edit | **Unrepaired from REPORT-1316.** The negative arm mocks an **internal** module — `vi.doMock('../packages/framework/src/index', … getModuleClientJs: () => '')` — to prove "no client behaviour in the catalog ⇒ no asset and no script reference", which TEST-STRATEGY forbids. Mitigating: the positive arm runs the entire real pipeline (`cmdNew` + `cmdRender`, real catalog, real filesystem) and carries every substantive claim; the test guards vacuity with `expect(getModuleClientJs().length).toBeGreaterThan(0)`; and `cmdRender` accepts no catalog injection, so there is no unmocked route today. **This is the only internal mock in the capability's 97 UATs** | Add a resolver/catalog seam to the render path mirroring `assertModuleConforms`'s `resolveModule` and drop the mock, or record in AC-702 that the empty-catalog arm is proven against a substituted catalog by construction. Low urgency — no claim is currently unproven |
| 10 | warning | ac | AC-686 `acceptance_criterion-33ecc306` ¶2, AC-687 `acceptance_criterion-c9b3f600` ¶2 | ac-edit | Both carry a second Verification clause neither test exercises — AC-686: "Repeat a representative violation as an **authored page inside a site definition**…"; AC-687: "Submit the equivalent as a page inside a multi-page site definition and observe every reported path is prefixed into that page's L1 body." Their tests call standalone `validateL1` only. **The behaviour is proven** — `test_UAT_AC849_*` asserts `/pages/0/l1/root/children/0/axes/fontSizePx` and `multiPaths.every(p => p.startsWith('/pages/1/l1/'))` — so this is an attribution gap, not an evidence gap | Do **not** write new tests. Take REPORT-1670 Finding 7's `ac-edit`: trim the site-definition clause from AC-686 and AC-687, cross-referencing AC-849/AC-850 which own it |
| 11 | warning | ac | AC-716 `acceptance_criterion-1eaa93b8`, AC-930 `acceptance_criterion-bec4d585`, AC-932 `acceptance_criterion-9f1e7baf` (all STORY-80) | ac-edit / ac-deprecate | Three overlaps, all one shape — an older AC widened by a later intent without the newer, narrower AC prompting a trim. AC-716's colour bullet and closing paragraph restate AC-928 and AC-931; its distinct content is the length/geometry/radius literal-only base. AC-930's and AC-932's UATs both drive the **retrofit conversion** (`cmdColors` + `cmdColorsAssign`), which STORY-97 `story-5e7eb0c5` (capability-b4ac88fc) owns via AC-941…944; STORY-80's own body scopes the retrofit out ("its own capability"). All three tests execute and pass — coverage is not at risk; the cost is duplicate UATs | Narrow AC-716 to the absolute base and cross-reference AC-928/AC-931. Retarget AC-930's UAT at the reference/alpha round-trip it actually owns, dropping the census/assign drive. Deprecate AC-932 into STORY-97's AC-941…944, or reduce it to the value-model claim with no conversion drive |
| 12 | warning | uat | Test prose in `tests/reconciliation-reproduction-treatments.test.ts` (:9, :16, :34, and the `describe` title at :117) and `tests/reconciliation-absolute-value-literals.test.ts` (:2-3) | uat-edit | **Unrepaired for a third cycle**, re-verified in source this cycle. The first file still names the runtime type by its pre-REQ-87 name — "the contact-form **capability's** SSR render", "via **capability config** + named L1 slots", "the two survivor **capabilities**" — and the `describe` title "STORY-82 — contact-form presentation via **capability config** + L1 slots" prints verbatim in every vitest run, while sibling AC-722 requires that no `'capability'` discriminant survives anywhere. The second still names STORY-80 by its pre-consolidation title, "every colour, length, and radius **dial** accepts a literal **or a named overlay**". **Assertions in both files are correct**; comment and title text only | Sweep both docstrings and the `describe` title to behavior-module terms and repoint the second to STORY-80's current title. Apply with violations 3, 4 and 6 — the same vocabulary at four levels |
| 13 | warning | capability | CAP-70 `capability-ae9d65d6` (body) | capability-body-edit | The Scope section's four headings cover none of: interaction state / entrance motion / pointer accent (STORY-90, 19 ACs), the typed link role and in-page anchors (STORY-91, 10 ACs), or the per-width layout-mode track and wrapping row (STORY-81, 6 ACs). The body was written 2026-08-05, one day before STORY-90 and STORY-91 were created; 35 of the capability's 96 ACs now sit under stories the capability body does not mention. Raised at story level last cycle (REPORT-1668 Finding 4), unrepaired | Add a Scope subsection for the interaction/motion/pointer axes and one for navigation, and fold the layout-mode track into the L1 substrate subsection alongside the geometry keyframes |
| 14 | warning | story | STORY-83 `story-d0a8cfad` — "Merged from STORY-81 (overlap cluster 2 resolution)" section | story-body-edit | The section states STORY-81 is "**now archived**" and that its responsive intent "is re-homed here". REQ-104 (free_and_reconciled, 2026-07-27) revived STORY-81 with six live ACs (AC-833…838) expressing behaviour — the per-width **layout mode** — that STORY-83 does not carry and that its geometry keyframes cannot express. A reader following this note is sent to the wrong story | Rewrite the note: the per-width *value* variation is re-homed on STORY-83's geometry keyframes; the per-width *layout mode* is STORY-81's own, revived by REQ-104. `navCollapse` remains without a successor |

## Notes for the Editor

**One vocabulary sweep closes four findings.** Violations 3, 4 and 6 and warning
12 are the same two retired names — `capability` (REQ-87) and "named overlay
role" (REQ-114) — at the AC, story-body and test-prose levels. Fix them in a
single pass; repairing any one alone leaves the drift live where the next reader
looks. STORY-82's two ACs are the only two `pending` ACs in the capability and
sit under the only `stale` story. REPORT-1315, REPORT-1317, REPORT-1668 and
REPORT-1670 have each named them; this is the fifth report to do so.

**Violation 5 is the cheapest violation here and should be taken first.** REQ-93's
behaviour is already proven by ten passing `test_UAT_FC_REQ-93_*` tests — the
editor authors two ACs against evidence that exists and renames the tests. It is
sequenced after the STORY-85 body edit (the story must admit the behaviour before
an AC can be written against it), and it is the only thing standing between
STORY-85 and a `pass`.

**Violation 1 is the one that matters and it is now three cycles old.** It is a
documentation defect, not a live vulnerability — `validateL1` rejects the same
document and runs on every production path — but the AC currently promises a
Layer-2 guarantee the emitter does not provide, and a reader auditing the security
posture from the matrix would be misled. DOC-2 §2 already draws the correct line;
the AC should be brought to it. This is an operator decision (narrow the AC vs.
harden the emitter) and the test cannot be written until it is made.

**The browser gate is a reporting bug, not just a coverage one.** Three tests in
`reconciliation-nowrap-width-floor.test.ts` return early and report **pass**;
AC-683 and AC-688 use `it.runIf` and report **skipped**. The second shape tells
the truth. Until the three are converted, the suite's green count overstates what
ran — which is exactly how AC-1012 came to have a criterion no arm exercises.

**Nothing is wrong in the 72 ACs assessed here for the first time.** STORY-90's
19, STORY-91's 10, STORY-81's 6 and STORY-83's 23 additions all execute against
real entry points — `validateL1`, `renderL1Document` / `renderL1Fragment`,
`validateBehaviorConfig` / `Slots` / `Controls` / `Instance`, the real Astro SSR
container, real `cmdNew` / `cmdRender` / `cmdColors` against the real filesystem,
`foldToL1`, `evaluateLayout`, and JSDOM browsing contexts — with no internal
mocks and no structural stand-ins. All four violations and every warning sit in
ACs, stories or tests that predate this cycle's growth.
