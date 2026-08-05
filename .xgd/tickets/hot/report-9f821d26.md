---
uid: report-9f821d26
id: REPORT-1316
type: report
title: 'Capability-Intent Alignment: framework_substrate (level=uat)'
created_by: xgd
created_at: '2026-08-05T20:54:29.389284+00:00'
updated_at: '2026-08-05T20:54:29.389284+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: uat
  violations: 2
  warnings: 4
  needs_review_count: 0
---

# Capability-Intent Alignment: framework_substrate
# Level: uat

**Result**: FAIL
**Violations**: 2
**Warnings**: 4
**Needs review**: 0

Anchor report: report-31234d67 · Capability: capability-ae9d65d6 (CAP-70) · Level: uat · Previous attempts: 4

Scope: 4 active stories / 24 active-or-pending ACs (STORY-81 `story-3569e1a4` is
archived and holds no ACs). Every one of the 24 ACs has exactly one matching
`test_UAT_AC<n>_*` test — no AC is unnamed and no test name is duplicated.

**All 24 AC-linked UATs were executed this cycle** (`npx vitest run` over the five
files): **22 passed, 2 skipped** (AC-683, AC-688 — engine-gated, see Info 1).
Duration 2.27s, 5/5 files green.

At `uat` level the AC body is the working reference. Intent was consulted only
for AC-685, where the criterion asserts a property the emitter does not
implement (Finding 2) — i.e. where the AC itself is suspicious rather than the
test.

## Cumulative Intent Considered

Verified directly this cycle (`xgd ticket get`), not carried over from
REPORT-1314/1315; ordered by `created_at`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 `request-87b26bca` | free_and_reconciled | 2026-07-19 | Framework pivot: L1 substrate + module contract | YES |
| REQ-82 `request-11efc10f` | free_and_reconciled | 2026-07-20 | L1 schema + envelope validator + sole safe renderer (AC-682…688) | YES |
| REQ-84 `request-f243b6b9` | free_and_reconciled | 2026-07-20 | **Retired** the semantic layout modules + ~20 colour/length/radius dials | YES (retires) |
| REQ-85 `request-015e42ac` | free_and_reconciled | 2026-07-20 | Module contract + reframed carousel / contact-form (AC-697…704) | YES |
| REQ-87 `request-84af044b` | free_and_reconciled | 2026-07-21 | Rename capability-module → behavior module, atomic, no alias (AC-722/723) | YES |
| REQ-90 `request-bc4c1408` | free_and_reconciled | 2026-07-25 | L1 document-level font resource table (AC-727/728) | YES |
| REQ-91 `request-42385423` | free_and_reconciled | 2026-07-25 | Typed pixel-mover axes (AC-725/726) | YES |
| REQ-92 `request-7a6766b0` | free_and_reconciled | 2026-07-25 | Rebuild `foldToL1` to the full L1 language | YES (fold capability) |
| REQ-93 `request-f26cbe32` | free_and_reconciled | 2026-07-25 | L1 pages host behavior modules in slots (mounted render) | YES — but unimplemented on this branch; see Info 3 |

## Alignment Ledger

| Test (AC) | Exercises | Outcome |
|---|---|---|
| `test_UAT_AC682_*` | validator accept-path + every optional primitive, slot with/without `behavior` | aligned · pass |
| `test_UAT_AC683_*` | real-engine round-trip, zero Type-A deltas at 6 widths | aligned · **skipped** (Info 1) |
| `test_UAT_AC684_*` | interpolate `calc()` vs snap hold, multi-segment track, browser arm | aligned · pass (browser arm skipped) |
| `test_UAT_AC685_*` | text / alt / img-src / font-family payloads inert | **partial** — criterion ¶2 untested (Finding 1); ¶1 enum sub-claim unmet (Finding 2) |
| `test_UAT_AC686_*` | 12 envelope rejections + in-range control + legacy `capability` key rejected | aligned · pass |
| `test_UAT_AC687_*` | 3 simultaneous violations, path+message per entry | aligned · pass |
| `test_UAT_AC688_*` | 3-engine equivalence within calibrated tolerance | aligned · **skipped** (Info 1) |
| `test_UAT_AC723_*` | `data-l1-slot` always, `data-l1-behavior` only when declared, both escaped, no `data-l1-capability` | aligned · pass (pre-REQ-93 semantics — Info 3) |
| `test_UAT_AC725_*` | text/box/image/any-kind families as re-derived CSS; identity values omitted | aligned · pass |
| `test_UAT_AC726_*` | 14 structured-axis rejections with offending path + 7 extra-key forms + all-families control | aligned · pass |
| `test_UAT_AC727_*` | `@font-face` per entry, ordered ahead of use, unsafe entries dropped whole, braces balanced | aligned · pass (e2e arm skipped) |
| `test_UAT_AC728_*` | 4 scheme rejections + 2 weight rejections with paths + multi-entry pass + allowlist control | aligned · pass |
| `test_UAT_AC697_*` | `validateBehaviorConfig` over both survivors, 6 single-defect cases | aligned · pass |
| `test_UAT_AC698_*` | slot-as-L1 line, required/repeated/array-mismatch, instance union | aligned · pass |
| `test_UAT_AC699_*` | SSR snap track, one slide per L1 subtree, `view`/`controls`, no aesthetic dials | aligned · pass |
| `test_UAT_AC700_*` | opt-in markers, `advanceTrack`/`enhanceCarousel` with injected timer, 3 isolation arms | aligned · pass |
| `test_UAT_AC701_*` | post form, labelled controls, honeypot + Turnstile, slot vs baseline | aligned · pass |
| `test_UAT_AC702_*` | real `cmdNew`/`cmdRender` build, one asset, one script ref per page | aligned · pass — negative arm mocks an internal module (Finding 3) |
| `test_UAT_AC703_*` | degenerate fixtures on both survivors + throwing-core fixture flagged | aligned · pass |
| `test_UAT_AC704_*` | exactly the five obligations, no `except` | aligned · pass |
| `test_UAT_AC722_*` | `Behavior*` types + 3 validators from root, catalog discriminant, no alias, legacy path unresolvable | aligned · pass |
| `test_UAT_AC716_*` | literals emitted verbatim + 7 malformed rejections | aligned · pass — rejection arm overlaps AC-686 (Finding 5) |
| `test_UAT_AC718_*` | contact-form meta keys/slots, submit-slot L1 look vs plain baseline, labels in both | aligned · pass — overlaps AC-701 (Finding 4); prose residue (Finding 6) |
| `test_UAT_AC719_*` | catalog holds only the 2 survivors, frosted band + footer colour literals, envelope rejections | aligned · pass — prose residue (Finding 6) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | `test_UAT_AC685_text_url_alt_and_fontfamily_payloads_are_neutralised` (`tests/reconciliation-l1-substrate.test.ts:302`) | uat-edit | AC-685's criterion has **two** paragraphs. The test covers only ¶1 (text markup, alt breakout, image `src` scheme, font-family CSS breakout). ¶2 — added by REQ-90/REQ-91 and explicitly restated in the AC's own Verification step ("Repeat with payloads placed in a gradient stop, a border colour, a background-image URL, a mask/transform field, and a font-face family and source, and assert the emitted document contains no `</style>`, `@import`, `javascript:`, or `expression(`") — is exercised by **no AC-linked UAT**. AC-726's UAT is validator-only (Layer 1); `test_UAT_FC_REQ-91_no_raw_css_escapes_the_typed_sink` (`tests/req91-l1-pixel-mover-axes.test.ts:290`) renders only **well-formed** fixtures, so it is a clean-input control, not a payload probe; `test_UAT_FC_REQ-91_security_rejects_non_hex_and_freeform` (:109) asserts `validateL1(...).ok === false` and never calls the renderer. Emit-time payload coverage exists only for the background-image URL (`test_UAT_FC_REQ-91_background_image_url_cannot_break_out_of_the_css_string`, :236) and the font source (`test_UAT_FC_REQ-90_font_src_cannot_break_out_of_the_css_string`, `tests/req90-l1-font-resources.test.ts:160`, plus AC-727's own unsafe-entry block) — and none of those is linked to AC-685. **The emitter does implement the defence** (`packages/framework/src/l1/render.ts:42` `cssColor` drops non-hex; :178 `gradientCss`, :196 `shadowCss`, :215 `borderCss` all route colour through it), so this is an evidence gap, not a code bug | Extend `test_UAT_AC685_*` to render an **unvalidated** document (the premise the test already uses for ¶1) carrying payloads in a gradient stop colour, a border colour, a shadow colour, a background-image URL, a mask/transform field, and a font-face family + source, asserting no `</style>` / `@import` / `javascript:` / `expression(` and that the non-hex colour is absent from the output. Alternatively absorb the four named FC tests into AC-685 explicitly — the precedent AC-686 and AC-722 already set for FC absorption |
| 2 | violation | consistency | AC-685 `acceptance_criterion-62adf959` vs `packages/framework/src/l1/render.ts` | ac-edit (alt: code-issue) | AC-685 ¶1 makes an **unqualified** Layer-2 claim: "No value carried by an L1 document can produce executable code or break out of its sink… This holds even for a value that bypassed validation — the emitter is the last line of defence." The emitter honours that for text (`escapeHtml`, :32), colours (`cssColor`, :42), URLs (`cssUrl`, :88), font-family (`cssFontFamily`, :58) and numbers (`px`, :47) — but **not for closed-enum axes**, which are interpolated into the declaration with no emit-time re-check: `border: ${w} ${style} ${c}` where `style = b.style ?? 'solid'` (:220-221), plus `text-align: ${a.textAlign}` (:394), `text-transform:` (:395), `font-style:` (:396, and :140 in the `@font-face` path), `text-decoration-line:` (:399), `font-variant-caps:` (:402), `list-style-type:` (:409), `object-fit:` (:431), `mix-blend-mode:` (:443, :488). Under the AC's own stated premise (renderer fed a document that bypassed validation — exactly what `test_UAT_AC685_*` does today), a `border.style` of `solid; } body{display:none} .x{` closes the rule and the remainder becomes live CSS. **Exposure is bounded**: Layer 1 is genuinely in the production path — `packages/site-schema/src/schema.ts:538` embeds `l1DocumentSchema` in the page schema, so `loadOrThrow` → `cmdRender` (`tools/generate/src/cli/commands.ts:131`, `tools/generate/src/render/render.ts:114`) validates enums before render. Escalating to intent resolves it against the AC: **DOC-2 §2 enumerates the Layer-2 guarantees as text/colour/font-family/length/image-src — enums are not among them**, so the security policy and the code agree and the AC over-claims. Evidence is by inspection at the named lines; no failing test was produced (this check is read-only) | Narrow AC-685 ¶1's "no value / even if bypassed" claim to the value families DOC-2 §2 actually guarantees at Layer 2, keeping closed enums as a Layer-1 (schema) guarantee. If the operator prefers the stronger reading instead, this becomes a `code-issue`: re-check each enum against its closed set in the emitter (the same shape as `cssColor`), which also closes the `@font-face` `font-style` sink. Decide this **before** Finding 1's test edit, since it determines whether the new test must include an enum payload case |
| 3 | warning | consistency | `test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset` (`tests/reconciliation-behavior-modules.test.ts:501`) | uat-edit | The negative arm mocks an **internal** module — `vi.doMock('../packages/framework/src/index', … getModuleClientJs: () => '')` — to prove "no client behaviour in the catalog ⇒ no asset and no script reference". TEST-STRATEGY forbids mocking internal components (thin-mock at external boundaries only). Mitigating, and why this is a warning not a violation: the **positive** arm runs the entire real pipeline (`cmdNew` + `cmdRender`, real catalog, real filesystem) and is where every substantive claim of AC-702 is proven; the test explicitly guards vacuity with `expect(getModuleClientJs().length).toBeGreaterThan(0)`; and there is no unmocked route today — `cmdRender(slug, opts)` (`tools/generate/src/cli/commands.ts:128`) accepts no catalog/resolver injection, unlike the conformance harness which does (`resolveModule`, used legitimately by AC-703) | Either add a resolver/catalog seam to the render path mirroring `assertModuleConforms`'s `resolveModule` and drop the mock, or record in the AC that the empty-catalog arm is proven against a substituted catalog by construction. Low urgency — no claim is currently unproven |
| 4 | warning | exclusivity | `test_UAT_AC718_*` vs `test_UAT_AC701_*` | uat-deprecate (conditional) | Same shape, same scenario: both create an `AstroContainer`, render `ContactForm`, and assert a labelled control per configured field (`<label for="cf-name">Your name</label>` + typed/required input), a plain functional button when `submit` is absent, the L1 content when supplied, and labels present in both renders. AC-718's genuinely distinct assertions are the *negative provenance* (`contactFormMeta.config` keys are exactly `action`/`fields`/`successMessage`; no `fieldLabels`/`submitInline`/`submitColor`; `dials` undefined) and the mounted fragment's surface colour reaching the CSS (`contact-form-submit-l1-0`, `background-color: #e11d48`). This is the uat-level shadow of REPORT-1315 Finding 4 | Fold AC-718's provenance + fragment-CSS assertions into `test_UAT_AC701_*` and retire the duplicate render — **conditional on** REPORT-1314 Finding 6 (whether STORY-82 survives the consolidation). If the fold is declined, keep both |
| 5 | warning | exclusivity | `test_UAT_AC716_*` vs `test_UAT_AC686_*` | uat-deprecate (conditional) | AC-716's rejection arm re-runs four cases already in AC-686's table, in the identical shape (same `validateL1(doc).ok === false` loop): non-hex colour, font-size out of range (`5000`), geometry coordinate out of range (`200000`), non-finite number. Distinct content: the verbatim-emission assertions (`color: #f0a`, `background-color: #0a0b0c`, the 8-digit body background, `font-size: 42px`, `line-height`, `letter-spacing`, `border-radius`) — which AC-682 (accept-only) and AC-686 (reject-only) do **not** cover — plus the `negativeRadius` case. uat-level shadow of REPORT-1315 Finding 3 | If AC-716 is folded per REPORT-1314 Finding 6, migrate the verbatim-emission block (the part nothing else proves) into `test_UAT_AC682_*` and drop the duplicated rejection cases. If the fold is declined, trim AC-716's rejection list to `negativeRadius` + the emission assertions |
| 6 | warning | consistency | Test prose in `tests/reconciliation-reproduction-treatments.test.ts` (:9, :17, :31 header/describe) and `tests/reconciliation-absolute-value-literals.test.ts` (:2-3) | uat-edit | Retired vocabulary in UAT prose. The first names the runtime type by its pre-REQ-87 name — "the contact-form **capability's** SSR render" (:9), "authored via **capability config**" (:17, and the `describe` title at :117), "the two survivor **capabilities**" (:35) — which AC-722, asserted in this same capability, requires to survive nowhere ("no `'capability'` discriminant survives anywhere"). The second names STORY-80 by its pre-consolidation title, "every colour, length, and radius **dial** accepts a literal **or a named overlay**" — the dials REQ-84 deleted, and a named overlay *in* L1, which AC-716's own body places above L1. **Assertions in both files are correct** and reference no retired symbol — this is comment/title text only, which is why it is a warning | Sweep both docstrings/`describe` titles to "behavior module / behavior config" and to STORY-80's current title. Apply together with REPORT-1315 Finding 1 and REPORT-1314 Findings 3-4 — the same residue at three levels |
| 7 | info | coverage | AC-683 + AC-688 (+ the browser arms of AC-684 and AC-727) | — | These skipped rather than ran, so the capability's **headline round-trip gate** (`capture(render(L1)) ≈ L1`) and the **three-engine equivalence** contributed zero executed evidence this cycle. Cause is environmental, not the repo: `playwright ^1.61.1` **is** declared (`tools/generate/package.json`) and installed (`node_modules/.pnpm/playwright@1.61.1`), but the browser build in the shared cache is `chromium_headless_shell-1234` while 1.61.1 requires `-1228`, so `browserType.launch()` throws and `engineAvailable()` (`tools/generate/src/cli/capture/playwright-driver.ts:282-291`) returns false. Both ACs sanction the clean skip in their own Verification text, so this is not matrix drift and no editor action fits it | Not a matrix edit. Run `npx playwright install` in this worktree (or pin the regression runner's browser build to playwright 1.61.1) so the two gate UATs actually execute before this capability is treated as regression-proven |
| 8 | info | coverage | AC-725, AC-726, AC-727, AC-728 | — | These four carry no `uat_coverage` field, while the other 20 ACs in the capability do (carried forward from REPORT-1315's closing note, now checked at this level). All four nonetheless have substantive UATs that **passed** this cycle. They postdate the 2026-07-24 coverage pass (REPORT-927), which is the simplest explanation for the absent field | None — recorded so the coverage step reconciles the field rather than reading its absence as missing evidence |
| 9 | info | consistency | AC-723 `acceptance_criterion-8db8ef76` | — | REQ-93 (`request-f26cbe32`, free_and_reconciled, 2026-07-25) replaces the inert slot placeholder with a mounted behavior-module fragment. AC-723 pins the **inert placeholder**, which is correct against its story body and against this branch's code (`packages/framework/src/l1/render.ts:452`); `rg mountInL1` returns **zero hits** repo-wide, confirming REQ-93 is unimplemented here. Its UAT is correspondingly correct-but-superseded. Recorded and **not counted**: REPORT-1314 Finding 5 already escalated this as needs_review at story level, and re-raising it here would double-count one escalation (the discipline REPORT-1315 Finding 5 applied) | None at uat level until REPORT-1314 Finding 5 is resolved. When it is, this level needs a `uat-add` for mounted render and a `uat-edit` to `test_UAT_AC723_*` |
| 10 | info | exclusivity | All 24 tests | — | One test per AC, 24 distinct names, no duplicate test function names anywhere in the tree. No two tests within a story verify the same scenario in the same shape — AC-685 (emit-time) vs AC-686 (validate-time), and AC-726/AC-728 (structured/resource rejection) vs AC-686 (scalar rejection) operate at different layers by design and say so in prose. The only exclusivity pressure is cross-story and consolidation-induced (Findings 4, 5) | none |

## Notes for the Editor

**Finding 2 gates Finding 1.** Both sit on AC-685 and must be resolved in order:
decide whether the AC narrows to DOC-2 §2's enumerated Layer-2 guarantees
(`ac-edit`, recommended — policy and code already agree) or whether the emitter
hardens its enum sinks (`code-issue`). That decision determines whether the
extended `test_UAT_AC685_*` from Finding 1 must include an enum payload case.
Writing the test first risks writing it against a claim that is about to change.

**Findings 4 and 5 are blocked on the same upstream decision as the ac level.**
They are the uat-level shadow of REPORT-1315 Findings 3 and 4, which are
themselves conditional on REPORT-1314 Finding 6 (whether STORY-80 and STORY-82
survive as repointer stories post-consolidation). Resolve the story-level fold
first; if it is taken, these two test edits are subsumed by it and doing them now
is wasted work. **Finding 6 (prose) must be applied either way** — if the fold is
taken the prose moves with the surviving assertions; if it is declined the
residue stays live in the files the UATs read.

**What is genuinely clean.** The 21 tests under STORY-83 and STORY-85 are
substantive by any reading: real validator, real renderer, real Astro SSR
container, real `cmdNew`/`cmdRender` build against the real filesystem, and the
real conformance harness with a genuine throwing-core fixture. No structural/AST
stand-in stands where a behavioural probe belongs. Internal mocking appears
exactly once in the whole capability (Finding 3); the hand-built DOM objects in
`test_UAT_AC700_*` and the injected `schedule` are external-boundary fakes for
browser APIs, which the strategy permits. AC-726 (14 rejections, each asserting
the offending path), AC-728 (6 rejections + a multi-entry pass), and AC-727
(unsafe entries dropped whole, with a balanced-brace assertion) are notably
stronger than the criterion minimum.

**One thing worth the operator's attention beyond the findings.** Info 7 is
classified info because it is environmental and no editor action fits it, but its
practical effect is that this regression run proves the substrate's *emitter and
validator* thoroughly and its *browser-observable* behaviour not at all. The
round-trip identity gate is the capability's own stated headline gate. If the
regression environment cannot launch an engine, that gate is decorative here
regardless of what the matrix says.
