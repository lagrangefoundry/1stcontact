---
uid: report-e27fb879
id: REPORT-4344
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T07:51:08.443664+00:00'
updated_at: '2026-09-18T07:51:08.443664+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` (BUNDLE-20) — **UU**, class **2e** (intent/bookkeeping ticket, `type: bundle`). Resolved per-fact toward the **HEAD side**.

Single conflict hunk, four adjacent frontmatter lifecycle fields; no `fields:` block, no `commits`/`orphan_commits`, no body text was inside the conflict.

| fact | shared base (`reconciling`) | HEAD side — kept | incoming `44f12ddc80` — dropped |
|---|---|---|---|
| `status` | `reconciling` | `free_and_reconciled` | `ready_to_reconcile` |
| `completed_at` | `null` | `'2026-08-31T14:22:24.820529+00:00'` | `null` |
| `last_field_updated` | `status` | `result` | `status` |
| `updated_at` | 2026-08-24T02:10:52 | `'2026-08-31T14:23:04.453705+00:00'` | `'2026-08-25T23:30:45.696844+00:00'` |

**Rule applied.** The auto-enrichment reported identical subjects on both sides (`xgd(ticket): update bundle bundle-b3b7c399`) and therefore *"Intent unknown on one or both sides. Take the more recent commit by timestamp and flag this file for post-merge review."* Both sides diverge from the same base value `reconciling`, and both changed the SAME fact (`status`) differently — so this is 2e's genuine-conflict branch, decided by timeline position, not a both-apply or superset case:

- HEAD side: `a0b52c93a6` / `8e07e6015d`, **2026-08-31 07:22–07:23 -0700**
- Incoming side: `44f12ddc80`, **2026-08-25 16:30:45 -0700**

HEAD is later by six days on every conflicting fact, so HEAD wins each of them. The dropped value is also the lifecycle *predecessor* of the one kept: `ready_to_reconcile` precedes `free_and_reconciled`. Taking the incoming side would have regressed a completed bundle back to not-yet-started and nulled a real `completed_at`.

No fields were invented, and `fields.intent_uid` / `fields.story_uid` / `fields.capability_uid` were not touched.

**⚠️ Flagged for post-merge review**, as the enrichment rule directs — the tie was broken on commit timestamp rather than on a declared operation narrative, because neither side's commit message states its intent.

## Incoming changes preserved

No code or implementation files were in this conflict, so STEP 3's discard guard has no code file to check. For completeness, the incoming commit's full diff to this file is two lines:

```
-updated_at: '2026-08-24T02:10:52.543733+00:00'
+updated_at: '2026-08-25T23:30:45.696844+00:00'
-status: reconciling
+status: ready_to_reconcile
```

Its sole substantive fact — `status: ready_to_reconcile` — is deliberately **not** carried into the resolution, under 2e's timeline rule above. Reported transparently rather than glossed: HEAD's recorded transition (`a0b52c93a6`) went `reconciling → free_and_reconciled` directly, so HEAD never literally passed through the `ready_to_reconcile` string. The incoming value is superseded, not merely duplicated by another route.

This is not a STEP 3 @fail. That guard covers code/implementation files whose developer-authored changes would be overwritten; this is bookkeeping lifecycle state on a bundle ticket, where 2e explicitly prescribes per-fact timeline resolution and one side's value necessarily loses. No BUG-1301 precedence exception was invoked, and no test function was deleted.

## Staging state

`git status --porcelain` is empty: no conflict-class lines remain, `git diff --name-only --diff-filter=U` is empty, and the staged tree is byte-identical to HEAD (`git diff --cached HEAD` empty) — this cherry-pick nets to no change, the expected shape when the ticket's lifecycle already advanced past the incoming snapshot on this branch. Per STEP 4 this is staged and exited `@done`; `--skip` was **not** called and the cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `44f12ddc80`) is left intact for `cherry_pick_finalize_resolution`.
