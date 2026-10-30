---
uid: report-2aea04f3
id: REPORT-5489
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T07:11:36.895646+00:00'
updated_at: '2026-09-29T07:11:36.895646+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` (REQ-172) — **UU**, class 2e
  (intent/bookkeeping ticket, `request-*`). Path is outside the
  sparse-checkout cone (DOC-986 §2/§4.1 — sparse patterns are
  `/*`, `!/.xgd/tickets/`, `!/.xgd/tickets/**`), so the conflict
  existed only in the index with no working-tree markers; resolved
  via `git update-index --cacheinfo` to the ours-side blob
  (`284e1e08f9`), then `git update-index --skip-worktree` to restore
  the sparse bit that `--cacheinfo` clears.

  **Rule applied.** Diffing the two stage blobs
  (`git diff 284e1e08f9 180dc007d3`) shows the **bodies are
  byte-identical** — the entire conflict is confined to frontmatter.
  Per 2e, resolved per-fact rather than by whole-file winner:

  | fact | ours (HEAD) | theirs (`4305ac944e`) | taken |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `free_coding` | ours |
  | `completed_at` | `2026-09-14T10:29:05` | `null` | ours |
  | `updated_at` | `2026-09-19T15:15:29` | `2026-09-01T21:33:14` | ours |
  | `last_field_updated` | `status` | `body` | ours |
  | `fields.commits` | 2 working SHAs | absent | ours |
  | `fields.version` | `0.2.37` | absent | ours |
  | `fields.bundled_in` | `bundle-8e1807f6` | absent | ours |
  | body (all sections) | — identical — | — identical — | either |

  Every contested fact resolves to ours: on each one the HEAD side is
  either strictly later in the intent timeline (three weeks: 09-19 vs
  09-01) or a strict superset (the three `fields.*` keys exist only on
  HEAD). There is no fact where the incoming side is later or carries
  content HEAD lacks, so no field is taken from theirs. This matches
  the auto-enriched resolution rule ("take the more recent commit by
  timestamp"), reached per-fact rather than wholesale.

  Flagged for post-merge review per the enrichment metadata, though
  the risk is nil in practice: the resolution is byte-identical to
  HEAD, so it introduces nothing to review.

## Incoming changes preserved

- `.xgd/tickets/hot/request-8b33a146.md` — **preserved in full.**
  `4305ac944e` is *"xgd(ticket): update request request-8b33a146"*,
  and `git show 4305ac944e --stat` reports its whole contribution as
  `83 insertions(+), 30 deletions(-)` in this one file — a body
  rewrite (the `text/*` row gaining JSON and XML; the new
  height-cap, `content_type` fallback, `markdownReady` repaint, HTML,
  SVG, teardown, missing-bytes and `markdown.js` re-export sections;
  the two-suite test plan). Every one of those paragraphs is present
  verbatim in the staged blob, because HEAD already contains that
  same body: the 09-01 body edit was carried forward as REQ-172
  progressed to `free_and_reconciled`, and `git diff` between the two
  stage blobs confirms zero body divergence.

  No hunk was dropped, so the BUG-1301 precedence exception does not
  apply and is not invoked. The only content NOT carried over is
  incoming's *frontmatter*, which is three weeks stale — taking it
  would roll REQ-172 back from `free_and_reconciled` to `free_coding`,
  null out `completed_at`, and discard the commit/version/bundle
  records. That is a per-fact loss to the incoming side under the 2e
  timeline rule, not a discard of developer code.

  Consequence for the next step: because the resolution equals HEAD
  exactly, `git diff --cached HEAD` is empty and this cherry-pick has
  no net effect. Per STEP 4 this is left alone — no `--skip` was
  called; the finalize step will detect the clean staged diff and
  skip the commit itself.

## Verification

- `git status --porcelain` — empty (no `UU`/`AA`/`DU`/`UD` remaining,
  no stray worktree modifications).
- `git ls-files -s .xgd/tickets/hot/request-8b33a146.md` — stage `0`,
  blob `284e1e08f9`, fully resolved.
- `git ls-files -v` — flag `S`, skip-worktree restored, so the sparse
  checkout is not left reporting the file as deleted.
- `CHERRY_PICK_HEAD` still present at `4305ac944e` — the in-progress
  cherry-pick was not continued, skipped, quit, or aborted.
