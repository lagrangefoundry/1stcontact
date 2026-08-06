---
uid: comment-2aa04a3e
id: COMMENT-721
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-06T20:33:39.321511+00:00'
updated_at: '2026-08-06T20:33:39.321511+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-de772a45
  kind: note
---

Verified the new UAT is load-bearing via two mutation checks (both reverted; `git status` shows only the new untracked test file):

| Mutation | Result |
|---|---|
| Deploy keys built under `sites/` regardless of origin (the pre-BUG-31 regression) | ✗ fails — sandbox key absent |
| `R2SiteStore` falls back to the `sandbox/` manifest/prefix | ✗ fails — `publishedRoot: expected 200 to be 404` |

```
UATs generated for story story-d34eccd8 (plan item 2 of 6)

Story: story-d34eccd8
Test file(s) created:
  - tests/reconciliation-servable-root-confinement.test.ts

Tests written: 1
Tests passed: 1
Tests failed: 0

test_files_created:
  - "tests/reconciliation-servable-root-confinement.test.ts"
```

**Scope note.** 13 of the story's 14 ACs (AC-902 … AC-914) already have UATs in `tests/reconciliation-serve-deployed-snapshot.test.ts`, written by the previous story-cycle iteration (commit `063bf869e`). AC-927 — "the server addresses exactly one store tree, fixed in the server and never derived from a request", created this iteration from BUG-31 — was the only AC without one, so that is the single UAT written. Test-to-AC mapping across the story is now 1:1 with no duplicates and no gaps.

The new UAT drives the Worker's real `fetch` entry point with R2 faked only at the binding: it deploys a site into `sandbox/` through the real `1c new` / `1c publish` / `1c deploy`, proves out-of-band that the entry page, published revision and deploy index are all genuinely present and readable at their keys, then asserts 404 across every route form the grammar admits (published root and bare root, preview root and bare root, named files under each, plus paths spelling the tree and stored key verbatim) — byte-identical to a never-deployed site, with zero reads naming `sandbox/`. It then deploys the same slug into `sites/` and asserts it serves, so the 404s are attributable to the tree and not the fixture.

⚠️ **Pre-existing failures in the story's existing UAT file — not introduced here, and not fixable under this prompt's "no existing test modifications" constraint.**

```
tests/reconciliation-serve-deployed-snapshot.test.ts
  × test_UAT_AC903_published_url_serves_and_follows_the_live_revision
  × test_UAT_AC905_only_indexed_snapshots_are_servable
  × test_UAT_AC913_apex_returns_a_holding_response_and_never_serves_a_site
```

All three are the same test-side breakage, not a code divergence: BUG-31 (`f9cc60ccd`, in this bundle) changed the deploy-side `manifestKey` from `(slug)` to `(root, slug)`, and the file's `deployIndex` (line 252) and `putDeployIndex` (line 258) helpers still call it with one argument, so they address `acme/undefined/manifest.json`. `tsc` flags the same three call sites as `TS2554: Expected 2 arguments, but got 1` (lines 252, 258, 452). The fix is `manifestKey('sites', SLUG)` at those call sites. The serving code is consistent — `apps/public-site/src/site-store.ts` builds `sites/<slug>/manifest.json` and the deploy writes exactly that for `root='sites'`.

For context, the branch baseline is 9 failures across 5 files, so this file accounts for 3 of them; the other 6 are outside this story.

The updated AC-905 body now also calls for "a site whose bytes and index both exist only in the non-servable tree is not-found on its preview and published addresses". That clause is not in the existing AC-905 test; it is covered behaviourally by the new AC-927 UAT, but AC-905's own test will need it added when the fix-it loop repairs that file.
