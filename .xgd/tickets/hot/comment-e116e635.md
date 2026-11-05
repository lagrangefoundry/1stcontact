---
uid: comment-e116e635
id: COMMENT-7874
type: comment
title: Claude response for batch_fix_assessment report
created_by: xgd
created_at: '2026-11-05T22:21:10.328090+00:00'
updated_at: '2026-11-05T22:21:10.328090+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3c50bfef
  kind: note
---

I fixed the AC1400 failure by correcting the test. The composer fix didn't need redoing, and I changed no production code in this batch.

**The composer fix was already in place.** `scopeClientJs` (each behavior's `client.js` in its own block, leading `export` dropped) is already in `tools/generate/src/cli/module-assets.ts` from the earlier batch. The committed `MODULE_CLIENT_JS` matches a fresh rebuild, and it parses. I checked parsing with Node's `Function` constructor; the `node --check` route the planner suggested was blocked by permissions here. I didn't touch either file the exception covers.

**Why AC1400 failed:** it got past the bundle check and then failed at `/preview/alpha/published/`, expecting a 302 and getting a 404.
- Since REQ-190, that route looks the slug up in D1. If the business doesn't hold the site, it returns 404 on purpose. If it does, it redirects to `/site/<site key>/`, where the key is a random id, not the slug.
- The test never created `alpha`. It only passed before if a site with that slug happened to be left in the shared local D1 from an earlier run. It also expected `/site/alpha/`, which can't be right now that the address uses the key.

**What I changed in `tests/reconciliation-workspace-build-artifacts.test.ts`:**
- Setup now creates `alpha` under the suite's own business and reads back its key.
- The test checks for a 302 to `/site/<that key>/`.
- I added a check that a slug the business doesn't hold gets the route's own 404, not an `asset:` response from the build-artifact binding. That strengthens the point of this step: a route always answers before any build artifact can.

No assertions were weakened and no skip markers added. AC-1400's text doesn't spell out the redirect URL, so I didn't update any AC or story.

**Results:** all 27 tests in the batch scope pass (AC1624, AC1622, AC1623, AC1400, REQ-145 and REQ-93). One other suite in that run, `tests/test_reconciliation_business_scope_operator.workers.test.ts`, fails to load because `../db/migrations/0005_operator_membership.sql` doesn't exist. It's outside this batch and my change doesn't touch it. Nothing is committed; the change is left in the worktree for the workflow.

```yaml
## Assessment
status: fixed
fixed:
  - test: test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate
    cause: "Test relied on an unseeded 'alpha' site left in persistent local D1 and expected a slug-based public URL; since REQ-190 the published redirect resolves the slug to the site's minted key in D1 (404 when unheld)."
    change: "Seed 'alpha' in the suite's own business, assert 302 to /site/<key>/, and add an unheld-slug 404 (not 'asset:') check."
production_code_changed: false
exception_files_touched: []  # composer fix (BUG-75) was already in place and verified in sync and parseable
upstream_ticket_changes: none
notes: "tests/test_reconciliation_business_scope_operator.workers.test.ts fails to load (missing ../db/migrations/0005_operator_membership.sql); outside this batch, not addressed."
```