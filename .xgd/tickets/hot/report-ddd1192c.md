---
uid: report-ddd1192c
id: REPORT-5466
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T05:10:00.258363+00:00'
updated_at: '2026-09-29T05:10:00.258363+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping ticket
  (`request-*`, §2e), outside the sparse-checkout cone, resolved with
  `git show HEAD:<path> > <path>` + `git add --sparse`. Three conflict
  regions, all resolved **ours**, per fact:

  1. **Status-lifecycle frontmatter** (`updated_at`, `status`).
     Ours (HEAD, via `c94654a355` *seed_local_overlay*, 2026-09-09):
     `updated_at: '2026-09-09T21:32:50'`, `status: bundled`.
     Incoming (`d14bb2985c`, 2026-09-01): `updated_at: '2026-09-01T19:34:09'`,
     `status: ready_to_reconcile`. `completed_at: null` and
     `last_field_updated: status` agree on both sides.
     Rule: later-positioned intent, per fact — ours is eight days later and
     strictly further along the lifecycle (`ready_to_reconcile` → `bundled`).
     Taking incoming would have regressed an operator-owned status field
     backwards. Ours additionally carries `fields.bundled_in: bundle-87be4669`,
     consistent with the advanced status; incoming lacks the key because it
     predates the bundling, not because it removed it.

  2. **§"What has changed under this ticket since it was written", item 3**
     (the bundle-size argument).
  3. **§"Answers to the open questions", Q1** (the second blocker).

     Regions 2 and 3 are not competing content: ours is a strict superset of
     incoming on every *fact*. Rule applied: "one side a strict superset —
     keep the superset."

## Incoming changes preserved

No code or implementation files were in conflict — the only conflicted path is
a bookkeeping ticket, so there is no developer source to preserve, and no
BUG-1301 precedence exception was invoked. No test functions were touched.

Verification that incoming intent survives: `git show d14bb2985c -- <path>`
against the resolved file confirms every substantive assertion the incoming
commit adds is already present in ours, having arrived through the 2026-09-09
overlay seed `c94654a355`:

- the 1052 KiB `KB = null` baseline and the 1341 KiB full-bundle dry run;
- all three `kb.js` measurements (107,305 / 520,730 / 294,767 bytes);
- the 2.75× compression fact, the `145 chunks × 384 × 4` vector arithmetic,
  the 223 KiB base64 floor, the 78%-is-vectors conclusion, and "bundle size
  tracks chunk count, not text volume";
- the 39-tickets / 642,230-bytes extrapolation, 2.7 MiB against the 10 MiB
  ceiling, 3.6× headroom, the 29-are-`doc_kind: architecture` caveat, and the
  "earlier revision projected 1.9 MiB, optimistic by ~40%" correction;
- the whole `NODE_USE_ENV_PROXY=1` / undici-ignores-`HTTPS_PROXY` blocker,
  including the `err.cause` diagnosability note and its out-of-scope marking;
- the corpus-is-scoped-not-grown paragraph (4 of 39 carry
  `doc_kind: system_kb`; `1c kb build` has now run; the remaining 35 wait on
  [[DOC-39]] §10).

A full word-level ours-vs-theirs diff shows incoming's only remaining unique
content is presentation, produced by the overlay round trip: markdown emphasis
markers displaced around adjacent inline code, `_em_` → `*em*`, the
measurement table flattened from `| … |` rows into loose lines, approximation
tildes dropped (`~223 KiB` → `223 KiB`, `~78%` → `78%`, `~6×` → `6×`,
`~2.7 MiB` → `2.7 MiB`), one dropped strikethrough under "Open questions", and
the "What is missing" ordered list renumbered `3.–6.` → `1.–4.`. So incoming is
a strict earlier-state subset on every fact it still asserts; nothing was
discarded that it had not already been superseded on.

Region 3 additionally had a mechanical reason ours is the only non-corrupting
choice: the incoming hunk *encloses* the "cause is proxy handling" and
"Q2 — generated, not committed" paragraphs, which already sit immediately below
the conflict on the ours side. Taking incoming there would have duplicated
them. The resolved file has each paragraph exactly once (lines 143, 145, 149).

## Observations for post-merge review

The §2e enrichment flagged this file for post-merge review ("intent unknown on
one or both sides"). Three degradations are present in the resolved file. All
are **pre-existing properties of HEAD**, carried in by the 2026-09-09 overlay
seed `c94654a355`; they predate this cherry-pick and were deliberately NOT
hand-edited during resolution, since the overlay is the authoring surface and a
local repair would be re-clobbered by the next render:

1. **The measurement table is no longer a table.** Lines 111–123 read as orphan
   fragments (`bytes`, `Source markdown, 4 documents`, `107,305 (105 KiB)`, …).
   The numbers survive; their column association does not. Incoming
   `d14bb2985c` holds the intact three-row markdown table if it is ever wanted
   as a restore source.
2. **Dropped approximation tildes overstate precision** — "floors at 223 KiB"
   and "78% of the compressed payload" were authored as `~223 KiB` and `~78%`.
3. **Displaced bold markers** leave a few malformed runs, e.g. line 143:
   `**A second blocker … ignores **` `` `HTTPS_PROXY` `` `**.**` `` `1c kb build` ``
   ` dies …` (missing space, unbalanced emphasis).

## State handed on

The resolution equals HEAD exactly, so `git status --porcelain` is empty and
the staged diff for this cherry-pick is a content no-op — an earlier commit in
this resync queue already landed the same effect via the overlay seed. Per the
workflow contract this step did NOT call `--continue`, `--skip`, `--quit`, or
`--abort`; `CHERRY_PICK_HEAD` (`d14bb2985c`) remains present for the finalize
step, which will detect the clean staged diff and skip the commit.
