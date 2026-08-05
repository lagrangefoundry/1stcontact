---
uid: report-a349e0aa
id: REPORT-1314
type: report
title: 'Capability-Intent Alignment: framework_substrate (level=story)'
created_by: xgd
created_at: '2026-08-05T20:34:18.719938+00:00'
updated_at: '2026-08-05T20:34:18.719938+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: story
  violations: 4
  warnings: 2
  needs_review_count: 1
---

# Capability-Intent Alignment: framework_substrate
# Level: story

**Result**: FAIL
**Violations**: 4
**Warnings**: 2
**Needs review**: 1

Anchor report: report-31234d67 · Capability: capability-ae9d65d6 (CAP-70) · Level: story · Previous attempts: 0

## Cumulative Intent Considered

Intent chain reached from the capability's five stories (`fields.intent_uid` +
`fields.updated_by`): BUNDLE-6 (`bundle-ab9e0cb6`), BUNDLE-7 (`bundle-31e474b9`),
BUNDLE-8 (`bundle-cceaba25`), REQ-87 (`request-84af044b`) — expanded to member
tickets — plus reconciled intents whose subject matter falls inside this
capability's declared scope but that no story references.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-58 / 59 / 61 / 62 (BUNDLE-6) | free_and_reconciled | 2026-07-13…16 | gigabytealchemy pass-3 repro; gradient + responsive diff. Origin of STORY-80/81/82 | YES |
| REQ-63 (BUNDLE-7) | free_and_reconciled | 2026-07-17 | capture/diff axis coverage audit (CAP-63 surface) | YES (other cap) |
| REQ-79 `request-87b26bca` | free_and_reconciled | 2026-07-19 | Framework pivot: L1 layout substrate + module contract; language-triviality principle #2 (one value = one literal field, **no theme-role indirection IN L1**) | YES |
| REQ-82 `request-11efc10f` | free_and_reconciled | 2026-07-20 | L1 schema + envelope validator + sole safe renderer | YES |
| REQ-83 `request-56d62b72` | free_and_reconciled | 2026-07-20 | capture→L1 fold (CAP-71) | YES (other cap) |
| REQ-84 `request-f243b6b9` | free_and_reconciled | 2026-07-20 | **Retired** the semantic layout modules + ~20 colour/length/radius dials and `navCollapse` | YES (retires) |
| REQ-85 `request-015e42ac` | free_and_reconciled | 2026-07-20 | Module contract (vetted core + typed config + L1 slots); reframed carousel & contact-form | YES |
| REQ-86 `request-58e96ad1` | free_and_reconciled | 2026-07-20 | 3-probe reproduction gate (CAP-71/73) | YES (out of scope here) |
| REQ-88 `request-7ff1bacd` | free_and_reconciled | 2026-07-21 | L1 reproduction pipeline; introduced `pageSchema` XOR (module stack **xor** raw L1) | YES |
| REQ-87 `request-84af044b` | free_and_reconciled | 2026-07-21 | **Retired** the `Capability*` runtime type name → `Behavior*`; `kind:'capability'`→`kind:'behavior'`; **explicitly no back-compat alias**; docs to be updated in the same pass | YES (retires) |
| REQ-89 `request-bde8d037` | free_and_reconciled | 2026-07-22 | Astro boot noise (no CAP-70 surface) | YES (no surface) |
| REQ-90 `request-bc4c1408` | free_and_reconciled | 2026-07-23 | L1 document-level resource table + renderer `@font-face` | YES |
| REQ-91 `request-42385423` | free_and_reconciled | 2026-07-23 | L1 pixel-mover axes (gradients, shadows, border, mask, transform, scrim, blend) | YES |
| REQ-92 `request-7a6766b0` | free_and_reconciled | 2026-07-23 | Rebuild `foldToL1` to the full language (CAP-71) | YES (other cap) |
| BUG-6…BUG-11, BUG-7 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | fold / analytic-probe defects (CAP-71 / CAP-73) | YES (other caps) |
| **REQ-93** `request-f26cbe32` | **free_and_reconciled** | **2026-07-25** | **Replaces REQ-88's XOR with slot-bound mounting: a page may carry `l1` + module instances when each names an existing `slot`; `renderL1Document` mounts the bound module's fragment **in place of** the inert placeholder; `mountInL1` conformance fixture** | **YES** |
| REQ-95 `request-d41fd017` | legacy_done | 2026-07-25 | gendevlabs.ai authored directly in L1 (authoring-face probe). A site build; every framework gap it surfaced was spun out as its own intent (REQ-96…REQ-108) | YES (no durable story expected) |
| REQ-94, REQ-96…REQ-107, BUG-27, BUG-28 (BUNDLE-11) | bundled / `reconciling` | 2026-07-25…31 | L1 `control` node, text `sizing`, uniform surface group, hover/focus, motion, texture/radial, row wrap, slot sizing, link role, envelope-on-authored-pages, font registry | **imminent** — live but not yet enforced |
| REQ-108, REQ-114, REQ-116, REQ-117 (+ REQ-109…113, 115, BUG-30/31) | ready_to_reconcile | 2026-07-29…31 | pointer-reactive texture; L1 palette colour model; edit render; copy editing | **imminent** — live but not yet enforced |
| REQ-80, REQ-65, REQ-69 | abandoned | 2026-07-17…19 | — | NO |
| REQ-112, REQ-118, REQ-119 | draft | 2026-07-31 | — | NO |

**Reading of the imminent tier:** BUNDLE-11 is `reconciling` *right now* and the
`ready_to_reconcile` tail has not been swept. Their absence from the story tree is
expected, not drift, and is recorded here as the ledger baseline for the next check —
none of them is counted as a violation below.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-83 `story-d0a8cfad` (upgrade, uat_coverage=pass) | REQ-79, REQ-82, REQ-84, REQ-87, REQ-90, REQ-91 | **drifted** — body is accurate and well-evidenced for its six intents (spot-checked: `l1SlotSchema.behavior` + `.strict()` at `packages/site-schema/src/l1/schema.ts:314-325`; `data-l1-slot`/`data-l1-behavior` at `packages/framework/src/l1/render.ts:450-454`; hex-only colour at `schema.ts:19-24`), but it asserts the pre-REQ-93 slot semantics as current. Findings 1, 2 |
| STORY-80 `story-c490f1cf` (upgrade, uat_coverage=pass) | REQ-79, REQ-84 (origin REQ-58) | aligned — the absolute-literal base and the "no `absolute OR role` union in L1" rule both match REQ-79 principle #2 and the code. Overlap concern only (Finding 6) |
| STORY-81 `story-3569e1a4` (archived) | REQ-79, REQ-84 | aligned on behaviour (dials + `navCollapse` deleted, re-homed on geometry keyframes; confirmed no `navCollapse` symbol in `packages/`/`tools/`); container prose now stale (Finding 7) |
| STORY-82 `story-46e3b3c7` (upgrade, uat_coverage=**stale**) | REQ-79, REQ-84, REQ-85 | **drifted** — never updated for REQ-87, and asserts an L1 capability REQ-79 explicitly forbids. Findings 3, 4; overlap concern (Finding 6) |
| STORY-85 `story-179b8c06` (upgrade, uat_coverage=pass) | REQ-79, REQ-85, REQ-87 | aligned — verified against code (`kind: 'behavior'` in `modules/behavior.ts:87`, `carousel/meta.ts:17-18` v2, `contact-form/meta.ts:19-20` v3, `capabilities.js` deliberately unrenamed at `tools/generate/src/render/render.ts:136,188`). Shares the REQ-93 gap (Finding 1) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-83 + STORY-85 | story-body-edit | REQ-93 (`request-f26cbe32`, free_and_reconciled, 2026-07-25) asks that an L1 page bind behavior-module instances to named `slot` seams (validated: unbound module, dangling name, double-bound, orphan seam), that `renderL1Document` mount the bound module's fragment into the slot, and that a `mountInL1` conformance fixture run the universal ACs against the mounted shape. Nothing in this capability's story tree expresses it. STORY-83 owns the renderer and the `slot` leaf; STORY-85 owns the behavior contract and conformance — the ask straddles both and lands in neither. Not covered elsewhere either: STORY-84 (CAP-71) still states "A form control is always routed to a residual"; STORY-86 (CAP-73) does not mention mounting | Add the slot-binding + mounted-render + `mountInL1` conformance surface to STORY-83 (renderer/slot side) and STORY-85 (contract/conformance side) — **but see Finding 5 first: the branch does not implement it** |
| 2 | violation | consistency | STORY-83 `story-d0a8cfad` | story-body-edit | Story body positively asserts the state REQ-93 superseded, in two places: (a) "**Out of scope**: … behavior-module mounting into `slot` leaves (REQ-85, a separate story)" — REQ-93 re-homed that mounting in the L1 renderer, not REQ-85; (b) "In L1, a `slot` renders as an inert labelled placeholder — a `div` carrying its slot name and, when declared, its target behavior-module id, with no module code and no behaviour attached." REQ-93 §4 replaces exactly that placeholder with the mounted fragment | Remove the "no module code and no behaviour attached" assertion and re-point the out-of-scope line from REQ-85 to whichever story takes the REQ-93 surface |
| 3 | violation | consistency | STORY-82 `story-46e3b3c7` | story-body-edit | Body names the retired runtime type throughout: "reframed `contact-form` … into a **capability module**", "contact-form presentation via its **capability config** plus named L1 slots", "validated as an L1 subtree by the **capability validators**", "the **capability-module contract** (see the **Capability Modules story**)", and `## Dependencies` → "the **Capability Modules story**". REQ-87 (`request-84af044b`, free_and_reconciled, 2026-07-21) renamed the type to *behavior module* **with no back-compat alias**, precisely to free "capability" to mean only the XGD matrix, and its scope includes updating the prose that names it. The successor story is STORY-85 "Behavior modules"; STORY-85's own body records the no-alias rule. STORY-82 was last touched by BUNDLE-7 (2026-07-22) and never swept by REQ-87 | Replace every "capability module / capability config / capability validators / Capability Modules story" with the `behavior` equivalents and re-point the dependency at STORY-85 |
| 4 | violation | consistency | STORY-82 `story-46e3b3c7` | story-body-edit | Body claims L1 leaf axes may carry a role: "each L1 box/text/image node carries its own validated colour / border / opacity literals **(or a named overlay role)**", and again "L1 leaf axes (colour/border/opacity literals **or overlay roles**)". REQ-79 language-triviality principle #2 forbids theme-role indirection *in* L1; STORY-80 states the rule directly ("the substrate carries the literal, not an `absolute OR role` union") and the capability body parks the named overlay in L2. Code agrees: `packages/site-schema/src/l1/schema.ts:19-24` is hex-only, and the file contains zero `role`/`token`/`palette` references | Delete both "(or a named overlay role)" clauses; the named overlay is L2, not an L1 leaf axis |
| 5 | needs_review | coverage | STORY-83 + STORY-85 (REQ-93) | — | REQ-93 is `free_and_reconciled` and its bundle BUNDLE-10 (`bundle-4ff83a8b`) is `free_and_reconciled` with `merged_at_commit` 2d59a3b63 — **but none of REQ-93's implementation is on `main` or on this regression branch.** Direct evidence: `packages/site-schema/src/schema.ts:485-546` — `moduleInstanceSchema` has no `slot` field and `pageSchema.superRefine` still enforces REQ-88's strict XOR ("a page is either a module stack or a raw L1 document, not both"); `packages/framework/src/l1/render.ts:450-454` still emits the inert placeholder ("Phase-D seam: an inert, labelled placeholder in B1"); `tools/generate/src/l1/fold.ts:376` still maps `control → 'field'` residual; no `packages/site-schema/src/l1/slots.ts`, no `tools/generate/src/l1/forms.ts`, no `controlType`/`formAction`, no `mountInL1`, no `tests/req93-*`. `git log b1bd5b6..main -- packages/ tools/` returns one workflow commit. REQ-93's own `fields.commits[0].main_sha` is `null`; its code exists only on `xgd-working` (71ba1177a) and the unmerged `reconcile-BUNDLE-10` (4547f9183). **Cannot determine** whether the matrix should document REQ-93 (and the code needs re-landing) or whether the reconciled status is premature. Do not guess | Escalate to operator. Do **not** author a story body describing mounting behaviour this branch does not implement — that would replace one drift with a worse one. Resolve the code/status question first, then apply Findings 1 and 2 |
| 6 | warning | exclusivity | STORY-80 + STORY-82 vs STORY-83 + STORY-85 | story-body-edit (merge) | STORY-80 and STORY-82 are self-declared **repointer** stories: STORY-80 — "Detailed L1 axis + envelope coverage is owned by the L1 substrate story (item 1); this story's AC is the repointer for the absolute-base capability so it is not orphaned by the module-dial deletion"; STORY-82 — "In scope for this upgrade: repoint the story's ACs … Out of scope: the L1 substrate itself … and the capability-module contract … this story documents that the *reproduction treatments* are re-homed there". Their stated reason to exist was that they sat in sibling capabilities (CAP-67 / CAP-69) that REQ-84's deletion would otherwise orphan. The 2026-08-05 consolidation moved them into the same capability as the stories they point at, so both now point intra-capability at STORY-83 / STORY-85. **Precedent is on record inside this same tree**: STORY-81/CAP-68 was retired on exactly this reasoning — "a hollow pointer would duplicate ownership CAP-70/CAP-71 already hold" — and archived with its single AC folded into AC-684 | Consider folding STORY-80 into STORY-83 and STORY-82 into STORY-83/STORY-85, following the STORY-81 precedent (fold provenance notes into the surviving ACs rather than deleting) |
| 7 | warning | consistency | STORY-81 `story-3569e1a4` (archived) | story-body-edit | Body states "This story is therefore archived under a **superseded** capability" and "No thin L1-repointing AC is retained **under CAP-68**". The 2026-08-05 rebalance reassigned `fields.capability_uid` to `capability-ae9d65d6` (CAP-70, `active`); CAP-68 (`capability-bd0b722e`) remains `superseded` but no longer owns this story | Update the container disposition paragraph to record the 2026-08-05 reassignment to CAP-70 |
| 8 | info | — | STORY-82 `story-46e3b3c7` | — | `fields.uat_coverage = "stale"` while STORY-80/81/83/85 are all `pass`. Consistent with Findings 3/4: this is the one story the post-REQ-87 sweeps missed | none — will resolve when the body is repaired and coverage re-runs |
| 9 | info | — | STORY-83 `story-d0a8cfad` | — | The REQ-91/REQ-90 "language power / language form" sections, the REQ-87 slot-rename note (AC-686), and the AC-723 attribute obligation all verify clean against code. The STORY-81 merge note is accurate | none |

## Notes for the Editor

**One root cause explains Findings 1, 2 and 5.** REQ-88 introduced the page-shape
XOR; REQ-93 is its declared successor and narrows it to slot-bound mounting. The
matrix stopped at REQ-88. Whatever the operator decides on Finding 5, Findings 1
and 2 must be applied together — repairing only the STORY-83 body text without
adding the coverage would leave the slot seam undescribed on both sides.

**One root cause explains Findings 3 and 4.** STORY-82 is the only story in this
capability whose body has not been touched since BUNDLE-7 (2026-07-22), so it
missed the REQ-87 rename sweep (2026-07-21, landed on `main` as
`a270e8836`) and it predates STORY-80's explicit statement of the no-role-in-L1
rule. Its `uat_coverage=stale` (Finding 8) is the same signal from a different
angle. If Finding 6 is taken and STORY-82 is folded into STORY-83/STORY-85, both
findings dissolve with it — worth deciding Finding 6 *before* editing STORY-82's
prose, to avoid repairing a body that is about to be merged away.

**Cross-capability spillover (not counted here, flagged for the CAP-71 run).**
REQ-93 also changes the fold: captured form controls cluster into `slot` nodes
(`behavior: 'contact-form'`) instead of `field` residuals. STORY-84
(`story-8acc338d`, CAP-71) still states "A form control is always routed to a
residual — it belongs to a behavior module, never to a synthesized raw L1 leaf",
and STORY-86 (`story-24098299`, CAP-73) does not mention mounted modules. The same
needs_review disposition applies there.

**Matrix hygiene observation (capability level, out of scope for this check).**
The 2026-08-05 consolidation left CAP-67 (`capability-6e088083`), CAP-69
(`capability-938f26ec`) and CAP-72 (`capability-ce902be4`) with status `active`
and zero stories, even though CAP-70's History section records them as merged in.
CAP-68 was correctly marked `superseded`. The same pattern appears on the diff
side (CAP-64/65/66). Worth a capability-level sweep.
