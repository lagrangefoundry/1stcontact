---
uid: report-dbdc56f7
id: REPORT-3440
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T01:02:01.036326+00:00'
updated_at: '2026-09-04T01:02:01.036326+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping ticket
  (rule 2e). Index-only conflict: the path is outside the sparse-checkout cone
  (DOC-986 §2/§4.1), so there were no working-tree markers; resolved via
  `git checkout --ours` + `git add --sparse`.

  Incoming commit: `56209e42` "xgd(ticket): update request request-6893f6ea"
  (2026-08-31 18:16:45 -0700). HEAD side: `0ee399ee` "xgd(ticket):
  seed_local_overlay request request-6893f6ea" (2026-09-02 10:50:05 -0700).

  Per-fact resolution (rule 2e), which lands on ours for every fact:

  - `updated_at` — both sides bumped it. Ours `2026-09-02T17:48:27Z` is later
    than theirs `2026-09-01T01:16:45Z`; took ours.
  - `last_field_updated` — ours `status`, theirs `body`. Same field, later
    side wins; took ours.
  - `status` — only ours changed it (`free_coding` → `bundled`); theirs left
    the base value. Non-overlapping, kept ours. `bundled` is also the correct
    reconcile-side state for this ticket.
  - `fields.commits`, `fields.version: 0.2.27`, `fields.bundled_in:
    bundle-203b1dc2` — added by ours only, absent on both base and theirs.
    Non-overlapping addition, kept.
  - Body prose — ours is a strict superset of theirs' delta (see below).

## Incoming changes preserved

The incoming commit's entire content delta against the merge base
(`b6655afd`) was a single appended empty list item at the end of "## Open
questions" (`\n\n-`, no trailing newline), plus the two frontmatter
bookkeeping fields handled per-fact above.

That empty trailing bullet **is present** in the resolved (ours) version —
ours ends with `- ` followed by `-`. Nothing from the incoming diff is
missing.

Ours is additionally the demonstrably *later* revision of the same body
text, not a competing one. It rewrites the size analysis the incoming side
carries and names it as superseded:

- incoming: "bundle is now **1032 KiB gzip**" / "the Worker lands near
  **1.9 MiB against the 10 MiB paid ceiling**" / "`kb/system/` now holds
  **37 documents, 640 KB**"
- ours: "**1052 KiB gzip with `KB = null`**" / "**2.7 MiB gzip against the
  10 MiB paid ceiling**, or 3.6× headroom" / "only **4 carry
  `doc_kind: system_kb`**", and explicitly: "An earlier revision of this
  section projected **1.9 MiB**; that was optimistic by about 40%".

Ours also adds a whole section absent from the incoming side (the
`NODE_USE_ENV_PROXY` / undici proxy blocker under Q1). Taking the incoming
body would have reverted those corrections.

No code/implementation files were involved in this conflict, so no BUG-1301
precedence exception was invoked and no test function was touched.

## Note for the finalize step

The resolution nets to **no staged diff vs HEAD** (`git diff --cached HEAD`
is empty). This is the redundant-commit case of BUG-1109/BUG-1122, not a
discard: STEP 3's check passes because the incoming commit's key change is
already present in HEAD via the later `seed_local_overlay` revision. Per
STEP 4, no `--skip` was called here; `cherry_pick_finalize_resolution` will
detect the clean staged diff and skip the commit. `CHERRY_PICK_HEAD`
(`56209e42`) is left intact.
