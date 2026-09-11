---
uid: report-71f25f4a
id: REPORT-4097
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T23:37:30.884380+00:00'
updated_at: '2026-09-11T23:37:30.884380+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — class **UU**, rule **2e**
  (intent/bookkeeping ticket: a `bug-*` ticket, user-authored content, not
  matrix state). Resolved per-fact, not by whole-file winner-picking.
  Staged with `git add --sparse` (path is outside the sparse-checkout cone
  on this reconcile branch, DOC-986 §2/§4.1).

  Incoming commit: `fe97d3bc34` "xgd(ticket): update bug bug-6612c4b7"
  (2026-08-24 14:06). Conflict-intent enrichment reported the xgd-kind as
  unknown on both sides, directing the timeline rule + post-merge review.

  Three hunks, each resolved on its own fact:

  1. **Frontmatter scalars** (`updated_at`, `completed_at`,
     `last_field_updated`, `status`). Same facts changed differently on both
     sides → later-positioned side wins. HEAD carries
     `updated_at: 2026-08-31T19:19:36`, a non-null `completed_at`, and
     `status: free_and_reconciled`; incoming carries `2026-08-24T21:06:15`,
     `completed_at: null`, `status: draft`. HEAD is the later position by a
     week and reflects work that has since been coded, reconciled and
     bundled. **Kept HEAD.** Taking the incoming side would have demoted a
     `free_and_reconciled` ticket back to `draft` — an operator-owned status
     revert.

  2. **`fields:` block.** Not a competing edit on a shared fact — the two
     sides added disjoint keys. HEAD adds `chat_comment`, a three-entry
     `commits` list, `version: 0.2.13`, `bundled_in: bundle-78f4e2fe`.
     Incoming adds a single `fields.title` key duplicating the top-level
     `title:`. HEAD is a strict superset **of the underlying fact**: the
     top-level `title:` at HEAD already carries the incoming commit's new
     wording, so `fields.title` is a redundant bookkeeping echo of a change
     already recorded, not new content. **Kept HEAD's block.** Merging the
     incoming key in would have re-added a stale duplicate of a field whose
     canonical copy is already correct; nothing from either side was lost.

  3. **Body tail, `## Relationship to BUG-36` onward.** HEAD has the
     paragraph reflowed and ends there. Incoming has the same paragraph at
     the older line-wrap plus a trailing section
     `## Not started` / "Diagnosis only. No branch cut, no code written."
     **Kept HEAD.** See the precedence note below.

## Incoming changes preserved

STEP 3 verified against `git show fe97d3bc34 -- .xgd/tickets/hot/bug-6612c4b7.md`.

The incoming commit's substantive change is the title retitle:
`Edit mode 503s with Cloudflare 1102` → `Edit mode dies with Cloudflare 1102`.
That change **is present** in the resolved file, at the canonical top-level
`title:` (line 5). This is BUG-1109/BUG-1122's redundant case, not a discard:
the retitle reached HEAD by a different route (HEAD's own later lineage
already carries the new wording), so the resolution nets to no diff vs HEAD
while the developer's intent is fully retained. Per STEP 4 I did **not** call
`--skip`; the staged tree is left for `cherry_pick_finalize_resolution`.

### Hunk dropped under the BUG-1301 precedence exception

- **File**: `.xgd/tickets/hot/bug-6612c4b7.md`, section `## Not started`
  ("Diagnosis only. No branch cut, no code written.")
- **Not authored by the incoming commit.** The incoming diff's hunk on this
  section is a no-op on content: the `-` and `+` lines are byte-identical
  text, and the only delta is `\ No newline at end of file`. The section
  existed in the incoming commit's *pre-image*; `fe97d3bc34` merely
  normalised its trailing newline. Dropping it discards no developer text
  authored by this commit.
- **HEAD-side removal is legitimate and documented.**
  `git log -S'## Not started' HEAD -- <path>` returns empty: the section
  never existed anywhere in HEAD's lineage of this file. HEAD's body is the
  fully-worked post-fix rewrite, and it documents the supersession
  explicitly — its section outline is
  `Root cause — CONFIRMED` / `What this ticket fixes in code` / `Result` /
  `Superseded — the original hypothesis, recorded because it was wrong` /
  `Observability — added here` / `Deployment` /
  `Reproduction (historical)`, versus the incoming side's hypothesis-era
  outline (`Leading hypothesis …`, `Candidate fixes — for design, not yet
  chosen`, `Prerequisite — there is no telemetry to confirm any of this`,
  `Not started`). HEAD did not silently delete the section; it rewrote the
  ticket around a confirmed root cause (Workers Free plan 10 ms per-
  invocation CPU ceiling vs a ~78 ms preview request) and kept the discarded
  hypothesis under a named `Superseded` heading. Carrying "No branch cut, no
  code written" forward would have re-asserted a statement that the same
  file's own body, and its `commits` / `version` / `bundled_in` fields,
  flatly contradict.
- No test functions were deleted; this conflict contains no test files.

## Post-merge review flag

Per the enrichment's "flag this file for post-merge review" directive: both
sides' commit subjects are the generic `xgd(ticket): update bug
bug-6612c4b7`, so xgd-kind could not be inferred from either side. The
resolution above rests on in-file evidence (timestamps, status lifecycle,
section outlines, `git log -S`) rather than on commit-kind metadata.
