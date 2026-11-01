---
uid: report-96b01ae1
id: REPORT-580
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-6'
created_by: xgd
created_at: '2026-07-19T01:35:08.308070+00:00'
updated_at: '2026-07-19T01:35:08.308070+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-6
---

## Files resolved

- `package.json` — UU (config, version scalar). Incoming = free_coded footer fix (bumped 0.0.122→0.0.123, the free-coding gate's version-bump artifact); ours = sync_working_to_main post-watermark at 0.0.155. Kept HEAD's 0.0.155 — the reconcile branch is later in the timeline and 0.0.123 carries no developer code, only the gate bump. Flagged per intent-unknown rule; nothing meaningful discarded.

## Incoming changes preserved

- The incoming commit's ONLY package.json change was the version scalar (0.0.122→0.0.123), which is a bookkeeping artifact, not developer code — no code to preserve there.
- The commit's actual developer changes (footer `textColor` dial escape hatch) live in `packages/framework/src/modules/footer/index.astro`, `storage/sites/gigabytealchemy/draft/pages/home.json`, and `tests/req58-framework-gaps.test.ts`. All three applied cleanly (no conflict) and are staged as M, so the incoming footer fix is fully present in the resolved tree.
- No conflict markers remain anywhere in the worktree; CHERRY_PICK_HEAD (80c4adb6) is intact for the finalize step.
