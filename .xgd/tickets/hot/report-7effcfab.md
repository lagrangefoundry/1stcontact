---
uid: report-7effcfab
id: REPORT-4617
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T04:16:31.358956+00:00'
updated_at: '2026-09-21T04:16:31.358956+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/doc-edba99c9.md` (DOC-35) — class **AA** (both added; index-only
  conflict, path outside the sparse-checkout cone per DOC-986 §2/§4.1, so no
  working-tree markers). Resolved via `git checkout --ours` + `git add --sparse`.

  Rules applied — §2b (AA) plus the per-fact timeline rule of §2e. The conflict is
  confined to three frontmatter lines; the 489-line body is byte-identical on both
  sides. Both sides touch the *same three facts*, so this is a genuine per-fact
  intent conflict, decided by position on the timeline:

  | fact | incoming (2026-08-31) | ours/HEAD (2026-09-11) | taken |
  |---|---|---|---|
  | `updated_at` | `2026-08-31T19:43:25` | `2026-09-11T09:33:34` | ours (later) |
  | `last_field_updated` | `system_kb` | `doc_kind` | ours (later) |
  | `fields.doc_kind` | `architecture` | `system_kb` | ours (later) |

  The enrichment metadata flagged intent as unknown on both sides and prescribed
  "take the more recent commit by timestamp" — which is what was done. The ledger
  makes the picture unambiguous beyond the timestamp, though: the incoming commit
  `23ac1e1a5c` ("field: retire system_kb boolean; membership moves to doc_kind
  (DOC-39 3.3)") has an **identical-message, identical-result twin already in
  HEAD's ancestry** — `4399936414`, same date, producing the *exact* blob
  `aed617700c` that the cherry-pick wanted to introduce. HEAD then superseded that
  state in `75b8755bf7` (2026-09-11), moving `doc_kind` from `architecture` to
  `system_kb`. Taking the incoming side would have rewound HEAD eleven days and
  reverted a later, deliberate field change.

  No structural/content split was available to compose (§2d/§2e "apply BOTH"): both
  sides write the same three fields, and `4399936414` already applied the incoming
  side's operation in full.

## Incoming changes preserved

Verified by diffing the incoming blob against the staged resolution
(`git diff aed617700c 7769c2ba9e`):

- **Body**: zero delta. All 489 lines of DOC-35 content from the incoming side are
  present verbatim.
- **The incoming commit's substantive edit is preserved.** Its stated purpose was
  retiring the `fields.system_kb: true` boolean (present at creation in
  `09ddfce955`, removed by the commit). The staged resolution has no `system_kb`
  key under `fields` — `grep '^  system_kb:'` returns nothing. The retirement
  survives; only the *later* values of the three superseded facts differ.
- Total delta from incoming to staged: 3 frontmatter lines, each one HEAD's
  strictly-later rewrite of a fact the incoming commit last wrote. No developer
  content was discarded.

No hunks were dropped under the BUG-1301 precedence exception; no UAT test files
were involved; no code/implementation files were in this conflict.

## Staging state

`git ls-files -u` is empty (no unmerged index entries); `git status --porcelain`
is empty. The staged blob equals HEAD's blob (`7769c2ba9e`), so this cherry-pick
carries no net change — expected, since `4399936414` already landed the same
effect through a different path. Per STEP 4, `--skip` was **not** invoked;
`CHERRY_PICK_HEAD` (`23ac1e1a5c`) is intact for the finalize step.
