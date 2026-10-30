---
uid: report-d50f244b
id: REPORT-5522
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T09:01:49.136473+00:00'
updated_at: '2026-09-29T09:01:49.136473+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/doc-721a48c9.md` — UU, intent/bookkeeping doc ticket
  (rule 2e: per-fact composition, both sides applied where disjoint).
  Conflict region was frontmatter-only; the body addition merged cleanly.
  - **Ours** (`e553346f62`, 2026-09-11): metadata-only change —
    `doc_kind: architecture → system_kb`, `updated_at: 2026-09-11T09:33:38Z`,
    `last_field_updated: doc_kind`.
  - **Theirs** (`c521175d72`, 2026-09-02): appended the "Session lessons —
    2026-09-02 (first client-shaped session, [[CHAT-35]])" section
    (lessons D–G), `updated_at: 2026-09-02T20:51:42Z`,
    `last_field_updated: body`.
  - **Resolution**: union. Kept the incoming body section in full; kept
    HEAD's `doc_kind: system_kb`; kept HEAD's newer `updated_at`
    (2026-09-11) so the timestamp does not regress; paired
    `last_field_updated: doc_kind` with that timestamp, since the
    2026-09-11 change was the doc_kind edit. The two sides touched
    disjoint facts (body vs. doc_kind), so no per-fact conflict arose —
    only the derived `updated_at`/`last_field_updated` pair needed a
    single coherent choice.
  - Staged with `git add --sparse` (path is outside the sparse-checkout
    cone on this resync branch, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/doc-721a48c9.md`: confirmed against
  `git show c521175d72 -- <path>`. All 81 lines of incoming body content
  are present in the staged blob — "## Session lessons — 2026-09-02"
  plus subsections "### D. Never place text without knowing what it sits
  on", "### E. Centred body copy is a default, not a decision",
  "### F. An image has a role: backdrop or subject", and
  "### G. Reporting a capability as missing is a design failure with a
  client cost". No conflict markers remain. No hunks were dropped; the
  BUG-1301 precedence exception was not invoked.

`git status --porcelain` shows a single `M ` line for the file and no
conflict-class entries. CHERRY_PICK_HEAD (c521175d72) left intact for the
next workflow step.
