---
uid: comment-6817ff5f
id: COMMENT-847
type: comment
title: Claude response for coding_red report
created_by: xgd
created_at: '2026-08-08T01:44:52.328031+00:00'
updated_at: '2026-08-08T01:44:52.328031+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-9446805d
  kind: note
---

✓ RED phase complete — the evidence was written and verified this session. Here is the required plan and the completeness checks.

## Step 1 — ACs

23 unique ACs on STORY-99. **AC-1030 is the only one `pending`** (`acceptance_criterion-1b27e14b`, created 2026-08-08); the other 22 are `active` with existing evidence. This matches the sprint's declared delta. AC-1029 (created 2026-08-07) is `active` and already covered by `reconciliation-builder-workspace-mounted.test.ts` — not a second undelivered item.

**One inconsistency to surface**, per the Step 1 instruction: the story's `story_kind` is `upgrade`, but SPRINT-2 explicitly classifies the work as reconciliation — *"the anchoring behaviour is correct as shipped and authoritative. No runtime change… is in scope. If a UAT and the shipped behaviour disagree, the UAT is wrong."* The story body agrees ("Establishing it against fixture trees is what makes it evidence rather than a coincidence of layout"). Story body takes precedence, so I applied **reconciliation** rules: tests pass on write, zero production edits. Expected failure reason is therefore N/A, not "behaviour mismatch" — flagging it because the `upgrade` kind would otherwise imply a GREEN phase that must not happen.

## Step 2 — Evidence plan (AC-1030)

**2.1 Claims.** Five, not one: (a) `.git` a directory → anchor is the checkout; (b) `.git` a pointer whose `commondir` names a shared repository → anchor is the main checkout, *never* the working tree; (c) pointer with no `commondir` → anchor is the pointer's own directory; (d) no repository data above → anchor is the walk origin, terminating rather than throwing or climbing to root; (e) the observable equality — every component's directory resolved from a linked working tree is the *same* directory as from the main checkout.

**2.2 Observations.** For (a)–(d) the anchor is invisible, so I made it observable: a differently-tagged stand-in store is planted at *every* candidate location, and the assertion is which directory came back plus the `marker` in its `package.json`. The copy consumed names the location anchored to. For (e), a three-way path equality against the real installed store — resolution from a linked working tree, the ambient `webuiPackageDir()`, and an independent upward lookup anchored at the checkout **git itself** names via `rev-parse --git-common-dir`.

**2.3 What must be real.** The resolver: the shipped `webui.ts` is copied byte-for-byte into each fixture and run by a real `node` child process. A child process rather than an in-process import for two reasons — the anchor is computed once at module load from the file's own location, so each shape needs a fresh instance; and resolution then goes through Node's ordinary upward lookup rather than Vitest's transform-time resolver, which is the mechanism the behaviour actually relies on. Shapes (a) and (b) are built by `git init` / `git worktree add`, not hand-forged. Nothing is mocked. The fixtures supply checkout *shapes*, never the resolution logic.

**2.4 Infrastructure.** Reused `tests/support/webui-installed.ts` (`WEBUI_INSTALLED` / `WEBUI_SKIP_REASON`) rather than inventing a parallel gate, and `WEBUI_SCOPE` / `WEBUI_PACKAGES` from the single declaration site. No parallel fixtures added. The scope is composed, never written literally — required, since AC-960's tracked-tree guard scans this file.

**2.5 Could a broken implementation pass?** Checked by mutation rather than argued. Three mutations to a copy of the anchor (reverted; the staged delta is add-only, 1 file, +385 lines):

| Mutation | Tests that fail |
|---|---|
| no anchoring at all | shapes (a), (b), (c) |
| skip the `commondir` follow, still landing inside the main checkout | shape (b), shape (c), the real-installation UAT |
| throw instead of terminating at the walk origin | shape (d) |

The second is why shape (b) also plants a copy at the pointer's *target*: without it, several wrong answers still land somewhere inside the main checkout and pass. Each test additionally asserts the copies it declined exist, so a pass cannot come from there being only one option.

The first mutation also demonstrates the failure mode this sprint exists to close: with the anchor broken, `WEBUI_INSTALLED` goes false and the real-installation UAT *skips* — the silent green — while the four fixture UATs fail loudly regardless. That is the checkout-independence the sprint asked for.

## Cross-story contradiction scan

Complete, and vacuous by construction: the delta changes no production module and no shared test helper, so no existing test can be asserting a superseded contract. Verified — `git diff --cached --stat` is a single added file.

## Results

`26 passed, 0 skipped` across the delta plus the sprint's declared regression set. The AC-960 one-definition guard passes with the new file staged and therefore scanned.

**Unchanged from my earlier report, and still outside this task's scope:** 6 pre-existing failures in `reconciliation-copy-edit-gesture-modal.test.ts` (AC994, AC1000–AC1003) and `req115-builder-composition.test.ts` (`open_in_new_tab_matches_the_iframe_exactly`). They reproduce identically with my suite absent. Fixing them requires editing `apps/control-app/src/builder/*.js`, which this sprint excludes. Also worth a glance: the sprint body records the regression set as 24 tests; those three files measure 21 here, all passing — likely a stale figure.

```
✓ RED phase complete
Story: STORY-99 (upgrade; work is reconciliation-shaped per SPRINT-2 — see flag above)
Evidence plan: all ACs covered (23/23; AC-1030 was the only pending one)
UATs written: 5 (+ 0 modified, + 0 removed)
Expected failure reason: N/A (reconciliation) — tests pass against shipped behaviour
```

Next: `run_task_GREEN_phase` — which for this task must be a no-op on production code; the sprint states a GREEN phase that edits production is out of scope.
