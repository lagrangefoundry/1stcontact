---
uid: report-fa14881e
id: REPORT-4597
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T00:42:48.647793+00:00'
updated_at: '2026-09-21T00:42:48.647793+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/doc-4866a486.md` — class **AA** (both added), intent/doc
  ticket (§2b + §2d/2e composition). Conflict was confined to the YAML
  frontmatter; the two document bodies are byte-identical (184 lines, verified
  by diff). Resolved by **composing both sides' operations**, which yields the
  HEAD content exactly.

  The two sides perform *different* operations, not competing edits on the same
  fact — established from the intent ledger (`xgd ticket history doc-4866a486`),
  not from a raw `updated_at` comparison (BUG-1030):

  - **Incoming** `b629bf6ab8` (2026-08-26 16:40 -0700): `last_field_updated: body`
    — a body edit. It carried the then-current `system_kb: true` along untouched;
    it did not author that field.
  - **HEAD** `b10602cef9` (2026-08-31 12:42 -0700): commit message
    *"field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)"*
    — a deliberate, documented schema migration that unset `system_kb`.

  Composition = incoming's body (already present on HEAD, identical bytes, via
  `963c1f1b9d`) + HEAD's field retirement. The auto-enrichment's fallback rule
  ("take the more recent commit by timestamp") independently points the same way:
  HEAD's contributing commit is 5 days newer.

  File staged with `git add --sparse` — `.xgd/tickets/` is outside the
  sparse-checkout cone on this resync branch (DOC-986 §2/§4.1), so the conflict
  existed only in the index.

## Incoming changes preserved

- `.xgd/tickets/hot/doc-4866a486.md` — **preserved.** The incoming commit's
  entire substantive contribution is its document body; diffing
  `git show b629bf6ab8:<path>` against the staged blob from
  `# Reference Capture Model` onward reports zero differences across all 184
  lines. No developer prose was discarded.

  One incoming frontmatter line is intentionally absent: `system_kb: true`.
  This is the BUG-1301 precedence case, not a resolution shortcut — the field
  was removed by `b10602cef9`, a HEAD-side commit already integrated into this
  resync branch, whose own commit message documents it as a schema migration
  retiring the boolean in favour of `doc_kind` per DOC-39 §3.3. Resurrecting it
  would re-introduce a field the schema no longer recognises. The incoming
  commit never edited that field (its `last_field_updated` is `body`), so
  dropping it discards no incoming intent.

## Staging state

`git status --porcelain` is empty; no UU/AA/DU/UD lines remain.
`git diff --cached --stat HEAD` is empty — the composed resolution equals HEAD,
because the incoming body already landed on this branch via `963c1f1b9d`.
Per STEP 4, `--skip` was **not** invoked; CHERRY_PICK_HEAD
(`b629bf6ab83cec9a25d8c1786a1334e787b96aaf`) remains present for the finalize
step, which will detect the clean staged diff and skip the commit itself.
