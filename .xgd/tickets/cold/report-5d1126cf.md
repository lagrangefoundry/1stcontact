---
uid: report-5d1126cf
id: REPORT-1012
type: report
title: 'Resync resolve conflicts: fd969f4f6a2065e3cec3e3f319fa94d2238c71bd'
created_by: xgd
created_at: '2026-07-29T03:51:38.397420+00:00'
updated_at: '2026-07-29T03:51:38.397420+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `.xgd/tickets/hot/request-a115da4d.md` — class **DU** (deleted by us / modified by them). Rule applied: **deletion is correct → `git rm`**.

  The DU is a *phantom* deletion, not an LLM-churn deletion. Evidence gathered before resolving:
  - `git log main..HEAD --name-only -- .xgd/tickets/` is **empty** — every commit picked in this resync carries code only. Ticket state is owned by `xgd-working`/reconcile and is deliberately out of the resync's scope.
  - `git log main..HEAD --diff-filter=D -- <path>` is **empty** — no commit on this branch ever deleted the file.
  - The file is absent from the `HEAD` tree entirely.

  The ticket (REQ-106) was created on `xgd-working` *after* the resync watermark, so it exists in the cherry-pick's merge base but has never existed in this main-rooted branch. Git reports that absence as "deleted by us". Restoring it would import half-updated ticket state — including a `commits: working_sha` pointer that is meaningless on this branch — and would corrupt the capability matrix when reconcile fires.

## Incoming changes preserved

Both code files in the incoming commit `f25657f80` are staged **byte-identical to the incoming version** (verified by diffing `git show f25657f80:<path>` against `git show :<path>`):

- `package.json` — IDENTICAL. Version bump `0.0.218` → `0.0.219` present.
- `tests/bug28-contact-form-enhance.test.ts` — IDENTICAL. All three UAT functions present, none deleted:
  - `test_UAT_FC_BUG-28_mailto_and_tel_are_not_intercepted`
  - `test_UAT_FC_BUG-28_http_and_relative_actions_still_enhance`
  - `test_UAT_FC_BUG-28_any_other_scheme_falls_back_to_the_browser`

Nothing from the incoming side was discarded. The resolution leaves a real net change from `HEAD` (`M package.json`, `A tests/...`), so this is not an empty resolution.

## Note on the BUG-28 fix being split across two picks

The implementation half of BUG-28 (`canEnhance()` in `packages/framework/src/modules/contact-form/client.js`) is **already on this branch**, landed by the earlier pick `d84551664`. The conflicting commit `f25657f80` carries only the version bump and the test. Confirmed the scheme check is present on `HEAD`, so the fix is whole — but the version bump and the code it certifies sit in different commits on this branch.

## Verification performed

The staged index tree (`764dd9d7f`) was build- and test-verified:

- `pnpm -r build` — clean across all 8 workspace projects (no stale-`dist` masking of type drift).
- Full suite: **866 passed, 4 failed**. The 4 failures are pre-existing and environmental, unrelated to this pick — `bug17-fold-padding`, `req91-l1-pixel-mover-axes`, and two in `req96-control-composition` all `ENOENT` on `storage/references/gigabytealchemy.ai/index/multistate.json`. `storage/references/` has zero files tracked in git, so no fresh worktree can have those capture bundles.
- The two directly relevant files pass 13/13: `tests/bug28-contact-form-enhance.test.ts`, `tests/req106-l1-links.test.ts`.

## Process deviation (disclosed)

This stage ran `git cherry-pick --continue` in an earlier turn, **before** the stage-resolution instructions forbidding it were received, committing the pick as `64d35ccf0` and clearing `CHERRY_PICK_HEAD`. That was repaired in-stage: `git reset --hard bbf376974` followed by re-running `git cherry-pick f25657f80`, which reproduced the identical `DU` conflict, then resolving and staging without continuing.

The repair is verified exact — the restored index tree hash `764dd9d7fa986ef7cfc26ecc58f564e8e7fdff4a` equals the tree of the discarded commit `64d35ccf0`. `CHERRY_PICK_HEAD` is present again (`f25657f807239741235ca7aaecbb230d83386f4e`) for the Python step that follows. The discarded commit remains in the reflog.
