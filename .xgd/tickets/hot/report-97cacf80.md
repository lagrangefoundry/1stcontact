---
uid: report-97cacf80
id: REPORT-1811
type: report
title: 'Reconciliation Review: commits (BUG-33 builder toolbar re-derivation and control
  lifetime)'
created_by: xgd
created_at: '2026-08-10T11:31:06.251142+00:00'
updated_at: '2026-08-10T11:31:06.251142+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bug-ede1fb8c
  anchor_uid: bug-ede1fb8c
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: —
**Anchor**: bug-ede1fb8c (BUG-33, type `bug` — the anchor IS the intent)
**Stories Reviewed**: 1 (story-e674c60a / STORY-99, CAP-85)

## Step 1 — Intent as stated

BUG-33's body and commit `af78081b` agree, and both are emphatic about the same
boundary: **test-side only, no product code changed**, *"in every case the live
control was already correct"*, *"No assertion was weakened"*. The declared goal
was to clear red assertions in the builder suites that were all one defect
class — the test holds a handle the product has since replaced and asserts
against the detached survivor. The ticket itself records the two product
properties it *diagnosed* (rebuilt strip; `openLoneControl` opening a one-field
form into its control) as pre-existing, not introduced.

No comments on the anchor add or supersede scope beyond this.

## Behavior Inventory

7 behaviors identified by independent reading of `toolbar.js`, `panel.js`,
`editor.js` and the three commit-touched suites.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `render` is wired to BOTH `panel.on('mode')` and `panel.on('site')` (toolbar.js:97) — a site change replaces the whole strip, not just the site-dependent control | Covered | story-e674c60a | AC-970 widened: trigger is now "mode *or* site". Was the plan's central gap |
| 2 | Every rebuilt control is constructed against current state — `siteSelectorAction.create` re-reads `panel.getSite()`, so the selector's shown value follows a site change from selector / restore / programmatic | Covered | story-e674c60a | AC-970, all three change routes named in the criterion and exercised |
| 3 | `disposeActions()` releases every subscription the outgoing controls took via the injected `subscribe`, clears `mounted`, `replaceChildren()` — a replaced control is inert by construction | Covered | story-e674c60a | AC-1110 (new). Previously load-bearing in code (docstring toolbar.js:36-47) and absent from the matrix |
| 4 | `api.destroy()` releases the toolbar's own `offPanel` subscriptions plus the action set, so a remount does not leave the previous strip reacting | Covered | story-e674c60a | AC-1110 second clause |
| 5 | The root element is created once and re-populated; the strip keeps its place in the layout through a re-derivation | Covered | story-e674c60a | AC-970 ("the strip itself persists") |
| 6 | A mode naming an unregistered action throws rather than rendering a partial strip | Covered | story-e674c60a | AC-970, pre-existing clause, still asserted |
| 7 | `setMode`/`setSite` emit `src` via `refresh()` before `mode`/`site`, so no rebuild observes a stale URL; both are no-ops when unchanged | Covered | story-e674c60a | AC-971 ("no ordering in which the two can disagree"); the no-op half is asserted under AC-970 |

Behaviors in the commit's blast radius that belong to other capabilities —
`openLoneControl` (AC-1044/AC-1004, STORY-101 / story-3bf94bd4) and the
open-in-new-tab target across a site change (AC-971) — were already reconciled
before BUG-33 was raised. The plan declined to duplicate them; verified correct,
both criteria already say what the fixed tests now assert.

## Intent Fidelity

| Intent claim | Verdict | Evidence |
|---|---|---|
| "No product code changed" | Faithful | `git diff main...HEAD` touches only `.xgd/tickets/*`, `package.json`, one new test file and three test files with comment-level edits. No file under `apps/` or `packages/` |
| "The live control was already correct" | Faithful | Stories document the code's actual properties (1-5 above); nothing claims a fix |
| "No assertion was weakened" | Faithful | Reviewed the diff of all three commit-touched suites: comment rewrites plus one local rename (`control` → `input`). No assertion removed, relaxed, or re-scoped |
| Stale inline comment `// Re-render on every mode change` above a line subscribing to both | **Divergence flagged, not absorbed** | STORY-99 Technical Context records it explicitly as commentary-only with no behavioural difference, and states that reconciliation changes no runtime code. This is the correct handling — the divergence is on the record rather than silently normalised |

No story describes behaviour the code does not have. No story documents code
behaviour that contradicts the intent ticket.

## Ungrounded Stories

None found.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Builder workspace toolbar — control re-derivation and control lifetime (upgrade, story-e674c60a) | story-e674c60a | ✓ AC-970 modified (`acceptance_criterion-60683857`, commit `4722d20e1`); AC-1110 added (`acceptance_criterion-8cc0c9f2`, commit `4e229aff7`); STORY-99 body updated in both the in-scope bullet and Technical Context |

One plan item, one story updated. Nothing dropped. The plan's stated
`intent_delta_summary` — widen AC-970's trigger, add a lifetime criterion,
remove/weaken nothing — matches what landed: AC-970's mode clause and AC-971's
target-identity guarantee both stand as written.

## Step 5b — Evidence Sufficiency

Executed: `npx vitest run tests/reconciliation-builder-toolbar-lifetime.test.ts tests/reconciliation-builder-workspace-chrome.test.ts tests/req115-builder-composition.test.ts` → **3 files passed, 20 tests passed, 0 skipped** (webui components installed, so `describe.skipIf` gates were live, not skipped).

**AC-970** — `test_UAT_AC970_the_toolbar_renders_exactly_the_active_modes_controls` (chrome suite) and `test_UAT_AC970_a_site_change_re_derives_the_whole_strip_against_the_current_site` (lifetime suite).
- Real entry point: `mountBuilder` from `apps/control-app/src/builder/app.js` against the actually-installed shared components. No internal mocking; the only stand-ins are jsdom-absent browser globals (`ResizeObserver`, `matchMedia`) and a `Storage`-shaped map.
- Discriminating: the site-change half compares **element identity** (`expect(el).not.toBe(before[i])`), so a strip that merely re-rendered the same nodes — or one wired only to `mode` — fails. All three site-change routes are separately exercised (programmatic `setSite`, a real `change` event on the selector, and a second mount restoring from the same storage), so the trigger cannot be misread as "the selector updated itself". The no-op clause is asserted by identity too. The unknown-action clause asserts the thrown message.
- Not source-inspection; no `.ts`/`.js` text is read anywhere.

**AC-1110** — `test_UAT_AC1110_a_replaced_control_stops_reacting_and_nothing_accumulates`.
- Freezing: captures the live anchor, forces one re-derivation, then a second change, and asserts the captured handle's `href` is unchanged while the strip's current control equals `panel.getSrc()` — with an explicit non-vacuity assertion that the displayed document genuinely moved between the two.
- Accumulation: instruments the **real** panel's `on` in place (no substitution) and drives 20 further re-derivations, asserting the live-subscriber count at the panel does not grow — plus `expect(afterOne).toBeGreaterThan(0)`, so a toolbar that subscribed to nothing could not pass by staying at zero. This is the measurement point AC-1110 mandates.
- Teardown: after `toolbar.destroy()`, counted subscriptions reach 0, `ids()` is empty, and a subsequent `setSite` moves `panel.getSrc()` while `ids()` stays empty — proving the *strip's own* `offPanel` release, not merely that the panel stopped emitting. A remount is then shown to react alone.
- Would a broken implementation pass? No. Removing the `subscribe` indirection (so actions register directly on the panel) breaks the count assertion; removing `offPanel` release in `destroy` repopulates `mounted` and breaks the empty-`ids()` assertion; a strip wired only to `mode` breaks the identity assertions in the AC-970 test.

**AC-971** — `test_UAT_AC971_open_in_a_new_tab_always_targets_the_displayed_document` passes and compares the control's `href` directly against the frame's live `src` at each transition rather than reconstructing an expected URL. Unchanged by this reconciliation; re-verified because AC-1110's probe is the same control.

## Judgment Calls

- **`openLoneControl` and the open-in-new-tab target left to their existing criteria** — acceptable. AC-1044 already documents `openLoneControl` including the two-field carve-out, and AC-971 already covers the target across a site change. Adding items for them would have duplicated the matrix, and a "the tests now re-read their handles" item would be a test-only story, which is prohibited.
- **AC-1110 as its own criterion rather than a clause on AC-970** — the plan flagged this as a judgment call and stated it. Accepted: its verification is different in kind (count live subscribers at the panel across repeated rebuilds vs. compare rendered ids), and the test file reflects that split cleanly.
- **`req115-builder-shell.test.ts` load-induced flake** — recorded in BUG-33, not addressed by the commit, not a matrix gap. Correctly excluded from the plan.
- **Ambient `test_UAT_FC_*` naming in the TypeScript suites** — a standing repo-wide convention (~1028 names), well outside BUG-33's scope. No plan item touches it; not a finding here.
- **Observation, not a gap:** AC-1110 carries no `uat_coverage` field while its siblings AC-970/AC-971 read `pass`. Its UAT exists and passes; populating that field is structural bookkeeping owned by validation downstream, not story-level coverage.

## Verdict

**PASS** — Stories accurately and completely document the behavior surface within
BUG-33's declared scope. The two properties that were load-bearing in
`toolbar.js` and absent from the matrix — the wider re-derivation trigger and
control lifetime — are now stated, and the one genuine intent/code divergence
(the stale inline comment) is flagged in the story rather than absorbed. No
product code was changed, consistent with the reconciliation constraint and with
the operator's stated boundary. All plan items produced output, and every active
AC touched here has passing UAT evidence that a broken implementation could not
satisfy. A developer reading these stories would have a correct mental model of
what this code does and of what the operator intended.
