---
uid: comment-cd7430c7
id: COMMENT-811
type: comment
title: Claude response for fix_uat_coverage report
created_by: xgd
created_at: '2026-08-07T21:26:43.419833+00:00'
updated_at: '2026-08-07T21:26:43.419833+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c95d6073
  kind: note
---

Done — the single violation is resolved.

**Finding 1 (violation, `uat-edit`, AC-967)** — the old test handed `mountBuilder` a hardcoded literal and asserted the selector matched that same literal, standing in for the very clause the criterion is about; nothing asserted what `/api/sites` returns.

I **moved** `test_UAT_AC967_*` from `tests/reconciliation-builder-workspace-chrome.test.ts` to `tests/reconciliation-builder-workspace-mounted.test.ts:305` (moved, not duplicated, so the 22 AC ↔ 22 UAT 1:1 mapping holds) and rewrote it so no link in the chain is hand-written:

- expected set read off `storage/sites/` via `readdirSync`
- listing obtained by the app's own `fetchSites` over the live origin
- a third site (`gamma`) created *after* the origin started must appear in the next call — this is what kills the "hardcoded list / boot-time snapshot / subset filtered to sites with revisions" regressions
- **that listing**, not a literal, is what `mountBuilder` mounts over before the option comparison
- the switch clause preserved: choosing `gamma` changes the site with mode unchanged, and the displayed address serves `gamma`'s real draft byte-for-byte

Steps 1–3 need no components, so AC-967 now has **executed** evidence on this worktree; the mounted half sits behind the suite's existing `WEBUI_INSTALLED` guard and reports via `unverified(...)`.

**Verification:** all three suites pass — 14 passed / 8 skipped (was 13/9). I mutation-checked the new assertion (forced it to expect `['alpha']`): it failed with `+ "beta", + "gamma"`, confirming the store→origin assertion really runs. Reverted. No production code changed.

**Carried forward:** AC-973's drag warning (assessor calls it a non-gating operator decision, and its test can't execute here to verify any edit) and finding 3 (12 criteria unexecutable without the component install — an environment fix, now one smaller).

`AC-967` and `STORY-99` set to `uat_coverage: pass`; committed as `15a5b61d`; report `REPORT-1631` (`report-c95d6073`) with `violations_remaining: 0, needs_more_work: false`.
