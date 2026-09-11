---
uid: report-648a720f
id: REPORT-3914
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-11T04:35:49.353763+00:00'
updated_at: '2026-09-11T04:35:49.353763+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-4cabde9a
---

## Blocked: the story's source is not on this branch

I wrote the 12 UATs and ran them. They fail at module resolution — not for any reason a test rewrite can fix — so I'm reporting rather than weakening them.

### What I verified before writing

`apps/control-app/src/describe.ts`, which this story is entirely about, **does not exist on `reconcile-BUNDLE-26`**. Four independent confirmations:

- `git ls-tree HEAD apps/control-app/src/` lists 12 files. `describe.ts`, `material.ts` and `knowledge.ts` are absent; `git log --all -- .../material.ts` shows them only on `xgd-working` and `reconcile-src-BUNDLE-26`.
- `git diff --stat main...HEAD` contains **no** `apps/control-app/src/` entries at all — the control-app source here is byte-identical to `main`.
- Of the bundle's 8 commits, only `free-REQ-165` (`97244b5e67`) and `free-BUG-39` (`0c40e445a7`) are reachable from HEAD. REQ-163's merge `548c053deb` is not. `bundle-87be4669` records `reconcile_sha: null` for every commit.
- A second layer underneath: `apps/control-app/package.json` on this branch declares only `@cloudflare/puppeteer`. At `548c053deb` it declares `@anthropic-ai/sdk` and `unpdf`, and neither is present in `node_modules`. Restoring the file alone would still not import.

This is the same wall plan item 7 hit — `tests/reconciliation-material-ingestion.workers.test.ts` fails identically with `Cannot find module '../apps/control-app/src/knowledge'` (I ran it to confirm).

### What I wrote

Tests grounded in the real implementation as it landed at `548c053deb` (read via `git show`) — the version the ACs were written against. Boundaries follow the story's own words: `describe()` for the nine criteria about what a description *says*, and `ingestUpload()` + a second `ticketStoreFor` handle for the three about what ends up *stored* (AC-1693, AC-1697, AC-1698). The one double is `DescribeImage`, the seam the production code exposes for exactly this.

Since I could not execute the tests, I validated the hand-built fixtures separately, against `describe.ts`'s own parser and clipper code copied verbatim:

- **SFNT / WOFF / titles / body bounds** — 22/22 checks pass. The synthesized variable face yields family `Ridgeway Display`, style `Semibold`, designer, blurb and `variable: true` through the real `sfntNames`; both compressed wrappers are refused; `clipBody` and `clipTitle` produce the exact strings the tests assert.
- **PDF fixtures** — structurally audited (every xref entry lands on its `N 0 obj`, `/Length` matches stream bytes, `startxref` resolves, `%%EOF` present): 3/3 sound. These are the one thing I could **not** exercise end-to-end, because `unpdf` is not installed here.

```
UATs generated for story story-4cabde9a (plan item 8 of 17)

Story: story-4cabde9a
Test file(s) created:
  - tests/reconciliation-material-description.workers.test.ts

Tests written: 12   (AC-1688 … AC-1699, one per AC)
Tests passed: 0
Tests failed: 12 (suite did not import)
```

```
⚠️ TESTS FAILING — NOT a test defect; the source is absent from this branch

Failures:
  - all 12: Cannot find module '../apps/control-app/src/describe'
    (and '../apps/control-app/src/material'); unpdf + @anthropic-ai/sdk
    are neither declared nor installed on this branch

test_files_created:
  - "tests/reconciliation-material-description.workers.test.ts"
```

The fix is to land REQ-163's commits (and its dependency declarations) on the reconcile branch — no change to these tests is warranted.
