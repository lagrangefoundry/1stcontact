---
uid: report-be3f2a62
id: REPORT-2949
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T14:52:22.457302+00:00'
updated_at: '2026-08-31T14:52:22.457302+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU**, intent/bookkeeping ticket (rule 2e).
  Index-only conflict: `core.sparseCheckout=true` and `.xgd/tickets/` is outside the
  cone (DOC-986 §2/§4.1), so no markers were written to the working tree.
  Resolved with `git checkout --ours` + `git add --sparse`.

  Incoming is `a74ac039` (_xgd(ticket): update request request-554ac441_,
  2026-08-22 20:24:39 -0700). Its merge base is `0dc6fa73` — the result of the
  previous pick in this bundle (`7782255e`, scope `.../9/0`), which finalize skipped
  as redundant. HEAD is therefore unchanged at `7a8d0abd29` and the same
  superset relationship holds one step further along.

  **Rule applied — 2e "one side is a strict superset": ours (HEAD) is the superset.**
  The decisive evidence is that `git diff HEAD:<file> a74ac039:<file>` is *purely
  subtractive* — it contains no `+` line anywhere in the document body. Everything
  this commit adds is already in HEAD byte-identically; the diff's only additions are
  three frontmatter scalars that move backwards.

  | Fact | Incoming (`a74ac039`, free_coded) | Ours (HEAD) |
  |---|---|---|
  | body | appends the `bin/build` type-only-reach follow-up, AC-12, and its 0.2.7 version-bookkeeping paragraph | that section present **verbatim**, plus the later deploy-secret-guard follow-up (AC-13..16) |
  | `updated_at` | `2026-08-23T03:24:38` | `2026-08-24T02:10:41` — later |
  | `last_field_updated` | `body` | `status` — later; see below |
  | `status` | `free_coded` | `bundled` — later lifecycle position |
  | `fields.version` | `0.2.7` | `0.2.9` |
  | `commits[]` | 4 entries | same 4 **plus** `ec144c85`, `02bd4437`, and `working_sha_history: []` on two entries |
  | `bundled_in` / `chat_comment` | absent | `bundle-b3b7c399` / `comment-98e86f10` |

  `last_field_updated` is the one field genuinely set differently on the two sides, so
  the per-fact timeline rule decides it rather than the superset rule. HEAD wins: it is
  the more recent by timestamp (2026-08-24 vs 2026-08-23), which is also what the
  enrichment block prescribes for this file. The two readings agree on substance —
  HEAD's `status` value is a truthful record of its own state, whose last field change
  *was* the `free_coded` → `bundled` transition. Carrying incoming's `body` forward
  would have left the field describing an edit two states in the past.

  Nothing was invented; no `intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

Incoming `a74ac039` touches this one file only, in two hunks. Verified against
`git show a74ac039 -- <file>`:

- **Body hunk** (+50 lines: `## Follow-up: bin/build failed on a type-only reach into
  node` through `Ticket version is now 0.2.7.`) — present in HEAD verbatim. Confirmed
  by the HEAD↔incoming diff, where that whole region appears only as unchanged context
  before the `@@ -449,87 @@` hunk in which HEAD continues with further content.
- **Frontmatter hunk** (`updated_at` bump, `last_field_updated: status` → `body`) —
  superseded by HEAD's later values, as tabulated above.

No hunk was dropped under the BUG-1301 precedence exception; no code or test file was
involved.

## Note for the finalize step

The resolution nets to **no diff vs HEAD** (`git diff --cached --stat HEAD` is empty) —
BUG-1109/BUG-1122, the second consecutive redundant commit in this bundle. This is not
a discard: STEP 3's check confirms the incoming commit's body addition is *present* in
HEAD, not *absent*. Per STEP 4 no `--skip` was issued — `CHERRY_PICK_HEAD` is left at
`a74ac03993024fbbffb13bf95ca29a0605894043` for `cherry_pick_finalize_resolution`.

`git status --porcelain` shows no conflict classes. The remaining `??` entries are
pre-existing untracked comment/report tickets (now including `report-2724a9f4`, this
step's predecessor report), unrelated to the conflict and left untouched.
