---
uid: report-ffccca71
id: REPORT-5158
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T22:19:37.138062+00:00'
updated_at: '2026-09-26T22:19:37.138062+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-4fcbd354.md` (REQ-151, "Site locale identity, and rendered lang/dir") — **AA** (both added), intent/bookkeeping ticket (`request-*`), rule **2e**. Resolved **ours (HEAD)** on every conflicting fact.

  Outside the sparse-checkout cone (`.xgd/tickets/` on a resync branch, DOC-986 §2/§4.1) but materialized on disk with real markers; resolved with `git checkout --ours --` + `git add --sparse --`.

  The two sides differ **only** in frontmatter lifecycle fields — a blob-to-blob diff of stage 2 (`ad08332`) vs stage 3 (`0ce1e64`) shows no body change at all, so no prose or acceptance-criteria content was dropped by either choice:

  | fact | ours (HEAD) | theirs (`61d15c3fc6`) | taken | why |
  |---|---|---|---|---|
  | `updated_at` | `2026-08-31T14:22:31` | `2026-08-22T21:55:22` | ours | later-positioned intent |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | ours | downstream lifecycle state |
  | `completed_at` | `2026-08-31T14:22:31` | `null` | ours | set, consistent with the later status |
  | `fields.bundled_in` | `bundle-b3b7c399` | *absent* | ours | strict superset — additive fact |

  Per 2e, the same-fact conflicts go to the later-positioned intent, which is HEAD on all four. Incoming-wins here would have regressed the status lifecycle backwards and silently dropped `bundled_in`, orphaning the ticket from `bundle-b3b7c399`.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a bookkeeping ticket, so there are no developer code hunks at stake and the BUG-1301 precedence exception was not invoked.

The incoming commit `61d15c3fc6` is a `new file mode` creation of this ticket (167 insertions) carrying the `ready_to_reconcile` snapshot as of 2026-08-22. Its **entire body is already present verbatim in HEAD** — verified by diffing the two conflict-stage blobs directly, which yields only the four frontmatter lines tabulated above. The one thing incoming asserts that HEAD does not is an *earlier* lifecycle position, which is precisely what must not be carried forward.

Net effect: the staged tree is byte-identical to HEAD (`git diff --cached --stat HEAD` is empty), because HEAD already holds this ticket at a strictly more advanced state than the commit being picked. Left for the finalize step to detect and skip; no `--continue`/`--skip`/`--quit`/`--abort` was issued, and `CHERRY_PICK_HEAD` is still present at `61d15c3fc6ae0c9bc1e2e2ecfe6dd410863e99f8`.
