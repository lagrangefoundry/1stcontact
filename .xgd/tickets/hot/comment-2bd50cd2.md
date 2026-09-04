---
uid: comment-2bd50cd2
id: COMMENT-2270
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-04T05:47:28.092660+00:00'
updated_at: '2026-09-04T05:47:28.092660+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d0cf7c88
  kind: note
---

I've completed the investigation and verification. Here is what I found.

## Coverage state

Story `story-e674c60a` has **36 acceptance criteria**, and **every one already has a `test_UAT_AC{N}_*` function** across 12 test files. I wrote no new test files: creating any would have produced a second test function for an AC that already has one, breaking the 1:1 AC↔test mapping the naming validator and matrix link depend on.

**Plan item 13's actual subject is already covered and green.** The two criteria REQ-161 supersedes were restated against the tab *declaration* rather than a literal count, and `tests/reconciliation-builder-workspace-chrome.test.ts` already asserts the restated form (delivered by the free-coded commit `05da4252c8` itself):

- `test_UAT_AC959_...` — asserts `querySelectorAll('.shell-panel').length === TABS.length` (count read off the declaration), `SITE_TAB.id === 'site'`, `TABS[0] === SITE_TAB`, active tab is that first tab, display panel is a descendant of its panel.
- `test_UAT_AC976_...` — iterates `Object.keys(tab)` rather than a fixed list, asserts active-tab only for `TABS[0]`, asserts `.shell-panel.is-fill` count equals the number of tabs declaring `fill`, plus the mutation check.

That file passes: **9/9**.

## Test run

One environment precondition had to be satisfied first: `./bin/1c assets` (a fresh checkout has no `apps/control-app/dist-assets`). That took the failure count from 8 to 4.

```
node project    (10 files, 40 tests):  36 passed, 4 failed
workers project ( 2 files,  4 tests):   4 passed, 0 failed
```

## The 4 failures — none from item 13

**AC-1400 — `reconciliation-workspace-build-artifacts.test.ts`. Genuine divergence.** Confirmed by direct probe, not inference:

| request | observed |
|---|---|
| `/builder/main.js`, admitted | `503` — `D1 was touched while answering a build-artifact request.` |
| `/webui/marker.js`, admitted, `TENANT_ID: ''` | `503` — `TENANT_ID is not configured…` |

REQ-167's `admit()` runs in `index.ts:123`, before `route()`, and reads `env.DB` on every admitted request. AC-1400 states *"The fall-through stays last, and does not depend on an account… An artifact request must succeed against a store that holds no account at all."* It no longer does. The first row is arguably fixture over-reach (the gate's own reads are out of this story's scope); the second is not — a build artifact is now unreachable on a deployment that names no tenant. I did not weaken the assertion.

**AC-960 — `bug32-webui-scope-rebrand.test.ts`. Genuine divergence.** BUNDLE-23's KB work restated the `@lagrangefoundry` literal in four tracked files outside the single declaration and the declared browser-source exception:

```
apps/control-app/src/knowledge.ts:218          (error message naming …/ai-knowledge/describe)
tests/test_UAT_FC_REQ-158_system_kb.workers.test.ts:39
tests/test_UAT_FC_REQ-159_project_kb.workers.test.ts:26
tests/reconciliation-project-knowledge-freshness.workers.test.ts:625
```

The guard is asserting exactly what AC-960 specifies. Whether the fix is to compose those references from the declaration, or to narrow the AC to *component* references (these name sibling packages under the same npm org), is a story-prompt decision — I left the assertion intact.

**AC-964, AC-965 — `reconciliation-builder-workspace-origin.test.ts`. Environment, not code.** Both call `unstable_dev` against `apps/control-app/wrangler.toml`, which carries `[browser]` (landed 2026-08-28, before this bundle) and `[ai]` bindings with no local implementation. Wrangler logs `⎔ Establishing remote connection...` and then hangs; this sandbox has no network egress, so both time out (60s / 180s). Not verifiable here either way.

```
UATs verified for story story-e674c60a (plan item 13 of 15)

Story: story-e674c60a
Test file(s) created: none — all 36 ACs already carry a 1:1 UAT
Item 13's subject (AC-959, AC-976 restated): covered and passing (9/9)

Tests run:    44
Tests passed: 40
Tests failed:  4

⚠️ TESTS FAILING — downstream fix-it loop required

  - test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate
      code diverges: REQ-167 admit() reads D1 before route(); artifact
      fall-through now 503s with no tenant configured
  - test_UAT_AC960_component_scope_is_written_in_exactly_one_place
      code diverges: 4 tracked files restate the scope literal outside its
      single declaration
  - test_UAT_AC964_one_host_answers_every_route_with_the_origin_response_verbatim
      environment: unstable_dev needs a remote Cloudflare connection; no
      network egress in this sandbox
  - test_UAT_AC965_a_worker_that_cannot_serve_names_the_missing_configuration
      environment: same cause

test_files_created: []
```
