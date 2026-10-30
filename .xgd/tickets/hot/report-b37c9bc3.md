---
uid: report-b37c9bc3
id: REPORT-5446
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T04:04:35.969859+00:00'
updated_at: '2026-09-29T04:04:35.969859+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e** (later-positioned intent, per fact). The file is
  outside the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict existed
  only in the index; resolved with `git checkout --ours` + `git add --sparse`.

  Two conflict regions, both in frontmatter:

  1. **Status-lifecycle block** (`updated_at`, `completed_at`,
     `last_field_updated`, `status`):
     - Ours (HEAD, 2026-09-09T21:32:49): `status: bundled`,
       `last_field_updated: status`.
     - Incoming (`e4ba0304`, 2026-09-01T18:35:52): `status: free_coded`,
       `last_field_updated: status`.
     - `completed_at: null` on both sides — no divergence there.
     - Took ours for all four facts. HEAD is eight days later on every
       conflicting field AND strictly further along the ticket lifecycle
       (merge base was `free_coding` → incoming `free_coded` → ours
       `bundled`). Taking incoming would have regressed an operator-owned
       status field backwards, which 2e's later-positioned-intent rule exists
       to prevent. This matches the enrichment metadata's "take the more
       recent commit by timestamp" instruction.
  2. **`fields.bundled_in`**: `bundle-87be4669` present on ours, absent on
     incoming. Kept ours. Incoming's lack of the key is consistent with it
     predating the bundling, not with an intentional removal.

  Per the enrichment note (intent unknown on the ours side — a
  `seed_local_overlay`), this file is flagged for post-merge review.

## Incoming changes preserved

No code/implementation files were in conflict — the only conflicted path is a
bookkeeping ticket, so there is no developer source at risk. For completeness,
`git show e4ba03047c` gives the incoming commit's complete content delta as
four things; three are present in the resolved file and the fourth is
superseded:

1. `fields.commits` (three `working_sha` entries: `52fd6302…`, `9ae73384…`,
   `c2f6c582…`) — **present** (frontmatter lines 18–27); auto-merged outside
   the conflict region, identical on both sides.
2. `fields.version: 0.2.31` — **present** (line 28), likewise auto-merged.
3. Stripped trailing newline ("\ No newline at end of file") — **present**;
   HEAD already carries the no-final-newline state, so nothing was dropped.
4. `status: free_coded` plus its earlier `updated_at` — **superseded**, per the
   rule-2e reasoning above.

A full ours-vs-theirs diff of the ticket shows exactly three differing lines
(the two `updated_at`/`status` lines plus ours-only `bundled_in`), so incoming
is a strict earlier-state subset here; nothing it still asserts was discarded.

No BUG-1301 precedence exception was invoked, no hunk was dropped, and no test
function was touched.

Because the resolution equals HEAD exactly, `git status --porcelain` is now
empty — the staged diff for this cherry-pick is clean. Per the workflow
contract this step did not call `--skip`, `--continue`, `--quit`, or `--abort`;
CHERRY_PICK_HEAD (`e4ba03047cff470de03992a131e5498336efb914`) remains present
for the finalize step.
