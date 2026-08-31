---
uid: report-cd190339
id: REPORT-2810
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:39:26.864191+00:00'
updated_at: '2026-08-31T07:39:26.864191+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-395b67e6.md` (REQ-117) — **AA (both added)**, intent/bookkeeping
  ticket. Rule **2e** applied ("one side is a strict superset — incoming only added a field
  the other side never touched: keep the superset"), reinforced by **2b**'s superset clause.

  The full textual diff between the two sides is exactly one added line, in `fields:`:

  ```
  62a63
  >   chat_comment: comment-40779c8d
  ```

  Nothing else differs — frontmatter, `commits` list, `version: 0.1.23`, `status:
  free_and_reconciled`, and every prose section are byte-identical on both sides.

  The AA class is an artifact of the resync, not a genuine divergence. `git log` for this
  path on the incoming commit's ancestry is:

  - `630592b5` (2026-08-23) — the incoming commit, adds `chat_comment`
  - `0d11a014` (2026-08-20) — `xgd(resync): strip .xgd/tickets, .xgd/config.yaml,
    .xgd/permissions.yaml, .xgd/quality.yaml from main snapshot (BUG-904)` — deleted the file
  - `3ce7cdf7` (2026-08-06) — **also HEAD's tip commit for this path**

  So the incoming side descends from HEAD's own version of this file; the resync deleted it
  and the incoming commit re-added it, while HEAD re-added it by a separate route. Incoming
  is strictly later and strictly a superset, so there is no per-fact timeline judgment to
  make — no field is set differently on the two sides.

  Resolution: `git checkout --theirs` then `git add --sparse` (the path is outside the
  sparse-checkout cone — `!/.xgd/tickets/**`, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-395b67e6.md` — the resolved working-tree file is **byte-identical
  to the incoming side** (`git show :3:` vs the working tree diffs empty), so every change in
  `git show 630592b5 -- <file>` is present by construction, including the sole substantive
  one, `fields.chat_comment: comment-40779c8d`.

  Confirmed staged with a real net diff vs HEAD: index blob `58c7fd3a` ≠ HEAD blob
  `1cccfb3e`. This is not a no-op resolution.

No hunks were dropped, so the BUG-1301 precedence exception does not apply here. No code,
test, or UAT files were involved in this conflict — the incoming commit touches exactly one
file (`390 insertions(+)`, the re-add of this ticket).

## Post-merge review flag

The auto-enriched metadata classified both sides' intent as unknown and asked that this file
be flagged for post-merge review. Flagging it as requested, though the evidence above makes
the resolution unambiguous: the sides differ by a single added field and the incoming side
descends from HEAD's version, so no content from either side was discarded.
