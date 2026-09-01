---
uid: report-0f2a6365
id: REPORT-3249
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T22:52:15.295063+00:00'
updated_at: '2026-09-01T22:52:15.295063+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-c49667b3.md` — class **AA** (both added), doc ticket
  (DOC-29 "Test Asset Catalogue"). Rule applied: 2b/2e + enrichment rule
  ("intent unknown on one or both sides — take the more recent commit by
  timestamp"). Incoming (3dc855fab0, `updated_at` 2026-08-31T19:43:16Z) is
  later than HEAD side (`updated_at` 2026-08-16T01:19:58Z). Resolved with
  `git checkout --theirs`.

  Full diff between the two sides was exactly two lines:
  - `updated_at` bumped 2026-08-16 → 2026-08-31
  - `fields.system_kb: true` removed

  Every other line — the entire Section 1 architecture narrative and the
  Section 2 registry table — is byte-identical on both sides, so taking
  theirs wholesale discards nothing from the HEAD side except the field the
  incoming commit exists to retire. Not a superset/subset judgement call:
  verified by direct `diff` of index stages `:2:` and `:3:`.

## Incoming changes preserved

Incoming commit 3dc855fab0 declares its intent in the commit body:
"field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)".

- The staged blob is `a324de231e0816fb2c003c8fd435d4acb7d69332`, which is
  byte-identical to `3dc855fab0:.xgd/tickets/hot/doc-c49667b3.md` (verified
  via `git rev-parse` on both). The incoming version is preserved exactly as
  authored.
- `fields.system_kb` is absent from the resolved file; `fields.doc_kind:
  test_asset_catalogue` is retained. This is precisely the declared
  retirement, and it is the only substantive change the incoming commit makes.
- Staged diff vs HEAD is non-empty (the two lines above), so this is not a
  redundant-commit case.

No hunks were dropped; the BUG-1301 precedence exception was not invoked.
No code, test, or UAT files were involved in this conflict.

Note on `last_field_updated: system_kb`: that frontmatter value is identical
on both sides and was not touched by the resolution. It is the incoming
commit's own record of which field it last acted on (the retirement), so it
is consistent with the resolved state, not a leftover.

CHERRY_PICK_HEAD left intact for cherry_pick_finalize_resolution.
