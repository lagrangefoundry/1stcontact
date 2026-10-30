---
uid: report-533187bb
id: REPORT-4881
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T22:59:57.771267+00:00'
updated_at: '2026-09-23T22:59:57.771267+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/doc-721a48c9.md` (DOC-17, "Design Lessons Log") — **UU**, doc ticket → rule **2e** (intent/bookkeeping ticket), applied **per fact**, not per file.

  Three-stage analysis (`git show :1:/:2:/:3:`) showed the sides are almost entirely disjoint:

  - **base → ours (HEAD)**: a *single* line changed — `updated_at` bumped `2026-08-31T21:59:36` → `2026-09-11T09:33:38`. No body change, no field change (`last_field_updated: doc_kind` was already the base value). HEAD's commit is a content-free bookkeeping bump.
  - **base → theirs (incoming `c521175d72`)**: the substantive edit — appended the whole `## Session lessons — 2026-09-02 (first client-shaped session, [[CHAT-35]])` section (subsections D/E/F/G, ~80 lines), set `last_field_updated: body`, and bumped `updated_at` to `2026-09-02T20:51:42`.

  Because the body append and `last_field_updated` were theirs-only relative to base, git auto-merged both; the only line git flagged with markers was `updated_at`.

  Resolution applied:
  - **body append (D/E/F/G sections)** — incoming only → **kept** (auto-merged).
  - **`last_field_updated: body`** — incoming only → **kept** (auto-merged).
  - **`updated_at`** — the sole genuinely conflicting fact → took the **later** value, HEAD's `2026-09-11T09:33:38`. Rationale: the enrichment rule for this file ("intent unknown on one or both sides; take the more recent commit by timestamp") applied per-fact rather than wholesale, since taking HEAD wholesale would have silently discarded ~80 lines of developer content (the exact failure BUG-1030 warns against). Keeping the later timestamp also preserves monotonicity of the store's own bookkeeping — reverting to `2026-09-02` would record a backwards step on a branch that already has `2026-09-11`.

  **Flagged for post-merge review** per the enrichment rule: `updated_at` (`2026-09-11`) is now paired with `last_field_updated: body` (which describes the incoming `2026-09-02` edit). This is a derived-metadata mismatch only — no content is affected, and the next `xgd ticket update` on DOC-17 will overwrite both fields. Worth noting that `last_field_updated` was already stale on the HEAD side too: HEAD's `2026-09-11` bump did not change `doc_kind` either, yet carried `last_field_updated: doc_kind`.

No other conflicted paths. The untracked `.xgd/tickets/cold/*` entries are pre-existing in this worktree and unrelated to this cherry-pick; they were left untouched.

## Incoming changes preserved

Verified against `git show c521175d7230a5e34653ebc5dbf248284d0965dd -- .xgd/tickets/hot/doc-721a48c9.md` and by direct diff of the resolved working file against stage 3 (`:3:`):

- `diff theirs.md <resolved>` yields **exactly one hunk**: the `updated_at` line. Every other byte of the incoming version is present verbatim.
- All four incoming subsections confirmed present in the resolved file: `## Session lessons — 2026-09-02` (L79), `### D. Never place text without knowing what it sits on` (L86), `### E. Centred body copy is a default, not a decision` (L103), `### F. An image has a role: backdrop or subject` (L116), `### G. Reporting a capability as missing is a design failure with a client cost` (L143).
- `last_field_updated: body` (incoming's value) confirmed in the resolved frontmatter.
- Zero conflict markers remain (`grep -c '^<<<<<<<\|^=======\|^>>>>>>>'` → 0).

No hunks were dropped. The BUG-1301 precedence exception was not invoked — no deletions, no test files, and no code files were involved in this conflict.
