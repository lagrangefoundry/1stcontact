---
uid: report-cdc26db2
id: REPORT-2404
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=story)'
created_by: xgd
created_at: '2026-08-20T07:52:04.955506+00:00'
updated_at: '2026-08-20T07:52:04.955506+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

This is the re-check following fix attempt 7 (REPORT-2403, `report-dd3fa892`),
which answered REPORT-2402 (`report-98fc4532`, 6 violations + 1 warning). Every
one of those seven findings was re-verified independently against the current
ticket bodies **and** against the cited code — not accepted on the fix report's
say-so. All seven are resolved. An independent sweep of the remaining four
stories and of the intent ledger for newly-reconciled intents found nothing new.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Bundles are listed
by the constituent intents relevant to CAP-70; unrelated members are elided.
Re-confirmed this call — no status changed since REPORT-2402, and no intent
reconciled after 2026-08-17 touches this capability.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-58/59/61/62 (BUNDLE-6, `bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-19 | Pre-pivot module dials — absolute values, per-breakpoint dials, reproduction treatments | YES (mostly superseded below) |
| REQ-63/79/82/83/84 + 2 (BUNDLE-7, `bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Framework pivot: L1 substrate + safety envelope; semantic layout modules and their ~20 dials deleted | YES (retires the BUNDLE-6 delivery) |
| REQ-85 (`request-015e42ac`) | free_and_reconciled | pivot D | Module contract; reframed carousel & contact-form | YES |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-23 | L1 resource table + `@font-face`; typed axes for every captured pixel-mover | YES |
| REQ-87 (`request-84af044b`) | free_and_reconciled | 2026-07-24 | `capability module` → **behavior module**; `Capability*` → `Behavior*`; **no back-compat alias** | YES |
| REQ-93 (`request-f26cbe32`, via BUNDLE-10 `bundle-4ff83a8b`) | free_and_reconciled | 2026-08-05 | L1 pages host behavior modules in their slots: slot-bound mounting, page-level binding validation, renderer mounts the fragment, `mountInL1` conformance mode, `labelMode` config | YES |
| REQ-96…107 + BUG-28 (BUNDLE-11, `bundle-ee56a66e`) | free_and_reconciled | 2026-08-06 | `control` leaf + zero-CSS contract (deleting `config.view` and the `intro`/`submit` slots); shared axis groups; interaction/motion/texture; layout track; link role; client-side isolation | YES |
| REQ-108…113 + BUG-30 (BUNDLE-13, `bundle-e0143ffa`) | free_and_reconciled | 2026-08-06 | Pointer accent; relocatable document-relative emission | YES |
| BUG-31 + REQ-114 + REQ-116 (BUNDLE-14, `bundle-0385746c`) | free_and_reconciled | 2026-08-06 | Palette colour model; token colour palette retired; edit-render settled-state carve-out | YES |
| REQ-117 | free_and_reconciled | 2026-07-31+ | nowrap captured width becomes a floor | YES |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Image framing / shape / colour adjustment — substrate half | YES |
| BUG-34 + REQ-137 (BUNDLE-18, `bundle-d9226698`) | free_and_reconciled | 2026-08-17 | Palette `shade` on the reference replaces named `steps` | YES (retires steps) |
| REQ-145 (`request-b474390f`) | ready_to_reconcile | — | L1 render moves into workerd | imminent |
| REQ-148 (`request-7ae3c2cc`) | ready_to_reconcile | — | Behavior modules render in workerd; Astro deleted from the module render path | imminent |
| BUG-35 (`bug-1bde3bf9`) | bundled | 2026-08-13 | Copy-modal preview box: UA reset blocks `text-transform`/`letter-spacing` on the text control | imminent — **but builder chrome CSS (`builder.css` / `fields.css`), not L1. Not this capability.** |
| REQ-112 / REQ-134 | abandoned | — | — | NO |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-80 (`story-c490f1cf`) — absolute values + palette overlay | BUNDLE-6 → REQ-79/84, REQ-114, REQ-137 | aligned — scanned for retired vocabulary; the three `steps` mentions are all the REQ-137 *replacement* framing ("the entry schema has no `steps` field and the reference has no `step`; both are gone"), which is correct, not residue |
| STORY-81 (`story-3569e1a4`) — responsive layout track | BUNDLE-6 (archived delivery), REQ-104 | aligned — body correctly records the pre-pivot dial delivery (incl. `navCollapse`) as deleted and REQ-104 as the reviving intent |
| STORY-82 (`story-46e3b3c7`) — reproduction treatments | BUNDLE-6, REQ-79/84, REQ-85, REQ-87, REQ-93, REQ-96 | **aligned (repaired this cycle)** — body rewritten against contact-form v4; findings 4/5/6 all verified closed in code |
| STORY-83 (`story-d0a8cfad`) — L1 substrate | REQ-79/82/84, REQ-87, REQ-90/91, REQ-93, REQ-96…107, REQ-109/BUG-30, REQ-114, REQ-117, REQ-136 | **aligned (repaired this cycle)** — seam emission now in scope; the inert-slot claim now bound/unbound-qualified; the STORY-81 merge note now records REQ-104's revival |
| STORY-85 (`story-179b8c06`) — behavior modules | REQ-85, REQ-87, REQ-93, REQ-96, BUG-28, REQ-116 | **aligned (repaired this cycle)** — the REQ-93 page composition rule and its rejection table are present and match the code exactly; `mountInL1` recorded |
| STORY-90 (`story-d2b5cb1c`) — interaction / motion / pointer accent | REQ-99, REQ-100, REQ-108 | aligned — no retired vocabulary; scope paragraphs intact |
| STORY-91 (`story-2e4e2c45`) — L1 navigation | REQ-106 | aligned (status `completed`) |
| — | REQ-93 | **now owned** — the schema half on STORY-85, the renderer half on STORY-83, `mountInL1` on STORY-85, `labelMode` on STORY-82, the fold half on STORY-84 (CAP-71). No layer unowned. |

## Verification of the Previous Cycle's Findings

Each prior finding re-checked against the live ticket body and the named source file.

| Prior # | Claim now in the matrix | Verified at | Status |
|---|---|---|---|
| 1 (coverage, STORY-85) | "Where a behaviour sits on the page — the composition rule" section + 5-row rejection table + In-scope line | `packages/site-schema/src/schema.ts:523-608` — the four module-side rejections (`no L1 to mount into` :548-556, `must name the L1 slot` :571-579, `no slot named` :581-589, `bound by more than one module` :591-598) plus duplicate-seam-name (:559-566) | **resolved** |
| 2 (coverage, STORY-83 + STORY-85) | Renderer seam emission in STORY-83's In-scope; `mountInL1` in STORY-85's Technical Context | `render.ts:1816` (`mounts?: Readonly<Record<string,string>>`), `:2347`, `:2380`; `tools/generate/src/conformance/harness.ts:140` + `types.ts:92` | **resolved** |
| 3 (consistency, STORY-83) | Unconditional "a `slot` renders inert" replaced by an explicit bound/unbound split; unbound declared legal | `render.ts:2119-2122` — `const mounted = state.mounts?.[node.name] ?? ''` then `>${mounted}</div>`; same `data-l1-slot` / `data-l1-behavior` attributes either way | **resolved** |
| 4 (consistency, STORY-82) | Every `Capability*` name replaced with the `Behavior*` equivalent | Body scanned: zero occurrences of `capability module` / `capability config` / `capability validators`; now names `validateBehaviorSlots` / `validateBehaviorInstance` and STORY-85, and cites REQ-87's no-alias rule | **resolved** |
| 5 (consistency, STORY-82) | Repointed to one **required** `form` slot with `control` leaves; `intro`/`submit` recorded as deleted | `modules/contact-form/meta.ts:58-65` — `slots: { form: { required: true } }`, `controls.field` / `submit`; grep for `intro` slot returns nothing | **resolved** |
| 6 (consistency, STORY-82) | `fieldLabels=placeholder` removed from the deleted-dials list; `labelMode` recorded as surviving behavioural config carrying an a11y fact | `meta.ts:47` — `labelMode: { type: 'enum', values: ['visible','placeholder'], default: 'visible' }`; grep for `fieldLabels` across `packages/framework/src/modules/` returns nothing | **resolved** |
| 7 (warning, STORY-83) | "now archived" dropped; REQ-104's revival recorded with the scope split (length keyframes here vs per-width layout mode on STORY-81) | STORY-83 body, "Merged from STORY-81" section: "STORY-81 stood archived from 2026-07-23 until REQ-104 (reconciled 2026-08-06) revived it… Read the merge note above as historical, and STORY-81 as live." | **resolved** |

Independently confirmed absent from code (so the matrix is not describing dead
surfaces): `submitColor`, `submitInline`, `fieldLabels`, carousel `config.view`
— grep over `packages/framework/src/modules/` returns zero matches for all four.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-82 (`story-46e3b3c7`) | story-body-edit | The body's closing `## Story Points` section reads `2` while the durable field `fields.story_points` reads `3`. Not intent drift — no intent in the ledger speaks to story points — but the two faces of the same element disagree, and the body is the face a reader sees. Every other story in the capability agrees with its field (STORY-81: body 2 / field 2; STORY-85: body 3 / field 3). | Make the body's `## Story Points` value match `fields.story_points` (or update the field if 2 is the intended estimate). Cosmetic; does not block the level. |

No violations. No `needs_review` items.

## Notes for the Editor

**The fix report's correction to REPORT-2402 finding 1 is upheld.** REPORT-2403
challenged the prior report's fourth rejection case ("an orphan seam no module
binds"), arguing the code neither rejects it nor should. I read `schema.ts:523-608`
directly and confirm: the `bound` set is accumulated (`:569`, `:599`) but is never
diffed against `available`, so an unbound seam passes validation. That is correct
behaviour and consistent with `render.ts:2109` ("with no mount it stays the inert,
labelled placeholder") and with prior finding 3. STORY-85's table — four module-side
rejections plus the duplicate-seam-name ambiguity — is an accurate description of
the code, and STORY-83's "leaving a seam unbound is legal, not an error" is correct.
**No `code-issue` should be raised against `schema.ts` on this point**; the prior
report's enumeration was the error, and it has been corrected in the right direction.

**The STORY-83 / STORY-85 seam split is clean, with no double-ownership.**
The repair could easily have left both stories claiming the mount. It did not:
STORY-83's Out-of-scope hands the *composition rule* to STORY-85 ("of which this
story carries only what the renderer emits once a binding has already been
proved"), and STORY-85's Out-of-scope hands the *emission* back to STORY-83 ("this
story stopping at whether a binding is valid"). The two paragraphs are mutual and
non-overlapping. No exclusivity finding.

**STORY-82 remains thin but is not an exclusivity violation**, for the same reason
REPORT-2402 gave: the capability body lists "Reproduction treatments" as its own
scope area, and STORY-82 now scopes itself explicitly to documenting that those
treatments are *re-homed* onto L1 axes and the `form` slot, deferring both
mechanisms to STORY-83 and STORY-85 in its Out-of-scope line.

**Downstream levels are unblocked but not clean.** Story-level alignment passes;
that does not clear the AC/UAT levels, which run next and carry known state:
STORY-82 `uat_coverage: stale`, STORY-83 and STORY-85 `uat_coverage: fail`, and
the capability's own `uat_coverage: fail`. In particular, REQ-93's page
composition rule is now expressed in a story body for the first time — the AC
level should expect to find no AC covering it, and the UAT level no test. That is
the correct cascade, not a regression: a story-level coverage gap repaired this
cycle surfaces as an AC-level gap next cycle. AC-718 was durably deprecated by the
fix (`status: deprecated`, lineage body citing REQ-96 and REQ-93); its
`fields.lifecycle: deprecated` key is an invented field left in place, which the
AC level may want to raise as hygiene.

**Two imminent intents will move this capability again.** REQ-145 and REQ-148 are
both still `ready_to_reconcile` (re-checked this call — unchanged). REQ-148 changes
the behavior-module contract itself, deleting Astro from the module render path and
replacing `AstroComponentFactory` with `BehaviorComponent`, so STORY-85 should be
expected to take a further upgrade once it reconciles. Neither is a violation now;
they are recorded so the next check can distinguish "not yet reconciled" from
"dropped".

**Nothing new entered the ledger.** I swept all requests and bugs created since the
last reconciled intent touching this capability (BUNDLE-18, 2026-08-17). The only
candidate that reads as substrate-adjacent is BUG-35 (`bundled`, "Capitalisation
never previews — UA reset blocks `text-transform`"), and its own root-cause section
places it squarely in builder chrome (`builder.css` `.builder-modal__box`,
`fields.css` `.fields-control`) rather than in L1 or a behavior module. It belongs
to the builder capability, not here. REQ-150 is `free_coding` and does not count.
