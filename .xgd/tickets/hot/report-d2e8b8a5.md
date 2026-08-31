---
uid: report-d2e8b8a5
id: REPORT-2952
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T14:58:58.426441+00:00'
updated_at: '2026-08-31T14:58:58.426441+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` — **AA** (both added), intent/bookkeeping ticket
  (STEP 2 rule **2e**, with **2b**'s superset test). Resolved to the HEAD (ours) side,
  staged with `git add --sparse` (path is outside the sparse-checkout cone on this
  reconcile branch, DOC-986 §2/§4.1).

  Only the frontmatter differs; the markdown body is byte-identical on both sides.
  Per-fact resolution:

  | Fact | Ours (HEAD) | Theirs (incoming `fb1d4d6`) | Kept | Why |
  |---|---|---|---|---|
  | `status` / `updated_at` | `bundled`, `2026-08-24T02:10:41Z` | `ready_to_reconcile`, `2026-08-17T20:06:08Z` | ours | Same fact, later-positioned side; `bundled` is downstream of `ready_to_reconcile` |
  | `fields.bundled_in` | `bundle-b3b7c399` | absent | ours | HEAD-only addition; incoming never touched this field |
  | `fields.chat_comment` | `comment-8536a49b` | `comment-8536a49b` | both agree | No conflict |
  | `fields.commits` | one entry (`96118c32`) with `7ebc721b` folded into `working_sha_history` | two entries (`96118c32`, plus `7ebc721b` standalone) | ours | Same fact recorded differently; ours is the later bundling operation's own record. **No SHA is dropped** — all four (`b71a8641`, `7ebc721b`, `761b7fbd`, `96118c32`) appear on the ours side |

  Timeline evidence (both directions agree, so no `xgd working-timeline` tiebreak was
  needed): incoming commit `fb1d4d6` is dated 2026-08-23; the HEAD-side tip for this
  file, `209bea11` ("seed_local_overlay request request-18a48d63"), is dated 2026-08-30.
  `209bea11`'s diff is *exactly* the `ready_to_reconcile` → `bundled` transition shown in
  the table above — i.e. HEAD already consumed the incoming state and advanced past it.

## Incoming changes preserved

No code/implementation files were in conflict; the single conflicted path is a
bookkeeping ticket, so 2c's authoritative-incoming rule does not apply. The incoming
commit `fb1d4d6` is a pure add of this one file (268 insertions, no other paths).

Every fact the incoming side carried is present in the resolved file:

- Full ticket body (§1–§14, "What was built", acceptance criteria) — byte-identical to
  the incoming version.
- `fields.chat_comment: comment-8536a49b` — present.
- All four working SHAs including `7ebc721b83ab6202fdec600cd0493b69964bac39` — present
  (as a `working_sha_history` entry rather than a standalone `commits` entry, which is
  the ours-side bundling operation's later record of the same fact).
- Incoming's `status: ready_to_reconcile` / `updated_at: 2026-08-17` are superseded, not
  discarded — HEAD's `bundled` / `2026-08-24` is the later state of the same lifecycle
  field.

**Net staged diff vs HEAD is empty.** This is the redundant-commit case described in
STEP 4 (BUG-1109/BUG-1122), not a discard: STEP 3's discriminator is satisfied because
the incoming commit's content is *present* in HEAD via the earlier-integrated
`209bea11` seed_local_overlay, rather than simply absent. `--skip` was not called;
`CHERRY_PICK_HEAD` (`fb1d4d621e89fd00a44a8a73e114b2bf7de35bb2`) is left intact for
`cherry_pick_finalize_resolution`.

No BUG-1301 precedence exception was invoked; no test functions were involved.
