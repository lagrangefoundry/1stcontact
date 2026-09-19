---
uid: report-3b4426ec
id: REPORT-4410
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:53:36.304924+00:00'
updated_at: '2026-09-19T11:53:36.304924+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping request ticket (rule 2e). Incoming commit `3325664f0f xgd(ticket): update request request-6893f6ea` (2026-09-01T12:35:38, `last_field_updated: body`) is a 73+/177- body reflow plus three frontmatter scalars. Only ONE hunk conflicted — the frontmatter block; the entire body rewrite merged clean because HEAD already contains it verbatim (see below). For the conflicting facts both sides changed the SAME fields, so the per-fact timeline rule applied:

  | fact | HEAD (`c94654a355` seed_local_overlay, 2026-09-09) | incoming (2026-09-01) | kept |
  |---|---|---|---|
  | `updated_at` | 2026-09-09T21:32:50Z | 2026-09-01T19:35:38Z | HEAD |
  | `last_field_updated` | `status` | `body` | HEAD |
  | `status` | `bundled` | `free_coded` | HEAD |

  HEAD is the later-positioned intent, and `free_coded` is a lifecycle step HEAD has already passed (free_coded → ready_to_reconcile → bundled). No `fields.*` touched; no content invented.

## Incoming changes preserved

No code/implementation files were conflicted — the only conflicted path is a bookkeeping request ticket.

The incoming commit's substantive change is the body rewrite (paragraph unwrapping, ordered-list renumbering, the size table flattened, `~` qualifiers and strikethrough dropped). That change is **already present in HEAD byte-for-byte**, not discarded:

    git diff 3325664f0f:.xgd/tickets/hot/request-6893f6ea.md HEAD:.xgd/tickets/hot/request-6893f6ea.md

returns only the three frontmatter scalars above plus HEAD's added `fields.bundled_in: bundle-87be4669`. Every line of the rewritten body is identical on both sides — HEAD's `seed_local_overlay` (c94654a355) carried the same working-side body forward. Correspondingly `git diff HEAD` on the resolved file is empty.

So the staged tree nets to no diff vs HEAD. Per STEP 4 (BUG-1109/BUG-1122) this is a genuinely redundant commit — its content reached HEAD by a different route — not a discarded one, and STEP 3's check confirms it by presence rather than by absence. `--skip`/`--continue` NOT called; `CHERRY_PICK_HEAD` (3325664f0ff0b6577656e969db305788c1a3bc39) left intact for the finalize step.

No BUG-1301 precedence exception was invoked; no test file or test function was touched.

`git status --porcelain` is empty — no conflict-class lines remain.
