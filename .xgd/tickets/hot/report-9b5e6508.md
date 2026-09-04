---
uid: report-9b5e6508
id: REPORT-3379
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T22:07:34.065129+00:00'
updated_at: '2026-09-02T22:07:34.065129+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — class **UU**, rule **2e** (intent/bookkeeping ticket, per-fact resolution). Incoming commit `60dd71c053` (2026-08-28 09:40:51, `xgd(ticket): update request`); ours `afd199743a` (2026-08-31, `seed_local_overlay`). Four conflict hunks: one frontmatter, three body.

  **Frontmatter hunk — kept OURS.** `updated_at 2026-08-31T05:05:09Z`, `last_field_updated: status`, `status: bundled`, and `fields.bundled_in: bundle-8eef3846` (the latter merged clean, ours-only addition). Incoming offered `status: free_coded` / `last_field_updated: story_points` / `updated_at 2026-08-28T16:40:51Z`. Same-fact conflict, so the timeline rule applies per-fact: the ours-side commit is later (2026-08-31 vs 2026-08-28) and `free_coded → bundled` is forward lifecycle motion. Taking incoming would have reverted an operator-owned status backwards and orphaned the `bundle-8eef3846` membership record. Note `fields.story_points` is `8` on both sides and merged without conflict, so incoming's `last_field_updated: story_points` marks a touch that changed no value — nothing is lost by carrying ours.

  **Three body hunks — kept INCOMING.** Both sides append the same `# What was built` implementation record (the base blob `276781dc` has no such section, so this is a both-added section rather than a divergent edit). Ours is a lossy re-render of it produced by the 2026-08-31 overlay seed; incoming is the developer's original. Verified by word-diff under `--ignore-all-space`: across the whole file only 20 ours-only tokens exist, of which 4 are the frontmatter facts kept above and the other 16 are emphasis-marker variants (`_owns_` vs `*owns*`, `_"Swap` vs `*"Swap`, etc.) and re-wrap artifacts of byte-identical prose. Ours contributes **no unique prose**.

  The decisive difference is structural: the incoming blob carries **19 markdown table rows** (`grep -c '^|'` = 19) for the `## Files` and `## AC status` tables; the ours blob has **0** — the overlay round-trip flattened both tables into loose unlabelled lines, destroying the row/column pairing between each file and its description, and between each AC and its status. Keeping ours would have silently discarded that structure. Per rule 2b's superset test and STEP 2's "incoming is authoritative, the developer wrote it after whatever automated workflow produced the ours side," incoming's body wins.

  No content was invented; every retained byte comes verbatim from one side or the other. No `intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

The incoming commit `60dd71c053` made two changes. Disposition:

- **`+156` body lines appending the `# What was built` record** (the fourth-option AC3 narrative, the one-browser-per-run section, the `1c shot` split, the "what the CF driver does not do" and "deliberately not done" sections, the `## Files` table, the test plan, and the `## AC status` table) — **present verbatim and in full.** `diff` of the resolved file against the incoming blob `ce69fd1a` reports only the four frontmatter lines named above; every body line is byte-identical to what the developer authored.

- **`updated_at` / `last_field_updated` frontmatter bump** — deliberately superseded by the later ours-side values, per the per-fact timeline rule in 2e. This is bookkeeping metadata, not developer content.

No hunk was dropped under the BUG-1301 precedence exception. No code or test files were involved. Staged diff vs HEAD is a real change (`156 insertions, 118 deletions`), so this cherry-pick is not a no-op.
