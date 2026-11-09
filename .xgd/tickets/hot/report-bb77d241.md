---
uid: report-bb77d241
id: REPORT-11713
type: report
title: 'Code Review: bug-00de1faf'
created_by: xgd
created_at: '2026-11-09T05:28:48.066261+00:00'
updated_at: '2026-11-09T05:28:48.066261+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bug-00de1faf
  overrides_audited: 2
  trust_boundary_overrides: 0
  anchor_uid: bug-00de1faf
---

# Code Review

**Result**: PASS

## Summary
The display panel now keeps one iframe per document mode, created at registration. A mode switch changes which frame is visible (hidden frames use `visibility: hidden`, never `display: none`) and navigates nothing; a frame navigates only when it is stale or its URL differs, and the idle channel is primed after a load. The builder now binds to the panel's `document` event, and `panel.reloadDocument()` replaces the three per-frame `location.reload()` call sites. The implementation matches every point in the BUG-79 Fix section and its technical consequences. 2 overrides audited, 0 touched a trust boundary.

## Quality Gates
- Lint: success. Build: success. Preflight: pass. Overall: success (report 2026-11-09T05:18:32Z).
- Re-run by the reviewer: `pnpm vitest run` over tests/test_UAT_FC_BUG-79_flip_in_place.test.ts, tests/test_UAT_FC_REQ-215_panel_control.test.ts, tests/test_reconciliation_builder_flip_in_place.test.ts, tests/test_reconciliation_builder_page_carry.test.ts, tests/req115-builder-composition.test.ts, tests/reconciliation-builder-workspace-chrome.test.ts and tests/reconciliation-palette-popup-surface.test.ts: 7 files and 55 tests passed, 0 skipped. The jsdom 'navigation not implemented' line is a virtual-console notice from `location.reload()` under jsdom, not a failure.

## External Interface Accessibility
The new code is wired in:
- `panel.reloadDocument()` is called from app.js for the palette write (onChanged), the assistant write (onSiteChanged) and the segment save (onSaved).
- `panel.on('document', rebind)` replaces `panel.frame.addEventListener('load', rebind)` and is unbound in destroy.
- The `frame` getter still serves all readers (app.js, toolbar.js).
- `follow`, `prime`, `display`, `navigate` and `invalidate` are internal and all reachable.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| apps/control-app/src/builder/toolbar.js:301,309 | `panel.frame.contentDocument` / `panel.frame.contentWindow` are read without a null guard, though `panel.frame` can now be `null` (panel.js getter); app.js guards every read with `?.`. This does not seem reachable today, because the panel selector is built for a document mode after `show()` has set `current`. | Warning |
| apps/control-app/src/builder/panel.js (`display(null)` / `get frame`) | During a mount mode, `current` keeps the last document frame, so `panel.frame` returns a hidden frame, which contradicts its description ('the frame the pane is showing'). A `reloadDocument()` call in that state would reload a hidden frame. | Warning (low) |
| apps/control-app/src/builder/panel.js (makeFrame load listener) | `prime()` runs on every frame's `load`, including hidden frames, not only after the visible frame loads as its comment says. It does no harm, because priming a frame already at the target URL does nothing. | Info |

Otherwise the structure is clear and consistent with the panel's existing pattern of a registry of modes with no per-mode switch. There is no debug code, no commented-out blocks and no TODOs; the class names are module constants; and the old single-frame code paths were removed rather than left alongside the new ones.

## Checklist Compliance
No architecture, security or design checklist report exists, so this section was skipped. Architecture policy: the change is confined to control-app frontend code and touches no Worker, DO or storage. Security policy: the change touches nothing on the site-definition-to-render path.

## Smoke Test
N/A. No CLI command or API endpoint was added or changed. The builder entry point (`mountBuilder`) is exercised end to end by the real-composition UATs above.

## Mode Override Audit
2 overrides audited, 0 touched a trust boundary.

**report-79175cb7** (code_frozen, rung 1)
1. `unnamed_files_touched` is empty; only one test file was touched. Pass.
2. The tests pass on reviewer re-run. Pass.
3. The change agrees with BUG-79 on priming after a site change. Pass.
4. The diff only moves an observation-timing assertion onto the `src` attribute, which the planner explained. Pass.
5. `trust_boundary_touched` is false. Pass.
6. No production file was edited. Pass.

**report-569fb9d5** (code_frozen, rung 1)
1. `unnamed_files_touched` is empty; the only production file touched is panel.js, the named file. Pass.
2. The tests pass. Pass.
3. `follow()` makes a flip after the operator follows a link reveal the frame in place, which BUG-79 requires ('never for a mode switch'). Pass.
4. The diff does exactly what the planner instructed: it records the live href on load, ignoring about:blank, inside try/catch; staleness, reloadDocument, setSite/refresh and the visibility classes are unchanged; and the AC2496 and AC2517 assertions are those the planner specified. Pass.
5. `trust_boundary_touched` is false and `trust_boundary_mismatch` is false. Pass.
6. Only the named file was edited and no behaviour beyond the intent was added. Pass.

## Issues Found
**Critical (must fix)**:
- None.

**Warnings (should fix)**:
- toolbar.js:301,309: guard `panel.frame` with `?.` to match the getter's nullable contract.
- panel.js: during a mount mode, `panel.frame` / `reloadDocument()` resolve to a hidden frame. Either return `null` while the host is shown, or reword the getter's description.
