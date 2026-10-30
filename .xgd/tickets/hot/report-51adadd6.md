---
uid: report-51adadd6
id: REPORT-5807
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T16:00:55.676538+00:00'
updated_at: '2026-10-02T16:00:55.676538+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

Anchor `report-377b581e`, apply target `ec118d67626fd31cfce67ca88dc9908ecdde70ed`.
Picked commit `cc0990b74a` "feat(l1): one element, more than one entrance behaviour [FREE-CODED]" (REQ-326), HEAD `944d6892ef`.
Staged only; no commit, no `--continue`. `CHERRY_PICK_HEAD` intact.

## Files resolved

- `tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts` — code (UAT test), one region, **keep BOTH**.
  Both sides appended an entry to the same object literal after `actionOrLink`:
  ours (REQ-327, already on HEAD) added `zoomOrLink`; incoming (REQ-326) added
  `onePropertyPerEntranceBehaviour` and `entranceBehaviourMovesSomething`.
  Independent additive entries, so both are kept, ours first.
  The resolution is the developer's own: merge `cc5b28afe0` "Merge branch
  'free-REQ-326' into xgd-working" (4.5 min after the pick) lists this file as its
  one conflict, and its first parent's blob for this path is `569eb8d7b2` — byte-identical
  to our stage 2. So its blob `dfb42c0e01` was taken verbatim
  (`git checkout cc5b28afe0 -- <path>`).

The other eight paths of the pick applied cleanly and were already staged.

The enrichment rule ("intent unknown, take the more recent commit by timestamp")
was not followed: it would have kept one side only and dropped the other's UAT entries.

## Incoming changes preserved

- `git diff <ours blob> <resolved>` is exactly the 21 lines incoming added over base
  (`git diff :1: :3:`): both REQ-326 entries and their comment, verbatim. Nothing of
  ours was removed; no UAT function deleted on either side.
- `git diff --cached --stat HEAD` = 9 files, +825/-36, equal to merge `cc5b28afe0`'s
  own diffstat against its first parent.
- `git diff --cached --stat cc5b28afe0 -- <all 9 pick paths>` is empty: every path of
  the pick is byte-identical to the developer's merged state.
- No conflict markers remain, `git ls-files -u` is empty.
- `npx vitest run` on the BUG-48 suite and the new `test_UAT_FC_REQ-326_composed_entrance`
  suite: 2 files, 17 tests, all pass.

No BUG-1301 precedence exception was used.
