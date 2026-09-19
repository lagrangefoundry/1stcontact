---
uid: comment-92d7bfbf
id: COMMENT-3270
type: comment
title: Claude response for fix_implementation_drift report
created_by: xgd
created_at: '2026-09-19T15:15:16.238773+00:00'
updated_at: '2026-09-19T15:15:16.238773+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7d810b43
  kind: note
---

**@fail**

Report: `REPORT-4472` (`report-7d810b43`), `result: fail`.

## What I found

One failing UAT: `test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs` — Part B of `tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts`.

**Timeline (Step 2):** AC-720 → `story-e15a19ef` → intent `bundle-ab9e0cb6` @ `1784436798` (2026-07-19). Anchor `bundle-8e1807f6` @ `1788302156` (2026-09-01). `owner_ts < anchor_ts` → **case 2b**.

**Root cause — and it isn't AC supersession.** The UAT was authored *on this branch* (`087e145261`, `reconciliation_uat_generation_prompt`) against the pre-REQ-155 capture-bundle API, then invalidated when `sync_main` merged REQ-155's async `ReferenceBundle` port in. Two stale call shapes remain in the test:

- line 172: `writeL1(dir, refDoc())` — passes a `string` where `ReferenceBundle` is required, unawaited, so the ref bundle never gets an `l1.json`
- line 212: `cmdRepro(...)` unawaited → `repro` is a `Promise` → line 213's `repro.draftDir` is `undefined` → `expect(undefined).toContain('storage/sandbox')` throws

Every other `cmdRepro` call site in the repo (7 test files plus `cli/index.ts:877`) already awaits. Production code is consistent; this UAT is the sole stale caller.

**Verification.** Chromium can't launch in my sandbox, so Part B reports SKIPPED locally (`1 passed | 1 skipped`) — the upstream runner isn't sandboxed that way, which is why it executed and failed. I proved the defect browser-free with a `vite.ssrLoadModule` probe replicating the UAT setup verbatim: `typeof → [object Promise]`, `.draftDir → undefined`, and on await, `Error: No l1.json in bundle '<tmp>/ref'` — confirming both defects independently.

## Why no implementation edit

The three candidate fixes are: edit the UAT (prohibited), revert REQ-155's async port (main's deliberate architecture, load-bearing for the R2 bundle store, would break REQ-155's own ACs), or hang `draftDir` off the returned Promise (corrupting a production API for a test typo). None is allowed, so I made **no source edits** — the tree carries only `.xgd/_changes` bookkeeping.

The corrective action is a ~3-line UAT repair (two `await`s plus wrapping the ref dir with `fsReferenceBundle`), not an AC invalidation — AC-720's criterion still describes what the implementation delivers.
