---
uid: report-9e548c4e
id: REPORT-2694
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:23:08.537879+00:00'
updated_at: '2026-08-31T05:23:08.537879+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/chat-2032f162.md` — class **AA** (both added), bookkeeping/chat ticket outside the sparse-checkout cone.
  - Rule applied: **2b (both added) — "one side is strictly a superset: keep the superset (incoming wins if incoming is the larger version)."**
  - Ours (HEAD, `a63cdc2f20`, 2026-08-08 11:17:42 -0700) had `fields: {}`.
  - Theirs (incoming free_coded, `31268fa48b`, 2026-08-23 12:39:56 -0700) is identical except it populates the field map:
    ```
    -fields: {}
    +fields:
    +  chat_comment: comment-f8e7bd0f
    ```
  - Incoming is a strict superset of ours — every fact on the HEAD side (uid, id, type, title, created_by, created_at, updated_at, completed_at, last_field_updated, status, body) is present unchanged in the incoming version, which only adds `fields.chat_comment`. No HEAD-side content was discarded.
  - The auto-enrichment metadata classified intent as unknown on one or both sides and prescribed "take the more recent commit by timestamp." That rule and the 2b superset rule agree here: incoming (2026-08-23) is both the later commit and the larger version. Flagging for post-merge review per the enrichment rule, though the resolution is unambiguous — the two sides differ in exactly one added field, with no competing edit to any shared fact.
  - Resolved via `git checkout --theirs`, staged with `git add --sparse` (path is outside the sparse cone, per DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/chat-2032f162.md`: **confirmed present.** Verified two ways:
  - `git diff --cached HEAD -- <path>` shows exactly the incoming commit's single hunk (`fields: {}` → `fields:` / `chat_comment: comment-f8e7bd0f`).
  - `git diff 31268fa48b9d0aa20189de2b635eae17097abb93 --cached -- <path>` returns **empty output** — the staged blob is byte-identical to the incoming commit's version of this file (blob `6946b7d58b`), including the missing trailing newline.

No hunks were dropped. The BUG-1301 precedence exception was not invoked and no test functions were involved.

## Notes

- The 16 untracked `comment-*.md` / `report-*.md` files under `.xgd/tickets/hot/` were present before this step, are unrelated to the conflict, and were left untouched.
- No cherry-pick state transitions were performed: `CHERRY_PICK_HEAD` (`31268fa48b9d0aa20189de2b635eae17097abb93`) remains in place for `cherry_pick_finalize_resolution`. Only `checkout --theirs` and `add --sparse` on the single conflicted path were issued.
- Final `git status --porcelain` shows `M  .xgd/tickets/hot/chat-2032f162.md` with no remaining conflict-class (UU/AA/DU/UD/AU/UA) entries.
