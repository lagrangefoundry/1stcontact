---
uid: report-57fad8eb
id: REPORT-5826
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T21:54:21.289621+00:00'
updated_at: '2026-10-02T21:54:21.289621+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — pick `799bde400f` (REQ-351)

- Picked commit: `799bde400f29eb1dc22a7e53a179da3c9b211f71` — `fix(l1,capture): read the canvas, the band's own paint and the height rule off the evidence [FREE-CODED]` (2026-09-29 18:39:15 -0700, 21 files)
- HEAD at resolution: `54e38a5a85605175688dcbebc4f8ed19a6cb9df9`
- Apply target: `ec118d67626fd31cfce67ca88dc9908ecdde70ed`
- Retry count: 1, `prior_stage_failure` empty
- Conflicted paths: `package.json`, `tools/generate/src/cli/capture/schema.ts`

## Cause

REQ-352 (`3213640c39`, already on this branch) and REQ-351 (this pick) each
claimed **capture schema 10**: both add a `**10**` docblock entry, set
`CAPTURE_SCHEMA = 10`, and add `since: 10` axes at the same spot. `package.json`
is the version-counter collision (base .411 / theirs .412 / ours .414; HEAD's
`0477a057b1` is literally `-.411/+.412`, so incoming's value was already retired).

## Resolution: the developer's own merge is the oracle

The developer resolved this exact conflict on xgd-working in `b9bc30bd55`
(`Merge branch 'free-REQ-351' into xgd-working`, parents `c9b58dc279` and
`799bde400f` = this pick). Resync never picks merge commits, so it cannot arrive
through the queue. Inputs proven identical first: stage 2 of both conflicted
paths == the merge's first-parent blobs (`package.json` `31a13da8cb`,
`schema.ts` `32475ad9ba`), and `git diff --stat HEAD b9bc30bd55^1` over the
pick's 21 paths differs only in the BUG-142 test (branch-local, below).

Took the merge's blob for four paths, all inside the pick's own diff:

| Path | What the merge did |
| --- | --- |
| `tools/generate/src/cli/capture/schema.ts` | REQ-351's entry renumbered to **11**; `CAPTURE_SCHEMA = 11`; REQ-352's entry, `ANCHOR_POPULATION_SCHEMA = 10` and its `since: 10` axis kept verbatim; REQ-351's two axes are `since: 11`. Nothing dropped from either side. |
| `package.json` | `0.2.415` — ours' .414 re-bumped, per the merge message. Only the `version` line differs from ours. |
| `tools/generate/src/cli/capture/types.ts` | `bodyBackground` comment: "schema 10" -> "schema 11" (applied clean; merge edited it outside any marker) |
| `packages/site-schema/src/l1/validate.ts` | adds `upgradeL1LegacyViewportResponse` (+50, applied clean; merge-authored) |

`value-axes.ts`, `values-diff.ts`, `probes.ts` and the BUG-143 test auto-merged
to exactly the merge's blobs. The enrichment's "take the more recent commit by
timestamp" rule was not applied — it would have kept one ticket's schema 10 and
dropped the other's.

## GAP — needs a follow-up, not delivered by this resolution

The merge also carries a regression fix that spans two files **outside the
pick's diff**, which the workflow does not let a resolver stage:

- `packages/site-schema/src/l1/index.ts` — exports `upgradeL1LegacyViewportResponse`
- `tools/generate/src/cli/capture/bundle.ts` — `readL1` applies it on the way out

Without them, REQ-351's refusal of the node-level `viewportResponse` makes
`promoteToFlow` / `validateL1` throw on any stored bundle whose retained
`l1.json` predates this change (callers: `gate-core.ts:1163`, `repro.ts:228`).
The function itself is now on the branch (in `validate.ts`) but unexported and
unused, so it is inert.

Because the export is missing, the two test files were **left as the pick
applied them** rather than taken from the merge — the merge's versions import
the unexported symbol:

- `tests/test_UAT_FC_REQ-278_flow_recovery_preserves_geometry.test.ts` (merge: stored-bundle leg reads through the upgrade)
- `tests/test_UAT_FC_REQ-351_the_fold_reads_the_evidence_it_has.test.ts` (merge: +1 test, `a_document_folded_before_this_change_is_lifted_not_rejected`)

Follow-up to close it: `git checkout b9bc30bd55 --` those four paths (two
source, two tests). No later non-merge commit on xgd-working delivers these
hunks. Not hand-ported here.

## Left branch-local

`tests/test_UAT_FC_BUG-142_a_backing_surface_owns_its_content.test.ts`: the
staged-vs-merge difference (-52) is exactly the HEAD-vs-`b9bc30bd55^1`
difference; the merge made no edit of its own there.

## Verification

- `git diff --cached --stat b9bc30bd55 -- <21 pick paths>`: only the BUG-142
  test (branch-local) and the two test files named in the gap.
- Staged paths outside the pick's diff: none (`comm -23` empty). No conflict
  markers. `CHERRY_PICK_HEAD` intact, HEAD unmoved.
- `tools/generate` `tsc --noEmit`: 4 errors, all already on the branch on
  untouched files (3x `templateUid` not in `OutgoingMessage` in control-app,
  `miniflare` not found from `src/fonts/seed.ts`). None from this pick.
- vitest over the pick's 7 test files: REQ-278 passes. BUG-48 runs with 4
  failures, all the `zoomGroupChromeAgrees` gap already red on this branch, in
  the merge and at the apply target. The other 5 (REQ-351, REQ-338, BUG-142,
  BUG-143, req88) **did not run** — import fails with `Cannot find package
  'miniflare'` from `tools/generate/src/fonts/seed.ts`, a missing install in
  this worktree. They are unverified here. The worktree's `storage/` holds no
  site bundles, so the stored-bundle legs that would exercise the gap skip.

## Forecast

Next version-bumping pick is `7ac93906a5` (`chore: bump version for BUG-161
(0.2.412 was overtaken on xgd-working)`); expect a one-line `package.json`
conflict against .415 — compare the numbers, incoming wins if higher.
