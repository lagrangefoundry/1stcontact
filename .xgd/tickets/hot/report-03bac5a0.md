---
uid: report-03bac5a0
id: REPORT-3630
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T01:34:27.855020+00:00'
updated_at: '2026-09-10T01:34:27.855020+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — **UU**, intent/bookkeeping ticket (rule **2e**). Incoming commit `60dd71c0` ("xgd(ticket): update request request-b88b79fe", 2026-08-28 09:40:51 -0700). Resolved by **per-fact composition — OURS frontmatter + THEIRS body** — not by picking a whole-file winner (BUG-1030). Four conflict hunks, which reduce to exactly two facts:

  **Fact 1 — frontmatter bookkeeping (hunk 1): kept OURS.**
  HEAD: `updated_at 2026-08-31T05:05:09`, `last_field_updated: status`, `status: bundled`.
  Incoming: `updated_at 2026-08-28T16:40:51`, `last_field_updated: story_points`, `status: free_coded`.
  HEAD is three days later and strictly further along the same lifecycle (`free_coding → free_coded → bundled`), and additionally carries `fields.bundled_in: bundle-8eef3846`, which the incoming side predates rather than removes. This is also what the enrichment's stated fallback rule ("take the more recent commit by timestamp") selects. Taking the incoming side here would have reverted an operator-owned status transition and dropped `bundled_in`.

  **Fact 2 — the `# What was built` body narrative (hunks 2, 3, 4): kept THEIRS.**
  Both sides append the *same* narrative; the merge base has none, so both adding it is what produced the conflict. The two renderings were proven **word-for-word identical**: after normalising line-wrapping, `*`/`_` emphasis style, and table pipe formatting, both sides yield exactly **2004 words** with a `SequenceMatcher` ratio of **1.0** and **zero** side-exclusive prose in either direction. So no editorial intent competes here — only formatting.
  The two renderings differ only in form, and HEAD's is the lossy one: HEAD's `seed_local_overlay` had unwrapped every line, swapped `*` emphasis for `_`, and **flattened the developer's two markdown tables (`## Files`, `## AC status`) into bare adjacent paragraphs**, destroying the column pairing. The incoming side is the developer's authored form with both tables intact. Per the same principle 2g applies to scalars — the developer's authored intent supersedes automated churn on the ours side — the authored body was kept. Nothing from HEAD's body was lost, because HEAD's body contained no prose the incoming side lacks.

No code, test, UAT, spec-ticket, or config files were in conflict. No file was deleted; no test function was touched.

## Incoming changes preserved

Incoming commit `60dd71c0` changed three things. Verified programmatically against the staged result:

| Incoming change | State in resolved file | Verdict |
| --- | --- | --- |
| Body append: 156 lines, `# What was built` and its 7 sections | **Byte-identical to the incoming commit** (`res_body == theirs_body` → `True`). All 7 headings present (`AC3 was answered…` :110, `One browser per run…` :143, `What the CF driver does not do` :178, `Deliberately not done` :189, `Files` :199, `Test plan` :215, `AC status` :248), both markdown tables intact (17 table rows) | **Preserved verbatim** |
| `last_field_updated: status → story_points` | HEAD carries `status`, from a strictly later edit. The `story_points: 8` *value* the field refers to is unchanged and present | Superseded, not discarded |
| `updated_at → 2026-08-28T16:40:51` | HEAD carries `2026-08-31T05:05:09`, a later timestamp | Superseded, not discarded |

The staged diff is **156 insertions / 118 deletions** — the insertion count matches the incoming commit's own `156 insertions` exactly; the deletions are HEAD's lossy reflow of the same prose being replaced by the authored form.

Also carried through from HEAD's frontmatter (contributed by the prior commit in this bundle, `04d4a984`, which finalize skipped as redundant): `fields.commits[0].working_sha: 29c0e86dd321b509e06f0dd9e531392ee9190b0e`, `fields.version: 0.2.16`. Both verified present in the staged result.

No hunk was dropped under the BUG-1301 precedence exception; that exception did not arise.

The cherry-pick sequencer state is intact (`CHERRY_PICK_HEAD` = `60dd71c0533f493ff8a9dee945f5201af056d393`). No conflict-class entries remain in `git status --porcelain`; the file stages as `M`.
