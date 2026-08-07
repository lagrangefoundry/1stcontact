---
uid: comment-272487b8
id: COMMENT-781
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-07T18:20:01.658303+00:00'
updated_at: '2026-08-07T18:20:01.658303+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-575629c5
  kind: note
---

Done — the single violation is repaired and the completion report is filed (REPORT-1601 / `report-575629c5`).

**What was wrong:** AC-873's title claimed the exact inverse of its own body — that a new site's colours "come from the site's own **theme tokens, not from literals**", when REQ-114 (BUNDLE-14) deleted `paletteTokensSchema` and the `theme.palette` key outright. The body had been updated for the retirement on 2026-08-06; the title had not.

**Three mutations:**

1. **AC-873 retitled** to "A newly created site states its document background and placeholder colour as hex literals in its own layout document, and declares no palette". Body and Verification left untouched, per the assessor's explicit instruction.
2. **STORY-93's `## Story` line** — still read "in the site's own theme colours", the identical pre-REQ-114 claim, contradicted by its own Description bullet and Technical Context. Replaced with "in colours the page's own document declares".
3. **CAP-89's Scope § "The authoring start point"** — same phrase, same replacement.

Edits 2 and 3 are the same repair on the surfaces the ac-level pass doesn't read. I applied them in the same call so the corrected AC title doesn't sit contradicting its own parent story and capability; both were minimal phrase substitutions with the occurrence count asserted before writing.

**Verification:** I swept the titles of all 35 active ACs across the capability's four stories — AC-873 was the only one carrying a retired mechanism. AC-873's UAT already encoded the corrected position (the test file's header comment names REQ-114's retirement explicitly), which independently confirms the title was the sole stale surface. `vitest run tests/reconciliation-scaffold-starter-l1.test.ts` → 7 passed, 1 skipped; AC-873's UAT passes.

**Two things I flagged rather than fixed,** both uat-level:
- AC-871's UAT is *skipped*, not passing, while STORY-93 carries `uat_coverage: pass`.
- AC-870's UAT is still named `..._centred_on_theme_background` — same retired vocabulary in a test name. I left it because test names are referenced by evidence sets, so the rename should happen where those references can be updated together.

`needs_more_work: false`, `violations_remaining: 0` — ready for the assessor.
