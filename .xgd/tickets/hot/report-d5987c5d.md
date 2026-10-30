---
uid: report-d5987c5d
id: REPORT-5461
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T04:58:10.654179+00:00'
updated_at: '2026-09-29T04:58:10.654179+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

Incoming commit = `e5d762332d` "fix(tests): repair the suite — a stale asset build and eleven superseded UATs [FREE-CODED]" (2026-09-01). Every OURS-side commit below postdates it, so the auto-enrichment's prescribed rule for all five files ("intent unknown on one or both sides — take the more recent commit by timestamp and flag for post-merge review") resolves each to OURS.

- `package.json` — UU, config scalar (2g/timestamp). OURS `80c9342ac1` (2026-09-14) > incoming. Kept `version: 0.2.40`; incoming's 0.2.32→0.2.33 bump is superseded. **Flag for post-merge review.**
- `tests/reconciliation-assistant-conversation.test.ts` — UU test file (2c/2f + timestamp). OURS `5c50b10a2a` (2026-09-14) > incoming. **Flag for post-merge review.**
- `tests/reconciliation-builder-workspace-origin.test.ts` — UU test file (2c/2f + timestamp, plus one BUG-1301 dropped hunk). OURS `a6d1b6b7bd` (2026-09-11) > incoming. **Flag for post-merge review.**
- `tests/reconciliation-copy-edit-parameter-sheet.test.ts` — UU test file (2c/2f + timestamp). OURS `5c50b10a2a` (2026-09-14) > incoming. **Flag for post-merge review.**
- `tests/reconciliation-platform-build-deploy-smoke.test.ts` — UU test file (2c/2f + timestamp). OURS `4f1062f56a` (2026-09-19) > incoming. **Flag for post-merge review.**
- `tests/test_UAT_FC_REQ-158_system_kb.workers.test.ts` — applied cleanly, no conflict; staged.
- `tests/test_UAT_FC_REQ-159_project_kb.workers.test.ts` — applied cleanly, no conflict; staged.

No UAT test function present on either side of this conflict was deleted. AC-id coverage was compared side-by-side for all four conflicted test files; see below.

## Incoming changes preserved

**Net staged effect of this cherry-pick** — incoming's AC-960 one-name-guard fix, on the two REQ-158/159 files: `` `@lagrangefoundry/knowledge` `` → "shared knowledge component" in both prose blocks. Verified applied: `grep -rn "lagrangefoundry/knowledge" tests/` now returns no matches, i.e. these were the last two occurrences.

**Hunks that applied as genuine no-ops** (already present in HEAD, so nothing to preserve): `.gitignore`, `apps/control-app/src/knowledge.ts`, `tests/test_UAT_FC_REQ-127_session_binding.test.ts`, `tools/generate/src/cli/assets.ts`. Spot-checked the commit's one real code fix — the `dist-assets.staging` swap — present at `tools/generate/src/cli/assets.ts:551` (`const stageDir = \`${outDir}.staging\``). All four paths are present and unflagged in the sparse checkout (`git ls-files -v` → `H`), so these are true no-ops and not sparse-skip artifacts.

**Conflicted files — incoming hunks not textually present, because HEAD already carries the same semantic change in a later and broader form:**

- `reconciliation-assistant-conversation.test.ts` — incoming inverted AC-1055's BUG-38 semantics (the derivable `site-<slug>` id now RESOLVES rather than being refused) and renamed the test accordingly. OURS `5c50b10a2a` makes the identical inversion with a strict superset of refusal cases (`conversation-42`, `site-ghost`, bare slug, `site-`, bare and prefixed traversal, and traversal onto a real site) plus an account-scoped refusal leg using a second workspace. All 11 incoming AC ids remain covered; HEAD additionally adds AC-1057's second paragraph and AC-1405. AC-1055 is renamed, not removed.
- `reconciliation-copy-edit-parameter-sheet.test.ts` — incoming's first hunk (the `shapes` containment assertion replacing an exact-set equality) applied CLEANLY and is present at lines 479/483. The conflicted second hunk's assertion — "the sheet is rendered exactly when there are parameters to put in it", `.toBe(panelParameters.length > 0)` — is present verbatim in HEAD, which additionally covers the REQ-140 colour parameter and the picture/region-kind case. Sole test name identical on both sides.
- `reconciliation-platform-build-deploy-smoke.test.ts` — incoming's REQ-147 additions (control-app origins in `correctOrigin()`, origin-keyed `FETCH_HOOK`, the `ACCESS_DEV_OPEN` filter, the secret-hook path in the scan list) merged cleanly because both sides added them identically. For the 14 conflicted regions HEAD is a superset: the same two control-surface checks (named `CONTROL_CHECKS`/`PUBLIC_CHECKS` rather than `ACCESS_CHECKS`/`SITE_CHECKS`), plus AC-1425, `DEV_ONLY_VAR`, the `[observability]`/`workers_dev` scope assertions, and a `runSecretHook` harness that EXECUTES the real hook instead of asserting on README prose. All 13 AC ids covered on both sides; only AC-1336 differs in name (both sides renamed it; HEAD's is later).
- `reconciliation-builder-workspace-origin.test.ts` — incoming replaced a fragile `expect(...).toBe(200)` with `not.toBe(401)` plus a cache-control assertion, driven through `worker.fetch` against a `beforeAll`-seeded miniflare D1. OURS `a6d1b6b7bd` had already migrated AC-964 off `unstable_dev` to the in-process `controlWorker` with a `call(route, admitted)` helper, dropping the `applyLocalD1Schema`/`seedIdentity` imports, and relocated the "that address is SERVED" claim to a workers-pool leg (documented in-file at lines 855-858). Incoming's hunk therefore targets an expression that no longer exists, and its goal — not asserting a 200 that only held on a checkout with leftover local state — is what HEAD achieves by construction. Preview-path cache-control coverage is retained at `tests/test_UAT_FC_REQ-145_builder_in_workerd.workers.test.ts:192`.

**BUG-1301 precedence exception — one dropped hunk, named explicitly:**

- File: `tests/reconciliation-builder-workspace-origin.test.ts`; dropped hunk: incoming's body for `test_UAT_AC966_view_mode_serves_the_real_rendered_artifact_byte_identical`.
- HEAD-side commit that already removed its target: `7b4bb0f470` (2026-09-10, "Workflow fix_uat_validation completed: done") — which postdates incoming (2026-09-01) and is already integrated into HEAD.
- Why that removal is a legitimate refactor and not a resolution shortcut: it was a RELOCATION, not a deletion. AC-966 now lives at `tests/reconciliation-builder-workspace-mounted.test.ts:389` as `test_UAT_AC966_the_ordinary_mode_displays_the_selected_sites_own_rendering`, and the move is documented in-place at `reconciliation-builder-workspace-origin.test.ts:129-138`, which records the reason: the old body compared the origin's bytes against a rendered file on disk, which is AC-1032's claim (asserted there over both draft-side channels and every artifact a channel contains), whereas what AC-966 actually owns is the BINDING — that whatever site is selected, ordinary mode displays that site's own rendering. AC-966 coverage is therefore intact and still executing; no UAT function was lost from the suite.

## Verification performed

- `git status --porcelain`: no UU/AA/DU/UD lines; only `M ` for the two REQ-158/159 files.
- `git diff --stat` (unstaged): empty — everything staged.
- Conflict-marker scan across all seven files: 0 matches.
- `git rev-parse CHERRY_PICK_HEAD` → `e5d762332d1ae0c00f387b0822f19f41b8c934d1`, still present and untouched. No `--continue`/`--skip`/`--quit`/`--abort` was run.
- Not run: the test suite. There is no typecheck script, and a full `vitest`/`tsc` pass would be spuriously noisy against this 11%-sparse checkout; the affected specs are workerd/D1/R2-backed. All five conflicted files were confirmed byte-identical to their stage-2 (HEAD) blobs, a state that already passed on main.
