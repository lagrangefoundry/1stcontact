---
uid: report-c642e8d6
id: REPORT-4421
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:23:33.562986+00:00'
updated_at: '2026-09-19T12:23:33.562986+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` — **AA** (both added), index-only
  conflict (path outside the sparse-checkout cone, DOC-986 §2/§4.1; no
  working-tree markers existed). Rule **2b — one side is a strict superset,
  keep the superset**. Resolved to the **ours/HEAD** side via
  `git checkout --ours` + `git add --sparse`.

  Why ours, even though incoming is the `free_coded` side: the incoming
  commit `d1d63be` (`xgd(ticket): create request request-8b33a146`, 18 lines)
  is the bare ticket-creation stub — `title: Untitled`, `status: draft`,
  body `(new ticket)`, no `fields.commits`, no `fields.version`, no
  `fields.bundled_in`. The ours side (`ee0d0b9`, `seed_local_overlay`) is the
  same ticket after its full lifecycle: REQ-172 "Library detail: render
  documents inline, with an expand-to-modal reader", `status: bundled`,
  `bundled_in: bundle-8e1807f6`, `version: 0.2.37`, two recorded working
  SHAs, and ~8 KB of authored requirement body. Taking incoming would have
  reverted the ticket to Untitled/draft and destroyed the request's content —
  the superset test in 2b points unambiguously at ours.

## Incoming changes preserved

Confirmed. The incoming commit is a creation stub, so everything it
authored is the ticket's identity and initial field block. Every one of
those values is present in the resolved file, byte-identical:

- `uid: request-8b33a146` — present (line 2)
- `id: REQ-172` — present (line 3)
- `type: request` — present (line 4)
- `created_by: xgd` — present (line 6)
- `created_at: '2026-09-01T21:04:04.214569+00:00'` — present (line 7),
  unchanged from the incoming side
- `fields.auto_merge_back: true` — present (line 13)
- `fields.needs_review: false` — present (line 14)
- `fields.priority: medium` — present (line 15)

The only frontmatter keys that differ (`title`, `updated_at`,
`completed_at`, `last_field_updated`, `status`) are later evolution of the
same ticket along the HEAD timeline, not competing authorship of the same
fact — the create commit set them to their initial-state defaults and
later operations advanced them. No developer content was discarded; no
hunk was dropped under the BUG-1301 precedence exception (not applicable
here — nothing was deleted).

## Net diff

The staged result is identical to HEAD (`git diff --cached HEAD` is
empty), because the ticket-creation effect this commit carries had already
reached the bundle branch through the seed_local_overlay route and was then
developed further. Per STEP 4 this is not a failure and `--skip` was NOT
called — the staged tree is left for `cherry_pick_finalize_resolution`,
with `CHERRY_PICK_HEAD` (`d1d63be`) still present. STEP 3's discard guard
is satisfied above: the incoming commit's content is present in HEAD, not
absent.
