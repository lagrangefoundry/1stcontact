---
uid: report-ff9774f4
id: REPORT-5526
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T09:37:53.611032+00:00'
updated_at: '2026-09-29T09:37:53.611032+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/doc-58cf04a4.md` (DOC-33, "The Consultation Playbook") — **UU**, doc-kind intent/bookkeeping ticket in the hot tier, outside the sparse-checkout cone (staged with `git add --sparse`). Applied the per-fact composition rule (§2e): the two sides touched disjoint facts, so **both** were applied rather than picking a winning file wholesale.
  - Incoming (`3a9e9beed8`, 2026-09-02, body edit): `caretaker` → `consultant` ×4, one added blank line after the frontmatter, `last_field_updated: doc_kind` → `body`. All applied.
  - HEAD (`61eb2db4c4`, 2026-09-11, metadata-only edit): `doc_kind: architecture` → `system_kb`. Retained. (Incoming's snapshot already carried `system_kb`, so the two sides agree on this field — no contention.)
  - `updated_at` was the **only** genuinely contended fact (both sides wrote it differently). Resolved per-fact to the later value, HEAD's `2026-09-11T09:33:30.694374+00:00`, over incoming's `2026-09-02T22:58:37.316768+00:00`.

    Rationale: the incoming timestamp predates the `doc_kind` write that the resolved file already contains. Stamping the older value would make the record advertise itself as older than its own content, which is exactly the input a downstream last-writer-wins sync uses — it would re-clobber the body rename on a later pass. Keeping the timestamp monotonic loses no content from either side.

  Flagged for post-merge review (per the enrichment rule for unknown intent on one/both sides): `last_field_updated: body` now sits alongside an `updated_at` that originated from the `doc_kind` write. That field correctly names the most recent *content* change being carried; the pairing is cosmetically inconsistent but not lossy. Worth a glance if any tooling reconstructs edit history from those two fields jointly.

## Incoming changes preserved

Verified against the **staged blob** (`git show :<path>`), not just the worktree:

- All four `consultant` renames present at lines 403, 407, 438, 695; zero `caretaker` occurrences remain.
- `last_field_updated: body` present (incoming's value).
- No conflict markers remain (`<<<<<<<` / `=======` / `>>>>>>>` / `|||||||` all absent).
- `git diff --cached CHERRY_PICK_HEAD -- <path>` reduces to a **single** hunk: the `updated_at` line. Every other byte of the resolved file is identical to the incoming commit, which confirms no incoming hunk was dropped or partially applied.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked. No test files were involved.

`git status --porcelain` reports `M  .xgd/tickets/hot/doc-58cf04a4.md` — staged, no conflict classes. `CHERRY_PICK_HEAD` (`3a9e9beed8`) left intact for the next workflow step; no `--continue`/`--skip`/`--quit`/`--abort` issued.
