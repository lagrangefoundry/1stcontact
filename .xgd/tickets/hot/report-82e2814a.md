---
uid: report-82e2814a
id: REPORT-3091
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T21:45:17.002227+00:00'
updated_at: '2026-08-31T21:45:17.002227+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **AA** (both added), intent/bookkeeping
  ticket (`bug-*`). Rules **2b** ("one side is strictly a superset: keep the
  superset") and **2e** ("keep the superset; same field changed differently →
  later-positioned intent wins, per fact"). Resolved to the **HEAD (ours)** side.
  Path is outside the sparse-checkout cone (DOC-986 §2/§4.1) — the conflict
  existed only in the index with no working-tree markers, so it was resolved with
  `git checkout --ours` + `git add --sparse`.

### Why HEAD, not incoming

Both sides are the *same ticket* (BUG-39), not two independent creations — the
`uid`, `id`, `title` and `created_at` (`2026-08-24T22:25:21.810676+00:00`) are
byte-identical on both sides. The AA arises only because the sparse/overlay route
re-added the path on each branch.

The incoming commit `0d545fdd` (2026-08-24 15:25:21 -0700, `xgd(ticket): create
bug bug-23d1ec27`) is the ticket's **original draft creation**: 105 lines,
`status: draft`, `last_field_updated: created_at`, no `commits`/`version`/
`bundled_in` fields.

The HEAD side `9a853c57` (2026-08-31 12:21:41 -0700, `xgd(ticket):
seed_local_overlay bug bug-23d1ec27`) is that same ticket carried forward through
implementation: `updated_at` 2026-08-31, `status: bundled`, and the added fields
`chat_comment`, `commits` (`working_sha 759cd874…`), `version: 0.2.15`,
`story_points: 3`, and `bundled_in: bundle-8eef3846` — i.e. bundled into the very
intent this reconcile is replaying.

HEAD is a superset **section-wise**: it carries every section the incoming draft
has (Symptom, Root cause, Fix, Watch for, Acceptance criteria, Reproduce) plus
sections the draft never had (blast-radius paragraph, "Fix — as landed" with the
per-suite table, "### The evidence for this ticket", "## Out of scope — a second,
unrelated defect surfaced"). Where the two touch the *same* section, they are the
plan-stage vs landed-stage phrasing of one fact — "Fix" → "Fix — as landed",
"Watch for" → "Watch for — resolved", acceptance criteria → the same three
criteria marked ✅. Per 2e that is one fact edited on both sides, so the
later-positioned intent (2026-08-31) governs. No field or section exists on the
incoming side and is absent from HEAD.

The one piece of incoming-only *prose* is the blockquote of the workerd suite's
contract comment, which HEAD's rewrite deliberately replaced with a more precise
description of the same mechanism (`AnthropicAccumulator`,
`backends/api_tools.js:317`, `text_delta` / `input_json_delta`). Restoring it
would be reinstating text the later intent removed, so it was not carried over —
and 2e prohibits adding content not on either side.

## Incoming changes preserved

The incoming commit is a ticket-creation commit, not a code change — `git show
0d545fdd --stat` is a single file, 105 insertions, `.xgd/tickets/hot/bug-23d1ec27.md`.

Its entire effect (the ticket existing, with that uid/id/title/created_at and all
of its content) **is present in HEAD**, in a strictly more advanced state. This is
the "redundant — already landed through a different route" case described in
STEP 4 (BUG-1109/BUG-1122), not a STEP 3 discard: the incoming commit's key
changes are present in HEAD rather than absent from it. No developer code was
dropped; no code/implementation file was touched by this conflict.

Consequently the staged result nets to **no diff vs HEAD** (`git diff --cached
HEAD -- <path>` is empty). Per STEP 4 this is staged and exited @done as normal —
`git cherry-pick --skip` was NOT called, and CHERRY_PICK_HEAD is left in place for
`cherry_pick_finalize_resolution`.

No BUG-1301 precedence exception was invoked; no test function on either side was
deleted.

## Post-merge review flag

The auto-enrichment classified the incoming intent as unknown and asked that the
file be flagged for post-merge review. Flagging here: `bug-23d1ec27.md` resolved
wholly to the HEAD side. The lineage evidence above (identical `created_at`,
HEAD's `bundled_in: bundle-8eef3846`) makes this a low-risk resolution, but it is
recorded for completeness.
