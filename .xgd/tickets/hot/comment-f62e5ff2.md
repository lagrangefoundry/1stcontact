---
uid: comment-f62e5ff2
id: COMMENT-2468
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T05:17:41.213118+00:00'
updated_at: '2026-09-10T05:17:41.213118+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-baa6d6ef
  kind: note
---

Report created: **REPORT-3669** (`report-baa6d6ef`) — **FAIL**, 1 violation, 0 warnings, 0 needs_review.

## What I checked

CAP-102 has one story (STORY-119, `upgrade`) with 18 active ACs. Every AC has exactly one UAT, each name appearing exactly once across `tests/`, all three files inside the `node` vitest project. Intent ledger: REQ-144/145/146/147/149, BUG-36/37, BUNDLE-19/20/21 — all `free_and_reconciled`, nothing retired.

17 of 18 UATs drive real entry points: the real `1c preflight` binary, the real `bin/build` and `bin/deploy` scripts (with pnpm/npx/wrangler shimmed as the external boundary), the real `smoke.mjs` process, the real secret hook, real `tsc`, and the real `wrangler.toml` files.

## The violation — AC-1426

AC-1426 says *the build* "names the import chain that got there" and "reports the shortest chain from the entry point to the offending module." It doesn't. `bin/build`'s typecheck stage is `pnpm -r build` → `tsc --noEmit` (`apps/control-app/package.json:7`); there is no walker in `bin/`, `tools/`, `apps/` or `packages/`. I rebuilt the criterion's own scenario and ran the repo's `tsc` against it:

```
loadSite.ts(1,16): error TS2591: Cannot find name 'node:fs'.
```

The offending module, never the chain. The UAT's chain assertions (`reconciliation-platform-build-order-and-private-surface.test.ts:537-544`) run against a `typeProgramOf`/`chainTo` BFS defined in the same test file at lines 395-437 — that half of the criterion is the test asserting on itself.

REQ-149 puts the walk where it actually is: "**A UAT now walks type-only imports too**, from the Worker entrypoints outward… naming the chain," with its ask stated as a repository property (criterion 12), not a `bin/build` feature. So this is an `ac-edit`, not a code gap — the behaviour is implemented and well tested, the attribution is wrong. STORY-119's body carries the same sentence twice (the "one refusal a bundle graph cannot see" paragraph and Reconciliation Decision 4), so the editor needs to fix both or the next check re-derives it. I flagged explicitly that the wrong repair is editing the UAT to assert a chain in `bin/build`'s output.

I also recorded, as info, that AC-1341/1455/1454 use test-side readers of the same shape as AC-1426's walker — but legitimately, because those criteria don't claim a production counterpart and all carry negative controls. That distinction is the whole of the finding.
