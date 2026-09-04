---
uid: report-6a78b235
id: REPORT-3445
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T01:12:58.735896+00:00'
updated_at: '2026-09-04T01:12:58.735896+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

Cherry-pick: `f20ff760fc2f3e417397e318539aa406c7b5ff87` — _xgd(ticket): update request request-6893f6ea_

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping ticket (kind `request`, REQ-158). Rule **2e**, "one side is a strict superset of the other → keep the superset", plus the per-fact timeline rule for the single genuinely contested field. Resolved to the OURS blob `ccbacba4ccf1f11f29a4e8585bf4d208a0196bd0`.

  Conflict was index-only — `.xgd/tickets/` is outside the sparse-checkout cone on this reconcile branch (DOC-986 §2/§4.1), so there were no working-tree markers. Staged with `git checkout --ours` + `git add --sparse`.

## Why ours, per fact

Base blob `72476a9ac8`. Base→theirs touched **frontmatter only** — zero body hunks. Base→ours touched the same frontmatter fields *and* rewrote the body. Fact-by-fact:

| fact | theirs (incoming, free_coded) | ours (HEAD) | resolution |
|---|---|---|---|
| `last_field_updated` | `status` | `status` | identical |
| `fields.commits[0].working_sha` | `27450010586c65b293b2ad5cc6243815133a17be` | same | identical |
| `fields.version` | `0.2.27` | `0.2.27` | identical |
| `status` | `free_coded` | `bundled` | **ours** — later fact |
| `updated_at` | `2026-09-01T01:22:19Z` | `2026-09-02T17:48:27Z` | **ours** — later fact |
| `fields.bundled_in` | absent | `bundle-203b1dc2` | **ours** — ours-only addition |
| body (§"What has changed…", §"Answers to the open questions") | untouched | rewritten | **ours** — not contested |

`status` is the only field where the two sides state the same fact differently. Intent uid is unknown on at least one side, so `xgd working-timeline` was not available; the fallback in the enrichment metadata — more recent commit by timestamp — selects ours: HEAD-side `0ee399eeb5` (`seed_local_overlay`, 2026-09-02 10:50:05 -0700) postdates incoming `f20ff760fc` (2026-08-31 18:22:19 -0700) by ~2 days.

Two independent checks agree with the timestamp:
- `bundled` is the lifecycle successor of `free_coded`, not a competing alternative.
- `bundled_in: bundle-203b1dc2` is **this reconcile bundle**. Taking incoming's `free_coded` would un-bundle the ticket in the middle of its own bundle's reconcile run.

## Incoming changes preserved

Every change the incoming commit made is present in the resolved file. Its three substantive additions — `fields.commits` (with `working_sha 27450010586c…`), `fields.version: 0.2.27`, and `last_field_updated: status` — appear byte-identically in ours; the HEAD side had already recorded them. Its remaining two changes (`status`, `updated_at`) are superseded on the same fields by strictly later values, which is the 2e timeline rule operating as intended, not a discard.

No hunk was dropped under the BUG-1301 precedence exception; no code or test files were involved.

## Note on the net-zero staged diff

The staged tree is byte-identical to HEAD for this path, so this cherry-pick nets to no diff. This is the redundant case, not the discarded case (STEP 3's discriminator): the incoming commit's key changes are present *in HEAD*, having arrived by a different route. `--skip` was **not** called — the finalize step detects the clean staged diff and handles the commit.

## Flagged for post-merge review

Per the enrichment rule for unknown intent on one side, this file is flagged: a reviewer should confirm `status: bundled` / `bundled_in: bundle-203b1dc2` is the intended terminal state for REQ-158 after this bundle lands, rather than a rollback to `free_coded`.
