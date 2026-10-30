---
uid: report-91a69dda
id: REPORT-4680
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T09:44:34.287646+00:00'
updated_at: '2026-09-21T09:44:34.287646+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/comment-c74424ff.md` — intent/bookkeeping ticket (comment ticket on chat CHAT-23), outside the sparse-checkout cone (STEP 4 / DOC-986 §2). Two conflict hunks: the `updated_at` frontmatter scalar and a ~495-line body region. Resolved with `git checkout --ours` + `git add --sparse`.

  Rule applied: §2e "one side a strict superset — keep the superset". Verified mechanically by diffing the two index stages (`git show :2:` vs `git show :3:`): the incoming side (`c5153f1079`, 406 lines) contributes exactly ONE line not present in HEAD (900 lines) — its own older `updated_at: '2026-08-31T23:53:18.074383+00:00'`. Every content line of the incoming version is already present verbatim in HEAD. HEAD additionally carries the whole later exchange (membership-row vs. platform_admin flag, the `0004_identity.sql` schema, the parked platform super-chat design, DOC-40 + REQ-167–170 being filed, and the "Identity — one of four landed" status), and the newer `updated_at: '2026-09-01T18:25:38.361760+00:00'`. No per-fact timeline tiebreak was needed: there is no fact the two sides state differently apart from the timestamp, where the superset side is also the later one.

## Incoming changes preserved

- `.xgd/tickets/hot/comment-c74424ff.md`: all incoming content is present in the resolved file. Confirmed by set-difference over the two index stages rather than by eyeballing the diff — the only incoming-unique line is the stale `updated_at` scalar, which is superseded by HEAD's later value for the same field. Nothing was discarded under the BUG-1301 precedence exception; no code files, no test files, and no UAT functions were involved in this conflict.

Result: no conflict-class entries remain in `git status --porcelain`; `CHERRY_PICK_HEAD` (`c5153f1079de338720f55ffcf1577607b36b5db2`) is intact and untouched. The staged tree is byte-identical to HEAD (`git diff --cached` empty), because the incoming commit is a stale snapshot of a comment HEAD has already moved past — per STEP 4, no `--skip` was issued; the finalize step should detect the empty staged diff and skip the commit.
