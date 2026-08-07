---
uid: comment-cadf2d6f
id: COMMENT-810
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-07T21:21:42.392271+00:00'
updated_at: '2026-08-07T21:21:42.392271+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-35663d15
  kind: note
---

**Result: FAIL** — REPORT-1630 (`report-35663d15`), 1 violation, 2 warnings, 0 needs_review.

**Verdicts written**: 21 ACs `pass`, AC-967 `fail`, STORY-99 `fail`, CAP-85 `fail`.

**Intent ledger** — BUNDLE-16 (REQ-115 + REQ-117 + REQ-44, reconciled) is the only intent that has touched this tree. REQ-118 contributes `/api/assets` peripherally; REQ-119 (would delete the proxy) is still `draft`; BUG-32 (scope rebrand) is `free_coded` and absent from this branch. Nothing retires any AC's behaviour → zero deprecations, zero needs_review. AC-1029 traces cleanly to REQ-115.

**The violation (AC-967, `uat-edit`)** — the criterion says the selector's options are the store's sites, "neither a hardcoded list nor a subset". `test_UAT_AC967_*` hands `mountBuilder` a hardcoded `SITES` literal and asserts the selector equals that same literal — it substitutes a stand-in for exactly the thing under test. No AC-traceable test anywhere asserts what `/api/sites` returns: it's fetched twice in the origin suite, once for a cache header and once for a byte comparison, never for contents. A `fetchSites` regression returning a subset fails no AC-named test. Only the free-coded `test_UAT_FC_REQ-115_site_selector_lists_the_store` covers it. Fix is one test edit in `…-mounted.test.ts`, which already runs a live origin over a real two-site store.

**Two warnings** — AC-973's drag gesture is driven through the model API rather than a real drag (carried forward, jsdom can't do better); and the environment gap.

**On that environment gap** — I ran the three suites: 13 passed, 9 skipped. Beyond the 9 skips, AC-963, AC-964 and AC-975 return before their first assertion (0 ms each), and six more run only their component-independent half. `@gendevlabs/webui-*` resolves from neither scope in this worktree. This is intent-sanctioned (REQ-115's "Known cost, accepted and made visible") and correctly signposted with named `console.warn`s, so it isn't a coverage violation — the tests are well authored and mock nothing. But it means twelve of twenty-two criteria have no executed assertion on this branch, and a regression run here cannot distinguish a working workspace chrome from an absent one. Provisioning the shared artifact store in the regression environment would convert twelve conditional criteria into executed ones at zero test cost.
