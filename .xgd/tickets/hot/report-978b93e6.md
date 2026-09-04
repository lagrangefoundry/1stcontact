---
uid: report-978b93e6
id: REPORT-3458
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T01:52:18.496368+00:00'
updated_at: '2026-09-04T01:52:18.496368+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

All ten conflicts are `.xgd/tickets/hot/` intent/bookkeeping tickets (STEP 2 §2e).
No code, spec (story/AC/capability) or UAT files were in conflict.

The uniform finding: HEAD (reconcile-BUNDLE-23) already carries the incoming
commit's body content — a post-watermark sync landed it — and then advances it.
On every conflicting *fact*, HEAD is either the later-positioned intent or a
strict superset of the incoming side. The incoming side (`bcaa943a`, "Merge
branch 'xgd-working' into free-REQ-165", 2026-09-01) holds an earlier snapshot of
the same tickets.

- `.xgd/tickets/hot/bundle-8eef3846.md` — UU. §2e superset. Both sides set
  `status: free_and_reconciled`; HEAD is later (`2026-09-01T00:00:07` vs
  `2026-08-31T23:59:50`) and additionally carries `result: pass`,
  `merged_at_commit: 90527353…`, the resolved `main_sha`, and the full
  169-entry `orphan_commits` remap table. Kept HEAD. Incoming's pre-reconcile
  `working_sha` entries are superseded by HEAD's post-reconcile commit records.

- `.xgd/tickets/hot/comment-48c75d2e.md` — UU. §2e strict superset. Bodies are
  identical up to incoming's last turn; HEAD appends one further assistant turn
  (`26051ddb…`, ts `2026-09-01T18:22:44`). Kept HEAD. The only line HEAD drops
  relative to incoming is the `updated_at` scalar it supersedes.

- `.xgd/tickets/hot/comment-c74424ff.md` — AA. §2b superset. HEAD's version is
  incoming's file plus one appended user+assistant turn pair (`9d626d00…`,
  ts `2026-09-01T18:22:57` / `18:25:38`). Kept HEAD. Again the sole dropped line
  is `updated_at`.

- `.xgd/tickets/hot/request-119dd4af.md` — UU. §2e later intent. Bodies byte-
  identical. HEAD: `status: bundled` + `bundled_in: bundle-203b1dc2`, updated
  `2026-09-02T17:48`. Incoming: `status: ready_to_reconcile`, no `bundled_in`,
  updated `2026-09-01T03:36`. Kept HEAD — taking incoming would strip the ticket
  out of the very bundle this reconcile run is processing.

- `.xgd/tickets/hot/request-13a5e206.md` — UU. §2e later intent. HEAD:
  `free_and_reconciled`, `result: pass`, `merged_at_commit: 4b43dd9a…`, resolved
  `main_sha`, `orphan_commits` table, updated `2026-09-02T01:34`. Incoming:
  `status: reconciling`, updated `2026-09-01T00:01`. Kept HEAD — incoming is an
  earlier point in the same lifecycle.

- `.xgd/tickets/hot/request-3bc4b835.md` — AA. §2b/§2e. Bodies byte-identical;
  frontmatter differs only as in request-119dd4af. Kept HEAD.

- `.xgd/tickets/hot/request-439cd0c8.md` — UU. Same as request-119dd4af. Kept HEAD.

- `.xgd/tickets/hot/request-6893f6ea.md` — UU. §2e composed per-fact, see below.

- `.xgd/tickets/hot/request-78370159.md` — UU. Same as request-119dd4af. Kept HEAD.

- `.xgd/tickets/hot/request-909e42f8.md` — UU. Same as request-119dd4af, plus
  `last_field_updated` (HEAD `status` / incoming `body`) — HEAD is later. Kept HEAD.

### The one composed resolution: request-6893f6ea.md

HEAD holds a later revision of the body (unwrapped/reflowed by an editor round
trip) that supersedes incoming's text with measured figures: incoming still
projects "**1.9 MiB** against the 10 MiB ceiling" and "37 documents, 640 KB",
where HEAD carries the dry-run measurements (1052 KiB gzip with `KB = null`,
1341 KiB with the corpus, 288 KiB module gzip, ~2.7 MiB extrapolated, 3.6×
headroom) and adds the `NODE_USE_ENV_PROXY` / undici blocker to Q1. That revision
is the direct consequence of the chat turn at `2026-09-01T18:22:44` that exists
only on HEAD's side of comment-48c75d2e ("Say the word and I'll correct that
paragraph to the measured numbers"), so HEAD is unambiguously the later intent.

One fact went the other way. The "What is missing" list is numbered **3,4,5,6**
in the merge base and on the incoming side (incoming did not touch it); HEAD's
reflow renumbered it to **1,2,3,4**, producing a duplicate 1./2. and breaking the
prose cross-references further down the ticket ("What is missing item 2",
"item 4 exist already", "item 1 is therefore satisfied"). Per §2e's per-fact
rule I kept HEAD's body and restored the incoming/base numbering for those four
list items only. No content was invented — the restored values are present on the
incoming side.

## Incoming changes preserved

Verified with `git diff <CHERRY_PICK_HEAD> -- <path>` against the staged tree
after resolution. Nothing was discarded; the BUG-1301 precedence exception was
not needed and no hunk was dropped under it.

- request-119dd4af, request-3bc4b835, request-439cd0c8, request-78370159,
  request-909e42f8 — bodies are byte-identical to incoming. The entire residual
  diff is 2–3 frontmatter lines (`updated_at`, `status`, `bundled_in`,
  `last_field_updated`), i.e. exactly the reconcile bookkeeping HEAD advanced.

- comment-48c75d2e, comment-c74424ff — the only line removed relative to incoming
  is `updated_at`; every other change is an addition. Both incoming files are
  contained verbatim in the resolution.

- bundle-8eef3846, request-13a5e206 — the only lines removed relative to incoming
  are pre-reconcile lifecycle scalars (`status: reconciling`, the earlier
  `updated_at`/`completed_at`/`last_field_updated`, and the `working_sha`-only
  commit records now replaced by entries carrying the resolved `main_sha`).
  No authored body content dropped.

- request-6893f6ea — every section incoming added is present in the resolution:
  `## What has changed under this ticket since it was written`,
  `## Answers to the open questions (2026-08-31)`, Q1, Q2, Q3, Q4, and the
  supporting references (`writeKnowledgeShim`, `kb/knowledge_bases.json`,
  `stub-embedder`, `deploy.yml`) — confirmed present, in HEAD's later revised
  wording. The only incoming text not carried forward is the superseded 1.9 MiB
  size projection, replaced by the measured figures described above.

## Flagged for post-merge review

The auto-enrichment marked every file "intent unknown on one or both sides —
flag for post-merge review". Two worth an operator's eye:

1. `request-6893f6ea.md` — HEAD's editor round trip reflowed the whole body from
   hard-wrapped to long lines and dropped a `~~strikethrough~~` in Open Questions.
   That is presentation churn, not intent, but it is why this file's diff is large.
2. `bundle-8eef3846.md` / `request-13a5e206.md` — resolved toward HEAD's terminal
   `free_and_reconciled` + `result: pass` state. If the outer run expects these
   tickets to re-enter `reconciling`, that transition must come from the workflow,
   not from this cherry-pick.
