---
uid: report-91d69ab8
id: REPORT-3218
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T05:18:31.835832+00:00'
updated_at: '2026-09-01T05:18:31.835832+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — **UU**, intent/bookkeeping ticket (rule **2e**, request-* ticket). Incoming commit `60dd71c0` (2026-08-28T16:40:51Z), 156 insertions / 3 deletions. Four conflict hunks, resolved per-fact; all four resolved to ours:

  1. **Frontmatter (`updated_at` / `last_field_updated` / `status`)** — one fact-cluster, not three independent facts: `updated_at` and `last_field_updated` are both derived from whichever edit landed last. HEAD's `seed_local_overlay` (`afd19974`, 2026-08-31T05:05Z) postdates the incoming commit by three days, so HEAD's trio (`2026-08-31`, `last_field_updated: status`, `status: bundled`) is internally consistent. Taking incoming's `last_field_updated: story_points` while keeping HEAD's later `status: bundled` edit would have produced a field that lies about which edit was last. Note the incoming commit did not change `fields.story_points` itself — it stayed `8` on both sides, so no value was lost.
  2. **`## Origin` paragraph** — pure re-wrapping, identical text. Kept HEAD's.
  3. **`# What was built` … `## Files`** and 4. **`## Test plan` … `## AC status`** — both sides independently added the *same* section (the merge base had no such section at all); they differ only in rendering.

  Staged with `git add --sparse` (path outside the sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

The incoming commit's substance is the "What was built" body. It is present in HEAD in full — **proven, not eyeballed**. Both index stages were extracted and compared word-by-word after normalising markdown (stripping table pipes, emphasis/code markers, bullet and rule punctuation):

    ours:   2026 words
    theirs: 2028 words
    tokens present ONLY in ours (HEAD):     (none)
    tokens present ONLY in theirs (incoming): '>', '>'
    similarity: 0.999507

The only two tokens unique to the incoming side are blockquote continuation markers (`>`), an artefact of that side hard-wrapping the DOC-13 quotation across three lines where HEAD holds it on one. **Zero words of developer prose are absent from the resolved file.** The residual difference is entirely presentational: HEAD's rendering is unwrapped and has the two markdown tables (`## Files`, `## AC status`) flattened into their cells in order, while incoming's is hard-wrapped with the pipe tables intact. Every file path, description and AC row appears in HEAD, in the same order.

The remaining incoming frontmatter facts are superseded by a strictly later edit rather than discarded:

- `status: free_coded` — HEAD carries its successor state `bundled`, set 2026-08-31.
- `updated_at` — HEAD's is the later of the two and belongs to the winning edit.
- `last_field_updated: status → story_points` — reset to `status` by HEAD's later status edit; see hunk 1 above.

No hunk was dropped under the BUG-1301 precedence exception. No code or test files were involved.

**Note on the net-zero staged diff.** The resolved file is byte-identical to HEAD (`git diff HEAD` empty), so this cherry-pick stages no change — the second consecutive commit for this ticket to do so, both because the HEAD-side `seed_local_overlay` had already integrated their content. This is the redundant-commit case (BUG-1109 / BUG-1122), not a discard, and the word-level comparison above is the STEP 3 evidence distinguishing the two: the incoming content is demonstrably *present* in HEAD, not merely absent from the diff. `--skip` was deliberately not called; CHERRY_PICK_HEAD (`60dd71c0`) is intact for `cherry_pick_finalize_resolution`.

**Flagged for post-merge review** per the enrichment's "intent unknown on one or both sides" rule. One substantive observation for that review, outside the scope of this resolution: the bundle-branch copy of this ticket has lost its markdown table formatting relative to the developer's copy. That is a pre-existing property of the `seed_local_overlay` rendering, not something this resolution introduced, and restoring it here would have meant authoring a hybrid file neither side wrote.
