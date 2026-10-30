---
uid: report-c75688b3
id: REPORT-5550
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T13:26:03.193596+00:00'
updated_at: '2026-09-29T13:26:03.193596+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

Incoming commit `b38dbdabf1` — _feat(identity): a person's name is a table, and
every part is optional [FREE-CODED]_ (REQ-193). Five files in the commit, two of
them conflicted; the other three auto-merged.

- `apps/control-app/src/system-knowledge.ts` — UU, §2c code file. The incoming
  hunk changed `export { SYSTEM_KB }` → `export { SYSTEM_KB, SHIPPED_SOURCE }`
  and added a two-line comment explaining why the two travel together. HEAD had
  already re-exported `SHIPPED_SOURCE` through a different path (the BUG-55
  commit, _"the index seam is a map keyed by source, not one index"_), so the
  export line was common text and only the comment came through as a conflict.
  Non-overlapping addition → **kept both**: the comment now sits above the
  export line HEAD already carried. `SHIPPED_SOURCE` is imported at line 16 of
  the resolved file, so the re-export resolves.
- `package.json` — UU, §2g config scalar (`version` only). HEAD `0.2.89` kept
  over incoming `0.2.87`. **Deviation from 2g's "incoming wins"** — see below.
  The resolved file is byte-identical to HEAD, so `package.json` no longer
  appears in `git status --porcelain`; that is expected, not a missed stage.

Auto-merged, no conflict, staged as-is:

- `apps/control-app/src/builder/people.js` (+2 hunks)
- `apps/control-app/src/router.ts` (+1 hunk)
- `tests/test_UAT_FC_REQ-190_baseline.test.ts` (+1 hunk)

No test function was deleted on either side. No BUG-1301 precedence exception
was invoked.

## Incoming changes preserved

`git diff --cached` over the staged tree carries every code hunk of
`b38dbdabf1`:

| file | incoming hunk | present in staged tree |
| --- | --- | --- |
| `system-knowledge.ts` | `SHIPPED_SOURCE` re-export + BUG-55 comment | yes — export already in HEAD, comment added |
| `builder/people.js` | `haystack` rebuilt as an array join over `formerNames` | yes |
| `builder/people.js` | `auto` commit-mode comment rewritten for REQ-193 supersession | yes |
| `router.ts` | `POST /api/people/record` header — "the fields the operator owns" | yes |
| `test_UAT_FC_REQ-190_baseline.test.ts` | `user_names` added; EIGHT→NINE single-column TEXT keys | yes |

The only incoming hunk not taken is `package.json`'s version line, deliberately
and per the deviation below.

## Deviation: `package.json` version

2g says incoming wins for config scalars. Kept HEAD's `0.2.89` over incoming's
`0.2.87` anyway, on the same grounds recorded for every preceding version
conflict in this resync run (`resolve-377b581e-61a0becc61`,
`resolve-377b581e-b8b01ebf`):

- The incoming hunk is a routine free-coded patch bump in the pre-resync
  working-branch numbering. The main-rooted resync branch is already at `0.2.89`
  (commit `4904947c85`, _chore(version): 0.2.89 for REQ-192_), which is ahead of
  it.
- Taking incoming would regress the published version — a monotonic release
  counter is not a developer intent being discarded, it is bookkeeping that the
  resync branch's own later `chore(version)` commits own.
- No developer code rides on this hunk: the version line is the whole of
  `b38dbdabf1`'s `package.json` diff.

## Verification limits

The tree was not built or tested. Resync is a caretaker process and MUST NOT run
`test_fix`; separately, the workers-pool vitest suites are not runnable in this
session's role. The claims above rest on reading `git show b38dbdabf1` per file
against `git diff --cached`, not on a compiler or a test run.

## Post-merge review flag

The enrichment metadata classified both conflicts as _"intent unknown on one or
both sides"_. Neither turned out to be a genuine intent collision on inspection
— `system-knowledge.ts` was a comment landing beside a change HEAD had already
made by another route, and `package.json` was a version counter. Flagging
`apps/control-app/src/system-knowledge.ts` for post-merge review anyway, per the
enrichment rule, since the BUG-55 export seam arrived on the two sides through
different commits.
