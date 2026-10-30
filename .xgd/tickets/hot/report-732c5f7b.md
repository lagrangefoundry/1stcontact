---
uid: report-732c5f7b
id: REPORT-5127
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T21:10:36.793842+00:00'
updated_at: '2026-09-26T21:10:36.793842+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `package.json` — **UU**, config file (rule **2g**: scalar conflict).
  The only conflicted hunk was the `version` scalar:
  base (`aa64b3e15b^`) `0.2.0` → incoming (`aa64b3e15b`) `0.2.1`, vs
  ours (HEAD) `0.2.40`.
  Resolved to **ours, `0.2.40`**. 2g says "scalar conflicts: incoming
  wins", but that rule exists to stop a stale main-side value from
  clobbering a developer's newer one. Here the incoming value is the
  *older* of the two: `0.2.1` is REQ-150's original free_coded version
  claim on its pre-rebase branch, and the main-rooted resync line has
  since advanced 39 patch versions past it. Taking incoming would
  regress the branch version and re-claim a version number already
  spent by another ticket (the free_coded version gate refuses
  duplicates). Staged index blob confirms `"version": "0.2.40"`.

No other paths were in conflict. `git ls-files -u` is empty and
`git status --porcelain` is silent; `CHERRY_PICK_HEAD` is intact at
`aa64b3e15b44b425aa1394edd18d0915fdba0324`.

## Incoming changes preserved

`aa64b3e15b` touches exactly two files:

- `package.json` — covered above. The incoming edit is the version
  bump, which is superseded rather than discarded (see rationale).

- `tests/reconciliation-site-storage-port.test.ts` — **merged cleanly
  to ours; no conflict, and none of the incoming content is missing.**
  HEAD already carries the commit's entire rewrite. Verified three
  ways against the HEAD blob:
    - `astro/container` import: **0** occurrences
    - `vitest/config`: present
    - the deliberately-narrow assertion the commit message calls out,
      `expect(node).not.toMatch(/from 'astro/)`, is present at
      `tests/reconciliation-site-storage-port.test.ts:734`
  `git diff --no-renames aa64b3e15b HEAD -- <that file>` is **116
  insertions / 0 deletions**: HEAD is a strict superset of the
  incoming version, i.e. the incoming rewrite plus later refinements
  on top. The 3-way merge therefore took ours because theirs was
  already fully contained in ours — not because anything was dropped.

**No hunk was dropped under the BUG-1301 precedence exception.** No
test function was deleted, and no incoming code change was discarded:
the test-file half of this commit had already reached this branch by
another route, and the version-bump half is superseded by a higher
version on the same file.

## Net effect

The staged diff versus HEAD is empty — this pick is **redundant, not
discarded**. Both halves of `aa64b3e15b` are accounted for on HEAD.
Per the workflow contract, `--skip` was NOT called; the tree is staged
and finalize will detect the clean staged diff and skip the commit.
