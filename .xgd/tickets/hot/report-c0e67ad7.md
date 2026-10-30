---
uid: report-c0e67ad7
id: REPORT-5771
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T07:10:26.882901+00:00'
updated_at: '2026-10-02T07:10:26.882901+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

Cherry-pick `5653de893110491864d21ed8afc461c55bca12f9` — "repro console: group
[recapture] with [run again] as continuations [FREE-CODED]" (BUG-120, author
2026-09-18 16:53:54 -0700) onto HEAD `b52d7ea06f`. Three files in the commit; two
applied cleanly, one conflicted.

- `tools/repro-console/src/console.ts` — code file, `UU`, one region. Rule 2c:
  incoming is authoritative. Resolved to incoming's version of the file
  (`git checkout --theirs`), which contains everything ours had.
  - Base `ef705c2f04` / ours `37150f0eba` / theirs `7301079baa`.
  - Ours' ENTIRE delta from base is one line moved: `held: this.heldView()` sits
    after the `notice` spread instead of before it, inside the object literal
    `page()` returns. No field added, removed or changed. The swap is not an
    edit made by ours' commit `3673102176` either — it appears there as
    unchanged context, so it is an artifact of an earlier pick on this branch.
  - Theirs adds one line between `held` and `notice`
    (`...(this.staleReference() ? { staleReference: ... } : {})`), plus two
    imports and the `staleReference()` method, both of which auto-merged.
  - Git conflicted only because theirs' new line is adjacent to the line ours
    moved. Nothing is mutually exclusive: the result carries `held`,
    `staleReference`, `notice` and `filings`, in incoming's order. Key order in
    this literal has no consumer — `page.ts` reads every field by name.
  - `xgd-working`'s tip has the same order (`held`, `staleReference`, `notice`,
    `filings`), so taking incoming's order keeps the branch aligned with the
    later picks on this file rather than re-conflicting on the same line.

The enrichment's rule ("intent unknown, take the more recent commit by
timestamp") was not used. Incoming is the later commit here anyway (16:53:54 vs
ours' 16:40:04 the same day), so it agrees with the outcome.

## Incoming changes preserved

- `tools/repro-console/src/console.ts`: `git diff --stat 7301079baa -- <path>`
  is empty — the resolved file is byte-identical to incoming's blob, so every
  incoming hunk is present: the `staleCaptureDetail` / `Capture` imports, the
  `staleReference` field on the page state, and the `staleReference()` method.
  Both imported symbols exist on this branch
  (`tools/generate/src/cli/capture/schema.ts:198`,
  `tools/generate/src/cli/capture/types.ts:633`).
- `tools/repro-console/src/page.ts` (M) and
  `tests/test_UAT_FC_BUG-120_continuation_affordance.test.ts` (A) applied
  without conflict and are staged as the cherry-pick left them.
- Nothing dropped; the BUG-1301 precedence exception was not used.

## Exit state

No unmerged entries. Staged: `A` the BUG-120 UAT test, `M` `console.ts`, `M`
`page.ts`. HEAD unmoved at `b52d7ea06f`, `CHERRY_PICK_HEAD` intact at
`5653de8931`. No tests or typecheck were run in this session.
