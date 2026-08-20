---
uid: report-efb09896
id: REPORT-2407
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=ac)'
created_by: xgd
created_at: '2026-08-20T08:15:21.470442+00:00'
updated_at: '2026-08-20T08:15:21.470442+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: ac
  violations: 1
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 0
**Needs review**: 0

Anchor report: report-2485c83c · Capability: capability-ae9d65d6 (CAP-70) · Previous attempts: 8

## Summary — attempt 8 landed; one new gap in the area it opened

This is the ninth ac cycle, and the first in which **every prior finding is
verified closed**. `report-08574259` (fix attempt 8) claimed 8 of 8 resolved; I
re-derived each against the current tickets and the code rather than taking the
report's word, and all eight hold. Findings 1 and 8 — the colour-role clause that
survived five consecutive cycles because the AC and the story body were repaired
separately — are closed on both sides this time.

The single violation below is **not** a carried-forward finding and not a
regression. It is one clause of STORY-83's In-scope that no AC has ever claimed,
sitting in the seam-emission paragraph that findings 2/3/4 rewrote last cycle.
Fixing it is one AC edit.

## Cumulative Intent Considered

The story level is green going in — `report-cdc26db2` (2026-08-20 07:52) returned
PASS / 0 violations — so story bodies are my working reference, as the level rules
prescribe. I escalated to intent nowhere: no upper layer proved ambiguous this
pass. The ledger below is carried forward from that cycle and re-checked for
anything reaching a counting status since; nothing has.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-58/59/61/62 (BUNDLE-6, `bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-19 | Pre-pivot module dials | YES (superseded below) |
| REQ-63/79/82/83/84 (BUNDLE-7, `bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Framework pivot: L1 substrate + safety envelope; semantic layout modules and their ~20 dials deleted | YES (retires the BUNDLE-6 delivery) |
| REQ-85 (`request-015e42ac`) | free_and_reconciled | pivot D | Behavior contract; reframed carousel & contact-form | YES |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-23 | L1 resource table + `@font-face`; typed axes for every captured pixel-mover | YES |
| REQ-87 (`request-84af044b`) | free_and_reconciled | 2026-07-24 | `capability module` → **behavior module**; no back-compat alias | YES |
| REQ-93 (`request-f26cbe32`, BUNDLE-10) | free_and_reconciled | 2026-08-05 | Page-level slot binding + rejections; renderer mounts the fragment; `mountInL1`; `labelMode` | YES — **now fully covered** (AC-1343, AC-1344, AC-723) |
| REQ-96…107 + BUG-28 (BUNDLE-11, `bundle-ee56a66e`) | free_and_reconciled | 2026-08-06 | `control` leaf + zero-CSS contract; shared axis groups; interaction/motion/texture; layout track; link role; client isolation | YES |
| REQ-108…113 + BUG-30 (BUNDLE-13) | free_and_reconciled | 2026-08-06 | Pointer accent; relocatable document-relative emission | YES |
| BUG-31 + REQ-114 + REQ-116 (BUNDLE-14, `bundle-0385746c`) | free_and_reconciled | 2026-08-06 | Palette colour model; closed colour-role vocabulary deleted; edit-render settled state | YES — **now closed on both AC and story body** |
| REQ-117 | free_and_reconciled | 2026-07-31+ | nowrap captured width becomes a floor | YES (AC-1009…1012) |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Image framing / shape / colour adjustment | YES (AC-1124…1128) |
| BUG-34 + REQ-137 (BUNDLE-18, `bundle-d9226698`) | free_and_reconciled | 2026-08-17 | Palette `shade` replaces named `steps` | YES (AC-928/931 rewritten, AC-1144/1145 added) |
| REQ-145 / REQ-148 | ready_to_reconcile | — | L1 + behavior-module render move into workerd; Astro deleted from the module render path | imminent — no ac gap yet |
| BUG-35 (`bug-1bde3bf9`) | bundled | 2026-08-13 | Copy-modal preview UA reset | imminent — builder chrome, not CAP-70 |
| REQ-112 / REQ-134 | abandoned | — | — | NO |

## Verification of attempt 8 — all 8 findings re-derived, all closed

Recorded in full because five previous cycles reported closures that reopened.

| Prior finding | Element | Verified how | Outcome |
|---|---|---|---|
| 1 (5 cycles old) | AC-719 | Body now reads "a literal (or a palette reference)"; `updated_at` moved to 2026-08-20T08:03:12. Cross-checked `packages/site-schema/src/l1/palette.ts` — entry name is a free-form kebab regex, reference is `{ ref, shade?, alpha? }`, no role enum | **closed** |
| 8 (paired with 1) | STORY-82 body | Grepped the current body: "overlay role" appears nowhere; both occurrences now read "palette reference" (Description bullet 1, Technical Context bullet 1) | **closed** |
| 2 | AC-723 | Rewritten around the bound/unbound split, title widened. Unbound keeps the inert-placeholder claim, explicitly qualified; bound clause matches `render.ts:2119-2122` (`state.mounts?.[node.name] ?? ''` emitted as the same div's content). Escaping / `data-l1-capability` clauses intact | **closed** |
| 3 | AC-1343 (new, `acceptance_criterion-1ba0dc9a`) | Read against `packages/site-schema/src/schema.ts:546-599`. All five rejections present with the paths the AC claims — no-slot / dangling / double-bound each `path: ['modules', i, 'slot']`, duplicate seam `path: ['l1']`, no-L1-tree `path: ['modules', i, 'slot']`. Document-order-with-duplicates confirmed (`names.filter((n,i) => names.indexOf(n) !== i)`, no dedupe before the walk). Both legal converses match the code | **closed, code-accurate** |
| 4 | AC-1344 (new, `acceptance_criterion-78efd0d5`) | Read against `tools/generate/src/conformance/harness.ts:138-147` — `opts.mountInL1` sets `instance.slot = 'mount'` and `page.l1 = l1HostDocument([...RESPONSIVE_WIDTHS])`, i.e. a keyframe at every probed width exactly as the AC claims; `loadSite` validation at `:174-181` throws on an unresolvable binding rather than falling back, matching the AC's "fails the fixture" clause | **closed, code-accurate** |
| 5 | AC-716 | Narrowed to literal-as-base / length-geometry-radius; palette bullet and literal-only paragraph replaced by an explicit hand-off to AC-928 / AC-931. Overlap with AC-928 and AC-931 is gone. Supported by STORY-80's body (lines 31-35) | **closed** |
| 6 | STORY-82 In-scope | Now records that the contact-form criterion moved to AC-701. I verified the deferral is truthful rather than a pointer to nothing: AC-701 does assert the required `form` slot, a `control` per field, the optional submit, inline-vs-stacked as ordinary L1 geometry, and the `placeholder`/hidden-label pairing. No AC added, correctly | **closed** |
| 7 | STORY-83 body | Seam sentence now names `renderL1Document` only; `renderL1Fragment` is gone from it. Matches `render.ts:2428-2434` (fragment signature carries no `mounts`) | **closed** |

Test relinking also landed as reported: `tests/req93-l1-slot-mounted-behaviors.test.ts`
now carries `test_UAT_AC1343_*` ×2, `test_UAT_AC723_*` and `test_UAT_AC1344_*`, with
the six capture/fold tests correctly left free-coded (they are CAP-71 subject matter).

## Alignment Ledger

103 ACs across 7 stories (102 last cycle, +2 new, −1 already deprecated). All 7
stories are `feature`/`upgrade`, so all are in scope for AC coverage.

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-80 · AC-716, 928, 929, 930, 931, 1144, 1145 (7) | REQ-84, REQ-114, REQ-137 | aligned; AC-716's overlap with AC-928/931 resolved this cycle |
| STORY-81 · AC-833–838 (6) | REQ-104 | aligned |
| STORY-82 · AC-718 (deprecated), AC-719 (2) | REQ-84, 85, 87, 93, 96, 114 | aligned; retired vocabulary gone from AC and body; contact-form criterion truthfully deferred to AC-701 |
| STORY-83 · 43 ACs (AC-682–688, 723, 725–728, 801–807, 829–832, 849–851, 888–891, 933–936, 1009–1012, 1124–1128) | REQ-82, 90, 91, 93, 97, 98, 103, 105, 106, 107, 109, 114, 117, 136 | aligned on every In-scope clause **except per-instance class prefix namespacing** — violation 1 |
| STORY-85 · AC-697–704, 722, 808–811, 877, 878, **1343, 1344** (17) | REQ-85, 87, 93, 96, 116, BUG-28 | **fully aligned** — REQ-93's page composition rule and `mountInL1` both now covered; AC-809 carries both zero-CSS carve-outs (invariant elements *and* the edit-channel settled state), so no gap there |
| STORY-90 · AC-819–828, 879–887 (19) | REQ-99, REQ-100, REQ-108 | aligned |
| STORY-91 · AC-839–848 (10) | REQ-106 | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | *(no AC in CAP-70)* — STORY-83 `story-d0a8cfad` | ac-edit (AC-723) | STORY-83's In-scope closes: "…and per-instance class **prefix namespacing** keeps one mount's rules from colliding with another's or with the host document's." No AC in the capability asserts it. **The property is real and load-bearing, not prose**: `renderL1Fragment` takes a `prefix` and draws every subtree's classes from one counter as `<prefix>-l1-N` (`packages/framework/src/l1/render.ts:2423-2434`, doc comment "so multiple mounted fragments — and multiple behavior instances on a page — never collide"), and production callers pass a genuinely per-instance value: `` `${instanceId}-form` `` (`packages/framework/src/modules/contact-form/index.astro:65`) and `` `${instanceId}-slide` `` / `` `${instanceId}-dots` `` (`packages/framework/src/modules/carousel/index.astro:44,65`). The failure mode is concrete and unexotic — two carousels on one page, or a mounted form against the host document, would otherwise both emit `l1-0` and cross-style each other. Nothing tests it either: every `renderL1Fragment` call site in `tests/` passes a single prefix, and no test renders two instances and asserts disjoint class sets. Ownership is unambiguous — STORY-85's Out-of-scope explicitly defers the renderer's bound-seam emission to STORY-83 | Extend **AC-723** rather than authoring a new AC — it already owns "what the renderer emits at the seam, on both sides of the mount", and a standalone AC would re-state its bound-case setup. Add one clause: each mounted fragment's classes are drawn from a per-instance prefix, so two instances of the same behavior on one page, and a fragment against its host document, emit disjoint class names and neither's rules reach the other. Add the matching verification step: render two instances of one behavior into two seams of the same document and assert the emitted class sets are disjoint and each instance's rules select only its own nodes. `tests/req93-l1-slot-mounted-behaviors.test.ts` (which already holds the `test_UAT_AC723_*` mounted-fragment test) is where the assertion belongs |
| 2 | info | — | attempt 8 (`report-08574259`) | — | All 8 claimed fixes independently re-derived and confirmed — see the verification table above. Notably finding 1, open for five cycles, is closed on **both** the AC and the story body this time, which was the specific reason it kept reopening | none |
| 3 | info | — | AC-1344 `uat_coverage` | — | **The fix report's deferred check, executed.** `report-08574259` set AC-1344's `uat_coverage: pass` without being able to run its test, disclosed that openly, and asked a permitting environment to re-run it. I ran it: `npm test -- tests/req93-l1-slot-mounted-behaviors.test.ts` → **9 passed, 1 failed**, and the failure reproduces identically — `EPERM` from `server.listen` at `tools/generate/src/cli/serve.ts:54` via `conformance/harness.ts:196`, an unhandled exception before any assertion is reached, not an assertion failure. This regression worktree denies socket binding just as the fix session did, so the conformance harness cannot serve its fixture page here either. The three ac-relevant tests (`test_UAT_AC1343_*` ×2, `test_UAT_AC723_*`) are green. **AC-1344's criterion is independently verified against the harness source** (finding-4 row above), so this does not weaken the ac verdict — but the AC's `uat_coverage: pass` still rests on an unexecuted test, and that is a uat-level question, not one this level can settle | none at ac level; carry to the uat cycle |
| 4 | info | — | ticket index (AC-718) | — | The stale-index artifact reported by the last two cycles persists and is unchanged: `xgd ticket list --type acceptance_criterion` still surfaces AC-718 under `pending` while `xgd ticket get` returns the current `deprecated` state. Read-path tooling, outside a matrix editor's reach; forwarded to the operator again rather than filed | none |

## Notes for the Editor

**This is a one-edit cycle.** Violation 1 is a single clause added to AC-723 plus
its verification step. Nothing else in the capability needs to move, and no story
body needs to change — STORY-83 already states the property correctly; it is the
AC layer that never picked it up.

**Do not author a new AC for it.** AC-723 was widened last cycle precisely to own
both sides of the mount, and a separate namespacing AC would have to restate the
bound-seam setup to say anything at all. That duplication is the exclusivity trap
that kept AC-718 alive for four cycles and that finding 6 was resolved by avoiding
last cycle.

**Why this surfaced only now.** The clause has been in STORY-83's In-scope for
several cycles, but the seam-emission paragraph around it was itself in error
until attempt 8 (it named `renderL1Fragment` as taking the `mounts` map — last
cycle's finding 7). With that paragraph corrected and AC-723 rewritten to cover
the mount, the one clause still unclaimed by any AC becomes visible. It is the
tail of the same REQ-93 cluster, not a new area.

**Two imminent intents still pending.** REQ-145 and REQ-148 remain
`ready_to_reconcile`. REQ-148 deletes Astro from the module render path — which is
where the per-instance prefixes of violation 1 are currently passed
(`index.astro`) — so the AC-723 clause should be written about the *property*
(disjoint per-instance class namespaces) rather than about the Astro call sites,
so it survives that migration. Not a finding now; recorded so the next cycle can
tell "not yet reconciled" from "dropped".
