---
uid: report-cbb23da6
id: REPORT-2405
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=ac)'
created_by: xgd
created_at: '2026-08-20T08:00:39.859395+00:00'
updated_at: '2026-08-20T08:00:39.859395+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: ac
  violations: 4
  warnings: 4
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: ac

**Result**: FAIL
**Violations**: 4
**Warnings**: 4
**Needs review**: 0

Anchor report: report-2485c83c · Capability: capability-ae9d65d6 (CAP-70) · Previous attempts: 7

## Cascade precondition — met this run

Unlike the last four ac cycles, the story level is **green going in**:
`report-cdc26db2` (today, 07:52) returned PASS / 0 violations after fix attempt 7
(`report-dd3fa892`), and STORY-82 / STORY-83 / STORY-85 were all rewritten today
(`updated_at` 07:42–07:44). Story bodies are therefore my working reference, as
the level rules prescribe. I escalated to intent in exactly two places, both
noted inline, where the repaired story body is itself demonstrably wrong against
a `free_and_reconciled` intent (warnings 3 and 4).

**The two coverage violations below are the expected cascade, not a regression.**
The story cycle repaired a story-level coverage gap by admitting REQ-93's page
composition rule into STORY-85's body and the renderer mount into STORY-83's for
the first time. That gap now surfaces one level down, exactly as
`report-cdc26db2`'s own closing note predicted.

## Cumulative Intent Considered

Ledger carried forward from today's story cycle (which re-verified every row) and
re-checked here for anything that reconciled since. The rows that bear on the
findings were re-verified against code in this pass; citations in Findings.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-58/59/61/62 (BUNDLE-6, `bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-19 | Pre-pivot module dials — absolute values, per-breakpoint dials, reproduction treatments | YES (mostly superseded below) |
| REQ-63/79/82/83/84 (BUNDLE-7, `bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Framework pivot: L1 substrate + safety envelope; semantic layout modules and their ~20 dials deleted | YES (retires the BUNDLE-6 delivery) |
| REQ-85 (`request-015e42ac`) | free_and_reconciled | pivot D | Behavior contract; reframed carousel & contact-form | YES |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-23 | L1 resource table + `@font-face`; typed axes for every captured pixel-mover | YES |
| REQ-87 (`request-84af044b`) | free_and_reconciled | 2026-07-24 | `capability module` → **behavior module**; **no back-compat alias** | YES |
| **REQ-93** (`request-f26cbe32`, BUNDLE-10) | **free_and_reconciled** | **2026-08-05** | **Page-level slot binding + its rejections, renderer mounts the fragment into the seam, `mountInL1` conformance mode, `labelMode` config** | **YES — violations 2, 3, 4** |
| REQ-96…107 + BUG-28 (BUNDLE-11, `bundle-ee56a66e`) | free_and_reconciled | 2026-08-06 | `control` leaf + zero-CSS contract (deletes `config.view`, the `intro`/`submit` slots); shared axis groups; interaction/motion/texture; layout track; link role; client isolation | YES |
| REQ-108…113 + BUG-30 (BUNDLE-13) | free_and_reconciled | 2026-08-06 | Pointer accent; relocatable document-relative emission | YES |
| **BUG-31 + REQ-114 + REQ-116** (BUNDLE-14, `bundle-0385746c`) | **free_and_reconciled** | **2026-08-06** | **Palette colour model; closed colour-role vocabulary deleted outright**; edit-render settled-state carve-out | **YES — violation 1, warning 4** |
| REQ-117 | free_and_reconciled | 2026-07-31+ | nowrap captured width becomes a floor | YES (AC-1009…1012) |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Image framing / shape / colour adjustment — substrate half | YES (AC-1124…1128) |
| **BUG-34 + REQ-137** (BUNDLE-18, `bundle-d9226698`) | **free_and_reconciled** | **2026-08-17** | **Palette `shade` on the reference replaces named `steps`** | **YES — now covered, see below** |
| REQ-145 / REQ-148 | ready_to_reconcile | — | L1 render and behavior-module render move into workerd; Astro deleted from the module render path | imminent — no ac gap yet |
| BUG-35 (`bug-1bde3bf9`) | bundled | 2026-08-13 | Copy-modal preview: UA reset blocks `text-transform` | imminent — **builder chrome (`builder.css`/`fields.css`), not CAP-70** |
| REQ-112 / REQ-134 | abandoned | — | — | NO |

**REQ-137 closed the last cycle's warning.** REPORT-1670's warning 6 held AC-928's
`steps` clause as a *pending* violation against then-`bundled` REQ-137. REQ-137
reconciled 2026-08-17 and the matrix moved with it: AC-928 and AC-931 were rewritten
2026-08-16T22:14–22:15 and AC-1144 / AC-1145 were authored for the Oklab `shade`.
Code agrees — `packages/site-schema/src/l1/palette.ts:77-82` declares
`l1PaletteEntrySchema` as `{ value }` `.strict()` with no `steps`. **No finding.**

**Intent scan since the last ac cycle (2026-08-09).** Everything reaching a counting
status since is either covered above or lands on the builder / control-surface
capability. No new ac-level coverage gap arises from it.

## Alignment Ledger

102 ACs across 7 stories. All 7 are `feature`/`upgrade`, so all are in scope for AC
coverage. Grouped; flagged elements itemised.

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-80 · AC-716, 928, 929, 930, 931, 1144, 1145 (7) | REQ-84, REQ-114, **REQ-137** | aligned on both the colour-role cut and the `steps` retirement (AC-928/931 rewritten 08-16; AC-1144/1145 added); **AC-716 stale and triply-overlapping** (warning 1) |
| STORY-81 · AC-833–838 (6) | REQ-104 | aligned |
| **STORY-82 · AC-718 (deprecated), AC-719 (2)** | REQ-84, REQ-85, REQ-87, REQ-93, REQ-96, REQ-114 | **AC-718 correctly retired this cycle** (info 1); **AC-719 still carries REQ-114's deleted vocabulary** (violation 1); story's contact-form half now has no AC of its own (warning 2) |
| STORY-83 · 43 ACs (AC-682–688, 723, 725–728, 801–807, 829–832, 849–851, 888–891, 933–936, 1009–1012, 1124–1128) | REQ-82, 90, 91, 97, 98, 103, 105, 106, 107, 109, 114, 117, 136 | aligned, **except AC-723** — the story's newly in-scope bound-seam emission is both mis-stated and uncovered (violation 2) |
| STORY-85 · AC-697–704, 722, 808–811, 877, 878 (15) | REQ-85, 87, 93 (*partly*), 96, 116, BUG-28 | aligned on the contract, the zero-CSS obligation and **both** carve-outs (AC-809 already carries the settled state — no gap); **but no AC covers REQ-93's page composition rule** (violation 3) **or `mountInL1`** (violation 4) |
| STORY-90 · AC-819–828, 879–887 (19) | REQ-99, REQ-100, REQ-108 | aligned |
| STORY-91 · AC-839–848 (10) | REQ-106 | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-719 `acceptance_criterion-da7c62ec` (STORY-82) | ac-edit | **Fifth consecutive ac cycle; element byte-identical throughout (`updated_at` still 2026-08-09T05:40).** The criterion still grants an L1 leaf's colour "a literal **(or a named overlay role)**". REQ-114 (free_and_reconciled, via BUNDLE-14) deleted the closed colour-role vocabulary outright. Re-verified in code this pass: `packages/site-schema/src/l1/palette.ts:66-70` defines an entry name as a free-form kebab-case regex (`primary`, `brand-teal`, `slate-2`) with no role enum, and `:83-97` defines the reference as `{ ref, shade?, alpha? }` — there is no role anywhere. Two siblings assert the negative **as criteria**: **AC-935** (STORY-83) — "The retirement is a deletion, not a deprecation: there is no alias, no grandfathered spelling, and **nothing anywhere that resolves an old role name to a colour**" — and **AC-928** (STORY-80), which names the accepted forms as a hex literal or a palette *reference*. AC-719 is the only surviving element in the capability that still names the deleted form | Replace "(or a named overlay role)" with "(or a palette reference)". **Pair this with warning 4** — the same retired vocabulary survives twice in STORY-82's own body, and fixing only the AC leaves the story asserting what the AC no longer does |
| 2 | violation | consistency | AC-723 `acceptance_criterion-8db8ef76` (STORY-83) | ac-edit | AC-723 states, unconditionally, that a `slot` "carries no module code and no attached behaviour" and that "the placeholder is an **empty element**". That is true only of an **unbound** seam. REQ-93's mount is live: `packages/framework/src/l1/render.ts:2119-2122` reads `const mounted = state.mounts?.[node.name] ?? ''` and emits `…>${mounted}</div>`, so a bound seam is the same `div` **with the behaviour's fragment as its content**. STORY-83's body — repaired today — now says exactly this ("**How a `slot` renders depends on whether it is bound** … A **bound** seam renders that same `div`, [with the] mounted behavior's fragment as its content"), so the AC now contradicts its own story body as well as the code. **This finding is deliberately not split.** The same element is also the *coverage* half: STORY-83's In-scope newly claims the renderer's seam emission "on both sides of the mount", and no AC in the capability covers the bound side — AC-804 covers only the seam's sizing. One edit closes both; the previous four cycles fragmented this area and converged on nothing | Qualify AC-723's existing claims to the **unbound** case ("with no module bound, a `slot` reaches the page as an inert, labelled placeholder — an empty element…"), then add the bound case: a seam named in the `mounts` map emits the bound behaviour's already-rendered fragment as its content, **inside the same positioned box** (so no extra wrapper), with `data-l1-slot` / `data-l1-behavior` unchanged either way, and leaving a seam unbound stated as legal rather than an error. Keep the existing escaping/`data-l1-capability` clauses verbatim — they are correct and independently verified |
| 3 | violation | coverage | *(no AC anywhere in CAP-70)* — STORY-85 `story-179b8c06` | ac-add | **REQ-93's page composition rule is now in a story body for the first time and has no criterion.** STORY-85's body carries the rule ("modules may accompany an L1 page when each **binds by name to a `slot` present in that L1 tree**") plus a five-row rejection table, and its In-scope line names it explicitly. Code re-verified this pass at `packages/site-schema/src/schema.ts:537-599`: `pageSchema.superRefine` rejects a `slot` on a page with no L1 body (`:549-556`), a duplicated seam name (`:559-566`), an unbound module (`:568-577`), a dangling seam name (`:578-586`), and a double-bound seam (`:587-594`) — each `ctx.addIssue` carrying a machine-readable `path`. None of STORY-85's 15 ACs addresses it: **AC-698** validates a *single instance's* slot subtrees (the security line), **AC-808** validates control bindings, and neither reaches the page↔tree binding. Evidence exists but is unclaimed — `tests/req93-l1-slot-mounted-behaviors.test.ts` carries 10 tests, all named `test_UAT_FC_REQ-93_*` (free-coded form), so no AC owns them | Author one AC under STORY-85: a module accompanying an L1 page binds by name to exactly one existing seam, and each of the five cases above is a rejection carrying a path to the offending element — with the converse (a seam no module binds) stated as **legal**, matching `render.ts:2109` and finding 2. Note in it that the seam inventory is read in document order **with duplicates preserved**, since deduping would hide the ambiguous case. Relink the existing 10 tests to the new AC number rather than authoring fresh ones — that closes the uat gap in the same pass |
| 4 | violation | coverage | *(no AC anywhere in CAP-70)* — STORY-85 `story-179b8c06` | ac-add | STORY-85's In-scope ends "…and that **conformance is exercised in both shipping shapes, standalone and mounted into an L1 seam**", and its Technical Context describes the `mountInL1` fixture mode at length. The mode is real: `tools/generate/src/conformance/types.ts:92` (`mountInL1?: boolean`) and `harness.ts:140` (`if (opts.mountInL1)`). No AC covers it. **AC-704** is the nearest and is not a substitute — it asserts the declared dimension *set* is exactly {safety, security, cross-browser, responsive, isolation} and that the harness would exercise all five; it says nothing about the second shape. A behaviour conforming standalone but not once mounted (or the reverse) is the defect this mode exists to catch, and nothing in the matrix claims it | Author an AC under STORY-85 (or extend AC-704 with a second clause): the harness runs the universal ACs against a behaviour in **both** shapes — as a bare module stack and bound by name to a seam in an L1 host document, through the same validated binding a real page uses — and the host carries a geometry keyframe at every probed width so an overflow under this mode is attributable to the behaviour rather than the wrapper. `tests/req93-l1-slot-mounted-behaviors.test.ts:415` (`test_UAT_FC_REQ-93_mounted_behavior_carries_its_conformance_obligations`) is the existing evidence |
| 5 | warning | exclusivity | AC-716 `acceptance_criterion-1eaa93b8` vs AC-928 `acceptance_criterion-1663c20c` + AC-931 `acceptance_criterion-5ab42ca8` (all STORY-80) | ac-edit | Carried unchanged from the last two cycles, and now **worse**: AC-928 and AC-931 were rewritten on 2026-08-16 for REQ-137 while AC-716 was not (still 2026-08-09), so the three have drifted apart as well as overlapping. AC-716's colour bullet — "A colour axis on an L1 leaf accepts a hex literal … **or** a reference into the site palette which resolves to a hex before anything paints" — is AC-928's whole criterion. AC-716's closing paragraph — "A document that uses only literals needs no palette and is unaffected by the widening" — is AC-931's second bullet almost verbatim ("A literal-only document is entirely unaffected by the widening: it needs no palette, validates and renders exactly as before") | Narrow AC-716 to the subject nothing else owns: the literal is the **base** of the value model and is envelope-validated — principally the length / geometry / radius half, which is literal-only and has no named scale. Delete the palette-acceptance bullet (AC-928 owns it) and the literal-only paragraph (AC-931 owns it) |
| 6 | warning | coverage | STORY-82 `story-46e3b3c7` | story-body-edit | AC-718's deprecation this cycle was the right call (info 1), but it left STORY-82's stated scope half-uncovered. The story's In-scope still reads "repoint the story's ACs from the deleted module dials to the two surviving surfaces — L1 leaf axes for the card/band and footer treatments; **and, for contact-form, the required `form` slot plus its `control` leaves, with `labelMode`**", and the Story statement promises "compact placeholder-labelled or single-row contact forms". The story's one remaining AC, AC-719, is about card/band and footer only. **Warning rather than violation**: the behaviour itself is fully expressed in the capability — AC-701 (STORY-85) covers the required `form` slot, a `control` node per field, the optional submit, inline-vs-stacked as ordinary L1 geometry, and the `placeholder`/hidden-label pairing. Authoring a STORY-82 AC for it would reproduce AC-701 almost clause for clause, which is the exclusivity trap the last cycle diagnosed | Do **not** add an AC. Edit STORY-82's In-scope to say the contact-form half's criterion moved to AC-701 under STORY-85 when AC-718 was deprecated, leaving this story's own criterion the L1-axis half (AC-719). STORY-82's Out-of-scope already defers the *mechanisms* to STORY-83/85; this extends the same deferral to the criterion |
| 7 | warning | consistency | STORY-83 `story-d0a8cfad` | story-body-edit | Escalation to code, permitted because the upper layer is the thing in error. STORY-83's newly-added seam-emission paragraph states "`renderL1Document` / **`renderL1Fragment`** accept a `mounts` map keyed by slot name". `renderL1Fragment` does not: its signature is `(nodes, prefix, controls, opts: { palette, edit })` (`packages/framework/src/l1/render.ts:2428-2433`) and it builds `RenderState` without `mounts` (`:2434`). Only `renderL1Document` takes one, via `L1RenderOptions.mounts` (`:2339-2347`, `:2380`). Not intent drift — REQ-93 asked for the mount, and the document path delivers it — but an AC authored from this sentence (finding 2) would assert a signature that does not exist, which is precisely how the last four cycles' AC-718 verification step came to name a symbol family that had been renamed away | Drop `renderL1Fragment` from that sentence, leaving `renderL1Document` accepting the `mounts` map. Worth doing **before** finding 2's AC edit, since that AC is authored from this paragraph |
| 8 | warning | consistency | STORY-82 `story-46e3b3c7` | story-body-edit | The retired colour-role vocabulary of violation 1 survives **twice** in STORY-82's body, which was rewritten today and passed the story cycle at 07:52 with this text intact: Description bullet 1 — "each L1 box/text/image node carries its own validated colour / border / opacity literals **(or a named overlay role)**" — and Technical Context bullet 1 — "to L1 leaf axes (colour/border/opacity literals **or overlay roles**)". Same REQ-114 deletion, same contradiction with AC-935 and AC-928, same code evidence as violation 1. The last ac cycle explicitly asked for both to move with the AC ("The identical clause appears twice in STORY-82's body — move both together"); the story-level repair did not | Replace both with "or a palette reference", in the same pass as violation 1 |
| 9 | info | — | AC-718 `acceptance_criterion-f3328e22` | — | **Resolved and verified.** AC-718 — raised as a violation by four consecutive ac cycles — is now `status: deprecated` with a lineage body citing REQ-96 (the `intro`/`submit` deletion, `meta.ts` now `slots: { form: { required: true } }`) and REQ-93 (`labelMode` reframed rather than removed), and the original body preserved below a rule for history. The last cycle's changed recommendation (deprecate rather than a fifth `ac-edit`) was correct and terminated | none |
| 10 | info | — | AC-718 `fields.lifecycle` | — | **Correcting `report-cdc26db2`'s closing note**, which flagged `fields.lifecycle: deprecated` on AC-718 as "an invented field left in place" for this level to raise. It is not invented: AC-637 (`story-82eb6908`, the only other deprecated AC in the project) carries the identical `lifecycle: deprecated` alongside `uat_coverage: deprecated`. AC-718 follows the established convention exactly. **No hygiene finding** | none |
| 11 | info | — | ticket index (AC-718) | — | Tooling, not matrix drift. `xgd ticket list --type acceptance_criterion --status pending` returns AC-718 with a stale `UPDATE:2026-08-16` row, while `xgd ticket get` and `--status deprecated` both return the current `deprecated` / 2026-08-20 state. AC-718 appears in both status listings. Recorded here rather than filed, since a stale index row is a read-path artifact and the report is the channel to the operator | none |

## Notes for the Editor

**Two of the four violations are the story cycle's own cascade — author them, don't
re-litigate them.** Findings 3 and 4 exist *because* the story repair worked:
REQ-93's page composition rule and `mountInL1` entered STORY-85's body today for
the first time, and an AC level that found nothing under them would have been the
suspicious result. `report-cdc26db2` predicted both in its closing note. The
schema, the renderer and the conformance harness have all shipped them; only the
matrix is behind.

**One coordinated REQ-93 pass, not three edits.** Findings 2, 3 and 4 are one
intent's three layers — the mount (STORY-83), the binding rule (STORY-85), the
two-shape conformance (STORY-85) — and they share one body of evidence:
`tests/req93-l1-slot-mounted-behaviors.test.ts`, 10 substantive tests covering each
rejection, the clustering on the real gigabytealchemy capture, config derivation,
the mounted render and the mounted conformance run. They are named
`test_UAT_FC_REQ-93_*`, the free-coded form, so the uat cycle that runs immediately
after this one will credit them to nothing. **Authoring these ACs and renaming those
tests to `test_UAT_AC<n>_*` in the same pass closes the ac and uat gaps together.**
Do finding 7's one-line story correction first, since finding 2's AC is authored
from that paragraph.

**Finding 1 is on its fifth cycle and needs the story body to move with it.** AC-719
is byte-identical across all five, and the reason is visible in finding 8: the
identical retired clause sits twice in STORY-82's body, so an editor fixing only the
AC finds the story still asserting the old form and has reasonable grounds to leave
it. Four previous cycles prescribed the AC edit alone. Do both, in one edit.

**Do not add an AC for finding 6.** It is the same trap that kept AC-718 alive for
four cycles: the behaviour is already covered, more fully and more currently, by
AC-701. The repair is one sentence in STORY-82's In-scope, not a new criterion.

**A corroborating signal the previous cycles leaned on has expired.** Earlier ac
reports cited "AC-718 and AC-719 are the only 2 `pending` ACs among all 424 in the
project" as evidence of an unfinished process. That is no longer true — there are
now 20 `pending` ACs project-wide (AC-1240, AC-1290, AC-1307–1316 and others, all
mid-development on other capabilities). AC-719's `pending` status is unremarkable
on its own; findings 1 and 8 stand on the intent and the code, not on it.

**Two imminent intents will move this capability again.** REQ-145 and REQ-148 are
both still `ready_to_reconcile`. REQ-148 changes the behavior-module contract
itself — deleting Astro from the module render path — so STORY-85 and its ACs
should be expected to take a further upgrade when it reconciles. Neither is a
finding now; recorded so the next cycle can tell "not yet reconciled" from
"dropped".
