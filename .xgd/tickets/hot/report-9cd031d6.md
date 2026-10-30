---
uid: report-9cd031d6
id: REPORT-4746
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:48:41.727070+00:00'
updated_at: '2026-09-21T14:48:41.727070+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

Cherry-pick in progress: ab467d6ce3 "feat(store): a ReferenceStore port, with
the filesystem behind it [FREE-CODED]" (REQ-155, authored 2026-09-01).
Three conflicts, all resolved and staged. CHERRY_PICK_HEAD left intact.

## Files resolved

- `package.json` — UU, config file (2g / intent rule "more recent commit wins").
  Single hunk: the `version` field. HEAD (mainline, 0.2.40) is the later state;
  incoming carried the stale 0.2.32 from 2026-09-01. Kept HEAD's `0.2.40`.
  No non-version hunks were present, so nothing from the incoming commit is
  lost here.

- `tests/reconciliation-colour-census-and-retrofit.test.ts` — DU (deleted by us,
  modified by them), 2a + BUG-1301 PRECEDENCE. Kept deleted (`git rm --sparse`).
  See the precedence note below.

- `tests/req93-l1-slot-mounted-behaviors.test.ts` — UU, code file (2c).
  Non-overlapping import-block conflict: HEAD added two fixture imports
  (`mobileOverflow as MobileOverflow`, `throwsOnRender as ThrowsOnRender`),
  incoming contributed nothing in that region. Kept both HEAD imports; both are
  live (used at lines 207, 213, 737). Incoming's own contribution to this file —
  the `fsReferenceBundle` import and the async port call sites — merged cleanly
  outside the marked region and is present in the result.

## Incoming changes preserved

- `tests/req93-l1-slot-mounted-behaviors.test.ts`: verified against
  `git show ab467d6ce3 -- <file>`. The commit's changes to this file are
  `import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'`
  (present, line 62) and the port-threaded call sites
  `await writeL1(fsReferenceBundle(ref), doc)` / `await writeForms(fsReferenceBundle(ref), …)`
  (present, lines 583, 584, 614, 620). Nothing incoming was discarded; the
  resolution only restored HEAD's additive fixture imports.

- `package.json`: the incoming commit's only change to this file was the version
  string, which mainline has since advanced past. Nothing substantive dropped.

- `tests/reconciliation-colour-census-and-retrofit.test.ts` — hunk dropped under
  the BUG-1301 precedence exception:
    - HEAD-side removal: `b8399b2fcf` "fix(uat): retire the superseded
      colour-retrofit UATs and stale wording" (2026-09-10), which deletes this
      file outright.
    - Why that removal is a legitimate refactor, not a resolution shortcut: it
      predates this resync and was integrated into mainline on its own merits,
      driven by report-dde93f42 (uat level, capability-b4ac88fc), which found
      three consistency/exclusivity violations rooted in the ac-level repair at
      1a027575a4. The commit message records the reasoning: this file is the
      pre-REQ-137 original that claimed AC-939…AC-947 a *second* time, in the
      same test shape and with four byte-identical test function names, so an
      AC→test index could not attribute them; its AC-944 test asserted the
      pixel-identity guarantee REQ-137 superseded and passed, reading as
      evidence for a retired guarantee.
      `tests/reconciliation-colour-retrofit-shade-model.test.ts` is a strict
      superset.
    - Why no test coverage is lost: the incoming hunk is purely mechanical —
      it adds the `fsReferenceBundle` import and threads the new port through
      the same call sites. The commit applied that identical adaptation to the
      surviving superset file
      `tests/reconciliation-colour-retrofit-shade-model.test.ts`, which merged
      cleanly in this cherry-pick. No test function present on either side of
      this conflict is left unexercised.

## Net effect

`git diff --cached HEAD` is empty: every change in ab467d6ce3 is already
present in HEAD (`tools/generate/src/store/fs-reference-store.ts` confirmed
present in the HEAD tree). All three conflicts were cases of mainline having
already absorbed the port change and then moved past it. Per STEP 4, this was
staged and left for the finalize step to handle rather than skipped here.
