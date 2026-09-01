---
uid: report-fd881ec4
id: REPORT-3204
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T04:38:28.091250+00:00'
updated_at: '2026-09-01T04:38:28.091250+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — UU, intent/bookkeeping ticket (rule 2e), same-fact/same-section conflict → later-positioned intent wins. Resolved to the HEAD side.

Incoming commit `163924e9` (`xgd(ticket): update bug bug-23d1ec27`, Martin Westhead, 2026-08-25 16:27 -0700) is +99/-43 — the large body rewrite plus a frontmatter touch. Four conflict regions:

1. **Frontmatter** — `updated_at` `2026-08-31T05:05:09Z` (ours) vs `2026-08-25T23:27:28Z` (theirs); `last_field_updated` `status` vs `body`; `status` `bundled` vs `free_coding`.
2. **Root cause / Fix — as landed / Watch for** — same narrative on both sides, different line-wrapping and table rendering.
3. **Out of scope** — same narrative, different wrapping.
4. **Acceptance criteria + Reproduce** — same narrative, different wrapping.

### The body sections are the same content, not competing content

I verified this rather than assuming it. Normalizing away line-wrapping, markdown table pipes and separator rows, and bold markers, then running a word-level sequence diff between index stage 2 (ours) and stage 3 (theirs — confirmed byte-identical to the incoming commit's blob):

- ours = 966 words, theirs = 969 words
- present only in theirs: the code-fence language tag `ts` (ours has a bare ``` fence), and the table separator row `|---|---|---|`
- present only in ours: the corresponding bare ``` fence
- **no prose, no fact, no list item, no table cell differs**

So HEAD already carries this commit's entire body — including the paragraphs this commit introduces, e.g. "**The blast radius is wider than the reproduce line.**" and the closing "Note: in a fresh worktree this first fails with `Cannot find module './generated/ai-workers.js'`" — in a lossily re-serialized form (the markdown table flattened to one-line-per-cell paragraphs, `**One double, in **` bold markers misplaced, `ts` fence tag dropped). That re-serialization is the ticket store's round-trip on the bundle branch, already integrated into HEAD by the `09291354` `seed_local_overlay` commit.

**What is genuinely lost by taking ours: two pieces of markdown syntax — the ` ```ts ` fence language tag and the table's pipe structure. Zero information.** Stating that plainly rather than claiming byte-perfect preservation.

### Basis for taking HEAD

Three signals in agreement, same as the two preceding commits in this bundle:

1. **Ticket timestamp** — ours `updated_at` 2026-08-31 vs theirs 2026-08-25.
2. **Commit timestamp** — the enrichment block's own rule. HEAD's latest touch is `09291354` `seed_local_overlay` at 2026-08-31 12:21 -0700; incoming is 2026-08-25 16:27 -0700.
3. **Lifecycle consistency** — `bundled` is downstream of `free_coding`, and the auto-merged (unconflicted) `fields:` block carries `bundled_in: bundle-8eef3846`, `version: 0.2.15`, `story_points: 3` and the `commits:` entry. Taking theirs would set `status: free_coding` while leaving `bundled_in` populated, and would un-bundle the bug this reconcile run is bundling.

### A merge artifact that taking ours also fixes

Git's auto-merge had emitted the "blast radius" paragraph **twice** in the working tree (line 53 in HEAD's unwrapped form, lines 55-57 in the incoming wrapped form) because this commit adds it as new while HEAD already had it. Resolving to the ours blob removes the duplicate; verified `grep -c 'blast radius'` = 1 in the resolved file, and the resolved file diffs clean against stage 2.

Staged with `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1). No `git cherry-pick --continue/--skip/--quit/--abort`, `reset`, or `checkout <branch>` was run; `CHERRY_PICK_HEAD` is still present at `163924e9fdc98127c7b09fdddf88d7f695d0231f`.

Flagged for post-merge review per the enrichment block (intent unknown on one or both sides).

## Incoming changes preserved

No code or implementation files were in this conflict — the sole conflicted path is a bookkeeping ticket, so STEP 3's code-discard guard does not bite. The BUG-1301 precedence exception was NOT invoked: no hunk was dropped as obsolete-by-refactor, and no test function was touched.

- **Body rewrite** — preserved. Demonstrated word-for-word above: every sentence, table cell and list item the incoming commit authored is present in the resolved file. This is squarely STEP 3's "present in HEAD via a different route" = redundant, not discarded.
- **`status: free_coding`** — superseded, not discarded. HEAD's `bundled` is a strictly later state on the same lifecycle field, reachable only by having passed through `free_coding`; reverting it would move the ticket backwards. This is the documented rule-2e outcome for a same-field conflict.

Note on the net-zero staged diff: `git diff --cached HEAD --stat` is empty and `git status --porcelain` shows no `M`/`A`/`D` entry. Redundant-commit case (BUG-1109/BUG-1122), not the discarded case — HEAD already carries this commit's effect. Per STEP 4, `--skip` was NOT called; the finalize step will detect the clean staged diff and skip the commit.
