---
uid: report-f95d998f
id: REPORT-2992
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:15:47.344255+00:00'
updated_at: '2026-08-31T16:15:47.344255+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, intent/bookkeeping ticket (rule 2e),
  out of the sparse-checkout cone (index-only conflict, no working-tree markers).
  Resolved per-fact to the HEAD-side content via `git checkout --ours` +
  `git add --sparse`.

  Incoming (`1eb1dd15`, 2026-08-24 14:42:43 -0700, `xgd(ticket): update bug
  bug-6612c4b7`) records the completion of the free-coding pass: `status:
  free_coding` → `free_coded`, adds `fields.commits` with a single entry
  (`working_sha: 2058a16449a8e783bdd655d22bade58fd6b8d0fc`, both
  `reconcile_sha` and `main_sha` null), adds `fields.version: 0.2.11`, and bumps
  `updated_at`. No body prose changes.

  HEAD (`seed_local_overlay`, ticket `updated_at 2026-08-26T17:36:27`) is the
  same ticket two days later, past that point on the lifecycle at
  `status: bundled`, and its `fields.commits` is a **superset** of the
  incoming's: the identical `2058a164…` entry is present as the first element
  (carrying an extra `working_sha_history: []` key added by later bookkeeping),
  followed by two further entries (`0fe586d1…`, `999579b3…`). `version` has
  advanced 0.2.11 → 0.2.13 and `bundled_in: bundle-78f4e2fe` has been added.

  I diffed the incoming blob directly against the ours blob
  (`git diff 0ca29a5bac 54e03170f8`) to confirm nothing was lost. The only
  differences are that lifecycle frontmatter and the observability section
  already adjudicated in scopes 199/200 (incoming's `## Still outstanding (not
  in this ticket)` versus HEAD's later `## Observability — added here` plus
  `## Deployment`). No `commits` entry and no other field present on the
  incoming side is missing from HEAD.

  Per-fact resolution: `status` — same field, `free_coding → free_coded → … →
  bundled` is one ordered lifecycle and HEAD holds the later value, so HEAD
  wins; `fields.commits` — HEAD is a strict superset containing the incoming's
  sole entry verbatim, so keep the superset; `fields.version` — same field, HEAD's
  0.2.13 is the later and higher value, HEAD wins; `updated_at` — HEAD later,
  HEAD wins; `last_field_updated` — both sides say `status`, no conflict;
  `bundled_in` — HEAD only, preserved; observability section — HEAD is the later
  intent, consistent with scopes 199/200. Nothing was invented, and no fact
  present only on the incoming side was dropped.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — the incoming commit's substantive changes
  are the `status` advance out of `free_coding`, the `commits` entry for
  `2058a16449a8e783bdd655d22bade58fd6b8d0fc`, and `version`. All three are
  present in the resolved file: the `2058a164…` entry verbatim as the first
  element of `fields.commits`, `status` advanced past `free_coded` to `bundled`,
  and `version` advanced past 0.2.11 to 0.2.13. Verified by direct blob diff of
  incoming vs resolved (`git hash-object` =
  `54e03170f8615a3a40cd150fa569cca6d1e49ff9`, the ours-side blob).

This resolution nets to no diff versus HEAD (`git status --porcelain` reports no
tracked entries at all). That is the redundant-commit case, not a discard:
STEP 3's check passes because the incoming commit's key changes are *present or
superseded* in HEAD via a later route, rather than absent. Per STEP 4 the file
was staged and left for `cherry_pick_finalize_resolution` to skip;
`--skip`/`--continue`/`--abort` were not called and `CHERRY_PICK_HEAD`
(`1eb1dd1586d5db0eb5aaa6f904a51b72f3a665d5`) is intact.

No code, UAT, or spec-ticket files were involved in this conflict, so no
BUG-1301 precedence exception was needed.
