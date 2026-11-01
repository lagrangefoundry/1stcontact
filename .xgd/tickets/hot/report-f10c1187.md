---
uid: report-f10c1187
id: REPORT-7567
type: report
title: 'Report: blocked_by_handoff for story-e674c60a'
created_by: xgd
created_at: '2026-11-01T11:03:23.007423+00:00'
updated_at: '2026-11-01T11:16:07.000071+00:00'
completed_at: null
last_field_updated: ruling
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-e674c60a
  rule: code_frozen
  evidence: 'Ran `npx vitest run tests/reconciliation-builder-business-scope.test.ts
    -t test_UAT_AC967_displayed_site_is_one` → `expected null to be ''shared''` at
    line 700 (after a failing listing, `app.panel.getSite()` is null). In apps/control-app/src/builder/app.js:698-715
    (`selectBusiness`), the comment says ''A failure to list is not a failure to run:
    the pane keeps what it had'', but the code does `const list = await loadSitesFor(currentBusiness).catch(()
    => [])`. An empty list makes `slug = list[0]?.slug ?? null`, then `panel.setSite(null)`
    clears the pane. AC-967 (''A site listing that fails leaves the pane showing what
    it had rather than an empty pane'') and story-e674c60a''s 2026-11-01 Reconciliation
    Decision (c) both state the keep-behaviour as what the code does; the code does
    not do it. Rewriting the AC to ''a failing listing empties the pane'' would contradict
    the code''s own comment and the story''s decision, so the fix belongs in the code.'
  proposed_change: 'apps/control-app/src/builder/app.js, selectBusiness(): change
    `.catch(() => [])` to `.catch(() => null)` and derive the slug as `const slug
    = list === null || list.some((entry) => entry.slug === currentSite) ? currentSite
    : (list[0]?.slug ?? null)`, so a failed listing keeps currentSite (the existing
    same-slug branch then calls showSite + panel.refresh). No test or ticket changes
    are needed for AC-967. Once this batch resumes within the rules, the remaining
    fixes are test- and AC-only: (1) tests/bug32-webui-scope-rebrand.test.ts check
    (b): count only bare-scope and component (`<scope>/webui-*` or a WEBUI_PACKAGES
    entry) occurrences, so the `@lagrangefoundry/ai-ticketing` comment in tools/generate/src/cli/ai/ledger-core.ts:17
    is excused, and narrow AC-960 (acceptance_criterion-13d252a9) to match; (2) tests/reconciliation-builder-workspace-origin.test.ts
    (AC964) and tests/reconciliation-workspace-build-artifacts.test.ts (AC1400): replace
    the throwing DB proxy with a real local D1 (e.g. wrangler getPlatformProxy over
    apps/control-app/wrangler.toml after applyLocalD1Schema + seedIdentity for the
    token''s email), keep R2 unreachable, and re-point AC1400''s TENANT_ID='''' probe
    at ''the store holds no row for the configured account'', since admit() requires
    a configured tenant (requirePlatformTenant throws → 503).'
  batch_index: 0
  parent_report_uid: report-103eb41e
  anchor_ticket: bundle-94dbe947
  ruling: granted
  ruling_reason: the planner granted an override in its plan
---

# Builder blocked by `code_frozen`

**Evidence**: Ran `npx vitest run tests/reconciliation-builder-business-scope.test.ts -t test_UAT_AC967_displayed_site_is_one` → `expected null to be 'shared'` at line 700 (after a failing listing, `app.panel.getSite()` is null). In apps/control-app/src/builder/app.js:698-715 (`selectBusiness`), the comment says 'A failure to list is not a failure to run: the pane keeps what it had', but the code does `const list = await loadSitesFor(currentBusiness).catch(() => [])`. An empty list makes `slug = list[0]?.slug ?? null`, then `panel.setSite(null)` clears the pane. AC-967 ('A site listing that fails leaves the pane showing what it had rather than an empty pane') and story-e674c60a's 2026-11-01 Reconciliation Decision (c) both state the keep-behaviour as what the code does; the code does not do it. Rewriting the AC to 'a failing listing empties the pane' would contradict the code's own comment and the story's decision, so the fix belongs in the code.

**Proposed change**: apps/control-app/src/builder/app.js, selectBusiness(): change `.catch(() => [])` to `.catch(() => null)` and derive the slug as `const slug = list === null || list.some((entry) => entry.slug === currentSite) ? currentSite : (list[0]?.slug ?? null)`, so a failed listing keeps currentSite (the existing same-slug branch then calls showSite + panel.refresh). No test or ticket changes are needed for AC-967. Once this batch resumes within the rules, the remaining fixes are test- and AC-only: (1) tests/bug32-webui-scope-rebrand.test.ts check (b): count only bare-scope and component (`<scope>/webui-*` or a WEBUI_PACKAGES entry) occurrences, so the `@lagrangefoundry/ai-ticketing` comment in tools/generate/src/cli/ai/ledger-core.ts:17 is excused, and narrow AC-960 (acceptance_criterion-13d252a9) to match; (2) tests/reconciliation-builder-workspace-origin.test.ts (AC964) and tests/reconciliation-workspace-build-artifacts.test.ts (AC1400): replace the throwing DB proxy with a real local D1 (e.g. wrangler getPlatformProxy over apps/control-app/wrangler.toml after applyLocalD1Schema + seedIdentity for the token's email), keep R2 unreachable, and re-point AC1400's TENANT_ID='' probe at 'the store holds no row for the configured account', since admit() requires a configured tenant (requirePlatformTenant throws → 503).

## Ruling: granted

the planner granted an override in its plan
