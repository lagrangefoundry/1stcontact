---
uid: report-f2288e93
id: REPORT-3616
type: report
title: Fix 1c Capture & Diff Fidelity (uat) — attempt 7 (cont. 4)
created_by: xgd
created_at: '2026-09-10T00:58:20.272240+00:00'
updated_at: '2026-09-10T00:58:20.272240+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: uat
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 2
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — 1c Capture & Diff Fidelity (uat)

**Attempt**: 7 (cont. — fifth call at level=uat)
**Fixes applied this call**: 6
**Violations remaining**: 2
**Needs more work**: **false**

Three more `pending` ACs closed — AC-1607, AC-1608 and AC-1611 — each with mutation
evidence. **Finding 10 is now 12 of 13.** The single remaining AC (AC-1612) and both
remaining violations (findings 3 and 4) are blocked on the same missing resource: a
runner with Chromium, or an operator decision. Nothing further is meaningfully
addressable in this environment, so this call declares `needs_more_work: false` and
hands back to the assessor rather than looping without progress.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1607 (finding 10) | New file `tests/reconciliation-offline-reextract-mirror.test.ts` — 4 tests driving the real `reextractFromBundle` with a fake browser seam that performs real loopback HTTP: the served document points font references at the mirror; the rewritten paths actually resolve to the mirrored bytes (with `css2` served as `text/css` and its inner `@font-face` src also rewritten); a bundle mirroring nothing is served byte-identical; rewriting is keyed on basename and touches nothing else |
| 2 | uat-add | AC-1608 (finding 10) | New file `tests/reconciliation-band-overlay-veil.test.ts` — 4 tests over the real `EXTRACT_SCRIPT` → `flattenSignals` → `diffManifests`: a translucent veil recorded as colour + alpha; opaque, fully transparent and non-blanketing layers each recording none; the veil not also indexed as a backdrop; and the section-level `overlay` diff axis firing beyond tolerance, silent when matching, and absorbing a within-tolerance difference |
| 3 | uat-add | AC-1611 (finding 10) | New file `tests/reconciliation-surface-gradient-selection.test.ts` — 4 tests, one per clause of the selection rule: nearest painting ancestor wins; a text-clipped gradient is skipped and lands on the text-fill axis instead; the walk stops at the first opaque solid; no gradient ancestor records none |
| 4 | field-update | AC-1607 | `uat_coverage`: `missing` → `pass` |
| 5 | field-update | AC-1608 | `uat_coverage`: `missing` → `pass` |
| 6 | field-update | AC-1611 | `uat_coverage`: `missing` → `pass` |

## Mutation Evidence

| Mutant | Result |
|---|---|
| `reextract.ts` — serve text assets verbatim instead of `rewriteMirroredRefs(...)` | Both new AC-1607 serving tests went red. **BUG-16's `test_UAT_FC_BUG-16_reextract_serves_mirrored_crossorigin_webfont` — the only sibling that would have caught this — SKIPPED** (browser-gated). The serving layer had no executing evidence here |
| `extract.ts` `overlayOf` — drop the `a > 0 && a < 1` gate so any parseable fill counts as a veil | The new AC-1608 test caught it (`expected { color: '#020617', opacity: 1 } to be null`). All four browser-free BUG-24 siblings stayed green — they are fold tests that take the overlay as an *input*, so they structurally cannot see a capture-side regression |
| `extract.ts` `surfaceGradientOf` — drop the text-fill skip AND the opaque-solid stop | Both corresponding AC-1611 tests went red. All 4 siblings in `reconcile-gradient-first-class.test.ts` stayed green — they cover AC-634/635/636/638 (the compare), never the selection |

The third row is the one the AC itself predicted: AC-1611 is "the one place the
capture can be silently wrong in a way the **diff cannot detect**". The mutant
demonstrates exactly that — the compare-side tests agree on a value that is not what
paints.

## Verification

```
Test Files  15 passed (15)
     Tests  108 passed | 11 skipped (119)
```

Across the three new files, all three FC sibling suites
(`bug16-webfont-load-before-extract`, `bug24-scrim-alpha`,
`reconcile-gradient-first-class`) and every suite touched across the five calls. No
regressions. The 11 skips are browser-gated.

## Scope limits, stated in the tests rather than implied

Two ACs have clauses that cannot be measured without a real browser, and the tests
say so in their headers rather than quietly asserting less:

- **AC-1607** — `fontLoaded: true`, the captured family being the intended face, and
  glyph extents matching an online extract are properties of a real font-loading
  browser. The **serving** half (what the offline server hands back, and the mirror
  being reachable at the rewritten path) is what these tests close.
- **AC-1608** — the modern-colour-syntax veil (`color-mix(in oklab, …)` /
  `oklch(… / .3)`) resolves through the REQ-52 **canvas colour probe**, and jsdom
  implements no 2d canvas, so `rgbaOf` takes its documented `rgb()/rgba()`-regex
  fallback. Verified empirically: an `oklch(… / .3)` veil records `overlay: null`
  under jsdom. Asserting that clause would mean hand-writing a colour parser into the
  harness — measuring the harness, not the browser — so it is deliberately **not**
  asserted.

## Finding 10 — final state: 12 of 13

| Done | AC | Call |
|---|---|---|
| ✅ | AC-1609, AC-1610 | 2nd |
| ✅ | AC-1613, AC-1614, AC-1615, AC-1616 | 3rd |
| ✅ | AC-1605, AC-1606, AC-1617 | 4th |
| ✅ | AC-1607, AC-1608, AC-1611 | this call |

**AC-1612 is the one remaining, and it is not authorable browser-free.** Its Criterion
is that a modern-colour-space gradient's stop list is "resolved to `#rrggbb`
**in-browser**", and it explicitly rules out the alternative: "rather than
colour-space maths reimplemented in the tool". Under jsdom `hexifyGradient` cannot
resolve `oklch(...)` stops, so the only way to make a test pass here would be to
reimplement in the harness precisely the thing the AC says must not be reimplemented.
It needs Chromium. It is the last AC in the 648-AC store carrying
`uat_coverage: missing` — verified by enumeration this call.

## Code Edits

None. All mutation experiments were reverted. Two reverts left a comment em-dash
mangled by my patch script (`—` → `--`) in `extract.ts`; both were caught by
`git status` and restored with `git checkout`. Final `git status` shows three new
test files and **no modified files**.

## Why `needs_more_work: false`

Everything actionable at level=uat in this environment is done. What remains is three
items with the same root cause and no path forward from inside the loop:

| Item | Blocker |
|---|---|
| Finding 3 (AC-720, **violation**) | Operator decision: browser-gated e2e leg vs `ac-edit` dropping the end-to-end clause |
| Finding 4 (AC-815, **violation**) | No Chromium; fixture and assertions were authored in call 1 and report SKIPPED |
| AC-1612 (finding 10, warning) | No Chromium; not authorable browser-free without defeating the AC's own point |

Looping again would produce no mutation, which the loop rules ask me to avoid.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| AC-720 (finding 3, **violation**) | "Either (a) add a browser-gated end-to-end leg … or (b) if judged genuinely un-automatable, **ac-edit** AC-720 to drop the end-to-end clause" | Which branch? Ninth consecutive filing. (a) is blocked here. If the aligned-crops browser+sharp pipeline is expected to stay manually verified, (b) is the honest repair — but removing an assertion from an AC is not mine to decide |
| AC-815 (finding 4, **violation**) | "Extend `bug27-nested-backdrop.html` with (i) an `overflow: hidden` carousel … and (ii) a conventionally laid-out band" | Done in call 1, unexecutable here. **Can this loop run on a host with Chromium?** That single change would unblock findings 4 and AC-1612 together, and would let AC-720 take branch (a) |
| AC-1612 | — | Same Chromium blocker. Authoring it browser-free would require reimplementing the colour-space conversion the AC forbids |
| AC-1610, AC-1605 | — (found by this step across calls 2 and 4) | Two ACs whose Verification sentence overreaches its own Criterion. Both need an `ac-edit` at the next ac-level pass; not actionable at level=uat. Details in `report-e2c8368a` and `report-6406e84b` |
