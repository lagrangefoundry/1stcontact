---
uid: report-4c96521b
id: REPORT-2945
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T14:43:34.519115+00:00'
updated_at: '2026-08-31T14:43:34.519115+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `package.json` — UU, config file (2g) with a **version scalar** conflict.
  HEAD `0.2.9` vs incoming `0.2.4`. Both sides are `[FREE-CODED]`, so the
  2c/2g "incoming wins" default is superseded by the both-sides-free_coded
  exception: take the later working-timeline position. HEAD side is
  `07afe0840d` "chore: version bump — 0.2.8 was claimed at the working tip
  by this ticket's own auto-commit" (2026-08-23 15:10:17 -0700); incoming is
  `31a4ca7da5` (2026-08-22 15:08:46 -0700). HEAD is later, so `0.2.9` kept
  via `git checkout --ours` + `git add`. This also agrees with the
  auto-enrichment rule ("take the more recent commit by timestamp").

  Diffing the three index stages confirms the incoming side's ONLY change to
  this file is the bookkeeping bump `0.2.3` → `0.2.4` (base blob
  `b9a57f3cdd` vs theirs `9b467f2a4d` differ on the version line and nothing
  else). Taking ours therefore discards no incoming content beyond a version
  number that a later commit has already superseded — reverting to `0.2.4`
  would re-claim a version already consumed at the working tip.

No other conflict classes were present: `git ls-files -u` listed only
`package.json`. The 12 untracked files under `.xgd/tickets/hot/` are
pre-existing seed artifacts, not part of this conflict.

## Incoming changes preserved

The incoming commit `31a4ca7da5` "feat(schema): reserve locale-shaped page
slugs [FREE-CODED]" touched four files. The three substantive ones applied
without conflict and are **byte-identical between HEAD and the incoming
commit** (blob SHAs compared directly):

- `packages/site-schema/src/locale.ts` — blob identical in HEAD and
  `31a4ca7da5` (both 17762 bytes); `git diff HEAD 31a4ca7da5 -- <path>` empty.
- `packages/site-schema/src/schema.ts` — blob `c5ba468243` on both sides.
- `tests/test_UAT_FC_REQ-153_locale_slug_reservation.test.ts` — blob
  `00a9bb714d` on both sides.

So `isLocaleShapedSlug` and the `pageSchema.slug` constraint, plus the full
UAT test file, are present in the resolved tree. No test function on either
side of this conflict was deleted; no hunk was dropped under the BUG-1301
precedence exception (it did not need to apply).

STEP 3 check: **PASS — redundant, not discarded.** The incoming commit's key
changes are present in HEAD (identical blobs), reached via a prior
post-watermark route rather than by this cherry-pick. Per STEP 4 /
BUG-1109 / BUG-1122, the staged tree consequently nets to no diff vs HEAD
(`git status --porcelain` shows no entry for `package.json`). `--skip` was
NOT called; the finalize step will detect the clean staged diff and skip the
commit itself. `CHERRY_PICK_HEAD` (`31a4ca7da5`) is intact.
