---
uid: report-555646dd
id: REPORT-7566
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T11:03:18.631248+00:00'
updated_at: '2026-11-01T11:03:18.631248+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-e674c60a
  parent_report_uid: report-103eb41e
  batch_index: '0'
---

I stopped this batch without fixing anything. One failure (AC967) needs a production-code change, which this mode forbids, so I'm handing it back. The rules for that require leaving the work tree untouched, so I reverted my one edit. The tree now has only the two `.xgd/_changes` files that were already modified when I started.

I ran the five named tests: four fail and AC975 passes on this machine. Here is what each needs:

- **AC967 — blocked, the code is wrong.** In `apps/control-app/src/builder/app.js:700`, a failed site listing is caught and turned into an empty list. The pane then switches to no site (`getSite()` returns `null`), instead of keeping what it showed. The comment on the line above, AC-967 and the story's decision (c) all say the pane should keep what it had. Changing the AC to match would write a bug into the spec.
- **AC960 — test fix (not applied).** The only hit is a comment in `tools/generate/src/cli/ai/ledger-core.ts:17` that names `@lagrangefoundry/ai-ticketing`. That is a different package under the same organisation scope, not a component reference. I wrote a version of the check that counts only the scope written on its own or as a component reference. It passed, then I reverted it. AC-960's wording would need narrowing to match.
- **AC964 and AC1400 — test fixes (not applied).** Both return 503 because the code now checks identity before any route runs: it looks up `users` and `memberships` in D1. Both tests deliberately pass a D1 that throws when touched. They need a real local D1 in the Node test pool with a seeded identity, while R2 stays unreachable. AC1400's no-account probe (`TENANT_ID: ''`) can never get through the gate now (identity setup throws, which becomes a 503). It needs re-pointing at "the store has no row for that account" rather than "no account configured".
- **AC975 and the two orphaned criteria.** AC975 passed here, so its failure in the quality run is probably about launching a browser on that machine. AC-1400 should stop being orphaned once its test passes. I didn't investigate why AC-975 is listed as orphaned.

```yaml
## Assessment
blocked_by:
  rule: code_frozen
  evidence: "Ran `npx vitest run tests/reconciliation-builder-business-scope.test.ts -t test_UAT_AC967_displayed_site_is_one` → `expected null to be 'shared'` at line 700 (after a failing listing, `app.panel.getSite()` is null). In apps/control-app/src/builder/app.js:698-715 (`selectBusiness`), the comment says 'A failure to list is not a failure to run: the pane keeps what it had', but the code does `const list = await loadSitesFor(currentBusiness).catch(() => [])`. An empty list makes `slug = list[0]?.slug ?? null`, then `panel.setSite(null)` clears the pane. AC-967 ('A site listing that fails leaves the pane showing what it had rather than an empty pane') and story-e674c60a's 2026-11-01 Reconciliation Decision (c) both state the keep-behaviour as what the code does; the code does not do it. Rewriting the AC to 'a failing listing empties the pane' would contradict the code's own comment and the story's decision, so the fix belongs in the code."
  proposed_change: "apps/control-app/src/builder/app.js, selectBusiness(): change `.catch(() => [])` to `.catch(() => null)` and derive the slug as `const slug = list === null || list.some((entry) => entry.slug === currentSite) ? currentSite : (list[0]?.slug ?? null)`, so a failed listing keeps currentSite (the existing same-slug branch then calls showSite + panel.refresh). No test or ticket changes are needed for AC-967. Once this batch resumes within the rules, the remaining fixes are test- and AC-only: (1) tests/bug32-webui-scope-rebrand.test.ts check (b): count only bare-scope and component (`<scope>/webui-*` or a WEBUI_PACKAGES entry) occurrences, so the `@lagrangefoundry/ai-ticketing` comment in tools/generate/src/cli/ai/ledger-core.ts:17 is excused, and narrow AC-960 (acceptance_criterion-13d252a9) to match; (2) tests/reconciliation-builder-workspace-origin.test.ts (AC964) and tests/reconciliation-workspace-build-artifacts.test.ts (AC1400): replace the throwing DB proxy with a real local D1 (e.g. wrangler getPlatformProxy over apps/control-app/wrangler.toml after applyLocalD1Schema + seedIdentity for the token's email), keep R2 unreachable, and re-point AC1400's TENANT_ID='' probe at 'the store holds no row for the configured account', since admit() requires a configured tenant (requirePlatformTenant throws → 503)."
```
