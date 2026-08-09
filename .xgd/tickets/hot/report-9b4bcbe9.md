---
uid: report-9b4bcbe9
id: REPORT-1728
type: report
title: 'UAT Coverage: Framework Substrate: L1 Layout, Values & Behavior Modules'
created_by: xgd
created_at: '2026-08-09T05:43:10.935348+00:00'
updated_at: '2026-08-09T05:43:10.935348+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ae9d65d6
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: Framework Substrate: L1 Layout, Values & Behavior Modules

**Result**: FAIL
**AC verdicts**: 96 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 6 pass, 0 fail, 1 stale, 0 needs_review
**Capability verdict**: fail

## Cumulative Intent Considered

All six intent bundles reaching this capability are `free_and_reconciled`, so every
one counts toward cumulative intent. Chronological:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (REQ-58 + REQ-59 + REQ-62 + REQ-61) | free_and_reconciled | 2026-07-17 | Pre-pivot capture/diff value work; original home of STORY-80/81/82 | YES |
| BUNDLE-7 (REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more) | free_and_reconciled | 2026-07-22 | **The pivot.** REQ-79 introduces the L1 substrate; REQ-84 deletes the semantic layout modules and their ~20 dials; REQ-82 the safety envelope; REQ-85 reframes contact-form as a module with typed config + slots | YES (retires module dials) |
| BUNDLE-11 (BUG-27 + REQ-94 + REQ-96 + REQ-97 + REQ-98 + 10 more) | free_and_reconciled | 2026-08-05 | **REQ-96** deletes `carousel.config.view`, replaces contact-form's `intro`/`submit` slots with one required `form` slot, and adds the `control` leaf (L1-wraps-module). REQ-87's rename to `Behavior*` is atomic — no `Capability*` alias. REQ-97/98/105 share the axis groups | YES (retires `capability module` naming + intro/submit slots) |
| BUNDLE-13 (REQ-108 + REQ-109 + REQ-110 + REQ-111 + REQ-113 + 1 more) | free_and_reconciled | 2026-08-06 | Interaction state, scroll motion, pointer accent (STORY-90); REQ-104 layout track (STORY-81) | YES |
| BUNDLE-14 (BUG-31 + REQ-114 + REQ-116) | free_and_reconciled | 2026-08-06 | REQ-114 lands the colour palette overlay **in L1** (superseding the "overlay parked in L2" position); REQ-116 adds the edit-channel settled-state carve-out | YES |
| BUNDLE-16 (REQ-117 + REQ-115 + REQ-44) | free_and_reconciled | 2026-08-07 | REQ-117 nowrap width floor; navigation/link role | YES |

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-80 Absolute values re-homed in L1 | BUNDLE-6 → BUNDLE-14 (REQ-84, REQ-114) | aligned | Body correctly records the REQ-84 dial deletion as intentional supersession and the REQ-114 move of the colour overlay from L2 into L1 |
| STORY-81 Responsive layout track | BUNDLE-6 → BUNDLE-11 (REQ-104) | aligned | Body correctly records that its original per-breakpoint dials died with REQ-79/84 and that REQ-104 gives it distinct behaviour again |
| STORY-82 Reproduction treatments | BUNDLE-6 → BUNDLE-7 (REQ-84, REQ-85) | **stale** | Body predates BUNDLE-11; still describes the `intro`/`submit` slots REQ-96 deleted and calls contact-form a "capability module" after REQ-87's atomic rename |
| STORY-83 L1 layout substrate | BUNDLE-7 → BUNDLE-16 | aligned | Body explicitly tracks REQ-87 slot-field rename, REQ-96 control leaf, REQ-97/98/105 shared axis groups, REQ-114 page colours, REQ-117 nowrap floor |
| STORY-85 Behavior modules | BUNDLE-7 → BUNDLE-14 (REQ-85, REQ-87, REQ-96, REQ-116, BUG-28) | aligned | Body records the REQ-96 supersession of AC-699/AC-701 explicitly and admits the REQ-116 settled-state carve-out with stated bounds |
| STORY-90 Interaction / motion / pointer accent | BUNDLE-13 | aligned | — |
| STORY-91 L1 navigation | BUNDLE-11 (REQ-115) | aligned | Body records both places implementation exceeded intent, in the safe direction |

## Evidence Assessment

All 96 ACs resolve to real test functions in `tests/` (verified by name match, not by
the UAT index — every index entry reads `status: missing`, which records "no run
recorded on this branch", not "test absent"). The bodies were extracted and screened
for the four disqualifying shapes; the results:

- **No `vi.mock`/`jest.mock` of internal components** anywhere in this capability's tests.
- **No existence-only assertions** (`typeof x === 'function'` as the whole test).
- **No source-text-only tests.** Four tests read a file, and in each the read is a
  supplementary assertion on top of behavioural ones: AC-810 reads the *generated*
  `theme.css` after a real `cmdNew` + `cmdRender` in a temp dir; AC-722 drives the
  three real validators through accept/reject pairs and only then greps the package
  root for residual `Capability*` names.
- **Real entry points throughout** — `validateL1`, `renderL1Document`, `validateSite`,
  `validateBehaviorConfig/Slots/Instance`, `getModule`, Astro container renders, and
  for AC-683/AC-688 a real `captureL1` across engines.

AC-683 and AC-688 are gated on `it.runIf(engineAvailable(...))`. Chromium, Firefox
and WebKit are all present in this environment (`~/.cache/ms-playwright`), so both
execute rather than silently skipping — not a coverage gap here, though the gate
means their evidence is environment-dependent.

Spot-checks confirming the post-REQ-96 repointing is real, not nominal: no test in
the capability references `config.view`, `view-single|peek|multi`, `flex-basis`, or
the `intro`/`submit` slots; AC-718 asserts `Object.keys(contactFormMeta.slots)` is
exactly `['form']`; AC-809 asserts both bounds of the REQ-116 settled-state carve-out
(document-level edit marker scoping, and a closed flow-release property set with a
negative assertion against every paint property).

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | story | STORY-82 | story-body-edit | Body describes two behaviours REQ-96 (BUNDLE-11, reconciled) retired: (a) "the submit button's appearance is authored as L1 mounted into the `submit` slot, decorative framing into the `intro` slot" — those slots are deleted, replaced by one **required `form` slot** carrying `control` leaves; (b) it calls contact-form a "**capability module**" with "**capability config**" and "capability validators" throughout, after REQ-87's atomic rename to `Behavior*` (AC-722 asserts no `Capability*` residue survives) | Rewrite the contact-form paragraph against the required `form` slot + `control` leaves; replace "capability module/config/validators" with "behavior module/config/validators"; retitle the referenced "Capability Modules story" as STORY-85 Behavior modules |
| 2 | warning | ac | AC-718 | ac-edit | AC title reads "authored via **capability config** + L1 slots" — same retired naming. The AC's substance is active and its test is fully post-REQ-96, so this is wording only | Retitle to "…via behavior config + the required L1 form slot…" |

## Notes for the Editor

**One story, one root cause.** STORY-82 is the only element out of alignment, and it
drifted for a single mechanical reason: it was last updated by BUNDLE-7 (2026-07-22)
and never revisited after BUNDLE-11 (2026-08-05) changed both the naming and the
contact-form slot shape underneath it. Its two sibling stories that BUNDLE-7 also
touched (STORY-80, STORY-81) *were* revisited — each carries an explicit supersession
note — which is why they read clean. The fix is a body rewrite against the current
contract, not an AC deprecation: every behaviour STORY-82 claims still exists, it is
only described through two retired surfaces.

**Do not deprecate any AC here.** AC-718 and AC-719 both describe live behaviour and
both have substantive post-REQ-96 tests. Finding 2 is a title edit, not a lifecycle
change. Fixing finding 1 without touching AC-718's title will leave the "capability
config" phrase as the last residue of the rename in this capability, so the two are
best done in one pass.

**Coverage itself is not the problem.** This capability's evidence is unusually
strong — 96/96 ACs with real-entry-point tests and no mocking of internals — so no
`uat-add` or `uat-edit` action is required this round. A fix pass that only edits
STORY-82's body and AC-718's title should clear this capability to `pass`.

