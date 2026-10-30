---
uid: report-5f26c646
id: REPORT-5426
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T02:34:40.043720+00:00'
updated_at: '2026-09-29T02:34:40.043720+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — class **UU**, intent/bookkeeping
  ticket (`request-*`), rule **STEP 2e** (per-fact composition, later-positioned
  intent wins on genuinely competing facts).

  Path is outside the sparse-checkout cone (`git sparse-checkout list` =
  `/*`, `!/.xgd/tickets/`, `!/.xgd/tickets/**`), so the conflict existed only
  in the index with no working-tree markers — resolved via
  `git update-index --cacheinfo` to the ours-side blob
  (`b4342d0ddc9f5d1ce0a150d02eedf2e944364dc3`), then re-set the
  `skip-worktree` bit to match the other entries under `.xgd/tickets/hot/`
  (`git ls-files -v` shows `S` for that path, consistent with its siblings).

  Per-fact composition:
  - **`updated_at`** — both sides changed it. Genuine conflict; later intent
    wins. Ours `2026-09-09T21:32:50.386750+00:00` > theirs
    `2026-09-01T01:30:30.141195+00:00` → ours.
  - **`last_field_updated`** — both sides changed it (ours `status`, theirs
    `body`). Genuine conflict; same later-intent rule → ours (`status`).
  - **`status`** — ours only (`free_coding` → `bundled`). Non-overlapping → kept.
  - **`fields.commits`** (two working SHAs), **`fields.version: 0.2.29`**,
    **`fields.bundled_in: bundle-87be4669`** — ours only, absent on theirs.
    Non-overlapping additions → kept.
  - **Body: trailing `-` line** — theirs' sole body change. Already present
    verbatim in ours → no loss.
  - **Body: closing section "Note: the account/business split came after this
    ticket"** — ours only. Non-overlapping addition → kept.

  Net effect: ours is a strict superset of theirs on every fact where the two
  differ, so the ours-side blob *is* the composed resolution. No content from
  either side was discarded.

## Incoming changes preserved

Incoming commit `14ad649903` ("xgd(ticket): update request request-3bc4b835",
2026-08-31) touched exactly one file, and it is not a code/implementation file —
it is an intent ticket. Verified against `git show 14ad6499 -- <path>`:

- Body change (`+\n+-` appended after the "Not in scope" paragraph): **present**
  in the staged resolution — confirmed by reading the staged blob
  (`git show :.xgd/tickets/hot/request-3bc4b835.md`), which contains the `-`
  line followed by the later-added note section.
- Metadata changes (`updated_at`, `last_field_updated`): **intentionally
  superseded** under STEP 2e's per-fact later-intent rule, not dropped by
  accident. Both are single-valued bookkeeping facts that both sides rewrote;
  the ours side carries the strictly later value from the same ticket's own
  ledger. Taking theirs would have regressed `status` from `bundled` back to
  `free_coding` and dropped `fields.commits` / `version` / `bundled_in`, which
  theirs never had.

No hunk was dropped under the BUG-1301 precedence exception. No test function
on either side of this conflict was deleted. No code file was involved.

Note for post-merge review (per the conflict-intent metadata, which reported
intent as unknown on both sides — both commit subjects are the generic
`xgd(ticket): update request request-3bc4b835`): because the resolution equals
HEAD exactly, this cherry-pick will produce an empty staged diff. That is the
expected outcome — the incoming edit is an ancestor-in-effect of what HEAD
already records. Finalize should detect the clean staged diff and skip the
commit; this step deliberately did not call `--continue`/`--skip`/`--quit`/
`--abort`, and `CHERRY_PICK_HEAD` (`14ad649903`) is still in place.
