---
uid: comment-1a363f1b
id: COMMENT-1840
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-08-31T18:35:08.240475+00:00'
updated_at: '2026-08-31T18:35:08.240475+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-bb07edee
  kind: note
---

Report filed as **REPORT-3022**. All five blocking findings from REPORT-3021 are fixed and verified by actually running the files.

## What was wrong and what I did

All five were Step 5b evidence gaps — active criteria whose UATs failed on execution. The stories and criteria themselves were sound, so **no story or AC was created, modified, or deleted**. There was no `fc_orphan_check` report for this anchor, so category 3 didn't apply.

**AC-1341 — the exception clause was stated but never implemented.** `missingFromEnv` (`tests/support/wrangler-toml.ts:118`) reported `ACCESS_DEV_OPEN` as missing from `[env.production]` — the one variable the criterion explicitly exempts, because its absence *is* the security control. Added an exported `DEV_ONLY_VAR` constant and excluded it, then added the UAT halves the Verification names: the exempt variable reports nothing, a second dropped variable is still named. Also covered the Verification paragraph about `workers_dev` / `[observability]` staying invisible to the enumerated sets.

That fix exposed a **latent** failure sitting behind it: the UAT asserted control-app carries `BUILDER_ORIGIN`, a variable that no longer exists in the tree. It had never been reached. Re-pointed at what the criterion actually claims — `TENANT_ID` plus the Access identifiers.

**AC-1336/1337/1338 — three UATs pinned to a nine-check smoke script that now has eleven.** Split `NINE_CHECKS` into `PUBLIC_CHECKS` + `CONTROL_CHECKS`. AC-1336's `not.toContain('skip  ')` directly contradicted its own criterion, which requires skips to be *named*; it now asserts exactly that, plus corrected counts (`9 passed, 2 skipped`).

**AC-1342 — asserted prose the secret-hooks document no longer carries.** Took the stronger of the two remedies the review offered: rather than re-point at the new wording, the echo behaviour is now observed. The real `10-anthropic-api-key` hook runs with `npx` replaced by a recorder, on both paths, asserting only the name is echoed, the value is piped (never an argument), arrives with no trailing newline, and a rehearsal uploads nothing.

**Secondary AC-1055 finding — also closed.** The review judged it non-blocking partly because its sandbox couldn't run `.workers.test.ts` files; this worktree can. Added a workerd UAT covering the streaming-origin refusal shape (`router.ts:669-676`) across all four unresolvable identifier forms.

## Verification

I ran the files rather than trusting a quality report — the review's warning about `pass (0 tests, 0 failed)` with `suites: {}` was the whole reason these went unnoticed:

- smoke file: **12 passed, 1 failed**
- log-retention + REQ-144 deploy scripts: **20 passed**
- assistant continuity (workers): **2 passed**
- build-order/private-surface + REQ-145 artifacts + workspace artifacts: **11 passed, 1 failed**

Both remaining failures are the `@lagrangefoundry/webui-shell is not installed` worktree-location artifact — the one the previous review explicitly excluded, in files this fix doesn't touch. Nothing here can resolve it, and it will still be visible to a re-review.
