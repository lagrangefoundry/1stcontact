---
uid: report-a46c0fae
id: REPORT-4876
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T22:42:01.161182+00:00'
updated_at: '2026-09-23T22:42:01.161182+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` (REQ-165) — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e**. Resolved to the OURS side.

  Both sides are identical except two frontmatter facts; bodies are byte-identical across base/ours/theirs (verified by `diff` of all three index stages — the only hunks in `base→ours` and `base→theirs` are in frontmatter).

  | fact | ours (HEAD) | theirs (incoming `b2aa9353`) |
  |---|---|---|
  | `status` | `bundled` | `bundled` (agree — no conflict) |
  | `bundled_in` | `bundle-87be4669` | `bundle-203b1dc2` |
  | `updated_at` | `2026-09-09T21:32:49Z` | `2026-09-02T17:48:27Z` |

  `bundled_in` is the one genuinely conflicting fact, so rule 2e's per-fact "later-positioned intent wins" applies. Ours is later, confirmed three independent ways:

  1. **Timestamps** — ours `updated_at` is 2026-09-09, theirs 2026-09-02 (7 days earlier).
  2. **The incoming bundle was retired in between** — `bundle-203b1dc2` was archived by `64a726eda0` on 2026-09-08, i.e. *after* theirs bundled REQ-165 into it and *before* ours re-bundled. Taking theirs would point REQ-165 at an archived bundle.
  3. **The ours-side bundle names this ticket** — `bundle-87be4669`'s title is `REQ-164 + REQ-159 + REQ-165 + REQ-163 + REQ-161 + 2 more`; REQ-165 is this ticket. That bundle is at `status: free_and_reconciled`.

  Sequence: REQ-165 bundled into `bundle-203b1dc2` (2026-09-02, = the incoming commit) → `bundle-203b1dc2` archived (2026-09-08) → REQ-165 re-bundled into `bundle-87be4669` (2026-09-09, = the ours-side state carried in by `2cf37792fd xgd(ticket): seed_local_overlay request request-26dafd83`).

  Theirs contains nothing ours lacks — `diff ours theirs` is exactly the two rows above, both of which ours supersedes. Resolution therefore equals the ours blob verbatim; applied with `git checkout --ours` (git-native, no hand-authored frontmatter rewrite) and staged with `git add --sparse`.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` verification applies only to it.

The incoming commit `b2aa9353ffb059096886c7d14d0cfed3ea6b14a1` ("xgd(ticket): update request request-26dafd83", 2026-09-02) touches exactly one file and makes exactly one substantive assertion: REQ-165 is bundled, into `bundle-203b1dc2`. That assertion is **not** carried into the resolved file, and this is the correct outcome rather than a discarded developer change:

- The `status: bundled` half of the incoming intent **is** preserved — both sides already agree on it, so the incoming status transition survives intact. There is no regression of `bundled` back to an earlier status.
- The `bundled_in: bundle-203b1dc2` half is superseded by a *later operator decision already integrated into HEAD*: the bundle it names was archived on 2026-09-08 and REQ-165 was re-bundled into `bundle-87be4669` on 2026-09-09. Re-applying the incoming value would not restore lost work — it would roll a bookkeeping pointer back onto an archived bundle and contradict `bundle-87be4669`, which lists REQ-165 in its own title and has since reached `free_and_reconciled`.

This is rule 2e operating as intended (later-positioned intent wins on the one contested fact), not the BUG-1301 PRECEDENCE exception — no refactor removed anything, and no test function was deleted. No UAT or code hunks were dropped anywhere in this resolution.

**Note for the finalize step:** the resolved content is identical to HEAD, so `git diff --cached` is empty for this cherry-pick. Per the prompt this was left alone — `--skip`/`--continue`/`--quit`/`--abort` were not called, and `CHERRY_PICK_HEAD` is still present at `b2aa9353ffb059096886c7d14d0cfed3ea6b14a1` for Python's finalize step to detect the clean staged diff and skip the commit.
