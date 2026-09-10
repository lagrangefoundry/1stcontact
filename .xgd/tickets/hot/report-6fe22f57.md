---
uid: report-6fe22f57
id: REPORT-3738
type: report
title: 'Fix UAT Coverage: Framework Substrate: L1 Layout, Values & Behavior Modules
  — attempt 7'
created_by: xgd
created_at: '2026-09-10T13:37:43.043454+00:00'
updated_at: '2026-09-10T13:37:43.043454+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_uat_coverage
  subject_uid: capability-ae9d65d6
  fixes_applied: 10
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix UAT Coverage: Framework Substrate: L1 Layout, Values & Behavior Modules

**Attempt**: 7
**Fixes applied**: 10
**Violations remaining**: 0
**Needs more work**: false

All three violations (Findings 1, 2, 3) and the field-hygiene warning (Finding 4)
are closed in this pass. It was the mechanical pass REPORT-705e0a60 described: one
file, four renames, nine added assertions — plus three additive test-infrastructure
exports the browser-free arms needed (see Code Edits).

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-relink | AC-1623 | `tests/req93-l1-slot-mounted-behaviors.test.ts:145` renamed `test_UAT_FC_REQ-93_slot_bound_module_accompanies_an_l1_page` → `test_UAT_AC1623_slot_bound_module_accompanies_an_l1_page` |
| 2 | uat-relink | AC-1623 | `:154` renamed → `test_UAT_AC1623_unresolvable_bindings_fail_with_a_machine_readable_path` (the table-driven five-rejection arm, unchanged) |
| 3 | uat-relink | AC-1622 | `:349` renamed → `test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder` |
| 4 | uat-relink | AC-1624 | `:415` renamed → `test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations` |
| 5 | uat-add | AC-1622 | +4 assertions on the renamed test: fragment lands **inside** `data-l1-slot="form-0"`'s own element (`/<div class="…" data-l1-slot="form-0"…>\s*<form…>\s*<\/div>/`); the seam's opening tag is byte-identical mounted vs unmounted; the seam's own emitted rule is identical (with a non-empty guard so the comparison cannot pass vacuously); and the whole stylesheet is identical, so mounting contributes no rule anywhere |
| 6 | uat-add | AC-1623 | +2 accept-cases on the renamed accept arm — the criterion's **two legal states**: a starter page with neither `modules` nor `l1`, and an **orphan seam** (`docWithSlot('unbound')`, no module binding it). Both assert `result.ok === true`. The orphan case is what makes the rule one-directional; `grep -n orphan` previously hit only a comment |
| 7 | uat-add | AC-1624 | +1 arm `test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width` — Finding 3 clause (a). Pure page data via `oneModulePage(...)`: `l1.widths` and the seam's keyframe `at` list both equal `RESPONSIVE_WIDTHS`, and every keyframe has `x === 0 && width === at`. Also asserts mounting only *adds* a position (the instance object is otherwise identical to the standalone one). No server, no browser |
| 8 | uat-add | AC-1624 | +1 arm `test_UAT_AC1624_mounting_weakens_no_dimension` — Finding 3 clause (b). Iterates the harness's own `CONFORMANCE_DIMENSIONS` (asserted to be exactly the five) and runs each **standalone and mounted** against a deliberately-defective input, asserting the reported check ids are the named set and identical in both positions: `safety`→`safety.overflow`, `security`→`security.url-scheme`, `responsive`→`responsive.tap-target` + `safety.overflow`, `x-browser`→`x-browser.layout-shift`, `isolation`→`isolation.render-throws`. Named sets rather than "equal to each other" so a dimension that silently ran nothing, or ran a reduced set of its own checks, both fail here. Injected drivers/catalog only — no browser binaries |
| 9 | uat-add | AC-1624 | +1 arm `it.runIf(HAVE_CHROMIUM)('test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension')` — Finding 3 clause (c). Mounts the existing REQ-41 `fc-mobile-overflow` fixture (clean under a desktop sweep, overflows its container below 480px) and asserts the mounted responsive run flags `safety.overflow` at 320/375, while the same mounted fixture swept only at 768–1440 is clean — so the flag is the module's defect and never the seam's. Gated, and **skipped** in this run (no Chromium here) |
| 10 | field-hygiene | AC-1622, AC-1623, AC-1624 | Flipped `status: pending → active` and `uat_coverage: fail → pass` on all three, in the same pass that landed the relink (Finding 4's suggested edit). Parent stories STORY-83 (`story-d0a8cfad`) and STORY-85 (`story-179b8c06`) both moved `uat_coverage: fail → pass` — each had exactly one AC-level gap and it is closed |

## Verification — the suite ran

`npm test -- tests/req93-l1-slot-mounted-behaviors.test.ts --reporter=verbose`:
**12 passed, 1 skipped (13).** The skip is arm 9's `it.runIf(HAVE_CHROMIUM)` leg.
All four renamed tests pass under their new names; both new browser-free arms pass.

Regression sweep, all green, no test I did not touch changed verdict:

- `req39-conformance` + `req40-conformance-security` + `req41-conformance-responsive`
  + `req42-conformance-x-browser` + `req85-conformance` + `reconciliation-behavior-modules`
  + `req88-form-labelling-and-submit` + `naming`: **32 passed, 16 skipped, 0 failed.**
- `test_UAT_FC_REQ-126_l1_surface` + `reconciliation-behavior-l1-composition`
  + `reconciliation-behavior-module-escaping`: **19 passed.**

Typecheck (`tsc --noEmit -p tsconfig.base.json`): the four errors reported against
`req93-l1-slot-mounted-behaviors.test.ts` are all pre-existing lines I did not touch
(`foldedFormFor` arity ×4, `writeForms` `FoldedForm.form`), and the
`Cannot find module '@1stcontact/framework'` error is repo-wide (17 files, including
`req41-conformance-responsive.test.ts`) — a base-config alias gap, not this change.
No new type error in `conformance/harness.ts`, `conformance/types.ts`,
`conformance/index.ts`, or the test file.

## Code Edits

Three additive **test-infrastructure** edits, all inside the conformance harness's
already-declared below-the-matrix-line surface. None changes runtime behaviour;
`assertModuleConforms`, `oneModulePage`, and every dimension execute exactly as
before. They exist because Finding 3's own sequencing note asked for arms (a) and
(b) to be assertable "over `oneModulePage(...)`'s returned object and the dimension
list" — neither was reachable from a test.

| File | Lines | Evidence chain |
|---|---|---|
| `tools/generate/src/conformance/harness.ts` | 62, 113–119 | `RESPONSIVE_WIDTHS` and `oneModulePage` changed from module-private to `export`. AC-1624's Verification requires confirming "the host's slot carries a keyframe at each probed width"; the code does this at `harness.ts:145` (`l1HostDocument([...RESPONSIVE_WIDTHS])`) but nothing could observe it. Precedent is explicit in the file: `serveOneModulePage` is already "Exported as test-infrastructure so the isolation self-test can inspect exactly what was mounted" (`harness.ts:152–154`) — same reason, one layer lower, and this one needs no loopback server |
| `tools/generate/src/conformance/types.ts` | 27–44 | Added `CONFORMANCE_DIMENSIONS` (a `as const` tuple of the five) and derived `ConformanceDimension = (typeof CONFORMANCE_DIMENSIONS)[number]` from it, replacing the hand-written union. The union's five members are unchanged, so every existing signature typechecks identically. AC-1624's "the five dimensions applied are the **same set** as in the standalone run" is otherwise unassertable: the dimensions were a *type*, so a test could only restate the list and a sixth dimension could be added past the UAT. Deriving the type from the value makes arm 8 load-bearing |
| `tools/generate/src/conformance/index.ts` | 6–13, 33 | Re-exports the three new names on the harness's public surface (`oneModulePage`, `RESPONSIVE_WIDTHS`, `CONFORMANCE_DIMENSIONS`) |

## Warning 5 (`listen EPERM`) did not reproduce — the gate is open in this sandbox

REPORT-705e0a60 recorded that every test routed through `serveOneModulePage` dies
at `tools/generate/src/conformance/harness.ts:196` with
`listen EPERM: operation not permitted 0.0.0.0`, took down `test_UAT_AC703_*` and
the REQ-93 conformance test, and warned that Finding 3's evidence lived behind
exactly that gate.

**In this run it binds.** `test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations`
(the renamed `:415`) passes, `test_UAT_AC703_*` passes inside
`reconciliation-behavior-modules`, and `req85-conformance`'s four isolation-dimension
tests — which both serve over loopback *and* `fetch` the served URL — all pass. So
the sandbox restriction the prior cycle hit is not present here, and the
"infrastructure ask (an in-process handler instead of a real listener)" it floated
is not needed.

I still split arms (a) and (b) off the served harness as the report advised. That
was the right call independent of the EPERM state: those two arms are now pure data
assertions that run on any machine, and only arm (c) — which genuinely needs a
browser to measure layout — is gated.

## Notes for the next assessor

- **`.xgd/uat_index.json` is still empty** (`{"acs": {}}`, `updated_at`
  2026-09-09T22:50:28Z). The prescribed AC→test index lookup will return nothing for
  AC-1622/1623/1624 even though four `test_UAT_AC<n>_*` definitions now exist in
  `tests/req93-l1-slot-mounted-behaviors.test.ts`. Resolve by scanning `tests/` for
  the definitions directly, as the prior cycle did. Rebuilding the index is an
  infrastructure fix outside a coverage pass.
- **One judgement call to review, on AC-1624 clause (c).** The AC says "run a fixture
  that is clean standalone but overflows its container". I read "clean standalone" as
  "clean under the standalone sweep" and used the existing `fc-mobile-overflow`
  fixture (clean at 768–1440, overflows below 480). I did **not** author a fixture
  that is clean at *every* width standalone yet overflows once mounted, and I do not
  believe one is constructible against the current harness: `l1HostDocument` pins the
  seam to `x: 0, width: <viewport>` at every probed width — the AC's own
  "deliberately non-interfering" host — so mounted and standalone give the module the
  same available width and the same containing-block dimensions. Demonstrating that
  stricter defect class would need a harness option for a *narrower* seam, which is a
  production change to conformance infrastructure and well outside this pass. Flagged
  rather than silently narrowed; if the stricter reading is intended, it is an
  infrastructure ask, not an AC or test edit.
- **AC-702's internal mock** (Warning 6) untouched, as directed — still the only
  internal mock in the capability, still carrying its retirement condition in the
  AC body.
