---
uid: report-d3e53eaf
id: REPORT-3726
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=ac)'
created_by: xgd
created_at: '2026-09-10T11:57:15.450133+00:00'
updated_at: '2026-09-10T11:57:15.450133+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: ac
  violations: 5
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: ac

**Result**: FAIL
**Violations**: 5
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a (regression 800a17f7) · Capability: capability-ae9d65d6
(CAP-70) · Level: `ac` · Previous attempts: 7

This is the **first** `ac`-level cycle for this capability in this regression — the
seven prior attempts in this scope path (REPORT-3719 … REPORT-3725) are all
`level=story`, and that chain closed **PASS** at attempt 9 (REPORT-3725,
2026-09-10 11:41). The story bodies are therefore treated as the working reference
per the level cascade, and the intent ledger below is **carried from REPORT-3725
rather than re-derived** — I re-verified only the nine intents I actually cite in a
finding. Where a finding forced me past the story body (finding 5), I say so
explicitly.

Scope walked: **7 stories, 105 acceptance criteria** (STORY-80: 7, STORY-81: 6,
STORY-82: 2, STORY-83: 43, STORY-85: 18, STORY-90: 19, STORY-91: 10). All seven
stories are `feature`/`upgrade`, so all are in the matrix and all are expected to
carry ACs.

Every finding below was checked against the implementation before being written
(Step 2.5), and each cites a file:line. Three of the five are the same shape: a
behaviour that is **shipped and tested**, but whose test is named
`test_UAT_FC_REQ-93_*` — bound to an *intent*, not to an AC — so the matrix has no
criterion for it at all.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 (`request-87b26bca`) | free_and_reconciled | 2026-07-19 | Framework pivot: L1 typed substrate + safety envelope | YES |
| REQ-84 (`request-f243b6b9`) | free_and_reconciled | 2026-07-20 | Delete the semantic layout modules and their ~20 dials | YES |
| REQ-85 (`request-015e42ac`) | free_and_reconciled | 2026-07-20 | Reframe carousel / contact-form as vetted modules: typed config + named L1 slots | YES |
| REQ-87 (`request-84af044b`) | free_and_reconciled | 2026-07-21 | `capability module` → **behavior module**; `slot.capability` → `slot.behavior`; no back-compat alias | YES |
| REQ-93 (`request-f26cbe32`) | free_and_reconciled | 2026-07-25 | Page-schema slot binding + its rejections; emitter `mounts` map; `contact-form` `labelMode`; `mountInL1` conformance mode | YES |
| REQ-96 (`request-3a064234`) | free_and_reconciled | 2026-07-26 | `control` leaf; delete `carousel.config.view`; replace contact-form `intro`/`submit` with one required `form` slot (v3→v4); zero-CSS obligation | YES |
| REQ-114 (`request-3cd338cd`) | free_and_reconciled | 2026-07-31 | L1 palette colour model (literal base + palette **reference** overlay); retire the closed 15-slot theme colour-role group | YES |
| REQ-137 (`request-d2980a95`) | free_and_reconciled | 2026-08-12 | Palette entry is one colour: `steps` deleted, continuous Oklab `shade` on the reference | YES |
| REQ-148 (`request-7ae3c2cc`) | free_and_reconciled | 2026-08-15 | Behavior modules are plain-function components rendering in workerd | YES |
| REQ-90/91, REQ-97/98/99/100/103…109, REQ-117, REQ-136, BUG-28, BUG-30 | free_and_reconciled | 2026-07-29 … 08-13 | Language-power, interaction/motion/pointer, relocatable emission, image framing — as per REPORT-3725 | YES |
| REQ-119/121/126…135/138/139/140, REQ-141…153, REQ-162, BUG-33…39 | free_and_reconciled / bundled | 2026-07-31 … 09-02 | Control-surface, editor, platform, builder, locale, product-store surfaces | NO — other capabilities |
| REQ-134 | abandoned | 2026-08-13 | Image-generation component | NO |
| REQ-155…166 (minus 162) | draft | 2026-08-30…31 | ReferenceStore port, KB, Library tab | NO — drafts |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-80 (`story-c490f1cf`), 7 ACs | REQ-79/84, REQ-114, REQ-137 | **aligned.** AC-716 carries the absolute base for all three value types; AC-928/929/930/931/1144/1145 carry the palette overlay, both reference axes, resolution-at-the-load-boundary and dangling rejection. Every clause of the body's "How each value TYPE is now carried" and colour-overlay section lands on an AC. One redundancy — warning 1. |
| STORY-81 (`story-3569e1a4`), 6 ACs | REQ-104, REQ-79/84 | **aligned.** The body's own five-item **In scope** list maps one-to-one: layout track → AC-833; wrapping row + shared cascade → AC-835; ascending serialization + visibility-wins → AC-836; track coherence → AC-838; the control-row reflow the body calls "no representation at any cost" → AC-834; additive no-op → AC-837. Nothing in the out-of-scope list is claimed by an AC. |
| STORY-82 (`story-46e3b3c7`), 2 ACs | REQ-84, REQ-85, REQ-87, REQ-93, REQ-96 | **two violations.** The story's title and body promise **two** re-homed treatment surfaces; only one (card/band + footer) carries a live AC. **Findings 1 and 5.** |
| STORY-83 (`story-d0a8cfad`), 43 ACs | REQ-79/82/84, REQ-87, REQ-90/91, REQ-93, REQ-96, REQ-97/98/105, REQ-103, REQ-107, REQ-108, REQ-109/BUG-30, REQ-114, REQ-117, REQ-136 | **one gap.** I walked the body's **In scope** paragraph clause by clause against the 43 ACs: shared axis groups → AC-802; `control` leaf → AC-806/807; framing/shape/adjustment + fixed-order + determinism → AC-1124…1128; resource table → AC-727/728; page-level colour → AC-934; envelope on every validated definition → AC-849/850/851; keyframe compilation → AC-684; `@font-face` → AC-727; relocatable emission + flat-snapshot invariant → AC-888/889/890/891; one-colour-system → AC-933/935/936; round-trip + cross-browser → AC-683/688; the nowrap floor → AC-1009…1012; texture/gradient → AC-829…832. Every clause is covered **except** the mounted-fragment emission the body claims in its own section. **Finding 2.** |
| STORY-85 (`story-179b8c06`), 18 ACs | REQ-85, REQ-87, REQ-93, REQ-96, REQ-148, BUG-28, REQ-116 | **two gaps.** The contract (AC-697/698/704/722/808), the zero-CSS obligation and both carve-outs (AC-809/810/1413), the survivors (AC-699/700/701), the preset (AC-811), the shipped asset (AC-702), isolation incl. its client half (AC-703/877/878), the edge-runtime artifact (AC-1412) and the module's escaping boundary (AC-1414) are all covered. Two **bolded** entries in the body's own In-scope list are not. **Findings 3 and 4.** |
| STORY-90 (`story-d2b5cb1c`), 19 ACs | REQ-99, REQ-100, REQ-108 | **aligned.** All three In-scope axes and all three stated obligations land: interaction state → AC-819/820/821/822/823/828; entrance → AC-824/825/826/827; pointer accent → AC-879…887; determinism → AC-884. Nothing from the Out-of-scope list (parallax, scroll-scrub, marquee, horizontal travel, entry scale) appears in any AC. |
| STORY-91 (`story-2e4e2c45`), 10 ACs | REQ-106, REQ-107 | **aligned.** Target, new-context isolation, the optional explicit accessible name (AC-839), identifier→anchor, duplicate-identifier rejection, allowlist double enforcement, focus indicator, substrate paint, and both documented intent/implementation divergences (envelope *also* rejects; the mount seam is excluded too — AC-847) all carry ACs. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency + coverage | AC-718 (`acceptance_criterion-f3328e22`), STORY-82 | ac-edit | AC-718 was **deprecated instead of repointed**, and its body still describes the pre-REQ-96 shape: `intro` and `submit` as "declared L1 slots", in pre-REQ-87 vocabulary ("the capability's named `submit` slot", "the contact-form capability"). REQ-96 (free_and_reconciled, 2026-07-26) deleted both slots for one required `form` slot at contact-form v4, and REQ-87 (free_and_reconciled, 2026-07-21) forbade the `capability` naming with no alias. STORY-82's body records both supersessions **and** states the repair: "In scope for this upgrade: **repoint** the story's ACs … to the two surviving surfaces (L1 leaf axes; contact-form behavioural config + the `form` L1 slot and its `control` leaves)." The UAT was repointed and the AC was not: `tests/reconciliation-reproduction-treatments.test.ts:125-198` now asserts `Object.keys(contactFormMeta.slots)` is exactly `['form']`, that the submit is an L1 `control` leaf carrying `surfaceFill`, and that no `fieldLabels`/`submitInline`/`submitColor` dial survives — all of which matches `packages/framework/src/modules/contact-form/meta.ts:27` (`version: 4`), `:58-61` (`slots: { form: { required: true } }`) and `:62-76` (`controls`). Because AC-718 is the story's only contact-form criterion, deprecating it leaves the **contact-form half of STORY-82's own title** ("placeholder & inline contact form") with no AC at all; AC-719 covers only card/band + footer. | Rewrite AC-718 to the REQ-96 shape and clear `lifecycle: deprecated` / `uat_coverage: deprecated`: contact-form exposes no aesthetic dials; its whole presentation is one L1 subtree in the **required `form` slot**, with a `control` leaf per `config.fields` entry (named by that field's `name`) plus the optional `submit` affordance; `label`/`honeypot`/`turnstile` are invariant and never bindable; and the story's headline "compact placeholder-labelled" promise is delivered by `config.fields[].labelMode: 'visible' \| 'placeholder'` (`meta.ts:47`) — a captured a11y fact, not a dial — while the programmatic accessible name is emitted either way. Frame the criterion as the *reproduction treatment* (as AC-719 does for its half), not as a restatement of STORY-85's AC-701 contract claim. |
| 2 | violation | coverage | STORY-83 (`story-d0a8cfad`) | ac-add | No AC covers the **mounted-fragment emission**. STORY-83's body devotes a whole section to it ("What a `slot` emits: placeholder, or a mounted fragment"): "REQ-93 gave the sole emitter a `mounts` map … This is the one place the emitter inserts markup **verbatim, unescaped**", resting on two stated preconditions (framework-rendered markup, not instance data; the binding proved before render). STORY-85's body defers to STORY-83 for it **twice** — "STORY-83 records that emitter carve-out and the trust boundary it rests on. This story owns the rule; STORY-83 owns the emission." It is shipped at `packages/framework/src/l1/render.ts:2150-2168` (`const mounted = state.mounts?.[node.name] ?? ''`) and tested at `tests/req93-l1-slot-mounted-behaviors.test.ts:349` — but under `test_UAT_FC_REQ-93_mounted_fragment_replaces_the_inert_placeholder`, an intent-named test bound to no AC. AC-723 covers only the **no-mount** placeholder state. The capability's load-bearing claim is that "no value originating in instance data reaches the browser except through a typed sink"; its single documented exception has no criterion. | Author an AC under STORY-83: a `slot` whose name is present in the caller's `mounts` map emits that fragment as its content **verbatim and unescaped**, while a slot with no matching entry stays the inert labelled placeholder of AC-723; the slot's own `data-l1-slot` / `data-l1-behavior` attributes and its surface/sizing axes are emitted identically in both states; and the carve-out's two preconditions are stated as the criterion's own scope (the fragment is framework-rendered markup whose instance values already cleared the module's sinks, and the binding was proved by the page validator before render — finding 3's rule). |
| 3 | violation | coverage | STORY-85 (`story-179b8c06`) | ac-add | No AC covers the **REQ-93 page-level binding rule**, which STORY-85's In-scope list carries in bold: "**the page-level binding rule and its rejections (REQ-93)**". The body sets it out as a five-row table — unbound module, dangling slot name, double-bound seam, `slot` with no `l1`, duplicate slot names — plus two legal states (both empty; an **orphan seam** is *not* rejected). Every existing validation AC is **instance**-scoped and none reaches the page: AC-697 validates `config` against the typed contract, AC-698 validates `slots` as L1 subtrees, AC-808 validates control bindings in both directions. The rule is shipped at `packages/site-schema/src/schema.ts:569-624` (the `superRefine` on the page schema: `:570-580` the no-`l1` branch, `:584` duplicate seam names, `:594` missing slot, `:604` dangling name, `:614` double-bound) and tested at `tests/req93-l1-slot-mounted-behaviors.test.ts:154` under `test_UAT_FC_REQ-93_unresolvable_bindings_fail_with_a_machine_readable_path` — again intent-named, bound to no AC. | Author an AC under STORY-85: validating a page carrying both `modules` and `l1` rejects each of the five shapes with a machine-readable path, and accepts the two legal states — both empty (the starter page) and an orphan seam, which stays the inert placeholder STORY-83 emits. State the rule's direction as the body now does: one-directional **on an L1 page** — every module mounted there must name a live, unique seam; a seam need not attract a module; a module on a page with no L1 document names no seam at all. |
| 4 | violation | coverage | STORY-85 (`story-179b8c06`) | ac-add | No AC covers **`mountInL1`**, the second bolded entry in STORY-85's In-scope list ("**`mountInL1` as the shape a behaviour inherits its obligations in**"). The body gives it its own paragraph: the harness runs *the same universal ACs* against the mounted shape, binding the fixture's instance to a single full-width unstyled `slot` in a minimal L1 host with a keyframe at every probed width, "so the wrapper can never be the thing that overflows. A form that overflows only once it is inside a pinned slot is still a violation, and this is the position that catches it." AC-704 covers the five conformance **dimensions** and the negative fixtures, but never the mounted **mode**. Shipped at `tools/generate/src/conformance/types.ts:92` (`mountInL1?: boolean`) and `tools/generate/src/conformance/harness.ts:140`; exercised at `tests/req93-l1-slot-mounted-behaviors.test.ts:428` and `tests/req88-form-labelling-and-submit.test.ts:195,310`, all under intent-named tests bound to no AC. | Author an AC under STORY-85: a behaviour's conformance obligations are unweakened inside a seam — the harness's `mountInL1` mode runs the same five dimensions against the instance bound to a full-width unstyled `slot` in a minimal L1 host keyframed at every probed width, and a fixture that conforms standalone but overflows once pinned inside the seam is still flagged. |
| 5 | violation | consistency | AC-719 (`acceptance_criterion-da7c62ec`), STORY-82 | ac-edit | AC-719 offers a retired authoring form as a live alternative: card/footer treatments are carried "as a literal **(or a named overlay role)**". No named colour-**role** overlay exists. REQ-114 (free_and_reconciled, 2026-07-31) retired the closed colour-role vocabulary, and the matrix asserts its absence positively in this same capability — AC-935 (STORY-83), "**No closed colour-role vocabulary survives in the schema, in a definition, or on a layer**". The surviving overlay is a palette **reference** into an arbitrary-size map of *free-form kebab-case* entry names (STORY-80 AC-928; `L1PaletteRef` in `packages/site-schema/src/l1/palette.ts`, exported at `packages/site-schema/src/l1/index.ts:29`) — the opposite of a closed role set. Code confirms the deletion: `layerColorRoleSchema` survives only in removal comments at `packages/site-schema/src/schema.ts:297` and `:338`. I escalated past the story body here deliberately: STORY-82's body carries the same phrase twice, so AC-719 *is* consistent with its own story — the body is the thing that is inconsistent with the rest of the capability and with the code. | Replace "(or a named overlay role)" in AC-719 with "(or a reference to a site palette entry)". The same phrase must be corrected in STORY-82's body in the same pass — the REQ-84 bullet ("colour / border / opacity literals (or a named overlay role)") and the Technical Context bullet ("literals or overlay roles"). |
| 6 | warning | exclusivity | AC-930 + AC-1144 (STORY-80) | ac-edit | The shade↔alpha independence claim is stated **and verified** twice in the same shape. AC-1144's fourth bullet ("`shade` and `alpha` are independent axes on the same reference and compose in either combination") restates AC-930's fourth paragraph, and the two verifications are near-identical — AC-1144: "resolve the same entry at a shade, at an alpha, and at both, and confirm the three results are the shaded colour, the opaque colour at that opacity, and the shaded colour at that opacity"; AC-930: "the same entry referenced at an alpha, at a shade, and at both resolves to the opaque colour at that opacity, the shaded colour opaque, and the shaded colour at that opacity". Each AC has a distinct headline (AC-930 owns "translucency and lightness are axes of the *reference*"; AC-1144 owns "continuous `shade` on [-1,+1], Oklab, endpoint validation") — this is a shared sub-clause, not a duplicate AC, hence a warning rather than a violation. | Keep the composition claim in **one** AC — AC-930, whose headline is precisely that both variation axes ride on the reference — and have AC-1144 cross-reference it rather than restate and re-verify it. |

## Notes for the Editor

**The dominant pattern is a naming one, not a thinking one.** Findings 2, 3 and 4
are all the same shape: REQ-93's three behaviours are implemented, are covered by
substantive tests exercising real entry points, and pass — but every one of those
tests is named `test_UAT_FC_REQ-93_*`, i.e. bound to the *intent* rather than to an
`AC<number>`. The reconciliation that folded REQ-93 into this capability wrote the
story prose (STORY-83 got a whole section; STORY-85 got a five-row table and two
bolded In-scope entries) and never minted the criteria. Three `ac-add`s close it;
no code and no test needs to change. When the ACs are authored, the existing tests
are the natural evidence to point them at — `tests/req93-l1-slot-mounted-behaviors.test.ts`
lines 154, 349 and 428 respectively.

**STORY-82 is the weakest node in the capability and is worth a second look after
the AC edits land.** With two ACs it is far below every sibling (next-smallest is
STORY-81 at 6), one of its two is deprecated, and both carry `status: pending`
while all 103 other ACs in the capability are `status: active` — AC-719 in
particular is plainly live (`uat_coverage: pass`, a passing UAT at
`tests/reconciliation-reproduction-treatments.test.ts:31`), so `pending` reads as
stale metadata rather than a lifecycle statement. That is not intent drift and is
not filed as a finding, but an editor touching these two tickets should fix it
while there.

**Watch the exclusivity boundary when repairing finding 1.** STORY-85's AC-701
already covers contact-form's `form` slot, its `control` leaves, placeholder
labelling and the inline-versus-stacked submit — as the *behavior contract's*
claim. STORY-82's repointed AC-718 must make the *reproduction treatment* claim
instead (these captured treatments are reachable through the surviving surfaces and
no per-module dial remains), exactly as AC-719 does for card/footer without
duplicating STORY-83's L1-axis criteria. Writing AC-718 as a restatement of AC-701
would trade this coverage violation for an exclusivity one.

**Findings 1 and 5 touch the same two tickets and should be applied together** —
AC-718's body, AC-719's parenthetical, and STORY-82's body (two occurrences of the
overlay-role phrase). Note that finding 5's repair is the one place in this cycle
where a story body must change; every other repair is confined to the AC layer.

**Not flagged, checked and clean:** STORY-90's and STORY-91's out-of-scope lists
are genuinely unclaimed (no AC mentions parallax, scroll-scrub, marquee, horizontal
travel, entry scale, client-side routing or prefetching). STORY-83's three
envelope ACs (AC-849 "wherever a definition is validated", AC-850 "the four defect
classes", AC-851 "two independent lines of defence") read as overlapping but each
carries a distinct load-bearing claim, so they are not an exclusivity finding.
`capabilities.js` in AC-702 is a deliberate post-REQ-87 survivor, justified in both
the AC and STORY-85's Technical Context, not stale vocabulary.
