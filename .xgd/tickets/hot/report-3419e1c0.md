---
uid: report-3419e1c0
id: REPORT-5517
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T08:32:19.696541+00:00'
updated_at: '2026-09-29T08:32:19.696541+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — class **UU**, intent/bookkeeping
  ticket (`request-*`), resolved under rule **2e** (later-positioned intent,
  per fact). Unlike the earlier picks against this same file on this branch,
  the path was **inside** the sparse-checkout cone here — real working-tree
  conflict markers, not an index-only conflict — so a plain
  `git checkout --ours` + `git add` sufficed.

  Two conflict regions, both in frontmatter:

  - `updated_at` — ours (HEAD, seeded from the local overlay at
    `2cf37792fd`) `2026-09-09T21:32:49`; incoming (`b2aa9353ff`, 2026-09-02)
    `2026-09-02T17:48:27`.
  - `fields.bundled_in` — ours `bundle-87be4669`; incoming `bundle-203b1dc2`.

  Took ours on both. HEAD is seven days later and records a **later
  bundling** of the same ticket; `bundle-203b1dc2` (BUNDLE-23, created
  `2026-09-02T17:48:26`, still `status: ready_to_reconcile`) is the earlier
  bundle, and incoming is the very commit that wrote that membership. Taking
  incoming would have rolled an operator-owned bundle pointer backwards onto
  a superseded bundle — exactly what 2e's later-positioned-intent rule
  exists to prevent, and consistent with the enrichment metadata's
  "take the more recent commit by timestamp" instruction.

  Per the enrichment note (intent unknown on the ours side — a
  `seed_local_overlay`), this file is flagged for post-merge review.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is
a bookkeeping ticket, so no developer source was at risk. Verified nonetheless
by reading the incoming commit's complete delta:

    git show b2aa9353ff -- .xgd/tickets/hot/request-26dafd83.md

It is three lines, none of them discarded as substantive fact:

1. `updated_at` `2026-09-02T01:52:29` → `2026-09-02T17:48:27` — superseded by
   HEAD's `2026-09-09T21:32:49`.
2. `status: ready_to_reconcile` → `bundled` — **already satisfied by HEAD**.
   This line falls outside both conflict regions; the resolved file carries
   `status: bundled`, so incoming's actual lifecycle assertion survives intact.
3. `+ bundled_in: bundle-203b1dc2` — superseded by HEAD's
   `bundled_in: bundle-87be4669`.

So incoming's one behavioural claim — that the ticket has been bundled — is
present in the resolved file; only the pointer to *which* bundle differs, and
there HEAD is strictly later. The incoming diff contains no hunks below the
`---` frontmatter terminator, so no prose body was touched on either side.

No hunk was dropped under the BUG-1301 precedence exception; it did not apply
here. No test function was touched on either side.

## Consistency with prior resolutions on this branch

This is the fourth ticket on `resync-377b581e` to hit the same
`bundle-87be4669`-vs-earlier-bundle shape, and the resolution matches all
three precedents, each decided under 2e in favour of ours:

- `request-26dafd83.md` against `cfe4aca5` — took ours,
  `bundled_in: bundle-87be4669` (same file, earlier pick in this queue).
- `request-439cd0c8.md` — took ours, `status: bundled` +
  `bundled_in: bundle-87be4669`.
- `request-909e42f8.md` — took ours, `bundled` over `draft`, kept
  `bundled_in: bundle-87be4669`.

## Notes for post-merge review

1. **`bundle-87be4669.md` does not exist anywhere in this worktree.** The only
   bundle file present is `bundle-203b1dc2.md`, created by the replay's own tip
   commit `0cae14a6f9`. Five tickets on this branch now point at
   `bundle-87be4669` (`request-26dafd83`, `-439cd0c8`, `-3bc4b835`,
   `-78370159`, `-909e42f8`), all via the same `seed_local_overlay`. The bundle
   file does exist in history (`5cb732c518` and nine earlier commits), so this
   is expected to heal when the replay reaches those commits; if it does not,
   the branch ends with five dangling `bundled_in` pointers.
2. **The pick is now empty.** The resolution equals HEAD byte-for-byte —
   `git diff --cached HEAD` and `git status --porcelain` are both empty. Per
   the workflow contract this step did not call `--skip`; the finalize step
   will detect the clean staged diff and skip the commit.

Per the workflow contract this step did not call `--continue`, `--skip`,
`--quit`, or `--abort`; `CHERRY_PICK_HEAD`
(`b2aa9353ffb059096886c7d14d0cfed3ea6b14a1`) remains present for the
finalize step.
