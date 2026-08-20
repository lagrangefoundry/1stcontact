---
uid: report-5235c57a
id: REPORT-2409
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=ac)'
created_by: xgd
created_at: '2026-08-20T08:28:09.442387+00:00'
updated_at: '2026-08-20T08:28:09.442387+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Anchor report: report-2485c83c · Capability: capability-ae9d65d6 (CAP-70) · Previous attempts: 9

## Summary — the one-edit cycle landed; the level is clean

This is the tenth ac cycle and the first to return PASS. `report-efb09896`
(attempt 9's assessor) left exactly one violation — STORY-83's In-scope clause on
**per-instance class prefix namespacing**, claimed by no AC. `report-ff7b11c4`
(fix attempt 9) closed it by widening AC-723 rather than authoring a new AC, as
directed. I re-derived that fix against the ticket, the production code and an
executed test run rather than taking the report's word, and it holds on all three.

I then re-walked every story's In-scope surface against its ACs from scratch —
not just the area the fix touched — and found no uncovered clause, no AC
describing behaviour its story has retired, and no duplicated criterion.

## Cumulative Intent Considered

The story level is green going in — `report-cdc26db2` (2026-08-20 07:52) returned
PASS / 0 violations — so story bodies are my working reference, as the level rules
prescribe. No upper layer proved ambiguous this pass, so I escalated to intent
nowhere. The ledger is carried forward from that cycle and re-checked for anything
reaching a counting status since; nothing has.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-58/59/61/62 (BUNDLE-6, `bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-19 | Pre-pivot module dials | YES (superseded below) |
| REQ-63/79/82/83/84 (BUNDLE-7, `bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Framework pivot: L1 substrate + safety envelope; semantic layout modules and their ~20 dials deleted | YES (retires the BUNDLE-6 delivery) |
| REQ-85 (`request-015e42ac`) | free_and_reconciled | pivot D | Behavior contract; reframed carousel & contact-form | YES |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-23 | L1 resource table + `@font-face`; typed axes for every captured pixel-mover | YES |
| REQ-87 (`request-84af044b`) | free_and_reconciled | 2026-07-24 | `capability module` → **behavior module**; no back-compat alias | YES |
| REQ-93 (`request-f26cbe32`, BUNDLE-10) | free_and_reconciled | 2026-08-05 | Page-level slot binding + rejections; renderer mounts the fragment; `mountInL1`; `labelMode` | YES — fully covered (AC-1343, AC-1344, AC-723) |
| REQ-96…107 + BUG-28 (BUNDLE-11, `bundle-ee56a66e`) | free_and_reconciled | 2026-08-06 | `control` leaf + zero-CSS contract; shared axis groups; interaction/motion/texture; layout track; link role; client isolation | YES |
| REQ-108…113 + BUG-30 (BUNDLE-13) | free_and_reconciled | 2026-08-06 | Pointer accent; relocatable document-relative emission | YES |
| BUG-31 + REQ-114 + REQ-116 (BUNDLE-14, `bundle-0385746c`) | free_and_reconciled | 2026-08-06 | Palette colour model; closed colour-role vocabulary deleted; edit-render settled state | YES |
| REQ-117 | free_and_reconciled | 2026-07-31+ | nowrap captured width becomes a floor | YES (AC-1009…1012) |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Image framing / shape / colour adjustment | YES (AC-1124…1128) |
| BUG-34 + REQ-137 (BUNDLE-18, `bundle-d9226698`) | free_and_reconciled | 2026-08-17 | Palette `shade` replaces named `steps` | YES (AC-928/931 rewritten, AC-1144/1145 added) |
| REQ-145 / REQ-148 | ready_to_reconcile | — | L1 + behavior-module render move into workerd; Astro deleted from the module render path | imminent — no ac gap; see note 3 |
| BUG-35 (`bug-1bde3bf9`) | bundled | 2026-08-13 | Copy-modal preview UA reset | imminent — builder chrome, not CAP-70 |
| REQ-112 / REQ-134 | abandoned | — | — | NO |

## Verification of attempt 9 — the single fix, re-derived three ways

| Check | Evidence | Outcome |
|---|---|---|
| The AC now claims the property | AC-723 (`acceptance_criterion-8db8ef76`, `updated_at` 2026-08-20T08:17:18) carries a **Per-instance class namespaces** paragraph between the *Bound* paragraph and the `data-l1-behavior` rename note, plus a third Verification step (two instances → disjoint class sets, per-instance selector scoping, no host collision, and the shared-prefix contrast case) | **closed** |
| The AC is code-accurate | `packages/framework/src/l1/render.ts:2428-2442`: `renderL1Fragment(nodes, prefix, …)` seeds `RenderState` with `prefix` and every subtree's classes are drawn from one counter as `<prefix>-l1-N`; the doc comment at `:2420-2426` states the same purpose. Production callers pass a per-instance value — `` `${instanceId}-form` `` (`modules/contact-form/index.astro:65`), `` `${instanceId}-slide` `` / `` `${instanceId}-dots` `` (`modules/carousel/index.astro:44,65`) | **accurate** |
| It is written to survive REQ-148 | The clause names no Astro file and states the obligation as "whoever renders a fragment supplies a value unique to that instance" — exactly the framing the previous cycle's editor note asked for, so deleting Astro from the module render path moves *who supplies* the prefix without touching the criterion | **holds** |
| The AC is not an immediate coverage gap | `tests/req93-l1-slot-mounted-behaviors.test.ts:365` — `test_UAT_AC723_two_instances_of_one_behavior_keep_disjoint_class_namespaces`. Real entry points (`renderL1Fragment`, `renderL1Document`), no mocks; asserts non-vacuous equal-sized class sets, empty intersection, `selected(css) === classesIn(html)` per instance, host-document tokens absent from both, and the shared-prefix contrast | **substantive** |
| It actually passes here | I ran it: `npm test -- tests/req93-l1-slot-mounted-behaviors.test.ts` → **10 passed, 1 failed**. The new test is green | **executed** |
| No exclusivity trap opened | No other AC in the capability asserts class namespacing; AC-723 already owned "what the renderer emits at the seam, on both sides of the mount", so the clause landed inside material it already held rather than restating a bound-seam setup | **clean** |

The one failure in that run is the pre-existing environment failure both prior
cycles recorded: `test_UAT_AC1344_*` throws `EPERM` from `server.listen`
(`tools/generate/src/cli/serve.ts:54` via `conformance/harness.ts:196`) because
this regression worktree denies socket binding. It is an unhandled exception
before any assertion, not an assertion failure, and is unchanged by attempt 9.

## Independent re-walk — all 7 stories, In-scope clause by clause

I did not scope this pass to the fixed area. Every story's In-scope list (and, for
STORY-80/83 whose claims sit in prose, every Description clause the body marks as a
claim of the story) was mapped to an owning AC.

| Story | In-scope clauses → owning ACs | Gap? |
|---|---|---|
| **STORY-83** (43 ACs) | typed shape → AC-682; shared axis groups → AC-802; `control` leaf → AC-806; framing/shape/adjustment + fixed-order + determinism → AC-1124/1125/1126/1127; resource table → AC-727/728; page-level colour → AC-934; envelope + authoring-path enforcement → AC-686/726/849/850; independence of the two lines → AC-851; geometry keyframes → AC-684; control emitter's three obligations → AC-806, attribute refusal → AC-807; relocatable emission + flat-snapshot → AC-888/889/890/891; one colour system → AC-933/935/936; round-trip + x-browser → AC-683/688; injection inert → AC-685; per-field errors → AC-687; texture family + layer order + bounds → AC-829/830/831/832; single painted node → AC-801; text measure → AC-803; seam measured through the slot → AC-804; background image → AC-805; nowrap floor cluster → AC-1009/1010/1011/1012; **seam emission both sides + per-instance namespacing → AC-723** | none |
| **STORY-85** (17 ACs) | contract + `Behavior*` naming → AC-697/698/704/722/808; instance validation & security line → AC-698/808; page composition rule + every rejection → AC-1343; zero-CSS + **both** carve-outs → AC-809; module chrome vs component source → AC-810; survivors' observable behaviour → AC-699/700/701; L2 preset → AC-811; shipped client JS → AC-702; isolation incl. its client half → AC-703/877/878; conformance in both shapes → AC-1344 | none |
| **STORY-80** (7 ACs) | literal base for length/geometry/radius → AC-716; palette shape + literal-or-reference → AC-928; dangling reference is a validation failure, never a fallback → AC-929; alpha and shade as axes of the reference → AC-930/1144; resolution once at the load boundary → AC-931; continuous Oklab shade incl. out-of-range-is-a-failure-not-a-clamp → AC-1144; entry stays the unit of change / shade only removes chroma / per-entry tally → AC-1145 | none |
| **STORY-81** (6 ACs) | per-width layout track → AC-833; wrapping row restated whole → AC-835; one cascade, two consumers → AC-835; ascending breakpoint serialization + visibility outranks the track → AC-836; control-row reflow & phantom-peer stagger → AC-834; pixel-neutral for pages declaring neither → AC-837; envelope rejects an incoherent track → AC-838 | none |
| **STORY-82** (2 ACs, 1 deprecated) | card/band + footer treatments on L1 leaf axes → AC-719; contact-form half truthfully deferred to AC-701 (re-verified: AC-701 does assert the required `form` slot, a `control` per field, the optional submit, inline-vs-stacked as ordinary L1 geometry, and the `placeholder`/hidden-label pairing) | none |
| **STORY-90** (19 ACs) | interaction deltas + one transition → AC-819/822; typed-values-only → AC-820/887; unauthorable focus indicator → AC-821; reduced motion → AC-823; entrance from/settle → AC-824; motion fails visible → AC-825/826; stagger → AC-827; entrance + interaction compose → AC-828; pointer accent → AC-879/880/881/882; accent fails visible → AC-883; byte-identical renders → AC-884; bounded rough region → AC-885/886 | none |
| **STORY-91** (10 ACs) | link as a role on any subtree, incl. authored accessible name → AC-839 (schema: `ariaLabel`, `packages/site-schema/src/l1/schema.ts:891`); image enclosure with no layout box → AC-840; new-context isolation always → AC-841; allowlist → AC-842; focus indicator kept → AC-843; paints from L1, not UA chrome → AC-844; identifier as anchor target → AC-845; duplicate identifier rejected → AC-846; link refused on a control/seam → AC-847; no-links page unchanged → AC-848 | none |

## Alignment Ledger

104 ACs across 7 stories (103 last cycle, +1 — AC-723 was widened, not added; the
count rises because AC-719 re-entered the index). All 7 stories are
`feature`/`upgrade`, so all are in scope for AC coverage.

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-80 · AC-716, 928, 929, 930, 931, 1144, 1145 (7) | REQ-84, REQ-114, REQ-137 | aligned |
| STORY-81 · AC-833–838 (6) | REQ-104 | aligned |
| STORY-82 · AC-718 (deprecated), AC-719 (2) | REQ-84, 85, 87, 93, 96, 114 | aligned; deprecation truthful, contact-form deferral verified against AC-701 |
| STORY-83 · 43 ACs (AC-682–688, 723, 725–728, 801–807, 829–832, 849–851, 888–891, 933–936, 1009–1012, 1124–1128) | REQ-82, 90, 91, 93, 97, 98, 103, 105, 106, 107, 109, 114, 117, 136 | **fully aligned** — the per-instance namespacing clause is claimed by AC-723 as of this cycle |
| STORY-85 · AC-697–704, 722, 808–811, 877, 878, 1343, 1344 (17) | REQ-85, 87, 93, 96, 116, BUG-28 | fully aligned |
| STORY-90 · AC-819–828, 879–887 (19) | REQ-99, REQ-100, REQ-108 | aligned |
| STORY-91 · AC-839–848 (10) | REQ-106 | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | — | attempt 9 (`report-ff7b11c4`) | — | The single carried violation is closed and independently verified on three axes: the AC now carries the clause, the clause matches `render.ts:2428-2442` and the production call sites, and its UAT is substantive and **executed green** in this worktree. Nothing else in the capability moved, which is what the previous cycle's editor note asked for | none |
| 2 | info | — | AC-1344 `uat_coverage` | — | Re-confirmed, unchanged: its `pass` still rests on a test this environment cannot execute — `EPERM` from `server.listen` (`tools/generate/src/cli/serve.ts:54` via `conformance/harness.ts:196`), an unhandled exception before any assertion. The criterion itself was independently verified against `tools/generate/src/conformance/harness.ts:138-147` in the previous cycle. A uat-level question, not settleable at ac | none at ac level; carry to the uat cycle |
| 3 | info | — | AC-1144, AC-1145 | — | Both carry **no `uat_coverage` field at all** (fields are `story_uid` / `kind` / `regression_only` only), unlike every other active AC in the capability. Their tests do exist and are correctly named — `tests/reconciliation-colour-shade-axis.test.ts:99,188`. So this is unset bookkeeping on two REQ-137 ACs, not missing evidence, and it is a uat-level field rather than an ac-level alignment question | none at ac level; carry to the uat cycle |
| 4 | info | — | ticket index (AC-718) | — | **Resolved.** The stale-index artifact the last three cycles forwarded to the operator is gone: `xgd ticket list --type acceptance_criterion --filter fields.story_uid=story-46e3b3c7` now returns AC-718 as `deprecated`, agreeing with `xgd ticket get`. Recorded so the next cycle does not re-forward it | none |
| 5 | info | — | `renderL1Fragment` default prefix | — | `render.ts:2430` defaults `prefix = 'fc'`, so a caller that omits it shares one namespace with every other such caller. This does **not** contradict AC-723, which states the obligation as "whoever renders a fragment supplies a value unique to that instance" and pins the shared-prefix collision as its own contrast case; every production caller passes `${instanceId}-…`. Recorded only so a future cycle reading the default does not mistake it for drift | none |

## Notes for the Editor

**Nothing to edit.** Zero violations, zero warnings, zero needs_review. This level
is aligned and no matrix element requires an action.

**Why this cycle differs from the last nine.** Attempts 1–8 each closed findings
while the surrounding prose still carried the error that generated them — most
visibly the colour-role clause, which reopened five times because the AC and the
story body were repaired separately. Attempt 8 closed both sides at once, which
made the last unclaimed STORY-83 clause visible; attempt 9 closed that. There is
no residue left from that chain: I checked every story, not just the repaired one.

**Two imminent intents still pending, unchanged.** REQ-145 and REQ-148 remain
`ready_to_reconcile`. REQ-148 deletes Astro from the module render path, which is
where the per-instance prefixes are currently passed (`index.astro`). AC-723 was
deliberately written about the property rather than the call sites, so the
migration should move *who supplies* the prefix without reopening this criterion.
Recorded so the next cycle can tell "not yet reconciled" from "dropped".

**Two items belong to the uat cycle, not here** (findings 2 and 3): AC-1344's
`uat_coverage: pass` resting on a socket-denied test, and AC-1144/AC-1145 carrying
no `uat_coverage` field despite having named, existing tests.
