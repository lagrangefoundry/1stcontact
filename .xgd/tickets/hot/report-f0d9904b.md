---
uid: report-f0d9904b
id: REPORT-4357
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T09:15:03.230146+00:00'
updated_at: '2026-09-19T09:15:03.230146+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/doc-e70ef718.md` — **AA** (both added), out-of-cone ticket path.
  Class: bookkeeping/doc ticket → **rule 2e** (per-fact judgment), reached via 2b.
  Resolved to the HEAD side; staged with `git add --sparse`.

  Per-fact composition:
  - **Body** — byte-identical on both sides. No conflict; incoming's content edit is
    already present (see below).
  - **`fields.system_kb`** — genuine per-fact conflict. Incoming carries
    `system_kb: true` (snapshot at `2026-08-31T00:50:27Z`). HEAD's later commit
    `93713dfb2a` (`2026-08-31T19:42:51Z`) carries the narrative
    _"field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)"_ —
    a deliberate, documented field retirement. HEAD is the later-positioned intent
    for this fact, so the field stays retired. Taking incoming here would have
    resurrected a field that was explicitly retired afterwards.
  - **`updated_at` / `last_field_updated`** — bookkeeping scalars slaved to the
    winning last operation; HEAD's values (`2026-08-31T19:42:51Z`,
    `last_field_updated: system_kb`) are internally consistent with the retirement.

## Incoming changes preserved

Incoming commit `89e17d73445d61fa09640d078b6bbf4ec089554a`:

    content edit: correct 6.3 — the corpus was seed material for testing,
    never a curation policy; cite DOC-39 for what the KB should hold

This change **is present in the resolved file**, having already reached HEAD by a
different route: HEAD-side commit `fcf96a0a71` (`2026-08-30 17:50:28 -0700`) carries
the byte-identical commit message and the identical content, landed via a
post-watermark sync. Verified in the resolved file:

- §6.3 "What is in it" at line 236
- line 252 — "As seed material it says only that this is what…" (the
  seed-material-not-curation-policy correction)
- line 255 — "What the system KB should actually hold is settled in [[DOC-39]] §3"
  (the DOC-39 citation)

No developer content was discarded. This is STEP 3's *redundant* case, not the
*discarded* case: the incoming commit's key changes are present in HEAD, so the
staged diff nets to no change vs HEAD. Per STEP 4 the file is staged and the
cherry-pick sequencer is left intact (`CHERRY_PICK_HEAD` still present) for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit. No `--skip`/`--continue`/`--abort` was issued.

No hunks were dropped under the BUG-1301 precedence exception; no test files were
involved in this conflict.
