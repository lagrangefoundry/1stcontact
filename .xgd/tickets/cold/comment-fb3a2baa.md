---
uid: comment-fb3a2baa
id: COMMENT-386
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-07-23T11:11:19.672772+00:00'
updated_at: '2026-07-23T11:11:19.672772+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-feb7be57
  kind: note
---

Report created: **REPORT-845 (report-feb7be57)** — result **FAIL**.

## Assessment Summary — CAP-64 "1c Gradient Fidelity", uat level

**Verdict: FAIL** — 1 violation, 1 warning, 0 needs_review.

### The violation (AC-637)
AC-637 requires *rendering* a text-block into a **padded, rounded, inset gradient panel** ("not a flat, full-bleed band"). That behavior is both **untested and retired**:

- **No `test_UAT_AC637_*` test exists** anywhere in the repo. The only coverage is `test_UAT_FC_REQ-62_panel_gradient_stops_absolute_or_overlay` (`tests/req62-gradient-panel.test.ts:69`), which asserts the resolver returns the CSS string `background-image: linear-gradient(...)` — it never renders a panel and never asserts padded/rounded/inset layout.
- The render vehicle — the **`text-block` module — was deleted by REQ-84** (bundled; `packages/framework/src/modules/text-block/` confirmed gone, catalog reduced to `carousel` + `contact-form`). REQ-62's own out-of-scope forbade re-homing the panel onto any other module, so the "padded, rounded, inset panel" render now has **neither implementation nor test**.
- The reconciliation report `report-0a245f78` **claims** a `test_UAT_AC637_...` render test that was never written.

**Fix**: re-scope AC-637 to the surviving authoring seam (gradient content value → `resolveSurfaceGradient` absolute-or-overlay stops), point a properly-named `test_UAT_AC637_*` at that resolver, and drop the deleted-text-block render language from STORY-76's body.

### Why upper levels passed but uat failed
Story-level (`report-6992c381`) and ac-level (`report-7a858346`) both passed — they validated AC-637 against the STORY-76 body, which *still* describes the text-block panel render and is internally consistent with the AC. Neither cross-checked REQ-84's deletion of that module. The uat check catches it because a test can't exercise a render whose module no longer exists. The durable fix is at the AC/story layer, not just the test.

### The other four ACs — all aligned
AC-634 / AC-635 / AC-636 / AC-638 have substantive UATs driving the real `diffManifests` and `validateModuleContent` (no internal mocking), each matching its AC's full case structure. The one warning is opportunistic dedup between the two test files (AC-636/AC-638 diff+validation scenarios overlap in the same shape) — non-blocking, and the req62 file carries unique real-Chromium capture UATs worth keeping.
