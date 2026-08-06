---
uid: report-4320dc45
id: REPORT-1391
type: report
title: 'Sync-main review: reconcile-BUNDLE-11'
created_by: xgd
created_at: '2026-08-06T04:54:09.981582+00:00'
updated_at: '2026-08-06T04:54:09.981582+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: sync_main_review
  subject_uid: reconcile-BUNDLE-11
---

{
  "findings": [
    {
      "risk": "LOW",
      "file": "tools/generate/src/l1/fold.ts",
      "description": "Main added test_UAT_FC_BUG-11_surface_ids_are_contiguous_after_the_band_filter (commit 4d0985957) asserting synthesized surface ids are dense ('surface-1' must not exist without 'surface-0'). Branch commit 1444a79fb deleted tests/bug11-fold-surface-fill.test.ts and this is the ONLY one of its 9 UATs with no successor in tests/bug14-fold-surface-hierarchy.test.ts. The replacement code emits `section-band-${oi}` (fold.ts:1472) where `oi` is the raw `order.forEach` index and an early `if (keyframes.length === 0) return` (fold.ts:1457) skips an entry without emitting, so band ids can be sparse - the exact condition the deleted test guarded. Assessed LOW, not a regression: the test's stated rationale was that ids are 'the pairing/debug handle', but pairing now goes through isSynthesizedSurfaceId (fold.ts:801), which matches by PREFIX ('section-band-', 'section-bg-', 'card-') and never by index, so a gap cannot mispair leaves, cause id collision, or break the overlap exemption. The loss is regression coverage for a now-cosmetic invariant, not behaviour."
    },
    {
      "risk": "OK",
      "file": "tests/bug14-fold-surface-hierarchy.test.ts",
      "description": "Verified no revert of main's intent in the bug11 deletion. tests/bug11-fold-surface-fill.test.ts is the only path present in main and absent in HEAD (git ls-tree comm), and it is a deliberate supersession: 1444a79fb rebuilds the flat 'surface-*' model into a section-band -> card -> text hierarchy and renames the suite BUG-11 -> BUG-14. Main's two later behavioural UATs from prior bundle-cceaba25 both survive with assertions adapted to the new id scheme: _synthesized_surfaces_do_not_mispair_real_box_leaves (bug14:207) and _only_synthesized_surfaces_are_exempt_from_overlap (bug14:237, exemption regex updated to /^(section-band-|section-bg-|card-)/ at line 265). The remaining bug11 UATs map to bug14 equivalents; _surface_gradient_emits_backing_box_even_on_band migrated to test_UAT_AC731 in tests/reconciliation-l1-fold-full-language.test.ts:317, which asserts expect(gradients).toEqual([undefined, gradient]) for a run whose surfaceFill equals the band - the same invariant. Main's security/envelope additions all survive: CSS_URL_ALLOWED and cssUrl in packages/framework/src/l1/render.ts, URL_FORBIDDEN_CHARS and the rotateDeg range in packages/site-schema/src/l1/validate.ts."
    },
    {
      "risk": "OK",
      "file": "CLAUDE.md",
      "description": "Briefing's 'Changed Files (deleted)' list is inverted and must not be read as main deletions. Verified with `git log --full-history main -- <path>`: main has NO history whatsoever for packages/site-schema/src/l1/layout.ts, fonts/registry.yaml, tools/generate/src/cli/gate.ts, packages/site-schema/src/fonts.ts, packages/framework/src/l2/contact-form.ts and the req100-107 tests - main never held them, so nothing was resurrected. They are the branch's own free-coded work being promoted (e.g. 61c7985e7 feat(l1) responsive layout track, ebdbd2c76 feat(fonts) provenance registry, 2855263f4 feat(gate) reconcile l1-gate). Rebase is clean: main is a strict ancestor of HEAD (0 commits in HEAD..main), no conflict markers in any .py/.yaml/.yml/.ts file, and no rebase-merge/rebase-apply state. CLAUDE.md's 6 removed lines are the REQ-79/REQ-84 module guidance being replaced in place by the REQ-96 text (config is data-only, dials.ts being dismantled) - a forward evolution, not a revert."
    }
  ]
}
