---
uid: report-a181e8c1
id: REPORT-2371
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=ac)'
created_by: xgd
created_at: '2026-08-20T04:47:23.878277+00:00'
updated_at: '2026-08-20T04:47:23.878277+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Attempt 8 at this scope. The previous ac cycle (`report-6d2d7d31`, FAIL, 10 violations
/ 2 warnings) diagnosed a **one-sided repair**: attempts 7–10 rewrote STORY-75 and
STORY-76 at the story level (sweeping BUNDLE-10's five members, REQ-73 and REQ-72 into
the bodies) without discharging the AC obligation those edits created. The fix loop
(`report-c353409a` + `report-daaf7c07`, attempt 7 across two calls) authored 10 ACs and
edited 4.

**Every one of the twelve prior findings was re-verified against the live tickets and,
where the AC makes a code-grounded claim, against source at HEAD.** I did not accept the
fix report's account on trust. All ten violations are closed and both warnings are
addressed. STORY-77, STORY-78, STORY-79 and STORY-116 were re-derived from their bodies
rather than carried forward. The single remaining warning is new to this cycle and
concerns evidence, not matrix alignment.

## Cumulative Intent Considered

At `ac` level the story body is the working reference. Intent was consulted at three
points only: to confirm REQ-114's retirement is now honoured by AC-638 *and* the STORY-76
body (last cycle's finding 9, five cycles unrepaired), to confirm the swept intents now
have AC surface, and to re-check whether REQ-148 has moved from imminent to reconciled
(it has not). The full chronological ledger is in this cycle's story-level report
`report-afa769c6` (PASS).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-59 (`bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-13 | Text-fill gradient stop positions | YES |
| REQ-61 (`bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-16 | `--size` on both diff commands; `responsive-diff` | YES |
| REQ-62 (`bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-16 | Panel/surface gradient: capture + render + diff | YES |
| BUG-15/16/22/24/25 (`bundle-4ff83a8b`) | free_and_reconciled | 2026-07-29 | All-collapse band fallback; capture-time font settling; surface-bearing box; modern-syntax scrim probe; per-text-node run geometry | YES — **now carried by AC-1315 / AC-1314 / AC-1311 / AC-1316 / AC-1310** |
| REQ-73 (`request-859652ae`) | free_and_reconciled | 2026-08-19 sweep | Adjacent-gap axis + retirement of band vertical padding | YES — **now carried by AC-1312 + AC-1313** |
| REQ-72 (`request-0698bbdf`) | free_and_reconciled | 2026-08-19 sweep | In-browser hexification of gradient stop colours | YES — **now carried by AC-1307** |
| REQ-64 (`request-07d0e3e1`) + REQ-76 (`request-3a11304d`) | free_and_reconciled | 2026-08-19 sweep | Noise audit, `--collapse`, Type-A/B order; `--clusters` | YES — STORY-116, AC-1285…1289, JSON clause now pinned |
| REQ-114 (`request-3cd338cd`) | free_and_reconciled | 2026-07-31 | Retires the module-level palette-role alias; a module colour is a `#hex` literal | YES (retires) — **now honoured in both AC-638 and the STORY-76 body** |
| REQ-84 (`bundle-31e474b9`) / REQ-96 (`bundle-ee56a66e`) | free_and_reconciled | 2026-07-20 / 07-26 | Delete the semantic layout modules; `config` never aesthetic | YES (retires) — AC-637 correctly deprecated |
| REQ-148 (`request-7ae3c2cc`) | ready_to_reconcile | 2026-08-15 | Behavior modules render in workerd; Astro leaves the render path | imminent — re-checked this cycle, **still not reconciled**; does not retire AC-739 yet (info 2) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-75 (`story-d5de22a5`) — **21 ACs**, 15 Description items | bundle-ab9e0cb6; bundle-31e474b9, bundle-cceaba25, bundle-4ff83a8b, bundle-ee56a66e, request-859652ae | **aligned.** Full item→AC re-derivation: 1→AC-629+630, 2→**AC-1310**, 3→AC-631, 4→AC-632+713, 5→**AC-1311**, 6→AC-633, 7→AC-711 (incl. the painted-marker precondition, which AC-711 carries as its own titled clause), 8→AC-712+714, 9→**AC-1314**, 10→AC-715, 11→AC-815 (+ clamp) and **AC-1315** (all-collapse), 12→AC-816 (+ three exclusions + full-bleed definition) and **AC-1316** (colour probe), 13→AC-817, 14→AC-818, 15→**AC-1312**+**AC-1313**. No orphan AC, no duplicate |
| STORY-76 (`story-82eb6908`) — **8 ACs** (1 deprecated), 3 Description items | bundle-ab9e0cb6 (REQ-59 + REQ-62); request-0698bbdf; **now reconciled against REQ-114** | **aligned.** 1→AC-634+635; 2 capture→**AC-1308**, diff→AC-636, authored→AC-638 (validation) + **AC-1309** (resolution); 3→**AC-1307**. AC-638's palette-role clause is inverted to the rejected side and the matching clause in the story body is gone — the five-cycle recurrence is broken at both sites |
| STORY-77 (`story-16f2793c`) — 8 ACs | bundle-ab9e0cb6 (REQ-61, size-aware half) | **aligned** — re-derived: in-scope 1→AC-639+640, 2→AC-643, 3→AC-641/642/644, 4→AC-647; AC-645 pins the viewport vocabulary |
| STORY-78 (`story-2c7069fe`) — 9 ACs | bundle-ab9e0cb6 (REQ-61, cross-size half) | **aligned** — re-derived: table→AC-648, `--sizes`→AC-649, join key + repeats→AC-651, changed/steady + presence flips→AC-650, `--classify`→AC-652, `--json`/`--ref`→AC-655, `--out`→AC-721, two terminal-fails→AC-653/654 |
| STORY-79 (`story-e15a19ef`) — 13 ACs | bundle-ab9e0cb6; bundle-31e474b9, bundle-cceaba25, bundle-15c1f647 | **aligned.** g1→AC-656+AC-1290, g2→AC-657/658/659/738, g3→AC-720, g4→AC-739, g5→AC-1013…1017. Last cycle's exclusivity warning is resolved by declaration, not by deletion: AC-656 now opens with a scope note naming itself the REQ-58 regression anchor and AC-1290 the general surface |
| STORY-116 (`story-aaddb221`) — 5 ACs | request-07d0e3e1 (REQ-64), request-3a11304d (REQ-76) | **aligned.** 1→AC-1285, 2→AC-1286, 3→AC-1287, 4→AC-1288, 5+6→AC-1289. The In-scope "JSON shape of both views" clause is now pinned: AC-1286 carries the `--collapse --json` document, AC-1289 the `--clusters --json` document plus the clusters-over-collapse precedence |
| AC-637 (`acceptance_criterion-377af866`) | REQ-62, superseded by REQ-84/REQ-96 | Deprecation remains correct, and no longer leaves a hole — the resolver behaviour it used to carry is now on AC-1309, authored free of module-render framing |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-638 `acceptance_criterion-a657c39c` (STORY-76) | uat-edit | The AC's criterion was **inverted** this attempt (a palette-role stop moved from accepted to rejected) but its `uat_coverage` field still reads `pass`, so the next uat cycle may skip it. Its sole test, `test_UAT_AC638_gradient_field_accepts_wellformed_rejects_malformed` (`tests/reconcile-gradient-first-class.test.ts:138`), exercises only two of the criterion's four assertions: a well-formed hex gradient accepted, and a non-object rejected. It asserts **neither** the palette-role-stop rejection (the whole point of the REQ-114 repair) **nor** the bad-direction rejection. The test is not *wrong* — its comment already cites REQ-114 and it passes against the hex-only path (`packages/framework/src/modules/validate.ts:101-107`, reached for every stop via `:130-134`) — it is merely narrower than the AC it now claims to prove | Extend the UAT with the two missing assertions: a stop colour given as a palette-role name (e.g. `accent`) produces an error naming `…stops[i].color`, and a direction that is neither a number nor a listed alias produces an error naming `…angleDeg`. Reset AC-638's `uat_coverage` so the uat cycle re-derives rather than trusting the stale `pass`. **Warning, not violation**: the AC/story/code agree; only the evidence lags, and that is the next level's property |
| 2 | info | — | STORY-79 §4 / AC-739 `acceptance_criterion-fcf814b5` | — | Re-checked this cycle: REQ-148 (`request-7ae3c2cc`) is **still `ready_to_reconcile`** (2026-08-15), so its retirement of "an Astro container is constructed only for pages that carry behavior modules" remains imminent rather than actual and does **not** count against this cycle. Carried forward unchanged from `report-6d2d7d31` info 11 so the next cycle recognises the retirement instead of re-deriving it | none — revisit when REQ-148 reconciles |
| 3 | info | — | The 11 ACs authored across attempt 7 | — | AC-1307, 1308, 1309, 1310, 1311, 1312, 1313, 1314, 1315, 1316 and AC-1290 all carry `uat_coverage: pending`. That is a level=uat gap by construction, not an ac-level defect — the ac cycle's job is that the criterion exists and follows from the story, which it does. Each was written with an executable Verification section (concrete fixtures, concrete assertions), so the uat cycle has a test plan rather than a re-derivation | none at this level |
| 4 | info | — | `packages/framework/src/modules/validate.ts:131`, `:167` | — | The two stale REQ-114 comments the prior report flagged as out-of-scope are **still present** and still contradict the code they annotate ("a bare colour string (hex/role)"; "Absolute value (#hex) or a palette-role alias"). Verified at HEAD alongside the correct doc comment at `:96-99`. Comments in production code are not matrix elements, so this is not a finding — but they are the most plausible reason AC-638 survived five cycles while the executed path was hex-only throughout | none at this level; worth a free-coded cleanup |

## Notes for the Editor

**Nothing to repair at this level.** The previous cycle's diagnosis — that a story-body
edit creates an AC obligation and none had been discharged — was correct, and the fix
loop discharged it in full. STORY-75 went 14 → 21 ACs and STORY-76 5 → 8; every
Description item and named sub-rule in both bodies now has an AC, and no AC was left
orphaned or duplicated in the process.

**Verification method, so the next cycle knows what was and was not re-checked.** Each of
the ten new/edited ACs was read in full and matched clause-by-clause against its
Description item. Where an AC asserts a detail the story body does not state, I checked
the code rather than accepting it: AC-1309's evenly-distributed stop positions,
`<n>deg`/alias direction forms, hex-only stops and whole-gradient drop are all exactly
`gradientImage` + `resolveSurfaceGradient` at `packages/framework/src/modules/text-style.ts:195-226`;
AC-1289's "`--clusters` wins over `--collapse` in JSON mode" is
`tools/generate/src/cli/index.ts:794-802`; AC-638's inversion is
`packages/framework/src/modules/validate.ts:101-107` reached from `:130-134`. None of the
three was a drifted paraphrase.

**Finding 9's five-cycle recurrence is broken at both sites, which is why it should
stay broken.** The prior report predicted it would regenerate unless the story body were
edited in the same pass as the AC. Both were: STORY-76 item 2's "Authored" bullet now
reads "Each stop colour is an absolute `#hex` literal: REQ-114 retired the module-level
palette-role alias…", and AC-638 lists the role alias among the rejected forms. There is
no longer a surviving copy of the retired clause anywhere in this capability's matrix.

**Finding 10's alternative resolution was decided, not deferred.** The fix loop took the
`ac-add` branch (author AC-1309) rather than retiring STORY-76's authoring half, on the
grounds that the capability body deliberately retains `resolveSurfaceGradient`. I agree
and am recording it as settled so it does not oscillate: `resolveSurfaceGradient` still
has zero production callers (only the re-exports at `modules/index.ts:9` and
`framework/src/index.ts:33`), so an operator may still choose to retire it — but that is
a scope decision above this level, and until the capability body changes, the resolver is
in scope and AC-1309 is the right shape for it.

**The one thing to hand forward is evidence, not alignment.** Finding 1 plus info 3 mean
the entire ac→uat surface of this capability is now the next level's work: eleven ACs
with no test at all, and one (AC-638) whose test is narrower than its rewritten
criterion while its coverage flag still reads `pass`. That flag is the trap — a uat cycle
that filters on `uat_coverage != pass` will not look at AC-638 at all.
