---
uid: report-9fba759e
id: REPORT-4645
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T05:21:12.928932+00:00'
updated_at: '2026-09-21T05:21:12.928932+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU**, intent/bookkeeping ticket
  (§2e). Resolved by keeping the strict superset (ours, blob `a8c14c1e`).

  Both sides are `xgd(ticket): update request request-439cd0c8` on REQ-163
  ("Ingestion: from a dropped file to an indexed `material` ticket"), so the
  enrichment's "intent unknown on one or both sides" note applies and the file
  is flagged for post-merge review below.

  The path is outside the sparse-checkout cone (DOC-986 §2/§4.1) — the conflict
  existed only in the index, with no working-tree markers — so it was resolved
  with `git checkout --ours` + `git add --sparse`, each issued as the sole
  content of its own call per BUG-1294.

## Incoming changes preserved

Verified against `git show 3a7f62aa53 -- .xgd/tickets/hot/request-439cd0c8.md`
(77 insertions, 9 deletions). Every section the incoming commit introduces is
present in the staged result:

- `## Decisions from implementation review` and all seven of its bold
  sub-decisions — **Routes**, **The index step is a seam**, **The image
  description takes a second LLM path**, **`description_status` is one mechanism
  for three degraded cases**, **PDF text extraction takes a dependency**,
  **Fetch is a plain `fetch`**, **The asset-promotion gate ships here,
  unrouted** — at lines 127–189 of the resolved file.
- All four acceptance bullets the incoming commit adds: the index seam called
  exactly once with a loud log when unwired; the degraded-description bullet
  selectable by predicate; the fetch guard refusing private/loopback/
  link-local/non-HTTPS with per-hop redirect re-validation; and the refusal to
  promote a non-`republishable` source.

No hunk was dropped under the BUG-1301 precedence exception — nothing needed it.

**Why ours is the superset, not a coin-flip.** Diffing the two sides with the
incoming commit's own `shadow` → `description` terminology rename normalised
away leaves only three kinds of content unique to the incoming side, none of
them a loss:

1. Stale frontmatter — `status: draft`, `last_field_updated: body`,
   `updated_at: 2026-08-31T22:08:03Z`. Ours carries the later state:
   `status: bundled`, `updated_at: 2026-09-09T21:32:49Z`, with `commits`,
   `version: 0.2.24` and `bundled_in: bundle-87be4669`.
2. Four lines differing only by the rename (`Description.` vs `Shadow.`,
   `re-description pass`, etc.) — ours uses the post-rename wording throughout.
3. The incoming side's two open questions, both of which ours **explicitly
   answers** in its `## Resolved after implementation (2026-08-31)` section:
   who owns vision resolves to lagrange-framework REQ-111 (not REQ-157), and
   re-describe resolves to the field split — automatic on `no_describer`/
   `failed`, operator-triggered on an older `description_model`.

Ours additionally contributes `## What was built, and where it departs from the
decisions above` (five departures), the bundle-size measurement table for
REQ-158, the evidence section, and a narrower remaining open question about DNS
resolution. Taking the superset therefore composes both sides' intent rather
than discarding either.

## Post-merge review flag

Per the enrichment's resolution rule, this file is flagged for post-merge
review: both sides share an identical commit subject, so intent was inferred
from ticket content and frontmatter timestamps rather than from distinct commit
narratives. The staged blob is byte-identical to HEAD (the resync branch already
carries `dc3a031572`, a later update to the same ticket that supersedes the
replayed `3a7f62aa53`), so the finalize step will see a clean staged diff.
