---
uid: report-b840167c
id: REPORT-4412
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:00:53.602258+00:00'
updated_at: '2026-09-19T12:00:53.602258+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Situation

The picked commit `6d345f3303` ("Merge branch 'free-REQ-160' into xgd-working",
author Martin Westhead, author date Tue Sep 1 12:56:31 2026 -0700) is ALREADY ON
HEAD under a different sha: `6ee97c4ce3`, identical author / author date /
subject, same 13-file stat. HEAD then refined that work further with
`80c9342ac1` (Merge free-BUG-43) and `6f83befde4` (Workflow
fix_reconciliation_review completed: done).

So on every conflicted file the INCOMING side is the OLDER revision of code HEAD
already carries, not new developer work. Verified per file with
`git diff HEAD 6d345f3303 -- <path>`: in all five cases the incoming-vs-HEAD
delta consists solely of reverting HEAD's later, already-integrated changes.
Nothing on the incoming side is absent from HEAD. Resolution is therefore HEAD
(ours) throughout.

## Files resolved

- `package.json` — UU, config scalar (2g). Kept HEAD `"version": "0.2.40"` over
  incoming `"0.2.34"`. The incoming value is the older free-coded bookkeeping
  bump; HEAD's is higher and was claimed later.
- `apps/control-app/src/ai.ts` — UU, code (2c/3a). HEAD is the superset: it
  drops the `CARETAKER_PURPOSE` argument to `sessionPriming(...)` because
  `host-core.ts` now owns the map/purpose/manual ordering in the role entry
  list. Incoming's `sessionPriming(knowledge, CARETAKER_PURPOSE)` is the
  pre-refactor two-arg call whose callee signature no longer exists.
- `apps/control-app/src/session-delta.ts` — AA, code (2b, HEAD is superset).
  Single hunk in `turnDelta`. HEAD's persist condition
  `stored === null || next.at !== cursor.at || next.seen.length !== cursor.seen.length`
  strictly subsumes incoming's `... || chat === null` (`chat === null` implies
  `storedCursor(chat) === null`), and carries the documented reasoning for the
  widening. HEAD kept.
- `apps/control-app/src/session-knowledge.ts` — AA, code (2b, HEAD is superset:
  394 lines on the landed side vs 371 incoming). Six hunks, all one story: HEAD
  is adapted to the current upstream KM API (`LANDSCAPE_PROVIDER` /
  `MECHANISM_PROVIDER` / `registerKmProviders`, `indexes` / `chunkIndexes`),
  incoming still calls the removed `KnowledgeDocs.open` and passes `source` /
  `chunkSource`. Taking incoming would not compile against the installed
  `./generated/ai-knowledge`.
- `tools/generate/src/cli/ai/host-core.ts` — UU, code (2c/3a). Three hunks, HEAD
  kept in all three. See the BUG-1301 note below for the third.

## Incoming changes preserved

Confirmed per file by reading the full `git diff HEAD 6d345f3303 -- <path>`
output before staging. Every incoming hunk is a revert of HEAD content, so
taking HEAD preserves the incoming commit's intent in its later form rather
than discarding it:

- `ai.ts` — incoming's only substantive edit is re-adding the
  `CARETAKER_PURPOSE` import and the two-arg `sessionPriming` call. The purpose
  text is still declared (in `./roles`, re-exported from `host-core.ts`) and
  still reaches the role — as the `caretaker-purpose` entry in the role's
  priming entry list. Present via a different route.
- `session-delta.ts` — incoming's write condition is a strict subset of HEAD's.
  Present.
- `session-knowledge.ts` — incoming's REQ-160 content (both KBs on the map axis,
  the mechanism carrying this session's manual, priming never touching an index)
  is all present in HEAD's provider-pair form. Only the removed-upstream call
  shape differs.
- `host-core.ts` — incoming's REQ-160 delta wiring (`deps.delta(sessionId)` fed
  into `caretakerReminder(slug, ..., delta)`) is present in HEAD at
  `reminderFor()` (host-core.ts:645-650), registered as the manager's reminder
  provider at host-core.ts:610. Incoming's `priming?: ((box) => Promise<Untyped>)`
  seam is present in HEAD as the richer
  `{ landscape, mechanism, register }` provider triple.

### Hunk dropped under the BUG-1301 precedence exception

- **File**: `tools/generate/src/cli/ai/host-core.ts`, third hunk (in
  `streamPrompt`, at the former line 775).
- **Incoming hunk**: a pre-loop block reading
  `const role = roles.get(key)` / `const before = baselines.get(key)` /
  `const at = await store.counter(slug)` / `const delta = await deps.delta(...)`
  and assigning `role.reminder = caretakerReminder(...)`.
- **HEAD-side commit that removed its target**: `6f83befde4` ("Workflow
  fix_reconciliation_review completed: done"), with `80c9342ac1` (BUG-43)
  restructuring the same function.
- **Why this is a legitimate refactor, not a resolution shortcut**: upstream
  sealed `Role` (frozen), so rewriting `role.reminder` per turn no longer works.
  The reminder became a *provider* — `REMINDER_PROVIDER = 'caretaker.reminder'`,
  registered on the manager's registry and resolved by the session manager at
  the top of every turn. The `roles` map the incoming hunk reads from
  (`roles.get(key)`) no longer exists in HEAD; it was replaced by the provider
  registration. The computation the hunk performed lives verbatim in
  `reminderFor()`, delta included, so no behaviour is lost — only the `roles`
  map it wrote through. Restoring the hunk would reference a deleted map and
  write to a frozen object. This is a documented upstream-API adaptation already
  integrated into HEAD, not a deletion chosen here.

No test function on either side of any conflict was deleted.

## Note for post-merge review

`tests/test_UAT_FC_REQ-160_two_kb_session.workers.test.ts` was added CLEANLY by
the cherry-pick (staged `A`, no conflict, untouched by this resolution). HEAD
carries what appears to be its renamed and substantially expanded twin at
`tests/reconciliation-assistant-two-knowledge-bases.workers.test.ts` (876-line
pairwise diff: 222 insertions, 654 deletions relative to it). Flagging rather
than acting: it is outside this step's conflict set, and 2f forbids deleting a
test as a resolution shortcut. The re-added file contains no references to the
removed APIs (`sessionPriming` two-arg, `KnowledgeDocs`, `chunkSource`,
`runtime.source`, `SITE_CHANGED`, `role.reminder`), so it should not break the
build — but the duplication is worth a decision by check_fc_orphans or the
reconciliation review.
