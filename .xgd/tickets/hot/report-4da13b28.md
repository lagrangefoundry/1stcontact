---
uid: report-4da13b28
id: REPORT-2416
type: report
title: 'Fix UAT Coverage: Framework Substrate: L1 Layout, Values & Behavior Modules
  — attempt 7'
created_by: xgd
created_at: '2026-08-20T10:28:45.749758+00:00'
updated_at: '2026-08-20T10:28:45.749758+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_uat_coverage
  subject_uid: capability-ae9d65d6
  fixes_applied: 7
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix UAT Coverage: Framework Substrate: L1 Layout, Values & Behavior Modules

**Attempt**: 7
**Fixes applied**: 7 (6 new UATs + 1 test-infrastructure export)
**Violations remaining**: 0
**Needs more work**: false

Both violations were `uat-add`, both under STORY-85, both in
`tests/req93-l1-slot-mounted-behaviors.test.ts`. Neither AC body was edited — the
report was explicit that resolving these by editing the ACs down to what the tests
already do would be wrong, and I did not.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1343 | `test_UAT_AC1343_deliberately_legal_compositions_are_not_rejected` — the two must-not-reject cases through the real `validateSite`. **Verified passing.** |
| 2 | uat-add | AC-1344 | `test_UAT_AC1344_mounted_host_seam_spans_the_viewport_at_every_probed_width` — the attributability premise, asserted against the harness's own host document. **Verified passing.** |
| 3 | uat-add | AC-1344 | `test_UAT_AC1344_conformance_discriminates_in_both_shipping_shapes` — the mount-breaks-only defect class, at the render level (no browser, no socket). **Verified passing.** |
| 4 | uat-add | AC-1344 | `test_UAT_AC1344_both_shipping_shapes_conform_and_report_a_per_dimension_outcome` — the positive counterpart. Authored; **blocked by the sandbox socket here** (see below). |
| 5 | uat-add | AC-1344 | `test_UAT_AC1344_browser_dimensions_run_over_the_same_ac_set_in_both_shapes` — `safety` + `security` driven for real in both shapes, outcomes compared as AC sets. Authored; **reports `skipped` here** (no Chromium). |
| 6 | uat-add | AC-1344 | `test_UAT_AC1344_a_defect_visible_only_when_mounted_is_reported_as_failing` — the negative arm the report asked for. Authored; **reports `skipped` here** (no Chromium). |
| 7 | code-issue | `conformance/harness.ts` | Exported `conformanceL1HostDocument()` as test infrastructure so #2 can assert the seam's geometry without a browser. |

Fields set: AC-1343 `uat_coverage=pass`, AC-1344 `uat_coverage=pass`, STORY-85
`uat_coverage=pass`.

## Finding 1 (AC-1344) — how the headline claim is now exercised

The report's core objection was that `test_UAT_AC1344_*` proved the fixture *mode*
worked but never that the *obligations run* against the mounted shape:
`assertModuleConforms` was never called with `mountInL1`. Four arms now drive it.

**The load-bearing one (#3) executes anywhere.** It uses the `isolation` dimension,
which is render-level, and a behaviour whose core throws during SSR (`fc-throws`,
the existing `throws-on-render.astro` fixture resolved through an injected
`ModuleResolver`). That path fails inside `renderSite` — *before* `startServe` — so
it needs neither a browser nor a socket. It asserts the standalone run reports
exactly `['isolation.render-throws']` and that the mounted run reports the **same
AC set**, compared as a set rather than as "mounted also failed", so a mounted run
that quietly checked a different, easier obligation would not pass. This is the
direct answer to "the production capability exists and is simply undriven": it is
now driven, and proven to discriminate.

**#6 is the mount-only defect class.** Both runs get the identical module, fixture
and options — including the same `extraCss`, `[data-l1-slot] .contact-form { width:
4000px }`. That rule is inert on a bare module-stack page (nothing there has a
`[data-l1-slot]` ancestor) and bites only once the behaviour is mounted into a
seam. Standalone must not contain `safety.overflow`; mounted must. Comparing
reported AC *sets* rather than pass/fail means the arm does not silently assume
`contact-form` is violation-free standalone — no test in the repo currently
asserts that, so depending on it would have been an unverified premise.

**#2 closes "the host's seam spans the viewport at every probed width"**, which the
report noted was true by construction at `harness.ts:145` and asserted nowhere. It
renders the harness's real host document and checks two things: a geometry keyframe
at every ladder width (320/375/768/1024/1280/1440), and that every emitted `width`
for the seam is the viewport *identity* — a literal px equal to the breakpoint it is
held at, or the emitter's `calc(Apx + (D * (100vw - Apx) / D))` with matching origin
and matching rise/run. Checked structurally rather than by evaluating at a sample,
so a value that coincides at one probe but diverges between them cannot pass. Both
branches are exercised (the base and 1440px rules are literal; the five interior
segments are interpolations).

## Finding 2 (AC-1343) — the two legal cases

`test_UAT_AC1343_deliberately_legal_compositions_are_not_rejected` calls the real
`validateSite` on three pages that must be accepted: an L1 tree whose only seam is
unbound; two seams with one bound and one still waiting (the mixed case a
reproduction actually hits, which makes the rule per-seam rather than per-page); and
the empty starter with neither `modules` nor `l1` — the key genuinely absent, since
`pageSchema.modules` defaults to `[]`. On failure it asserts against the rendered
`path: message` list rather than a bare `false`, so a future over-tightening names
itself. This is the guard the report asked for: an implementation that required
every seam to be bound would satisfy all five rejection rows and fail here.

## Code Edits

| File | Lines | Evidence chain |
|---|---|---|
| `tools/generate/src/conformance/harness.ts` | +13 (new `conformanceL1HostDocument`), and `oneModulePage` now calls it in place of the inline `l1HostDocument([...RESPONSIVE_WIDTHS])` | AC-1344's attributability clause is a property of the harness's host-document geometry. The document was module-private, so the only way to observe it was through `serveOneModulePage` — which cannot run in a sandboxed worktree. Exporting it converts an unverifiable assertion into one that executes everywhere. No behaviour change: the export returns exactly the expression the mount site previously inlined, and the mount site now calls the export so the two cannot drift. This mirrors the existing precedent in the same file, where `serveOneModulePage` is already "exported as test-infrastructure so the isolation self-test can inspect exactly what was mounted". Typecheck and lint clean; the 13 non-socket tests in the file pass. |

## Verification — what actually ran, and what did not

`npm test -- tests/req93-l1-slot-mounted-behaviors.test.ts`:

| | Before this call | After |
|---|---|---|
| passed | 10 | **13** |
| skipped | 0 | 2 (browser arms, `it.runIf(chromiumAvailable())`) |
| failed (EPERM) | 1 | 2 |

`npm run typecheck` and `npm run lint` both clean.

**Disclosed, not glossed.** This worktree permits **no socket binding at all** — I
probed it directly: `listen` returns `EPERM` for `0.0.0.0`, `127.0.0.1` and `::1`
alike. Every path through `serveOneModulePage` therefore dies in `startServe`
(`cli/serve.ts:54`) before any assertion runs. That accounts for both EPERM
failures: the pre-existing
`test_UAT_AC1344_mounted_behavior_carries_its_conformance_obligations` (unchanged by
me, and EPERM in the previous cycle too) and new arm #4. Arms #5 and #6 additionally
need a real engine and report `skipped` here, using `it.runIf(chromiumAvailable())`
— the `runIf` form the report endorsed, never the `if (!HAVE_CHROMIUM) return`
anti-pattern it flagged.

**So: I am not claiming #4, #5 and #6 green by execution.** They are authored to be
correct by construction and are statically sound (typecheck + lint), and #4 reaches
the same EPERM the pre-existing sibling does, i.e. it fails at the socket rather
than at an assertion. The two arms that carry the substance of Finding 1 — the
discriminator (#3) and the seam geometry (#2) — were deliberately built to need
neither a browser nor a socket, and **both were executed and passed**. A runner with
network permissions and a provisioned Chromium should be able to confirm the
remaining three.

## needs_review Items Forwarded

None from the findings table.

**Out-of-scope item carried forward from the coverage report** (not actioned — the
editor brief forbids creating tickets that were not asked for): `.xgd/uat_index.json`
is `{"acs": {}}` and has now been empty across at least three consecutive cycles, so
every coverage assessor is hand-scanning `tests/` instead. Root cause per the
report: an anchored `^test_UAT_` matcher does not fit this repo's suite-prefixed
vitest names. That is a tooling defect, not a matrix defect, and wants its own
ticket.
