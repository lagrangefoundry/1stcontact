---
uid: report-0380ec7d
id: REPORT-4682
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T09:46:46.109010+00:00'
updated_at: '2026-09-21T09:46:46.109010+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/comment-c74424ff.md` — intent/bookkeeping ticket (comment on chat CHAT-23), outside the sparse-checkout cone (STEP 4 / DOC-986 §2), so the conflict existed only in the index. Incoming commit `cb8d3108cda87c1190706ce528ea9aa81280b15a`. Resolved with `git checkout --ours` + `git add --sparse`.

  Rule applied: §2e "one side a strict superset — keep the superset". Established by set-differencing the two index stages (`git show :2:` vs `git show :3:`) rather than reading the diff: the incoming side (555 lines) contributes exactly ONE line absent from HEAD (900 lines) — its own older `updated_at: '2026-08-31T23:58:12.255894+00:00'`, against HEAD's `'2026-09-01T18:25:38.361760+00:00'`. Every content line of the incoming version appears verbatim in HEAD, which additionally carries the later exchange in this design chat (membership rows vs. `platform_admin` flag, the `0004_identity.sql` schema, the parked platform super-chat design, DOC-40 + REQ-167-170 being filed, and the "Identity - one of four landed" status).

  No per-fact timeline tiebreak was required: the sides state no fact differently apart from `updated_at`, and on that field the superset side is also the later one.

## Incoming changes preserved

- `.xgd/tickets/hot/comment-c74424ff.md`: all incoming content is present in the resolved file. The single incoming-unique line is the stale `updated_at` scalar, superseded by HEAD's later value for the same field. Nothing was dropped under the BUG-1301 precedence exception; no code files, no test files, and no UAT functions were involved.

## Queue-level observation (three consecutive attempts, same file)

Attempts 177, 178 and 179 have each conflicted on this one comment ticket with a successively later but still-stale snapshot:

| attempt | incoming commit | incoming `updated_at` | lines | outcome |
|---|---|---|---|---|
| 177 | `c5153f1079` | 2026-08-31T23:53:18 | 406 | strict subset of HEAD -> ours, empty staged diff |
| 178 | `f6ddddb4ca` | 2026-08-31T23:55:44 | 549 | strict subset of HEAD -> ours, empty staged diff |
| 179 | `cb8d3108cd` | 2026-08-31T23:58:12 | 555 | strict subset of HEAD -> ours, empty staged diff |

HEAD has not moved across the three (`1ae72a2f71`), consistent with finalize correctly skipping each empty commit. Every one of these is a point-in-time snapshot of the same growing chat transcript, all of them already contained in the version HEAD holds (`2026-09-01T18:25:38`). This is queue-level redundancy, not a resolution problem - each individual resolution is correct and lossless. Flagging it in case the queue contains a further run of these snapshots, which will keep costing one resolver invocation apiece to reach the same no-op.

Result: no conflict-class entries remain in `git status --porcelain`; `CHERRY_PICK_HEAD` (`cb8d3108cda87c1190706ce528ea9aa81280b15a`) is intact and untouched. The staged tree is byte-identical to HEAD (`git diff --cached` empty); per STEP 4 no `--skip` was issued - the finalize step should detect the empty staged diff and skip the commit.
