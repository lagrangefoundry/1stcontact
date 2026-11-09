---
uid: report-a6d7eeac
id: REPORT-11686
type: report
title: 'Assessment: BUG-79 flip in place'
created_by: xgd
created_at: '2026-11-09T04:00:19.137838+00:00'
updated_at: '2026-11-09T04:00:19.137838+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: review
  subject_uid: bug-00de1faf
---

# Assessment: BUG-79 — View/Edit flips in place

**Verdict: PASS** (minor, non-blocking findings below)

## Implementation vs. the ticket's Fix section

| Fix requirement | Status | Where |
|---|---|---|
| A frame per document mode, created at registration and kept | Met | `panel.js` `registerMode` → `makeFrame` |
| Hidden by `visibility`, never `display` | Met | `builder.css` `.builder-panel__pane` / `.builder-panel__pane.builder-panel__frame`; `[hidden]` rule removed for frames |
| Navigate only when never pointed, site changed, `refresh()`, or a write | Met | `show()` navigates only when `rec.stale` or the URL differs; `setMode` invalidates nothing |
| Idle channel primed after the visible load, for a different URL only | Met | `prime()` on frame `load`, `sameUrl` check, stale-only frames skipped |
| `document` announced when a loaded frame is shown, not only on load | Met | `show()` else branch; `app.js` subscribes via `panel.on('document', …)` |
| `panel.reloadDocument()` replaces the 3 `location.reload()` call sites | Met | `app.js` palette `onChanged`, assistant `onSiteChanged`, editor `onSaved` |
| `panel.frame` is a getter for the frame on screen | Met | `panel.js` `get frame()` |
| `.builder-panel__frame` only on the shown frame; geometry on `__pane` | Met | `display()` |

## Evidence validity

- `tests/test_reconciliation_builder_flip_in_place.test.ts` (AC2517–AC2522) drives the real `mountBuilder`, panel, toolbar, carry and framework edit bridge. The jsdom shims (load interception, scroll recording, counting reloads) are at the browser boundary. Nothing internal is mocked. **Valid.** All 6 pass in the scoped quality report REPORT-11685.
- `tests/test_UAT_FC_BUG-79_flip_in_place.test.ts` uses the real composition and no mocks. **Valid**, and I ran it locally: it passes.
- The adjusted suites (req115, AC-968 chrome, AC-1249 palette, REQ-215 panel control) were re-run locally: 5 files, 40/40 tests passed.

## Findings (non-blocking)

1. **Scoped quality did not run the free-coded UAT file.** The scope filter is `test_UAT_FC_BUG_79` (underscore), but the test names are `test_UAT_FC_BUG-79_…` (hyphen, the project convention, the same as `test_UAT_FC_REQ-215_…`). The AC-backed suite covers the same behaviour, so the evidence holds. The id normalisation in the filter looks like an XGD tool defect and is worth an `xgd report-bug`.
2. **A mount mode leaves `current` pointing at a hidden frame** (`panel.js` `display(null)` keeps `current`). While a mount mode shows, `panel.frame` returns a hidden frame, a late `load` on it emits `document`, and `reloadDocument()` reloads it. No mount mode is registered today, so this cannot happen yet. Remediation: track the shown record separately from the last document record, or clear `current` in `display(null)` and guard `reloadDocument`.
3. **The FC write test is weaker than its name.** In `test_UAT_FC_BUG-79_a_write_reloads_the_shown_page_and_stales_the_others` (lines 184–205), the only check is that no `document` is announced on the flip. It does not check that the stale view frame is re-pointed. AC2521 in the reconciliation suite checks this properly, so it is a gap in the FC file only.
4. `toolbar.js:301` and `:309` still dereference `panel.frame.` without `?.`, while `app.js` was hardened to `panel.frame?.`. This is safe today because a src mode is always registered before the toolbar is created. It is inconsistent, though.
