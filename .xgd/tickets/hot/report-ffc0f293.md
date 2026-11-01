---
uid: report-ffc0f293
id: REPORT-7675
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:04:30.805254+00:00'
updated_at: '2026-11-01T15:04:30.805254+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

Incoming commit 6d24383f73 ("Merge branch 'free-REQ-179' into xgd-working", 2026-09-03, 2nd parent 6d25bf25ba) is a stale re-pick of REQ-179 work already integrated on this branch as 4db6c3cfe5 (identical 20-file diffstat) and further evolved by later commits (914b72adac REQ-179 reopen, plus REQ-180/181/184 work, all 2026-11-01). Per the enrichment rule ("take the more recent commit by timestamp"), HEAD is more recent on every file; HEAD is also a strict superset of incoming.

- apps/control-app/src/builder/app.js — UU code; HEAD (more recent, superset) via checkout --ours. Flag for post-merge review.
- apps/control-app/src/builder/builder.css — UU code; HEAD (more recent, superset). Flag for post-merge review.
- apps/control-app/src/builder/business.js — AA; HEAD is superset (2b). Flag for post-merge review.
- apps/control-app/src/builder/config.js — UU code; HEAD superset (adds BUSINESS_NONE_SELECTABLE_MESSAGE, BUSINESS_LAPSE_SENTENCES from REQ-179 reopen/REQ-180). Flag for post-merge review.
- apps/control-app/src/router.ts — UU code; HEAD (more recent, REQ-178/later). Flag for post-merge review.
- package.json — UU config; HEAD (version 0.2.69 vs stale 0.2.61; dev:control = ./bin/1c builder). Taking incoming would regress the version.
- tests/test_UAT_FC_REQ-179_business_scope_chrome.test.ts — AA UAT; HEAD contains all 11 incoming test functions plus 3 later ones (switcher_renders_when_no_business_is_selectable, tabs_are_blocked_and_the_account_chrome_still_works, no_business_in_scope_asks_the_origin_for_nothing). No test deleted.
- tests/test_UAT_FC_REQ-179_businesses_endpoint.workers.test.ts — AA UAT; HEAD (later, REQ-184 revision), same 5 test functions.

## Incoming changes preserved

Redundant commit (BUG-1109/BUG-1122 shape), not a discard: the incoming commit's key additions — BUSINESSES_PATH, /api/businesses route, businessesPayload, resolveBusiness, createBusinessSwitcher, accountAvatar, openAccountSurface — are all present in HEAD (api.js, app.js, business.js, index.ts, router.ts). Non-conflicting files in the pick (api.js, main.js, panel.js, toolbar.js, other tests) auto-merged to HEAD content. Staged tree has no diff vs HEAD; finalize step should skip the empty commit. No BUG-1301 drops.

## Arbitration of last resort (BUG-1460)

Not used directly. Resolution follows the enrichment's timestamp rule (HEAD side is later on every file) and 2b superset rule; HEAD-over-incoming chosen because incoming is a stale duplicate already integrated via 4db6c3cfe5 and superseded by later REQ-179 reopen work.
