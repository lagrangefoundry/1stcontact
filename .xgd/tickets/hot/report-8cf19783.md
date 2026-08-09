---
uid: report-8cf19783
id: REPORT-1727
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=uat)'
created_by: xgd
created_at: '2026-08-09T04:51:35.907580+00:00'
updated_at: '2026-08-09T04:51:35.907580+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: uat
  violations: 2
  warnings: 5
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: uat

**Result**: FAIL
**Violations**: 2
**Warnings**: 5
**Needs review**: 0

Anchor report: report-69e94af9 · Capability: capability-ae9d65d6 (CAP-70) · Level: uat · Previous attempts: 6

Scope: **7 stories** (all `feature`/`upgrade`), **96 live ACs** — 94 `active`, 2 `pending`
(AC-718/AC-719 under STORY-82). Every one of the 96 has at least one matching
`test_UAT_AC<n>_*` test; **342 UAT test names in `tests/`, 342 unique** — no name collision.

**All 18 capability test files executed this cycle** (`npx vitest run` over the 18 files
carrying AC-linked UATs): **18/18 files passed, 96 tests passed, 2 skipped**
(AC-683, AC-688 — engine-gated via `it.runIf`, honestly reported), 2.93s.

**Nothing was repaired since attempt 5.** Every finding below was carried in
REPORT-1674 (`report-177a9552`) and each was re-verified against the current tree this
cycle; all remain present at the same file:line. The counts are identical to that
report except that its Findings 5 and 6 are retained as warnings and its 7 warnings
reduce to 5 here only because two of its entries (Info items) are not warnings.

At `uat` level the AC body is the working reference. Intent was consulted only for
AC-685, where the criterion asserts a Layer-2 property the emitter does not implement
(Finding 1) — i.e. the AC itself is suspicious, not the test.

## Cumulative Intent Considered

Every story and AC in this capability carries a **bundle** as its `intent_uid` /
`updated_by`. All six resolve to `free_and_reconciled`, so all count.

| Intent (bundle) | Status | Contains | Counts? |
|---|---|---|---|
| BUNDLE-6 `bundle-ab9e0cb6` | free_and_reconciled | REQ-58 + REQ-59 + REQ-62 + REQ-61 | YES |
| BUNDLE-7 `bundle-31e474b9` | free_and_reconciled | REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more (the framework pivot) | YES |
| BUNDLE-11 `bundle-ee56a66e` | free_and_reconciled | BUG-27 + REQ-94 + REQ-96 + REQ-97 + REQ-98 + 10 more | YES |
| BUNDLE-13 `bundle-e0143ffa` | free_and_reconciled | REQ-108 + REQ-109 + REQ-110 + REQ-111 + REQ-113 + 1 more | YES |
| BUNDLE-14 `bundle-0385746c` | free_and_reconciled | BUG-31 + REQ-114 + REQ-116 | YES |
| BUNDLE-16 `bundle-15c1f647` | free_and_reconciled | REQ-117 + REQ-115 + REQ-44 | YES |

No retired or abandoned intent contributes to this capability's live tree. The
REQ-84 / REQ-85 module-dial retirement is **already fully absorbed**: the 21 ACs that
described the deleted colour/length/radius and per-module dials (AC-660…AC-681) and
AC-717 are **archived**, not live, and the modules themselves are gone from the tree
(`services-grid`/`hero`/`header`/`footer`/`text-block`/`layer` directories: 0 found;
`cardVeil`/`cardBorder`/`fieldLabels`/`submitInline`/`navCollapse`: 0 references in
`packages/`). See Notes for the Editor — this is a trap for automated scans.

## Alignment Ledger

One row per test file (the unit at which these UATs are organised). All 18 files reach
real entry points — `validateL1`, `renderL1Document` / `renderL1Fragment` /
`renderL1Page`, `validateBehaviorConfig` / `Slots` / `Controls` / `Instance`, the real
Astro SSR container, the real `cmdNew` / `cmdRender` / `cmdColors` / `cmdColorsAssign`
commands against the real filesystem, `foldToL1`, and JSDOM browsing contexts.
**No test stands on a structural/AST stand-in where a behavioural probe belongs.**

| Test file (ACs) | Intents aligned to | Outcome |
|---|---|---|
| `reconciliation-l1-substrate` (682–688, 723) | BUNDLE-7 | aligned · pass; 683 + 688 skipped (engine-gated, honest); **686 ¶2 / 687 ¶2 unexercised (Finding 5)**; **685 ¶1 over-claims (Finding 1)** |
| `reconciliation-l1-language` (725–728) | BUNDLE-7 | aligned · pass |
| `reconciliation-l1-shared-axis-groups` (685 ¶2, 801–805) | BUNDLE-7, BUNDLE-11 | aligned · pass |
| `reconciliation-l1-control-and-texture` (806, 807, 829–832) | BUNDLE-11 | aligned · pass |
| `reconciliation-l1-authoring-envelope` (849–851) | BUNDLE-11 | aligned · pass |
| `reconciliation-l1-relocatable-output` (888–891) | BUNDLE-13 | aligned · pass |
| `reconciliation-l1-one-colour-system` (933–936) | BUNDLE-14 | aligned · pass |
| `reconciliation-colour-palette-overlay` (928–932) | BUNDLE-14 | aligned · pass; **930 + 932 duplicate STORY-97 (Findings 4, 5)** |
| `reconciliation-absolute-value-literals` (716) | BUNDLE-7 | aligned · pass |
| `reconciliation-responsive-layout-track` (833–838) | BUNDLE-11 | aligned · pass |
| `reconciliation-nowrap-width-floor` (1009–1012) | BUNDLE-16 | **1012 browser arm silent-skipped + fidelity clause unproven (Finding 2)**; 1009 + 1011 same silent gate (Finding 3) |
| `reconciliation-behavior-modules` (697–704, 722, 809, 810) | BUNDLE-7, BUNDLE-11 | aligned · pass; **702 mocks an internal module (Finding 6)** |
| `reconciliation-behavior-l1-composition` (808, 811) | BUNDLE-11 | aligned · pass |
| `reconciliation-contact-form-enhancement-gate` (877, 878) | BUNDLE-11 | aligned · pass (DOM-API spy is an external boundary — permitted) |
| `reconciliation-reproduction-treatments` (718, 719) | BUNDLE-7 | aligned · pass (both `pending`, both nonetheless covered) |
| `reconciliation-l1-interaction-and-motion` (819–828) | BUNDLE-13 | aligned · pass |
| `reconciliation-l1-pointer-accent` (879–887) | BUNDLE-13 | aligned · pass |
| `reconciliation-l1-navigation` (839–848) | BUNDLE-11 | aligned · pass |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-685 `acceptance_criterion-62adf959` ¶1 vs `packages/framework/src/l1/render.ts:406` | ac-edit (alt: code-issue) | **Unrepaired from REPORT-1316 F2 and REPORT-1674 F1 — now independently re-executed this cycle.** AC-685 ¶1 claims "This holds even for a value that bypassed validation — the emitter is the last line of defence." Closed-enum axes are still interpolated raw with no emit-time re-check: `render.ts:406` (`${w} ${style} ${c}`), `:226` `font-style`, `:523` `mix-blend-mode`, `:575` + `:1895` `text-decoration-line`, `:1876` `text-align`, `:1891` `text-transform`, `:1892` `font-style`, `:1905` `list-style-type`, `:1988` `object-fit`. No `cssEnum`-style guard exists anywhere in the file (grep: 0 hits). I rendered an unvalidated document with `border.style = 'solid; } body { display: none } .pwn {'` through the real `renderL1Document` and the emitter produced `.l1-0 { border: 2px solid; } body { display: none } .pwn { #ff0000; position: relative }` — the rule closed and `body { display: none }` is live CSS. `test_UAT_AC685_text_url_alt_and_fontfamily_payloads_are_neutralised` renders unvalidated documents (exactly this premise) but carries no enum payload, so the AC's strongest sentence is asserted only over the families that are actually protected. **Exposure is bounded**: I confirmed `validateL1` rejects the same document (`ok === false`), and Layer 1 is genuinely in the production path, so no shipped site is at risk. DOC-2 §2 enumerates the Layer-2 guarantees as text / colour / font-family / length / image-src — **enums are not among them** — so policy and code agree and the AC over-claims | Narrow AC-685 ¶1's "no value / even if bypassed" claim to the value families DOC-2 §2 guarantees at Layer 2, keeping closed enums a Layer-1 (schema) guarantee. If the operator prefers the stronger reading, this becomes a `code-issue`: re-check each enum against its closed set at emit time, the same shape as `cssColor`. **Decide this before touching the test** — it determines whether `test_UAT_AC685_*` must gain an enum payload case |
| 2 | violation | coverage | `test_UAT_AC1012_unedited_page_lays_out_identically_whether_the_run_is_floored_or_fixed` (`tests/reconciliation-nowrap-width-floor.test.ts:426`) | uat-edit | **Unrepaired from REPORT-1674 F2.** AC-1012's Verification is entirely browser-based and adds "…**and that the same document's round-trip fidelity against the original capture is unchanged**." Two gaps, both re-confirmed. (a) The measurement arm still sits behind `if (!HAVE_CHROMIUM) return` (`:460`) and did **not** run this cycle — yet the test reports **pass**, not skip, so the green result overstates what was proven. What executed is a stylesheet-equality proxy (`strip()` removes width declarations and compares the rest) — a good argument, not the AC's criterion. (b) The **round-trip fidelity clause is exercised by no arm at all**: grep for `fidelity` / `roundTrip` / `Type-A` in the file returns a single comment at `:474` and nothing else, and the fixture is a synthetic `multi(LADDER.map(…))` document with no original capture to compare against, so the clause is unreachable as written | Either add a fidelity assertion against a real folded capture (the shape `test_UAT_AC683_*` uses) and convert the browser gate to `it.runIf(HAVE_CHROMIUM)` so an unexercised arm reports as skipped; or narrow AC-1012's Verification to drop the fidelity clause and state the stylesheet-equality proxy as the engine-free arm. Resolve alongside Finding 3 — same file, same gating pattern |
| 3 | warning | consistency | `test_UAT_AC1009_*` (`tests/reconciliation-nowrap-width-floor.test.ts:228`) and `test_UAT_AC1011_*` (`:410`) | uat-edit | **Unrepaired from REPORT-1674 F3.** Same silent-gate pattern at two more sites — both still `if (!HAVE_CHROMIUM) return`, both arms returned early this cycle, and both tests reported **pass**. Unlike Finding 2 the engine-free arms here are substantive and directly prove the criterion's main clause (per-rung `min-width` with `width: auto` reset, threshold gating, extrapolation guard), which is why this is a warning. The contrast: AC-683/AC-688 use `it.runIf(...)` and correctly surface as **skipped**, so the runner reports honestly; `if (!HAVE_CHROMIUM) return` does not | Convert all three sites to `it.runIf(HAVE_CHROMIUM)` on a separate browser-arm test (or split each UAT into an engine-free and an engine-gated half) so an unrun arm is never reported as a pass |
| 4 | warning | exclusivity | `test_UAT_AC930_one_rgb_at_several_alphas_collapses_to_one_entry_exactly` (`tests/reconciliation-colour-palette-overlay.test.ts:277`) vs `test_UAT_AC942_one_rgb_at_three_opacities_becomes_one_entry` (`tests/reconciliation-colour-census-and-retrofit.test.ts:404`, STORY-97 `story-5e7eb0c5`, capability-b4ac88fc) | uat-deprecate (conditional) | **Unrepaired from REPORT-1674 F5; both tests still present.** The same scenario in the same shape, cross-capability. Both stage a site carrying one RGB at three opacities, run `cmdColors` then `cmdColorsAssign`, and assert: three literals collapse to exactly one palette entry, every stored entry value and step is an opaque `#rrggbb`, and each written reference resolves back to the translucent literal it replaced. AC-930's only distinct content is that it authors its own fixture rather than seeding from `xgd`. Uat-level shadow of REPORT-1670 F5 | Retarget `test_UAT_AC930_*` at the axis the AC actually owns — a reference carrying its own alpha resolves to the right literal, asserted through `validateL1` + the load boundary — and drop the census/assign drive, leaving the conversion to STORY-97 |
| 5 | warning | exclusivity | `test_UAT_AC932_retrofit_shrinks_the_palette_materially_and_paints_the_same_colours` (`tests/reconciliation-colour-palette-overlay.test.ts:467`) vs `test_UAT_AC941_*` (`:331`) / `test_UAT_AC944_*` (`:506`) in `reconciliation-colour-census-and-retrofit.test.ts` (STORY-97 `story-5e7eb0c5`) | uat-deprecate (conditional) | **Unrepaired from REPORT-1674 F6; all three tests still present.** AC-932's UAT drives the retrofit conversion end to end (`cmdColors` + `cmdColorsAssign` over the two staged sites, before/after painted-colour multiset equality, opaque-entry check). STORY-97's AC-941 owns "the retrofit writes a palette and reports before/after counts" and AC-944 owns "moves no pixel: the site renders byte-identically". The assertions differ in instrument (painted-colour multiset vs byte-identical render) but prove the same conversion property in the same shape, on the same command | Conditional on the AC-932 deprecation decision (REPORT-1670 F5). If taken, retire this UAT and keep STORY-97's; if declined, reduce it to the value-model claim (the entry is the unit of colour change, palette is optional) with no conversion drive |
| 6 | warning | consistency | `test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset` (`tests/reconciliation-behavior-modules.test.ts:556`) | uat-edit | **Unrepaired from REPORT-1316 F3 and REPORT-1674 F4.** The negative arm still mocks an **internal** module — `vi.doMock('../packages/framework/src/index', …)` at `:556` — to prove "no client behaviour in the catalog ⇒ no asset and no script reference". TEST-STRATEGY forbids mocking internal components. Mitigating, unchanged: the positive arm runs the entire real pipeline (`cmdNew` + `cmdRender`, real catalog, real filesystem) and carries every substantive claim; the test guards vacuity with `expect(getModuleClientJs().length).toBeGreaterThan(0)`; and `cmdRender(slug, opts)` still accepts no catalog/resolver injection, so there is no unmocked route. This is the **only** internal mock in the capability's 96 UATs — the `vi.spyOn(mounted.form, 'getAttribute')` in `reconciliation-contact-form-enhancement-gate.test.ts` fakes a DOM API (external boundary), which the strategy permits | Add a resolver/catalog seam to the render path mirroring `assertModuleConforms`'s `resolveModule` and drop the mock, or record in AC-702 that the empty-catalog arm is proven against a substituted catalog by construction. Low urgency — no claim is currently unproven |
| 7 | warning | coverage | `test_UAT_AC686_envelope_boundary_is_the_range_not_the_property` (`tests/reconciliation-l1-substrate.test.ts:341`) and `test_UAT_AC687_multiple_violations_all_reported_with_path_and_message` (`:451`) | uat-edit (defer to ac-edit) | **Unrepaired from REPORT-1674 F7.** Both ACs carry a second Verification clause neither test exercises, re-confirmed by inspection this cycle. AC-686 ¶2 asks for the violation repeated "as an **authored page inside a site definition**"; the test's only entry point is `const accepts = (doc) => validateL1(doc).ok` (`:342`) — standalone `validateL1`, no `validateSite`, across all its rejection cases. AC-687 ¶2 asks that "every reported path is prefixed into that page's L1 body"; the test asserts only bare `/widths/1`, `/root/children/0/axes/fontSizePx`, `/root/children/1/src`. **The behaviour is proven elsewhere** — `test_UAT_AC849_*` asserts `/pages/0/l1/…`, the multi-page case `/pages/1/l1/…`, and `multiPaths.every(p => p.startsWith('/pages/1/l1/'))` — so this is an attribution gap, not an evidence gap, which is why it is a warning | Do **not** write new tests. Take REPORT-1670 F7's `ac-edit` — delete the site-definition clause from AC-686 (and the equivalent from AC-687), cross-referencing AC-849/AC-850, which own it |

## Notes for the Editor

**1. Six attempts have not moved these findings.** Findings 1, 6 and 7 date to
REPORT-1316 (2026-08-05); Findings 2–5 to REPORT-1674. Every one was re-verified
against the working tree this cycle at the exact file:line cited, and every one is
still present. The test suite is green (18/18 files, 96 passed, 2 skipped) and will
stay green through all seven repairs — **greenness is not the signal here**, so a fix
loop that only re-runs the suite will keep reporting success without converging. Five
of the seven are matrix/test-text edits (`ac-edit` / `uat-edit`); only Finding 1 has a
branch that touches production code, and that branch is explicitly the operator's call.

**2. Finding 1 needs an operator decision before any test edit.** It is the one finding
where the AC and the code genuinely disagree, and DOC-2 §2 sides with the code. Editing
`test_UAT_AC685_*` to add an enum payload would turn a green test red against behaviour
that policy does not require. Narrow the AC first, or accept the `code-issue` reading
and add the emit-time enum guard — but decide before touching either.

**3. Archived ACs are a live trap for this capability.** A filesystem scan of
`.xgd/tickets/**` returns **118** ACs for these 7 stories; **22 of them are archived**
(`AC-660`…`AC-681`, `AC-717`) and only **96 are live**. The archived set is precisely the
module-dial ACs that REQ-84 ("delete ~20 layout-only dials, DELETE ~19 pure-layout
tests") and REQ-85 retired, and `git log -S` confirms their tests were removed by
`47aba3435` ("strip semantic layout modules") and `d37af07ca` ("reframe carousel +
contact-form"). A scan that misses the `archived/` split will report ~21 ACs with no UAT
and propose `uat-add` for behaviour whose implementation no longer exists — an
unsatisfiable instruction. **The retirement is already correctly recorded; do not
re-open it.** Use `xgd ticket list/query` (which excludes archived by default), not a
raw file walk.

**4. Environment note for the next runner.** The ticket index on the canonical store was
under continuous lock contention this cycle from concurrent dispatcher/dashboard
processes (`index_fcntl_lock: timed out after 30000ms` on both `__hot_index__` and
`__cold_index__`), so `xgd ticket list` / `query` / `reports` were unusable for most of
the run; `xgd ticket get <uid>` was unaffected. The story/AC tree here was enumerated
through the sanctioned `xgd_source.core.ticketing` module
(`get_canonical_tickets_dir` + `parse_ticket`), which is index-free — and that is what
surfaced the archived-AC split in note 3.
