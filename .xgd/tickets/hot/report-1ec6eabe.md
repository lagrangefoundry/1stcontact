---
uid: report-1ec6eabe
id: REPORT-7401
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:39:40.969236+00:00'
updated_at: '2026-11-01T06:39:40.969236+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `apps/control-app/src/ai.ts` — UU, code file. Enrichment rule (intent unknown on incoming side → take the more recent commit by timestamp). HEAD side (5259280989 / ba5191e1ff / e27a0b82c3, 2026-10-31) is newer than incoming 28b4105592 (2026-09-02). Kept HEAD's BUG-63 form: the digest instruction as the single `priming` entry, rather than incoming's older `system:` + empty `source`. **Flagged for post-merge review.**
- `apps/control-app/src/router.ts` — UU, code file. Same rule. Kept HEAD's imports (`fidelityDeps`, `adoptCapture`, `BrowserLauncher`, `HostDeps`, `r2ReferenceStore` — still used by HEAD code), the BUG-46 `/api/ai/reattach` route, and `chatHost(env, deps, url.origin)` / `streamTurn(..., ctx)`. Incoming's older `chatHost(env, deps)` / `streamTurn(host, sessionId, text, scrub)` is pre-BUG-46 (3dde8c7f6f, merged after REQ-173). **Flagged for post-merge review.**
- `tests/test_UAT_FC_REQ-173_describer_session.test.ts` — AA, UAT test. HEAD is a superset: same test functions, plus the `systemText()` helper and the stricter BUG-63 exact-equality assertion. No test function dropped. **Flagged for post-merge review.**
- `tests/test_UAT_FC_REQ-173_no_key_banner.test.ts`, `tests/test_UAT_FC_REQ-173_text_comment.workers.test.ts` — new files from incoming, added cleanly and kept.

## Incoming changes preserved

The incoming commit is the original `free-REQ-173` merge. Its feature (session-based `sessionTextDescriber`, describer UAT) already exists on HEAD in a later, evolved form. All non-conflicting incoming hunks auto-merged, and the three resolved files are byte-identical to HEAD. In other words, HEAD already contains the incoming change's effect, so this is a redundant commit, not a discarded one (BUG-1109/BUG-1122 shape). The only incoming content not taken is the pre-BUG-63 / pre-BUG-46 wording and signatures in the conflict hunks, which later commits on HEAD superseded. Both new incoming test files are staged.

## Arbitration of last resort (BUG-1460)

Did not fire. The conflict hunks were resolved by the enrichment's timestamp rule (HEAD newer), backed by the evidence that later tickets (BUG-63 describer priming, BUG-46 reattach) superseded the incoming hunks.
