---
uid: report-bb5eb085
id: REPORT-1970
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-08-13T02:06:19.095236+00:00'
updated_at: '2026-08-13T02:06:19.095236+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: request-1ff09fab
---

Done. All changes are in the working tree, uncommitted — matching how prior `fix_review_free_coded` runs land (the workflow engine commits them).

## Issues fixed

**Critical — capitalisation does not preview** (`builder.css:281-284`)

Added the rule that re-declares the inheritance the UA stylesheet breaks:

```css
.builder-modal__box .fields-control {
  text-transform: inherit;
  letter-spacing: inherit;
}
```

`page-style.js` and `editor.js` are untouched, as the report directed — the `textTransform` row was writing the right property to the right element all along; only the control's inheritance was missing.

I also amended the comment block at `builder.css:214-232`, which claimed *"Nothing here targets a component class"* — a claim this rule contradicts. It now records the exception and why it's safe: there is no `--fields-*` seam for these two axes, and a component rename can no longer strand the rule *silently*, because AC-1138 measures the words in a real browser.

**Warning — `letter-spacing` never reached the words either** (same rule). The review called this optional; it's the identical UA reset one line apart, so fixing one and not the other would leave a known-false claim in the same block. No test pinned it as not-arriving, and none broke.

**The evidence that pinned the defect as correct** (`reconciliation-copy-edit-live-preview.test.ts:493-522`) — `expect(...transform, 'and does NOT reach the words').toBe('none')` now asserts `'uppercase'`, the `onBox` assertion is kept so a regression in either half is attributable, and capitalisation gets the same two-sided off-clears treatment italic already had (select `none` → the words read `none`). File header (`:15-25`) and the three inline comments describing the divergence are rewritten to state the behaviour and name the UA reset as why the rule exists.

## Verification

- **The new assertion bites**: with the CSS rule removed, AC-1138 fails `expected 'none' to be 'uppercase'`. Restored → passes.
- **Browser halves genuinely ran** — AC-1138 1.88s, AC-1140 1.05s, no `NOT VERIFIED` warning emitted.
- **Regression scope**: 111 passed across the 14 editor/modal and stylesheet-inspecting suites.
- **Full suite**: 1544 passed, 13 failed, 4 skipped. The 13 are the same pre-existing API-key failures the review identified — `reconciliation-assistant-conversation`, `test_UAT_FC_REQ-122_chat_host`, `test_UAT_FC_REQ-127_session_binding` — and no others.

## Not applied: Fix-It steps 3 and 4

The report asks me to rewrite AC-1138 (`acceptance_criterion-2d587432`) and story-3bf94bd4 to drop the divergence framing. **This prompt's WHAT NOT TO DO forbids it** — "Do NOT modify stories, capabilities, or acceptance criteria — matrix mutations belong to the reconciliation review fix loop, not here." I followed the prohibition rather than the report.

So both texts are now stale in exactly the way the review warned about: AC-1138 still claims three parameters and records capitalisation as a divergence, while the code and its UAT now say four. I recorded the required rewrite verbatim on each ticket as a note (COMMENT-998 on the AC, COMMENT-999 on the story) so whoever owns the matrix can apply it without re-deriving it.

The `report-843ab059` `suites: {}` warning is a project quality-gate config gap, explicitly not a REQ-138 finding, and out of scope here.

## Confidence

**High on the code**, moderate on the verdict. The critical defect is fixed and proven by mutation in a real browser, and the test that documented it as intended now documents the opposite. The residual risk is that the re-reviewer reads AC-1138's stale body — which its own fix-it prompt asked me to change and this loop's rules forbid me from changing — and fails on that. If it does, that is the matrix loop's item, not a code defect.
