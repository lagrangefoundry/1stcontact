---
uid: report-6a85b547
id: REPORT-2413
type: report
title: 'Fix Framework Substrate: L1 Layout, Values & Behavior Modules (uat) — attempt
  7 (continuation)'
created_by: xgd
created_at: '2026-08-20T09:35:57.685938+00:00'
updated_at: '2026-08-20T09:35:57.685938+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-ae9d65d6
  level: uat
  fixes_applied: 8
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Framework Substrate: L1 Layout, Values & Behavior Modules (uat)

**Attempt**: 7 (continuation — the loop re-invoked after REPORT-2412)
**Fixes applied this call**: 8
**Violations remaining**: 0
**Warnings remaining**: 0
**Needs more work**: false

REPORT-2412 (`report-95a1aa0e`) cleared all three violations plus Warnings 4, 7 and 8,
and deferred Warnings 5 and 6 with a named plan. **This call executes that plan.** Every
finding in REPORT-05196cd1 is now addressed.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | `tests/reconciliation-colour-palette-overlay.test.ts` — `test_UAT_AC930_*` | **Warning 6.** Retargeted the test off the `cmdColors` → `cmdColorsAssign` conversion drive that duplicated STORY-97's AC-942, and onto the axis AC-930 uniquely owns: **one** declared entry referenced at three alphas, asserted through `validateSite` + `resolveL1Color` at the authoring boundary. Renamed to `test_UAT_AC930_one_entry_referenced_at_several_alphas_resolves_each_literal_exactly`. **Kept both pieces of distinct content the finding said to preserve** — the whole-byte-range exactness loop (all 255 alpha bytes round-trip) and the opaque-reference case. No command is in the loop any more. |
| 2 | uat-edit | same file — new `test_UAT_AC930_neither_reference_axis_displaces_the_other` | Covers AC-930's fourth paragraph, previously unexercised: the same single entry referenced at an alpha, at a shade, and at both. Composition is asserted **against the two single-axis results**, not a hardcoded hex, so it proves `shade` and `alpha` compose rather than re-deriving the shade maths a second time (the standard Info 9 praised in `reconciliation-colour-shade-axis`). Closes with the entry-side rejection, so neither axis can migrate off the reference. |
| 3 | ac-edit | AC-930 (`acceptance_criterion-bec4d585`) | The paired one-line edit the finding required: AC-930's Verification **mandated** the conversion drive, so removing it from the test without this edit would have left test and AC disagreeing. Verification now says "author a site declaring one palette entry and referencing it at several alphas", adds the shade/alpha composition and entry-rejection clauses, and states explicitly that the `1c colors` retrofit is owned by **AC-942 under STORY-97** and must not be re-driven here. Criterion unchanged — the model claim was never wrong. |
| 4 | code-issue | `tools/generate/src/render/render.ts` | **Warning 5, route (a) — the seam, as planned.** Added `clientJs?: () => string` to `RenderSiteOptions` (:47) as the declared companion to the existing `resolveModule` seam; consumed it at :268 (`opts.clientJs ?? getModuleClientJs`); threaded the resulting `Boolean(clientJs)` into `renderPage` as a `hasClientJs` parameter (:298) and used it for the `<script type="module" src="./capabilities.js">` head line in place of a second direct `getModuleClientJs()` call. |
| 5 | code-issue | `tools/generate/src/cli/commands.ts` | Threaded the same seam through the CLI entry point: `clientJs?: () => string` on `RenderOptions` (:133), passed to `renderSite` at :153. |
| 6 | uat-edit | `tests/reconciliation-behavior-modules.test.ts` — `test_UAT_AC702_*` | **The mock is gone.** The negative arm now calls the real `cmdNew` + `cmdRender('nojs', { cwd, clientJs: () => '' })`. The render pipeline, loader, store and emitter are all real; the only substituted thing is the **catalog's** client behaviour, which is precisely the variable the criterion is about. |
| 7 | uat-edit | same test — new positive control arm | The seam had to be shown to be a *substitution*, not a no-op: the same command over the same starter site with the real catalog writes `capabilities.js` and references it **exactly once**. Without this, the negative arm would also pass if `clientJs` were ignored entirely. |
| 8 | uat-edit | same file — `describe` block | Removed the now-dead `afterEach(() => { vi.doUnmock(...); vi.resetModules() })`; there is no mock left to unwind. |

## Code Edits

| File | Lines | Evidence chain |
|---|---|---|
| `tools/generate/src/render/render.ts` | 38-49 (`RenderSiteOptions.clientJs`), 268, 298, and the head line in `renderPage` | **Assessor-directed.** REPORT-05196cd1 Warning 5's suggested edit is verbatim: "Add a resolver/catalog seam to the render path mirroring `assertModuleConforms`'s `resolveModule`, and drop the mock." Chain: (i) TEST-STRATEGY forbids mocking internal components; (ii) the report confirms `vi.doMock('../packages/framework/src/index', …)` was the **only** internal mock among the capability's 103 UATs, carried across four cycles; (iii) it existed solely because `cmdRender` accepted no catalog injection, so there was **no unmocked route** to the empty-catalog branch; (iv) the fix mirrors a seam already shipping on the same options object (`resolveModule`, :35) rather than inventing a new pattern. **Behaviour-preserving**: the head line was `!edit && getModuleClientJs()` and is now `hasClientJs`, computed as `edit ? '' : clientJsOf()` — identical truth table, and one redundant catalog read removed. Default path unchanged for every existing caller (`clientJs` is optional). |
| `tools/generate/src/cli/commands.ts` | 126-133 (`RenderOptions.clientJs`), 153 | Same chain — the seam is only reachable from the UAT if the CLI entry point forwards it. `opts.clientJs` is `undefined` for every existing caller, so `renderSite` falls through to `getModuleClientJs` exactly as before. |

## Verification

**The change is to the render path, so I verified beyond the two edited files.**

| Run | Result |
|---|---|
| `reconciliation-behavior-modules.test.ts` (full) | 9 passed, 1 failed — the failure is the known `listen EPERM` on `test_UAT_AC703_*` |
| `reconciliation-colour-palette-overlay.test.ts` + `reconciliation-colour-census-and-retrofit.test.ts` | **15 passed** — AC-930's two new tests pass, **and STORY-97's AC-942 retrofit tests still pass**, confirming the drive I removed from AC-930 was genuinely duplicate and not the only evidence for it |
| `generate` + `1c-astro-free-render` + `edit-render-channel` + `req116-edit-render` + `req89-astro-lazy` | 5 files, **39 passed** — the edit-channel files matter most, since `!edit && …` was the expression I rewrote |
| `behavior-l1-composition` + `req88-l1-repro-pipeline` + `l1-one-colour-system` | 3 files, **14 passed** |
| `l1-authoring-envelope` + `responsive-layout-track` + `1c-cli-output-hygiene` | 3 files, **13 passed, 1 skipped** |
| `scaffold-starter-l1` + `req102-scaffold-l1` | passed |

**One apparent regression was investigated and cleared.** `reconciliation-clean-page-urls.test.ts`
reported 6 failures. Rather than assume, I stashed **only** the two production files and
re-ran `test_UAT_AC915_*` against the pre-change code: it fails identically with
`Error: listen EPERM: operation not permitted 0.0.0.0` after a 60s timeout. These are the
sandbox's socket denial (report Note 4's class), not my edit. Stash restored and confirmed.

**A full `npm test` was attempted and abandoned honestly.** It ran past 600s without
producing output and was stopped; a subsequent 8-file batch was OOM-killed (exit 137).
This worktree cannot run the whole suite — the socket-bound files each burn a 60s timeout
and the Astro-container files are memory-heavy in parallel. I therefore verified by
targeted batches over **every non-socket consumer of `cmdRender`/`renderSite`/
`renderSiteFiles`**, listed above, rather than claiming a green suite I did not observe.

## needs_review Items Forwarded

None. No finding in REPORT-05196cd1 was categorized `needs_review`.

## Status of All Eight Findings

| # | Severity | Finding | Resolved in |
|---|---|---|---|
| 1 | violation | AC-685 ¶1/¶2 over-claim | REPORT-2412 — ac-edit (narrowed to DOC-2 §2 families) |
| 2 | violation | AC-1012 silent skip + unproven fidelity clause | REPORT-2412 — `it.runIf` split + ac-edit |
| 3 | violation | live `test_UAT_AC718_*` against a deprecated AC | REPORT-2412 — assertions folded into AC-701, test deleted |
| 4 | warning | AC-1009 / AC-1011 silent gates | REPORT-2412 — `it.runIf` split |
| 5 | warning | AC-702 internal mock | **this call** — `clientJs` seam + mock removed |
| 6 | warning | AC-930 duplicates STORY-97's AC-942 | **this call** — test retargeted + paired ac-edit |
| 7 | warning | AC-686 / AC-687 unexercised clauses | REPORT-2412 — ac-edits cross-referencing AC-849/AC-850 |
| 8 | warning | AC-928 clauses proven only by FC-named tests | REPORT-2412 — two tests renamed to `test_UAT_AC928_*` |

`grep -rl 'vi\.(doMock|mock)\(' tests/reconciliation-*.test.ts tests/req93-*.test.ts` now
returns **nothing** — the internal-mock finding is closed at the source, not annotated
around.

## Note for the Assessor

Three ACs remain unexecutable in this worktree — **AC-703, AC-888, AC-1344**, all
`listen EPERM`. Per report Note 4 these are not findings and were not touched. If the
matrix needs their pass state it must come from a runner with socket permission. The
same sandbox limit now also visibly affects `reconciliation-clean-page-urls.test.ts`
(AC-915…922, a different capability), which I verified is pre-existing and unrelated to
this call's changes.
