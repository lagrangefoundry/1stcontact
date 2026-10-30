---
uid: report-56f366e0
id: REPORT-5554
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T14:05:53.876193+00:00'
updated_at: '2026-09-29T14:05:53.876193+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- **`apps/control-app/src/builder/api.js`** — **UU**, code file, rule **2c**
  (incoming authoritative, non-overlapping → keep both). The two sides touch
  the same region for unrelated reasons: incoming inserts a whole new export
  `fetchPersonMessages` (REQ-198) immediately above `updatePerson`, while HEAD
  had rewritten `updatePerson`'s docblock first line for REQ-193 ("every part
  of the name"). Nothing is mutually exclusive — the merge region only
  collided because incoming's hunk carried the pre-REQ-193 wording of that
  docblock as trailing context. Resolution: added incoming's
  `fetchPersonMessages` verbatim and kept HEAD's REQ-193 docblock wording for
  `updatePerson`. `node --check` parses the result.

- **`apps/control-app/src/builder/builder.css`** — **UU**, code file, rule
  **2c** (non-overlapping additions → keep both). Both sides appended a new
  rule block after `.builder-people__rename-said`: HEAD the REQ-193 rename
  dialog family, incoming the REQ-198 `.builder-people__bounced` accent. Kept
  both, incoming's block placed after HEAD's. Incoming's other two hunks (the
  `.builder-people__bounced` pill selector at the shared metrics rule, and the
  83-line messages-pane block) merged without conflict and are intact.

- **`package.json`** — **UU**, config file, rule **2g** (scalar conflict →
  incoming wins). **Deviation from 2g**, see below. Kept HEAD's `0.2.103` over
  incoming's `0.2.87`. The resolved file is byte-identical to HEAD, so
  `package.json` no longer appears in `git status --porcelain`; that is
  expected, not a missed stage.

## Incoming changes preserved

- **`api.js`** — `git diff --cached HEAD` adds exactly the 14 lines incoming
  adds (`git show 5360036587 -- api.js`), byte for byte: the REQ-198 docblock
  and the full body of `fetchPersonMessages`. The only difference between the
  two diffs is the trailing context line, which is HEAD's REQ-193 wording.
  Confirmed live: the auto-merged `people.js` imports `fetchPersonMessages`
  (line 79) and wires it at line 573.

- **`builder.css`** — incoming's stat is `98 insertions(+), 1 deletion(-)`;
  the staged delta against HEAD is 1 + 14 + 83 = 98 insertions and the same 1
  deletion (the `.builder-people__suspended {` line reopened to add
  `.builder-people__bounced`). Every incoming line is present, nothing else
  removed. HEAD's rename family survives untouched — the staged diff contains
  no deletions in that region. Confirmed live: `people.js` emits
  `builder-people__bounced` (line 338) and the rename hooks (lines 829–1005).

### Dropped hunk — `package.json` version scalar (BUG-1301 precedence)

Incoming's entire `package.json` diff is one incidental bump
`0.2.86 → 0.2.87`, not REQ-198 content. Its target was already superseded on
this branch by later free-coded bumps that this same resync queue cherry-picked
ahead of it — `git log HEAD -- package.json` shows `3b9733b48a` /
`cc50ea1231 chore: bump version for REQ-197 [FREE-CODED]` and
`1f26886570 chore: bump version for REQ-195 [FREE-CODED]`, leaving HEAD at
`0.2.103`. `version` is a monotone counter: applying incoming would rewind it
by sixteen patch releases and discard those free-coded bumps, which is the data
loss the hard rules forbid — the opposite of what 2g's "incoming wins" is for.
This matches the resolution the same conflict received earlier in this resync
(`resolve-377b581e-13d686aaf0.md`, `-164e51cba7.md`, `-5c012c3758.md`).

## Verification limits

Session role is `stage_resolver`. The three incoming UAT suites
(`test_UAT_FC_REQ-198_delivery_webhook.workers.test.ts`,
`..._email_record.workers.test.ts`, `..._messages_pane.test.ts`) were **not
executed** — workerd/wrangler cannot bind a socket in this role (`listen
EPERM`). They arrived staged with no conflict and were not modified here. The
two files this session edited are `.js` and `.css`, covered by no tsconfig;
verification was `node --check` on `api.js`, marker-count zero on all three,
and the hunk-level diff comparison above.
