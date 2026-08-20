---
uid: comment-e5dcbee8
id: COMMENT-1215
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T02:13:26.771773+00:00'
updated_at: '2026-08-20T02:13:26.771773+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-9f5abb58
  kind: note
---

**Result: FAIL** — REPORT-2309 (`report-9f5abb58`), 2 violations / 1 warning / 0 needs_review.

The `ac` level passed at 02:06Z today after rewriting one criterion, authoring another, and relabelling a third. The evidence layer did not follow.

**Violation 1 — AC-1240 has no UAT at all** (`uat-add`). The criterion was authored at 01:54:44Z to close REQ-117's "gesture client code derived from the renderer's own source" gap. Enumerating every `test_UAT_AC<n>_` identifier in `tests/` stops at `test_UAT_AC1147` — nothing in the 12xx range. The behaviour ships (`tools/generate/src/cli/builder.ts:462-468` serves `/framework/edit-client.js` derived from `packages/framework/src/l1/edit-client.ts`), so this is absent evidence, not a code bug. The route is touched by AC-977's cacheability probe table but nothing asserts the derivation.

**Violation 2 — AC-966's test was not re-pointed after the AC moved** (`uat-edit`). Commit `2a663c06d` did touch the test, but `git show` confirms it changed only a nine-line comment and left every assertion intact. So the test's operative assertion (`expect(await res.text()).toBe(onDisk)`, origin:132) is precisely the equality restatement the revised criterion disclaims and cedes to AC-1032; the "stylesheet and image references **that page carries**" clause is globbed off the output directory instead of parsed from the document; and the never-rendered-to-disk guard is structurally excluded, since the expectation is read out of `dist`. The new comment concedes it ("this fixture has already rendered, so it is the cheapest way to say 'real content'").

**Warning — AC-973** (`uat-edit`), carried forward unchanged and re-verified: the divider drag is driven through `app.split.setSplit(37)` rather than a pointer sequence, and the rail is asserted as `isCollapsed()` model state rather than as rendering.

Two things worth flagging beyond the findings:

- **AC-1036 is clean** — its 2026-08-20 edit relabelled the confinement paragraph a regression rider naming AC-978/AC-979 as owners, which is what its test already did. That closes the prior cycle's warning 3 without a test change.
- **The AC-1240 fix has a trap.** `test_UAT_AC1006_…` (`tests/reconciliation-copy-edit-gesture.test.ts:842-946`) already asserts nearly every clause AC-1240's Verification names — under a different story in a different capability. Recorded as info finding 4 so the new UAT is written about what *this* origin answers with, rather than cloned.

I verified the shared component store is installed (`@lagrangefoundry/webui-*` present), so the mount-gated evidence for AC-961/963/967/972/1029/1030 is live in this tree rather than silently skipping. No test suite was executed — that is the `uat_coverage_check`'s subject, and every claim about what a test does was read from source at the cited line.
