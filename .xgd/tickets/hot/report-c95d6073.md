---
uid: report-c95d6073
id: REPORT-1631
type: report
title: 'Fix UAT Coverage: Builder Workspace: Chrome, Origin & Display Panel — attempt
  1'
created_by: xgd
created_at: '2026-08-07T21:26:21.962233+00:00'
updated_at: '2026-08-07T21:26:21.962233+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_uat_coverage
  subject_uid: capability-a994b8f3
  fixes_applied: 1
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-17a279f7
---

# Fix UAT Coverage: Builder Workspace: Chrome, Origin & Display Panel

**Attempt**: 1
**Fixes applied**: 1
**Violations remaining**: 0
**Needs more work**: false

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-967 | `test_UAT_AC967_the_site_selector_lists_exactly_the_store_and_switches_the_site` **moved** from `tests/reconciliation-builder-workspace-chrome.test.ts` to `tests/reconciliation-builder-workspace-mounted.test.ts` and rewritten so the store→origin→selector chain is load-bearing. `uat_coverage: pass` on AC-967 and on STORY-99. |

Committed as `15a5b61d` — `test(builder-workspace): AC-967 evidence over the real store and origin`.

### What the rewrite does

The finding was that the old test handed `mountBuilder` a hardcoded literal
(`SITES`) and asserted the selector's options equalled that same literal — it
stood in for the very thing the criterion's first clause is about — while
nothing anywhere asserted what `/api/sites` returns.

The replacement follows the assessor's suggested edit exactly, in the file the
assessor named (`…-mounted.test.ts`, which already runs a live `startBuilder`
over a real two-site store), and no link in the chain is written by hand:

1. The expected set is **read off the store** — `readdirSync(storage/sites/)`,
   not a literal.
2. The listing is obtained by **the app's own `fetchSites`** (now imported from
   `apps/control-app/src/builder/api.js` alongside `previewUrl`/`publishSite`),
   aimed at the real origin over real HTTP via the existing `originFetch`.
3. A **third site is created after the origin started** (`cmdNew('gamma')` +
   `cmdRender`) and must appear in the next `fetchSites` call. A hardcoded
   list, a boot-time snapshot, or a filter that drops sites without revisions
   (the exact regression the finding named — only `alpha`/`beta` ever gain
   revisions in this suite) each fail here.
4. **That listing, never a literal**, is what `mountBuilder` is mounted over
   before the selector's options are compared to the store's directories.
5. The switch clause is preserved and strengthened: choosing `gamma` changes the
   displayed site with the mode unchanged, the pane's `src` is `previewUrl`'s
   address, and fetching that address over the origin returns `gamma`'s real
   rendered draft byte-for-byte.

Steps 1–3 need no components and are **unconditional**, so AC-967 now produces
executed evidence on a machine with no component store — the property the
assessor said was worth more than a stronger jsdom assertion. Step 4–5 sit
behind the suite's existing `WEBUI_INSTALLED` guard and report themselves via
`unverified(...)` rather than passing quietly, matching the discipline of the
two criteria already in that file.

The test was **moved, not duplicated**: the 22 AC ↔ 22 UAT 1:1 mapping the
assessor verified is preserved (a second `test_UAT_AC967_*` would have broken
it). The chrome suite keeps a one-line comment at the removal site naming where
the criterion went and why.

### Verification

| Check | Result |
|---|---|
| `vitest run` on all three suites | **3 files passed, 14 passed / 8 skipped (22)** — was 13 passed / 9 skipped. AC-967 moved from fully-skipped to executing its unconditional half. |
| Mutation check on the new assertion | Temporarily changed the `fetchSites` expectation to `['alpha']`; the test **failed** with `+ "beta", + "gamma"`, proving the store→origin assertion genuinely executes here (and that `gamma` really was created and served). Reverted. |
| No regressions | No test outside the two edited files was touched; nothing new fails. |

## Code Edits (if any)

None this call. The finding was evidence-only — `toolbar.js:124`, `main.js:22`
and `tools/generate/src/cli/builder.ts:193` (`/api/sites` → `cmdList`) were all
confirmed correct and left untouched.

## needs_review Items Forwarded

None were categorized `needs_review`. Two warnings are carried forward
unresolved, both deliberately:

| Element | Finding | Why not resolved here |
|---|---|---|
| AC-973 (finding 2, warning, `uat-edit`) | The drag gesture is not exercised; the test drives `split.setSplit(37)`, the ratio model, because jsdom's `getBoundingClientRect()` is zero. | The assessor states both repairs have costs and calls it **an operator decision that does not gate**. Both options — mirroring the drag into AC-975's real-chromium path, or amending the criterion's verification to name the ratio model — would also be authored blind here: AC-973's test sits in a `skipIf(!WEBUI_INSTALLED)` block that cannot execute in this worktree, so any edit would be unverifiable. Forwarding rather than guessing. |
| STORY-99 (finding 3, warning, environment) | 12 of 22 criteria have no executed assertion on this branch because `@gendevlabs/webui-*` resolves from neither scope. | Not a test defect and not fixable by a test edit — resolution is `bin/install --lang js --component all` in `lagrange-framework`, or the private registry. AC-967's repair was chosen specifically to shrink this set by one. |

**Note for the next editor**: BUG-32 (`WEBUI_SCOPE` rebrand) is unreconciled and
absent from this branch; it touches all three suites. The AC-967 test added here
introduces no new literal scope reference, so it will not add to that conflict.
