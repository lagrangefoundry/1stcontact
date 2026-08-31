---
uid: report-55943bc4
id: REPORT-3081
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T21:28:07.045277+00:00'
updated_at: '2026-08-31T21:28:07.045277+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `package.json` — **UU**, scalar conflict on `version` (rule 2g / enrichment "more recent commit by timestamp"). Kept HEAD's `0.2.14`; incoming `de71981f8a` bumped `0.2.10` → `0.2.11` only. HEAD's side (`97f4e4e55c`, 2026-08-24 15:19:40 -0700) is both the higher version and the later commit; incoming is 2026-08-24 14:42:38 -0700. The incoming edit is release bookkeeping already superseded — no code intent lost.

No other conflict classes were present. The incoming commit's other two files
(`tests/test_UAT_FC_BUG-37_preview_assemble_memo.workers.test.ts`,
`tools/generate/src/store/d1r2-store.ts`) merged without conflict.

## Incoming changes preserved

Incoming commit `de71981f8abab7239a857e161c4f9f2ab76edd37`
("Merge branch 'free-BUG-37' into xgd-working") touches three paths. Verified
each against HEAD:

- `tests/test_UAT_FC_BUG-37_preview_assemble_memo.workers.test.ts` — byte-identical
  in HEAD and in the incoming commit (`git diff HEAD <cp-head>` reports no
  difference for this path). All 223 lines of the UAT file are present. No test
  function was deleted or altered.
- `tools/generate/src/store/d1r2-store.ts` — the incoming payload is the BUG-37
  per-isolate assembled-draft memo (`ASSEMBLED` map, `assembledKey`,
  `resetAssembledCache`, the `forget`/`loadDraft` invalidation, and the
  `LoadResult` type import). Every one of those is present in HEAD, landed by
  `677fdffda9 perf(store): memoise the assembled draft per isolate [FREE-CODED]`
  (2026-08-24 14:42:32 -0700) — the same developer work arriving through a
  separate route. Confirmed by `git grep ASSEMBLED HEAD -- <path>`: 7 hits at
  lines 185, 196, 197, 405, 807, 812, 824.
- `package.json` — version bump only, resolved as described above.

The only region where HEAD and the incoming commit differ in `d1r2-store.ts` is
the unsafe-asset-name handling inside the change-application path: HEAD
partitions assets once into `refused`/`accepted` and logs a warning naming the
refused entries, whereas the incoming side filters inline with
`if (isUnsafeName(name)) continue` in each of the two loops. That region is NOT
part of the incoming commit's own diff (`git diff 557fdace5c <cp-head> -- <path>`
does not touch it) — it is a later, independent refinement on HEAD with the same
semantics plus reporting. Keeping HEAD's version therefore discards no incoming
developer code.

No hunks were dropped under the BUG-1301 precedence exception; it did not apply.

## Net result

Because all three incoming payloads already exist in HEAD, the staged tree has
no diff versus HEAD. This is the redundant-commit case (BUG-1109/BUG-1122), not a
discard: STEP 3's check passes affirmatively — the incoming commit's key changes
are demonstrably *present* in HEAD, not merely absent from the resolution. Per
STEP 4, `--skip` was not called; the finalize step will detect the clean staged
diff. `CHERRY_PICK_HEAD` is intact and no cherry-pick state transition was made.
