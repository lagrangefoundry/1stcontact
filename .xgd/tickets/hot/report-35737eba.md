---
uid: report-35737eba
id: REPORT-2956
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:07:20.739147+00:00'
updated_at: '2026-08-31T15:07:20.739147+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-34dd9049.md` — class **AA** (both added), intent/bookkeeping ticket → rule **2e** (request-* ticket, per-fact resolution with the later-positioned intent winning). Path is outside the sparse-checkout cone (`!/.xgd/tickets/**`, DOC-986 §2/§4.1), so it was staged with `git add --sparse`.

### Per-fact resolution

The two sides differ in exactly three frontmatter lines; the entire body is byte-identical.

| Fact | Ours (HEAD, `274c14da`, 2026-08-30T22:06:21-07:00) | Theirs (incoming `3e9239d6`, 2026-08-23T12:56:28-07:00) | Kept |
|---|---|---|---|
| `updated_at` | `2026-08-24T02:10:41.681560+00:00` | `2026-08-22T21:54:23.360186+00:00` | ours (later) |
| `status` | `bundled` | `ready_to_reconcile` | ours (later; forward progression) |
| `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* | ours (superset) |
| `fields.chat_comment` | `comment-c6092b70` | `comment-c6092b70` | both — unchanged context |

Ours is a strict superset: it contains everything the incoming side has, plus two
later facts. Taking the incoming side would have regressed `status` from `bundled`
back to `ready_to_reconcile` and dropped `bundled_in: bundle-b3b7c399`, breaking the
current bundle's bookkeeping. The enrichment rule for this file ("take the more
recent commit by timestamp") points the same way: ours `274c14da` (08-30) is more
recent than incoming `3e9239d6` (08-23).

No field was invented; no `intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

The incoming commit shows as a 225-line whole-file addition only because
`0d11a014` ("xgd(resync): strip .xgd/tickets ... from main snapshot", BUG-904)
had removed the file from that branch's snapshot. Its real net change is a single
field, obtained by diffing it against the HEAD-side ancestor holding the identical
`updated_at` (`b5838695`, 2026-08-22T14:54:23-07:00 == `updated_at`
2026-08-22T21:54:23 UTC):

```
@@ -27,6 +27,7 @@ fields:
     main_sha: null
   version: 0.2.2
+  chat_comment: comment-c6092b70
 ---
```

**That change is present in the resolution.** `chat_comment: comment-c6092b70` is on
line 30 of both the staged blob and `HEAD`, and it appears as unchanged *context*
(not a `-` line) in the ours-vs-theirs diff — i.e. both sides carry it. The incoming
commit's effect had already landed on the HEAD side through a different route before
this cherry-pick was attempted.

Consequently the staged tree nets to **no diff vs HEAD** (`git diff --cached HEAD` is
empty, `git ls-files -u` is empty). Per STEP 4 this is the redundant-commit case
(BUG-1109 / BUG-1122), not a discard: STEP 3's guard distinguishes them by asking
whether the incoming commit's key change is *present* in HEAD (redundant) or simply
*absent* (discarded) — here it is demonstrably present. `git cherry-pick --skip` was
NOT called; `CHERRY_PICK_HEAD` is left intact for
`cherry_pick_finalize_resolution` to detect the empty staged diff and skip the
commit itself.

No code/implementation files, UAT test files, or spec tickets were involved, so the
BUG-1301 precedence exception was not invoked and no hunk was dropped.
