---
uid: report-3c50bfef
id: REPORT-11075
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-05T22:11:34.563465+00:00'
updated_at: '2026-11-05T22:11:34.563465+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-179b8c06
  parent_report_uid: report-84738adf
  batch_index: '1'
---

I fixed the bundle composer, but I couldn't run the failing test itself: Chromium won't launch inside this sandbox, so `test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension` was skipped (its `HAVE_CHROMIUM` check). It still needs to be run where a browser can start.

**The fix.** Several behaviors' `client.js` files each declare a top-level `const ERROR_SELECTOR`. Joining them plainly into one module script was a duplicate-declaration SyntaxError, so the whole `capabilities.js` bundle failed to parse and no client behavior ran on any page. That parse failure is the page error behind the four desktop violations.

**Changes, both inside the authorised exception:**
- `tools/generate/src/cli/module-assets.ts`: a new `scopeClientJs` wraps each behavior's `client.js` in its own block and drops a statement-leading `export`, which a block can't contain. Nothing imports from the bundle; tests import `client.js` directly. I didn't rename `ERROR_SELECTOR`.
- `packages/framework/src/modules/module-assets.ts`: regenerated with `1c assets`.

**Checks:**
- **Bundle:** the extracted `MODULE_CLIENT_JS` passes `node --check` and also runs as a module without error. It now has 4 scoped blocks and no `export` lines.
- **REQ-93 file:** every in-scope test passes (AC1622, AC1623, the non-browser AC1624 tests, and the `FC_REQ-93` tests). The browser arm is the one skip.
- **REQ-145 build-artifact checks:** the committed file still matches a fresh compose, in both `test_UAT_FC_REQ-145_build_artifacts` and the same check in `reconciliation-workspace-build-artifacts`.
- **Typecheck:** `tsc` shows no errors in the edited file. ESLint isn't installed locally and the npm registry is blocked, so lint wasn't run.

**Still failing, and not caused by this change:** `test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate` gets a 404 where it expects a 302 on `/preview/alpha/published`. I put HEAD's versions of both files back and it fails the same way, so it was already failing. It's outside this batch and I didn't touch it.

I changed no tests, ACs or stories, and added no page-error exception.

## Assessment
```yaml
status: fixed_unverified_in_browser
files_changed:
  - tools/generate/src/cli/module-assets.ts
  - packages/framework/src/modules/module-assets.ts
evidence: "node --check and node execution of the extracted MODULE_CLIENT_JS both succeed; the REQ-145 checks that the generated file matches a fresh compose pass; all non-browser REQ-93 / AC1622 / AC1623 / AC1624 tests pass"
not_verified: "the AC1624 browser arm is skipped because Chromium will not launch in this sandbox (playwright: 'Target page, context or browser has been closed')"
pre_existing_failure: "test_UAT_AC1400 gets 404 instead of 302 on /preview/alpha/published; it fails the same way with HEAD's files, so this change did not cause it"
```