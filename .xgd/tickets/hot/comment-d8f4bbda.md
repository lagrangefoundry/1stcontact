---
uid: comment-d8f4bbda
id: COMMENT-808
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-07T21:09:30.630867+00:00'
updated_at: '2026-08-07T21:09:30.630867+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-5a8ec0a7
  kind: note
---

Both violations from report-92b9aee8 are resolved; completion report is **report-5a8ec0a7** (`progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`).

**What changed**

Both criteria needed a mounted workspace *and* a live origin simultaneously — the chrome suite is jsdom with no origin, the origin suite is node with no DOM. So I added `tests/reconciliation-builder-workspace-mounted.test.ts` (jsdom + real `startBuilder` over a real two-site store) to hold them.

1. **Finding 1 (AC-1029, uat-add)** — authored `test_UAT_AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel`. The test registers no modes of its own: it asserts `panel.getModes()` offers `edit` alongside `view` straight out of `mountBuilder`, that selecting it makes the *displayed* address the site's edit channel (distinct from the view address), that fetching that displayed address over the origin returns that site's edit rendering, and that mode and site compose (`setSite('beta')` → beta's edit channel; back to `view` → beta's ordinary channel).

2. **Finding 2 (AC-972, uat-edit)** — kept every assertion the old test made and added the load-bearing half: `mountBuilder` gets the app's own `publishSite` aimed at the real origin, the panel opens on `alpha`, `setSite('beta')` is the operator's selection, the real publish control is *clicked*, and beta reaches revision 2 while alpha stays at 1. A regression sending `sites[0].slug` now fails. Removed the superseded copy from the origin suite with a breadcrumb.

**Test results:** mounted suite 2 passed; origin + chrome 11 passed / 9 skipped; the free-coded builder suites 3 passed / 19 skipped. Nothing that passed before fails now. The mounted halves of both tests report themselves *unverified* on this machine (`@gendevlabs/webui-*` not installed) rather than passing quietly — the same discipline the sibling suites use, and no stand-in panel was substituted to get a green run.

**Not done:** finding 3 (AC-973) is a warning that does not gate. Both repairs the assessor offered have real costs — a mirrored browser test would break the 1:1 AC↔UAT mapping, and jsdom pointer events are noise because `webui-split` reads zero-sized rects there — so I left it and recorded a recommendation in the report rather than weakening the AC text. No production code was touched.
