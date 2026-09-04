---
uid: report-87fa1e3f
id: REPORT-3443
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T01:08:35.540413+00:00'
updated_at: '2026-09-04T01:08:35.540413+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `tools/generate/src/cli/kb.ts` — UU on an implementation/code file (rule 2c).
  Single conflict hunk, in the import block at line 57. The two sides added
  DIFFERENT imports at the same position, so this is 2c.2 (non-overlapping
  changes: combine — keep both), not a winner-pick:
    - HEAD (`feat(kb): projected reference — the product's own facts, generated
      [FREE-CODED]`) added `import { isProjected, projections, type ProjectedDoc }
      from './kb-projection'`
    - Incoming `2745001058` (`feat(kb): the system knowledge base reaches the
      Worker [FREE-CODED]`) added `import { CORPUS_TYPE, SHIPPED_SOURCE,
      SYSTEM_KB } from './kb-model'`
  Both import lines kept, HEAD's first, incoming's second. The enrichment's
  "intent unknown, take the later commit and flag" fallback was not needed —
  the two sides are disjoint, so nothing had to be discarded and there is no
  fact for the timeline rule to arbitrate.

  Both sides' symbols are live in the resolved file, so dropping either import
  would have broken the build: `isProjected` (kb.ts:409, 466, 1146),
  `projections` (kb.ts:455), `ProjectedDoc` (kb.ts:536) from HEAD's side;
  `SYSTEM_KB` (kb.ts:131, 263, 503, 595, 692, 695, 709, 843, 876),
  `CORPUS_TYPE` (kb.ts:197, 314, 498, 688, 931) and `SHIPPED_SOURCE`
  (kb.ts:602, 709) from incoming's. `kb-projection.ts` and `kb-model.ts` both
  exist in the resolved tree.

No other conflict classes were present: `git diff --name-only --diff-filter=U`
is empty and no `<<<<<<<`/`=======`/`>>>>>>>` markers remain in the file. No
deletion (DU/UD), AA, spec-ticket, or config conflicts arose in this
cherry-pick.

## Incoming changes preserved

`git show 2745001058 -- tools/generate/src/cli/kb.ts` contains four hunks.
All four are present in the resolved file:

1. `statSync` added to the `node:fs` import list — present, kb.ts:51 (merged
   cleanly; it was not part of the conflict region).
2. `import { CORPUS_TYPE, SHIPPED_SOURCE, SYSTEM_KB } from './kb-model'` —
   present, kb.ts:60. THIS IS THE HUNK THAT CONFLICTED, and it is kept verbatim.
3. The local `export const SYSTEM_KB` / `SHIPPED_SOURCE` / `CORPUS_TYPE`
   declarations replaced by the re-export from `./kb-model`, with the new
   "THEY LIVE THERE RATHER THAN HERE" doc comment — present, kb.ts:71-80.
   Confirmed the removals took: no `export const SYSTEM_KB`,
   `export const SHIPPED_SOURCE`, or `export const CORPUS_TYPE` remains
   anywhere in the file, so there is no duplicate-declaration shadow of the
   values now owned by `kb-model.ts`.
4. The new `// ── step 3b: the KB as a Worker gets it ──` section — the
   `KbBundle` interface (kb.ts:1017) and `export async function kbBundle`
   (kb.ts:1044), including the carried `updated_at` stamp via
   `statSync(...).mtime.toISOString()` (kb.ts:1070) that the commit message
   singles out as the reason a bundle must not default to EPOCH.

No hunk was dropped, so the BUG-1301 precedence exception did not need to be
invoked anywhere in this resolution.

## Spot-check

`npm run typecheck` in `tools/generate` (`tsc -p tsconfig.json --noEmit`) —
no errors in `kb.ts`, `kb-model.ts`, `kb-projection.ts`, or any other file
carried by this bundle, which confirms the combined import block resolves and
both modules' exports line up with their use sites. The only four errors
reported are pre-existing and unrelated to this cherry-pick: missing
`@anthropic-ai/sdk` and `unpdf` type declarations, plus two resulting implicit
`any` parameters, all in `apps/control-app/src/describe.ts`. That is the known
shared-node_modules gap in this sandboxed worktree, not a regression from this
resolution. No full-suite quality run was invoked.

## Staging

`tools/generate/src/cli/kb.ts` staged with `git add`. `git status --porcelain`
shows no conflict-class lines; the file appears as `M`. The in-progress
cherry-pick was left untouched — CHERRY_PICK_HEAD is still present for
`cherry_pick_finalize_resolution`, and no `--continue`/`--skip`/`--quit`/
`--abort`, `git reset`, or `git checkout <branch>` was run.
