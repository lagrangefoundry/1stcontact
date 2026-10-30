---
uid: report-d71e621b
id: REPORT-4605
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T01:06:14.000399+00:00'
updated_at: '2026-09-21T01:06:14.000399+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/doc-e70ef718.md` — **AA** (both added), outside the sparse-checkout cone (DOC-986 §2/§4.1), so resolved index-only via `git checkout --ours` + `git add --sparse`. Classified under §2e (intent/bookkeeping ticket, `type: doc`); rule applied: **one side is a strict superset — keep the superset**, which also agrees with the enrichment's later-`updated_at` rule.

### Why ours

The two ledgers make the intent unambiguous:

- Incoming `89e17d7344` (2026-08-30 17:50) — *"content edit: correct 6.3 — the corpus was seed material for testing, never a curation policy; cite DOC-39 for what the KB should hold"*.
- HEAD `fcf96a0a71` — **the identical operation**, same commit message, producing the identical blob `7392b7b436`. The incoming edit is therefore already integrated into this branch.
- HEAD `93713dfb2a` (2026-08-31 12:42) — a strictly later, structural change layered on top: *"field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)"*.

HEAD is thus a strict superset: incoming's content edit **plus** the later documented `system_kb` retirement. Taking theirs would have resurrected `system_kb: true` and silently reverted the DOC-39 §3.3 retirement — discarding a legitimate later decision. No fact was changed differently on both sides, so no per-fact tiebreak was needed.

## Incoming changes preserved

Confirmed. `git diff 89e17d7344:<path> :<path>` yields **only** three frontmatter lines — exactly the fields `93713dfb2a` intentionally changed:

```
-updated_at: '2026-08-31T00:50:27.937839+00:00'
+updated_at: '2026-08-31T19:42:51.706514+00:00'
-last_field_updated: body
+last_field_updated: system_kb
-  system_kb: true
```

The 23KB document body — the entire payload of the incoming content edit, including the corrected §6.3 — is byte-identical between the incoming commit and the staged result. Nothing from the incoming developer commit was discarded.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked. No test files were involved.

## Staging state

`git status --porcelain` is empty; conflict classes cleared. The staged blob (`7d8369d7d6`) equals HEAD's blob, so this resolution leaves no net change from HEAD — expected, since the incoming patch was already integrated via `fcf96a0a71`. Per instructions, `--skip`/`--continue` were NOT invoked; `CHERRY_PICK_HEAD` remains present for the finalize step.
