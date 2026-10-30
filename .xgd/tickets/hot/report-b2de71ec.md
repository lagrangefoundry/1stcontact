---
uid: report-b2de71ec
id: REPORT-5584
type: report
title: 'Resolve conflicts: request-8b33a146 (cherry-pick d413df84f4)'
created_by: xgd
created_at: '2026-09-29T18:00:05.890944+00:00'
updated_at: '2026-09-29T18:00:05.890944+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` — **UU** (sparse path, not materialized
  in the working tree). Resolved to **ours**
  (`git checkout --ours` + `git add --sparse`).

Cherry-pick: `d413df84f4` *xgd(ticket): update request request-8b33a146*
(author 2026-09-08 17:17 -0700). Retry count for this SHA: 1.

## Enrichment rule vs. actual adjudication

The auto-enrichment classified intent as unknown on one or both sides and
prescribed "take the more recent commit by timestamp." Here that rule and the
per-fact adjudication agree — ours is both newer and the genuine later
decision — so the flag is informational only.

## Conflicting facts (index three-way, `:1:`/`:2:`/`:3:`)

Bodies are byte-identical apart from ours adding a trailing newline. All
competition is in four frontmatter fields:

| field | base (`:1:`) | ours (`:2:`) | incoming (`:3:`) |
|---|---|---|---|
| `updated_at` | 2026-09-01T21:43:09Z | **2026-09-19T15:15:29Z** | 2026-09-09T00:17:23Z |
| `completed_at` | null | **2026-09-14T10:29:05Z** | null |
| `status` | `ready_to_reconcile` | **`free_and_reconciled`** | `bundled` |
| `fields.bundled_in` | (absent) | **`bundle-8e1807f6`** | `bundle-4efd33fe` |

## Why ours wins each fact

1. **Monotone lifecycle.** `ready_to_reconcile` → `bundled` →
   `free_and_reconciled` is one-way. Incoming's `bundled` is an upstream
   waypoint already represented by ours; taking it would roll the ticket back
   and reset `completed_at` to null. Nothing is discarded by keeping ours.

2. **Incoming has no subsequent intent.** `d413df84f4` is the *last* commit on
   the incoming side for this path (`git log d413df84f4 -- <path>`: the tip is
   d413df84f4, prior commits all 2026-09-01). There is no later incoming
   decision that ours could be overriding.

3. **`bundled_in`: the bundle replay test.** The two bundles are the recurring
   duplicate pair for this resync:
   - incoming's `bundle-4efd33fe` was created 2026-09-08 17:17 and
     **archived by xgd-working itself** the next day (`2ba6f5bf20`,
     2026-09-09 14:31) with every `reconcile_sha` null — abandoned.
   - ours' `bundle-8e1807f6` stayed live and went on to reconcile, with
     updates through 2026-09-25 (`ea3c75397a`).

   So the fact ours asserts points at the bundle that actually completed the
   work; incoming's points at a dead one.

## Net effect

`git diff --cached HEAD` is empty — the resolution reproduces HEAD exactly, so
finalize will skip the commit for this pick. Index is clean, no unmerged paths.

## Consistency with prior picks

This is the sixth pick in resync-377b581e hitting the same
`bundle-4efd33fe` (incoming) vs `bundle-8e1807f6` (ours) duplicate-bundle pair
— after request-01ea4eec, bug-3ade1af4, bug-93851fea (BUG-41), bug-034bf955
and one further request. Same four contested frontmatter facts, same
byte-identical bodies, same `--ours` outcome, same zero net change each time.
The pair covers every ticket in the bundle, so further picks in this resync are
expected to adjudicate identically.

## Post-merge review

No review needed beyond the enrichment's automatic flag. The resolution
introduces no new content; it preserves the already-reconciled state that main
holds and that the incoming commit predates.
