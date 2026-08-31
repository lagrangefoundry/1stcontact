---
uid: report-e6ee1c6f
id: REPORT-3065
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T20:45:37.641093+00:00'
updated_at: '2026-08-31T20:45:37.641093+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` — **UU**, class 2e (intent/bookkeeping ticket:
  `request-*`). Rule applied: **"one side is a strict superset of the other — keep the
  superset."** HEAD is the superset; resolved with `git checkout --ours`, then
  `git add --sparse`.

  Per-fact breakdown of the two sides:

  | fact | HEAD (`ce11ecb0`, seed_local_overlay, Aug 30) | incoming (`7c91ff78`, Aug 23) | kept |
  |---|---|---|---|
  | `fields.commits[].working_sha_history` | `055378794…` merged in, orphan entry dropped | **identical** change | same on both sides |
  | `status` | `bundled` | `ready_to_reconcile` | HEAD (later lifecycle state) |
  | `last_field_updated` | `status` | `commits` | HEAD (matches its later op) |
  | `updated_at` | `2026-08-24T02:10:41` | `2026-08-24T01:14:11` | HEAD (later) |
  | `fields.bundled_in` | `bundle-b3b7c399` | absent | HEAD (HEAD-only addition) |
  | `fields.chat_comment` | `comment-a4605dbc` | `comment-a4605dbc` | same on both sides |

  No fact was changed differently-but-substantively on the two sides, so the
  `xgd working-timeline` tiebreak was not needed. The only fields where the sides
  differ are bookkeeping values on which the incoming side is strictly *older*;
  taking incoming would have regressed REQ-148 out of `bundled` and dropped its
  `bundled_in` pointer. Nothing was invented that is not on one of the two sides.

## Incoming changes preserved

Yes — fully, and by identity rather than by re-application.

The incoming commit `7c91ff78` is a pure data fix (BUG-1265): merge the orphaned
`working_sha 055378794f49f1dc39b20fdcf54aa7fa0b1190e3` (the free-REQ-148 merge commit,
flattened away by a later resync rebase) into the surviving entry's
`working_sha_history`, and delete the now-redundant standalone `commits[]` entry.
Its own commit message states "no code change."

The HEAD-side commit `ce11ecb0c4d298ea9afcd663e3beb6660d9ad819`
(`xgd(ticket): seed_local_overlay request request-7ae3c2cc`) contains the **byte-identical
hunk**:

```
     working_sha_history:
     - ade64575a4706348dc54df0ed2d2b3f384fe3eb2
+    - 055378794f49f1dc39b20fdcf54aa7fa0b1190e3
     - a6e92ca2603cba91fb5b905c826566ac208737ac
-  - working_sha: 055378794f49f1dc39b20fdcf54aa7fa0b1190e3
-    reconcile_sha: null
-    main_sha: null
-    working_sha_history: []
```

`git diff HEAD 7c91ff78 -- <file>` shows this hunk **absent** from the delta — i.e. the
data fix is already in HEAD. The only lines that delta still reports are the four
bookkeeping lines tabulated above. The developer's intent for this commit therefore
survives the resolution intact.

### Note: resolution nets to no diff vs HEAD

The resolved file is identical to HEAD, so `git status --porcelain` reports nothing for
this path and the staged diff is empty. This is the redundant-commit case
(BUG-1109/BUG-1122): the post-watermark sync already landed this commit's effect through
`seed_local_overlay`. It is **not** a STEP 3 discard — STEP 3's discriminator is whether
the incoming commit's key change is *present in HEAD* (redundant) or *simply absent*
(discarded), and here it is demonstrably present, as shown above. Per STEP 4 this exits
`@done` without calling `--skip`; the finalize step detects the clean staged diff and
skips the commit.

No BUG-1301 precedence exception was invoked — no hunk was dropped as obsolete, and no
code or UAT test files were involved in this conflict.

### Post-resolution state

- `git diff --name-only --diff-filter=U` → empty (no unmerged paths).
- `CHERRY_PICK_HEAD` still present; no `--continue`/`--skip`/`--quit`/`--abort`/`reset`
  was run.
