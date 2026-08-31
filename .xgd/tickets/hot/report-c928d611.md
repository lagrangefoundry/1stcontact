---
uid: report-c928d611
id: REPORT-2850
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:27:50.823011+00:00'
updated_at: '2026-08-31T08:27:50.823011+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-56d62b72.md` — **AA** (both added), intent/bookkeeping
  ticket (2e). Sparse-checkout path: conflict existed in the index only, no
  working-tree markers, so resolved with `git checkout --theirs` +
  `git add --sparse` (DOC-986 §2/§4.1).
  **Rule applied**: 2e "one side is a strict superset of the other → keep the
  superset". Diffing the two index stages (ours `1aed261a`, theirs `ee3a2b53`)
  showed byte-identical content apart from a single added line in `fields:` on
  the incoming side: `chat_comment: comment-94f08d2a`. No field was changed
  differently on the two sides, so no per-fact timeline arbitration was needed.
  Incoming (free_coded, `06dc1b1c`) is also authoritative here by the reconcile
  hard rule; superset and authority agree, so the resolution is unambiguous.

## Incoming changes preserved

- `.xgd/tickets/hot/request-56d62b72.md`: **preserved in full.** The staged blob
  is exactly the incoming stage-3 blob `ee3a2b53`. `git diff --cached HEAD` on
  the file shows a single hunk — the addition of
  `  chat_comment: comment-94f08d2a` — which is precisely the incoming commit's
  distinguishing content relative to the HEAD-side version. Nothing from the
  ours side was lost: every other line (frontmatter fields, commits ladder,
  version 0.0.168, the Goal/Behaviour/Acceptance/Docs sections, and the full
  "As-built" follow-up narrative) is byte-identical on both sides and is present
  in the resolved file.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No
code, test, or UAT files were involved in this conflict.
