---
uid: report-09e84a29
id: REPORT-1789
type: report
title: Claude fix_reconciliation_review report
created_by: xgd
created_at: '2026-08-10T10:17:28.708151+00:00'
updated_at: '2026-08-10T10:17:28.708151+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-e59210c5
---

All green. Here's what I did.

## The gap

The review's single blocker was **Gap 1**: AC-1050 (`acceptance_criterion-170a171f`, story-3bf94bd4) landed with `status: pending` and no UAT anywhere in `tests/` — the only criterion in this reconciliation documenting shipped, user-visible behaviour without evidence. I took the review's preferred remediation (option 1): evidence it, then activate it.

## Stories

- **Created**: none
- **Modified**: none — the review found no ungrounded stories and no uncovered behaviour needing a new one
- **Deleted**: none

## Acceptance criteria

- `acceptance_criterion-170a171f` (AC-1050) — `pending` → `active`, now backed by `test_UAT_AC1050_a_painted_panel_opens_its_background_picker_over_the_same_transport`. The `test_UAT_AC10xx` run in `tests/` is unbroken 1031…1109.

## Code changes (all test-side)

- **`tests/reconciliation-copy-edit-gesture-modal.test.ts`** — story-3bf94bd4's own dialog suite. Fixture gains a painted panel carrying a background (`0.2`) beside the existing dead-end panel, plus the site's image assets, so the two panels differ in exactly one thing. New AC-1050 UAT walks the whole gesture over a rendering **served by the origin**: the click resolves to the panel (and its own copy still resolves to itself); `/api/copy` answers one required closed-option field, options = the site's images, pre-filled from the draft; the dead-end panel still answers empty; an off-list handle comes back a field-scoped 400 with the draft byte-identical and the page still painting hero. The dialog half then drives the **real** `mountEditor` + `webui-fields`: the dead-end panel opens the message, the painted panel opens one `select.fields-control` with exactly the site's images selected on the current handle and no free-text route; a refused Save leaves the form open holding the choice with the reason shown and nothing written; corrected and re-confirmed, the served page repaints to beta, every other paint axis survives, and the gesture is live on the replacement. No `unverified` warnings — the component half genuinely ran.

Three pre-existing failures surfaced when I ran the full suite. All are drift this bundle itself introduced, in FC suites the reviewer never executed; the assertions are unchanged, only stale drivers:

- **`tests/reconciliation-copy-edit-gesture.test.ts`**, **`tests/req117-edit-loop-browser.test.ts`** — REQ-121 opens a one-field form straight into its control, so `.builder-modal .fields-value` no longer exists; the browser halves of AC-997/998/999 and two REQ-117 UATs were still clicking the pre-REQ-121 view cell (30s timeouts). They now wait on the control, and REQ-117's legibility check reads `inputValue()` instead of dialog text.
- **`tests/req11-structured-edit.test.ts`** — REQ-130 made `editConfigSet` take a **typed** value, with the JSON re-read moved to argv where it belongs. Two call sites still passed `JSON.stringify(...)` / `'123'`; now they pass a real array and a real number.
- **`tests/req115-builder-composition.test.ts`** — the toolbar now disposes an action's panel subscriptions with the element (the leak fix in `toolbar.js`), so a reference captured once goes detached across a site change. The test now reads the live control each time.

**Full suite: 200 files passed, 4 skipped, 1418 tests passed, 0 failures.**

## Confidence

High that the next review passes. The one gap it named is closed exactly as it specified — UAT written to the criterion's own Verification section, then activated — and the coverage map's other 77 entries were untouched. The residual risk is a reviewer preferring AC-1050's evidence in `reconciliation-copy-edit-background-selection.test.ts` (the review offered either home); I chose story-3bf94bd4's own dialog suite because the claim is a gesture/form claim and that suite is where the real dialog is driven.
