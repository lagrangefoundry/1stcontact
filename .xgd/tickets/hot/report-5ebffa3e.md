---
uid: report-5ebffa3e
id: REPORT-1288
type: report
title: 'Capability-Intent Alignment: reproduction-module-treatments (level=uat)'
created_by: xgd
created_at: '2026-08-05T18:37:30.856317+00:00'
updated_at: '2026-08-05T18:37:30.856317+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-938f26ec
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: reproduction-module-treatments
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Headline

**CAP-69 holds zero matrix elements.** Its sole story, STORY-82
(`story-46e3b3c7`), was reassigned to CAP-70 `capability-ae9d65d6`
("Framework Substrate: L1 Layout, Values & Behavior Modules") by the
2026-08-05 structural rebalance — the absorption the capability body records.
With no stories, there are no ACs and no UATs in scope, so the uat-level
consistency / coverage / exclusivity checks are vacuously satisfied.

The story row that still appears under this capability is a **stale duplicate
index entry**, not real dual ownership (see Notes for the Editor). To make the
verdict robust against that defect, the uat level was ALSO evaluated under the
worst-case reading that STORY-82 is still in scope — it passes that way too.
Both readings agree: PASS.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Only two bundles
appear in the `intent_uid` / `updated_by` chain of CAP-69 and STORY-82.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 `bundle-ab9e0cb6` (REQ-58 + REQ-59 + REQ-62 + REQ-61) | free_and_reconciled | 2026-07-18 (merged @ `7a42e18`) | gigabytealchemy reproduction pass 3; forced the card veil/border, footer copyright + text/link colour, and compact/placeholder/inline contact-form treatments onto the framework as per-module dials on `services-grid` / `footer` / `contact-form`. Created CAP-69 and STORY-82. | YES |
| BUNDLE-7 `bundle-31e474b9` (REQ-63, REQ-79, REQ-82, REQ-83, REQ-84, REQ-85, REQ-86) | free_and_reconciled | 2026-07-22 (merged @ `edeb1c2c`) | The framework pivot. REQ-84 deleted `services-grid`/`footer`/`header`/`hero`/`text-block`/`layer` + ~20 dials, re-homing the card/footer look onto **L1 leaf axes**. REQ-85 reframed `contact-form` into a **capability module** (typed behavioural config + named `intro`/`submit` L1 slots; field labelling demoted from dial to core a11y obligation). Retired the eight module-dial ACs (AC-674..681); repointed STORY-82 onto AC-718 + AC-719. `updated_by` on both CAP-69 and STORY-82. | YES (supersedes BUNDLE-6's mechanism, preserves its treatments) |

Later bundles were scanned for anything that would retire or extend the two
surviving ACs' behaviour; none does, and none names CAP-69 or STORY-82 in its
chain:

| Intent ID | Status | When | Relevance to CAP-69 | Counts? |
|---|---|---|---|---|
| BUNDLE-8 `bundle-cceaba25` (REQ-89..92, BUG-6..11) | free_and_reconciled | 2026-07-29 | L1 axis extension + fold/capture repair — CAP-70 territory. Does not touch the reproduction treatments' authoring surface. | YES, but out of this capability's scope |
| BUNDLE-10 `bundle-4ff83a8b` (REQ-88, REQ-93, BUG-12..25) | free_and_reconciled | 2026-08-05 | L1 reproduction pipeline + behavior modules in L1 slots. BUG-24 (colour alpha representable) *reinforces* the frosted-veil alpha literal AC-719 asserts; it does not retire it. | YES, but out of this capability's scope |
| BUNDLE-9 `bundle-b486324c` (REQ-94..107, BUG-27, BUG-28) | reconciling | 2026-08-05 | **Imminent.** L1 expressivity + envelope enforcement. BUG-28 concerns contact-form `mailto:`/`tel:` *action* handling — functional config, not the presentation treatments AC-718 covers. No retirement of either AC. | imminent; no effect on this level |

Net cumulative intent for this capability: the reproduction treatments remain
in-intent, delivered through (a) L1 leaf axes and (b) contact-form capability
config + L1 slots — exactly what AC-718/AC-719 describe. Post-pivot ownership of
those two surfaces sits with CAP-70, which is why the rebalance moved the story
there.

## Alignment Ledger

### As the matrix actually stands (authoritative)

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-69 (this capability) | BUNDLE-6 (origin), BUNDLE-7 (pivot) | Zero stories, zero ACs, zero UATs. Absorbed into CAP-70 2026-08-05; retained as historical pointer (`fields.merged_into = capability-ae9d65d6`). No uat-level elements to assess — vacuously aligned. |

### Worst-case reading — STORY-82 treated as still in scope

Recorded so the verdict does not depend on resolving the index defect.

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-82 `story-46e3b3c7` (`story_kind: upgrade`) | BUNDLE-6, BUNDLE-7 | aligned — body describes the post-pivot mechanism; correctly records AC-674..681 as archived-superseded |
| AC-719 `acceptance_criterion-da7c62ec` — card/band + footer treatments via L1 leaf axes | BUNDLE-6 (treatment), BUNDLE-7/REQ-84 (mechanism) | aligned; covered by one substantive UAT |
| └ `test_UAT_AC719_card_and_footer_treatments_authored_as_l1_leaf_axes` (`tests/reconciliation-reproduction-treatments.test.ts:32`) | — | **substantive, exercises its AC.** Hits three real boundaries: the live module `registry` (asserts catalog is exactly `carousel@2` + `contact-form@3`, and `getModule` throws for each of the six deleted modules — the dial mechanism is provably gone), `validateL1` (accepts the authored tree; rejects a non-hex `rgba()` colour and an unknown freeform `style` key), and `renderL1Document` (emits the `#f8fafccc` translucent veil, emits **no** border declaration, emits the verbatim copyright line and the two departing `#94a3b8` / `#38bdf8` colour literals). Covers every clause of the AC's Verification block. Not an AST/structural-only check. **PASSES.** |
| AC-718 `acceptance_criterion-f3328e22` — contact-form presentation via capability config + L1 slots | BUNDLE-6 (treatment), BUNDLE-7/REQ-85 (mechanism) | aligned; covered by one substantive UAT |
| └ `test_UAT_AC718_contact_form_presentation_via_config_and_l1_slots` (`tests/reconciliation-reproduction-treatments.test.ts:126`) | — | **substantive, exercises its AC.** Asserts `contactFormMeta.config` keys are exactly `action`/`fields`/`successMessage` with no `fieldLabels`/`submitInline`/`submitColor`, and `slots` are exactly `intro`/`submit`; then performs **real SSR** via `experimental_AstroContainer` on the actual `ContactForm` component — with an L1 subtree in the `submit` slot (asserts the namespaced fragment class and its `background-color: #e11d48` reach the output), and with the slot absent (asserts the plain functional button, no authored colour). Finally asserts the `<label for="cf-name">` / `<label for="cf-email">` bindings render in **both** variants, proving labelling is a core obligation and not presentation-dependent. Covers every clause of the AC's Verification block. **PASSES.** |

**Exclusivity**: the two UATs address disjoint surfaces (L1 leaf axes vs.
contact-form capability config/slots) and use different shapes (validator +
renderer vs. component SSR). Not duplicates. A grep across the repo for
`test_UAT_AC718` / `test_UAT_AC719` returns exactly one definition each — no
redundant same-shape coverage elsewhere.

**Execution evidence**: `npx vitest run tests/reconciliation-reproduction-treatments.test.ts`
→ `Test Files 1 passed (1) / Tests 2 passed (2)`, 500ms. Both ACs' `uat_coverage: pass`
flags are accurate.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | CAP-69 | — | Capability holds zero stories following the 2026-08-05 absorption into CAP-70 (`fields.merged_into = capability-ae9d65d6`). uat-level checks are vacuous — no ACs, no UATs in scope. | none |
| 2 | info | consistency | CAP-69 index entry | — | The ticket index returns STORY-82 **twice** — once at `UPDATE:2026-08-05` under CAP-70 (correct) and once at `UPDATE:2026-07-24` under CAP-69 (stale, pre-rebalance). The ticket's own `fields.capability_uid` is unambiguously `capability-ae9d65d6`. Infrastructure defect, not matrix drift; already recorded in the capability body. | none at matrix level — index rebuild (see Notes) |
| 3 | info | consistency | CAP-69 `status` | — | `status: active` and `uat_coverage: pass` persist on an absorbed, story-less capability. The body explicitly documents that `status: deprecated` could not be set in the rebalance run due to the index defect above. Known and disclosed, not undisclosed drift. | none this cycle |
| 4 | info | consistency | AC-719 / AC-718 UATs | — | Under the worst-case in-scope reading, both ACs have exactly one substantive, passing UAT exercising real entry points; neither is a structural/AST-only check; they are not duplicates of each other. | none |

## Notes for the Editor

**Nothing to edit in the matrix.** All four findings are `info`. No
`uat-add`, `uat-edit`, `ac-*`, `story-body-edit`, or `code-issue` action is
required at this level, under either reading of the index state.

**The one real problem is infrastructure, not matrix content.** The ticket
index carries a duplicate, stale row for STORY-82 that still points at
CAP-69. Three independent observations confirm it is an index defect rather
than genuine dual ownership:

1. `xgd ticket get story-46e3b3c7` reports `capability_uid: capability-ae9d65d6`
   — a single, unambiguous value.
2. `xgd ticket list --type story` returns STORY-82 **twice**, with different
   `UPDATE:` timestamps (2026-08-05 under CAP-70, 2026-07-24 under CAP-69) —
   a pre- and post-rebalance row coexisting.
3. `xgd ticket get STORY-82` (by display ID) fails with
   `Error: Ticket ID STORY-82 not found`, while lookup by UID succeeds — the
   duplicate has broken display-ID resolution entirely.

This is the "blocking index defect" the CAP-69 body points at. It is an XGD
**tooling** issue (index integrity), not a defect in the project under
development, so it is not actionable by a matrix editor. Two consequences a
downstream consumer should be aware of:

- Any workflow that enumerates stories via the index will double-count
  STORY-82 and may attribute it to the wrong capability.
- CAP-69 cannot be moved to `status: deprecated` until the index is rebuilt,
  so it will keep surfacing as an `active` capability in validation sweeps.

Until the index is rebuilt, treat `fields.capability_uid` on the ticket itself
as authoritative over the index listing.

**Why this capability is legitimately empty.** The absorption is coherent with
the intent ledger rather than an arbitrary reshuffle. BUNDLE-7 moved the two
surfaces that carry these treatments (L1 leaf axes; the contact-form capability
contract) into framework-substrate territory, and every subsequent bundle
(BUNDLE-8, BUNDLE-10, and the imminent BUNDLE-9) has continued to develop those
same surfaces. CAP-70 is where that work now lands, so STORY-82 belongs with it.
The reproduction treatments themselves remain fully in-intent and fully
evidenced — the evidence simply lives under CAP-70 now.

**Level-cascade note.** Per uat-level priority, AC bodies were the working
reference and were not re-litigated against intent; the intent ledger was
consulted only to confirm no later reconciled or imminent intent retires
AC-718 or AC-719. None does.
