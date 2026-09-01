---
uid: report-c57b1ab6
id: REPORT-3187
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:38:43.916056+00:00'
updated_at: '2026-09-01T02:38:43.916056+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `package.json` — UU, config file (2g scalar) — resolved to HEAD's `"version": "0.2.16"`.

  The conflict was a lone `version` scalar: HEAD `0.2.16` vs incoming `0.2.10 -> 0.2.11`.
  2g's default ("scalar conflicts: incoming wins") does not apply here, because the
  incoming scalar is not a competing developer intent — it is a strictly older value of
  a monotonic counter that HEAD already passed through. `677fdffda9`
  ("perf(store): memoise the assembled draft per isolate [FREE-CODED]", 2026-08-24) is an
  ancestor of HEAD and makes the byte-identical `0.2.10 -> 0.2.11` edit (same blob pair
  `ce172f94b8..ff0bd91bcb` as the incoming commit); HEAD then bumped onward via
  `b1d79b4fbf` (0.2.13) to the current `0.2.16`. Writing `0.2.11` would regress the
  version, not honour the developer's intent.

  This also matches the enrichment's stated rule for this file (take the more recent
  commit by timestamp): HEAD's last `package.json` commit is `1213d247dd` (2026-08-28),
  the incoming merge is 2026-08-24. Both sides are `free_coded`, so the both-free_coded
  exception points the same way — HEAD holds the later working-timeline position.

## Incoming changes preserved

Incoming commit `de71981f8a` ("Merge branch 'free-BUG-37' into xgd-working") touches three
files. All three are verified present in HEAD; nothing was discarded, and no hunk was
dropped under the BUG-1301 precedence exception.

- `package.json` — the version-bump intent is present in HEAD's ancestry via
  `677fdffda9` (identical blob transition) and superseded by later bumps to `0.2.16`.
- `tests/test_UAT_FC_BUG-37_preview_assemble_memo.workers.test.ts` — `git diff de71981f8a HEAD`
  reports ZERO diff for this path. All 223 lines of the UAT file are byte-identical in
  HEAD. No test function on either side of this conflict was deleted or modified.
- `tools/generate/src/store/d1r2-store.ts` — applied cleanly (no conflict). `git diff
  de71981f8a HEAD` for this path shows only HEAD-side work layered ON TOP: the
  `isUnsafeName` accepted/refused partition plus its `console.warn` reporting. The
  incoming 68-line per-isolate memoisation is byte-identical in HEAD.

## Net result

The staged diff vs HEAD is empty (`git diff --cached --stat` reports no files changed).
This is the BUG-1109/1122 redundant-commit case, not a discard: `677fdffda9` has a stat
identical to the incoming merge (`package.json | 2 +-`, the UAT test `| 223 +++`,
`d1r2-store.ts | 68 ++-`) and already landed this commit's entire effect through a
different route. STEP 3's guard is satisfied — the incoming commit's key changes are
PRESENT in HEAD, not absent.

Per STEP 4, `--skip` was NOT called; the tree is staged and left for
`cherry_pick_finalize_resolution` to detect the clean staged diff. `CHERRY_PICK_HEAD`
is intact at `de71981f8abab7239a857e161c4f9f2ab76edd37`.
